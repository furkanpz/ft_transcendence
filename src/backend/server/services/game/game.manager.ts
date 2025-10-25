import { WebSocket } from "ws"
import { GameType, GameRoom, ClassicGameResult, PlayerState} from "../../types/game.types"
import { ClassicGameInstance } from "./game.instance";
import { tournamentManager } from "./tournament.manager";
import { getDb } from "../../db/db.get";

class ClassicGameManager
{
	public gameRooms: Map<string, GameRoom> = new Map();
	public gamesInstances: Map<string, ClassicGameInstance> = new Map();
	public playerSockets: Map<number, WebSocket> = new Map();
	public playerRoom: Map<number, string> = new Map();
	public playersState: Map<number, PlayerState> = new Map();
	
	public addPlayer(userId: number, socket: WebSocket) : void {
		this.playerSockets.set(userId, socket);

		const roomId = this.playerRoom.get(userId);
		if (!roomId) {
			console.log("Player not in a room");
			return;
		}
		const room = this.gameRooms.get(roomId);
		if (!room) {
			console.log("Room not found");
			return;
		}
		this.playersState.set(userId, PlayerState.PLAYING);
		if (room.players.every((id) => this.playersState.get(id) === PlayerState.PLAYING)) {
			const game = this.gamesInstances.get(roomId);
			room.players.forEach((playerId) => {
				game?.setSocketForPlayer(playerId, this.playerSockets.get(playerId)!);
			});
			game?.startGame();
			console.log(`All players in room ${roomId} are ready. Starting game...`);
		}
		socket.send(JSON.stringify({players : room.players}));

		socket.on("close", () => {
			this.playerSockets.delete(userId);
			this.playersState.set(userId, PlayerState.LEFT);
			console.log(`Player ${userId} disconnected from room`);
			const roomId = this.playerRoom.get(userId);
			if (roomId) {
				const room = this.gameRooms.get(roomId);
				if (room) {
					room.players = room.players.filter((id) => this.playersState.get(id) !== PlayerState.LEFT);
					if (room.players.length === 0) {
						this.removeRoom(roomId);
						console.log(`Room ${roomId} deleted as all players left`);
					}
				}
			}
		});
	}

	public createRoom(userIds : number[], gameType : GameType) : string
	{
		const roomId = this.generateRoomId();
		const room : GameRoom = {
			id: roomId,
			players: userIds,
			roomType: gameType,
			gameResult: null,
		};
		this.gameRooms.set(room.id, room);
		userIds.forEach((value) => this.playersState.set(value, PlayerState.WAITING));
		userIds.forEach((value) => this.playerRoom.set(value, room.id));
		this.gamesInstances.set(roomId, new ClassicGameInstance(room.players[0], room.players[1], room));
		console.log("Created room with id: " + room.id + " for players: " + userIds.join(", "));
		return room.id;
	}

	public async finishGame(roomId: string) : Promise<void>
	{
		const room = this.gameRooms.get(roomId);
		if (!room) return;

		const gameInstance = this.gamesInstances.get(roomId);
		if (!gameInstance) return;

		const player1Id = room.players[0];
		const player2Id = room.players[1];
		const player1Score = gameInstance.player1.score;
		const player2Score = gameInstance.player2.score;

		this.playerSockets.forEach((socket, userId) => {
			if (room.players.includes(userId)) {
				socket.send(JSON.stringify({
					action: "gameEnded",
					result: {
						player1Id,
						player2Id,
						player1Score,
						player2Score,
					} as ClassicGameResult
				}));
			}
		});

		if (room.roomType === GameType.Tournament) {
			await tournamentManager.handleMatchResult(roomId, player1Id, player2Id, player1Score, player2Score);
		} else if (room.roomType === GameType.Classic) {
			const db = await getDb();
			const winnerId = player1Score > player2Score ? player1Id : player2Id;
			const loserId = player1Score > player2Score ? player2Id : player1Id;
			
			await db.run(
				`INSERT INTO ft_match_history 
				 (player1_id, player2_id, winner_id, loser_id, p1_score, p2_score, match_type) 
				 VALUES (?, ?, ?, ?, ?, ?, 'classic')`,
				[player1Id, player2Id, winnerId, loserId, player1Score, player2Score]
			);
		}

		this.removeRoom(roomId);
	}

	public removeRoom(roomId : string) : void
	{
		const room = this.gameRooms.get(roomId);
		const gameInstance = this.gamesInstances.get(roomId);
		if (gameInstance) {
			gameInstance.forceStop();
			this.gamesInstances.delete(roomId);
			console.log(`Game instance for room ${roomId} stopped and removed`);
		}
		if (room) {
			if (room.gameResult) {
				const gameResult = room.gameResult as ClassicGameResult;
				console.log(`Game result for room ${roomId}: Player 1 (ID: ${gameResult.player1Id}) Score: ${gameResult.player1Score}, Player 2 (ID: ${gameResult.player2Id}) Score: ${gameResult.player2Score}`);
			}
			else {
				console.log(`Game ended for room ${roomId} with no result recorded.`);
			}
			room.players.forEach((value) => {
				this.playerRoom.delete(value);
				this.playersState.delete(value);
			});
			this.gameRooms.delete(roomId);
			console.log(`Room ${roomId} removed`);
		}
	}

	public generateRoomId() : string
	{
  		return crypto.randomUUID();
	}
}

export const classicGameManager = new ClassicGameManager();