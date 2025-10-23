import { WebSocket } from "ws";
import { Vector2 } from "./vector.types";

enum GameType {
	Classic = "classic",
	Tournament = "tournament",
	Multiplayer = "multiplayer"
}

interface GameRoom {
	id: string;
	players: number[];
	roomType: GameType;
	gameResult: ClassicGameResult | TournamentGameResult | MultiplayerGameResult | null;
}

interface GameEvent {
	type: "searchGame" | "start" | "playerJoined" | "error";
	roomType: GameType;
}

interface ClassicGameResult {
	player1Id: number;
	player2Id: number;
	player1Score: number;
	player2Score: number;
};

interface TournamentGameResult {
	tournamentId: number;
	playerId: number;
	score: number;
};

interface MultiplayerGameResult {
	team1Ids: number[];
	team2Ids: number[];
	team1Score: number;
	team2Score: number;
};

enum PlayerState {
	WAITING = "waiting",
	PLAYING = "playing",
	LEFT = "left",
}

interface Ball {
	pos: Vector2;
	dir: Vector2;
	radius: number;
	speed: number;
}

interface Player {
	id: number;
	pos: Vector2;
	dim: Vector2;
	speed: number;
	score: number;
	socket?: WebSocket;
	started: boolean;
}

enum PlayerKeys {
	UP,
	DOWN
}

interface ClassicGameUpdate {
		player1Pos: Vector2;
		player2Pos: Vector2;
		ballPos: Vector2;
}

interface ClassicScoreUpdate {
	player1Score: number;
	player2Score: number;
}

const HEIGHT: number = 600;
const WIDTH: number = 800;
const PLAYER_HEIGHT: number = 100;
const PLAYER_WIDTH: number = 15;
const PLAYER_GAP: number = 10;
const PLAYER_SPEED: number = 400;
const BALL_START_SPEED: number = 300;
const BALL_FIRST_HIT_SPEED: number = 450;
const BALL_SPEED_INC: number = 25;
const BALL_MAX_SPEED: number = 700;

export {
	GameRoom,
	GameEvent,
	ClassicGameResult,
	TournamentGameResult,
	MultiplayerGameResult,
	GameType,
	PlayerState,
	Ball,
	Player,
	PlayerKeys,
	ClassicGameUpdate,
	ClassicScoreUpdate,
	HEIGHT,
	WIDTH,
	PLAYER_HEIGHT,
	PLAYER_WIDTH,
	PLAYER_GAP,
	PLAYER_SPEED,
	BALL_START_SPEED,
	BALL_FIRST_HIT_SPEED,
	BALL_SPEED_INC,
	BALL_MAX_SPEED
};