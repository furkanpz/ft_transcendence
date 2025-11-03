import { GlobalState, Page } from "../main";
import { HOME_PAGE } from "./HomePage";

class MultiplayerGameResult implements Page {
	title: string = "Multiplayer Game Result";
	result: {
		players: {
			id: number;
			score: number;
			}[];
	};
	constructor(result: any) {
		this.result = result;
	}

	async render(): Promise<void> {
		const app = document.getElementById("app") as HTMLElement;
		const winner = this.result.players[0].score > this.result.players[1].score ? 0 : 1;
		const winnerScore = this.result.players[winner].score;
		const loserScore = this.result.players[winner === 0 ? 1 : 0].score;
		
		app.innerHTML = `
			<div class="min-h-screen flex items-center justify-center p-4">
				<div class="text-center">
					<div class="text-8xl mb-6 neon-text-pulse">🏆</div>
					<h1 class="text-5xl md:text-7xl font-bold neon-text-yellow mb-6 neon-text-pulse">${this.title}</h1>
					<div class="neon-card border-cyan mb-8">
						<h2 class="text-3xl neon-text-cyan mb-4">Team ${winner + 1} Wins!</h2>
						<div class="flex justify-center gap-8 mb-6">
							<div class="text-center">
								<div class="text-5xl neon-text-green mb-2">${winnerScore}</div>
								<div class="text-sm text-gray-400">Winner</div>
							</div>
							<div class="text-6xl text-gray-500">-</div>
							<div class="text-center">
								<div class="text-5xl text-red-400 mb-2">${loserScore}</div>
								<div class="text-sm text-gray-400">Opponent</div>
							</div>
						</div>
						<p class="text-xl neon-text-magenta mb-4">Thanks for playing!</p>
					</div>
					<button id="go-home" class="bg-blue-500 text-white font-bold py-4 px-8 rounded-lg text-xl">Go to Home</button>
				</div>
			</div>
		`;
	}
	async onLoad(): Promise<void> {
		const button = document.getElementById("go-home") as HTMLButtonElement;
		button.addEventListener("click", () => {
			GlobalState.setPage(HOME_PAGE);
		});
	}
	async onUnload(): Promise<void> {
		
	}
	async onPreLoad(): Promise<void> {
		console.log("Game Result:", this.result);
	}
}

const MULTIPLAYER_GAME_PAGE_RESULT = (result : any) => new MultiplayerGameResult(result);

export { MULTIPLAYER_GAME_PAGE_RESULT, MultiplayerGameResult };