import { FastifyInstance } from 'fastify';
import { authJwtVerify } from '../services/auth/jwt.services';
import * as schemas from '../schemas/schema';
import { getGameRoomsController } from '../controller/game.controller';

export default async function gameRoutes(server: FastifyInstance) {
    server.get('/rooms', {
        preHandler: authJwtVerify,
        handler: getGameRoomsController,
    });
}
