import { FastifyInstance } from 'fastify';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import { twoFactorRoutes } from './2fa.routes';
import chatRoutes from './chat.routes';
import { chatController } from '../controller/chat.controller';

export default async function setRoutes(server: FastifyInstance) {
	await server.register(authRoutes, { prefix: '/api/auth' });
	await server.register(userRoutes, { prefix: '/api/user' });
	await server.register(adminRoutes, { prefix: '/api/admin' });
	await server.register(twoFactorRoutes, { prefix: '/api/auth'});
	await server.register(chatRoutes, { prefix: '/api/chat' });
	await server.register(async function (fastify) {
	fastify.get('/ws/chat', {
		websocket: true,
		config: {
			rateLimit: {
				max: 5,
				timeWindow: '10 seconds'
			}
		}
	}, chatController);
});

}
