import { GameRoom } from "../../backend/server/types/game.types";
import { GlobalState, Page, FETCH_ADDRESS } from "../Page";

export const LOBBY_PAGE: Page = {
	title: "Lobby",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<div class="flex justify-center">
					<div id="waitingPopup" class="hidden fixed inset-0 bg-black bg-opacity-50 items-center justify-center">
						<div class="bg-white p-6 rounded-lg w-1/3 text-center">
							<h2 class="text-2xl font-semibold text-gray-700">Waiting for Players...</h2>
							<p class="mt-2 text-gray-500">Please wait while the room is being prepared.</p>
							<button onclick="BURADA ODA KAPATILACAK" class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md">Close</button>
						</div>
					</div>
				</div>
				<div> 
					<div class="text-center">
					<button onclick="GlobalState.setPage(HOME_PAGE)" 
                class="px-6 py-3 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition">
                 Back To Home Page
                 </button>
						<button onclick="window.createRoom()" 
						class="px-6 py-3 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition">
							Create Room
						</button>
							<div class="flex justify-between items-start ...">
								<div class="flex flex-col h-full w-1/4 text-center">
									<div class="w-full ">
										<span class="text-md text-slate-500">ID</span>
									</div>
									<div class="w-full my-auto">
										<span class="truncate text-lg font-semibold"></span>
									</div>
									</div>
									<div class="flex flex-col h-full w-1/4 text-center">
										<div class="w-full ">
											<span class="text-md text-slate-500">Player Count</span>
										</div>
									<div class="w-full my-auto">
									<span class="truncate text-lg"></span>
									</div>
								</div>
									<div class="flex flex-col h-full w-1/4 text-center">
									<div class="w-full ">
									<span class="text-md text-slate-500">Status</span>
									</div>
									<div class="text-xs truncate my-auto">
									<span class="text-lg overflow-hidden whitespace-nowrap"></span>
									</div>
									</div>
									<div class="flex flex-col h-full w-1/4 text-center">
									<div class="w-full my-auto">
									<button onclick="joinRoom('');" class="text-lg p-4 bg-blue-500 cursor-pointer rounded-2xl text-white">Join</button>
								</div>
							</div>
						</div>
					</div>
                </div>
			`;
		}
	},
	onPreLoad: async () => {
		console.log("Preparing to load Lobby page")
	},
	onLoad: async () => {console.log("Lobby page loaded")},
	onUnload: async () => {console.log("Lobby page unloaded")}
}