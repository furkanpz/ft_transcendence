import { ClassicGame } from "./ClassicGame";
import { GlobalState, Page, FETCH_ADDRESS } from "../main";
import { HOME_PAGE } from "./HomePage";
import { CLASSIC_GAME_PAGE_RESULT } from "./ClassicGameResult";
import { GAME_TOURNAMENT_PAGE } from "./TournamentPage";

class ClassicGamePage implements Page {
    title: string = "1v1 Game";
    roomId: string;
    game: ClassicGame | undefined = undefined;
    currentUserId: number | null = null;

    constructor(roomId: string) {
        this.roomId = roomId;
    }

    async render() : Promise<void> {
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `

            <style>
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                .neon-text-cyan {
                    text-shadow: 0 0 5px #00BFFF, 0 0 10px #00BFFF, 0 0 20px #00BFFF;
                }
                .neon-text-green {
                    text-shadow: 0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 20px #39FF14;
                }
                .neon-text-magenta {
                    text-shadow: 0 0 5px #FF00FF, 0 0 10px #FF00FF, 0 0 20px #FF00FF;
                }
                .neon-shadow-magenta {
                    box-shadow: 0 0 10px #FF00FF, 0 0 20px #FF00FF, 0 0 30px #FF00FF;
                }
                .neon-border-cyan {
                    border: 2px solid #00BFFF;
                    box-shadow: 0 0 5px #00BFFF, 0 0 10px #00BFFF;
                }
            </style>

            <div class="w-full" style="min-height: calc(100vh - 80px); background: #000010; color: white; padding: 2rem; display: flex; flex-direction: column; align-items: center; font-family: 'Roboto', sans-serif;">
                
                <h1 data-i18n="one_v_one" style="font-family: 'Roboto', sans-serif; font-size: clamp(1.875rem, 4vw, 3rem); font-weight: 700; color: #00BFFF; margin-bottom: 1rem; text-shadow: 0 0 10px #00BFFF;">1v1 Game</h1>

                <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; width: 100%; max-width: 1200px; gap: 2rem;">
                    
                    <div style="text-align: center; min-width: 150px;">
                        <h2 id="player1-name" style="font-family: 'Roboto', sans-serif; font-size: clamp(1rem, 2vw, 1.5rem); font-weight: 700; color: #00BFFF; text-shadow: 0 0 10px #00BFFF; word-break: break-word;">
                            -
                        </h2>
                        <div id="player1-score" style="font-family: 'Roboto', sans-serif; font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 700; color: #00BFFF; margin-top: 0.5rem;">0</div>
                    </div>

                    <div style="flex: 1; display: flex; justify-content: center;">
                        <canvas id="game" width="800" height="600" style="width: 100%; max-width: 800px; height: auto; aspect-ratio: 4/3; border-radius: 12px; box-shadow: 0 0 20px #FF00FF, 0 0 40px #FF00FF, 0 0 60px #FF00FF;"></canvas>
                    </div>

                    <div style="text-align: center; min-width: 150px;">
                        <h2 id="player2-name" style="font-family: 'Roboto', sans-serif; font-size: clamp(1rem, 2vw, 1.5rem); font-weight: 700; color: #39FF14; text-shadow: 0 0 10px #39FF14; word-break: break-word;">
                            -
                        </h2>
                        <div id="player2-score" style="font-family: 'Roboto', sans-serif; font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 700; color: #39FF14; margin-top: 0.5rem;">0</div>
                    </div>

                </div>
            </div>
            `;
        }
    }

    async onPreLoad() : Promise<void> {
        const socket = new WebSocket(`wss://localhost:3000/room/${this.roomId}`);
        
        return new Promise<void>((resolve) => {
            const timeout = setTimeout(() => {
                console.warn('WebSocket connection taking longer than expected for room:', this.roomId);
                resolve();
            }, 3000);
            
            socket.onopen = () => {
                clearTimeout(timeout);
                console.log('WebSocket connected to room:', this.roomId);
                GlobalState.setSocket(socket);
                socket.send(JSON.stringify({ action: "joinGame", roomId: this.roomId }));
                this.game = new ClassicGame(socket);
                resolve();
            };
            
            socket.onerror = (error) => {
                clearTimeout(timeout);
                console.error('WebSocket error for room:', this.roomId, error);
                resolve();
            };
            
            socket.onclose = (event) => {
                clearTimeout(timeout);
                if (event.code !== 1000 && socket.readyState !== WebSocket.OPEN) {
                    console.error('WebSocket closed before connection established:', event.code, event.reason);
                }
                resolve();
            };

            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                const opponentName = localStorage.getItem('currentOpponent') || message.opponent || 'Opponent';
                const currentUsername = localStorage.getItem('username') || 'You';
                const player1NameEl = document.getElementById("player1-name");
                const player2NameEl = document.getElementById("player2-name");
                
                if (message.players && Array.isArray(message.players) && message.players.length >= 2) {
                    let currentUserPlayerIndex = -1;
                    if (this.currentUserId !== null) {
                        currentUserPlayerIndex = message.players.findIndex((p: any) => p.id === this.currentUserId);
                    }
                    
                    if (currentUserPlayerIndex === 0) {
                        if (player1NameEl) {
                            player1NameEl.textContent = currentUsername === 'You' ? 'You' : currentUsername;
                        }
                        if (player2NameEl) {
                            player2NameEl.textContent = opponentName;
                        }
                    } else if (currentUserPlayerIndex === 1) {
                        if (player1NameEl) {
                            player1NameEl.textContent = opponentName;
                        }
                        if (player2NameEl) {
                            player2NameEl.textContent = currentUsername === 'You' ? 'You' : currentUsername;
                        }
                    } else {
                        if (player1NameEl) {
                            player1NameEl.textContent = currentUsername === 'You' ? 'You' : currentUsername;
                        }
                        if (player2NameEl) {
                            player2NameEl.textContent = opponentName;
                        }
                    }
                } else {
                    if (player1NameEl && player1NameEl.textContent === '-') {
                        player1NameEl.textContent = currentUsername === 'You' ? 'You' : currentUsername;
                    }
                    if (player2NameEl && player2NameEl.textContent === '-') {
                        player2NameEl.textContent = opponentName;
                    }
                }
                
                if (message.type === "gameState" && message.players && message.players.length >= 2) {
                    const player1ScoreEl = document.getElementById("player1-score");
                    const player2ScoreEl = document.getElementById("player2-score");
                    if (player1ScoreEl && message.players[0]) {
                        player1ScoreEl.textContent = message.players[0].score || 0;
                    }
                    if (player2ScoreEl && message.players[1]) {
                        player2ScoreEl.textContent = message.players[1].score || 0;
                    }
                }
                
                this.game!.handleEvents(message);
                if (message.action == "gameEnded") {
                    if (message.result && message.result.players && this.currentUserId !== null) {
                        const currentUserIndex = message.result.players.findIndex((p: any) => p.id === this.currentUserId);
                        const currentUser = localStorage.getItem('username') || 'Player 1';
                        const opponent = localStorage.getItem('currentOpponent') || 'Player 2';
                        
                        if (currentUserIndex === 0) {
                            message.result.players[0].username = currentUser;
                            message.result.players[1].username = opponent;
                        } else if (currentUserIndex === 1) {
                            message.result.players[0].username = opponent;
                            message.result.players[1].username = currentUser;
                        } else {
                            message.result.players[0].username = currentUser;
                            message.result.players[1].username = opponent;
                        }
                    }
                    
                    const activeTournament = localStorage.getItem('activeTournament');
                    if (activeTournament) {
                        setTimeout(() => {
                            GlobalState.setPage(GAME_TOURNAMENT_PAGE(activeTournament));
                        }, 3000);
                    } else {
                        GlobalState.setPage(CLASSIC_GAME_PAGE_RESULT(message.result));
                    }
                    
                    localStorage.removeItem('currentOpponent');
                }
            };
        });
    }

    async onLoad(): Promise<void> {
        try {
            const response = await fetch(`${FETCH_ADDRESS}/user/profile`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            if (response.ok) {
                const userData = await response.json();
                this.currentUserId = userData.id || null;
            }
        } catch (error) {
            console.error('Failed to fetch current user ID:', error);
        }
        
        this.gameRun();
    }

    async onUnload(): Promise<void> {

        if (this.game) {
            this.game?.stopGame();
        }

        const socket = GlobalState.getSocket();
        if (socket) {
            socket.close();
            GlobalState.setSocket(null);
        }
    }

    gameRun() {
        const canvas = document.getElementById("game") as HTMLCanvasElement;
        if (canvas) {
            const socket = GlobalState.getSocket();
            if (!socket) {
                console.error("WebSocket is not established.");
                return;
            }
            this.game?.setCanvas(canvas);
            this.game?.gameStart();
        }
    }
}

const CLASSIC_GAME_PAGE = (roomID : string) => new ClassicGamePage(roomID);

export { CLASSIC_GAME_PAGE, ClassicGamePage };