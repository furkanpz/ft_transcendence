import { GlobalState, Page, FETCH_ADDRESS } from "../main"
import { LOGIN_PAGE } from "./LoginPage"

declare const Notification: typeof import("../components/Notification").Notification;

class SignUpPage implements Page {
	title: string = "Sign Up";
	data: any = null;

	async render(): Promise<void> {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<div id="signUpArea" style="min-height: calc(100vh - 80px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">
					<form method="post" class="glass-card animate-scale-in" style="min-width: 400px; max-width: 500px; width: 100%;">
						<h2 style="margin-bottom: 2rem; font-size: 2rem;" class="neon-text-cyan">Sign Up</h2>
						
						<div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem;">
							<input type="text" id="username" placeholder="Username" data-i18n-placeholder="username" style="width: 100%;">
							<input type="email" id="email" placeholder="Email" data-i18n-placeholder="email" style="width: 100%;">
							<input type="password" id="password" placeholder="Password" data-i18n-placeholder="password" style="width: 100%;">
							<input type="password" id="confirmPassword" placeholder="Confirm Password" data-i18n-placeholder="confirm_new_password" style="width: 100%;">
						</div>
						
						<button type="submit" onclick="SignUpPage.signUp(event)" class="btn-primary" 
							style="width: 100%; margin-bottom: 1.5rem;" data-i18n="sign_up">Sign Up</button>
					</form>
					
					<div style="margin-top: 2rem;">
						<button id="toggleSignUp" onclick="GlobalState.setPage(LOGIN_PAGE)" 
							style="background: none; border: none; color: var(--neon-cyan); cursor: pointer; text-decoration: underline;"
							data-i18n="already_have_account_sign_in">Already have an account? Sign In</button>
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
			Notification.error("Passwords do not match!");
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
					Notification.success("Sign-up Success! You can now log in.");
					GlobalState.setPage(LOGIN_PAGE);
				}
				else {
					Notification.error("Sign-up Failed: " + data.message);
				}
			});
	}
};

const SIGNUP_PAGE: Page = new SignUpPage();

export { SIGNUP_PAGE, SignUpPage };