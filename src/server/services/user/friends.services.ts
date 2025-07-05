import { u_friendship, friendstat } from "../../types/user.types"
import { getDb } from "../../db/db.get"

export async function getFriends(user_id: number): Promise<u_friendship[]> {
	const db = await getDb();
	const friends = await db.all("SELECT friend_id, stat FROM ft_friendship WHERE user_id = ?", user_id);
	return (friends);
}


export async function getFriend(user_id: number, friend_id: number): Promise<u_friendship> {
	const db = await getDb();
	const friends = await db.get("SELECT * FROM ft_friendship WHERE user_id = ? AND friend_id = ?", user_id, friend_id) as u_friendship;
	return (friends);
}


export async function deleteFriendship(user_id: number, friend_id: number): Promise<void> {
  const db = await getDb();
  await db.run("DELETE FROM ft_friendship WHERE (user_id = ? AND friend_id = ?) OR (user_id = ? AND friend_id = ?)" , user_id, friend_id, friend_id, user_id);
}

export async function addFriend(user_id: number, friend_id: number, stat: friendstat): Promise<true | false> {
	const db = await getDb();
	if (stat == friendstat.Pending){
		const myself = await getFriend(user_id, friend_id);
		if (myself)
			return false;
		const friend = await getFriend(friend_id, user_id);
		if (friend)
			return (await addFriend(user_id, friend_id, friendstat.Accepted));
		await db.run("INSERT INTO ft_friendship (user_id, friend_id, stat) VALUES (?, ?, ?)", user_id, friend_id, stat);
		return true;
	}
	else if (stat == friendstat.Remove)
	{
		const myself = await getFriend(user_id, friend_id);
		if (!myself)
		{	
			const friend = await getFriend(friend_id, user_id);
			if (!friend)
				return false;
		}
		await deleteFriendship(user_id, friend_id);
		return true;
	}
	else
	{
		const friend = await getFriend(friend_id, user_id);
		if (friend && friend.stat == friendstat.Pending)
		{
			await db.run("UPDATE ft_friendship SET stat = ? WHERE id = ?", stat, friend.id);
			await db.run("INSERT INTO ft_friendship (user_id, friend_id, stat) VALUES (?, ?, ?)", user_id, friend_id, stat);
			return true;
		}
		return false;
	}
}

export async function getFriendsDetails(friends?: number[], user_id?: number) {
	const db = await getDb();

	if (!friends && !user_id)
		return [];

	let friendIds: number[] = [];

	if (friends && friends.length > 0) {
		friendIds = friends;
	} else if (user_id) {
		const rows = await db.all(
			"SELECT friend_id FROM friends WHERE user_id = ? AND stat = 'Accepted'",
			[user_id]
		);
		friendIds = rows.map(row => row.friend_id);
	}

	if (friendIds.length === 0)
		return [];

	const placeholders = friendIds.map(() => '?').join(', ');
	const query = `SELECT id, username, avatar_url, is_online FROM ft_users WHERE id IN (${placeholders})`;

	const result = await db.all(query, friendIds);
	return result;
}
