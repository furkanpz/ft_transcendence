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
	secret: 'K2x33Q}zV3#nqfz&UG,V*=3+!aUi/CHsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdf%2#=M*%hJa35ES[{*+1DX%-:c%Dtmhg',
	cookie: {
		cookieName: "access_token",
		signed: false,
	}
});

server.register(fCookie, {
	secret: 'K2x33Q}zV3#nqfz&UG,V*=3+!aUi/CHsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdf%2#=M*%hJa35ES[{*+1DX%-:c%Dtmhg',
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
