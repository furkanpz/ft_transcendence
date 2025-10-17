import { gameStart } from "../game";
import { Page } from "../main";

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
            `;
        }
    }

    async onPreLoad() : Promise<void> {
        const socket = new WebSocket(`wss://localhost:3000/ws/game/${this.roomId}`);

        socket.onopen = () => {
            console.log("WebSocket connection established for 1v1 game");
            socket.send(JSON.stringify({ action: "joinGame", roomId: this.roomId }));
        }; 
        
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Received game message:", message);
            // Handle game messages here
        };

        console.log("1v1 Game Page preloaded");
    }

    async onLoad(): Promise<void> {
        gameStart(true);
        console.log("1v1 Game Page loaded");
    }

    async onUnload(): Promise<void> {
        console.log("1v1 Game Page unloaded");
    }
}

const GAME_1V1_PAGE = (roomID : string) => new Game1v1Page(roomID);

export { GAME_1V1_PAGE, Game1v1Page };