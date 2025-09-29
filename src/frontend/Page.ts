interface Page {
	title: string;
	onUnload: () => void;
	onPreLoad: () => void;
	render: () => void;
	onLoad: () => void;
};

class GlobalState {
	private static instance: GlobalState;
	private gameSocket?: WebSocket;
	
	private constructor() {}

	public static getInstance(): GlobalState {
		if (!GlobalState.instance) {
			GlobalState.instance = new GlobalState();
		}
		return GlobalState.instance;
	}
}

export const HOME_PAGE: Page = {
	title: "Home",
	render: () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = "<h1>Welcome to the Home Page</h1><button id=profileBtn onclick='loadPage(PROFILE_PAGE)'>Go to Profile</button>";
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

export const PROFILE_PAGE: Page = {
	title: "Profile",
	render: () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = "<h1>User Profile</h1><button id=homeBtn onclick='loadPage(HOME_PAGE)'>Go to Home</button>";
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

let currentPage: Page;

function getPagePath(page: Page): string {
	for (const [key, value] of Object.entries(PAGES)) {
		if (value === page) {
			return "/" + key;
		}
	}
	return "/home";
}

function getPage(path: string): Page {
	const key = path.slice(1).toLowerCase();
	return PAGES[key] || HOME_PAGE;
}

export function loadPage(page: Page)
{
	if (currentPage) {
		currentPage.onUnload();
	}
	currentPage = page;
	page.onPreLoad();
	document.title = page.title;
	const path = getPagePath(page);
	window.history.pushState({ pageKey: path }, page.title, path);
	page.render();
	page.onLoad();
}

window.onpopstate = function(event) {
	if (currentPage) {
		currentPage.onUnload();
	}
	const path = window.location.pathname.slice(1).toLowerCase();
	if (path === "profile") {
		loadPage(PROFILE_PAGE);
	} else {
		loadPage(HOME_PAGE);
	}
};

function init() {
	const path = window.location.pathname;
	const initialPage = getPage(path);

	currentPage = initialPage;
	document.title = initialPage.title;
	initialPage.onPreLoad();
	initialPage.render();
	initialPage.onLoad();

	window.history.replaceState({ pageKey: path }, initialPage.title, path);
}

init();

(window as any).loadPage = loadPage;
(window as any).PROFILE_PAGE = PROFILE_PAGE;
(window as any).HOME_PAGE = HOME_PAGE;
