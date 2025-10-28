import { FastifyRequest, FastifyReply } from 'fastify';
import { sendSuccess, sendError } from '../helpers/response';
import { jwtUser, userRole } from '../types/user.types';
import { gameManager } from '../services/game/game.manager';
import { GameType } from '../types/game.types';
import server from '../server';
import { queueManager } from '../services/game/queue.manager';
import { tournamentManager } from '../services/game/tournament.manager';

export async function classicQueueController(connection: any, req: any) {
	const token = req.cookies.access_token;
	if (!token) {
		connection.close(1008, 'Authentication required');
		return;
	}
	const jwtusr = server.jwt.verify(token) as jwtUser;
	try {
		if (!queueManager.addQueue(jwtusr.id, connection, GameType.Classic)) {
			return;
		}
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to game server' }
		}));
	  } catch (error) {
		console.log(error);
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
		console.log(error);
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
		if (tournamentManager.isPlayerInTournament(jwtusr.id)) {
			connection.close(1008, 'Already in a tournament');
			return;
		}
		
		queueManager.addQueue(jwtusr.id, connection, GameType.Tournament);
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to tournament queue' }
		}));
	  } catch (error) {
		console.log(error);
		connection.close(1008, 'Invalid token');
	  }
}

export async function tournamentController(connection: any, req: any) {
	const token = req.cookies.access_token;
	if (!token) {
		connection.close(1008, 'Authentication required');
		return;
	}
	const jwtusr = server.jwt.verify(token) as jwtUser;
	const tournamentId = req.params.tournamentId;
	
	try {
		tournamentManager.addPlayerSocket(tournamentId, jwtusr.id, connection);
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to tournament' }
		}));

		// Handle incoming messages (join event)
		connection.on('message', (message: any) => {
			try {
				const data = JSON.parse(message.toString());
				if (data.action === 'joinTournament') {
					tournamentManager.handlePlayerJoin(tournamentId, jwtusr.id);
				}
			} catch (error) {
				console.error('Error parsing tournament message:', error);
			}
		});
	  } catch (error) {
		console.log(error);
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
		gameManager.addPlayer(jwtusr.id, connection);
		connection.send(JSON.stringify({
		  type: 'connected',
		  data: { message: 'Connected to game server' }
		}));
	  } catch (error) {
		console.log(error);
		connection.close(1008, 'Invalid token');
	  }
}

export async function getTournamentDetails(req: FastifyRequest<{ Params: { tournamentId: string } }>, res: FastifyReply) {
	try {
		const { tournamentId } = req.params;
		const details = await tournamentManager.getTournamentDetails(tournamentId);
		
		if (!details) {
			return sendError(res, 404, 'Tournament not found');
		}
		
		return sendSuccess(res, 'Tournament details', { tournament: details });
	} catch (error) {
		console.error(error);
		return sendError(res, 500, 'Failed to get tournament details');
	}
}

export async function getPastTournaments(req: FastifyRequest, res: FastifyReply) {
	try {
		const tournaments = await tournamentManager.getPastTournaments(20);
		return sendSuccess(res, 'Past tournaments', { tournaments });
	} catch (error) {
		console.error(error);
		return sendError(res, 500, 'Failed to get past tournaments');
	}
}