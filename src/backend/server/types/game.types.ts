enum RoomType {
	Classic = "classic",
	Tournament = "tournament",
	Multiplayer = "multiplayer"
}

interface Player {
	id: number;
	name: string;
	roomId: string | null;
	isWaiting: boolean;
}

interface GameRoom {
	id: string;
	players: Player[]; // always index 0 owner of room
	maxPlayer: number;
	roomType: RoomType
}

interface GameEvent {
	type: "searchGame" | "start" | "playerJoined" | "error";
	roomType: RoomType;
}

interface GameResult {
	player1_id: number;
	player2_id: number;
	winner_id: number;
	loser_id: number;
	p1_score: number;
	p2_score: number;
}

export { Player, GameRoom, GameEvent, GameResult, RoomType };