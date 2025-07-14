import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import { set2FAController,
	veriyfandSetOTPController,
	veriyfOTPController
 } from '../controller/email.controller';
import { authJwtVerify } from '../services/auth/jwt.services'

export async function emailRoutes(server : FastifyInstance)
{
	server.post("/set2FA",
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
	server.post("/set2FA/verify",
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
	server.post("/login", {
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