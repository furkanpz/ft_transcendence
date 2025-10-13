import { WebSocket } from "ws"
import { GameType, GameRoom, GameEvent, GameResult} from "../../types/game.types"

class QueueManager {
	public classicGameQueue : number[] = new Array();
	public tournamentGameQueue : number[] = new Array();
	public multiplayerGameQueue : number[] = new Array();
	public playerSockets : Map<number, WebSocket> = new Map(); 

	public addQueue(userId: number, socket: WebSocket, gameType : GameType) : void
	{
		if (this.classicGameQueue.find((value) => value == userId) ||
			this.tournamentGameQueue.find((value) => value == userId) ||
			this.multiplayerGameQueue.find((value) => value == userId)) {
				console.log("Player already in one queue.!");
		}
		
		this.playerSockets.set(userId, socket);

		socket.on("close", () => {
			this.removeFromQueue(userId);
			this.playerSockets.delete(userId);
			console.log(`Player ${userId} disconnected and removed from queues`);
		});

		if (gameType == GameType.Classic)
		{
			this.classicGameQueue.push(userId);
			if (this.classicGameQueue.length >= 2)
			{
				this.classicGameQueue.splice(0, 2).forEach((value) => 
					{
						this.playerSockets.get(value)?.send(JSON.stringify({action: "matchFound", queueType: "1v1"}));
						this.playerSockets.delete(value);
					}
				);
			}
		}
		else if (gameType == GameType.Multiplayer)
		{
			this.multiplayerGameQueue.push(userId);
			if (this.multiplayerGameQueue.length >= 4)
			{
				this.multiplayerGameQueue.splice(0, 4).forEach((value) => 
					{
						this.playerSockets.get(value)?.send(JSON.stringify({action: "matchFound", queueType: "2v2"}));
						this.playerSockets.delete(value)
					}
				);
			}
			
		}
		else // turnuva
		{
			this.tournamentGameQueue.push(userId);
			if (this.tournamentGameQueue.length >= 8)
			{
				this.tournamentGameQueue.splice(0, 8).forEach((value) => 
					{
						this.playerSockets.get(value)?.send(JSON.stringify({action: "matchFound", queueType: "tournament"})); 
						this.playerSockets.delete(value);
					}
				);
			}
		}

	}

	public removeFromQueue(userId : number) : void 
	{
		let a;
		if ((a = this.classicGameQueue.find((num) => num == userId))) {this.classicGameQueue.splice(a, 1);}
		if ((a = this.tournamentGameQueue.find((num) => num == userId))) {this.classicGameQueue.splice(a, 1);}
		if ((a = this.multiplayerGameQueue.find((num) => num == userId))) {this.classicGameQueue.splice(a, 1);}
		
	}
}

class ClassicGameManager
{
	public gameRooms: Map<string, GameRoom> = new Map();
	public playerSockets: Map<number, WebSocket> = new Map();
	public playerRoom: Map<number, string> = new Map();
	public roomRuntimes: Map<string, NodeJS.Timeout> = new Map();
	
	public addPlayer(userId: number, socket: WebSocket) : void {
		this.playerSockets.set(userId, socket);

		socket.on("open", async (data: string) => {
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
			socket.send(JSON.stringify({players : room.players}));
		}
		);
	}

	public createRoom(userIds : number[], gameType : GameType) : string
	{

		const room : GameRoom = {
			id: this.generateRoomId(),
			players: userIds,
			roomType: gameType,
		}
		this.gameRooms.set(room.id, room);
		userIds.forEach((value) => this.playerRoom.set(value, room.id));
		console.log("created room with id: " + room.id);
		return room.id;	
	}

	public generateRoomId() : string
	{
  		return crypto.randomUUID();
	}
}

export const queueManager = new QueueManager();
export const classicGameManager = new ClassicGameManager();