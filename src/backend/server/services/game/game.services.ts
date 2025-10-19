import { getDb } from "../../db/db.get"
import { ClassicGameResult } from "../../types/game.types"

export async function classicGameResultInit(gameResult: ClassicGameResult): Promise<void> {
    const db = await getDb();

    const winnerId = gameResult.player1Score > gameResult.player2Score ? gameResult.player1Id : gameResult.player2Id;
    const loserId = gameResult.player1Score > gameResult.player2Score ? gameResult.player2Id : gameResult.player1Id;
    await db.run("INSERT INTO ft_match_history (player1_id, player2_id, winner_id, loser_id, p1_score, p2_score) VALUES (?, ?, ?, ?, ?, ?)",
        gameResult.player1Id, gameResult.player2Id, winnerId, loserId, gameResult.player1Score, gameResult.player2Score
     );
}

