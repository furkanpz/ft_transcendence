import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path from 'path';
import registerRoutes from './routes';
import fCookie from '@fastify/cookie';
import { authJwtVerify } from './services/auth/jwt.services';
import fastifyOauth2, { GOOGLE_CONFIGURATION } from '@fastify/oauth2';
import cors from '@fastify/cors';

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
  await server.register(cors, {
    origin: ['http://localhost:3000',],
    credentials: true,
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });

  await server.register(fastifyStatic, {
    root: path.join(__dirname, '../frontend'),
    prefix: '/',
    decorateReply: false
  });

  await server.register(jwt, {
    secret: 'K2x33Q}zV3#nqfz&UG,V*=3+!aUi/CHsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdf%2#=M*%hJa35ES[{*+1DX%-:c%Dtmhg',
    cookie: {
      cookieName: 'access_token',
      signed: false
    }
  });

  await server.register(fCookie, {
    secret: 'K2x33Q}zV3#nqfz&UG,V*=3+!aUi/CHsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdfsdf%2#=M*%hJa35ES[{*+1DX%-:c%Dtmhg',
    hook: 'preHandler'
  });

  await server.register(fastifyOauth2, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: '213701391346-4ckm789dkg3g4b21lid4nap0gdqdhn92.apps.googleusercontent.com',
        secret: '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'
      },
      auth: GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/api/auth/login/google',
    callbackUri: 'http://localhost:3000/api/auth/login/google/callback'
  });

  server.decorate('authenticate', authJwtVerify);

  await registerRoutes(server);

  await server.listen({ port: 3000, host: '0.0.0.0' });
}

main().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
