import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import {loginController,
	logoutController,
	registerController,
	googleAuthController,
} from '../controller/auth.controller'
import { authJwtVerify } from '../services/auth/jwt.services'


export default async function AuthRoutes(server:FastifyInstance) {
	server.post("/sign-in",
	{
		schema: schemas.loginSchema,
		handler: loginController,
		config: {
			rateLimit: {
				max: 10,
				timeWindow: '1 minute'
			}
		}
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
		config: {
			rateLimit: {
				max: 10,
				timeWindow: '1 minute'
			}
		}
	});
	server.get('/login/google/callback',
	{
		handler: googleAuthController
	});

}
