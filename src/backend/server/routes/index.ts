import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import { twoFactorRoutes } from './2fa.routes';
import chatRoutes from './chat.routes';
import { chatController } from '../controller/chat.controller';
import { gameController, classicQueueController, multiplayerQueueController, tournamentQueueController, tournamentController, getTournamentDetails, getPastTournaments } from '../controller/game.controller';

export default async function setRoutes(server: FastifyInstance) {
	await server.register(authRoutes, { prefix: '/api/auth' });
	await server.register(userRoutes, { prefix: '/api/user' });
	await server.register(adminRoutes, { prefix: '/api/admin' });
	await server.register(twoFactorRoutes, { prefix: '/api/auth'});
	await server.register(chatRoutes, { prefix: '/api/chat' });
	
	server.get('/api/tournament/:tournamentId', getTournamentDetails);
	server.get('/api/tournaments/past', getPastTournaments);
	
	await server.register(async function (fastify) {
	fastify.get('/ws/chat', {
		websocket: true
	}, chatController);
	});
	await server.register(async function (fastify) {
		fastify.get('/queue/classic', {
			websocket: true
		}, classicQueueController);
	});
	await server.register(async function (fastify) {
		fastify.get('/queue/multiplayer', {
		websocket: true
	}, multiplayerQueueController);
	});
	await server.register(async function (fastify) {
		fastify.get('/queue/tournament', {
		websocket: true
	}, tournamentQueueController);
	});
	await server.register(async function (fastify) {
		fastify.get('/ws/tournament/:tournamentId', {
		websocket: true
	}, tournamentController);
	});
	await server.register(async function (fastify) {
	fastify.get('/room/:roomId', {
		websocket: true
	}, gameController);
	});
}
