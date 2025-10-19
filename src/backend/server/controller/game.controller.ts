import { FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess, sendError } from '../helpers/response';
import { jwtUser, userRole } from '../types/user.types';
import { classicGameManager } from '../services/game/game.manager';
import { GameType } from '../types/game.types';
import server from '../server';
import { queueManager } from '../services/game/queue.manager';

export async function classicQueueController(connection: any, req: any) {
	const token = req.cookies.access_token;
	if (!token) {
		connection.close(1008, 'Authentication required');
		return;
	}
	const jwtusr = server.jwt.verify(token) as jwtUser;
	try {
		queueManager.addQueue(jwtusr.id, connection, GameType.Classic);
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to game server' }
		}));
	  } catch (error) {
		console.log(error); // debug
		connection.close(1008, 'Invalid token');
	  }
}

export async function multiplayerQueueController(connection: any, req: any) {
	const token = req.cookies.access_token;
	if (!token) {
		connection.close(1008, 'Authentication required');
		return;
	}
	const jwtusr = server.jwt.verify(token) as jwtUser;
	try {
		queueManager.addQueue(jwtusr.id, connection, GameType.Multiplayer);
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to game server' }
		}));
	  } catch (error) {
		console.log(error); // debug
		connection.close(1008, 'Invalid token');
	  }
}

export async function tournamentQueueController(connection: any, req: any) {
	const token = req.cookies.access_token;
	if (!token) {
		connection.close(1008, 'Authentication required');
		return;
	}
	const jwtusr = server.jwt.verify(token) as jwtUser;
	try {
		queueManager.addQueue(jwtusr.id, connection, GameType.Tournament);
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to game server' }
		}));
	  } catch (error) {
		console.log(error); // debug
		connection.close(1008, 'Invalid token');
	  }
}

export async function gameController(connection: any, req: any) {
	const token = req.cookies.access_token;
	if (!token) {
		connection.close(1008, 'Authentication required');
		return;
	}
	const jwtusr = server.jwt.verify(token) as jwtUser;
	const roomId = req.params.roomId;
	console.error("Player " + jwtusr.id + " is trying to join room " + roomId);
	try {
		classicGameManager.addPlayer(jwtusr.id, connection);
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to game server' }
		}));
	  } catch (error) {
		console.log(error); // debug
		connection.close(1008, 'Invalid token');
	  }
}