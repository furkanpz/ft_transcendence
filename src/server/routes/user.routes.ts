import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import {
	friendsController,
	friendsDetailsController,
	friendRequestController,
	userProfileController,
	changePasswordController,
	blockUserController,
	getBlockedUsersController,
	unblockUserController
} from '../controller/user.controller'
export default async function userRoutes(server: FastifyInstance) {


	server.get("/friends",
	{
		preHandler: server.authenticate,
		handler:friendsController
	});
	server.post("/friends/details", 
	{
		preHandler: server.authenticate,
		schema: schemas.friendDetailsSchema,
		handler: friendsDetailsController
	});
	server.post("/friends/request",
	{
		preHandler: server.authenticate,
		schema: schemas.friendRequestSchema,
		handler:friendRequestController
	});
	server.get("/profile",
	{
		preHandler: server.authenticate,
		handler: userProfileController
	});
	server.post("/password",
	{
		preHandler:server.authenticate,
		schema: schemas.passwordSchema,
		handler:changePasswordController
	});
	
	server.post("/friends/block",
	{
		preHandler: server.authenticate,
		schema: schemas.blockUserSchema,
		handler: blockUserController
	});

	server.get("/friends/block",
	{
		preHandler: server.authenticate,
		handler:getBlockedUsersController
	});

	server.post("/friends/unblock",
	{
		preHandler: server.authenticate,
		schema: schemas.blockUserSchema,
		handler: unblockUserController
	}
	)
}