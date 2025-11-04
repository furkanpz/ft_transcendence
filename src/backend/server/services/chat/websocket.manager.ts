import { WebSocket } from 'ws';
import { ChatMessage, ChatEvent, WebSocketUser, GameInvite } from '../../types/chat.types';
import { saveMessage, getChatHistory, canAccessRoom } from '../chat/chat.services';
import chatLimiter from '../../helpers/chat.limiter';
import { gameManager } from '../game/game.manager';
import { GameType } from '../../types/game.types';

class ChatManager {
    private connectedUsers: Map<number, WebSocketUser> = new Map();
    private rooms: Map<string, Set<number>> = new Map();
    private gameInvites: Map<string, GameInvite> = new Map();

    addUser(userId: number, username: string, socket: WebSocket): void {
        const user: WebSocketUser = {
            id: userId,
            username,
            socket
        };
        
        this.connectedUsers.set(userId, user);
        
        this.broadcastToAll({
            type: 'user_joined',
            data: { username: username, user_id: userId }
        }, userId);
        
        socket.on('close', () => {
            this.removeUser(userId);
        });
        
        socket.on('message', async (data: string) => {
        try {
            const event: ChatEvent = JSON.parse(data);
            await this.handleMessage(userId, event);
        } catch (error) {
            console.error('Error parsing message:', error);
            this.sendError(socket, 'Invalid message format');
        }
     });
    }

    removeUser(userId: number): void {
        const user = this.connectedUsers.get(userId);
        if (user) {
            this.broadcastToAll({
                type: 'user_left',
                data: { username: user.username, user_id: userId }
            }, userId);
            
            if (user.current_room) {
                this.leaveRoom(userId, user.current_room);
            }
            this.connectedUsers.delete(userId);
        }
    }

    async handleMessage(userId: number, event: ChatEvent): Promise<void> {
        const user = this.connectedUsers.get(userId);
        if (!user)
            return;
        if (!chatLimiter(userId))
        {   
            this.sendError(user.socket, 'Rate limit exceeded. Please Slow Down!');
            return;
        }
        switch (event.type) {
            case 'join_room':
                await this.joinRoom(userId, event.data.room_id);
                break;
            case 'leave_room':
                this.leaveRoom(userId, event.data.room_id);
                break;
            case 'message':
                await this.broadcastMessage(userId, event.data);
                break;
            case 'get_online_users':
                this.sendOnlineUsers(userId);
                break;
            case 'get_offline_messages':
                break;
            case 'game_invite':
                await this.handleGameInvite(userId, event.data.toUserId, event.data.toUsername);
                break;
            case 'game_invite_response':
                await this.handleGameInviteResponse(userId, event.data.inviteId, event.data.accept);
                break;
            default:
                this.sendError(user.socket, 'Unknown event type');
        }
    }

    async joinRoom(userId: number, roomId: string): Promise<void> {
        const user = this.connectedUsers.get(userId);
        if (!user) return;

        if (user.current_room) {
            this.leaveRoom(userId, user.current_room);
        }

        const allowed = await canAccessRoom(userId, roomId);
        if (!allowed) {
            this.sendError(user.socket, 'Access denied for this room');
            return;
        }

        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        
        this.rooms.get(roomId)!.add(userId);
        user.current_room = roomId;
        
        console.log(`✅ User ${user.username} joined room ${roomId}. Room now has ${this.rooms.get(roomId)?.size} users`);
        
        const history = await getChatHistory(roomId);
        this.sendToUser(userId, {
            type: 'chat_history',
            data: { room_id: roomId, messages: history }
        });

        this.broadcastToRoom(roomId, {
            type: 'user_joined',
            data: { user_id: userId, username: user.username, room_id: roomId }
        }, userId);
    }

    leaveRoom(userId: number, roomId: string): void {
        const user = this.connectedUsers.get(userId);
        if (!user) return;

        const room = this.rooms.get(roomId);
        if (room) {
            room.delete(userId);
            if (room.size === 0) {
                this.rooms.delete(roomId);
            }
        }

        user.current_room = undefined;

        this.broadcastToRoom(roomId, {
            type: 'user_left',
            data: { user_id: userId, username: user.username, room_id: roomId }
        });
    }

    async broadcastMessage(userId: number, messageData: any): Promise<void> {
        const user = this.connectedUsers.get(userId);
        if (!user || !user.current_room) {
            console.log(`❌ broadcastMessage failed: user=${userId}, current_room=${user?.current_room}`);
            return;
        }

        const allowed = await canAccessRoom(userId, user.current_room);
        if (!allowed) {
            this.sendError(user.socket, 'Access denied for this room');
            return;
        }

        const message: ChatMessage = {
            user_id: userId,
            username: user.username,
            message: messageData.message,
            room_id: user.current_room,
            message_type: 'text',
            timestamp: new Date()
        };

        const savedMessage = await saveMessage(message);
        if (!savedMessage) {
            this.sendError(user.socket, 'Failed to save message');
            return;
        }

        console.log(`📨 Broadcasting message to room ${user.current_room}, users in room:`, this.rooms.get(user.current_room)?.size);
        
        this.broadcastToRoom(user.current_room, {
            type: 'message',
            data: savedMessage
        }, userId);
    }

    broadcastToRoom(roomId: string, event: ChatEvent, excludeUserId?: number): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        room.forEach(userId => {
            if (userId !== excludeUserId) {
                this.sendToUser(userId, event);
            }
        });
    }

    broadcastToAll(event: ChatEvent, excludeUserId?: number): void {
        this.connectedUsers.forEach((user, userId) => {
            if (userId !== excludeUserId) {
                this.sendToUser(userId, event);
            }
        });
    }

    sendToUser(userId: number, event: ChatEvent): void {
        const user = this.connectedUsers.get(userId);
        if (user && user.socket.readyState === WebSocket.OPEN) {
            user.socket.send(JSON.stringify(event));
        }
    }

    sendError(socket: WebSocket, message: string): void {
    try {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'error',
                data: { message }
            }));
        }}catch (err) {
        console.error('sendError failed:', err);
    }
    }

    sendOnlineUsers(userId: number): void {
        const user = this.connectedUsers.get(userId);
        if (!user) return;

        const onlineUsernames = Array.from(this.connectedUsers.values()).map(u => u.username);
        this.sendToUser(userId, {
            type: 'online_users',
            data: { users: onlineUsernames }
        });
    }

    async handleGameInvite(fromUserId: number, toUserId: number, toUsername: string): Promise<void> {
        const fromUser = this.connectedUsers.get(fromUserId);
        const toUser = this.connectedUsers.get(toUserId);

        if (!fromUser) {
            console.error('Sender not found');
            return;
        }

        if (!toUser) {
            this.sendError(fromUser.socket, 'User is not online');
            return;
        }

        const inviteId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

        const invite: GameInvite = {
            inviteId,
            fromUserId,
            fromUsername: fromUser.username,
            toUserId,
            toUsername,
            timestamp: new Date(),
            status: 'pending'
        };

        this.gameInvites.set(inviteId, invite);

        setTimeout(() => {
            const inv = this.gameInvites.get(inviteId);
            if (inv && inv.status === 'pending') {
                inv.status = 'expired';
                this.sendToUser(fromUserId, {
                    type: 'game_invite_response',
                    data: { inviteId, accepted: false, expired: true, message: 'Invitation expired' }
                });
                this.gameInvites.delete(inviteId);
            }
        }, 30000);

        this.sendToUser(toUserId, {
            type: 'game_invite',
            data: {
                inviteId,
                fromUserId,
                fromUsername: fromUser.username,
                message: `${fromUser.username} invited you to play Pong!`
            }
        });

        this.sendToUser(fromUserId, {
            type: 'game_invite',
            data: {
                inviteId,
                sent: true,
                toUsername,
                message: `Game invitation sent to ${toUsername}`
            }
        });

        console.log(`Game invite ${inviteId}: ${fromUser.username} -> ${toUsername}`);
    }

    async handleGameInviteResponse(userId: number, inviteId: string, accept: boolean): Promise<void> {
        const invite = this.gameInvites.get(inviteId);

        if (!invite) {
            const user = this.connectedUsers.get(userId);
            if (user) {
                this.sendError(user.socket, 'Invitation not found or expired');
            }
            return;
        }

        if (invite.toUserId !== userId) {
            const user = this.connectedUsers.get(userId);
            if (user) {
                this.sendError(user.socket, 'Invalid invitation');
            }
            return;
        }

        if (invite.status !== 'pending') {
            const user = this.connectedUsers.get(userId);
            if (user) {
                this.sendError(user.socket, 'Invitation already processed');
            }
            return;
        }

        if (accept) {
            invite.status = 'accepted';

            const roomId = gameManager.createRoom([invite.fromUserId, invite.toUserId], GameType.Classic);
            invite.roomId = roomId;

            console.log(`Game invite accepted: ${inviteId}, room created: ${roomId}`);

            this.sendToUser(invite.fromUserId, {
                type: 'game_starting',
                data: {
                    inviteId,
                    roomId,
                    opponentId: invite.toUserId,
                    opponentUsername: invite.toUsername,
                    message: `${invite.toUsername} accepted your invitation!`
                }
            });

            this.sendToUser(invite.toUserId, {
                type: 'game_starting',
                data: {
                    inviteId,
                    roomId,
                    opponentId: invite.fromUserId,
                    opponentUsername: invite.fromUsername,
                    message: 'Game starting!'
                }
            });
        } else {
            invite.status = 'declined';

            this.sendToUser(invite.fromUserId, {
                type: 'game_invite_response',
                data: {
                    inviteId,
                    accepted: false,
                    message: `${invite.toUsername} declined your invitation`
                }
            });

            console.log(`Game invite declined: ${inviteId}`);
        }

        setTimeout(() => {
            this.gameInvites.delete(inviteId);
        }, 5000);
    }

    getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }

    getRoomUsersCount(roomId: string): number {
        return this.rooms.get(roomId)?.size || 0;
    }
}

export const chatManager = new ChatManager();
