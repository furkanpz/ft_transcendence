
import { FastifyInstance } from 'fastify';
import {db_User, User } from './types/user.types'

import * as userUtils from './services/user.services'

import crypto from 'crypto';

export default async function authRoutes(fastify: FastifyInstance) {
	fastify.register(require('@fastify/oauth2'), {
		name: 'googleOAuth2',
		scope: ['profile', 'email'],
		credentials: {
			client: {
				id: "pass",
				secret: "123"
			},
			auth: require('@fastify/oauth2').GOOGLE_CONFIGURATION
		},
		startRedirectPath: '/login/google',
		callbackUri: 'http://localhost:3000/login/google/callback'
	});

	fastify.get('/login/google/callback', async (request, reply) => {
		const { token } = await fastify.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        const access_token = token.access_token;

        if (!access_token) {
        return reply.code(500).send({ error: 'Access token missing' });
        }
	
		const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${token.access_token}`
			}
		});
		const googleUser = await res.json();
        let db_user = await userUtils.userEmailFindInDb(googleUser.email) as db_User;
        if (!db_user) {
            const randomPassword = crypto.randomBytes(16).toString('hex'); 
            const newUser: User = {
                email: googleUser.email,
                username: googleUser.name.replace(/\s+/g, '_').toLowerCase(), 
                password: randomPassword,
            };
    
            const register_result = await userUtils.createUser(newUser);
            if (!register_result.success)
                return reply.code(500).send({ error: 'Failed to register Google user' });
    
            db_user = await userUtils.userEmailFindInDb(googleUser.email) as db_User;
        }
       
        const jwt_token = fastify.jwt.sign({
            id: db_user.id,
            email: db_user.email,
            username: db_user.username,
            role: db_user.user_role
        }, { expiresIn: '1h' });
    
        reply.setCookie('access_token', jwt_token, {
            httpOnly: true,
            path: '/',
        });
    
        userUtils.setIsOnline(true, db_user.id);
        return reply.redirect('/');

    });
}
