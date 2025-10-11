import { Page } from "../Page"

class ProfilePage implements Page {
	title: string = "Profile";
	data: any = null;
	async render() : Promise<void> {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = "<h1 class='m-2 text-2xl font-bold'>User Profile</h1><button id=homeBtn class='ml-4 mt-4 p-2 bg-blue-500 text-white rounded' onclick='loadPage(HOME_PAGE)'>Go to Home</button>";
		}
	}

	async onPreLoad() : Promise<void> {
		console.log("Preparing to load Profile page");
	}

	async onLoad() : Promise<void> {
		console.log("Profile page loaded");
	}

	async onUnload() : Promise<void> {
		console.log("Profile page unloaded");
	}
};

const PROFILE_PAGE = new ProfilePage();

export { ProfilePage, PROFILE_PAGE };