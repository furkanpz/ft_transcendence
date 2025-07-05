import { getDb } from "../../db/db.get"
import { User, userRole } from "../../types/user.types"


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

export async function userEmailFindInDb(email: string): Promise<User | null> {
	const db = await getDb();
	const user = await db.get("SELECT * FROM ft_users WHERE email = ?", email);
	if (!user)
		return null;
	return (user);
}

export async function setIsOnline(online: boolean, user_id: number): Promise<void> {
	const db = await getDb();
	await db.run("UPDATE ft_users SET is_online = ? WHERE id = ?", online, user_id);
	if (online)
		await db.run("UPDATE ft_users SET last_login = CURRENT_TIMESTAMP WHERE id = ?", user_id);
}



export async function userRoleUpdate(user_id: number, newRole: userRole): Promise<void> {
	const db = await getDb(); 
	await db.run("UPDATE ft_users SET user_role = ? WHERE id = ?", newRole, user_id);

}

