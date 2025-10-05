import {WebSocket} from "ws"
import { RoomStatus, RoomType, Player, GameRoom, GameEvent, GameResult} from "../../types/game.types"
class GameManager {
	classicPlayers: Player[] = new Array();
	classicRooms: GameRoom[] = new Array();
	tournamentPlayers: Player[] = new Array();
	multiplayerPlayers: Player[] = new Array();
	players: Map<number, Player> = new Map();
	playersocket: Map<number, WebSocket> = new Map();

	addPlayer(userId: number, username: string, socket: WebSocket): boolean {
		if (this.players.has(userId)) return false;

		const player: Player = {
			id: userId,
			name: username,
			roomId: null,
			isWaiting: false
		};
 
		this.players.set(userId, player);
		this.playersocket.set(userId, socket);

		socket.on("close", () => {
			if (player.roomId) {
				this.leaveRoom(userId, player.roomId);
			}
			this.players.delete(userId);
		});

		socket.on("message", async (data: string) => {
			try {
				const message: GameEvent = JSON.parse(data);
				await this.handleMessage(userId, message);
			} catch (error) {
				console.error("Error parsing message:", error);
			}
		});
		return true;
	}

	async handleMessage(userId: number, event: GameEvent): Promise<void> {
		const player = this.players.get(userId);
		if (!player) return;

		console.warn(`Received event from user ${userId}:`, event);

		try {
			switch (event.type) {
				case "searchGame":
				{
					switch (event.roomType)
					{
						case "classic":
							this.classicGameSearch(userId);
							break;
						case "tournament":
							this.tournamentGameSearch(userId);
							break;
						case "multiplayer":
							this.multiplayerGameSearch(userId);
							break;
					}
					break;
				}
				case "playerLeft":
				case "start":
				case "error":
			}
	} catch (error: any) {
		console.error("Error handling message:", error);
		this.playersocket.get(userId)?.send(JSON.stringify({ type: "error", data: error.message }));
	}
	}

	classicGameSearch(userId: number) {
		const player = this.players.get(userId); 
		if (!player) {
			console.log("Player not connected");
			return;
		}
		if (!player.isWaiting) {
			console.log(`Player ${userId} is already playing`);
		}
		
		this.classicPlayers.push(this.players.get(userId));
		if (this.classicPlayers.length == 2) {
			this.classicRooms.push(this.createClassicRoom());
			this.classicPlayers.splice(0, 2).forEach((value) => value.isWaiting = false);
			return;
		}
		this.players.get(userId)!.isWaiting = true;
		this.playersocket.get(userId).send(JSON.stringify({type: "playerJoined", roomTyoe: RoomType.Classic}));
	}

	tournamentGameSearch(userId: number) {
		this.tournamentPlayers.push(this.players.get(userId));
		if (this.tournamentPlayers.length == 4) {
			this.tournamentRooms.push(this.createTournamentRoom());
			this.classicPlayers.splice(0, 4).forEach((value) => value.isWaiting = false);
			return;
		}
		this.players.get(userId)!.isWaiting = true;
	}

	multiplayerGameSearch(userId: number) {
		this.classicPlayers.push(this.players.get(userId));
		if (this.classicPlayers.length == 4) {
			this.classicRooms.push(this.createClassicRoom());
			this.classicPlayers.splice(0, 4).forEach((value) => value.isWaiting = false);
			return;
		}
		this.players.get(userId)!.isWaiting = true;
	}

	createClassicRoom(): GameRoom {
		const roomId = this.generateRoomId();

		const newRoom: GameRoom = {
			id: roomId,
			players: this.classicPlayers.slice(0, 1),
			maxPlayer: 2,
			roomType: RoomType.Classic
		};

		newRoom.players.forEach((value) => value.roomId = newRoom.id);
		console.log("created Classic game");
		return newRoom;
	}

	createTournamentRoom(): GameRoom {
		const roomId = this.generateRoomId();

		const newRoom: GameRoom = {
			id: roomId,
			players: this.tournamentPlayers.slice(0, 3),
			maxPlayer: 4,
			roomType: RoomType.Tournament
		};

		newRoom.players.forEach((value) => value.roomId = newRoom.id);
		return newRoom;
	}

	createMultiplayerRoom(): GameRoom {
		const roomId = this.generateRoomId();

		const newRoom: GameRoom = {
			id: roomId,
			players: this.multiplayerPlayers.slice(0, 3),
			maxPlayer: 4,
			roomType: RoomType.Multiplayer
		};

		newRoom.players.forEach((value) => value.roomId = newRoom.id);
		return newRoom;
	}

	leaveRoom(userId: number, roomId: string) {
		const room = this.gameRooms.get(roomId);
		if (!room) throw new Error("Room not found");
		const player = this.players.get(userId);
		if (!player || player.roomId !== room.id) throw new Error("You are not in this room");
		room.players.splice(room.players.indexOf(player), 1);
		this.players.get(userId)!.roomId = null;
		console.log(`User ${userId} left room ${roomId}`);
		if (room.players.length === 0) {
			console.log(`Room ${roomId} deleted (empty)`);
			this.gameRooms.delete(roomId);
		}
	}

	broadcastRoom(event: GameEvent, roomId: string): void {
		const room = this.gameRooms.get(roomId);
		if (!room) return;

		room.players.forEach(player => {
			this.playersocket.get(player.id)?.send(JSON.stringify(event));
		});
	}

	private generateRoomId(): string {
		return Math.random().toString(36).substr(2, 9);
	}

	getRooms(): GameRoom[] {
		return Array.from(this.gameRooms.values());
	}
}

export const gameManager = new GameManager();