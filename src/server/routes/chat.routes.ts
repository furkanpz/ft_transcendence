import { FastifyInstance } from 'fastify';
import { 
    createRoomController, 
    joinRoomController, 
    getUserRoomsController, 
    getRoomHistoryController,
	deleteRoomController
} from '../controller/chat.controller';
import { authJwtVerify } from '../services/auth/jwt.services';
import * as schemas from '../schemas/schema';

export default async function chatRoutes(server: FastifyInstance) {
    server.post('/rooms', {
        preHandler: authJwtVerify,
        schema: schemas.roomsSchema,
        handler: createRoomController
    });

	server.delete('/rooms/:roomId', {
		preHandler: authJwtVerify,
		schema: schemas.deleteRoomSchema,
		handler: deleteRoomController
	});

    server.post('/rooms/:roomId/join', {
        preHandler: authJwtVerify,
        schema: schemas.joinRoomSchema,
        handler: joinRoomController
    });

    server.get('/rooms', {
        preHandler: authJwtVerify,
        handler: getUserRoomsController
    });

    server.get('/rooms/:roomId/history', {
        preHandler: authJwtVerify,
        schema: schemas.roomHistorySchema,
        handler: getRoomHistoryController
    });
}
