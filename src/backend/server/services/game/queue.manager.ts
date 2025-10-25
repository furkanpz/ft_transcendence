import WebSocket from "ws";
import { GameType } from "../../types/game.types";
import { gameManager } from "./game.manager";

class QueueManager {
	public classicGameQueue : number[] = new Array();
	public tournamentGameQueue : number[] = new Array();
	public multiplayerGameQueue : number[] = new Array();
	public playerSockets : Map<number, WebSocket> = new Map(); 

	public addQueue(userId: number, socket: WebSocket, gameType : GameType) : boolean
	{
		if (this.playerSockets.has(userId) ||
			this.classicGameQueue.find((value) => value == userId) ||
			this.tournamentGameQueue.find((value) => value == userId) ||
			this.multiplayerGameQueue.find((value) => value == userId)) {
				console.log("Player already in one queue.");
				socket.send(JSON.stringify({type: "error", data: { message: "Player already in one queue."}}));
				return false;
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
				const players = this.classicGameQueue.splice(0, 2);
				const roomId = gameManager.createRoom(players, GameType.Classic);
				players.forEach((value) => 
					{
						this.playerSockets.get(value)?.send(JSON.stringify({action: "matchFound", queueType: "1v1", roomId: roomId}));
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

				const players = this.multiplayerGameQueue.splice(0, 4);
				const roomId = gameManager.createRoom(players, GameType.Multiplayer);
				players.forEach((value) => 
					{
						this.playerSockets.get(value)?.send(JSON.stringify({action: "matchFound", queueType: "2v2", roomId: roomId}));
						this.playerSockets.delete(value);
					}
				);
			}
		}
		else if (gameType == GameType.Tournament)
		{
			this.tournamentGameQueue.push(userId);
			
			this.tournamentGameQueue.forEach((id) => {
				const playerSocket = this.playerSockets.get(id);
				if (playerSocket) {
					playerSocket.send(JSON.stringify({
						action: "queueUpdate",
						queueType: "tournament",
						currentPlayers: this.tournamentGameQueue.length,
						requiredPlayers: 8
					}));
				}
			});
			
			if (this.tournamentGameQueue.length >= 8)
			{
				const players = this.tournamentGameQueue.splice(0, 8);
				
				tournamentManager.createTournament(players).then(tournamentId => {
					players.forEach((value) => 
						{
							this.playerSockets.get(value)?.send(JSON.stringify({
								action: "matchFound", 
								queueType: "tournament",
								tournamentId: tournamentId
							}));
							this.playerSockets.delete(value);
						}
					);
					
					setTimeout(() => {
						tournamentManager.startTournament(tournamentId);
					}, 5000);
				});
			}
		}
		return true;
	}

	public removeFromQueue(userId : number) : void 
	{
		let a;
		if ((a = this.classicGameQueue.indexOf(userId)) !== -1) {this.classicGameQueue.splice(a, 1);}
		if ((a = this.tournamentGameQueue.indexOf(userId)) !== -1) {this.tournamentGameQueue.splice(a, 1);}
		if ((a = this.multiplayerGameQueue.indexOf(userId)) !== -1) {this.multiplayerGameQueue.splice(a, 1);}
	}
}

export const queueManager = new QueueManager();