// pages/SingleGameResult.ts

import { GlobalState, Page } from "../main";
import { HOME_PAGE } from "./HomePage";

// Arayüz: SingleGame'den gelen basit sonuç objesi
interface ISingleGameResult {
    players: {
        name: string;
        score: number;
    }[];
}

class SingleGameResult implements Page {
    title: string = "Game Result";
    result: ISingleGameResult;
    
    constructor(result: ISingleGameResult) {
        this.result = result;
    }

    async render(): Promise<void> {
        const app = document.getElementById("app") as HTMLElement;
        
        // Kazananı ve skorları belirle
        const player1 = this.result.players[0];
        const player2 = this.result.players[1];
        
        const player1IsWinner = player1.score > player2.score;
        const player2IsWinner = player2.score > player1.score;
        
        const winnerName = player1IsWinner ? player1.name : player2.name;
        const winnerAnnouncement = `${winnerName} Wins!`;
        
        // HTML, ClassicGameResult'tan kopyalandı ve basitleştirildi
        // "You", "Opponent" gibi online mantıklar kaldırıldı.
        app.innerHTML = `
            <style>
                /* Stiller ClassicGameResult'tan kopyalandı */
                .result-container { min-height: calc(100vh - 80px); display: flex; align-items: center; justify-content: center; padding: 2rem; }
                .result-card { background: rgba(20, 20, 40, 0.6); backdrop-filter: blur(20px); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 24px; padding: 3rem; max-width: 700px; width: 100%; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 240, 255, 0.3); animation: fade-in 0.8s ease-out; }
                .trophy-icon { font-size: 5rem; margin-bottom: 1.5rem; text-shadow: 0 0 20px var(--neon-yellow), 0 0 40px var(--neon-yellow); animation: neonPulse 2s ease-in-out infinite; }
                .result-title { font-family: 'Roboto', sans-serif; font-size: clamp(2rem, 5vw, 3.5rem); font-weight: 700; color: var(--neon-yellow); margin-bottom: 2rem; text-shadow: 0 0 15px var(--neon-yellow); }
                .winner-announcement { font-family: 'Roboto', sans-serif; font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 700; color: var(--neon-green); margin-bottom: 2rem; text-shadow: 0 0 10px var(--neon-green); }
                .score-display { display: flex; justify-content: space-around; align-items: center; margin: 2.5rem 0; gap: 2rem; }
                .score-item { text-align: center; flex: 1; }
                .score-value { font-family: 'Roboto', sans-serif; font-size: clamp(3rem, 6vw, 5rem); font-weight: 700; margin-bottom: 0.5rem; }
                .score-label { font-family: 'Roboto', sans-serif; font-size: 0.875rem; color: rgba(255, 255, 255, 0.6); margin-bottom: 0.75rem; }
                .player-name { font-family: 'Roboto', sans-serif; font-size: clamp(1rem, 2vw, 1.25rem); font-weight: 700; color: white; word-break: break-word; }
                .winner-score { color: var(--neon-green); text-shadow: 0 0 15px var(--neon-green); }
                .loser-score { color: rgba(255, 100, 100, 0.8); }
                .winner-name { color: var(--neon-cyan); text-shadow: 0 0 10px var(--neon-cyan); }
                .loser-name { color: rgba(255, 255, 255, 0.7); }
                .vs-divider { font-family: 'Roboto', sans-serif; font-size: clamp(2rem, 4vw, 3rem); color: rgba(255, 255, 255, 0.3); font-weight: 700; }
                .thanks-message { font-family: 'Roboto', sans-serif; font-size: 1.25rem; color: var(--neon-magenta); margin-top: 2rem; margin-bottom: 2rem; text-shadow: 0 0 10px var(--neon-magenta); }
            </style>
            
            <div class="result-container">
                <div class="result-card">
                    <div style="text-align: center;">
                        <div class="trophy-icon">🏆</div>
                        <h1 class="result-title">Game Result</h1>
                        <h2 class="winner-announcement">${winnerAnnouncement}</h2>
                        
                        <div class="score-display">
                            <div class="score-item">
                                <div class="score-value ${player1IsWinner ? 'winner-score' : 'loser-score'}">${player1.score}</div>
                                <div class="score-label">${player1IsWinner ? 'Winner' : 'Loser'}</div>
                                <div class="player-name ${player1IsWinner ? 'winner-name' : 'loser-name'}">${player1.name}</div>
                            </div>
                            <div class="vs-divider">VS</div>
                            <div class="score-item">
                                <div class="score-value ${player2IsWinner ? 'winner-score' : 'loser-score'}">${player2.score}</div>
                                <div class="score-label">${player2IsWinner ? 'Winner' : 'Loser'}</div>
                                <div class="player-name ${player2IsWinner ? 'winner-name' : 'loser-name'}">${player2.name}</div>
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
        // Ana sayfaya dön butonu
        const button = document.getElementById("go-home") as HTMLButtonElement;
        button.addEventListener("click", () => {
            GlobalState.setPage(HOME_PAGE);
        });
    }

    async onUnload(): Promise<void> {}
    async onPreLoad(): Promise<void> {}
}

// Yeni sonuç sayfası için bir fabrika fonksiyonu
const SINGLE_GAME_RESULT = (result : ISingleGameResult) => new SingleGameResult(result);

export { SINGLE_GAME_RESULT, SingleGameResult };