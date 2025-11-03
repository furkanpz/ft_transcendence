import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import {loginController,
	logoutController,
	registerController,
	googleAuthController,
	accountRecoveryController,
	LoginCheck
} from '../controller/auth.controller'
import { authJwtVerify } from '../services/auth/jwt.services'


export default async function AuthRoutes(server:FastifyInstance) {
	server.post("/sign-in",
	{
		schema: schemas.loginSchema,
		handler: loginController
	});
	server.get("/logout", 
	{
		preHandler: authJwtVerify, 
		handler:logoutController
	});
	server.post("/sign-up",
	{
		schema: schemas.registerSchema,
		handler: registerController
	});
	server.get("/login/google/callback",
	{
		handler: googleAuthController
	});

	server.post("/account_recovery", {
		schema: schemas.account_recovery,
		handler:accountRecoveryController
	})

	server.get("/check" , {
		preHandler: authJwtVerify,
		handler: LoginCheck
	})
}
