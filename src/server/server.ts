import Fastify, { FastifyReply, FastifyRequest } from 'fastify'
import jwt from '@fastify/jwt'
import fastifyStatic from '@fastify/static';
import path from 'path';
import registerRoutes from './routes'
import fCookie from '@fastify/cookie'
import {authJwtVerify} from './services/auth/jwt.services'
import fastifyOauth2, { GOOGLE_CONFIGURATION } from '@fastify/oauth2';

const server = Fastify({
		logger: true,
		ajv: {
			customOptions: {
				removeAdditional: false
			}
		}
});
export default server;

async function main() {
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

	server.register(fastifyOauth2, {
			name: 'googleOAuth2',
			scope: ['profile', 'email'],
			credentials: {
				client: {
					id: "213701391346-4ckm789dkg3g4b21lid4nap0gdqdhn92.apps.googleusercontent.com",
					secret: "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"
				},
				auth: GOOGLE_CONFIGURATION
			},
			startRedirectPath: '/api/auth/login/google',
			callbackUri: 'http://localhost:3000/api/auth/login/google/callback'
		});

	server.decorate('authenticate', authJwtVerify );
	await registerRoutes(server);

	server.listen({port:3000});
}

main();