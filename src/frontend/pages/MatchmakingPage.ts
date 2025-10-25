import { GlobalState, Page } from "../main";
import { CLASSIC_GAME_PAGE } from "./ClassicGamePage";
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
		
		if (this.gameType === 'tournament') {
			app.innerHTML = `
				<div class="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 flex items-center justify-center p-4">
					<div class="max-w-4xl w-full">
						<div class="w-full flex justify-end mb-4">
							<button id="lang-en" class="mr-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded">EN</button>
							<button id="lang-tr" class="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded">TR</button>
						</div>
						
						<div class="bg-gray-800 rounded-2xl shadow-2xl p-8 border-4 border-purple-500">
							<div class="text-center mb-8">
								<div class="text-8xl mb-4">🏆</div>
								<h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
									TOURNAMENT
								</h1>
								<p class="text-2xl text-gray-300 mb-2">Waiting for Players...</p>
								<p class="text-lg text-gray-400">8 players needed to start</p>
							</div>

							<div class="mb-8">
								<div class="flex justify-between text-sm text-gray-400 mb-2">
									<span>Players in queue</span>
									<span id="playerCount">0 / 8</span>
								</div>
								<div class="w-full bg-gray-700 rounded-full h-6 overflow-hidden">
									<div id="progressBar" class="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 flex items-center justify-center text-white text-sm font-bold" style="width: 0%">
										<span id="progressText">0%</span>
									</div>
								</div>
							</div>

							<div class="grid grid-cols-4 gap-4 mb-8">
								${Array.from({length: 8}, (_, i) => `
									<div id="slot-${i}" class="aspect-square bg-gray-700 rounded-xl border-2 border-gray-600 flex items-center justify-center transition-all">
										<div class="text-4xl text-gray-500">?</div>
									</div>
								`).join('')}
							</div>

							<div class="flex justify-center gap-2 mb-6">
								<div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
								<div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
								<div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
							</div>

							<div class="text-center">
								<button 
									id="cancelButton"
									class="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition duration-300 shadow-lg hover:shadow-xl">
									<span data-i18n="cancel">Cancel</span>
								</button>
							</div>

							<div class="mt-6 p-4 bg-gray-900 rounded-lg">
								<h3 class="text-xl font-bold text-yellow-400 mb-2">Tournament Rules</h3>
								<ul class="text-sm text-gray-300 space-y-1">
									<li>• 8 players single elimination bracket</li>
									<li>• 3 rounds: Quarter-Finals → Semi-Finals → Final</li>
									<li>• Best of 1 matches</li>
									<li>• Winner takes all the glory! 🏆</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			`;
		} else {
			app.innerHTML = `
				<div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
					<div class="text-center">
						<div class="w-full flex justify-end mb-4">
							<button id="lang-en" class="mr-2">EN</button>
							<button id="lang-tr">TR</button>
						</div>
						
						<div class="relative w-32 h-32 mx-auto mb-8">
							<div class="absolute inset-0 border-8 border-white/20 rounded-full"></div>
							<div class="absolute inset-0 border-8 border-t-white border-r-white border-b-transparent border-l-transparent rounded-full animate-spin"></div>
						</div>

						<h1 class="text-5xl font-bold text-white mb-4" data-i18n="waiting">
							Waiting
						</h1>

						<p class="text-2xl text-white/90 mb-2" data-i18n="searching_players">Searching for players...</p>
						<p class="text-lg text-white/70 mb-8" data-i18n="please_wait">Please wait while we find you a match</p>

						<div class="flex justify-center gap-2 mb-12">
							<div class="w-3 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 0ms"></div>
							<div class="w-3 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 150ms"></div>
							<div class="w-3 h-3 bg-white rounded-full animate-bounce" style="animation-delay: 300ms"></div>
						</div>

						<button 
							id="cancelButton"
							class="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white font-bold py-4 px-8 rounded-lg transition duration-300 border-2 border-white/30">
							<span data-i18n="cancel">Cancel</span>
						</button>
					</div>
				</div>
			`;
		}
		}
	}

	async onPreLoad(): Promise<void> {
		console.log("Matchmaking Page preloaded");
	}

	async onLoad(): Promise<void> {
		const cancelButton = document.getElementById("cancelButton");
		if (cancelButton) {
			cancelButton.addEventListener("click", () => {
				const socket = GlobalState.getSocket();
				if (socket) {
					socket.close();
					GlobalState.setSocket(null);
				}
				GlobalState.setPage(HOME_PAGE);
			});
		}

		const socket = new WebSocket(`wss://localhost:3000/queue/${this.gameType}`);
		
		socket.onopen = () => {
			GlobalState.setSocket(socket);
			console.log("WebSocket connection established");
		};

		socket.onmessage = (event) => {
			const message = JSON.parse(event.data);
			console.log("Received message:", message);
			
			if (message.action === "queueUpdate" && this.gameType === "tournament") {
				const current = message.currentPlayers;
				const required = message.requiredPlayers;
				const percentage = Math.floor((current / required) * 100);
				
				const playerCountEl = document.getElementById("playerCount");
				const progressBar = document.getElementById("progressBar");
				const progressText = document.getElementById("progressText");
				
				if (playerCountEl) playerCountEl.textContent = `${current} / ${required}`;
				if (progressBar) progressBar.style.width = `${percentage}%`;
				if (progressText) progressText.textContent = `${percentage}%`;
				
				for (let i = 0; i < required; i++) {
					const slot = document.getElementById(`slot-${i}`);
					if (slot) {
						if (i < current) {
							slot.innerHTML = '<div class="text-4xl">👤</div>';
							slot.classList.remove('border-gray-600', 'bg-gray-700');
							slot.classList.add('border-purple-500', 'bg-purple-900', 'scale-110');
						} else {
							slot.innerHTML = '<div class="text-4xl text-gray-500">?</div>';
							slot.classList.remove('border-purple-500', 'bg-purple-900', 'scale-110');
							slot.classList.add('border-gray-600', 'bg-gray-700');
						}
					}
				}
			}
			
			if (message.action === "matchFound") {
				switch (message.queueType)
				{
					case "1v1":
						GlobalState.setPage(CLASSIC_GAME_PAGE(message.roomId));
						break;
					case "2v2":
						GlobalState.setPage(GAME_2V2_PAGE(message.roomId));
						break;
					case "tournament":
						GlobalState.setPage(GAME_TOURNAMENT_PAGE(message.tournamentId));
						break;
					default:
						console.error("Unknown queue type:", message.queueType);
				}
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