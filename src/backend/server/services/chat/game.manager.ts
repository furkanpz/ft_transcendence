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
			// Handle incoming messages related to game actions here
			try {
				const message: GameEvent = JSON.parse(data);
				await this.handleMessage(userId, message);
			} catch (error) {
				console.error("Error parsing message:", error);
				// Optionally send an error message back to the client
			}
		});
		return true;
	}

	async handleMessage(userId: number, event: GameEvent): Promise<void> {
		const player = this.players.get(userId);
		if (!player) return;

		switch (event.type) {
			case "createRoom":
				const roomSettings: RoomSettings = event.data;
				try {
					const room = this.createRoom(userId, roomSettings);
					this.broadcastRoom({ type: "roomCreated", data: room }, room.id);
				} catch (error: any) {
					this.playersocket.get(userId)?.send(JSON.stringify({ type: "error", message: error.message }));
				}
				break;
			case "joinRoom":
				const { roomId, password } = event.data;
				const success = this.joinRoom(userId, roomId, password);
				if (success) {
					this.playersocket.get(userId)?.send(JSON.stringify({ type: "joinedRoom", roomId }));
				} else {
					this.playersocket.get(userId)?.send(JSON.stringify({ type: "error", message: "Failed to join room" }));
				}
				break;
			case "leaveRoom":
				if (player.roomId) {
					const left = this.leaveRoom(userId, player.roomId);
					if (left) {
						this.playersocket.get(userId)?.send(JSON.stringify({ type: "leftRoom", roomId: player.roomId }));
					} else {
						this.playersocket.get(userId)?.send(JSON.stringify({ type: "error", message: "Failed to leave room" }));
					}
				}
				break;
			case "selectTeam":
				const { teamId } = event.data;
				if (player.roomId) {
					const joined = this.joinTeam(userId, teamId, player.roomId);
					if (joined) {
						this.playersocket.get(userId)?.send(JSON.stringify({ type: "joinedTeam", teamId }));
					} else {
						this.playersocket.get(userId)?.send(JSON.stringify({ type: "error", message: "Failed to join team" }));
					}
				}
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
	}

	createRoom(userId: number, roomSettings: RoomSettings): GameRoom {
		const roomId = this.generateRoomId();

		if (this.players.get(userId)?.roomId) {
			throw new Error("You can't create a room while in another room");
		}
		const newRoom: GameRoom = {
			id: roomId,
			players: [this.players.get(userId)!],
			maxPlayers: roomSettings.maxPlayers,
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
			newRoom.state.teams = new Array(newRoom.teamCount).fill( { id: i, score: 0, size: newRoom.maxPlayers / newRoom.teamCount, players: [] } );
		this.players.get(userId)!.roomId = newRoom.id;
		this.gameRooms.set(roomId, newRoom);
		console.log(`Room ${roomId} created by user ${userId}`);
		return newRoom;
	}

	joinTeam(userId: number, teamId: number, roomId: string): boolean {
		const room = this.gameRooms.get(roomId);
		if (!room) return false;
		const plyr = room.players.find(p => p.id === userId);
		if (!plyr) return false;
		if (!room.state.teams) return false;
		const team = room.state.teams.find(t => t.id === teamId);
		if (!team) return false;
		if (team.players.length >= team.size) return false;
		if (plyr.team) {
			const oldTeam = room.state.teams.find(t => t.id === plyr.team!.id);
			if (oldTeam) {
				oldTeam.players = oldTeam.players.filter(p => p.id !== userId);
			}
		}
		plyr.team = team;
		team.players.push(plyr);
		return true;
	}

	joinRoom(userId: number, roomId: string, password?: string): boolean {
		const room = this.gameRooms.get(roomId);
		if (!room) return false;
		if (this.players.has(userId)) return false;
		if (room.isPrivate && room.password !== password) return false;
		if (room.players.length >= room.maxPlayers) return false;
		room.players.push(this.players.get(userId)!);
		this.players.get(userId)!.roomId = room.id;
		console.log(`User ${userId} joined room ${roomId}`);
		return true;
	}

	leaveRoom(userId: number, roomId: string): boolean {
		const room = this.gameRooms.get(roomId);
		if (!room) return false;
		const player = this.players.get(userId);
		if (!player || player.roomId !== room.id) return false;
		room.players.splice(room.players.indexOf(player), 1);
		this.players.get(userId)!.roomId = null;
		console.log(`User ${userId} left room ${roomId}`);
		if (room.players.length === 0) {
			console.log(`Room ${roomId} deleted (empty)`);
			this.gameRooms.delete(roomId);
		}
		return true;
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