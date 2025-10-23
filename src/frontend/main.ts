import { BLOCKED_USERS_PAGE, BlockedUsersPage } from "./pages/BlockedUsersPage";
import { CHAT_PAGE, ChatPage } from "./pages/ChatPage";
import { MATCHMAKING_PAGE } from "./pages/MatchmakingPage";
import { PROFILE_PAGE, ProfilePage } from "./pages/ProfilePage";
import * as i18n from "./i18n";
import { FORGOT_PASSWORD_PAGE } from "./pages/ForgotPasswordPage";
import { HOME_PAGE } from "./pages/HomePage";
import { LOGIN_PAGE, LoginPage } from "./pages/LoginPage";
import { SIGNUP_PAGE, SignUpPage } from "./pages/SignUpPage";
import { FRIENDS_PAGE, FriendsPage } from "./pages/FriendsPage";

// websocket için de kullanıyorum o yüzden sadece adres ve portu yazdım
const FETCH_ADDRESS = "https://localhost:3000/api"
const WS_ADDRESS = "wss://localhost:3000/ws"

interface Page {
	title: string;
	onUnload: () => Promise<void>;
	onPreLoad: () => Promise<void>;
	render: () => Promise<void>;
	onLoad: () => Promise<void>;
};

const PAGES: { [key: string]: Page } = {
	"home": HOME_PAGE,
	"profile": PROFILE_PAGE,
	"login": LOGIN_PAGE,
	"signup": SIGNUP_PAGE,
	"friends": FRIENDS_PAGE,
	"forgot-password": FORGOT_PASSWORD_PAGE
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
		// translate newly rendered DOM according to current language
		i18n.translateDOM();
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
	const path = window.location.pathname.toLowerCase();
	const page = GlobalState.getPage(path);
	GlobalState.setPage(page);
};

async function init() {
	const path = window.location.pathname.toLowerCase();
	const initialPage = GlobalState.getPage(path);

	GlobalState.setcurrentPage(initialPage);
	document.title = initialPage.title;
	await initialPage.onPreLoad();
	await initialPage.render();
	// translate initial render
	i18n.translateDOM();
	await initialPage.onLoad();

	window.history.replaceState({ pageKey: path }, initialPage.title, path);
}

init();

export { Page, GlobalState, FETCH_ADDRESS, WS_ADDRESS, PAGES };

(window as any).GlobalState = GlobalState;
(window as any).PROFILE_PAGE = PROFILE_PAGE;
(window as any).HOME_PAGE = HOME_PAGE;
(window as any).LOGIN_PAGE = LOGIN_PAGE;
(window as any).SIGNUP_PAGE = SIGNUP_PAGE;
(window as any).FRIENDS_PAGE = FRIENDS_PAGE;
(window as any).BLOCKED_USERS_PAGE = BLOCKED_USERS_PAGE;
(window as any).MATCHMAKING_PAGE = MATCHMAKING_PAGE;
(window as any).CHAT_PAGE = CHAT_PAGE;

(window as any).SignUpPage = SignUpPage;
(window as any).LoginPage = LoginPage;
(window as any).FriendsPage = FriendsPage;
(window as any).ChatPage = ChatPage;
(window as any).ProfiPage = ProfilePage;
(window as any).BlockedUsersPage = BlockedUsersPage;
(window as any).i18n = i18n;