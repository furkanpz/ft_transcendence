import * as bcrypt from 'bcrypt'
import { getDb } from "../../db/db.get"
import { User } from "../../types/user.types"

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

export function checkPW(db_pw:string, user_pw:string): Promise<Boolean>{
	return (bcrypt.compare(user_pw, db_pw));
}

export async function setNewPw(new_pw: string, user_id: number): Promise<void> {
	const db = await getDb();
	const hashed_pw = await bcrypt.hash(new_pw, S_R);
	await db.run("UPDATE ft_users SET password = ? WHERE id = ?",hashed_pw, user_id);
}