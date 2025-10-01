import { Page, GlobalState } from "./Page";

const HOME_PAGE: Page = {
	title: "Home",
	render: () => {
		const navbar = document.getElementById("nav");
		if (navbar) {
			navbar.innerHTML = `
			<nav class="px-32 py-2 flex flex-row w-full bg-blue-500 rounded-b-xl justify-between">
				<div>
					<button onclick="loadPage(HomePage, 'home')" class="font-bold cursor-pointer text-6xl">PONG</button>
				</div>
				<div class="flex items-center">
					<button id="authButton" onclick="loadPage(LoginPage, 'login')"
					class="cursor-pointer text-2xl font-semibold text-white hover:text-amber-400">Login</button>
				</div>
			</nav>`;
		}
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
			<div class="mx-32">
				<!-- Logo and Title -->
				
				<!-- main body-->
				<div class="mx-32 h-[92vh] text-center items-center flex flex-col justify-center gap-6">
					<div class="flex  flex-row w-2xl justify-between gap-6">
					<button onclick=" " class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">1v1</button>
					<button onclick=" " class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">Single Player</button>
				</div>
				<button id="multiplayer-btn" onclick=" " class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">Multiplayer</button>
				<button id="logout" class="hidden bg-red-500 text-white px-4 cursor-pointer py-2 rounded">Logout</button>
				</div>
			</div>
			`;
		}
	},
	onPreLoad: () => {
		console.log("Preparing to load Home page");
	},
	onLoad: () => {
		console.log("Home page loaded");
	},
	onUnload: () => {
		console.log("Home page unloaded");
	}
};

const PROFILE_PAGE: Page = {
	title: "Profile",
	render: () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = "<h1 class='m-2 text-2xl font-bold'>User Profile</h1><button id=homeBtn class='ml-4 mt-4 p-2 bg-blue-500 text-white rounded' onclick='loadPage(HOME_PAGE)'>Go to Home</button>";
		}
	},
	onPreLoad: () => {
		console.log("Preparing to load Profile page");
	},
	onLoad: () => {
		console.log("Profile page loaded");
	},
	onUnload: () => {
		console.log("Profile page unloaded");
	}
};

const PAGES: { [key: string]: Page } = {
	"home": HOME_PAGE,
	"profile": PROFILE_PAGE
};

export { HOME_PAGE, PROFILE_PAGE, PAGES };