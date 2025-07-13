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
import { authJwtVerify } from '../services/auth/jwt.services'

export default async function userRoutes(server: FastifyInstance) {


	server.get("/friends",
	{
		preHandler: authJwtVerify,
		handler:friendsController
	});
	server.post("/friends/details", 
	{
		preHandler: authJwtVerify,
		schema: schemas.friendDetailsSchema,
		handler: friendsDetailsController
	});
	server.post("/friends/request",
	{
		preHandler: authJwtVerify,
		schema: schemas.friendRequestSchema,
		handler:friendRequestController
	});
	server.get("/profile",
	{
		preHandler: authJwtVerify,
		handler: userProfileController
	});
	server.post("/password",
	{
		preHandler:authJwtVerify,
		schema: schemas.passwordSchema,
		handler:changePasswordController
	});
	
	server.post("/friends/block",
	{
		preHandler: authJwtVerify,
		schema: schemas.blockUserSchema,
		handler: blockUserController
	});

	server.get("/friends/block",
	{
		preHandler: authJwtVerify,
		handler:getBlockedUsersController
	});

	server.post("/friends/unblock",
	{
		preHandler: authJwtVerify,
		schema: schemas.blockUserSchema,
		handler: unblockUserController
	}
	)
}