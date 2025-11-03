import { Page, GlobalState, FETCH_ADDRESS } from "../main"
import { LOGIN_PAGE } from "./LoginPage"
import { HOME_PAGE } from "./HomePage"
import { t } from "../i18n"

declare const Notification: typeof import("../components/Notification").Notification;

class ProfilePage implements Page {
	title: string = "Profile";
	data: any = null;

	async render(): Promise<void> {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
			<style>
				.profile-container {
					max-width: 900px;
					margin: 0 auto;
					padding: 2rem 1rem;
					width: 100%;
				}
				
				.profile-section {
					margin-bottom: 1.5rem;
				}
				
				.stats-grid {
					display: grid;
					grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
					gap: 1rem;
					margin-top: 1rem;
				}
				
				.form-group {
					margin-bottom: 1.25rem;
				}
				
				.form-label {
					display: block;
					font-size: 0.875rem;
					font-weight: 500;
					margin-bottom: 0.5rem;
					color: rgba(255, 255, 255, 0.9);
				}
				
				.success-message {
					display: none;
					padding: 1rem;
					margin-bottom: 1.5rem;
					background: rgba(0, 255, 65, 0.2);
					border: 1px solid var(--neon-green);
					border-radius: 12px;
					color: var(--neon-green);
				}
				
				.success-message.show {
					display: flex;
					align-items: center;
					gap: 0.5rem;
				}
				
				.avatar-container {
					position: relative;
					display: inline-block;
				}
				
				.avatar-edit-btn {
					position: absolute;
					bottom: 0;
					right: 0;
					background: var(--neon-cyan);
					border: none;
					border-radius: 50%;
					width: 40px;
					height: 40px;
					display: flex;
					align-items: center;
					justify-content: center;
					cursor: pointer;
					box-shadow: 0 0 15px var(--neon-cyan);
					transition: all 0.3s;
				}
				
				.avatar-edit-btn:hover {
					transform: scale(1.1);
					box-shadow: 0 0 25px var(--neon-cyan);
				}
				
				.avatar-edit-btn svg {
					width: 20px;
					height: 20px;
					color: white;
				}
				
				.profile-avatar {
					width: 128px;
					height: 128px;
					border-radius: 50%;
					object-fit: cover;
					border: 4px solid var(--neon-cyan);
					box-shadow: 0 0 20px var(--neon-cyan);
				}
				
				@media (max-width: 768px) {
					.profile-container {
						padding: 1rem 0.5rem;
					}
					
					.stats-grid {
						grid-template-columns: 1fr;
					}
				}
			</style>
			
			<div class="profile-container animate-fade-in">
				<h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 2rem; text-align: center;" class="neon-text-magenta" data-i18n="user_profile">User Profile</h1>
				
				<div id="successMessage" class="success-message">
					<svg style="width: 20px; height: 20px;" fill="currentColor" viewBox="0 0 20 20">
						<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
					</svg>
					<span id="successMessageText"></span>
				</div>
				
				<div class="glass-card profile-section" style="border-color: var(--neon-cyan);">
					<div style="display: flex; justify-content: center; padding: 1.5rem;">
						<div class="avatar-container">
							<img id="profilePicture" src="Portrait_Placeholder.png" alt="Profile Picture" class="profile-avatar">
							<button id="changePictureBtn" class="avatar-edit-btn">
								<svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
									<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
								</svg>
							</button>
						</div>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-green);">
					<h2 style="font-size: 1.5rem; font-weight: 600; text-align: center; margin-bottom: 1rem;" class="neon-text-green" data-i18n="stats">Stats</h2>
					<div class="stats-grid">
						<div style="text-align: center; padding: 1rem;">
							<div style="font-size: 2rem; font-weight: bold; color: var(--neon-green); margin-bottom: 0.5rem;" id="winsCount">0</div>
							<div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);" data-i18n="win">Win</div>
						</div>
						<div style="text-align: center; padding: 1rem;">
							<div style="font-size: 2rem; font-weight: bold; color: #ff0066; margin-bottom: 0.5rem;" id="lossesCount">0</div>
							<div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);" data-i18n="lose">Lose</div>
						</div>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-cyan);">
					<div id="profileStatus" style="margin-bottom: 1rem;"></div>
					<div>
						<div class="form-group">
							<label class="form-label" data-i18n="username_label">Username:</label>
							<input type="text" id="currentUsername" readonly style="width: 100%; background: rgba(20, 20, 40, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); padding: 0.875rem; border-radius: 12px; color: rgba(255, 255, 255, 0.7);">
						</div>
						<div class="form-group">
							<label class="form-label" data-i18n="email_label">Email:</label>
							<input type="text" id="currentEmail" readonly style="width: 100%; background: rgba(20, 20, 40, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); padding: 0.875rem; border-radius: 12px; color: rgba(255, 255, 255, 0.7);">
						</div>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-magenta);">
					<h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;" class="neon-text-magenta" data-i18n="change_username">Change Username</h2>
					<div>
						<div class="form-group">
							<label class="form-label" data-i18n="new_username_label">New Username:</label>
							<input type="text" id="newUsername" placeholder="Enter new username" data-i18n-placeholder="enter_new_username" style="width: 100%;">
						</div>
						<button id="changeUsernameBtn" class="btn-secondary" style="width: 100%;" data-i18n="update_username">
							Update Username
						</button>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-yellow);">
					<h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;" class="neon-text-yellow" data-i18n="change_password">Change Password</h2>
					<div>
						<div class="form-group">
							<label class="form-label" data-i18n="current_password_label">Current Password:</label>
							<input type="password" id="currentPassword" placeholder="Enter current password" data-i18n-placeholder="enter_current_password" style="width: 100%;">
						</div>
						<div class="form-group">
							<label class="form-label" data-i18n="new_password_label">New Password:</label>
							<input type="password" id="newPassword" placeholder="Enter new password" data-i18n-placeholder="enter_new_password" style="width: 100%;">
						</div>
						<div class="form-group">
							<label class="form-label" data-i18n="confirm_new_password_label">Confirm New Password:</label>
							<input type="password" id="confirmPassword" placeholder="Confirm new password" data-i18n-placeholder="confirm_new_password" style="width: 100%;">
						</div>
						<button id="changePasswordBtn" class="btn-secondary" style="width: 100%;" data-i18n="update_password">
							Update Password
						</button>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-purple);">
					<h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;" class="neon-text-purple" data-i18n="two_fa_title">Two-Factor Authentication (2FA)</h2>
					<div>
						<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
							<div>
								<p style="font-weight: 500; margin-bottom: 0.25rem; color: rgba(255, 255, 255, 0.9);" data-i18n="two_fa_status_label">2FA Status:</p>
								<p id="twoFAStatus" style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);" data-i18n="disabled">Disabled</p>
							</div>
							<button id="toggle2FABtn" class="btn-secondary" data-i18n="enable_2fa">
								Enable 2FA
							</button>
							</div>
							
							<div id="twoFASetup" style="display: none; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
							<div class="form-group">
								<p style="font-size: 0.875rem; margin-bottom: 0.5rem; color: rgba(255, 255, 255, 0.8);" data-i18n="please_check_email_for_code">Please check your email for the 6-digit verification code.</p>
								<div id="qrCodeContainer" class="glass-card" style="padding: 2rem; text-align: center; background: rgba(20, 20, 40, 0.5);">
									<p style="color: rgba(255, 255, 255, 0.5);" data-i18n="enter_code_below">Enter the code below to enable 2FA.</p>
								</div>
							</div>
							<div class="form-group">
								<label class="form-label" data-i18n="enter_6_digit_code">Enter the 6-digit code sent to your email:</label>
								<input type="text" id="verificationCode" placeholder="000000" data-i18n-placeholder="six_digit_code_placeholder" maxlength="6" style="width: 100%; text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem; font-weight: 600;">
							</div>
							<button id="verify2FABtn" class="btn-success" style="width: 100%;" data-i18n="verify_enable_2fa">
								Verify & Enable 2FA
							</button>
						</div>
					</div>
				</div>

				<div style="text-align: center; margin-top: 2rem;">
					<button id="homeBtn" class="btn-primary" data-i18n="back_to_home">
						← Back to Home
					</button>
				</div>
			</div>
			`;
		}
	}

	async onPreLoad(): Promise<void> {
		this.title = t('profile');
		console.log("Preparing to load Profile page");
	}

	async onLoad(): Promise<void> {
		const changePictureBtn = document.getElementById("changePictureBtn");
		if (changePictureBtn) {
			changePictureBtn.addEventListener("click", () => {
				const fileInput = document.createElement("input");
				fileInput.type = "file";
				fileInput.accept = "image/jpeg,image/jpg,image/png,image/webp";
				fileInput.click();
				fileInput.addEventListener("change", async () => {
					const file = fileInput.files?.[0];
					if (!file) return;

					if (file.size > 5 * 1024 * 1024) {
						Notification.error("File size must be less than 5MB");
						return;
					}

					const formData = new FormData();
					formData.append("file", file);

					try {
						const response = await fetch(`${FETCH_ADDRESS}/user/image-upload`, {
							method: "POST",
							credentials: "include",
							body: formData
						});

						if (response.ok) {
							const data = await response.json();
							Notification.success("Avatar changed successfully!");
							
							const profilePicture = document.getElementById("profilePicture") as HTMLImageElement;
							let avatarUrl = data.data?.avatar_url || data.avatar_url;
							if (profilePicture && avatarUrl) {
								if (avatarUrl.startsWith('/uploads/')) {
									avatarUrl = `https://localhost:3000${avatarUrl}`;
								}
								profilePicture.src = `${avatarUrl}?t=${Date.now()}`;
							}
							
							const currentUsername = window.localStorage.getItem("username");
							console.log('🔄 Avatar changed, invalidating cache for:', currentUsername);
							console.log('📦 Response data:', data);
							
							if (currentUsername && (window as any).ChatPage) {
								const refreshAvatar = async () => {
									try {
										if ((window as any).ChatPage.invalidateAvatarCache) {
											(window as any).ChatPage.invalidateAvatarCache(currentUsername);
										}
										
										await new Promise(resolve => setTimeout(resolve, 100));
										
										if ((window as any).ChatPage.fetchUserAvatar) {
											console.log('🔄 Fetching fresh avatar for:', currentUsername);
											const newAvatarUrl = await (window as any).ChatPage.fetchUserAvatar(currentUsername, true);
											console.log('📸 New avatar URL:', newAvatarUrl);
										}
										
										for (let i = 0; i < 3; i++) {
											if ((window as any).ChatPage.updateChatsList) {
												(window as any).ChatPage.updateChatsList();
											}
											if ((window as any).ChatPage.activeChatUser === currentUsername) {
												if ((window as any).ChatPage.updateChatHeader) {
													await (window as any).ChatPage.updateChatHeader();
												}
											}
											await new Promise(resolve => setTimeout(resolve, 50));
										}
										
										setTimeout(() => {
											if ((window as any).ChatPage.invalidateAvatarCache) {
												(window as any).ChatPage.invalidateAvatarCache(currentUsername);
											}
										}, 500);
										
										console.log('✅ Avatar cache invalidated and refreshed');
									} catch (error) {
										console.error('Error refreshing avatar:', error);
									}
								};
								
								refreshAvatar();
								
								setTimeout(refreshAvatar, 300);
								setTimeout(refreshAvatar, 1000);
							}
							
							await this.loadUserData();
						} else {
							const error = await response.json();
							Notification.error("Failed to upload avatar: " + (error.message || "Unknown error"));
						}
					} catch (error) {
						console.error("Upload error:", error);
						Notification.error("Network error. Please try again.");
					}
				});
			})
		}

		await this.loadUserData();
		
		this.setupEventListeners();
	}

	private async loadUserData(): Promise<void> {
		try {
			const response = await fetch(`${FETCH_ADDRESS}/user/profile`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const userData = await response.json();
				const currentUsernameInput = document.getElementById('currentUsername') as HTMLInputElement;
				const currentEmailInput = document.getElementById('currentEmail') as HTMLInputElement;
				const profilePicture = document.getElementById('profilePicture') as HTMLImageElement;
				const winsCount = document.getElementById('winsCount');
				const lossesCount = document.getElementById('lossesCount');
				
				if (currentUsernameInput) {
					currentUsernameInput.value = userData.username || 'Current User';
				}
				if (currentEmailInput) {
					currentEmailInput.value = userData.email || 'user@example.com';
				}
				
				if (winsCount) {
					winsCount.textContent = userData.wins || 0;
				}
				if (lossesCount) {
					lossesCount.textContent = userData.losses || 0;
				}
				
				if (profilePicture && userData.avatar_url) {
					if (userData.avatar_url.startsWith('/uploads/')) {
						profilePicture.src = `https://localhost:3000${userData.avatar_url}`;
					} else {
						profilePicture.src = userData.avatar_url;
					}
				}

				this.update2FAStatus(userData.twoFactorEnabled || userData['2fa_enabled'] || false);
				console.log('User data loaded successfully');
			} else if (response.status === 401) {
				console.warn('User not authenticated');
				this.updateProfileStatus('Authentication required', 'error');
				Notification.warning('You must be logged in to view your profile. Redirecting to login page...');
				GlobalState.setPage(LOGIN_PAGE);
			} else {
				console.error('API error, status:', response.status);
				this.updateProfileStatus('Error loading profile data', 'error');
				Notification.error('Error loading profile. Please try again later.');
			}
		} catch (error) {
			console.error('Network error:', error);
			this.updateProfileStatus('Network error - Please check your connection', 'error');
			Notification.error('Network error. Please check your internet connection and try again.');
		}
	}

	private loadMockUserData(): void {
		const currentUsernameInput = document.getElementById('currentUsername') as HTMLInputElement;
		const currentEmailInput = document.getElementById('currentEmail') as HTMLInputElement;
		if (currentUsernameInput) {
			currentUsernameInput.value = 'guest_user';
		}
		if (currentEmailInput) {
			currentEmailInput.value = 'guest@localhost.dev';
		}

		this.update2FAStatus(false);
		this.updateProfileStatus('Using demo data - Login to view real profile', 'info');
		console.log('Using mock user data for development (not logged in)');
	}

	private update2FAStatus(isEnabled: boolean): void {
		const twoFAStatus = document.getElementById('twoFAStatus');
		const toggle2FABtn = document.getElementById('toggle2FABtn') as HTMLButtonElement;

		if (twoFAStatus && toggle2FABtn) {
			if (isEnabled) {
				twoFAStatus.textContent = t('enabled');
				twoFAStatus.style.color = 'var(--neon-green)';
				toggle2FABtn.textContent = t('disable_2fa');
				toggle2FABtn.className = 'btn-danger';
			} else {
				twoFAStatus.textContent = t('disabled');
				twoFAStatus.style.color = 'rgba(255, 255, 255, 0.6)';
				toggle2FABtn.textContent = t('enable_2fa');
				toggle2FABtn.className = 'btn-secondary';
			}
		}
	}

	private updateProfileStatus(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
		const statusElement = document.getElementById('profileStatus');
		if (statusElement) {
			statusElement.textContent = message;
			statusElement.style.cssText = 'margin-bottom: 1rem; padding: 0.75rem; border-radius: 12px; font-size: 0.875rem;';
			if (type === 'error') {
				statusElement.style.background = 'rgba(255, 0, 102, 0.2)';
				statusElement.style.color = '#ff0066';
				statusElement.style.border = '1px solid #ff0066';
			} else if (type === 'success') {
				statusElement.style.background = 'rgba(0, 255, 65, 0.2)';
				statusElement.style.color = 'var(--neon-green)';
				statusElement.style.border = '1px solid var(--neon-green)';
			}
		}
	}

	private showSuccessMessage(message: string): void {
		const successMessage = document.getElementById('successMessage');
		const successMessageText = document.getElementById('successMessageText');

		if (successMessage && successMessageText) {
			successMessageText.textContent = message;
			successMessage.classList.add('show');

			setTimeout(() => {
				successMessage.classList.remove('show');
			}, 5000);
		}
	}

	private setupEventListeners(): void {
		const changePasswordBtn = document.getElementById('changePasswordBtn');
		if (changePasswordBtn) {
			changePasswordBtn.addEventListener('click', this.handlePasswordChange.bind(this));
		}

		const changeUsernameBtn = document.getElementById('changeUsernameBtn');
		if (changeUsernameBtn) {
			changeUsernameBtn.addEventListener('click', this.handleUsernameChange.bind(this));
		}

		const toggle2FABtn = document.getElementById('toggle2FABtn');
		if (toggle2FABtn) {
			toggle2FABtn.addEventListener('click', this.handleToggle2FA.bind(this));
		}

		const verify2FABtn = document.getElementById('verify2FABtn');
		if (verify2FABtn) {
			verify2FABtn.addEventListener('click', this.handleVerify2FA.bind(this));
		}

		const homeBtn = document.getElementById('homeBtn');
		if (homeBtn) {
			homeBtn.addEventListener('click', () => {
				GlobalState.setPage(HOME_PAGE);
			});
		}
	}

	private async handlePasswordChange(): Promise<void> {
		const currentPasswordInput = document.getElementById('currentPassword') as HTMLInputElement;
		const newPasswordInput = document.getElementById('newPassword') as HTMLInputElement;
		const confirmPasswordInput = document.getElementById('confirmPassword') as HTMLInputElement;

		const currentPassword = currentPasswordInput?.value;
		const newPassword = newPasswordInput?.value;
		const confirmPassword = confirmPasswordInput?.value;

		if (!currentPassword || !newPassword || !confirmPassword) {
			Notification.warning('Please fill in all password fields');
			return;
		}

		if (newPassword !== confirmPassword) {
			Notification.error('New passwords do not match');
			return;
		}

		if (newPassword.length < 6) {
			Notification.warning('New password must be at least 6 characters long');
			return;
		}

		if (newPassword === currentPassword) {
			Notification.warning('New password must be different from current password');
			return;
		}

		const hasUpperCase = /[A-Z]/.test(newPassword);
		const hasLowerCase = /[a-z]/.test(newPassword);
		const hasNumbers = /\d/.test(newPassword);

		if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
			Notification.warning('Password must contain at least one uppercase letter, one lowercase letter, and one number');
			return;
		}

		const changePasswordBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
		const originalText = changePasswordBtn.textContent;
		changePasswordBtn.disabled = true;
		changePasswordBtn.textContent = 'Updating...';

		try {
			const response = await fetch(`${FETCH_ADDRESS}/user/password`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					password: currentPassword,
					new_password: newPassword,
					new_re_password: confirmPassword
				})
			});

			if (response.ok) {
				try {
					const result = await response.json();
					this.showSuccessMessage(result.message || 'Password updated successfully!');
				} catch {
					this.showSuccessMessage('Password updated successfully!');
				}

				currentPasswordInput.value = '';
				newPasswordInput.value = '';
				confirmPasswordInput.value = '';
			} else if (response.status === 401) {
				Notification.warning('Please login to update your password');
			} else if (response.status === 403) {
				Notification.error('Current password is incorrect');
			} else {
				try {
					const error = await response.json();
					Notification.error(`Error: ${error.message || 'Failed to update password'}`);
				} catch {
					Notification.error('Failed to update password. Please try again.');
				}
			}
		} catch (error) {
			console.error('Network error updating password:', error);
			Notification.error('Network error. Please check your connection and try again.');
		} finally {
			changePasswordBtn.disabled = false;
			changePasswordBtn.textContent = originalText;
		}
	}

	private async handleUsernameChange(): Promise<void> {
		const newUsernameInput = document.getElementById('newUsername') as HTMLInputElement;
		const newUsername = newUsernameInput?.value.trim();

		if (!newUsername) {
			Notification.warning('Please enter a new username.');
			return;
		}

		const currentUsernameInput = document.getElementById('currentUsername') as HTMLInputElement;
		if (newUsername === currentUsernameInput.value) {
			Notification.warning('New username must be different from the current one.');
			return;
		}

		const changeUsernameBtn = document.getElementById('changeUsernameBtn') as HTMLButtonElement;
		const originalText = changeUsernameBtn.textContent;
		changeUsernameBtn.disabled = true;
		changeUsernameBtn.textContent = 'Updating...';

		try {
			const response = await fetch(`${FETCH_ADDRESS}/user/username`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({
					username: newUsername
				})
			});

			if (response.ok) {
				const result = await response.json();
				this.showSuccessMessage(result.message || 'Username updated successfully!');

				if (currentUsernameInput) {
					currentUsernameInput.value = newUsername;
				}
				newUsernameInput.value = '';
			} else {
				const error = await response.json();
				Notification.error(`Error: ${error.message || 'Failed to update username.'}`);
			}
		} catch (error) {
			console.error('Network error updating username:', error);
			Notification.error('Network error. Please check your connection and try again.');
		} finally {
			changeUsernameBtn.disabled = false;
			changeUsernameBtn.textContent = originalText;
		}
	}

	private async handleToggle2FA(): Promise<void> {
		const toggle2FABtn = document.getElementById('toggle2FABtn') as HTMLButtonElement;
		const twoFASetup = document.getElementById('twoFASetup');
		const twoFAStatus = document.getElementById('twoFAStatus');

		const isCurrentlyEnabled = twoFAStatus?.textContent === 'Enabled' || twoFAStatus?.textContent === 'Aktif';

		const originalText = toggle2FABtn.textContent;
		toggle2FABtn.disabled = true;

		if (isCurrentlyEnabled) {
			const confirmDisable = confirm(t('confirm_disable_2fa'));
			if (!confirmDisable) {
				toggle2FABtn.disabled = false;
				return;
			}

			toggle2FABtn.textContent = t('disabling');

			try {
				const response = await fetch(`${FETCH_ADDRESS}/auth/2fa`, {
					method: 'POST',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ t2type: false })
				});

				if (response.ok) {
					Notification.success(t('two_fa_disabled_success'));
					this.update2FAStatus(false);
				} else if (response.status === 401) {
					Notification.warning(t('please_login_disable_2fa'));
				} else {
					try {
						const error = await response.json();
						Notification.error(`Error: ${error.message || 'Failed to disable 2FA'}`);
					} catch {
						Notification.error('Failed to disable 2FA. Please try again.');
					}
				}
			} catch (error) {
				console.error('Network error disabling 2FA:', error);
				Notification.error('Network error. Please check your connection and try again.');
			}
		} else {
			if (twoFASetup && twoFASetup.style.display !== 'none') {
				twoFASetup.style.display = 'none';
				this.update2FAStatus(false);
				toggle2FABtn.disabled = false;
				return;
			}

			toggle2FABtn.textContent = t('setting_up');

			try {
				const response = await fetch(`${FETCH_ADDRESS}/auth/2fa`, {
					method: 'POST',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json'
					},
					body: JSON.stringify({ t2type: true })
				});

				if (response.ok) {
					const result = await response.json();
					if (result.message === "OTP sent successfully") {
						Notification.success(t('verification_code_sent'));
						this.show2FASetup();
					} else {
						Notification.error(`Error: ${result.message || 'Failed to start 2FA setup'}`);
					}
				} else if (response.status === 401) {
					Notification.warning(t('please_login_setup_2fa'));
				} else {
					try {
						const error = await response.json();
						Notification.error(`Error: ${error.message || 'Failed to setup 2FA'}`);
					} catch {
						Notification.error('Failed to setup 2FA. Please try again.');
					}
				}
			} catch (error) {
				console.error('Network error setting up 2FA:', error);
				Notification.error('Network error. Please check your connection and try again.');
			}
		}

		toggle2FABtn.disabled = false;
		if (toggle2FABtn.textContent !== t('cancel_setup')) {
			toggle2FABtn.textContent = originalText;
		}
	}

	private show2FASetup(): void {
		const twoFASetup = document.getElementById('twoFASetup');
		const toggle2FABtn = document.getElementById('toggle2FABtn') as HTMLButtonElement;

		if (twoFASetup) {
			twoFASetup.style.display = 'block';
		}

		const qrCodeContainer = document.getElementById('qrCodeContainer');
		if (qrCodeContainer) {
			qrCodeContainer.innerHTML = `
				<div style="text-align: center;">
					<p style="color: rgba(255, 255, 255, 0.7); margin-bottom: 0.5rem;">${t('please_check_email_for_code')}</p>
					<p style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.5);">${t('enter_code_below')}</p>
				</div>
			`;
		}

		toggle2FABtn.textContent = t('cancel_setup');
		toggle2FABtn.className = 'btn-danger';
	}

	private async handleVerify2FA(): Promise<void> {
		const verificationCodeInput = document.getElementById('verificationCode') as HTMLInputElement;
		const verificationCode = verificationCodeInput?.value.trim();

		if (!verificationCode || verificationCode.length !== 6) {
			Notification.warning(t('enter_valid_6_digit_code'));
			return;
		}

		if (!/^\d{6}$/.test(verificationCode)) {
			Notification.warning(t('verification_code_must_be_6_digits'));
			return;
		}

		const verify2FABtn = document.getElementById('verify2FABtn') as HTMLButtonElement;
		const originalText = verify2FABtn.textContent;
		verify2FABtn.disabled = true;
		verify2FABtn.textContent = t('verifying');

		try {
			const response = await fetch(`${FETCH_ADDRESS}/auth/2fa/verify`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				credentials: 'include',
				body: JSON.stringify({ OTP: verificationCode })
			});

			if (response.ok) {
				Notification.success(t('two_fa_enabled_success'));
				this.update2FAStatus(true);

				const twoFASetup = document.getElementById('twoFASetup');
				if (twoFASetup) {
					twoFASetup.style.display = 'none';
				}

				verificationCodeInput.value = '';
			} else if (response.status === 401) {
				Notification.warning(t('please_login_verify_2fa'));
			} else if (response.status === 400) {
				Notification.error(t('invalid_verification_code'));
			} else {
				try {
					const error = await response.json();
					Notification.error(`Error: ${error.message || 'Invalid verification code'}`);
				} catch {
					Notification.error(t('invalid_verification_code'));
				}
			}
		} catch (error) {
			console.error('Network error verifying 2FA:', error);
			Notification.error('Network error. Please check your connection and try again.');
		} finally {
			verify2FABtn.disabled = false;
			verify2FABtn.textContent = originalText;
		}
	}

	async onUnload(): Promise<void> {
		console.log("Profile page unloaded");
	}
};

const PROFILE_PAGE = new ProfilePage();

export { ProfilePage, PROFILE_PAGE };
