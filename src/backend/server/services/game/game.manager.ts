import {WebSocket} from "ws"
import { Team, RoomStatus, RoomState, GameState, Player, RoomSettings, GameRoom, GameEvent} from "../../types/game.types"
class GameManager {
	gameRooms: Map<string, GameRoom> = new Map();
	players: Map<number, Player> = new Map();
	playersocket: Map<number, WebSocket> = new Map();

	addPlayer(userId: number, username: string, socket: WebSocket): boolean {
		if (this.players.has(userId)) return false;

		const player: Player = {
			id: userId,
			name: username,
			isReady: false,
			team: null,
			roomId: null,
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
				case "createRoom":
					const roomSettings: RoomSettings = event.data;
					const room = this.createRoom(userId, roomSettings);
					this.broadcastRoom({ type: "roomCreated", data: room }, room.id);
					break;
				case "joinRoom":
					const { roomId, password } = event.data;
					this.joinRoom(userId, roomId, password);
					this.broadcastRoom({ type: "playerJoined", data: { userId, username: player.name } }, roomId);
					break;
				case "leaveRoom":
					this.leaveRoom(userId, player.roomId!);
					this.playersocket.get(userId)?.send(JSON.stringify({ type: "leftRoom", roomId: player.roomId! }));
					break;
				case "selectTeam":
					const { teamId } = event.data;
					this.joinTeam(userId, teamId, player.roomId!);
					this.playersocket.get(userId)?.send(JSON.stringify({ type: "joinedTeam", teamId }));
					break;
				case "ready":
					if (player.roomId) {
						player.isReady = !player.isReady;
						this.playersocket.get(userId)?.send(JSON.stringify({ type: "readyStatus", isReady: player.isReady }));
					}
					break;
				case "start":
					if (player.roomId && this.gameRooms.get(player.roomId)?.players[0].id === userId) {
						if (this.gameRooms.get(player.roomId)?.players.every(p => p.isReady)) {
							this.gameRooms.get(player.roomId)!.state.state = RoomStatus.Playing;
							this.broadcastRoom({type: "start", data : { roomId: player.roomId }}, player.roomId);
						}
					}
					break;
			}
	} catch (error: any) {
		console.error("Error handling message:", error);
		this.playersocket.get(userId)?.send(JSON.stringify({ type: "error", data: error.message }));
	}
}

	createRoom(userId: number, roomSettings: RoomSettings): GameRoom {
		const roomId = this.generateRoomId();

		if (this.players.get(userId)?.roomId) {
			throw new Error("You can't create a room while in another room");
		}
		const newRoom: GameRoom = {
			id: roomId,
			players: [this.players.get(userId)!],
			maxPlayer: roomSettings.maxPlayer,
			isPrivate: roomSettings.isPrivate,
			password: roomSettings.password,
			teamCount: roomSettings.teamCount,
			state: {
				teams: null,
				state: RoomStatus.Waiting,
			},
			gameState: null,
		};
		for (let i = 0; i < newRoom.teamCount; i++)
			newRoom.state.teams = new Array(newRoom.teamCount).fill( { id: i, score: 0, size: newRoom.maxPlayer / newRoom.teamCount, players: [] } );
		this.players.get(userId)!.roomId = newRoom.id;
		this.gameRooms.set(roomId, newRoom);
		console.log(`Room ${roomId} created by user ${userId}`);
		return newRoom;
	}

	joinTeam(userId: number, teamId: number, roomId: string) {
		const room = this.gameRooms.get(roomId);
		if (!room) throw new Error("Room not found");
		const plyr = room.players.find(p => p.id === userId);
		if (!plyr) throw new Error("Player not found");
		if (!room.state.teams) throw new Error("Teams not initialized");
		const team = room.state.teams.find(t => t.id === teamId);
		if (!team) throw new Error("Team not found");
		if (team.players.length >= team.size) throw new Error("Team is full");
		if (plyr.team) {
			const oldTeam = room.state.teams.find(t => t.id === plyr.team!.id);
			if (oldTeam) {
				oldTeam.players = oldTeam.players.filter(p => p.id !== userId);
			}
		}
		plyr.team = team;
		team.players.push(plyr);
	}

	joinRoom(userId: number, roomId: string, password?: string) {
		const room = this.gameRooms.get(roomId);
		if (!room) throw new Error("Room not found");
		if (this.players.get(userId)?.roomId) throw new Error("You are already in a room");
		if (room.isPrivate && room.password !== password) throw new Error("Invalid room password");
		if (room.players.length >= room.maxPlayer) throw new Error("Room is full");
		room.players.push(this.players.get(userId)!);
		this.players.get(userId)!.roomId = room.id;
		console.log(`User ${userId} joined room ${roomId}`);
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