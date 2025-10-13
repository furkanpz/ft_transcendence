import { GlobalState, Page } from "../main";
import { GAME_1V1_PAGE } from "./Game1v1Page";
import { GAME_2V2_PAGE } from "./Game2v2Page";
import { GAME_TOURNAMENT_PAGE } from "./TournamentPage";

class MatchmakingPage implements Page {

	title: string = "Tournament";
	data: any;
	gameType: string;

	constructor(gameType: string) {
		this.gameType = gameType;
  	}

	async render(): Promise<void> {
		const app = document.getElementById("app");
		if (app) {
		app.innerHTML = `
			<h1>Matchmaking Page</h1>
			<p>Welcome to the Matchmaking Page!</p>
		`;
		}
	}

	async onPreLoad(): Promise<void> {
		console.log("Matchmaking Page preloaded");
	}

	async onLoad(): Promise<void> {
	const socket = new WebSocket(`wss://localhost:3000/queue/${this.gameType}`);

	socket.onopen = () => {
	  console.log("WebSocket connection established");
	};

	socket.onmessage = (event) => {
	  const message = JSON.parse(event.data);
	  console.log("Received message:", message);
	  if (message.action === "matchFound") {
		switch (message.queueType)
		{
			case "1v1":
				GlobalState.setPage(GAME_1V1_PAGE(message.roomId));
				break;
			case "2v2":
				GlobalState.setPage(GAME_2V2_PAGE(message.roomId));
				break;
			case "Tournament":
				GlobalState.setPage(GAME_TOURNAMENT_PAGE(message.tournamentId));
				break;
			default:
				console.error("Unknown queue type:", message.queueType);
		}
		alert(`Match found! Opponent: ${message.opponent}`);
	  }
	};

	console.log("Matchmaking Page loaded");
  }

  async onUnload(): Promise<void> {
	const socket = GlobalState.getSocket();
	if (socket) {
		socket.send(JSON.stringify({ action: "leaveQueue" }));
		socket.close();
		GlobalState.setSocket(null);
	}

	console.log("Matchmaking Page unloaded");
  }

}

const MATCHMAKING_PAGE = (gameType: string) => new MatchmakingPage(gameType);

export { MATCHMAKING_PAGE };