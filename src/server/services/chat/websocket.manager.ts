import { WebSocket } from 'ws';
import { ChatMessage, ChatEvent, WebSocketUser } from '../../types/chat.types';
import { saveMessage, getChatHistory } from '../chat/chat.services';

class ChatManager {
    private connectedUsers: Map<number, WebSocketUser> = new Map();
    private rooms: Map<string, Set<number>> = new Map();

    addUser(userId: number, username: string, socket: WebSocket): void {
        const user: WebSocketUser = {
            id: userId,
            username,
            socket
        };
        
        this.connectedUsers.set(userId, user);
        
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
        if (user && user.current_room) {
            this.leaveRoom(userId, user.current_room);
        }
        this.connectedUsers.delete(userId);
    }

    async handleMessage(userId: number, event: ChatEvent): Promise<void> {
        const user = this.connectedUsers.get(userId);
        if (!user) return;

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

        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, new Set());
        }
        
        this.rooms.get(roomId)!.add(userId);
        user.current_room = roomId;

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
        if (!user || !user.current_room) return;

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

        this.broadcastToRoom(user.current_room, {
            type: 'message',
            data: savedMessage
        });
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

    sendToUser(userId: number, event: ChatEvent): void {
        const user = this.connectedUsers.get(userId);
        if (user && user.socket.readyState === WebSocket.OPEN) {
            user.socket.send(JSON.stringify(event));
        }
    }

    sendError(socket: WebSocket, message: string): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'error',
                data: { message }
            }));
        }
    }

    getConnectedUsersCount(): number {
        return this.connectedUsers.size;
    }

    getRoomUsersCount(roomId: string): number {
        return this.rooms.get(roomId)?.size || 0;
    }
}

export const chatManager = new ChatManager();
