import { GlobalState, Page, FETCH_ADDRESS } from "../main"
import { LOGIN_PAGE } from "./LoginPage";
import { SIGNUP_PAGE } from "./SignUpPage";
import { MATCHMAKING_PAGE } from "./MatchmakingPage";
import { PROFILE_PAGE } from "./ProfilePage";
import { GAME_TOURNAMENT_PAGE } from "./TournamentPage";
import { SINGLE_GAME_PAGE } from "./SingleGamePage";

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

				/* New modern mode buttons */
				.mode-btn {
					position: relative;
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					gap: 0.5rem;
					padding: 1.5rem 1.75rem;
					border: 1px solid rgba(255,255,255,0.12);
					border-radius: 16px;
					background: radial-gradient(120% 120% at 0% 0%, rgba(0,240,255,0.08) 0%, rgba(255,0,102,0.05) 60%, rgba(0,0,0,0.2) 100%);
					backdrop-filter: blur(10px);
					color: #fff;
					font-weight: 700;
					text-align: center;
					cursor: pointer;
					transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
				}
				.mode-btn:hover {
					transform: translateY(-3px);
					box-shadow: 0 8px 28px rgba(0, 240, 255, 0.2);
					border-color: rgba(0, 240, 255, 0.35);
				}
				.mode-btn:active { transform: translateY(-1px); }

				.mode-title { font-size: 1.15rem; letter-spacing: .02em; }
				.mode-sub { font-size: .85rem; opacity: .75; font-weight: 500; }

				/* Accents per mode */
				.mode-1v1::after,
				.mode-multi::after,
				.mode-tourney::after {
					content: "";
					position: absolute;
					inset: -1px;
					border-radius: 16px;
					padding: 1px;
					background: linear-gradient(135deg, rgba(0,240,255,.45), rgba(255,0,102,.35));
					-webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
					-webkit-mask-composite: xor;
					mask-composite: exclude;
					pointer-events: none;
				}
				.mode-1v1 svg { color: var(--neon-cyan); }
				.mode-multi svg { color: var(--neon-purple); }
				.mode-tourney svg { color: var(--neon-yellow); }

				.mode-icon {
					width: 40px; height: 40px;
					filter: drop-shadow(0 0 10px rgba(0,240,255,0.25));
				}

				/* Centered logout under grid */
				.logout-wrapper {
					grid-column: 1 / -1;
					display: flex;
					justify-content: center;
					margin-top: 0.5rem;
				}
				.btn-logout {
					padding: 0.85rem 1.5rem;
					font-size: 0.95rem;
					border-radius: 12px;
					border: 1px solid rgba(255,255,255,0.12);
					background: rgba(0,0,0,0.25);
					backdrop-filter: blur(6px);
					color: #fff;
					cursor: pointer;
					transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
				}
				.btn-logout:hover {
					transform: translateY(-2px);
					box-shadow: 0 8px 24px rgba(0,240,255,0.18);
					border-color: rgba(0,240,255,0.35);
				}
			</style>
			
			<div class="home-container animate-fade-in">
				<div style="min-height: calc(100vh - 80px); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 3rem 0;">
					<div class="game-buttons-grid animate-scale-in">
						${!this.data ? `
							<button onclick="GlobalState.setPage(MATCHMAKING_PAGE('classic'))" class="btn-primary" data-i18n="one_v_one" style="padding: 1.5rem 2rem; font-size: 1.125rem;">
								1v1
							</button>
							<button onclick="GlobalState.setPage(SINGLE_GAME_PAGE)" class="btn-primary" data-i18n="single_player" style="padding: 1.5rem 2rem; font-size: 1.125rem;">
								Single Player
							</button>
							<button onclick="GlobalState.setPage(MATCHMAKING_PAGE('tournament'))" class="btn-secondary" style="padding: 1.5rem 2rem; font-size: 1.125rem;" data-i18n="tournament_guest">
								Tournament (Guest)
							</button>
						` : ''}
						
						${
							this.data != null
								? `
									<button id="1v1Local-btn" class="mode-btn mode-1v1">
                                        <svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                            <circle cx="9" cy="7" r="4"/>
                                            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
                                            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                                        </svg>
											<div class="mode-title" data-i18n="one_v_one_local">1V1 Local</div>
											<div class="mode-sub" data-i18n="same_machine">Play on the same machine</div>
                                    </button>

									<button id="1v1Online-btn" class="mode-btn mode-1v1">
										<svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
											<circle cx="7" cy="12" r="3"/>
											<circle cx="17" cy="12" r="3"/>
											<path d="M9.5 12h5"/>
										</svg>
										<div class="mode-title" data-i18n="one_v_one_online">1V1 Online</div>
										<div class="mode-sub" data-i18n="fast_matches">Fast competitive matches</div>
									</button>

									<button id="multiplayer-btn" class="mode-btn mode-multi">
										<svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
											<path d="M6 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
											<path d="M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"/>
											<path d="M3 20c0-3 3-5 6-5s6 2 6 5"/>
											<path d="M15 15c3 0 6 2 6 5"/>
										</svg>
										<div class="mode-title" data-i18n="multiplayer">Multiplayer</div>
										<div class="mode-sub" data-i18n="play_with_friends">Play with friends or teams</div>
									</button>

									<button id="tournament-btn" class="mode-btn mode-tourney">
										<svg class="mode-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
											<path d="M4 4h16v4a6 6 0 0 1-6 6H10A6 6 0 0 1 4 8V4Z"/>
											<path d="M12 20v-6"/>
											<path d="M8 20h8"/>
										</svg>
										<div class="mode-title" data-i18n="tournament">Tournament</div>
										<div class="mode-sub" data-i18n="bracket_elimination">Bracket elimination mode</div>
									</button>

									<div class="logout-wrapper">
										<button id="logout" class="btn-logout">
											<span data-i18n="logout">Logout</span>
										</button>
									</div>
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
		if (activeTournament) {
			console.log("Found active tournament, redirecting:", activeTournament);
			GlobalState.setPage(GAME_TOURNAMENT_PAGE(activeTournament));
			return;
		}

		const LocalBtn = document.getElementById("1v1Local-btn");
		if (LocalBtn)
		{
			LocalBtn.addEventListener("click", () => GlobalState.setPage(SINGLE_GAME_PAGE));
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

		const logoutBtn = document.getElementById("logout");
		if (logoutBtn) {
			logoutBtn.addEventListener("click", async () => {
				await fetch(`${FETCH_ADDRESS}/auth/logout`, {credentials: "include"});
				localStorage.removeItem('activeTournament');
				localStorage.removeItem('username');
				localStorage.removeItem('guestAlias');
				localStorage.removeItem('guestPlayerId');
				localStorage.removeItem('currentGuestId');
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