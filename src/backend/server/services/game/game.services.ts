import { getDb } from "../../db/db.get"
import { GameResult } from "../../types/game.types"


export async function gameResultInit(gameResult: GameResult): Promise<void> {
    const db = await getDb();

    await db.run("INSERT INTO ft_match_history (player1_id, player2_id, winner_id, loser_id, p1_score, p2_score) VALUES (?, ?, ?, ?, ?, ?)",
        gameResult.player1_id, gameResult.player2_id, gameResult.winner_id, gameResult.loser_id, gameResult.p1_score, gameResult.p2_score
     );
}

