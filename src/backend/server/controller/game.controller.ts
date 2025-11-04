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
	try {
		if (token) {
			const jwtusr = server.jwt.verify(token) as jwtUser;
			if (tournamentManager.isPlayerInTournament(jwtusr.id)) {
				connection.close(1008, 'Already in a tournament');
				return;
			}
			queueManager.addQueue(jwtusr.id, connection, GameType.Tournament);
			connection.send(JSON.stringify({
				type: 'connected',
				data: { message: 'Connected to tournament queue' }
			}));
			return;
		}
		const alias = (req.query?.alias || '').toString().trim();
		if (!alias || alias.length < 2 || alias.length > 20) {
			connection.close(1008, 'Alias required (2-20 chars)');
			return;
		}
		let guestId = -Math.floor(Math.random() * 1_000_000_000) - 1;
		while (queueManager.playerSockets.has(guestId) || tournamentManager.isPlayerInTournament(guestId)) {
			guestId = -Math.floor(Math.random() * 1_000_000_000) - 1;
		}
		queueManager.guestAliases.set(guestId, alias);
		queueManager.addQueue(guestId, connection, GameType.Tournament);
		connection.send(JSON.stringify({
			type: 'connected',
			data: { message: 'Connected to tournament queue as guest', guestId, alias }
		}));
	} catch (error) {
		console.log(error);
		connection.close(1008, 'Unable to join tournament queue');
	}
}

export async function tournamentController(connection: any, req: any) {
	const tournamentId = req.params.tournamentId;
	const token = req.cookies.access_token;
	let userId: number | null = null;
	try {
		if (token) {
			const jwtusr = server.jwt.verify(token) as jwtUser;
			userId = jwtusr.id;
		} else {
			const guestIdParam = (req.query?.guestId || req.query?.guestid || '').toString();
			const parsed = parseInt(guestIdParam, 10);
			if (!parsed || isNaN(parsed)) {
				connection.close(1008, 'Authentication required');
				return;
			}
			const tId = tournamentManager.getTournamentIdForPlayer(parsed);
			if (!tId || tId !== tournamentId) {
				connection.close(1008, 'Not part of this tournament');
				return;
			}
			userId = parsed;
		}

		tournamentManager.addPlayerSocket(tournamentId, userId!, connection);
		connection.send(JSON.stringify({
			type: 'connected',
			data: { message: 'Connected to tournament' }
		}));

		connection.on('message', (message: any) => {
			try {
				const data = JSON.parse(message.toString());
				if (data.action === 'joinTournament') {
					tournamentManager.handlePlayerJoin(tournamentId, userId!);
				} else if (data.action === 'leaveTournament') {
					tournamentManager.handlePlayerLeave(tournamentId, userId!);
				}
			} catch (error) {
				console.error('Error parsing tournament message:', error);
			}
		});
	} catch (error) {
		console.log(error);
		connection.close(1008, 'Unable to connect to tournament');
	}
}

export async function gameController(connection: any, req: any) {
	const roomId = req.params.roomId;
	const token = req.cookies.access_token;
	try {
		if (token) {
			const jwtusr = server.jwt.verify(token) as jwtUser;
			console.error("Player " + jwtusr.id + " is trying to join room " + roomId);
			gameManager.addPlayer(jwtusr.id, connection);
		} else {
			const guestIdParam = (req.query?.guestId || req.query?.guestid || '').toString();
			const parsed = parseInt(guestIdParam, 10);
			if (!parsed || isNaN(parsed)) {
				connection.close(1008, 'Authentication required');
				return;
			}
			const expectedRoom = gameManager.playerRoom.get(parsed);
			if (!expectedRoom || expectedRoom !== roomId) {
				connection.close(1008, 'Not part of this room');
				return;
			}
			gameManager.addPlayer(parsed, connection);
		}
		connection.send(JSON.stringify({
			type: 'connected',
			data: { message: 'Connected to game server' }
		}));
	} catch (error) {
		console.log(error);
		connection.close(1008, 'Unable to connect to game');
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