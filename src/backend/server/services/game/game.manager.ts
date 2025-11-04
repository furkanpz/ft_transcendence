import { WebSocket } from "ws"
import { GameType, GameRoom, PlayerState} from "../../types/game.types"
import { ClassicGameInstance, GameInstance } from "./game.instance";
import { tournamentManager } from "./tournament.manager";
import { MultiplayerGameInstance } from "./multigame.instance";

class GameManager
{
	public gameRooms: Map<string, GameRoom> = new Map();
	public gamesInstances: Map<string, GameInstance> = new Map();
	public playerSockets: Map<number, WebSocket> = new Map();
	public playerRoom: Map<number, string> = new Map();
	public playersState: Map<number, PlayerState> = new Map();
	
	public addPlayer(userId: number, socket: WebSocket) : boolean {
		this.playerSockets.set(userId, socket);

		const roomId = this.playerRoom.get(userId);
		if (!roomId) {
			console.log("Player not in a room");
			return false;
		}
		const room = this.gameRooms.get(roomId);
		if (!room) {
			console.log("Room not found");
			return false;
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
					if (room.roomType === GameType.Tournament) {
						// First: Force stop game and store result with current scores
						const gameInstance = this.gamesInstances.get(roomId);
						if (gameInstance) {
							try {
								gameInstance.forceStop();
								gameInstance.storeResult(); // This calls handleMatchResult with scores
								console.log(`Stored tournament match result for room ${roomId}`);
							} catch (e) {
								console.error('Failed to store forced result:', e);
							}
						}
						
						// Second: Notify tournament manager about disconnect (will only eliminate if match still in_progress)
						const tId = tournamentManager.getTournamentIdForPlayer(userId);
						if (tId) {
							try { 
								tournamentManager.onGameSocketClose(tId, userId); 
							} catch (e) { 
								console.error('Failed to notify tournament of disconnect:', e); 
							}
						}
						
						// Third: Notify other players that game ended
						const others = room.players.filter((id) => id !== userId);
						for (const otherId of others) {
							const s = this.playerSockets.get(otherId);
							if (s) {
								try { 
									s.send(JSON.stringify({ action: "gameEnded", result: { players: [] } })); 
								} catch (e) { 
									console.error('Failed to send gameEnded:', e); 
								}
							}
						}
					}
					room.players = room.players.filter((id) => this.playersState.get(id) !== PlayerState.LEFT);
					if (room.players.length === 0) {
						this.removeRoom(roomId);
						console.log(`Room ${roomId} deleted as all players left`);
					}
				}
			}
		});
		return true;
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
		switch (gameType) {
			case GameType.Classic:
				this.gamesInstances.set(roomId, new ClassicGameInstance(room.players, room));
				break;
			case GameType.Multiplayer:
				this.gamesInstances.set(roomId, new MultiplayerGameInstance(room.players, room));
				break;
			case GameType.Tournament:
				this.gamesInstances.set(roomId, new ClassicGameInstance(room.players, room));
				break;
			}
		console.log("Created room with id: " + room.id + " for players: " + userIds.join(", "));
		return room.id;
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

export const gameManager = new GameManager();