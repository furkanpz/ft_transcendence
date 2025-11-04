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
	unblockUserController,
	changeUsernameController,
	imageUploadController,
	usersDetailsByUsernameController,
	getUserIdByUsernameController,
	userMatchHistoryController,
	userTournamentHistoryController,
	userDetailedStatsController,
	otherUserProfileController,
	otherUserDetailedStatsController,
	otherUserMatchHistoryController,
	otherUserTournamentHistoryController
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

	server.post("/details/by-username",
	{
		preHandler: authJwtVerify,
		handler: usersDetailsByUsernameController
	});

	server.get("/getUserId/:username",
	{
		preHandler: authJwtVerify,
		handler: getUserIdByUsernameController
	});

	server.get("/search",
	{
		preHandler: authJwtVerify,
		handler: (await import('../controller/user.controller')).searchUsersController
	});
	
	server.get("/match-history",
	{
		preHandler: authJwtVerify,
		handler: userMatchHistoryController
	});
	
	server.get("/tournament-history",
	{
		preHandler: authJwtVerify,
		handler: userTournamentHistoryController
	});
	
	server.get("/detailed-stats",
	{
		preHandler: authJwtVerify,
		handler: userDetailedStatsController
	});

	// Public (other user) profile and stats by userId (requires auth)
	server.get("/other/:userId/profile",
	{
		preHandler: authJwtVerify,
		handler: otherUserProfileController
	});

	server.get("/other/:userId/detailed-stats",
	{
		preHandler: authJwtVerify,
		handler: otherUserDetailedStatsController
	});

	server.get("/other/:userId/match-history",
	{
		preHandler: authJwtVerify,
		handler: otherUserMatchHistoryController
	});

	server.get("/other/:userId/tournament-history",
	{
		preHandler: authJwtVerify,
		handler: otherUserTournamentHistoryController
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
	server.put("/password",
	{
		preHandler:authJwtVerify,
		schema: schemas.passwordSchema,
		handler:changePasswordController
	});

	server.put("/username",
	{
		preHandler:authJwtVerify,
		schema: schemas.usernameSchema,
		handler:changeUsernameController
	});

	server.post("/image-upload", {
		preHandler:authJwtVerify,
		handler:imageUploadController
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

	server.delete("/friends/block/:unBlockId",
	{
		preHandler: authJwtVerify,
		schema: schemas.unblockUserSchema,
		handler: unblockUserController
	});
}