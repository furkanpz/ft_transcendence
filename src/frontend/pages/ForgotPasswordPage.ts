import { GlobalState, Page, FETCH_ADDRESS } from "../main"
import { LOGIN_PAGE } from "./LoginPage"

declare const Notification: typeof import("../components/Notification").Notification;

class ForgotPasswordPage implements Page {
	title: string = "recovery";
	data: any;
	static recoveryEmail: string = "";
	static recoveryCode: string = "";

	public async onUnload(): Promise<void> {
		console.log("Forgot Password page unloaded");
	}
	
	public async onPreLoad(): Promise<void> {
		console.log("Preparing to load Forgot Password page");
	}
	
	public async onLoad(): Promise<void> {
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

		console.log("Forgot Password page loaded");
		const urlParams = new URLSearchParams(window.location.search);
		const verifyCode = urlParams.get('verify');
		const email = urlParams.get('email');
		
		if (verifyCode && email) {
			ForgotPasswordPage.recoveryEmail = email;
			ForgotPasswordPage.recoveryCode = verifyCode;

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
					Notification.error("Invalid or expired recovery link. Please request a new one.");
					GlobalState.setPage(LOGIN_PAGE);
				}
			} catch (error) {
				console.error("Recovery verification error:", error);
				Notification.error("An error occurred while verifying the recovery link.");
				GlobalState.setPage(LOGIN_PAGE);
			}
		}
	}
	
	public async render(): Promise<void> {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
			<style>
				.recovery-container {
					min-height: calc(100vh - 80px);
					display: flex;
					flex-direction: column;
					align-items: center;
					justify-content: center;
					padding: 2rem 1rem;
					position: relative;
				}
				
				.recovery-card {
					min-width: 400px;
					max-width: 500px;
					width: 100%;
					padding: 2.5rem;
				}
				
				.recovery-form {
					display: flex;
					flex-direction: column;
					gap: 1.25rem;
					width: 100%;
				}
				
				.recovery-buttons {
					display: flex;
					gap: 1rem;
					width: 100%;
					margin-top: 0.5rem;
				}
				
				@media (max-width: 768px) {
					.recovery-container {
						padding: 1rem 0.5rem;
					}
					
					.recovery-card {
						min-width: auto;
						padding: 2rem 1.5rem;
					}
					
					.recovery-buttons {
						flex-direction: column;
					}
					
					.recovery-buttons button {
						width: 100%;
					}
				}
			</style>
			
			<div class="recovery-container animate-fade-in">
				<button id="backButton" onclick="GlobalState.setPage(LOGIN_PAGE)" 
					style="position: absolute; top: 2rem; left: 2rem; background: none; border: none; color: var(--neon-cyan); cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.3s;"
					onmouseover="this.style.textShadow='0 0 10px var(--neon-cyan)'"
					onmouseout="this.style.textShadow='none'"
					data-i18n="back_to_login">← Back to Login</button>
				
				<div id="step1Area" class="glass-card recovery-card animate-scale-in" style="border-color: var(--neon-cyan);">
					<h2 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; text-align: center;" class="neon-text-cyan" data-i18n="forgot_password">Forgot Password</h2>
					<p style="margin-bottom: 2rem; text-align: center; color: rgba(255, 255, 255, 0.8); font-size: 1rem;" data-i18n="enter_username">Enter your email to receive a recovery link</p>
					
					<form class="recovery-form" onsubmit="ForgotPasswordPage.sendRecoveryCode(event); return false;">
						<input type="email" id="recoveryEmail" placeholder="Email" data-i18n-placeholder="email" 
							style="width: 100%; box-sizing: border-box;">
						<button type="submit" id="sendRecoveryBtn" class="btn-primary" 
							style="width: 100%;" data-i18n="send">Send Recovery Link</button>
					</form>
				</div>

				<div id="step2Area" class="glass-card recovery-card animate-scale-in" style="display: none; border-color: var(--neon-green);">
					<h2 style="font-size: 2rem; font-weight: bold; margin-bottom: 1rem; text-align: center;" class="neon-text-green" data-i18n="reset_password">Reset Password</h2>
					<p style="margin-bottom: 0.5rem; text-align: center; color: rgba(255, 255, 255, 0.8); font-size: 1rem;" data-i18n="reset_password">Enter your new password</p>
					<p id="emailDisplay" style="margin-bottom: 2rem; text-align: center; color: var(--neon-green); font-weight: 600; font-size: 0.875rem;"></p>
					
					<form class="recovery-form" onsubmit="ForgotPasswordPage.resetPassword(event); return false;">
						<input type="password" id="newPassword" placeholder="New Password" data-i18n-placeholder="enter_new_password" 
							style="width: 100%; box-sizing: border-box;">
						<input type="password" id="newRePassword" placeholder="Confirm New Password" data-i18n-placeholder="confirm_new_password" 
							style="width: 100%; box-sizing: border-box;">
						
						<div class="recovery-buttons">
							<button type="submit" id="resetPasswordBtn" class="btn-success" style="flex: 1;" data-i18n="reset_password">Reset Password</button>
							<button type="button" id="cancelResetBtn" class="btn-danger" style="flex: 1;" data-i18n="cancel">Cancel</button>
						</div>
					</form>
					
					<p style="margin-top: 1.5rem; text-align: center; color: rgba(255, 255, 255, 0.6); font-size: 0.875rem;" data-i18n="please_wait">* This link will expire in 15 minutes</p>
				</div>
			</div>
			`;
		}
	}

	static async sendRecoveryCode(event: Event) {
		event.preventDefault();
		const emailInput = document.getElementById("recoveryEmail") as HTMLInputElement;
		const email = emailInput.value.trim();

		if (!email) {
			Notification.warning("Please enter your email!");
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			Notification.warning("Please enter a valid email address!");
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
					Notification.success("Recovery link has been sent to your email. Please check your inbox and click the link to continue.");
					ForgotPasswordPage.recoveryEmail = email;
				} else {
					Notification.error("Failed to send recovery link: " + (data.message || "Unknown error"));
				}
			})
			.catch(error => {
				console.error("Recovery link error:", error);
				Notification.error("An error occurred. Please try again.");
			});
	}

	static async resetPassword(event: Event) {
		event.preventDefault();
		const newPasswordInput = document.getElementById("newPassword") as HTMLInputElement;
		const newRePasswordInput = document.getElementById("newRePassword") as HTMLInputElement;

		const newPassword = newPasswordInput.value;
		const newRePassword = newRePasswordInput.value;

		if (!newPassword || !newRePassword) {
			Notification.warning("Please fill in all fields!");
			return;
		}

		if (newPassword !== newRePassword) {
			Notification.error("Passwords do not match!");
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
					Notification.success("Password reset successful! Please login with your new password.");
					GlobalState.setPage(LOGIN_PAGE);
				} else {
					Notification.error("Password reset failed: " + (data.message || "Unknown error"));
					newPasswordInput.value = "";
					newRePasswordInput.value = "";
				}
			})
			.catch(error => {
				console.error("Password reset error:", error);
				Notification.error("An error occurred. Please try again.");
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
