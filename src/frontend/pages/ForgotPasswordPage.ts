import { GlobalState, Page, FETCH_ADDRESS } from "../main"
import { LOGIN_PAGE } from "./LoginPage"

class ForgotPasswordPage implements Page {
	title: string = "recovery";
	data: any;
	constructor() {
		this.data = null;
	}
	public async onUnload(): Promise<void> {
		console.log("Forgot Password page unloaded");
	}
	public async onPreLoad(): Promise<void> {
		console.log("Preparing to load Forgot Password page");
	}
	public async onLoad(): Promise<void> {
		console.log("Forgot Password page loaded");
		const urlParams = new URLSearchParams(window.location.search);
		const verifyCode = urlParams.get('verify');
		const email = urlParams.get('email');
		
		if (verifyCode && email) {
			ForgotPasswordPage.recoveryEmail = email;
			ForgotPasswordPage.recoveryCode = verifyCode;

			// Backend'e doğrulama için GET isteği at (step 2)
			try {
				const response = await fetch(`${FETCH_ADDRESS}/auth/account_recovery?verify=${encodeURIComponent(verifyCode)}&email=${encodeURIComponent(email)}`, {
					method: "GET",
					credentials: "include"
				});
				const data = await response.json();
				if (data.success === true) {
					setTimeout(() => {
						const step1Area = document.getElementById("step1Area");
						const step2Area = document.getElementById("step2Area");
						const emailDisplay = document.getElementById("emailDisplay");
						if (step1Area && step2Area && emailDisplay) {
							step1Area.style.display = "none";
							step2Area.style.display = "flex";
							emailDisplay.textContent = `Recovery code verified for: ${email}`;
						}
					}, 100);
				} else {
					alert("Invalid or expired recovery link. Please request a new one.");
					GlobalState.setPage(LOGIN_PAGE);
				}
			} catch (error) {
				console.error("Recovery verification error:", error);
				alert("An error occurred while verifying the recovery link.");
				GlobalState.setPage(LOGIN_PAGE);
			}
		}
	}
	public async render(): Promise<void> {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<div id="forgotPasswordArea" class="mx-32 min-h-[92vh] items-center flex flex-col justify-center text-center gap-6">
					<button id="backButton">Back to Login</button>
					
					<div id="step1Area" class="bg-blue-500 rounded-2xl min-w-2xl p-12 items-center flex flex-col justify-center text-center gap-6">
						<h2 class="text-white text-2xl font-bold">Forgot Password</h2>
						<p class="text-white">Enter your email to receive a recovery link</p>
						<input type="email" id="recoveryEmail" placeholder="Email" class="bg-white p-2 rounded"></input>
						<button id="sendRecoveryBtn" class="bg-white text-black py-2 px-4 rounded">Send Recovery Link</button>
					</div>

					<div id="step2Area" class="bg-green-500 rounded-2xl min-w-2xl p-12 items-center flex flex-col justify-center text-center gap-6" style="display: none;">
						<h2 class="text-white text-2xl font-bold">Reset Password</h2>
						<p class="text-white">Enter your new password</p>
						<p id="emailDisplay" class="text-white font-bold"></p>
						<input type="password" id="newPassword" placeholder="New Password" class="bg-white p-2 rounded"></input>
						<input type="password" id="newRePassword" placeholder="Confirm New Password" class="bg-white p-2 rounded"></input>
						<div class="flex gap-4">
							<button id="resetPasswordBtn" class="bg-white text-black py-2 px-4 rounded">Reset Password</button>
							<button id="cancelResetBtn" class="bg-red-500 text-white py-2 px-4 rounded">Cancel</button>
						</div>
						<p class="text-white text-sm">* This link will expire in 15 minutes</p>
					</div>
				</div>
			`;
			const backButton = document.getElementById("backButton");
			const sendRecoveryBtn = document.getElementById("sendRecoveryBtn");
			const resetPasswordBtn = document.getElementById("resetPasswordBtn");
			const cancelResetBtn = document.getElementById("cancelResetBtn");

			if (backButton) {
				backButton.addEventListener("click", () => GlobalState.setPage(LOGIN_PAGE));
			}
			if (sendRecoveryBtn) {
				sendRecoveryBtn.addEventListener("click", (e) => ForgotPasswordPage.sendRecoveryCode(e));
			}
			if (resetPasswordBtn) {
				resetPasswordBtn.addEventListener("click", (e) => ForgotPasswordPage.resetPassword(e));
			}
			if (cancelResetBtn) {
				cancelResetBtn.addEventListener("click", (e) => ForgotPasswordPage.cancelReset(e));
			}
		}
	}

	static recoveryEmail: string = "";
	static recoveryCode: string = "";

	static async sendRecoveryCode(event: Event) {
		event.preventDefault();
		const emailInput = document.getElementById("recoveryEmail") as HTMLInputElement;
		const email = emailInput.value.trim();

		if (!email) {
			alert("Please enter your email!");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			alert("Please enter a valid email address!");
			return;
		}

		fetch(`${FETCH_ADDRESS}/auth/account_recovery`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				email: email
			})
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				if (data.success === true) {
					alert("Recovery link has been sent to your email. Please check your inbox and click the link to continue.");
					ForgotPasswordPage.recoveryEmail = email;
				} else {
					alert("Failed to send recovery link: " + (data.message || "Unknown error"));
				}
			})
			.catch(error => {
				console.error("Recovery link error:", error);
				alert("An error occurred. Please try again.");
			});
	}

	static async resetPassword(event: Event) {
		event.preventDefault();
		const newPasswordInput = document.getElementById("newPassword") as HTMLInputElement;
		const newRePasswordInput = document.getElementById("newRePassword") as HTMLInputElement;

		const newPassword = newPasswordInput.value;
		const newRePassword = newRePasswordInput.value;

		if (!newPassword || !newRePassword) {
			alert("Please fill in all fields!");
			return;
		}

		if (newPassword !== newRePassword) {
			alert("Passwords do not match!");
			return;
		}

		fetch(`${FETCH_ADDRESS}/auth/account_recovery/verify`, {
			method: "POST",
			credentials: "include",
			headers: {
				"Content-Type": "application/json"
			},
			body: JSON.stringify({
				verifycode: ForgotPasswordPage.recoveryCode,
				email: ForgotPasswordPage.recoveryEmail,
				new_password: newPassword,
				new_re_password: newRePassword
			})
		})
			.then(response => response.json())
			.then(data => {
				console.log(data);
				if (data.success === true) {
					alert("Password reset successful! Please login with your new password.");
					GlobalState.setPage(LOGIN_PAGE);
				} else {
					alert("Password reset failed: " + (data.message || "Unknown error"));
					newPasswordInput.value = "";
					newRePasswordInput.value = "";
				}
			})
			.catch(error => {
				console.error("Password reset error:", error);
				alert("An error occurred. Please try again.");
			});
	}

	static async cancelReset(event: Event) {
		event.preventDefault();
		ForgotPasswordPage.recoveryEmail = "";
		ForgotPasswordPage.recoveryCode = "";
		GlobalState.setPage(LOGIN_PAGE);
	}
}

const FORGOT_PASSWORD_PAGE = new ForgotPasswordPage();

(window as any).ForgotPasswordPage = ForgotPasswordPage;

export { ForgotPasswordPage, FORGOT_PASSWORD_PAGE };
