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
			<style>
				.home-container {
					max-width: 1400px;
					margin: 0 auto;
					padding: 0 2rem;
				}
				.game-buttons-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
					gap: 1.5rem;
					width: 100%;
					max-width: 900px;
				}
			</style>
			
			<div class="home-container animate-fade-in">
				<div style="min-height: calc(100vh - 80px); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 3rem 0;">
					<div class="game-buttons-grid animate-scale-in">
						${!this.data ? `
							<button onclick="GlobalState.setPage(MATCHMAKING_PAGE('classic'))" class="btn-primary" data-i18n="one_v_one" style="padding: 1.5rem 2rem; font-size: 1.125rem;">
								1v1
							</button>
							<button onclick="GlobalState.setPage(MATCHMAKING_PAGE('classic'))" class="btn-primary" data-i18n="single_player" style="padding: 1.5rem 2rem; font-size: 1.125rem;">
								Single Player
							</button>
						` : ''}
						
						${
							this.data != null
								? `
									<button id="1v1Online-btn" class="btn-primary" style="padding: 1.5rem 2rem; font-size: 1.125rem;">
										<span data-i18n="one_v_one_online">1V1 Online</span>
									</button>

									<button id="multiplayer-btn" class="btn-secondary" style="padding: 1.5rem 2rem; font-size: 1.125rem;">
										<span data-i18n="multiplayer">Multiplayer</span>
									</button>

									<button id="tournament-btn" class="btn-secondary" style="padding: 1.5rem 2rem; font-size: 1.125rem;">
										<span data-i18n="tournament">🏆 Tournament</span>
									</button>
									
									<button id="friends-btn" class="btn-primary" style="padding: 1.5rem 2rem; font-size: 1.125rem;">
										<span data-i18n="friends">Friends</span>
									</button>

									<button id="social-btn" class="btn-success" style="padding: 1.5rem 2rem; font-size: 1.125rem;">
										<span data-i18n="social">Social</span>
									</button>

									<button id="logout" class="btn-danger" style="padding: 1rem 2rem; font-size: 1rem;">
										<span data-i18n="logout">Logout</span>
									</button>
							  `
								: ""
						}
					</div>
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