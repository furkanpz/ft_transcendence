// import { initializeDatabase } from '../db/init';
import { FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import authRoutes from './auth.routes';
import userRoutes from './user.routes';
import adminRoutes from './admin.routes';

export default async function registerRoutes(server: FastifyInstance) {
	await server.register(authRoutes, { prefix: '/api/v1/auth' });
	await server.register(userRoutes, { prefix: '/api/v1/users' });
	await server.register(adminRoutes, { prefix: '/api/v1/admin' });
}