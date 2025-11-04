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

export async function setUserImage(user_id : number, image: string) {
	const db = await getDb();
	await db.run("UPDATE ft_users SET avatar_url = ? WHERE id = ?", image, user_id);
}

export async function setTemp2FA(user_id: number, otp: string, secret: string) {
	const db = await getDb();
	const expiry = new Date(Date.now() + 5 * 60 * 1000).toISOString();
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

export async function setNewUsername(new_username: string, user_id: number): Promise<void> {
	const db = await getDb();
	await db.run("UPDATE ft_users SET username = ? WHERE id = ?",new_username, user_id);
}

export async function getUserWithEmail(email: string): Promise<number | undefined> {
	const db = await getDb();
	const user = await db.get("SELECT id FROM ft_users WHERE email = ?", email);
	if (user.id)
		return user.id;
	else
		return undefined;
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

export async function incrementUserWins(user_id: number): Promise<void> {
	// Skip for guest users (negative IDs)
	if (user_id < 0) return;
	
	const db = await getDb();
	await db.run("UPDATE ft_users SET wins = wins + 1 WHERE id = ?", user_id);
}

export async function incrementUserLosses(user_id: number): Promise<void> {
	// Skip for guest users (negative IDs)
	if (user_id < 0) return;
	
	const db = await getDb();
	await db.run("UPDATE ft_users SET losses = losses + 1 WHERE id = ?", user_id);
}

export async function getUserStats(user_id: number): Promise<{ wins: number, losses: number } | null> {
	// Return null for guest users
	if (user_id < 0) return null;
	
	const db = await getDb();
	const stats = await db.get("SELECT wins, losses FROM ft_users WHERE id = ?", user_id) as { wins: number, losses: number } | undefined;
	return stats || { wins: 0, losses: 0 };
}

export async function getUserDetailedStats(user_id: number): Promise<any> {
	// Return empty stats for guest users
	if (user_id < 0) return {
		totalMatches: 0,
		wins: 0,
		losses: 0,
		winRate: 0,
		totalTournaments: 0,
		tournamentWins: 0,
		tournamentLosses: 0,
		tournamentWinRate: 0
	};
	
	const db = await getDb();
	
	// Get basic win/loss stats from user table (includes both matches and tournaments)
	const basicStats = await db.get(
		"SELECT wins, losses FROM ft_users WHERE id = ?", 
		user_id
	) as { wins: number, losses: number } | undefined;
	
	const totalWins = basicStats?.wins || 0;
	const totalLosses = basicStats?.losses || 0;
	
	// Get tournament stats
	const tournamentStats = await db.get(
		`SELECT 
			COUNT(*) as total_tournaments,
			SUM(CASE WHEN t.winner_id = tp.user_id THEN 1 ELSE 0 END) as tournament_wins,
			SUM(CASE WHEN t.winner_id != tp.user_id THEN 1 ELSE 0 END) as tournament_losses
		FROM ft_tournament_participants tp
		JOIN ft_tournaments t ON tp.tournament_id = t.id
		WHERE tp.user_id = ? AND t.status = 'completed'`,
		user_id
	) as { total_tournaments: number, tournament_wins: number, tournament_losses: number } | undefined;
	
	const totalTournaments = tournamentStats?.total_tournaments || 0;
	const tournamentWins = tournamentStats?.tournament_wins || 0;
	const tournamentLosses = tournamentStats?.tournament_losses || 0;
	const tournamentWinRate = totalTournaments > 0 ? ((tournamentWins / totalTournaments) * 100).toFixed(1) : "0.0";
	
	// Calculate match-only stats (excluding tournaments)
	const matchWins = totalWins - tournamentWins;
	const matchLosses = totalLosses - tournamentLosses;
	const totalMatches = matchWins + matchLosses;
	const winRate = totalMatches > 0 ? ((matchWins / totalMatches) * 100).toFixed(1) : "0.0";
	
	return {
		totalMatches,
		wins: matchWins,
		losses: matchLosses,
		winRate: parseFloat(winRate),
		totalTournaments,
		tournamentWins,
		tournamentLosses,
		tournamentWinRate: parseFloat(tournamentWinRate)
	};
}

export async function saveMatchHistory(
	player1_id: number,
	player2_id: number,
	winner_id: number,
	loser_id: number,
	p1_score: number,
	p2_score: number,
	match_type: 'classic' | 'tournament' | 'multiplayer',
	tournament_id?: string
): Promise<void> {
	// Skip saving for guest users
	if (player1_id < 0 || player2_id < 0) return;
	
	const db = await getDb();
	await db.run(
		`INSERT INTO ft_match_history (player1_id, player2_id, winner_id, loser_id, p1_score, p2_score, match_type, tournament_id)
		 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		player1_id, player2_id, winner_id, loser_id, p1_score, p2_score, match_type, tournament_id || null
	);
}

export async function getUserMatchHistory(user_id: number, limit: number = 5): Promise<any[]> {
	// Return empty for guest users
	if (user_id < 0) return [];
	
	const db = await getDb();
	const matches = await db.all(
		`SELECT 
			m.*,
			u1.username as player1_username,
			u1.avatar_url as player1_avatar,
			u2.username as player2_username,
			u2.avatar_url as player2_avatar,
			w.username as winner_username
		FROM ft_match_history m
		JOIN ft_users u1 ON m.player1_id = u1.id
		JOIN ft_users u2 ON m.player2_id = u2.id
		JOIN ft_users w ON m.winner_id = w.id
		WHERE (m.player1_id = ? OR m.player2_id = ?)
		AND m.match_type != 'tournament'
		ORDER BY m.played_at DESC
		LIMIT ?`,
		user_id, user_id, limit
	);
	return matches || [];
}

export async function getUserTournamentHistory(user_id: number, limit: number = 5): Promise<any[]> {
	// Return empty for guest users
	if (user_id < 0) return [];
	
	const db = await getDb();
	const tournaments = await db.all(
		`SELECT 
			t.*,
			tp.final_position,
			tp.is_eliminated,
			w.username as winner_username,
			w.avatar_url as winner_avatar
		FROM ft_tournament_participants tp
		JOIN ft_tournaments t ON tp.tournament_id = t.id
		LEFT JOIN ft_users w ON t.winner_id = w.id
		WHERE tp.user_id = ? AND t.status = 'completed'
		ORDER BY t.completed_at DESC
		LIMIT ?`,
		user_id, limit
	);
	return tournaments || [];
}

export async function searchUsersByUsername(query: string, limit: number = 20): Promise<Array<{ id: number, username: string, avatar_url?: string, is_online: boolean }>> {
	const db = await getDb();
	const like = `%${query}%`;
	const rows = await db.all(
		`SELECT id, username, avatar_url, COALESCE(is_online, 0) as is_online
		 FROM ft_users
		 WHERE username LIKE ?
		 ORDER BY username COLLATE NOCASE ASC
		 LIMIT ?`,
		like, limit
	) as Array<{ id: number, username: string, avatar_url?: string, is_online: number }> | undefined;
	return (rows || []).map(r => ({ id: r.id, username: r.username, avatar_url: r.avatar_url, is_online: !!r.is_online }));
}
