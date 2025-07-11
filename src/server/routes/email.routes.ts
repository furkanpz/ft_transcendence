import { FastifyInstance} from 'fastify';
import * as schemas from '../schemas/schema'
import { set2FAController,
	veriyfandSetOTPController,
	veriyfOTPController
 } from '../controller/email.controller';

export async function emailRoutes(server : FastifyInstance)
{
	server.post("/set2FA",
	{
		schema: 	schemas.twoFSchema,
		preHandler: server.authenticate,
		handler: 	set2FAController
	});
	server.post("/set2FA/verify",
	{
		preHandler:	server.authenticate,
		schema:		schemas.twoFSVerifySchema,
		handler:	veriyfandSetOTPController
	}
	);
	server.post("/login", {
		handler:veriyfOTPController,
		schema: schemas.twoFloginSchema
	});
};