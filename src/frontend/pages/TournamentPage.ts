import { gameStart } from "../game";
import { Page } from "../main";

class TournamentPage implements Page {
    title: string = "Tournament";
    tournamentId: string;

    constructor(tournamentId: string) {
        this.tournamentId = tournamentId;
    }

    async render() : Promise<void> {
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
                <h1>Tournament</h1>
                <strong id="tournamentIdDisplay">Tournament ID: ${this.tournamentId}</strong>
                <p>Welcome to the Tournament!</p>
            `;
        }
    }

    async onPreLoad() : Promise<void> {
        const socket = new WebSocket(`ws://localhost:3000/ws/tournament/${this.tournamentId}`);

        socket.onopen = () => {
            console.log("WebSocket connection established for Tournament");
            socket.send(JSON.stringify({ action: "joinGame", tournamentId: this.tournamentId }));
        }; 
        
        socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Received game message:", message);
            // Handle game messages here
        };

        console.log("Tournament Page preloaded");
    }

    async onLoad(): Promise<void> {
        console.log("Tournament Page loaded");
    }

    async onUnload(): Promise<void> {
        console.log("Tournament Page unloaded");
    }
}

const GAME_TOURNAMENT_PAGE = (tournamentID: string) => new TournamentPage(tournamentID);

export { GAME_TOURNAMENT_PAGE, TournamentPage };