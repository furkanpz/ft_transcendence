import { FastifyReply, FastifyRequest } from 'fastify';
import { db_User, friendstat, userRole, jwtUser, User } from '../types/user.types';
import * as userServices from '../services/user/user.services';
import * as userFriendsUtils from '../services/user/friends.services';
import { sendSuccess, sendError } from '../helpers/response';
import * as authServices from '../services/auth/auth.services';
import { ensureDmRoom } from '../services/chat/chat.services';
import { chatManager } from '../services/chat/websocket.manager';
import { searchUsersByUsername } from '../services/user/user.services';

export async function otherUserProfileController(request: FastifyRequest, response: FastifyReply) {
    const { userId } = request.params as { userId: string };
    const targetId = parseInt(userId, 10);

    if (isNaN(targetId)) {
        return sendError(response, 400, "Invalid user id");
    }

    const db_User = await userServices.userIdFindInDb(targetId);
    if (!db_User) {
        return sendError(response, 404, "User not found");
    }

    // Return a sanitized public profile (no email)
    const profileData = {
        id: db_User.id,
        username: db_User.username,
        avatar_url: db_User.avatar_url,
        created_at: db_User.created_at,
        role: db_User.role,
        is_online: db_User.is_online ?? false,
    };
    return sendSuccess(response, "User profile retrieved successfully", profileData);
}

export async function otherUserDetailedStatsController(request: FastifyRequest, response: FastifyReply) {
    const { userId } = request.params as { userId: string };
    const targetId = parseInt(userId, 10);

    if (isNaN(targetId)) {
        return sendError(response, 400, "Invalid user id");
    }

    const targetUser = await userServices.userIdFindInDb(targetId);
    if (!targetUser) {
        return sendError(response, 404, "User not found");
    }

    const stats = await userServices.getUserDetailedStats(targetId);
    return sendSuccess(response, "Statistics retrieved successfully", { stats });
}

export async function otherUserMatchHistoryController(request: FastifyRequest, response: FastifyReply) {
    const { userId } = request.params as { userId: string };
    const { limit } = request.query as { limit?: string };
    const targetId = parseInt(userId, 10);

    if (isNaN(targetId)) {
        return sendError(response, 400, "Invalid user id");
    }

    const targetUser = await userServices.userIdFindInDb(targetId);
    if (!targetUser) {
        return sendError(response, 404, "User not found");
    }

    const matchLimit = limit ? parseInt(limit) : 20;
    const matches = await userServices.getUserMatchHistory(targetId, matchLimit);
    return sendSuccess(response, "Match history retrieved successfully", { matches });
}

export async function otherUserTournamentHistoryController(request: FastifyRequest, response: FastifyReply) {
    const { userId } = request.params as { userId: string };
    const { limit } = request.query as { limit?: string };
    const targetId = parseInt(userId, 10);

    if (isNaN(targetId)) {
        return sendError(response, 400, "Invalid user id");
    }

    const targetUser = await userServices.userIdFindInDb(targetId);
    if (!targetUser) {
        return sendError(response, 404, "User not found");
    }

    const tournamentLimit = limit ? parseInt(limit) : 10;
    const tournaments = await userServices.getUserTournamentHistory(targetId, tournamentLimit);
    return sendSuccess(response, "Tournament history retrieved successfully", { tournaments });
}
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

    const acceptedPromises = accepted.map(async (id) => {
        const user = await userServices.userIdFindInDb(id);
        if (user) {
            return {
                friend_id: id,
                username: user.username,
                avatar_url: user.avatar_url,
                is_online: user.is_online!
            };
        }
        return null;
    });
    const acceptedResults = await Promise.all(acceptedPromises);
    user_friends.push(...acceptedResults.filter(Boolean) as any);

    const requestPromises = pending.map(async (id) => {
        const user = await userServices.userIdFindInDb(id);
        if (user) {
            return {
                friend_id: id,
                username: user.username,
                avatar_url: user.avatar_url,
            };
        }
        return null;
    })
    const requestResults = await Promise.all(requestPromises);
    user_friends_request.push(...requestResults.filter(Boolean) as any);

    const pendingPromises = pending_2.map(async (id) => {
        const user = await userServices.userIdFindInDb(id);
        if (user) {
            return {
                friend_id: id,
                username: user.username,
                avatar_url: user.avatar_url,
            };
        }
        return null;
    })
    const pendingResults = await Promise.all(pendingPromises);
    user_friends_pending.push(...pendingResults.filter(Boolean) as any);

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

    let blockStats = await userFriendsUtils.getblockStatus(user.id, friend_id);
    if (blockStats)
    {
        return sendError(response, 400, "Friend couldn't be added!");
    }
    else
    {
        blockStats = await userFriendsUtils.getblockStatus(friend_id, user.id);
        if (blockStats)
            return sendError(response, 400, "Friend couldn't be added!");
    }
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
            try { await ensureDmRoom(targetUserId, friend_id); } catch {}
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
    console.log(user);

    const db_User = await userServices.userIdFindInDb(user.id);
    
    if (!db_User) {
        response.clearCookie("access_token");
        return sendError(response, 401, "User not found in database. Please login again.");
    }
    
    const profileData = {
        id: db_User.id,
        username: db_User.username,
        email: db_User.email,
        avatar_url: db_User.avatar_url,
        wins: db_User.wins || 0,
        losses: db_User.losses || 0,
        created_at: db_User.created_at,
        role: db_User.role,
    };
    return sendSuccess(response, "User profile retrieved successfully", profileData);
}

export async function userMatchHistoryController(request: FastifyRequest, response: FastifyReply) {
    const user = request.user as jwtUser;
    const { limit } = request.query as { limit?: string };
    
    const matchLimit = limit ? parseInt(limit) : 20;
    const matches = await userServices.getUserMatchHistory(user.id, matchLimit);
    
    return sendSuccess(response, "Match history retrieved successfully", { matches });
}

export async function userTournamentHistoryController(request: FastifyRequest, response: FastifyReply) {
    const user = request.user as jwtUser;
    const { limit } = request.query as { limit?: string };
    
    const tournamentLimit = limit ? parseInt(limit) : 10;
    const tournaments = await userServices.getUserTournamentHistory(user.id, tournamentLimit);
    
    return sendSuccess(response, "Tournament history retrieved successfully", { tournaments });
}

export async function userDetailedStatsController(request: FastifyRequest, response: FastifyReply) {
    const user = request.user as jwtUser;
    const stats = await userServices.getUserDetailedStats(user.id);
    
    return sendSuccess(response, "Statistics retrieved successfully", { stats });
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

export async function changeUsernameController(request:FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
	const user = request.user as jwtUser;
    const {username} = (request.body as { username: string });

    const db_user = await userServices.userIdFindInDb(user.id) as User;
    if (!username || username.length == 0)
		return sendError(response, 400, "Username must not be empty!");
    if (db_user.username == username)
		return sendError(response, 400, "New username cannot be the same as the old username!");

    const findsomeone = await userServices.userFindInDb(username);
    if (findsomeone)
		return sendError(response, 400, "That username isn’t available.");
    await userServices.setNewUsername(username, user.id);
	return sendSuccess(response, "Username changed successfully");
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

    const blockedUsersid = await userFriendsUtils.getBlockedUsers(user.id);
    const blockedUsers: {user_id: number, username: string, avatar_url: string}[] = [];
    const blockuserPromises = blockedUsersid.map(async (id) =>{
        const user = await userServices.userIdFindInDb(id);
        if (user) {
            return {
                user_id: user.id,
                username: user.username,
                avatar_url: user.avatar_url
            };
        }
        return null;
    });
    const blockuserResults = await Promise.all(blockuserPromises);
    blockedUsers.push(...blockuserResults.filter(Boolean) as any);
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

    const resp = await userFriendsUtils.getBlockedUserAndBlocker(blocked_id, targetUserId);
    if (!resp) {
        return sendError(response, 400, "This user is not blocked!");
    }
    else
        await userFriendsUtils.unblockUser(targetUserId, blocked_id);
    return sendSuccess(response, "User unblocked successfully");
}

export async function imageUploadController(request: FastifyRequest, response: FastifyReply): Promise<FastifyReply> {
    const user = request.user as jwtUser;
    
    try {
        const data = await request.file();
        
        if (!data) {
            return (sendError(response, 400, "No file uploaded"));
        }
        const currentUser = await userServices.userIdFindInDb(user.id);
        const avatarService = await import('../services/user/avatar.services');
        const result = await avatarService.uploadAvatar(data, user.id);
        
        if (!result.success) {
            return (sendError(response, 400, result.message || "Failed to upload avatar"));
        }
        if (currentUser?.avatar_url) {
            await avatarService.deleteOldAvatar(currentUser.avatar_url);
        }
        await userServices.setUserImage(user.id, result.url!);

        try {
            chatManager.broadcastToAll({
                type: 'avatar_updated',
                data: { username: (await userServices.userIdFindInDb(user.id))?.username || user.username, avatar_url: result.url }
            });
        } catch (e) {
        }

        return sendSuccess(response, "Avatar uploaded successfully!", {
            avatar_url: result.url
        });
    } catch (error: any) {
        console.error('Avatar upload error:', error);
        return (sendError(response, 500, "Internal server error during avatar upload"));
    }
}

export async function getUserIdByUsernameController(request: FastifyRequest, response: FastifyReply) {
    const { username } = request.params as { username: string };
    
    if (!username) {
        return sendError(response, 400, "Username is required");
    }
    
    const user = await userServices.userFindInDb(username);
    
    if (!user) {
        return sendError(response, 404, "User not found");
    }
    
    return sendSuccess(response, "User ID retrieved", { userId: user.id });
}

export async function usersDetailsByUsernameController(request: FastifyRequest, response: FastifyReply) {
    const body = request.body as { usernames: string[] };
    const usernames = Array.isArray(body?.usernames) ? body.usernames : [];
    if (usernames.length === 0) {
        return sendSuccess(response, "", { data: [] });
    }
    const results: { username: string; avatar_url?: string }[] = [];
    for (const uname of usernames) {
        const u = await userServices.userFindInDb(uname);
        if (u) {
            results.push({ username: u.username, avatar_url: u.avatar_url });
        }
    }
    return sendSuccess(response, "", { data: results });
}

export async function searchUsersController(request: FastifyRequest, response: FastifyReply) {
    const { q, limit } = request.query as { q?: string, limit?: string };
    const query = (q || '').trim();
    if (!query) {
        return sendSuccess(response, 'ok', { users: [] });
    }
    const lim = limit ? Math.min(50, Math.max(1, parseInt(limit))) : 20;
    const users = await searchUsersByUsername(query, lim);
    return sendSuccess(response, 'ok', { users });
}