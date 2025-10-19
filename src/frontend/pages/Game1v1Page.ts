import { gameStart } from "../game";
import { GlobalState, Page } from "../main";

class Game1v1Page implements Page {
    title: string = "1v1 Game";
    roomId: string;

    constructor(roomId: string) {
        this.roomId = roomId;
    }

    async render() : Promise<void> {
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
                <div class="w-full flex justify-end mb-4">
                    <button id="lang-en" class="mr-2">EN</button>
                    <button id="lang-tr">TR</button>
                </div>
                <h1 data-i18n="one_v_one">1v1 Game</h1>
                <strong id="roomIdDisplay">Room ID: ${this.roomId}</strong>
                <p data-i18n="please_wait">Welcome to the 1v1 Game!</p>
                <canvas id="game" width="800" height="600"></canvas>
            `;
        }
    }

    async onPreLoad() : Promise<void> {
        const socket = new WebSocket(`wss://localhost:3000/room/${this.roomId}`);

        socket.onopen = () => {
            GlobalState.setSocket(socket);
            console.log("WebSocket connection established for 1v1 game");
            socket.send(JSON.stringify({ action: "joinGame", roomId: this.roomId }));
        };
        
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Received game message:", message);
            if (message.type === "gameState") {
                console.log(`Game state update received: \nPlayer 1 Position: ${message.player1.pos.x}, ${message.player1.pos.y} Score: ${message.player1.score}\nPlayer 2 Position: ${message.player2.pos.x}, ${message.player2.pos.y} Score: ${message.player2.score}\nBall Position: ${message.ball.pos.x}, ${message.ball.pos.y}`);
                // Update game state based on message
            }
            // Handle game messages here
        };

        console.log("1v1 Game Page preloaded");
    }

    async onLoad(): Promise<void> {
        this.gameRun();
        console.log("1v1 Game Page loaded");
    }

    async onUnload(): Promise<void> {
        const socket = GlobalState.getSocket();
        if (socket) {
            socket.close();
            GlobalState.setSocket(null);
        }
        console.log("1v1 Game Page unloaded");
    }

    gameRun() {
        const canvas = document.getElementById("game") as HTMLCanvasElement;
        if (canvas) {
            const ctx = canvas.getContext("2d");
            if (ctx) {
                ctx.fillStyle = "black";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    }
}

const GAME_1V1_PAGE = (roomID : string) => new Game1v1Page(roomID);

export { GAME_1V1_PAGE, Game1v1Page };