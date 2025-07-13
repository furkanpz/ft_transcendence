// import { initializeDatabase } from '../db/init';
import { FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';
import { emailRoutes } from './email.routes';

export default async function registerRoutes(server: FastifyInstance) {
	await server.register(authRoutes, { prefix: '/api/auth' });
	await server.register(userRoutes, { prefix: '/api/user' });
	await server.register(adminRoutes, { prefix: '/api/admin' });
	await server.register(emailRoutes, { prefix: '/api/auth/2fa'})
}