import { GlobalState, Page } from "../main";
import { MultiplayerGame } from "./MultiplayerGame";
import { MULTIPLAYER_GAME_PAGE_RESULT } from "./MultiplayerGameResult";

class MultiplayerGamePage implements Page {
    title: string = "Multiplayer Game";
    roomId: string;
    game: MultiplayerGame | undefined = undefined;

    constructor(roomId: string) {
        this.roomId = roomId;
    }

    async render() : Promise<void> {
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
            <style>
                .neon-text-cyan { color: #00BFFF; text-shadow: 0 0 10px #00BFFF, 0 0 20px #00BFFF; }
                .neon-text-green { color: #39FF14; text-shadow: 0 0 10px #39FF14, 0 0 20px #39FF14; }
                .neon-text-magenta { color: #FF00FF; text-shadow: 0 0 10px #FF00FF, 0 0 20px #FF00FF; }
                .neon-shadow-magenta { box-shadow: 0 0 20px #FF00FF, 0 0 40px #FF00FF; border-radius: 12px; }
            </style>

            <div class="w-full" style="min-height: calc(100vh - 80px); background: #000010; color: white; padding: 2rem; display: flex; flex-direction: column; align-items: center; font-family: 'Roboto', sans-serif;">
                <h1 style="font-size: clamp(1.875rem, 4vw, 3rem); font-weight: 700; color: #00BFFF; margin-bottom: 0.5rem; text-shadow: 0 0 10px #00BFFF;">2v2 Game</h1>
                <strong id="roomIdDisplay" class="neon-text-magenta" style="margin-bottom: 0.5rem;">Room ID: ${this.roomId}</strong>
                <p style="color: rgba(255,255,255,0.75); margin-bottom: 1rem;">Welcome to the 2v2 Game!</p>

                <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; width: 100%; max-width: 1200px; gap: 1rem;">
                    <div style="text-align: center; min-width: 150px;">
                        <h2 id="player1-name" class="neon-text-cyan" style="font-size: clamp(1rem, 2vw, 1.5rem); font-weight: 700;">Team Left</h2>
                    </div>

                    <div style="flex: 1; display: flex; justify-content: center;">
                        <canvas id="game" width="800" height="1200" style="width: 100%; max-width: 800px; height: auto; aspect-ratio: 2/3;" class="neon-shadow-magenta"></canvas>
                    </div>

                    <div style="text-align: center; min-width: 150px;">
                        <h2 id="player2-name" class="neon-text-green" style="font-size: clamp(1rem, 2vw, 1.5rem); font-weight: 700;">Team Right</h2>
                    </div>
                </div>
            </div>
            `;
        }
    }

    async onPreLoad() : Promise<void> {
        return new Promise<void>((resolve) => {
            const socket = new WebSocket(`wss://localhost:3000/room/${this.roomId}`);

            const timeout = setTimeout(() => {
                console.warn('WebSocket connection taking longer than expected for room:', this.roomId);
                resolve();
            }, 3000);

            socket.onopen = () => {
                clearTimeout(timeout);
                GlobalState.setSocket(socket);
                socket.send(JSON.stringify({ action: "joinGame", roomId: this.roomId }));
                this.game = new MultiplayerGame(socket);
                resolve();
            };

            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                console.log("MultiplayerGamePage received message:", message);
                if (this.game) {
                    this.game.handleEvents(message);
                }
                if (message.action == "gameEnded") {
                    GlobalState.setPage(MULTIPLAYER_GAME_PAGE_RESULT(message.result));
                }
            };

            socket.onerror = (err) => {
                clearTimeout(timeout);
                console.error('WebSocket error for room:', this.roomId, err);
                resolve();
            };

            socket.onclose = () => {
                clearTimeout(timeout);
            };
        });
    }

    async onLoad(): Promise<void> {
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

const MULTIPLAYER_GAME_PAGE = (roomID : string) => new MultiplayerGamePage(roomID);

export { MULTIPLAYER_GAME_PAGE, MultiplayerGamePage };