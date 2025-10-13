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
					<form method="post" id="loginForm" class="bg-blue-500 rounded-2xl min-w-2xl p-12 items-center flex flex-col justify-center text-center gap-6">
						<input type="text" id="username" placeholder="Username" class="bg-white p-1"></input>
						<input type="password" id="password" placeholder="Password" class="bg-white p-1"></input>
						<button type="submit" onclick="LoginPage.login(event)" class="bg-white text-black py-2 px-4 rounded">Login</button>
					</form>
					<div id="twoFactorArea" class="bg-green-500 rounded-2xl min-w-2xl p-12 items-center flex-col justify-center text-center gap-6 hidden">
						<h2 class="text-white text-xl font-bold mb-4">2FA Doğrulama</h2>
						<p class="text-white mb-4">E-posta adresinize gönderilen 6 haneli kodu giriniz:</p>
						<input type="text" id="otpCode" placeholder="6 haneli kod" maxlength="6" class="bg-white p-2 rounded text-center text-xl tracking-widest mb-4"></input>
						<div class="flex gap-4">
							<button onclick="LoginPage.verify2FA(event)" class="bg-white text-black py-2 px-4 rounded">Doğrula</button>
							<button onclick="LoginPage.cancel2FA(event)" class="bg-red-500 text-white py-2 px-4 rounded">İptal</button>
						</div>
					</div>
					<div class="flex flex-row w-2xl  justify-between items-center gap-4">
						<button id="toggleSignUp" class="underline cursor-pointer" onclick="GlobalState.setPage(SIGNUP_PAGE)">Don't have an account? Sign Up</button>
					</div>
				</div>
			`;
		}
	}

	static currentUsername: string = "";

	static async login(event: Event) {
		event.preventDefault();
		const usernameInput = document.getElementById("username") as HTMLInputElement;
		const password = document.getElementById("password") as HTMLInputElement;
		
		fetch(`${FETCH_ADDRESS}/auth/sign-in`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				username: usernameInput.value,
				password: password.value
			})
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				if (data.success == true) {
					if (data.message === "2FAREQUIRED") {
						LoginPage.currentUsername = data.data.username;
						const loginForm = document.getElementById("loginForm");
						const twoFactorArea = document.getElementById("twoFactorArea");
						if (loginForm && twoFactorArea) {
							loginForm.classList.add("hidden");
							twoFactorArea.classList.remove("hidden");
							twoFactorArea.classList.add("flex");
						}
					} else {
						window.localStorage.setItem("isAuthenticated", "1");
						GlobalState.setPage(HOME_PAGE);
					}
				}
				else {
					alert("Login Failed: " + data.message);
					GlobalState.setPage(LOGIN_PAGE);
				}
			})
			.catch(error => {
				console.error("Login error:", error);
				alert("Bir hata oluştu. Lütfen tekrar deneyin.");
			});
	}

	static async verify2FA(event: Event) {
		event.preventDefault();
		const otpInput = document.getElementById("otpCode") as HTMLInputElement;
		const otpCode = otpInput.value;

		if (!otpCode || otpCode.length !== 6) {
			alert("Lütfen 6 haneli kodu giriniz!");
			return;
		}

		fetch(`${FETCH_ADDRESS}/2fa/login`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				username: LoginPage.currentUsername,
				OTP: otpCode
			})
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				if (data.success == true) {
					window.localStorage.setItem("isAuthenticated", "1");
					GlobalState.setPage(HOME_PAGE);
				} else {
					alert("2FA Doğrulama Başarısız: " + data.message);
					otpInput.value = "";
				}
			})
			.catch(error => {
				console.error("2FA verification error:", error);
				alert("Bir hata oluştu. Lütfen tekrar deneyin.");
			});
	}

	static async cancel2FA(event: Event) {
		event.preventDefault();
		LoginPage.currentUsername = "";
		GlobalState.setPage(LOGIN_PAGE);
	}
}

const LOGIN_PAGE = new LoginPage();

export { LoginPage, LOGIN_PAGE };