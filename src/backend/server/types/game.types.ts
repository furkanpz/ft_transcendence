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
	room: GameRoom | null;
	socket: any;
}

interface RoomSettings {
	maxPlayers: number;
	isPrivate: boolean;
	password: string | null;
	teamCount: number;
}

interface GameRoom {
	id: string;
	players: Player[]; // always index 0 owner of room
	maxPlayers: number;
	teamCount: number;
	isPrivate: boolean;
	password: string | null;
	state: RoomState;
	gameState: GameState | null;
}

interface GameEvent {
	type: "create" | "join" | "leave" | "team" | "ready" | "start";
	data: any;
}