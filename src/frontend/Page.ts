import { HOME_PAGE, PROFILE_PAGE, PAGES, LOGIN_PAGE, SIGNUP_PAGE, signUp, login, AI_GAME_PAGE, PVP_GAME_PAGE, FRIENDS_PAGE, LOBBY_PAGE} from "./pages";
import { BLOCKED_USERS_PAGE } from "./pages/BlockedUsersPage";

// websocket için de kullanıyorum o yüzden sadece adres ve portu yazdım
const FETCH_ADDRESS = "http://localhost:3000/api/"
const WS_ADDRESS = "ws://localhost:3000/ws"

interface Page {
	title: string;
	data: any;
	onUnload: () => Promise<void>;
	onPreLoad: () => Promise<void>;
	render: () => Promise<void>;
	onLoad: () => Promise<void>;
};

class GlobalState {
	private static currentPage: Page = HOME_PAGE;
	private static gameAnimationFrameId: number | null = null;
	private static gameSocket: WebSocket | null;
	private static username: string = "null";
	public static isAuthenticated : boolean = false;
	
	private constructor() {}

	public static getSocket(): WebSocket | null
	{
		return GlobalState.gameSocket;
	}

	public static setSocket(socket: WebSocket | null): void
	{
		GlobalState.gameSocket = socket;
	}

	public static getcurrentPage(): Page {
		return GlobalState.currentPage;
	}

	public static setcurrentPage(page: Page): void {
		GlobalState.currentPage = page;
	}

	public static getAnimationFrameId(): number | null {
		return GlobalState.gameAnimationFrameId;
	}

	public static setAnimationFrameId(id: number | null): void {
		GlobalState.gameAnimationFrameId = id;
	}

	public static async setPage(page: Page): Promise<void> {
		await GlobalState.getcurrentPage().onUnload();
		GlobalState.setcurrentPage(page);
		await page.onPreLoad();
		document.title = page.title;
		const path = GlobalState.getPagePath(page);
		window.history.pushState({ pageKey: path }, page.title, path);
		await page.render();
		await page.onLoad();
	}

	public static getPagePath(page: Page): string {
		for (const [key, value] of Object.entries(PAGES)) {
			if (value === page) {
				return "/" + key;
			}
		}
		return "/home";
	}

	public static getPage(path: string): Page {
		const key = path.slice(1).toLowerCase();
		return PAGES[key] || HOME_PAGE;
	}
}

window.onpopstate = function(event) {
	GlobalState.getcurrentPage().onUnload();
	const path = window.location.pathname.slice(1).toLowerCase();
	if (path === "profile") {
		GlobalState.setPage(PROFILE_PAGE);
	} else {
		GlobalState.setPage(HOME_PAGE);
	}
};

function init() {
	const path = window.location.pathname;
	const initialPage = GlobalState.getPage(path);

	GlobalState.setcurrentPage(initialPage);
	document.title = initialPage.title;
	initialPage.onPreLoad();
	initialPage.render();
	initialPage.onLoad();

	window.history.replaceState({ pageKey: path }, initialPage.title, path);
}

init();

export { Page, GlobalState, FETCH_ADDRESS, WS_ADDRESS };

(window as any).GlobalState = GlobalState;
(window as any).PROFILE_PAGE = PROFILE_PAGE;
(window as any).HOME_PAGE = HOME_PAGE;
(window as any).LOGIN_PAGE = LOGIN_PAGE;
(window as any).SIGNUP_PAGE = SIGNUP_PAGE;
(window as any).AI_GAME_PAGE = AI_GAME_PAGE;
(window as any).PVP_GAME_PAGE = PVP_GAME_PAGE;
(window as any).FRIENDS_PAGE = FRIENDS_PAGE;
(window as any).LOBBY_PAGE = LOBBY_PAGE;
(window as any).BLOCKED_USERS_PAGE = BLOCKED_USERS_PAGE;
(window as any).signUp = signUp;
(window as any).login = login;