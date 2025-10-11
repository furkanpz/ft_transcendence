import { WebSocket } from "ws"
import { RoomType, Player, GameRoom, GameEvent, GameResult} from "../../types/game.types"

class GameManager {
	
	classicQueue: Player[] = new Array();
	tournamentQueue: Player[] = new Array();
	multiplayerQueue: Player[] = new Array();

	classicRooms: Map<string, GameRoom> = new Map();
	tournamentRooms: Map<string, GameRoom> = new Map();
	multiplayerRooms: Map<string, GameRoom> = new Map();
	
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
			this.leaveQueue(userId, this.classicQueue);
			this.leaveQueue(userId, this.tournamentQueue);
			this.leaveQueue(userId, this.multiplayerQueue);
			this.players.delete(userId);
			this.playersocket.delete(userId);
			console.log(`Player ${userId} disconnected and removed from queues`);
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
		
		this.classicQueue.push(player);
		if (this.classicQueue.length == 2) {
			const room = this.createClassicRoom();
			this.classicRooms.set(room.id, room);
			this.classicQueue.splice(0, 2).forEach((value) => value.isWaiting = false);
			this.broadcastRoom({ type: "start", roomType: RoomType.Classic }, room.id);
			return;
		}
		player.isWaiting = true;
		this.broadcastQueue({type: "playerJoined", roomType: RoomType.Classic}, this.classicQueue);
	}

	tournamentGameSearch(userId: number) {
		const player = this.players.get(userId);
		if (!player) {
			console.log("Player not connected");
			return;
		}
		if (!player.isWaiting) {
			console.log(`Player ${userId} is already playing`);
		}

		this.tournamentQueue.push(player);
		if (this.tournamentQueue.length == 4) {
			const room = this.createTournamentRoom();
			this.tournamentRooms.set(room.id, room);
			this.tournamentQueue.splice(0, 4).forEach((value) => value.isWaiting = false);
			return;
		}
		this.players.get(userId)!.isWaiting = true;
	}

	multiplayerGameSearch(userId: number) {
		const player = this.players.get(userId);
		if (!player) {
			console.log("Player not connected");
			return;
		}
		if (!player.isWaiting) {
			console.log(`Player ${userId} is already playing`);
		}

		this.multiplayerQueue.push(player);
		if (this.multiplayerQueue.length == 4) {
			const room = this.createMultiplayerRoom();
			this.multiplayerRooms.set(room.id, room);
			this.multiplayerQueue.splice(0, 4).forEach((value) => value.isWaiting = false);
			return;
		}
		player.isWaiting = true;
		this.players.get(userId)!.isWaiting = true;
	}

	createClassicRoom(): GameRoom {
		const roomId = this.generateRoomId();

		const newRoom: GameRoom = {
			id: roomId,
			players: this.classicQueue.slice(0, 1),
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
			players: this.tournamentQueue.slice(0, 3),
			maxPlayer: 4,
			roomType: RoomType.Tournament
		};

		newRoom.players.forEach((value) => value.roomId = newRoom.id);
		console.log("created Tournament game");
		return newRoom;
	}

	createMultiplayerRoom(): GameRoom {
		const roomId = this.generateRoomId();

		const newRoom: GameRoom = {
			id: roomId,
			players: this.multiplayerQueue.slice(0, 3),
			maxPlayer: 4,
			roomType: RoomType.Multiplayer
		};

		newRoom.players.forEach((value) => value.roomId = newRoom.id);
		console.log("created Multiplayer game");
		return newRoom;
	}

	leaveQueue(userId: number, queue: Player[]): void {
		const player = this.players.get(userId);
		if (!player) {
			console.log("Player not waiting");
			return;
		}
		player.isWaiting = false;
		const index = queue.indexOf(player);
		if (index > -1) {
			queue.splice(index, 1);
		}
	}

	broadcastQueue(event: GameEvent, queue: Player[]): void {
		queue.forEach(player => {
			this.playersocket.get(player.id)?.send(JSON.stringify(event));
		});
	}

	broadcastRoom(event: GameEvent, roomId: string): void {
		const room = this.classicRooms.get(roomId) || this.tournamentRooms.get(roomId) || this.multiplayerRooms.get(roomId);
		if (!room) return;
		room.players.forEach(player => {
			this.playersocket.get(player.id)?.send(JSON.stringify(event));
		});
	}

	private generateRoomId(): string {
		return Math.random().toString(36).slice(2, 9);
	}
}

export const gameManager = new GameManager();