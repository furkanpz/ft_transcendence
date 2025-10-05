import { gameStart } from "./game";
import { loadPage } from "./main";
import { Page, GlobalState, FETCH_ADDRESS } from "./Page";
import { HOME_PAGE } from "./pages/HomePage";
import { LOGIN_PAGE, login } from "./pages/LoginPage"
import { SIGNUP_PAGE, signUp } from "./pages/SignUpPage"
import { PROFILE_PAGE } from "./pages/ProfilePage"
import { FRIENDS_PAGE } from "./pages/FriendsPage"
import { LOBBY_PAGE } from "./pages/LobbyPage";

const PVP_GAME_PAGE: Page = {
	title: "1V1 Game",
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
		window.onclick = (event) => {
			console.log(event.target);
		};
		console.log("Preparing to load 1v1 Game page");
	},
	onLoad: async () => {
		gameStart(false);
		console.log("1v1 Game page loaded");
	},
	onUnload: async () => {
		window.onclick = null;
		if (GlobalState.getAnimationFrameId() !== null) {
			cancelAnimationFrame(GlobalState.getAnimationFrameId()!);
			GlobalState.setAnimationFrameId(null);
		}
		console.log("1v1 Game page unloaded");
	}
};

const AI_GAME_PAGE: Page = {
	title: "AI Game",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<h1 class="text-4xl font-bold">AI Game</h1>
				<p class="mt-4">Welcome to the AI Game page!</p>
				<canvas id="canvas" width="800" height="600" class="border border-black mt-4"></canvas>
			`;
		}
	},
	onPreLoad: async () => {
		window.onclick = (event) => {
			console.log(event.target);
		};
		console.log("Preparing to load AI Game page");
	},
	onLoad: async () => {
		gameStart(true);
		console.log("AI Game page loaded");
	},
	onUnload: async () => {
		window.onclick = null;
		if (GlobalState.getAnimationFrameId() !== null) {
			cancelAnimationFrame(GlobalState.getAnimationFrameId()!);
			GlobalState.setAnimationFrameId(null);
		}
		console.log("AI Game page unloaded");
	}
};

const PAGES: { [key: string]: Page } = {
	"home": HOME_PAGE,
	"profile": PROFILE_PAGE,
	"login": LOGIN_PAGE,
	"signup": SIGNUP_PAGE,
	"ai-game": AI_GAME_PAGE,
	"1v1-game": PVP_GAME_PAGE,
	"lobby": LOBBY_PAGE,
	"friends": FRIENDS_PAGE
};

export {
	HOME_PAGE,
	PVP_GAME_PAGE,
	PROFILE_PAGE,
	LOGIN_PAGE,
	FRIENDS_PAGE,
	SIGNUP_PAGE,
	AI_GAME_PAGE,
	LOBBY_PAGE,
	PAGES,
	signUp,
	login };