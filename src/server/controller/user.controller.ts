import { FastifyReply, FastifyRequest } from 'fastify';
import { db_User, friendstat, userRole, jwtUser } from '../types/user.types';
import * as userServices from '../services/user/user.services';
import * as userFriendsUtils from '../services/user/friends.services';
import { sendSuccess, sendError } from '../helpers/response';
import * as authServices from '../services/auth/auth.services';

export async function friendsDetailsController(request: FastifyRequest, response: FastifyReply) {
    const body = request.body as { friends: number[] };
    const data = await userFriendsUtils.getFriendsDetails(body.friends);
    return sendSuccess(response, "Friend details retrieved successfully", { data });
}

export async function friendsController(request: FastifyRequest, response: FastifyReply) {
    const user = request.user as jwtUser;
    const friends = await userFriendsUtils.getFriends(user.id);
    if (!friends)
        return sendSuccess(response, "No friends found", { accepted: null, pending: null });
    const accepted = friends.filter(friend => friend.stat === friendstat.Accepted).map(friend => friend.friend_id);
    const pending = friends.filter(friend => friend.stat === friendstat.Pending).map(friend => friend.friend_id);
    return sendSuccess(response, "Friends retrieved successfully", { accepted, pending });
}

export async function friendRequestController(request: FastifyRequest, response: FastifyReply) {
    const user = request.user as jwtUser;
    const isAdmin = user.role === userRole.admin;
    const body = request.body as { friend_id: number, user_id?: number, request_type: friendstat };
    let targetUserId = user.id;

    if (body.user_id && isAdmin)
        targetUserId = body.user_id;

    if (body.friend_id === targetUserId) {
        const msg = body.request_type === friendstat.Remove
            ? "You can't remove yourself!"
            : "You cannot add yourself as a friend!";
        return sendError(response, 400, msg);
    }

    const friend_db = await userServices.userIdFindInDb(body.friend_id);
    if (!friend_db)
        return sendError(response, 400, "There is no such person!");

    const requestSuccess = await userFriendsUtils.addFriend(targetUserId, body.friend_id, body.request_type);
    if (!requestSuccess) {
        const msg = body.request_type === friendstat.Remove
            ? "Friendship Not Removed!"
            : "Friend couldn't be added!";
        return sendError(response, 400, msg);
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
    return sendSuccess(response, message);
}

export async function userProfileController(request: FastifyRequest, response: FastifyReply) {
    const user = request.user as jwtUser;
    const profileData = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
    };
    return sendSuccess(response, "User profile retrieved successfully", profileData);
}
export async function changePasswordController(request:FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
	const isAdmin = user.role === userRole.admin;
	const body = (request.body as {user_id?: number, password: string, new_password: string, new_re_password: string});
	let targetUserId = user.id;
	if (body.user_id && isAdmin) 
		targetUserId = body.user_id;
	if (!body.password)
		return sendError(response, 400, "Password must not be empty!");
	if (body.new_password !== body.new_re_password)
		return sendError(response, 400, "Passwords do not match!");
	if (body.password === body.new_password)
		return sendError(response, 400, "New password cannot be the same as the old password!");
	const db_user = await userServices.userIdFindInDb(targetUserId) as db_User;
	if (!db_user?.id)
		return sendError(response, 400, "There is no such user");
	if (!isAdmin && !(await authServices.checkPW(db_user.password, body.password)))
		return sendError(response, 400, "Old password is incorrect!");
	await userServices.setNewPw(body.new_password, targetUserId);
	return sendSuccess(response, "Password changed successfully");
}

export async function blockUserController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const user = request.user as jwtUser;
    const isAdmin = user.role === userRole.admin;
    const body = request.body as { blocked_id: number, user_id?: number };
    let targetUserId = user.id;

    if (body.user_id && isAdmin)
        targetUserId = body.user_id;

    if (body.blocked_id === targetUserId) {
        return sendError(response, 400, "You cannot block yourself!");
    }

    const blockedUser = await userServices.userIdFindInDb(body.blocked_id);
    if (!blockedUser) {
        return sendError(response, 400, "There is no such user to block!");
    }

    await userFriendsUtils.blockUser(targetUserId, body.blocked_id);
    return sendSuccess(response, "User blocked successfully");
}

export async function getBlockedUsersController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const user = request.user as jwtUser;

    const blockedUsers = await userFriendsUtils.getBlockedUsers(user.id);
    return sendSuccess(response, "Blocked users retrieved successfully", { blockedUsers });
}

export async function unblockUserController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const user = request.user as jwtUser;
    const isAdmin = user.role === userRole.admin;
    const body = request.body as { blocked_id: number, user_id?: number };
    let targetUserId = user.id;

    if (body.user_id && isAdmin)
        targetUserId = body.user_id;

    if (body.blocked_id === targetUserId) {
        return sendError(response, 400, "You cannot unblock yourself!");
    }

    const blockedUser = await userServices.userIdFindInDb(body.blocked_id);
    if (!blockedUser) {
        return sendError(response, 400, "There is no such user to unblock!");
    }

    const resp = await userFriendsUtils.getBlockedUserAndBlocker(body.blocked_id,targetUserId);
    if (!resp) {
        return sendError(response, 400, "This user is not blocked!");
    }
    return sendSuccess(response, "User unblocked successfully");
}