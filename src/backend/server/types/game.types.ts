enum GameType {
	Classic = "classic",
	Tournament = "tournament",
	Multiplayer = "multiplayer"
}

interface GameRoom {
	id: string;
	players: number[];
	roomType: GameType
}

interface GameEvent {
	type: "searchGame" | "start" | "playerJoined" | "error";
	roomType: GameType;
}

interface GameResult {
	player1_id: number;
	player2_id: number;
	winner_id: number;
	loser_id: number;
	p1_score: number;
	p2_score: number;
}

export { GameRoom, GameEvent, GameResult, GameType };