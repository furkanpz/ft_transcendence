import { GlobalState, Page, FETCH_ADDRESS } from "../Page"
import { FRIENDS_PAGE } from "./FriendsPage"

export const HOME_PAGE: Page = {
	title: "Home",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
			<div class="mx-32">
				<!-- Logo and Title -->
				<nav id="nav" class="px-32 py-2 flex flex-row w-full bg-blue-500 rounded-b-xl justify-between">
					<div>
						<button onclick="GlobalState.setPage(HOME_PAGE)" class="font-bold cursor-pointer text-6xl">PONG</button>
					</div>
					<div class="flex items-center">
					${
						window.localStorage.getItem("isAuthenticated") === "1" ? `<button id="authButton" onclick="GlobalState.setPage(LOGIN_PAGE)"
						class="cursor-pointer text-2xl font-semibold text-white hover:text-amber-400">Profil</button>` : `<button id="authButton" onclick="GlobalState.setPage(LOGIN_PAGE)"
						class="cursor-pointer text-2xl font-semibold text-white hover:text-amber-400">Login</button>`
					}
						
					</div>
				</nav>

				<!-- main body -->
				<div class="mx-32 h-[92vh] text-center items-center flex flex-col justify-center gap-6">
					<div class="flex flex-row w-2xl justify-between gap-6">
						<button onclick="GlobalState.setPage(PVP_GAME_PAGE)" 
							class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
							1v1
						</button>
						<button onclick="GlobalState.setPage(AI_GAME_PAGE)" 
							class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
							Single Player
						</button>
					</div>

					${
						window.localStorage.getItem("isAuthenticated") === "1"
							? `
								<button  id="1v1Online-btn"
									class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
									1V1 Online
								</button>

								<button onclick="GlobalState.setPage(LOBBY_PAGE)" id="tournament-btn"
									class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
									Tournament
								</button>
								
								<button id="friends-btn"
									class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
									Friends
								</button>
								<button id="logout"
									class="bg-red-500 text-white px-4 cursor-pointer py-2 rounded">
									Logout
								</button>
							  `
							: ""
					}
				</div>
				<div id="waiting-popup" class="hidden fixed inset-0 bg-black bg-opacity-50 items-center justify-center z-50">
					<div class="bg-white rounded-lg shadow-lg p-8 text-center w-[300px]">
						<h2 class="text-2xl font-bold mb-4">Waiting...</h2>
						<p class="text-gray-600 mb-6">Looking for an opponent</p>
						<button id="cancel-waiting" class="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">Cancel</button>
					</div>
				</div>
			</div>
			`;
			const multiplayerBtn = document.getElementById("1v1Online-btn");
			const waitingPopup = document.getElementById("waiting-popup");
			const cancelBtn = document.getElementById("cancel-waiting");
			if (multiplayerBtn && waitingPopup && cancelBtn) {
				multiplayerBtn.addEventListener("click", () => {
					waitingPopup.classList.remove("hidden");
					waitingPopup.classList.add("flex");
					
				});

				cancelBtn.addEventListener("click", () => {
					waitingPopup.classList.remove("flex");
					waitingPopup.classList.add("hidden");
				});
			}
			const friendsBtn = document.getElementById("friends-btn");
			if (friendsBtn)
			{
				friendsBtn.addEventListener("click", async () => {
					GlobalState.setPage(FRIENDS_PAGE);
				})
			}

			const logoutBtn = document.getElementById("logout");
			if (logoutBtn) {
				logoutBtn.addEventListener("click", async () => {
					await fetch(`${FETCH_ADDRESS}/auth/logout`, {credentials: "include"});
					window.localStorage.removeItem("isAuthenticated");
					window.location.reload();
				});
			}
		}
	},
	onPreLoad: async () => {
		console.log("Preparing to load Home page");
	},
	onLoad: async () => {
		console.log("Home page loaded");
	},
	onUnload: async () => {
		console.log("Home page unloaded");
	}
};