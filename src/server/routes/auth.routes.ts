import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import {loginController,
	logoutController,
	registerController,
	googleAuthController,
	changePasswordController
} from '../controller/auth.controller'


export default async function AuthRoutes(server:FastifyInstance) {
	server.post("/sign-in",
	{
		schema: schemas.loginSchema,
		handler: loginController
	});
	server.get("/logout", 
	{
		preHandler: server.authenticate, 
		handler:logoutController
	});
	server.post("/sign-up",
	{
		schema: schemas.registerSchema,
		handler: registerController
	});
	server.get('/login/google/callback',
	{
		handler: googleAuthController
	});
	server.post("/password",
	{
		preHandler:server.authenticate,
		schema: schemas.passwordSchema,
		handler:changePasswordController
	});
}
