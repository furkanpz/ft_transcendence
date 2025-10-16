import { gameStart } from "./game";
import { Page, GlobalState } from "./main";
import { HOME_PAGE, HomePage } from "./pages/HomePage";
import { LOGIN_PAGE, LoginPage } from "./pages/LoginPage"
import { SIGNUP_PAGE, SignUpPage } from "./pages/SignUpPage"
import { PROFILE_PAGE } from "./pages/ProfilePage"
import { FRIENDS_PAGE, FriendsPage } from "./pages/FriendsPage"
import { CHAT_PAGE } from "./pages/ChatPage"
import { MATCHMAKING_PAGE } from "./pages/MatchmakingPage";
import { FORGOT_PASSWORD_PAGE } from "./pages/ForgotPasswordPage";

const PVP_GAME_PAGE: Page = {
	title: "1V1 Game",
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
	"friends": FRIENDS_PAGE,
	"forgot-password": FORGOT_PASSWORD_PAGE
};

export { HOME_PAGE,
		 PVP_GAME_PAGE,
		 PROFILE_PAGE,
		 FRIENDS_PAGE,
		 CHAT_PAGE,
		 SIGNUP_PAGE,
		 AI_GAME_PAGE,
		 PAGES,
		 LOGIN_PAGE
		 };

export {
	SignUpPage,
	LoginPage,
	HomePage,
	FriendsPage,
};