import { getDb } from '../../db/db.get';
import { ChatMessage, ChatRoom } from '../../types/chat.types';
import { v4 as uuidv4 } from 'uuid';

export async function createChatRoom(name: string, createdBy: number, isPrivate: boolean = false): Promise<ChatRoom | null> {
    const db = await getDb();
    const roomId = uuidv4();
    
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
        
        return messages.reverse().map(msg => ({
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
        return participants.map(p => p.user_id);
    } catch (error) {
        console.error('Error getting room participants:', error);
        return [];
    }
}

export async function getUserRooms(userId: number): Promise<ChatRoom[]> {
    const db = await getDb();
    
    try {
        const rooms = await db.all(`
            SELECT cr.* 
            FROM ft_chat_rooms cr
            JOIN ft_chat_participants cp ON cr.id = cp.room_id
            WHERE cp.user_id = ?
        `, userId);
        
        return rooms.map(room => ({
            id: room.id,
            name: room.name,
            created_by: room.created_by,
            created_at: new Date(room.created_at),
            is_private: room.is_private,
            participants: []
        }));
    } catch (error) {
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