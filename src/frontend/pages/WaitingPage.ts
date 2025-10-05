import { Page, GlobalState, FETCH_ADDRESS } from "../Page"

export const WAITING_PAGE: Page = {
	title: "Waiting Page",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<h1 class="text-4xl font-bold">1v1 Game</h1>
				<p class="mt-4">Welcome to the 1v1 Game Page!</p>
				<canvas id="canvas" width="800" height="600" class="border border-black mt-4"></canvas>
			`;
		}
	},
	onPreLoad: async () => {
        const socket = new WebSocket("ws://10.11.7.9:3000/ws/game");
        GlobalState.setSocket(socket);
        socket.onopen = () => {
            
        }
	},
	onLoad: async () => {
		console.log("1v1 Game page loaded");
	},
	onUnload: async () => {
        GlobalState.setSocket(null);
    }
}; 