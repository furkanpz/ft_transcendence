import { FastifyRequest, FastifyReply } from 'fastify';
import { 
        createChatRoom, getUserRooms,
        getChatHistory, joinRoom,
        deleteChatRoom, getRoom,
        getRoomWithName
    } from '../services/chat/chat.services';
import { sendSuccess, sendError } from '../helpers/response';
import { jwtUser, userRole } from '../types/user.types';
import { chatManager } from '../services/chat/websocket.manager';
import server from '../server';

export async function createRoomController(request: FastifyRequest, response: FastifyReply) {
    const user = request.user as jwtUser;
	const isAdmin = user.role === userRole.admin;
	if (!isAdmin) {
		return sendError(response, 403, 'Only admins can create rooms');
	}
    const { name, isPrivate } = request.body as { name: string; isPrivate?: boolean };
    if (!name || name.trim().length === 0) {
        return sendError(response, 400, 'Room name is required');
    }
    const checkRoom = await getRoomWithName(name);
    if (checkRoom)
        return sendError(response, 500, "Such a room already exists");
    const room = await createChatRoom(name.trim(), user.id, isPrivate || false);
    if (!room) {
        return sendError(response, 500, 'Failed to create chat room');
    }

    return sendSuccess(response, 'Chat room created successfully', { room });
}

export async function deleteRoomController(request: FastifyRequest, response: FastifyReply) {
	const user = request.user as jwtUser;
	const isAdmin = user.role === userRole.admin;
	if (!isAdmin) {
		return sendError(response, 403, 'Only admins can delete rooms');
	}
	const { roomId } = request.params as { roomId: string };
    const checkRoom = await getRoom(roomId);
    if (!checkRoom)
        return sendError(response, 500, "There's no room like this");

	const success = await deleteChatRoom(roomId);
	if (!success) {
		return sendError(response, 500, 'Failed to delete chat room');
	}

	return sendSuccess(response, 'Chat room deleted successfully');
}

export async function joinRoomController(request: FastifyRequest, response: FastifyReply) {
    const user = request.user as jwtUser;
    const { roomId } = request.params as { roomId: string };
    const checkRoom = await getRoom(roomId);
    if (!checkRoom)
        return sendError(response, 500, "There's no room like this");

    const success = await joinRoom(roomId, user.id);
    if (!success)
        return sendError(response, 500, 'Failed to join room');

    return sendSuccess(response, 'Joined room successfully');
}

export async function getUserRoomsController(request: FastifyRequest, response: FastifyReply) {
    const user = request.user as jwtUser;

    const rooms = await getUserRooms(user.id);
    return sendSuccess(response, 'Rooms retrieved successfully', { rooms });
}

export async function getRoomHistoryController(request: FastifyRequest, response: FastifyReply) {
    const { roomId } = request.params as { roomId: string };
    const { limit } = request.query as { limit?: string };

    const messages = await getChatHistory(roomId, limit ? parseInt(limit) : 50);
    return sendSuccess(response, 'Chat history retrieved successfully', { messages });
}

export async function chatController(connection: any, req: any) {
    try {
        const token = req.cookies.access_token;
        if (!token) {
          connection.close(1008, 'Authentication required');
          return;
        }

        const jwtusr = server.jwt.verify(token) as any;
        chatManager.addUser(jwtusr.id, jwtusr.username, connection);
        
        connection.send(JSON.stringify({
          type: 'connected',
          data: { message: 'Connected to chat server' }
        }));
      } catch (error) {
        console.log(error); // debug
        connection.close(1008, 'Invalid token');
      }
}