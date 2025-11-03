import { GlobalState, Page, FETCH_ADDRESS } from "../main";
import { HOME_PAGE } from "./HomePage";

class ClassicGameResult implements Page {
	title: string = "Game Result";
	result: {
		players: {
			id: number;
			score: number;
			username?: string;
			}[];
	};
	constructor(result: any) {
		this.result = result;
	}

	async render(): Promise<void> {
		const app = document.getElementById("app") as HTMLElement;
		
		const winner = this.result.players[0].score > this.result.players[1].score ? 0 : 1;
		const winnerPlayer = this.result.players[winner];
		const loserPlayer = this.result.players[winner === 0 ? 1 : 0];
		const winnerScore = winnerPlayer.score;
		const loserScore = loserPlayer.score;

		let currentUserId: number | null = null;
		try {
			const response = await fetch(`${FETCH_ADDRESS}/user/profile`, {
				method: 'GET',
				credentials: 'include',
				headers: { 'Content-Type': 'application/json' }
			});
			if (response.ok) {
				const userData = await response.json();
				currentUserId = userData.id || null;
			}
		} catch (error) {
			console.error('Failed to fetch current user ID:', error);
		}
		
		let currentUserIndex = -1;
		if (currentUserId !== null) {
			currentUserIndex = this.result.players.findIndex((p: any) => p.id === currentUserId);
		}
		
		if (currentUserIndex === -1) {
			const currentUsername = localStorage.getItem('username') || '';
			currentUserIndex = this.result.players.findIndex((p: any) => 
				p.username === currentUsername || p.username?.toLowerCase() === currentUsername?.toLowerCase()
			);
		}
		
		const isCurrentUserWinner = currentUserIndex === winner;

		let player1Name: string;
		let player2Name: string;
		let player1Score: number;
		let player2Score: number;
		let player1IsCurrentUser: boolean;
		let player2IsCurrentUser: boolean;
		
		if (currentUserIndex === 0) {
			player1Name = 'You';
			player2Name = this.result.players[1].username || 'Opponent';
			player1Score = this.result.players[0].score;
			player2Score = this.result.players[1].score;
			player1IsCurrentUser = true;
			player2IsCurrentUser = false;
		} else if (currentUserIndex === 1) {
			player1Name = this.result.players[0].username || 'Opponent';
			player2Name = 'You';
			player1Score = this.result.players[0].score;
			player2Score = this.result.players[1].score;
			player1IsCurrentUser = false;
			player2IsCurrentUser = true;
		} else {
			player1Name = this.result.players[0].username || `Player 1`;
			player2Name = this.result.players[1].username || `Player 2`;
			player1Score = this.result.players[0].score;
			player2Score = this.result.players[1].score;
			player1IsCurrentUser = false;
			player2IsCurrentUser = false;
		}
		
		const player1IsWinner = player1Score > player2Score;
		const player2IsWinner = player2Score > player1Score;
		
		let winnerAnnouncement: string;
		if (currentUserIndex >= 0) {
			if (isCurrentUserWinner) {
				winnerAnnouncement = 'You Won! 🎉';
			} else {
				let actualWinnerName: string;
				if (player1IsWinner) {
					actualWinnerName = player1IsCurrentUser ? player2Name : player1Name;
				} else if (player2IsWinner) {
					actualWinnerName = player2IsCurrentUser ? player1Name : player2Name;
				} else {
					actualWinnerName = player1IsCurrentUser ? player2Name : player1Name;
				}
				winnerAnnouncement = `${actualWinnerName} Won - You Lost`;
			}
		} else {
			winnerAnnouncement = `${player1IsWinner ? player1Name : player2Name} Wins!`;
		}
		
		app.innerHTML = `
			<style>
				.result-container {
					min-height: calc(100vh - 80px);
					display: flex;
					align-items: center;
					justify-content: center;
					padding: 2rem;
				}
				
				.result-card {
					background: rgba(20, 20, 40, 0.6);
					backdrop-filter: blur(20px);
					border: 1px solid rgba(0, 240, 255, 0.3);
					border-radius: 24px;
					padding: 3rem;
					max-width: 700px;
					width: 100%;
					box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 240, 255, 0.3);
					animation: fade-in 0.8s ease-out;
				}
				
				.trophy-icon {
					font-size: 5rem;
					margin-bottom: 1.5rem;
					text-shadow: 0 0 20px var(--neon-yellow), 0 0 40px var(--neon-yellow);
					animation: neonPulse 2s ease-in-out infinite;
				}
				
				.result-title {
					font-family: 'Roboto', sans-serif;
					font-size: clamp(2rem, 5vw, 3.5rem);
					font-weight: 700;
					color: var(--neon-yellow);
					margin-bottom: 2rem;
					text-shadow: 0 0 15px var(--neon-yellow);
				}
				
				.winner-announcement {
					font-family: 'Roboto', sans-serif;
					font-size: clamp(1.5rem, 3vw, 2rem);
					font-weight: 700;
					color: var(--neon-cyan);
					margin-bottom: 2rem;
					text-shadow: 0 0 10px var(--neon-cyan);
				}
				
				.score-display {
					display: flex;
					justify-content: space-around;
					align-items: center;
					margin: 2.5rem 0;
					gap: 2rem;
				}
				
				.score-item {
					text-align: center;
					flex: 1;
				}
				
				.score-value {
					font-family: 'Roboto', sans-serif;
					font-size: clamp(3rem, 6vw, 5rem);
					font-weight: 700;
					margin-bottom: 0.5rem;
				}
				
				.score-label {
					font-family: 'Roboto', sans-serif;
					font-size: 0.875rem;
					color: rgba(255, 255, 255, 0.6);
					margin-bottom: 0.75rem;
				}
				
				.player-name {
					font-family: 'Roboto', sans-serif;
					font-size: clamp(1rem, 2vw, 1.25rem);
					font-weight: 700;
					color: white;
					word-break: break-word;
				}
				
				.winner-score {
					color: var(--neon-green);
					text-shadow: 0 0 15px var(--neon-green);
				}
				
				.loser-score {
					color: rgba(255, 100, 100, 0.8);
				}
				
				.winner-name {
					color: var(--neon-cyan);
					text-shadow: 0 0 10px var(--neon-cyan);
				}
				
				.loser-name {
					color: rgba(255, 255, 255, 0.7);
				}
				
				.vs-divider {
					font-family: 'Roboto', sans-serif;
					font-size: clamp(2rem, 4vw, 3rem);
					color: rgba(255, 255, 255, 0.3);
					font-weight: 700;
				}
				
				.thanks-message {
					font-family: 'Roboto', sans-serif;
					font-size: 1.25rem;
					color: var(--neon-magenta);
					margin-top: 2rem;
					margin-bottom: 2rem;
					text-shadow: 0 0 10px var(--neon-magenta);
				}
			</style>
			
			<div class="result-container">
				<div class="result-card">
					<div style="text-align: center;">
						<div class="trophy-icon">${isCurrentUserWinner ? '🏆' : '😔'}</div>
						<h1 class="result-title">Game Result</h1>
						<h2 class="winner-announcement" style="color: ${isCurrentUserWinner ? 'var(--neon-green)' : 'rgba(255, 100, 100, 0.9)'};">${winnerAnnouncement}</h2>
						
						<div class="score-display">
							<div class="score-item">
								<div class="score-value ${player1IsWinner ? 'winner-score' : 'loser-score'}">${player1Score}</div>
								<div class="score-label">${player1IsWinner ? 'Winner' : 'Opponent'}</div>
								<div class="player-name ${player1IsWinner ? 'winner-name' : 'loser-name'}" style="${player1IsCurrentUser ? 'font-weight: 700;' : ''}">${player1Name}</div>
							</div>
							<div class="vs-divider">VS</div>
							<div class="score-item">
								<div class="score-value ${player2IsWinner ? 'winner-score' : 'loser-score'}">${player2Score}</div>
								<div class="score-label">${player2IsWinner ? 'Winner' : 'Opponent'}</div>
								<div class="player-name ${player2IsWinner ? 'winner-name' : 'loser-name'}" style="${player2IsCurrentUser ? 'font-weight: 700;' : ''}">${player2Name}</div>
							</div>
						</div>
						
						<p class="thanks-message">Thanks for playing!</p>
						
						<button id="go-home" class="btn-primary" style="width: 100%; padding: 1rem 2rem; font-size: 1.125rem; margin-top: 1rem;">Go to Home</button>
					</div>
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

const CLASSIC_GAME_PAGE_RESULT = (result : any) => new ClassicGameResult(result);

export { CLASSIC_GAME_PAGE_RESULT, ClassicGameResult };