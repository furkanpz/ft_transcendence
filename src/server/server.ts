import Fastify, { FastifyReply, FastifyRequest } from 'fastify'
import jwt from '@fastify/jwt'
import fastifyStatic from '@fastify/static';
import path from 'path';
import { InitRoutes } from './routes'
import fCookie from '@fastify/cookie'

const server = Fastify({
		logger: false
});


server.register(fastifyStatic, {
	root: path.join(__dirname, '../frontend'),
	prefix: '/', 
	decorateReply: false
});

server.register(jwt, {
	secret: process.env.JWT_SECRET || 'dev-secret',
	cookie: {
		cookieName: "access_token",
		signed: false,
	}
});

server.register(fCookie, {
	secret: process.env.COOKIE_SECRET || 'dev-secret',
	hook: 'preHandler'
});

server.decorate('authenticate', async function (request: FastifyRequest , response: FastifyReply) {
		try {
			const token = request.cookies.access_token;
			if (!token)
				return (response.code(401).send({ message: 'Authentication required' }));

			await request.jwtVerify();
		} catch (err) {
			response.code(401).send({ message: 'Unauthorized Access' });
		}
});

server.listen({port:3000});
InitRoutes(server);
