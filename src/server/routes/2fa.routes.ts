import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import { set2FAController,
	veriyfandSetOTPController,
	veriyfOTPController
 } from '../controller/2fa.controller';
import { authJwtVerify } from '../services/auth/jwt.services'

export async function twoFactorRoutes(server : FastifyInstance)
{
	server.post("/2fa",
	{
		schema: 	schemas.twoFSchema,
		preHandler: authJwtVerify,
		handler: 	set2FAController,
		config: {
			rateLimit: {
				max: 10,
				timeWindow: '1 minute'
			}
		}
	});
	server.post("/2fa/verify",
	{
		preHandler:	authJwtVerify,
		schema:		schemas.twoFSVerifySchema,
		handler:	veriyfandSetOTPController,
		config: {
			rateLimit: {
				max: 10,
				timeWindow: '1 minute'
			}
		}
	}
	);
	server.post("/2fa/login", {
		handler:veriyfOTPController,
		schema: schemas.twoFloginSchema,
		config: {
			rateLimit: {
				max: 10,
				timeWindow: '1 minute'
			}
		}
	});
};