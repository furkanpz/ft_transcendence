import { HOME_PAGE, PROFILE_PAGE, PAGES} from "./pages";

interface Page {
	title: string;
	onUnload: () => void;
	onPreLoad: () => void;
	render: () => void;
	onLoad: () => void;
};

class GlobalState {
	private static currentPage: Page = HOME_PAGE;
	private gameSocket?: WebSocket;
	
	private constructor() {}

	public static getcurrentPage(): Page {
		return GlobalState.currentPage;
	}

	public static setcurrentPage(page: Page): void {
		GlobalState.currentPage = page;
	}
}

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

function loadPage(page: Page)
{
	GlobalState.getcurrentPage().onUnload();
	GlobalState.setcurrentPage(page);
	page.onPreLoad();
	document.title = page.title;
	const path = getPagePath(page);
	window.history.pushState({ pageKey: path }, page.title, path);
	page.render();
	page.onLoad();
}

window.onpopstate = function(event) {
	GlobalState.getcurrentPage().onUnload();
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

	GlobalState.setcurrentPage(initialPage);
	document.title = initialPage.title;
	initialPage.onPreLoad();
	initialPage.render();
	initialPage.onLoad();

	window.history.replaceState({ pageKey: path }, initialPage.title, path);
}

init();

export { Page, GlobalState, loadPage, getPagePath, getPage };

(window as any).loadPage = loadPage;
(window as any).PROFILE_PAGE = PROFILE_PAGE;
(window as any).HOME_PAGE = HOME_PAGE;
