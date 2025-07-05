// import { initializeDatabase } from '../db/init';
import { FastifyReply, FastifyRequest } from 'fastify';
import { friendstat, userRole, jwtUser } from '../types/user.types'
import * as userServices from '../services/user/user.services'
import * as userFriendsUtils from '../services/user/friends.services'

export async function adminFriendDetailsController(request: FastifyRequest, response: FastifyReply) {
	const user = request.user as jwtUser;
	const isAdmin = user.role === userRole.admin;
	if (!isAdmin)
		return (response.code(401).send({success: false, message: "Unauthorized Access"}));
	const params = request.params as {id: number};
	const friends = await userFriendsUtils.getFriends(params.id);
	const accepted = friends.filter(friend => friend.stat === friendstat.Accepted).map(friend => friend.friend_id);
	const pending = friends.filter(friend => friend.stat === friendstat.Pending).map(friend => friend.friend_id);
	response.send({
		success: true,
		accepted,
		pending
	});
	
}

export async function adminRoleUpdateController(request:FastifyRequest, response: FastifyReply) {
	const user = request.user as jwtUser;
	const isAdmin = user.role === userRole.admin;
	if (!isAdmin)
		return (response.code(401).send({success: false, message: "Unauthorized Access"}));
	const body = request.body as {newRole: userRole, user_id: number};
	const db_user = await userServices.userIdFindInDb(body.user_id);
	if (!db_user)
		return (response.code(400).send({success: false, message: "There is no such person!"}));
	await userServices.userRoleUpdate(body.user_id, body.newRole);
	return (response.code(200).send({success:true, message: "Role successfully updated!"}));
}