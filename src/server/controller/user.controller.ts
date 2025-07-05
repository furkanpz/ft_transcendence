// import { initializeDatabase } from '../db/init';
import { FastifyInstance, FastifyReply, FastifyRequest} from 'fastify';
import { db_User, friendstat, userRole, jwtUser } from '../types/user.types'
import * as userServices from '../services/user/user.services'
import * as userFriendsUtils from '../services/user/friends.services'

export async function friendsDetailsController(request: FastifyRequest, response: FastifyReply) {
	// const user = request.user as jwtUser;
	const body = request.body as {friends: number[]};
	const data = await userFriendsUtils.getFriendsDetails(body.friends);
	response.code(200).send({
		success: true,
		data
	})
}

export async function friendsController(request: FastifyRequest, response: FastifyReply) {
	const user = request.user as jwtUser;
	const friends = await userFriendsUtils.getFriends(user.id);
	if (!friends)
		return (response.code(200).send({success: true, accepted: null, pending: null}))
	const accepted = friends.filter(friend => friend.stat === friendstat.Accepted).map(friend => friend.friend_id);
	const pending = friends.filter(friend => friend.stat === friendstat.Pending).map(friend => friend.friend_id);
	response.send({
		success: true,
		accepted,
		pending
	});	
}

export async function friendRequestController(request: FastifyRequest, response: FastifyReply) {
	const user = request.user as jwtUser;
	const isAdmin = user.role === userRole.admin;
	const body = (request.body as { friend_id: number, user_id?: number, request_type: friendstat})
	let targetUserId = user.id;
	if (body.user_id && isAdmin)
		targetUserId = body.user_id;
	if (body.friend_id == targetUserId)
	{	
		const msg = body.request_type === friendstat.Remove
		? "You can't remove yourself!"
		: "You cannot add yourself as a friend!";
		return response.code(400).send({ success: false, message: msg });
	}
	const friend_db = await userServices.userIdFindInDb(body.friend_id);
	if (!friend_db)
		return (response.code(400).send({success: false, message: "There is no such person!"}));
	if (!targetUserId) targetUserId = user.id;
	const requestSuccess = await userFriendsUtils.addFriend(targetUserId, body.friend_id, body.request_type);
	if (!requestSuccess)
	{	
	const msg = body.request_type === friendstat.Remove
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
}

export async function userProfileController(request: FastifyRequest, response: FastifyReply) {
	const user = request.user as jwtUser;
	const body = request.body;
	return response.code(200).send(`Id: ${user.id}, User: ${user.username}, Email: ${user.email}, Role: ${user.role}`)
}