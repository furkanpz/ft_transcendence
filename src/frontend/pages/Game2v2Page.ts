import { gameStart } from "../game";
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
                <h1>2v2 Game</h1>
                <strong id="roomIdDisplay">Room ID: ${this.roomId}</strong>
                <p>Welcome to the 2v2 Game!</p>
            `;
        }
    }

    async onPreLoad() : Promise<void> {
        const socket = new WebSocket(`ws://localhost:3000/ws/game/${this.roomId}`);

        socket.onopen = () => {
            console.log("WebSocket connection established for 2v2 game");
            socket.send(JSON.stringify({ action: "joinGame", roomId: this.roomId }));
        }; 
        
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Received game message:", message);
            // Handle game messages here
        };

        console.log("2v2 Game Page preloaded");
    }

    async onLoad(): Promise<void> {
        gameStart(true);
        console.log("2v2 Game Page loaded");
    }

    async onUnload(): Promise<void> {
        console.log("2v2 Game Page unloaded");
    }
}

const GAME_2V2_PAGE = (roomID : string) => new Game2v2Page(roomID);

export { GAME_2V2_PAGE, Game2v2Page };