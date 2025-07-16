import { getDb } from "../../db/db.get"
import { User, userRole, twoFactor } from "../../types/user.types"
import * as bcrypt from 'bcrypt'

const S_R = 10;


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

export async function getUser2FAStatus(user_id: number): Promise<boolean>
{
	const db = await getDb();
	const twofactorstatus = await db.get("SELECT twof_active FROM ft_users WHERE id = ?", user_id) as { twof_active?: number | boolean };
	return !!twofactorstatus?.twof_active;
}

export async function setUser2FA(user_id : number, t2type: boolean) {
	const db = await getDb();
	await db.run("UPDATE ft_users SET twof_active = ? WHERE id = ?", t2type, user_id);
}

export async function setTemp2FA(user_id: number, otp: string, secret: string) {
	const db = await getDb();
	const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 dakika sonrası
  	await db.run(`DELETE FROM ft_twof WHERE user_id = ?`, [user_id]);
	const stmt = `
    INSERT INTO ft_twof (user_id, twof_secret, twof_code, twof_expiry)
    VALUES (?, ?, ?, ?)
  `;
  await db.run(stmt, [user_id, secret, otp, expiry]);
}

export async function updateTemp2FAVerified(user_id: number, is_verified: boolean) {
	const db = await getDb();
	await db.run("UPDATE ft_twof SET is_verified = ? WHERE user_id = ?", is_verified, user_id);
}

export async function getTemp2FAVerified(user_id: number) : Promise<boolean> {
	const db = await getDb();
	const twofactorstatus = await db.get("SELECT is_verified FROM ft_twof WHERE user_id = ?", user_id);
	return !!twofactorstatus?.is_verified;
}

export async function get2FAOTP(user_id: number): Promise<twoFactor | null> {
	const db = await getDb();

	const db_otp = await db.get(
		`SELECT * FROM ft_twof 
		 WHERE user_id = ? 
		   AND twof_expiry > CURRENT_TIMESTAMP 
		   AND is_verified = FALSE
		 ORDER BY twof_expiry DESC LIMIT 1`,
		[user_id]
	);

	return db_otp ?? null;
}


export async function setNewPw(new_pw: string, user_id: number): Promise<void> {
	const db = await getDb();
	const hashed_pw = await bcrypt.hash(new_pw, S_R);
	await db.run("UPDATE ft_users SET password = ? WHERE id = ?",hashed_pw, user_id);
}

export async function getUserWithEmail(email: string): Promise<number | undefined> {
	const db = await getDb();
	const user = await db.get("SELECT id FROM ft_users WHERE email = ?", email);
	return (user);
}

export async function setTemp2FAForRecovery(user_id: number, otp: string) {
	const db = await getDb();
	const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
	const stmt = `
		UPDATE ft_twof
		SET twof_expiry = ?, is_verified = 1
		WHERE user_id = ? AND twof_code = ?
	`;
	await db.run(stmt, [expiry, user_id, otp]);
}

export async function getLatestValidVerifiedOTPByUser(user_id: number, twof_code: string) {
	const db = await getDb();
	const stmt = `
		SELECT * FROM ft_twof
		WHERE user_id = ?
		  AND twof_code = ?
		  AND is_verified = 1
		  AND twof_expiry > CURRENT_TIMESTAMP
		ORDER BY twof_expiry DESC
		LIMIT 1
	`;
	const row = await db.get(stmt, [user_id, twof_code]);
	if (row)
		return true;
	else
		return false;
}
