import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import {
	adminFriendDetailsController,
	adminRoleUpdateController
} from '../controller/admin.controller'
import { authJwtVerify } from '../services/auth/jwt.services'

export default async function adminRoutes(server: FastifyInstance) {
	server.get("/friends/:id",
	{
		preHandler: authJwtVerify,
		handler: adminFriendDetailsController
	});
	server.post("/roleUpdate",
	{
		preHandler: authJwtVerify,
		schema: schemas.roleSchema,
		handler: adminRoleUpdateController	
	});
};
