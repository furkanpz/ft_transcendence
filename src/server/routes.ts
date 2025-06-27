// import { initializeDatabase } from '../db/init';
import { FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import { db_User, User, friendstat, userRole, jwtUser } from './types/user.types'
import * as userUtils from './services/user.services'

const usernameKeySchema = { 
	type:					'string',
	minLength:				3,
	maxLength:				36,
	pattern:				'^[a-zA-Z0-9_]+$'
}

const passwordKeySchema = { 
		type:		'string',
		minLength:	6,
		maxLength:	64,
	}
const emailKeySchema = { type: 'string',
			format:				"email",
			maxLength:		320,
			minLength:		4,
			}

const loginSchema = {
	body: {
		required:			['username', 'password'],
		type: 'object',
		properties: {
			username:		usernameKeySchema,
			password:		passwordKeySchema
		}
	},
};

const registerSchema = {
	body: {
		required:			['email', 'username', 'password'],
		type: 'object',
		properties: {
			email:			emailKeySchema,
			username:		usernameKeySchema,
			password:		passwordKeySchema
			
		}
	},
};

const friendRequestSchema = {
	body: {
		required: 			['friend_id', "request_type"],
		type: 'object',
		properties: {
			friend_id:		{type: 'number'},
			user_id:		{type: 'number'},
			request_type:	{type: 'string',
							enum:		[friendstat.Accepted, friendstat.Pending, friendstat.Remove]},
		}
	},
};

const passwordSchema = {
	body:{
		required: 			['password', 'new_password', 'new_re_password'],
		type: 'object',
		properties: {
			user_id:		{type: 'number'},
			password:		passwordKeySchema,
			new_password:	passwordKeySchema,
			new_re_password:passwordKeySchema
		},
	},
}

const roleSchema = {
	body: {
		required:			['newRole', 'user_id'],
		type: 'object',
		properties:{
			newRole: 		{type: 'string',
				enum:		[userRole.admin, userRole.user]},
			user_id:		{type: 'number'}
			},
	}
}

export function InitFriendsRoutes(server: FastifyInstance)
{
	server.post("/api/friends/request", {preHandler: server.authenticate, schema: friendRequestSchema},
				async (request: FastifyRequest, response: FastifyReply) => {
		const user = request.user as jwtUser;
		const isAdmin = user.role === userRole.admin;
		const body = isAdmin
			? (request.body as { friend_id: number, user_id: number, request_type: friendstat})
			: (request.body as { friend_id: number, user_id?: number, request_type: friendstat});
		let targetUserId = isAdmin ? body.user_id : user.id;
		if (body.friend_id == targetUserId)
		{	
			const msg =
			body.request_type === friendstat.Remove
			? "You can't remove yourself!"
			: "You cannot add yourself as a friend!";
			return response.code(400).send({ success: false, message: msg });
		}
		const friend_db = await userUtils.userIdFindInDb(body.friend_id);
		if (!friend_db)
			return (response.code(400).send({success: false, message: "There is no such person!"}));
		if (!targetUserId) targetUserId = user.id;
		const requestSuccess = await userUtils.addFriend(targetUserId, body.friend_id, body.request_type);
		if (!requestSuccess)
		{	
		const msg =
		body.request_type === friendstat.Remove
		? "Friendship Not Removed!"
		: "Friend couldn't be added!";
		return response.code(400).send({ success: false, message: msg });
		}
		let message: string;
		switch (body.request_type) {
			case friendstat.Accepted:
			message = "Friend is added!";
			break;
			case friendstat.Remove:
			message = "Friendship Removed";
			break;
			default:
			message = "Friend request sent!";
			break;
		}
		return response.code(200).send({success: requestSuccess, message: message});
	});

	server.get("/api/friends", { preHandler: server.authenticate }, async (request: FastifyRequest, response: FastifyReply) => {
		const user = request.user as jwtUser;
		const friends = await userUtils.getFriends(user.id);
		if (!friends)
			return (response.code(200).send({success: true, accepted: null, pending: null}))
		const accepted = friends.filter(friend => friend.stat === friendstat.Accepted).map(({ stat, ...rest }) => rest);
		const pending = friends.filter(friend => friend.stat === friendstat.Pending).map(({ stat, ...rest }) => rest);
		response.send({
			success: true,
			accepted,
			pending
		});
	});
	server.get("/api/friends/:id", {preHandler: server.authenticate}, async (request: FastifyRequest, response: FastifyReply) => {
		const user = request.user as jwtUser;
		const isAdmin = user.role === userRole.admin;
		if (!isAdmin)
			return (response.code(401).send({success: false, message: "Unauthorized Access"}));
		const params = request.params as {id: number};
		const friends = await userUtils.getFriends(params.id);
		const accepted = friends.filter(friend => friend.stat === friendstat.Accepted).map(({ stat, ...rest }) => rest);
		const pending = friends.filter(friend => friend.stat === friendstat.Pending).map(({ stat, ...rest }) => rest);
		response.send({
			success: true,
			accepted,
			pending
		});
	});
}

export function InitRoutes(server: FastifyInstance) {
	server.get("/", () => {
		return "TRANSBABAYA HG"
	});

	server.post("/api", async (request: FastifyRequest, response: FastifyReply) => {
		return "FT_TRANSDENCE API";
	});
	server.post("/api/register", {schema: registerSchema }, 
								  async (request: FastifyRequest, response: FastifyReply) => {
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
		const ret_message = await userUtils.createUser(user);
		if (!ret_message.success)
			return response.code(409).send(ret_message);
		return response.code(201).send(ret_message);
	});

	server.post("/api/login",{
		schema: loginSchema
	},  async (request: FastifyRequest, response: FastifyReply) => {
		const user = request.body as {username: string, password: string};
		const db_user = await userUtils.userFindInDb(user.username) as db_User;

		if (!db_user || !(await userUtils.checkPW(db_user.password, user.password)))
			return (response.code(401).send({success: false, message: "Invalid Username or Password!"}));
		const token = server.jwt.sign({
			id: db_user.id,
			email: db_user.email,
			username: user.username,
			role: db_user.user_role,
		}, {expiresIn : '1h'});

		response.setCookie('access_token', token, {
			httpOnly: true,
			path: '/',
			// secure: true only https durumu
		});
		userUtils.setIsOnline(true, db_user.id);
		return ({success: true, access_token: token});
	});

	server.post("/api/password", {preHandler:server.authenticate, schema: passwordSchema},
								 async (request:FastifyRequest, response: FastifyReply) => {
		const user = request.user as jwtUser;
		const isAdmin = user.role === userRole.admin;
		const body = isAdmin
		? (request.body as {user_id: number, password: string, new_password: string, new_re_password: string})
		: (request.body as {user_id?: number, password: string, new_password: string, new_re_password: string});
		if (!body.user_id) body.user_id = user.id;
		const targetUserId = isAdmin ? body.user_id  : user.id;
		if (!body.password)
			return (response.code(400).send({success:false, message:"Password not be empty!"}))
		if (body.new_password != body.new_re_password)
			return (response.code(400).send({success:false, message:"Password do not match!"}));
		if (body.password == body.new_password)
			return (response.code(400).send({success:false, message:"Your password cannot be the same as the old password!"}));
		const db_user = await userUtils.userIdFindInDb(targetUserId) as db_User;
		if (!isAdmin && !(await userUtils.checkPW(db_user.password, body.password)))
			return (response.code(400).send({success:false, message:"Old password is wrong!"}));
		if (!db_user.id)
			response.code(400).send({success:false, message: "There is no such user"});
		userUtils.setNewPw(body.new_password, targetUserId);
		return (response.code(200).send({success:true, message: "Pasword changed!"}));
	});

	server.get("/logout", {preHandler: server.authenticate}, async (request: FastifyRequest, response: FastifyReply) => {
		const user = request.user as {username: string, email: string, id: number, role: userRole};
		response.clearCookie("access_token");
		userUtils.setIsOnline(false, user.id);
		return ({success: true, message:"Logout"});
	});
	server.get("/profile", {preHandler: server.authenticate}, async (request: FastifyRequest, response: FastifyReply) => {
		
		return "PROFIL HG"
	})

	server.post("/api/roleUpdate", {preHandler: server.authenticate, schema: roleSchema
		}, async (request: FastifyRequest, response: FastifyReply) => {
			const user = request.user as jwtUser;
			const isAdmin = user.role === userRole.admin;
			if (!isAdmin)
				return (response.code(401).send({success: false, message: "Unauthorized Access"}));
			const body = request.body as {newRole: userRole, user_id: number};
			const db_user = await userUtils.userIdFindInDb(body.user_id);
			if (!db_user)
				return (response.code(400).send({success: false, message: "There is no such person!"}));
			await userUtils.userRoleUpdate(body.user_id, body.newRole);
			return (response.code(200).send({success:true, message: "Role successfully updated!"}));
	});
	InitFriendsRoutes(server);
};

1