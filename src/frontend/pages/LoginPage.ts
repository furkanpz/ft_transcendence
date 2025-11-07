import { GlobalState, Page, FETCH_ADDRESS } from "../main"
import { HOME_PAGE } from "./HomePage"
import { SIGNUP_PAGE } from "./SignUpPage"

declare const Notification: typeof import("../components/Notification").Notification;   

class LoginPage implements Page {
	title: string = "login";
	data: any;
	static currentUsername: string = "";

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
		// Google OAuth sonrası twofa yönlendirmesini yakala ve normal login akışı gibi 2FA UI'ını aç
		try {
			const params = new URLSearchParams(window.location.search);
			// Hata bildirimleri
			const error = params.get("error");
			if (error) {
				const errorMap: Record<string, string> = {
					google_access_token_missing: "Google erişim tokenı alınamadı.",
					google_userinfo_failed: "Google kullanıcı bilgileri alınamadı.",
					google_no_public_email: "Google hesabında herkese açık e-posta yok.",
					google_register_failed: "Google kullanıcısı kaydedilemedi.",
					token_generate_failed: "Oturum tokenı oluşturulamadı."
				};
				const msg = errorMap[error] || "Google kimlik doğrulama hatası.";
				Notification.error(msg);
			}
			if (params.get("twofa") === "1") {
				const username = params.get("username") || "";
				LoginPage.currentUsername = username;
				const loginForm = document.getElementById("loginForm");
				const twoFactorArea = document.getElementById("twoFactorArea");
				if (loginForm && twoFactorArea) {
					loginForm.style.display = "none";
					twoFactorArea.style.display = "flex";
					(twoFactorArea as HTMLElement).style.flexDirection = "column";
					(twoFactorArea as HTMLElement).style.alignItems = "center";
					const otpInput = document.getElementById("otpCode") as HTMLInputElement | null;
					if (otpInput) setTimeout(() => otpInput.focus(), 100);
				}
				// URL'deki query parametrelerini temizle
				const cleanPath = "/login";
				window.history.replaceState({ pageKey: cleanPath }, document.title, cleanPath);
			}
		} catch (e) {
			console.error("2FA redirect handling error:", e);
		}
	}
	public async render(): Promise<void> {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<div id="loginArea" style="min-height: calc(100vh - 80px); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem;">
					<form method="post" id="loginForm" class="glass-card animate-scale-in" style="min-width: 400px; max-width: 500px; width: 100%;">
						<h2 style="margin-bottom: 2rem; font-size: 2rem;" class="neon-text-cyan">Login</h2>
						
						<div style="display: flex; flex-direction: column; gap: 1.25rem; margin-bottom: 1.5rem;">
							<input type="text" id="username" placeholder="Username" data-i18n-placeholder="username" 
								style="width: 100%;">
							<input type="password" id="password" placeholder="Password" data-i18n-placeholder="password"
								style="width: 100%;">
						</div>
						
						<button type="submit" onclick="LoginPage.login(event)" class="btn-primary" 
							style="width: 100%; margin-bottom: 1.5rem;" data-i18n="login">Login</button>
						
						<div style="display: flex; justify-content: space-between; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
							<button id="googleLoginBtn" type="button" onclick="LoginPage.loginWithGoogle()" 
								class="glass-card" style="padding: 0.75rem; background: rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.2); cursor: pointer;">
								<img src="google-logo.png" alt="Google" style="width: 24px; height: 24px;">
							</button>
							<button id="forgotPasswordBtn" type="button" onclick="LoginPage.goToForgotPassword()" 
								style="background: none; border: none; color: var(--neon-cyan); cursor: pointer; text-decoration: underline; font-size: 0.875rem;"
								data-i18n="forgot_password">Forgot password?</button>
						</div>
					</form>

					<div id="twoFactorArea" class="glass-card animate-scale-in" style="display: none; min-width: 400px; max-width: 500px; width: 100%; flex-direction: column; align-items: center; text-align: center;">
						<h2 style="margin-bottom: 1rem; font-size: 1.75rem; width: 100%;" class="neon-text-green" data-i18n="two_fa_verification">2FA Verification</h2>
						<p style="margin-bottom: 1.5rem; color: rgba(255, 255, 255, 0.8); width: 100%; font-size: 1rem;" data-i18n="enter_6_digit_code">Enter the 6-digit code sent to your email:</p>
						<input type="text" id="otpCode" placeholder="000000" data-i18n-placeholder="six_digit_code_placeholder" maxlength="6" 
							style="width: 100%; text-align: center; font-size: 2rem; letter-spacing: 0.75rem; margin-bottom: 2rem; font-weight: 700; padding: 1.25rem 1rem; background: rgba(20, 20, 40, 0.8); border: 2px solid var(--neon-green); border-radius: 12px; color: white; box-sizing: border-box;">
						<div style="display: flex; gap: 1rem; width: 100%;">
							<button onclick="LoginPage.verify2FA(event)" class="btn-success" style="flex: 1; padding: 0.875rem 1.5rem; font-size: 1rem;" data-i18n="verify">Verify</button>
							<button onclick="LoginPage.cancel2FA(event)" class="btn-danger" style="flex: 1; padding: 0.875rem 1.5rem; font-size: 1rem;" data-i18n="cancel">Cancel</button>
						</div>
					</div>
					
					<div style="margin-top: 2rem;">
						<button id="toggleSignUp" onclick="GlobalState.setPage(SIGNUP_PAGE)" 
							style="background: none; border: none; color: var(--neon-cyan); cursor: pointer; text-decoration: underline;"
							data-i18n="sign_up_prompt">Don't have an account? Sign Up</button>
					</div>
				</div>
			`;
		}
	}

	static async loginWithGoogle() {
		window.location.href = `${FETCH_ADDRESS}/auth/login/google`;
	}

	static async goToForgotPassword() {
		const { FORGOT_PASSWORD_PAGE } = await import("./ForgotPasswordPage");
		GlobalState.setPage(FORGOT_PASSWORD_PAGE);
	}

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
						LoginPage.currentUsername = usernameInput.value;
						const loginForm = document.getElementById("loginForm");
						const twoFactorArea = document.getElementById("twoFactorArea");
						if (loginForm && twoFactorArea) {
							loginForm.style.display = "none";
							twoFactorArea.style.display = "flex";
							twoFactorArea.style.flexDirection = "column";
							twoFactorArea.style.alignItems = "center";
							const otpInput = document.getElementById("otpCode") as HTMLInputElement;
							if (otpInput) {
								setTimeout(() => otpInput.focus(), 100);
							}
						}
					} else {
						window.localStorage.setItem("isAuthenticated", "1");
						window.localStorage.setItem("username", usernameInput.value);
						GlobalState.setPage(HOME_PAGE);
					}
				}
				else {
					Notification.error("Login Failed: " + data.message);
					GlobalState.setPage(LOGIN_PAGE);
				}
			})
			.catch(error => {
				console.error("Login error:", error);
				Notification.error("An error occurred. Please try again.");
			});
	}

	static async verify2FA(event: Event) {
		event.preventDefault();
		const otpInput = document.getElementById("otpCode") as HTMLInputElement;
		const otpCode = otpInput.value;

		// Username pattern doğrulaması
		const username = LoginPage.currentUsername || '';
		const usernameValid = /^[a-zA-Z0-9_]{3,36}$/.test(username);
		if (!usernameValid) {
			Notification.error("Username formatı geçersiz. Lütfen tekrar giriş yapın.");
			return;
		}

		if (!otpCode || otpCode.length !== 6) {
			Notification.warning("Please enter the 6-digit code!");
			return;
		}

		fetch(`${FETCH_ADDRESS}/auth/2fa/login`, {
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
					window.localStorage.setItem("username", LoginPage.currentUsername);
					GlobalState.setPage(HOME_PAGE);
				} else {
					Notification.error("2FA Verification Failed: " + data.message);
					otpInput.value = "";
				}
			})
			.catch(error => {
				console.error("2FA verification error:", error);
				Notification.error("An error occurred. Please try again.");
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