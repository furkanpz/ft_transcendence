import { Page } from "../main";

class Game2v2Page implements Page {
    title: string = "2v2 Game";
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
                <h1>2v2 Game</h1>
                <strong id="roomIdDisplay">Room ID: ${this.roomId}</strong>
                <p data-i18n="please_wait">Welcome to the 2v2 Game!</p>
            `;
        }
    }

    async onPreLoad() : Promise<void> {
        const socket = new WebSocket(`wss://localhost:3000/ws/game/${this.roomId}`);

        socket.onopen = () => {
            console.log("WebSocket connection established for 2v2 game");
            socket.send(JSON.stringify({ action: "joinGame", roomId: this.roomId }));
        }; 
        
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Received game message:", message);
        };

        console.log("2v2 Game Page preloaded");
    }

    async onLoad(): Promise<void> {
        console.log("2v2 Game Page loaded");
    }

    async onUnload(): Promise<void> {
        console.log("2v2 Game Page unloaded");
    }
}

const GAME_2V2_PAGE = (roomID : string) => new Game2v2Page(roomID);

export { GAME_2V2_PAGE, Game2v2Page };