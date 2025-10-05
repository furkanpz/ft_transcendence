interface Team {
	id: number;
	score: number;
	size: number;
	players: Player[];
}

enum RoomStatus {
	Waiting = "Waiting",
	Playing = "Playing",
	Completed = "Completed",
}

interface RoomState {
	teams: Team[] | null;
	state: RoomStatus;
}

interface GameState {
	players: Player[];
	teams: Team[];
}

interface Player {
	id: number;
	name: string;
	isReady: boolean;
	team: Team | null;
	roomId: string | null;
}

interface RoomSettings {
	maxPlayer: number;
	isPrivate: boolean;
	password: string | null;
	teamCount: number;
}

interface GameRoom {
	id: string;
	players: Player[]; // always index 0 owner of room
	maxPlayer: number;
	teamCount: number;
	isPrivate: boolean;
	password: string | null;
	state: RoomState;
	gameState: GameState | null;
}

interface GameEvent {
	type: "createRoom" | "roomCreated" | "joinRoom" | "playerJoined"
		| "leaveRoom" | "playerLeft" | "selectTeam" | "ready" | "start" | "error";
	data: any;
}

interface GameResult {
	player1_id: number;
	player2_id: number;
	winner_id: number;
	loser_id: number;
	p1_score: number;
	p2_score: number;
}

export { Team, RoomStatus, RoomState, GameState, Player, RoomSettings, GameRoom, GameEvent, GameResult };