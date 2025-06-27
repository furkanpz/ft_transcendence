import { fstat } from "fs";
import { getDb } from "../db/database"
import { User, u_friendship, friendstat, userRole } from "../types/user.types"
import * as bcrypt from 'bcrypt'

const S_R = 10;

export async function createUser(new_user: User): Promise<{success: boolean; message? : string; user?: User}>
{
	const db = await getDb();
	if (!new_user.password)
		return { success: false, message: "Password is required" };
	const new_hash_pass = await bcrypt.hash(new_user.password, S_R)
	try {
		const db_user = await db.run('INSERT INTO ft_users (email, username, password) VALUES (?, ?, ?)',
			new_user.email,
			new_user.username,
			new_hash_pass);
		
		return { success: true, user: {
			"id": db_user.lastID,
			"email": new_user.email,
			"username": new_user.username,
		}};
	}
	catch (err: any)
	{
		if (err.code == "SQLITE_CONSTRAINT")
		{
			if (err.message.includes('email')) {
				return { success: false, message: 'This email is already registered.'};
			} 
			else if (err.message.includes('username')) {
				return { success: false, message: 'This username is already registered.' };
			} 
			else {
				return { success: false, message: 'Unique field collision'};
			}
		}
		console.error("DB Error:", err);
		return { success: false, message: "Internal server error" };
	}
}


export async function userFindInDb(user_name: string): Promise<User | null> {
	const db = await getDb();
	const user = await db.get("SELECT * FROM ft_users WHERE username = ?", user_name);
	if (!user)
		return null;
	return (user);
}

export async function userIdFindInDb(id: number): Promise<User | null> {
	const db = await getDb();
	const user = await db.get("SELECT * FROM ft_users WHERE id = ?", id);
	if (!user)
		return null;
	return (user);
}

export function checkPW(db_pw:string, user_pw:string): Promise<Boolean>{
	return (bcrypt.compare(user_pw, db_pw));
}

export async function setNewPw(new_pw: string, user_id: number): Promise<void> {
	const db = await getDb();
	const hashed_pw = await bcrypt.hash(new_pw, S_R);
	await db.run("UPDATE ft_users SET password = ? WHERE id = ?",hashed_pw, user_id);
}

export async function setIsOnline(online: boolean, user_id: number): Promise<void> {
	const db = await getDb();
	await db.run("UPDATE ft_users SET is_online = ? WHERE id = ?", online, user_id);
	if (online)
		await db.run("UPDATE ft_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", user_id);
}


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

export async function userRoleUpdate(user_id: number, newRole: userRole): Promise<void> {
	const db = await getDb(); 
	await db.run("UPDATE ft_users SET user_role = ? WHERE id = ?", newRole, user_id);

}