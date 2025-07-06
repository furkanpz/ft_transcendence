import {FastifyReply, FastifyRequest} from 'fastify';
import * as userServices from '../services/user/user.services'
import * as authServices from '../services/auth/auth.services'
import { db_User, User, userRole, jwtUser } from '../types/user.types'
import server from '../server';
import crypto from 'crypto';
import { createJWT } from '../services/auth/jwt.services';

export async function loginController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.body as {username: string, password: string};
	const db_user = await userServices.userFindInDb(user.username) as db_User;

	if (!db_user || !(await authServices.checkPW(db_user.password, user.password)))
		return (response.code(401).send({success: false, message: "Invalid Username or Password!"}));
	const token = await createJWT(db_user);
	if (!token)
		return response.code(500).send({success:false,  message: 'Failed to generate token' });
	response.setCookie('access_token', token, {
		httpOnly: true,
		path: '/',
		sameSite: 'strict',
		// secure: true only https durumu
	});
	userServices.setIsOnline(true, db_user.id);
	return (response.code(200).send({success: true, access_token: token}).redirect("/"));
};

export async function logoutController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as {username: string, email: string, id: number, role: userRole};
	response.clearCookie("access_token");
	userServices.setIsOnline(false, user.id);
	return (response.code(200).send({success: true, message:"Logout"}));
};

export async function registerController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.body as User;
	if (!user.email || !user.username || !user.password) {
		return response.status(400).send({
			error: "Missing field!",
			missing: {
				email: !user.email,
				username: !user.username,
				password: !user.password
			}
		});
	}
	const ret_message = await authServices.createUser(user);
	if (!ret_message.success)
		return response.code(409).send(ret_message);
	return response.code(201).send(ret_message);
};

export async function googleAuthController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
		const { token } = await server.googleOAuth2.getAccessTokenFromAuthorizationCodeFlow(request);
        const access_token = token.access_token;

        if (!access_token) {
        return response.code(500).send({ error: 'Access token missing' });
        }
	
		const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: {
				Authorization: `Bearer ${token.access_token}`
			}
		});
		if (!res.ok) {
			const errJson = await res.json().catch(() => ({}));
			return response.code(res.status).send({success: false,  message: 'Failed to fetch user info from Google', ...errJson });
		}
		const googleUser = await res.json();
		if (!googleUser.email)
			return response.code(400).send({success: false, message: "Google account does not have a public email address."});
        let db_user = await userServices.userEmailFindInDb(googleUser.email) as db_User;
        if (!db_user) {
            const randomPassword = crypto.randomBytes(16).toString('hex'); 
            const newUser: User = {
                email: googleUser.email,
                username: googleUser.name.replace(/\s+/g, '_').toLowerCase(), 
                password: randomPassword,
            };
    
            const register_result = await authServices.createUser(newUser);
            if (!register_result.success)
                return response.code(500).send({ error: 'Failed to register Google user' });
    
            db_user = await userServices.userEmailFindInDb(googleUser.email) as db_User;
        }
       
        const jwt_token = await createJWT(db_user);
		if (!jwt_token)
			return response.code(500).send({success:false,  message: 'Failed to generate token' });
    
        response.setCookie('access_token', jwt_token, {
            httpOnly: true,
            path: '/',
        });
    
        userServices.setIsOnline(true, db_user.id);
        return response.redirect('/');
}

export async function changePasswordController(request:FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
	const isAdmin = user.role === userRole.admin;
	const body = (request.body as {user_id?: number, password: string, new_password: string, new_re_password: string});
	let targetUserId = user.id;
	if (body.user_id && isAdmin) 
		targetUserId = body.user_id;
	if (!body.password)
		return (response.code(400).send({success:false, message:"Password not be empty!"}))
	if (body.new_password != body.new_re_password)
		return (response.code(400).send({success:false, message:"Password do not match!"}));
	if (body.password == body.new_password)
		return (response.code(400).send({success:false, message:"Your password cannot be the same as the old password!"}));
	const db_user = await userServices.userIdFindInDb(targetUserId) as db_User;
	if (!isAdmin && !(await authServices.checkPW(db_user.password, body.password)))
		return (response.code(400).send({success:false, message:"Old password is wrong!"}));
	if (!db_user.id)
		response.code(400).send({success:false, message: "There is no such user"});
	authServices.setNewPw(body.new_password, targetUserId);
	return (response.code(200).send({success:true, message: "Pasword changed!"}));
}