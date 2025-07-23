import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import { set2FAController,
	veriyfandSetOTPController,
	veriyfOTPController,
	mailAccountRecoveryController,
	veriyfMailOTPController
 } from '../controller/2fa.controller';
import { authJwtVerify } from '../services/auth/jwt.services'

export async function twoFactorRoutes(server : FastifyInstance)
{
	server.post("/2fa",
	{
		schema: 	schemas.twoFSchema,
		preHandler: authJwtVerify,
		handler: 	set2FAController,
		config: schemas.rateLimiter,
	});
	server.post("/2fa/verify",
	{
		preHandler:	authJwtVerify,
		schema:		schemas.twoFSVerifySchema,
		handler:	veriyfandSetOTPController,
		config: schemas.rateLimiter,
	}
	);
	server.post("/2fa/login", {
		handler:veriyfOTPController,
		schema: schemas.twoFloginSchema,
		config: schemas.rateLimiter,
	});
	server.get("/account_recovery", {
		schema: schemas.recoveryPageSchema,
		config: schemas.rateLimiter,
		handler:mailAccountRecoveryController
	})
	server.post("/account_recovery/verify", {
		schema: schemas.recoveryStepTwoPageSchema,
		config: schemas.rateLimiter,
		handler:veriyfMailOTPController
	})
};