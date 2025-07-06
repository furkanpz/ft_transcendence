import server from '../../server';
import { db_User } from '../../types/user.types'
import { FastifyRequest, FastifyReply } from 'fastify';

export async function createJWT(db_user: db_User): Promise<string | null> {
	let token;
	try {
		token = server.jwt.sign({
				id: db_user.id,
				email: db_user.email,
				username: db_user.username,
				role: db_user.user_role,
			}, {expiresIn : '1h'});
		} catch (err) {
		return null;
	}
	return token;
};

export async function authJwtVerify(request: FastifyRequest , response: FastifyReply)
{
	try {
	const token = request.cookies.access_token;
	if (!token)
		return (response.code(401).send({ message: 'Authentication required' }));
	await request.jwtVerify();
	} catch (err) {
		response.code(401).send({ message: 'Unauthorized Access' });
	}
};
