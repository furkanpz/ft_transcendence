import { GlobalState, Page, FETCH_ADDRESS } from "../main"
import { LOGIN_PAGE } from "./LoginPage"

class SignUpPage implements Page {
	title: string = "Sign Up";
	data: any = null;

	async render(): Promise<void> {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
					<div id="signUpArea" class="mx-32 min-h-[92vh] items-center flex flex-col justify-center text-center gap-6 ">
						<div class="w-full flex justify-end mb-4">
							<button id="lang-en" class="mr-2">EN</button>
							<button id="lang-tr">TR</button>
						</div>
						<button id="backButton" onclick="GlobalState.setPage(HOME_PAGE)" data-i18n="back_to_home">Back to Home</button>
					<form method="post" class="bg-blue-500 rounded-2xl min-w-2xl p-12 items-center flex flex-col justify-center text-center gap-6">
						<input type="text" id="username" placeholder="Username" value="erkoc" class="bg-white p-1" data-i18n-placeholder="username"></input>
						<input type="text" id="email" placeholder="Email"       value="asda@gmail.com"   class="bg-white p-1" data-i18n-placeholder="email"></input>
						<input type="password" id="password"                    value="asdasd"  placeholder="Password" class="bg-white p-1" data-i18n-placeholder="password"></input>
						<input type="password" id="confirmPassword"             value="asdasd"     placeholder="Confirm Password" class="bg-white p-1" data-i18n-placeholder="confirm_new_password"></input>
						<button type="submit" onclick="SignUpPage.signUp(event)" class="bg-white text-black py-2 px-4 rounded" data-i18n="sign_up">Sign-Up</button>
					</form>
					<div class="flex flex-row w-2xl  justify-between items-center gap-4">
						<button id="toggleSignUp" class="underline cursor-pointer" onclick="GlobalState.setPage(LOGIN_PAGE)" data-i18n="already_have_account_sign_in">Already have an account? Sign In</button>
					</div>
				</div>
			`;
		}
	}

	async onPreLoad(): Promise<void> {
		console.log("Preparing to load Sign Up page");
	}

	async onLoad(): Promise<void> {
		console.log("Sign Up page loaded");
	}

	async onUnload(): Promise<void> {
		console.log("Sign Up page unloaded");
	}

	static async signUp(event: Event) {
		event.preventDefault();
		const username = document.getElementById("username") as HTMLInputElement;
		const email = document.getElementById("email") as HTMLInputElement;
		const password = document.getElementById("password") as HTMLInputElement;
		const confirmPassword = document.getElementById("confirmPassword") as HTMLInputElement;
		if (password.value !== confirmPassword.value) {
			alert("Passwords do not match!");
			return;
		}
		await fetch(`${FETCH_ADDRESS}/auth/sign-up`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				email: email.value,
				username: username.value,
				password: password.value
			})
		})
			.then(response => response.json())
			.then(data => {
				if (data.success == true) {
					alert("Sign-up Success! You can now log in.");
					GlobalState.setPage(LOGIN_PAGE);
				}
				else {
					alert("Sign-up Failed: " + data.message);
				}
			});
	}
};

const SIGNUP_PAGE: Page = new SignUpPage();

export { SIGNUP_PAGE, SignUpPage };