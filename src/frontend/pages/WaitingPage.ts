import { Page, GlobalState, FETCH_ADDRESS } from "../Page"
import { HOME_PAGE } from "./HomePage";

export const WAITING_PAGE: Page = {
	title: "Waiting Page",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<div id="waiting-popup" class=" fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
					<div class="bg-white rounded-lg shadow-lg p-8 text-center w-[300px]">
						<h2 class="text-2xl font-bold mb-4">Waiting...</h2>
						<p class="text-gray-600 mb-6">Looking for an opponent</p>
						<button id="cancel-waiting" class="bg-red-500 cursor-pointer text-white px-4 py-2 rounded hover:bg-red-600">Cancel</button>
					</div>
				</div>
			`;
		}
		const cancelBtn = document.getElementById("cancel-waiting");
		if (cancelBtn)
		{
			cancelBtn.addEventListener("click", () => {
				GlobalState.setPage(HOME_PAGE);
			})
		} 
	},
	onPreLoad: async () => {
        const socket = new WebSocket("ws://10.11.7.9:3000/ws/game");
        GlobalState.setSocket(socket);
        socket.onopen = () => {
            socket.send(JSON.stringify({type: "searchGame", roomType: "classic"}));
        }
        socket.onclose = () => {

        }
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type == "playerJoined")
                console.log("Player Joined");
        }
	},
	onLoad: async () => {
		console.log("1v1 Game page loaded");
	},
	onUnload: async () => {
        //socket burada kapanıypor
        GlobalState.getSocket()?.close();
        GlobalState.setSocket(null);
    }
}; 