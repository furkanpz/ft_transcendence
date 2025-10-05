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
    const pending2 = await userFriendsUtils.getFriendPending(user.id);
    const pending_2 = pending2.map(friend => friend.user_id);
    const accepted = friends.filter(friend => friend.stat === friendstat.Accepted).map(friend => friend.friend_id);
    const pending = friends.filter(friend => friend.stat === friendstat.Pending).map(friend => friend.friend_id);

    const user_friends: {friend_id: number, username: string, avatar_url?: string, is_online: boolean}[] = [];
    const user_friends_request: {friend_id: number, username: string, avatar_url?: string}[] = [];
    const user_friends_pending: {friend_id: number, username: string, avatar_url?: string}[] = [];

    await accepted.forEach(async (id) => {
        const user = await userServices.userIdFindInDb(id);
        if (user)
        {
            user_friends.push({friend_id: id, username: user.username , avatar_url: user.avatar_url, is_online: user.is_online!})
        }
    });
    pending.forEach(async (id) => {
        const user = await userServices.userIdFindInDb(id);
        if (user)
        {
            user_friends_request.push({friend_id: id, username: user.username , avatar_url: user.avatar_url})
        }
    });
    pending_2.forEach(async (id) => {
        const user = await userServices.userIdFindInDb(id);
        if (user)
        {
            user_friends_pending.push({friend_id: id, username: user.username , avatar_url: user.avatar_url})
        }
    });
    return sendSuccess(response, "Friends retrieved successfully", { user_friends, user_friends_request, user_friends_pending });
}

export async function friendRequestController(request: FastifyRequest, response: FastifyReply) {
    const user = request.user as jwtUser;
    const isAdmin = user.role === userRole.admin;
    const {username, user_id, request_type} = request.body as { username: string, user_id?: number, request_type: friendstat };
    let targetUserId = user.id;

    const friend = await userServices.userFindInDb(username);
    if (!friend || !friend.id)
        return sendError(response, 400, "There is no such person!");

    const friend_id = friend.id;
    if (user_id && isAdmin)
        targetUserId = user_id;

    if (friend_id === targetUserId) {
        const msg = request_type === friendstat.Remove
            ? "You can't remove yourself!"
            : "You cannot add yourself as a friend!";
        return sendError(response, 400, msg);
    }

    const friend_db = await userServices.userIdFindInDb(friend_id);
    if (!friend_db)
        return sendError(response, 400, "There is no such person!");

    const requestSuccess = await userFriendsUtils.addFriend(targetUserId, friend_id, request_type);
    if (!requestSuccess) {
        const msg = request_type === friendstat.Remove
            ? "Friendship Not Removed!"
            : "Friend couldn't be added!";
        return sendError(response, 400, msg);
    }

    let message: string;
    switch (request_type) {
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

    const db_User = await userServices.userIdFindInDb(user.id) as db_User;
    const profileData = {
        id: db_User.id,
        username: db_User.username,
        email: db_User.email,
        avatar_url: db_User.avatar_url,
        created_at: db_User.created_at,
        role: db_User.user_role,
    };
    return sendSuccess(response, "User profile retrieved successfully", profileData);
}
export async function changePasswordController(request:FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
	const isAdmin = user.role === userRole.admin;
	const {user_id, password, new_password, new_re_password} = (request.body as 
        {
         user_id?: number, password: string,
         new_password: string, new_re_password: string
        });
	let targetUserId = user.id;
	if (user_id && isAdmin) 
		targetUserId = user_id;
	if (!password)
		return sendError(response, 400, "Password must not be empty!");
	if (new_password !== new_re_password)
		return sendError(response, 400, "Passwords do not match!");
	if (password === new_password)
		return sendError(response, 400, "New password cannot be the same as the old password!");
	const db_user = await userServices.userIdFindInDb(targetUserId) as db_User;
	if (!db_user?.id)
		return sendError(response, 400, "There is no such user");
	if (!isAdmin && !(await authServices.checkPW(db_user.password, password)))
		return sendError(response, 400, "Old password is incorrect!");
	await userServices.setNewPw(new_password, targetUserId);
	return sendSuccess(response, "Password changed successfully");
}

export async function blockUserController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const user = request.user as jwtUser;
    const isAdmin = user.role === userRole.admin;
    const {blocked_id, user_id} = request.body as { blocked_id: number, user_id?: number };
    let targetUserId = user.id;

    if (user_id && isAdmin)
        targetUserId = user_id;

    if (blocked_id === targetUserId) {
        return sendError(response, 400, "You cannot block yourself!");
    }

    const blockedUser = await userServices.userIdFindInDb(blocked_id);
    if (!blockedUser) {
        return sendError(response, 400, "There is no such user to block!");
    }

    await userFriendsUtils.blockUser(targetUserId, blocked_id);
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
    const { unBlockId: blocked_id } = request.params as { unBlockId: number };
    const {user_id} = request.query as {user_id?: number}
    let targetUserId = user.id;

    if (user_id && isAdmin)
        targetUserId = user_id;

    if (blocked_id === targetUserId) {
        return sendError(response, 400, "You cannot unblock yourself!");
    }

    const blockedUser = await userServices.userIdFindInDb(blocked_id);
    if (!blockedUser) {
        return sendError(response, 400, "There is no such user to unblock!");
    }

    const resp = await userFriendsUtils.getBlockedUserAndBlocker(blocked_id,targetUserId);
    if (!resp) {
        return sendError(response, 400, "This user is not blocked!");
    }
    return sendSuccess(response, "User unblocked successfully");
}