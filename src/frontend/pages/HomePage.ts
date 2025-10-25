import { GlobalState, Page, FETCH_ADDRESS } from "../main"
import { FRIENDS_PAGE } from "./FriendsPage";
import { LOGIN_PAGE } from "./LoginPage";
import { SIGNUP_PAGE } from "./SignUpPage";
import { MATCHMAKING_PAGE } from "./MatchmakingPage";
import { CHAT_PAGE } from "./ChatPage";
import { PROFILE_PAGE } from "./ProfilePage";
import { GAME_TOURNAMENT_PAGE } from "./TournamentPage";

class HomePage implements Page {
	title: string = "Home";
	data: any;
	async render() : Promise<void> {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
			<div class="mx-32">
				<!-- Logo and Title -->
				<nav id="nav" class="px-32 py-2 flex flex-row w-full bg-blue-500 rounded-b-xl justify-between">
					<div>
						<button onclick="GlobalState.setPage(HOME_PAGE)" class="font-bold cursor-pointer text-6xl" data-i18n="PONG">PONG</button>
					</div>
					<div class="flex items-center">
						<!-- Language selector -->
						<div class="mr-4 text-white">
							<button id="lang-en" class="mr-2">EN</button>
							<button id="lang-tr">TR</button>
						</div>
					${
						this.data ? `<button id=\"authButton\" onclick=\"GlobalState.setPage(PROFILE_PAGE)\"
						class=\"cursor-pointer text-2xl font-semibold text-white hover:text-amber-400\">${this.data}</button>` : `<button id=\"authButton\" onclick=\"GlobalState.setPage(LOGIN_PAGE)\"
						class=\"cursor-pointer text-2xl font-semibold text-white hover:text-amber-400\" data-i18n=\"login\">Login</button>`
					}
						
					</div>
				</nav>

				<!-- main body -->
				<div class="mx-32 h-[92vh] text-center items-center flex flex-col justify-center gap-6">
					<div class="flex flex-row w-2xl justify-between gap-6">
						<button onclick="GlobalState.setPage(MATCHMAKING_PAGE('classic'))" 
							class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out" data-i18n="one_v_one">
							1v1
						</button>
						<button onclick="GlobalState.setPage(MATCHMAKING_PAGE('classic'))" 
							class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out" data-i18n="single_player">
							Single Player
						</button>
					</div>
					${
						
						this.data != null
							? `
								<button  id="1v1Online-btn" onClick=""
									class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
									<span data-i18n="one_v_one_online">1V1 Online</span>
								</button>

								<button id="multiplayer-btn" onClick=""
									class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
									<span data-i18n="multiplayer">Multiplayer</span>
								</button>

								<button id="multiplayer-btn" onClick=""
									class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
									<span data-i18n="multiplayer">Multiplayer</span>
								</button>

								<button id="tournament-btn"
									class="bg-purple-600 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-purple-800 transition duration-300 ease-in-out">
									<span data-i18n="tournament">🏆 Tournament</span>
								</button>
								
								<button id="friends-btn"
									class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
									<span data-i18n="friends">Friends</span>
								</button>

								<button id="social-btn"
                					class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-orange-700 transition duration-300 ease-in-out">
									<span data-i18n="social">Social</span>
            					</button>

								<button id="logout"
									class="bg-red-500 text-white px-4 cursor-pointer py-2 rounded">
									<span data-i18n="logout">Logout</span>
								</button>
							  `
							: ""
					}
				</div>
				
			</div>
			`;
		}
	}

	async onPreLoad(): Promise<void> {
		console.log("Home page preloading");
		const response =  await fetch(`${FETCH_ADDRESS}/auth/check`, {credentials: "include"});
		if (response.ok)
		{
			const dataWeHave = await response.json();
			console.log("datawehabe: ", dataWeHave);
			this.data = dataWeHave.username;
		}
		else{ this.data = null;}
	}

	async onLoad() : Promise<void> {
		console.log("Home page loaded");
		
		const activeTournament = localStorage.getItem('activeTournament');
		if (activeTournament && this.data) {
			console.log("Found active tournament, redirecting:", activeTournament);
			GlobalState.setPage(GAME_TOURNAMENT_PAGE(activeTournament));
			return;
		}
		
		const PVPBtn = document.getElementById("1v1Online-btn");
		if (PVPBtn)
		{
			PVPBtn.addEventListener("click", () => {GlobalState.setPage(MATCHMAKING_PAGE('classic'))});
		}

		const multiplayerBtn = document.getElementById("multiplayer-btn");
		if (multiplayerBtn)
		{
			multiplayerBtn.addEventListener("click", () => {GlobalState.setPage(MATCHMAKING_PAGE('multiplayer'))});
		}
		
		const tournamentBtn = document.getElementById("tournament-btn");
		if (tournamentBtn)
		{
			tournamentBtn.addEventListener("click", () => {GlobalState.setPage(MATCHMAKING_PAGE('tournament'))});
		}
		
		const friendsBtn = document.getElementById("friends-btn");
		if (friendsBtn)
		{
			friendsBtn.addEventListener("click", async () => {
				GlobalState.setPage(FRIENDS_PAGE);
			})
		}

		const socialBtn = document.getElementById("social-btn");
		if (socialBtn) {
			socialBtn.addEventListener("click", async () => {
				GlobalState.setPage(CHAT_PAGE);
			});
		}

		const logoutBtn = document.getElementById("logout");
		if (logoutBtn) {
			logoutBtn.addEventListener("click", async () => {
				await fetch(`${FETCH_ADDRESS}/auth/logout`, {credentials: "include"});
				localStorage.removeItem('activeTournament');
				window.location.reload();
			});
		}
	}

	async onUnload(): Promise<void> {
		console.log("Home page unloaded");
	}
};

const HOME_PAGE = new HomePage();

export { HomePage, HOME_PAGE };