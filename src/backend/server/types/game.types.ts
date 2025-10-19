import { tournamentQueueController } from "../controller/game.controller";
import { ClassicGameInstance } from "../services/game/game.instance";

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

export { GameRoom, GameEvent, ClassicGameResult, TournamentGameResult, MultiplayerGameResult, GameType, PlayerState };