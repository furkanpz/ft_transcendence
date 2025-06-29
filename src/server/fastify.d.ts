import 'fastify';
import { FastifyReply, FastifyRequest } from 'fastify';
import { OAuth2Namespace } from '@fastify/oauth2';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate(request: FastifyRequest, reply: FastifyReply): Promise<void>;
		googleOAuth2: OAuth2Namespace;

  }
}
