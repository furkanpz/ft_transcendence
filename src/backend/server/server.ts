import Fastify from 'fastify';
import jwt from '@fastify/jwt';
import fastifyStatic from '@fastify/static';
import path from 'path';
import fs from 'fs';
import setRoutes from './routes';
import fCookie from '@fastify/cookie';
import fastifyOauth2 from '@fastify/oauth2';
const { GOOGLE_CONFIGURATION } = fastifyOauth2;
import cors from '@fastify/cors';
import fastifyWebsocket from '@fastify/websocket';
import rateLimit from '@fastify/rate-limit';


const certPath = path.join(__dirname, '../../certs');
const httpsOptions = {
  key: fs.readFileSync(path.join(certPath, 'key.pem')),
  cert: fs.readFileSync(path.join(certPath, 'cert.pem'))
};

const server = Fastify({
  logger: true,
  https: httpsOptions,
  ajv: {
    customOptions: {
      removeAdditional: false
    }
  },
});
export default server;

async function main() {
  await server.register(cors, {
    origin: ['https://localhost:3000', "https://localhost:5173", 'https://10.11.7.9:5173', 'https://localhost:3000', "https://localhost:5173", 'https://10.11.7.9:5173'],
    credentials: true,
	  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  });
  await server.register(fastifyWebsocket);
  await server.register(rateLimit, {
    global: true,
    max: 20000,
    timeWindow: '1 minute'
  });

  await server.register(fastifyStatic, {
    root: path.join(__dirname, '../../../frontend'),

    prefix: '/',
    decorateReply: false
  });

  await server.register(jwt, {
    secret: process.env.JWT_SECRET || 'default_secret',
    cookie: {
      cookieName: 'access_token',
    }
  });

  await server.register(fCookie, {
    secret: process.env.COOKIE_SECRET || 'default_cookie_secret',
    hook: 'preHandler'
  });

  await server.register(fastifyOauth2, {
    name: 'googleOAuth2',
    scope: ['profile', 'email'],
    credentials: {
      client: {
        id: process.env.GOOGLE_CLIENT_ID || "default_client_id",
        secret: process.env.GOOGLE_CLIENT_SECRET || "default_client_secret"
      },
      auth: GOOGLE_CONFIGURATION
    },
    startRedirectPath: '/api/auth/login/google',
    callbackUri: process.env.GOOGLE_CALLBACK_URI || 'https://localhost:3000/api/auth/login/google/callback'
  });

  await setRoutes(server);

  await server.listen({ port: 3000, host: '0.0.0.0' });
}

console.log(process.env.GOOGLE_CLIENT_ID);

main().catch((err) => {
  console.error('Server startup error:', err);
  process.exit(1);
});
