import { getDb } from '../../db/db.get';
import { ChatMessage, ChatRoom } from '../../types/chat.types';
import * as userServices from '../user/user.services';

export async function createChatRoom(name: string, createdBy: number, isPrivate: boolean = false): Promise<ChatRoom | null> {
    const db = await getDb();
    const roomId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
    
    try {
        await db.run(
            'INSERT INTO ft_chat_rooms (id, name, created_by, is_private) VALUES (?, ?, ?, ?)',
            roomId, name, createdBy, isPrivate
        );
        await db.run(
            'INSERT INTO ft_chat_participants (room_id, user_id) VALUES (?, ?)',
            roomId, createdBy
        );
        
        return {
            id: roomId,
            name,
            created_by: createdBy,
            created_at: new Date(),
            is_private: isPrivate,
            participants: [createdBy]
        };
    } catch (error) {
        console.error('Error creating chat room:', error);
        return null;
    }
}

export async function joinRoom(roomId: string, userId: number): Promise<boolean> {
    const db = await getDb();
    
    try {
        await db.run(
            'INSERT OR IGNORE INTO ft_chat_participants (room_id, user_id) VALUES (?, ?)',
            roomId, userId
        );
        return true;
    } catch (error) {
        return false;
    }
}

export async function getRoom(roomId: string) : Promise<boolean> {
    const db = await getDb();
    const chat = await db.get("SELECT * FROM ft_chat_rooms WHERE id = ?", roomId) as ChatRoom | undefined;
    if (chat == undefined)
        return false;
    return true;
}

export async function getRoomInfo(roomId: string): Promise<{ id: string, name: string, is_private: boolean } | null> {
    const db = await getDb();
    const row = await db.get('SELECT id, name, is_private FROM ft_chat_rooms WHERE id = ?', roomId) as any;
    if (!row) return null;
    return { id: row.id, name: row.name, is_private: !!row.is_private };
}

export async function getRoomWithName(roomName: string) : Promise<ChatRoom | null> {
    const db = await getDb();
    const chat = await db.get("SELECT * FROM ft_chat_rooms WHERE name = ?", roomName) as any;
    if (chat == undefined)
        return null;
    return {
        id: chat.id,
        name: chat.name,
        created_by: chat.created_by,
        created_at: new Date(chat.created_at),
        is_private: chat.is_private,
        participants: []
    };
}

export async function leaveRoom(roomId: string, userId: number): Promise<boolean> {
    const db = await getDb();
    
    try {
        await db.run(
            'DELETE FROM ft_chat_participants WHERE room_id = ? AND user_id = ?',
            roomId, userId
        );
        return true;
    } catch (error) {
        console.error('Error leaving room:', error);
        return false;
    }
}

export async function saveMessage(message: ChatMessage): Promise<ChatMessage | null> {
    const db = await getDb();
    
    try {
        const result = await db.run(
            'INSERT INTO ft_chat_messages (room_id, user_id, message, message_type) VALUES (?, ?, ?, ?)',
            message.room_id, message.user_id, message.message, message.message_type
        );
        
        return {
            ...message,
            id: result.lastID?.toString(),
            timestamp: new Date()
        };
    } catch (error) {
        console.error('Error saving message:', error);
        return null;
    }
}

export async function getChatHistory(roomId: string, limit: number = 50): Promise<ChatMessage[]> {
    const db = await getDb();
    
    try {
        const messages = await db.all(`
            SELECT cm.*, u.username 
            FROM ft_chat_messages cm
            JOIN ft_users u ON cm.user_id = u.id
            WHERE cm.room_id = ?
            ORDER BY cm.timestamp DESC
            LIMIT ?
        `, roomId, limit);
        
    return messages.reverse().map((msg: any) => ({
            id: msg.id.toString(),
            user_id: msg.user_id,
            username: msg.username,
            message: msg.message,
            timestamp: new Date(msg.timestamp),
            room_id: msg.room_id,
            message_type: msg.message_type
        }));
    } catch (error) {
        console.error('Error getting chat history:', error);
        return [];
    }
}

export async function getRoomParticipants(roomId: string): Promise<number[]> {
    const db = await getDb();
    
    try {
        const participants = await db.all(
            'SELECT user_id FROM ft_chat_participants WHERE room_id = ?',
            roomId
        );
    return participants.map((p: any) => p.user_id);
    } catch (error) {
        console.error('Error getting room participants:', error);
        return [];
    }
}

export async function getUserRooms(userId: number): Promise<any[]> {
    const db = await getDb();
    try {
        const rooms = await db.all(
            `SELECT cr.* FROM ft_chat_rooms cr
             JOIN ft_chat_participants cp ON cr.id = cp.room_id
             WHERE cp.user_id = ?`,
            userId
        );

        const result: any[] = [];
        for (const room of rooms) {
            if (room.is_private) {
                const otherIdRow = await db.get(
                    `SELECT user_id FROM ft_chat_participants WHERE room_id = ? AND user_id != ? LIMIT 1`,
                    room.id, userId
                ) as { user_id: number } | undefined;
                const otherId = otherIdRow?.user_id;
                if (!otherId) continue;
                const ok = await friendshipAccepted(userId, otherId);
                if (!ok) continue;
                const otherUser = await userServices.userIdFindInDb(otherId);
                const peer_username = otherUser?.username;
                result.push({
                    id: room.id,
                    name: room.name,
                    created_by: room.created_by,
                    created_at: new Date(room.created_at),
                    is_private: room.is_private,
                    participants: [],
                    peer_username
                });
                continue;
            }
            result.push({
                id: room.id,
                name: room.name,
                created_by: room.created_by,
                created_at: new Date(room.created_at),
                is_private: room.is_private,
                participants: []
            });
        }
        return result;
    } catch {
        return [];
    }
}

export async function deleteChatRoom(roomId: string): Promise<boolean> {
	const db = await getDb();
	
	try {
		await db.run('DELETE FROM ft_chat_rooms WHERE id = ?', roomId);
		await db.run('DELETE FROM ft_chat_participants WHERE room_id = ?', roomId);
		await db.run('DELETE FROM ft_chat_messages WHERE room_id = ?', roomId);
		return true;
	} catch (error) {
		console.error('Error deleting chat room:', error);
		return false;
	}
}

export function dmRoomNameFromIds(a: number, b: number): string {
    const [x, y] = a < b ? [a, b] : [b, a];
    return `dm_${x}_${y}`;
}

export async function friendshipAccepted(a: number, b: number): Promise<boolean> {
    const db = await getDb();
    const rows = await db.all(
        `SELECT stat FROM ft_friendship WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)`,
        a, b, b, a
    ) as Array<{ stat: string }>;
    if (!rows || rows.length < 2) return false;
    return rows.every(r => r.stat === 'Accepted');
}

export async function ensureDmRoom(userId: number, friendId: number): Promise<ChatRoom | null> {
    if (userId === friendId) return null;
    const db = await getDb();

    const [u1, u2] = userId < friendId ? [userId, friendId] : [friendId, userId];
    const name = dmRoomNameFromIds(u1, u2);
    const byParticipants = await db.get(
        `SELECT cr.id, cr.name FROM ft_chat_rooms cr
         JOIN ft_chat_participants p1 ON p1.room_id = cr.id AND p1.user_id = ?
         JOIN ft_chat_participants p2 ON p2.room_id = cr.id AND p2.user_id = ?
         WHERE cr.is_private = 1
         LIMIT 1`,
        u1, u2
    ) as { id: string, name: string } | undefined;

    if (byParticipants && byParticipants.name !== name) {
        const nameTaken = await db.get(`SELECT id FROM ft_chat_rooms WHERE name = ?`, name) as { id: string } | undefined;
        if (!nameTaken) {
            await db.run(`UPDATE ft_chat_rooms SET name = ? WHERE id = ?`, name, byParticipants.id);
        }
    }

    const existing = await db.get(`SELECT * FROM ft_chat_rooms WHERE name = ? AND is_private = 1`, name) as any;
    let roomId: string;
    if (!existing) {
        const created = await createChatRoom(name, u1, true);
        if (!created) return null;
        roomId = created.id;
    } else {
        roomId = existing.id;
    }
    await db.run('INSERT OR IGNORE INTO ft_chat_participants (room_id, user_id) VALUES (?, ?)', roomId, u1);
    await db.run('INSERT OR IGNORE INTO ft_chat_participants (room_id, user_id) VALUES (?, ?)', roomId, u2);

    return {
        id: roomId,
        name,
        created_by: u1,
        created_at: new Date(),
        is_private: true,
        participants: [u1, u2]
    };
}

export async function canAccessRoom(userId: number, roomId: string): Promise<boolean> {
    const db = await getDb();
    const room = await db.get('SELECT * FROM ft_chat_rooms WHERE id = ?', roomId) as { id: string, is_private: number } | undefined;
    if (!room) return false;
    const part = await db.get('SELECT 1 FROM ft_chat_participants WHERE room_id = ? AND user_id = ?', roomId, userId);
    if (!part) return false;
    if (room.is_private) {
        const other = await db.get('SELECT user_id FROM ft_chat_participants WHERE room_id = ? AND user_id != ? LIMIT 1', roomId, userId) as { user_id: number } | undefined;
        if (!other) return false;
        const ok = await friendshipAccepted(userId, other.user_id);
        if (!ok) return false;
    }
    return true;
}