import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import {loginController,
	logoutController,
	registerController,
	googleAuthController,
	accountRecoveryController
} from '../controller/auth.controller'
import { authJwtVerify } from '../services/auth/jwt.services'


export default async function AuthRoutes(server:FastifyInstance) {
	server.post("/sign-in",
	{
		schema: schemas.loginSchema,
		handler: loginController,
		config: schemas.rateLimiter
	});
	server.get("/logout", 
	{
		preHandler: authJwtVerify, 
		handler:logoutController
	});
	server.post("/sign-up",
	{
		schema: schemas.registerSchema,
		handler: registerController,
		config: schemas.rateLimiter
	});
	server.get("/login/google/callback",
	{
		handler: googleAuthController
	});

	server.post("/account_recovery", {
		schema: schemas.account_recovery,
		config: schemas.rateLimiter,
		handler:accountRecoveryController
	})
}
