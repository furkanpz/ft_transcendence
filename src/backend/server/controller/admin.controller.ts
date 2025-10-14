import { FastifyReply, FastifyRequest } from 'fastify';
import { friendstat, userRole, jwtUser } from '../types/user.types'
import * as userServices from '../services/user/user.services'
import * as userFriendsUtils from '../services/user/friends.services'
import { sendSuccess, sendError } from '../helpers/response';

export async function adminFriendDetailsController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const user = request.user as jwtUser;
    const isAdmin = user.role === userRole.admin;
    if (!isAdmin)
        return sendError(response, 403, "Unauthorized Access");

    const params = request.params as { id: number };
    const friends = await userFriendsUtils.getFriends(params.id);
    const accepted = friends.filter(friend => friend.stat === friendstat.Accepted).map(friend => friend.friend_id);
    const pending = friends.filter(friend => friend.stat === friendstat.Pending).map(friend => friend.friend_id);

    return sendSuccess(response, "Friend details retrieved successfully", { accepted, pending });
}

export async function adminRoleUpdateController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const user = request.user as jwtUser;
    const isAdmin = user.role === userRole.admin;
    if (!isAdmin)
        return sendError(response, 403, "Unauthorized Access");

    const body = request.body as { newRole: userRole, user_id: number };
    const db_user = await userServices.userIdFindInDb(body.user_id);
    if (!db_user)
        return sendError(response, 400, "There is no such person!");

    await userServices.userRoleUpdate(body.user_id, body.newRole);
    return sendSuccess(response, "Role successfully updated!");
}