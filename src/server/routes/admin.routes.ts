import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import {
	adminFriendDetailsController,
	adminRoleUpdateController
} from '../controller/admin.controller'

export default async function adminRoutes(server: FastifyInstance) {
	server.get("/friends/:id",
	{
		preHandler: server.authenticate,
		handler: adminFriendDetailsController
	});
	server.post("/roleUpdate",
	{
		preHandler: server.authenticate,
		schema: schemas.roleSchema,
		handler: adminRoleUpdateController	
	});
};
