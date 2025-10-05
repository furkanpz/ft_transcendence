import { GlobalState, Page } from "../Page"

export const PROFILE_PAGE: Page = {
	title: "Profile",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = "<h1 class='m-2 text-2xl font-bold'>User Profile</h1><button id=homeBtn class='ml-4 mt-4 p-2 bg-blue-500 text-white rounded' onclick='loadPage(HOME_PAGE)'>Go to Home</button>";
		}
	},
	onPreLoad: async () => {
		console.log("Preparing to load Profile page");
	},
	onLoad: async () => {
		console.log("Profile page loaded");
	},
	onUnload: async () => {
		console.log("Profile page unloaded");
	}
};