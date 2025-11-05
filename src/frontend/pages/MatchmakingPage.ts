import { GlobalState, Page, FETCH_ADDRESS } from "../main";
import { CLASSIC_GAME_PAGE } from "./ClassicGamePage";
import { GAME_2V2_PAGE } from "./Game2v2Page";
import { GAME_TOURNAMENT_PAGE } from "./TournamentPage";
import { HOME_PAGE } from "./HomePage";
import { MULTIPLAYER_GAME_PAGE } from "./MultiplayerGamePage";
import { SINGLE_GAME_PAGE } from "./SingleGamePage";

declare const Notification: typeof import("../components/Notification").Notification;

class MatchmakingPage implements Page {

	title: string = "";
	data: any;
	gameType: string;

	constructor(gameType: string) {
		this.gameType = gameType;
		switch (gameType)
		{
			case "classic":
				this.title = "Classic"
				break;
			case "tournament":
				this.title = "Tournament"
				break;
			case "2v2":
				this.title = "2v2 Multiplayer"
				break;
		}
  	}

	async render(): Promise<void> {
		const app = document.getElementById("app");
		if (app) {
		
		if (this.gameType === 'tournament') {
			app.innerHTML = `
				<div style="min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 2rem;">
					<div style="max-width: 900px; width: 100%;">
						<div class="glass-card animate-scale-in">
							<div style="text-align: center; margin-bottom: 2rem;">
								<div style="font-size: 5rem; margin-bottom: 1rem;" class="neon-text-purple">🏆</div>
								<h1 style="font-size: 3rem; margin-bottom: 1rem;" class="neon-text-purple">TOURNAMENT</h1>
								<p style="font-size: 1.5rem; color: rgba(255, 255, 255, 0.8); margin-bottom: 0.5rem;">Waiting for Players...</p>
								<p style="color: rgba(255, 255, 255, 0.6);">4 players needed to start</p>
							</div>

							<div style="margin-bottom: 2rem;">
								<div style="display: flex; justify-content: space-between; font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.5rem;">
									<span>Players in queue</span>
									<span id="playerCount">0 / 4</span>
								</div>
								<div style="width: 100%; background: rgba(255, 255, 255, 0.1); border-radius: 999px; height: 1.5rem; overflow: hidden;">
									<div id="progressBar" style="height: 100%; background: linear-gradient(135deg, var(--neon-purple), var(--neon-pink)); transition: width 0.5s; display: flex; align-items: center; justify-content: center; color: white; font-size: 0.875rem; font-weight: 600; width: 0%;">
										<span id="progressText">0%</span>
									</div>
								</div>
							</div>

							<div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 2rem;">
								${Array.from({length: 4}, (_, i) => `
									<div id="slot-${i}" style="aspect-ratio: 1; background: rgba(255, 255, 255, 0.05); border-radius: 1rem; border: 2px solid rgba(255, 255, 255, 0.1); display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
										<div style="font-size: 2rem; color: rgba(255, 255, 255, 0.3);">?</div>
									</div>
								`).join('')}
							</div>

							<div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 1.5rem;">
								<div class="spinner" style="width: 12px; height: 12px; border-width: 2px;"></div>
								<div class="spinner" style="width: 12px; height: 12px; border-width: 2px; animation-delay: 0.15s;"></div>
								<div class="spinner" style="width: 12px; height: 12px; border-width: 2px; animation-delay: 0.3s;"></div>
							</div>

							<div style="text-align: center; margin-bottom: 2rem;">
								<button id="cancelButton" class="btn-danger" data-i18n="cancel">Cancel</button>
							</div>

							<div class="glass-card" style="margin-top: 1.5rem; padding: 1.5rem;">
								<h3 style="font-size: 1.25rem; margin-bottom: 1rem;" class="neon-text-purple">Tournament Rules</h3>
								<ul style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.8); list-style: none; padding: 0;">
									<li style="margin-bottom: 0.5rem;">• 4 players single elimination bracket</li>
									<li style="margin-bottom: 0.5rem;">• 2 rounds: Semi-Finals → Final</li>
									<li style="margin-bottom: 0.5rem;">• Best of 1 matches</li>
									<li>• Winner takes all the glory! 🏆</li>
								</ul>
							</div>
						</div>
					</div>
				</div>
			`;
		} else {
			app.innerHTML = `
				<div style="min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 2rem;">
					<div style="text-align: center;">
						<div class="spinner" style="width: 80px; height: 80px; margin: 0 auto 2rem; border-width: 4px;"></div>

						<h1 style="font-size: 3rem; margin-bottom: 1rem;" class="neon-text-cyan" data-i18n="waiting">Waiting</h1>

						<p style="font-size: 1.5rem; color: rgba(255, 255, 255, 0.9); margin-bottom: 0.5rem;" data-i18n="searching_players">Searching for players...</p>
						<p style="font-size: 1rem; color: rgba(255, 255, 255, 0.7); margin-bottom: 2rem;" data-i18n="please_wait">Please wait while we find you a match</p>

						<div style="display: flex; justify-content: center; gap: 0.5rem; margin-bottom: 3rem;">
							<div class="spinner" style="width: 12px; height: 12px; border-width: 2px;"></div>
							<div class="spinner" style="width: 12px; height: 12px; border-width: 2px; animation-delay: 0.15s;"></div>
							<div class="spinner" style="width: 12px; height: 12px; border-width: 2px; animation-delay: 0.3s;"></div>
						</div>

						<button id="cancelButton" class="btn-danger" data-i18n="cancel">Cancel</button>
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

		let wsUrl = `wss://localhost:3000/queue/${this.gameType}`;
		if (this.gameType === 'tournament') {
			let isLoggedIn = false;
			try {
				const resp = await fetch(`${FETCH_ADDRESS}/user/profile`, { credentials: 'include' });
				isLoggedIn = resp.ok;
			} catch (_) {}
			if (!isLoggedIn) {
				let alias = localStorage.getItem('guestAlias') || '';
				if (!alias) {
					alias = window.prompt('Enter a tournament nickname (2-20 chars):', '') || '';
				}
				alias = alias.trim().slice(0, 20);
				if (!alias || alias.length < 2) {
					alias = `Guest${Math.floor(Math.random()*10000)}`;
				}
				localStorage.setItem('guestAlias', alias);
				localStorage.setItem('username', alias);
				wsUrl = `wss://localhost:3000/queue/${this.gameType}?alias=${encodeURIComponent(alias)}`;
			}
		}

		const socket = new WebSocket(wsUrl);
	
	socket.onerror = (error) => {
		console.error("WebSocket error:", error);
		document.getElementById("app")!.innerHTML = `
			<div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
				<div class="text-center">
					<h1 class="text-5xl font-bold text-white mb-4">Connection Error</h1>
					<p class="text-2xl text-white/90 mb-8">Unable to connect to the game server. Please try again later.</p>
					<button 
						id="backHome" 
						class="px-8 py-3 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
					>
						Back to Home
					</button>
				</div>
			</div>
		`;
		document.getElementById("backHome")!.onclick = () => {
			GlobalState.setPage(HOME_PAGE);
		};
	};
	
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
			console.log("Match found message received:", message);
			
			if (message.opponent) {
				localStorage.setItem('currentOpponent', message.opponent);
			}
			
			const roomId = message.roomId || message.room_id || message.data?.roomId;
			
			if (!roomId && message.queueType !== 'tournament') {
				console.error("No roomId found in matchFound message:", message);
				Notification.error("Match found but room ID is missing. Please try again.");
				return;
			}
			
			switch (message.queueType)
			{
				case "classic":
					console.log("Navigating to ClassicGamePage with roomId:", roomId);
					Notification.success(`Match found! Starting game...`);
					GlobalState.setPage(CLASSIC_GAME_PAGE(roomId)).catch((error) => {
						console.error("Failed to navigate to game page:", error);
						Notification.error("Failed to start game. Please try again.");
					});
					break;
				case "2v2":
					console.log("Navigating to MultiplayerGamePage with roomId:", roomId);
					Notification.success(`Match found! Opponent: ${message.opponent || 'Unknown'}`);
					setTimeout(() => {
						GlobalState.setPage(MULTIPLAYER_GAME_PAGE(roomId));
					}, 500);
					break;
				case "tournament":
					const app = document.getElementById("app");
					if (app && this.gameType === 'tournament') {
						app.innerHTML = `
							<div class="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-900 flex items-center justify-center p-4">
								<div class="text-center">
									<div class="text-8xl mb-4 animate-bounce">🎮</div>
									<h1 class="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-4">
										Tournament Starting!
									</h1>
									<p class="text-2xl text-gray-300 mb-2">Entering tournament...</p>
									<div class="flex justify-center gap-2 mt-8">
										<div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
										<div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
										<div class="w-3 h-3 bg-purple-500 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
									</div>
								</div>
							</div>
						`;
					}
					if (message.playerId) {
						localStorage.setItem('guestPlayerId', String(message.playerId));
					}
					setTimeout(() => {
						GlobalState.setPage(GAME_TOURNAMENT_PAGE(message.tournamentId || message.tournament_id));
					}, 1500);
					break;
				default:
					console.error("Unknown queue type:", message.queueType, "Full message:", message);
					Notification.error(`Unknown queue type: ${message.queueType}`);
			}
	  	}
		if (message.type === "error") {
			console.error("Error from server:", message.data.message);
			document.getElementById("app")!.innerHTML = `
				<div class="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 flex items-center justify-center p-4">
					<div class="text-center">
						<h1 class="text-5xl font-bold text-white mb-4">Error</h1>
						<p class="text-2xl text-white/90 mb-8">${message.data.message}</p>
						<button 
							id="backHome" 
							class="px-8 py-3 cursor-pointer bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-lg transform transition-all duration-200 hover:scale-105 active:scale-95"
						>
							Back to Home
						</button>
					</div>
				</div>
			`;
			document.getElementById("backHome")!.onclick = () => {
				GlobalState.setPage(HOME_PAGE);
			};
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