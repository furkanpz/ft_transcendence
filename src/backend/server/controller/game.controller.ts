import { FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess, sendError } from '../helpers/response';
import { jwtUser, userRole } from '../types/user.types';
import { gameManager } from '../services/game/game.manager';
import server from '../server';

export async function getGameRoomsController(request: FastifyRequest, response: FastifyReply) {
	const user = request.user as jwtUser;

	const rooms = gameManager.getRooms();
	return sendSuccess(response, 'Rooms retrieved successfully', { rooms });
}

export async function gameController(connection: any, req: any) {
	const token = req.cookies.access_token;
	if (!token) {
		connection.close(1008, 'Authentication required');
		return;
	}
	const jwtusr = server.jwt.verify(token) as jwtUser;
	try {
		gameManager.addPlayer(jwtusr.id, jwtusr.username, connection);
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to game server' }
		}));
	  } catch (error) {
		console.log(error); // debug
		connection.close(1008, 'Invalid token');
	  }
}