import { GlobalState, Page, FETCH_ADDRESS } from "../main"
import { HOME_PAGE } from "./HomePage"
import { SIGNUP_PAGE } from "./SignUpPage"   

class LoginPage implements Page {
	title: string = "login";
	data: any;
	constructor() {
		this.data = null;
	}
	public async onUnload(): Promise<void> {
		console.log("Login page unloaded");
	}
	public async onPreLoad() : Promise<void> {
		console.log("Preparing to load Login page");
	}
	public async onLoad(): Promise<void> {
		console.log("Login page loaded");
	}
	public async render(): Promise<void> {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<div id="loginArea" class="mx-32 min-h-[92vh] items-center flex flex-col justify-center text-center gap-6 ">
					<button id="backButton" onclick="GlobalState.setPage(HOME_PAGE)">Back to Home</button>
					<form method="post"  class="bg-blue-500 rounded-2xl min-w-2xl p-12 items-center flex flex-col justify-center text-center gap-6">
						<input type="text" id="username" placeholder="Username" class="bg-white p-1"></input>
						<input type="password" id="password" placeholder="Password" class="bg-white p-1"></input>
						<button type="submit" onclick="LoginPage.login(event)" class="bg-white text-black py-2 px-4 rounded">Login</button>
					</form>
					<div class="flex flex-row w-2xl  justify-between items-center gap-4">
						<button id="toggleSignUp" class="underline cursor-pointer" onclick="GlobalState.setPage(SIGNUP_PAGE)">Don't have an account? Sign Up</button>
					</div>
				</div>
			`;
		}
	}

	static async login(event: Event) {
	event.preventDefault();
	const email = document.getElementById("email") as HTMLInputElement;
	const password = document.getElementById("password") as HTMLInputElement;
	fetch(`${FETCH_ADDRESS}/auth/sign-in`, {
		method: "POST",
		credentials: "include",
		headers: {
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			username: email.value,
			password: password.value
		})
	})
		.then(response => response.json())
		.then(data => {
			console.log(data);
			if (data.success == true) {
				window.localStorage.setItem("isAuthenticated", "1");
				GlobalState.setPage(HOME_PAGE);
			}
			else {
				alert("Login Failed: " + data.message);
				GlobalState.setPage(LOGIN_PAGE);
			}
		});
	}
}

const LOGIN_PAGE = new LoginPage();

export { LoginPage, LOGIN_PAGE };