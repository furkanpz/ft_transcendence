import { GlobalState, Page } from "../main";
import { GAME_1V1_PAGE } from "./Game1v1Page";
import { GAME_2V2_PAGE } from "./Game2v2Page";
import { GAME_TOURNAMENT_PAGE } from "./TournamentPage";
import { HOME_PAGE } from "./HomePage";

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
			<div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
				<div class="text-center">
					<div class="w-full flex justify-end mb-4">
						<button id="lang-en" class="mr-2">EN</button>
						<button id="lang-tr">TR</button>
					</div>
					<!-- Animated Loading Circle -->
					<div class="relative w-32 h-32 mx-auto mb-8">
						<div class="absolute inset-0 border-8 border-white/20 rounded-full"></div>
						<div class="absolute inset-0 border-8 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin"></div>
					</div>

					<!-- Title -->
					<h1 class="text-5xl font-bold text-white mb-4" data-i18n="waiting">
						Waiting
					</h1>

					<!-- Status Text -->
					<p class="text-2xl text-white/90 mb-2" data-i18n="searching_players">Searching for players...</p>
					<p class="text-lg text-white/70 mb-8" data-i18n="please_wait">Please wait while we find you a match</p>

					<!-- Animated Dots -->
					<div class="flex justify-center gap-2 mb-12">
						<div class="w-3 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 0ms"></div>
						<div class="w-3 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 150ms"></div>
						<div class="w-3 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 300ms"></div>
					</div>

					<!-- Cancel Button -->
					<button 
						id="cancelMatchmaking" 
						class="px-8 py-3 cursor-pointer bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
						data-i18n="cancel"
					>
						Cancel
					</button>
				</div>
			</div>
		`;

		// Add event listener for cancel button
		const cancelButton = document.getElementById("cancelMatchmaking");
		if (cancelButton) {
			cancelButton.addEventListener("click", () => {
				GlobalState.setPage(HOME_PAGE);
				});
			}
		}
	}

	async onPreLoad(): Promise<void> {
		console.log("Matchmaking Page preloaded");
	}

	async onLoad(): Promise<void> {
	const socket = new WebSocket(`wss://localhost:3000/queue/${this.gameType}`);
	
	socket.onopen = () => {
		GlobalState.setSocket(socket);
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
		socket.close();
		GlobalState.setSocket(null);
	}
	console.log("Matchmaking Page unloaded");
  }

}

const MATCHMAKING_PAGE = (gameType: string) => new MatchmakingPage(gameType);

export { MATCHMAKING_PAGE };