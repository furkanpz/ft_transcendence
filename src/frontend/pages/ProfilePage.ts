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
					if (response.ok) {
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
					this.updateProfileStatus(t('network_error_generic'), 'error');
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
				<h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 2rem; text-align: center;" class="neon-text-magenta" data-i18n="user_profile">${t('user_profile')}</h1>
				
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
					<h2 style="font-size: 1.5rem; font-weight: 600; text-align: center; margin-bottom: 1rem;" class="neon-text-green" data-i18n="stats">${t('stats')}</h2>
					<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">
						<div style="text-align: center; padding: 1rem;">
							<div style="font-size: 1.75rem; font-weight: bold; color: var(--neon-cyan); margin-bottom: 0.5rem;" id="totalMatchesCount">0</div>
							<div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);">${t('total_matches')}</div>
						</div>
						<div style="text-align: center; padding: 1rem;">
							<div style="font-size: 1.75rem; font-weight: bold; color: var(--neon-green); margin-bottom: 0.5rem;" id="winsCount">0</div>
							<div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);" data-i18n="win">${t('win')}</div>
						</div>
						<div style="text-align: center; padding: 1rem;">
							<div style="font-size: 1.75rem; font-weight: bold; color: #ff0066; margin-bottom: 0.5rem;" id="lossesCount">0</div>
							<div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);" data-i18n="lose">${t('lose')}</div>
						</div>
						<div style="text-align: center; padding: 1rem;">
							<div style="font-size: 1.75rem; font-weight: bold; color: var(--neon-yellow); margin-bottom: 0.5rem;" id="winRateCount">0%</div>
							<div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.7);">${t('win_rate')}</div>
						</div>
					</div>
					<div style="border-top: 1px solid rgba(255, 255, 255, 0.1); margin: 1rem 0; padding-top: 1rem;">
						<h3 style="font-size: 1.25rem; font-weight: 600; text-align: center; margin-bottom: 0.75rem;" class="neon-text-magenta" data-i18n="tournament_stats">🏆 ${t('tournament_stats')}</h3>
						<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 1rem;">
							<div style="text-align: center; padding: 0.75rem;">
								<div style="font-size: 1.5rem; font-weight: bold; color: var(--neon-purple); margin-bottom: 0.5rem;" id="totalTournamentsCount">0</div>
								<div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.7);" data-i18n="tournament_total">${t('tournament_total')}</div>
							</div>
							<div style="text-align: center; padding: 0.75rem;">
								<div style="font-size: 1.5rem; font-weight: bold; color: var(--neon-green); margin-bottom: 0.5rem;" id="tournamentWinsCount">0</div>
								<div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.7);" data-i18n="tournament_wins">${t('tournament_wins')}</div>
							</div>
							<div style="text-align: center; padding: 0.75rem;">
								<div style="font-size: 1.5rem; font-weight: bold; color: #ff0066; margin-bottom: 0.5rem;" id="tournamentLossesCount">0</div>
								<div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.7);" data-i18n="tournament_losses">${t('tournament_losses')}</div>
							</div>
							<div style="text-align: center; padding: 0.75rem;">
								<div style="font-size: 1.5rem; font-weight: bold; color: var(--neon-yellow); margin-bottom: 0.5rem;" id="tournamentWinRateCount">0%</div>
								<div style="font-size: 0.75rem; color: rgba(255, 255, 255, 0.7);" data-i18n="tournament_win_rate">${t('tournament_win_rate')}</div>
							</div>
						</div>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-purple);">
					<h2 style="font-size: 1.5rem; font-weight: 600; text-align: center; margin-bottom: 1rem;" class="neon-text-purple">📜 ${t('match_history')}</h2>
					<div id="matchHistoryContainer" style="max-height: 400px; overflow-y: auto;">
						<div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);">
							<p>${t('match_history_loading')}</p>
						</div>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-magenta);">
					<h2 style="font-size: 1.5rem; font-weight: 600; text-align: center; margin-bottom: 1rem;" class="neon-text-magenta">🏆 ${t('tournament_history')}</h2>
					<div id="tournamentHistoryContainer" style="max-height: 400px; overflow-y: auto;">
						<div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);">
							<p>${t('tournament_history_loading')}</p>
						</div>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-cyan);">
					<div id="profileStatus" style="margin-bottom: 1rem;"></div>
					<div>
						<div class="form-group">
							<label class="form-label" data-i18n="username_label">${t('username_label')}</label>
							<input type="text" id="currentUsername" readonly style="width: 100%; background: rgba(20, 20, 40, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); padding: 0.875rem; border-radius: 12px; color: rgba(255, 255, 255, 0.7);">
						</div>
						<div class="form-group">
							<label class="form-label" data-i18n="email_label">${t('email_label')}</label>
							<input type="text" id="currentEmail" readonly style="width: 100%; background: rgba(20, 20, 40, 0.5); border: 1px solid rgba(255, 255, 255, 0.2); padding: 0.875rem; border-radius: 12px; color: rgba(255, 255, 255, 0.7);">
						</div>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-magenta);">
					<h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;" class="neon-text-magenta" data-i18n="change_username">${t('change_username')}</h2>
					<div>
						<div class="form-group">
							<label class="form-label" data-i18n="new_username_label">${t('new_username_label')}</label>
							<input type="text" id="newUsername" placeholder="${t('enter_new_username')}" data-i18n-placeholder="enter_new_username" style="width: 100%;">
						</div>
						<button id="changeUsernameBtn" class="btn-secondary" style="width: 100%;" data-i18n="update_username">
							${t('update_username')}
						</button>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-yellow);">
					<h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;" class="neon-text-yellow" data-i18n="change_password">${t('change_password')}</h2>
					<div>
						<div class="form-group">
							<label class="form-label" data-i18n="current_password_label">${t('current_password_label')}</label>
							<input type="password" id="currentPassword" placeholder="${t('enter_current_password')}" data-i18n-placeholder="enter_current_password" style="width: 100%;">
						</div>
						<div class="form-group">
							<label class="form-label" data-i18n="new_password_label">${t('new_password_label')}</label>
							<input type="password" id="newPassword" placeholder="${t('enter_new_password')}" data-i18n-placeholder="enter_new_password" style="width: 100%;">
						</div>
						<div class="form-group">
							<label class="form-label" data-i18n="confirm_new_password_label">${t('confirm_new_password_label')}</label>
							<input type="password" id="confirmPassword" placeholder="${t('confirm_new_password')}" data-i18n-placeholder="confirm_new_password" style="width: 100%;">
						</div>
						<button id="changePasswordBtn" class="btn-secondary" style="width: 100%;" data-i18n="update_password">
							${t('update_password')}
						</button>
					</div>
				</div>

				<div class="glass-card profile-section" style="border-color: var(--neon-purple);">
					<h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem;" class="neon-text-purple" data-i18n="two_fa_title">${t('two_fa_title')}</h2>
					<div>
						<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
							<div>
								<p style="font-weight: 500; margin-bottom: 0.25rem; color: rgba(255, 255, 255, 0.9);" data-i18n="two_fa_status_label">${t('two_fa_status_label')}</p>
								<p id="twoFAStatus" style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);" data-i18n="disabled">${t('disabled')}</p>
							</div>
							<button id="toggle2FABtn" class="btn-secondary" data-i18n="enable_2fa">
								${t('enable_2fa')}
							</button>
							</div>
							
							<div id="twoFASetup" style="display: none; padding-top: 1.5rem; border-top: 1px solid rgba(255, 255, 255, 0.1);">
							<div class="form-group">
								<p style="font-size: 0.875rem; margin-bottom: 0.5rem; color: rgba(255, 255, 255, 0.8);" data-i18n="please_check_email_for_code">${t('please_check_email_for_code')}</p>
								<div id="qrCodeContainer" class="glass-card" style="padding: 2rem; text-align: center; background: rgba(20, 20, 40, 0.5);">
									<p style="color: rgba(255, 255, 255, 0.5);" data-i18n="enter_code_below">${t('enter_code_below')}</p>
								</div>
							</div>
							<div class="form-group">
								<label class="form-label" data-i18n="enter_6_digit_code">${t('enter_6_digit_code')}</label>
								<input type="text" id="verificationCode" placeholder="${t('six_digit_code_placeholder')}" data-i18n-placeholder="six_digit_code_placeholder" maxlength="6" style="width: 100%; text-align: center; font-size: 1.5rem; letter-spacing: 0.5rem; font-weight: 600;">
							</div>
							<button id="verify2FABtn" class="btn-success" style="width: 100%;" data-i18n="verify_enable_2fa">
								${t('verify_enable_2fa')}
							</button>
						</div>
					</div>
				</div>

				<div style="text-align: center; margin-top: 2rem;">
					<button id="homeBtn" class="btn-primary" data-i18n="back_to_home">
						← ${t('back_to_home')}
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
						Notification.error(t('file_size_limit_error'));
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
							Notification.success(t('avatar_changed_success'));
							
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
								
								setTimeout(refreshAvatar, 1300);
							}
							
							await this.loadUserData();
						} else {
							const error = await response.json();
							Notification.error("Failed to upload avatar: " + (error.message || "Unknown error")); // i18n anahtar eklenebilir: avatar_upload_failed
						}
					} catch (error) {
						console.error("Upload error:", error);
						Notification.error("Network error. Please try again."); // i18n anahtar eklenebilir: network_error_generic
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
				
				if (currentUsernameInput) {
					currentUsernameInput.value = userData.username || 'Current User';
				}
				if (currentEmailInput) {
					currentEmailInput.value = userData.email || 'user@example.com';
				}
				
				if (profilePicture && userData.avatar_url) {
					if (userData.avatar_url.startsWith('/uploads/')) {
						profilePicture.src = `https://localhost:3000${userData.avatar_url}`;
					} else {
						profilePicture.src = userData.avatar_url;
					}
				}

				// Backend farklı alan isimleri kullanabilir; hepsini normalize et
				const twofaFlag = !!(userData.twoFactorEnabled || userData['2fa_enabled'] || userData.twof_active || userData.twofa || false);
				this.update2FAStatus(twofaFlag);
				console.log('User data loaded successfully');
				
				this.loadDetailedStats();
				
				this.loadMatchHistory();
				this.loadTournamentHistory();
			} else if (response.status === 401) {
				console.warn('User not authenticated or session expired');
				this.updateProfileStatus(t('auth_required'), 'error');
				Notification.warning(t('auth_required_redirect'));
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
			Notification.warning(t('password_fields_incomplete'));
			return;
		}

		if (newPassword !== confirmPassword) {
			Notification.error(t('password_mismatch'));
			return;
		}

		if (newPassword.length < 6) {
			Notification.warning(t('password_too_short'));
			return;
		}

		if (newPassword === currentPassword) {
			Notification.warning(t('password_same_as_old'));
			return;
		}

		const hasUpperCase = /[A-Z]/.test(newPassword);
		const hasLowerCase = /[a-z]/.test(newPassword);
		const hasNumbers = /\d/.test(newPassword);

		if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
			Notification.warning(t('password_complexity_error'));
			return;
		}

		const changePasswordBtn = document.getElementById('changePasswordBtn') as HTMLButtonElement;
		const originalText = changePasswordBtn.textContent;
		changePasswordBtn.disabled = true;
		changePasswordBtn.textContent = t('updating');

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
					this.showSuccessMessage(result.message || t('password_update_success'));
				} catch {
					this.showSuccessMessage(t('password_update_success'));
				}

				currentPasswordInput.value = '';
				newPasswordInput.value = '';
				confirmPasswordInput.value = '';
			} else if (response.status === 401) {
				Notification.warning(t('please_login_verify_2fa'));
			} else if (response.status === 403) {
				Notification.error(t('current_password_incorrect'));
			} else {
				try {
					const error = await response.json();
					Notification.error(`Error: ${error.message || t('password_update_failed')}`);
				} catch {
					Notification.error(t('password_update_failed'));
				}
			}
		} catch (error) {
			console.error('Network error updating password:', error);
			Notification.error(t('network_error_generic'));
		} finally {
			changePasswordBtn.disabled = false;
			changePasswordBtn.textContent = originalText;
		}
	}

	private async handleUsernameChange(): Promise<void> {
		const newUsernameInput = document.getElementById('newUsername') as HTMLInputElement;
		const newUsername = newUsernameInput?.value.trim();

		if (!newUsername) {
			Notification.warning(t('username_empty_error'));
			return;
		}

		const currentUsernameInput = document.getElementById('currentUsername') as HTMLInputElement;
		if (newUsername === currentUsernameInput.value) {
			Notification.warning(t('username_same_error'));
			return;
		}

		const changeUsernameBtn = document.getElementById('changeUsernameBtn') as HTMLButtonElement;
		const originalText = changeUsernameBtn.textContent;
		changeUsernameBtn.disabled = true;
		changeUsernameBtn.textContent = t('updating');

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
				this.showSuccessMessage(result.message || t('username_update_success'));

				if (currentUsernameInput) {
					currentUsernameInput.value = newUsername;
				}
				newUsernameInput.value = '';
			} else {
				const error = await response.json();
				Notification.error(`Error: ${error.message || t('username_update_failed')}`);
			}
		} catch (error) {
			console.error('Network error updating username:', error);
			Notification.error(t('network_error_generic'));
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
						Notification.error(`Error: ${error.message || t('two_fa_disable_failed')}`);
					} catch {
						Notification.error(t('two_fa_disable_failed'));
					}
				}
			} catch (error) {
				console.error('Network error disabling 2FA:', error);
				Notification.error(t('network_error_generic'));
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
					Notification.warning(t('auth_required'));
				} else {
					try {
						const error = await response.json();
						Notification.error(`Error: ${error.message || t('two_fa_setup_failed')}`);
					} catch {
						Notification.error(t('two_fa_setup_failed'));
					}
				}
			} catch (error) {
				console.error('Network error setting up 2FA:', error);
				Notification.error(t('network_error_generic'));
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
				Notification.warning(t('auth_required'));
			} else if (response.status === 400) {
				Notification.error(t('invalid_verification_code'));
			} else {
				try {
					const error = await response.json();
					Notification.error(`Error: ${error.message || t('invalid_verification_code')}`);
				} catch {
					Notification.error(t('invalid_verification_code'));
				}
			}
		} catch (error) {
			console.error('Network error verifying 2FA:', error);
			Notification.error(t('network_error_generic'));
		} finally {
			verify2FABtn.disabled = false;
			verify2FABtn.textContent = originalText;
		}
	}

	async onUnload(): Promise<void> {
		console.log("Profile page unloaded");
	}

	private async loadDetailedStats(): Promise<void> {
		try {
			const response = await fetch(`${FETCH_ADDRESS}/user/detailed-stats`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const data = await response.json();
				const stats = data.stats || {};

				const totalMatchesCount = document.getElementById('totalMatchesCount');
				const winsCount = document.getElementById('winsCount');
				const lossesCount = document.getElementById('lossesCount');
				const winRateCount = document.getElementById('winRateCount');

				if (totalMatchesCount) {
					totalMatchesCount.textContent = stats.totalMatches || 0;
				}
				if (winsCount) {
					winsCount.textContent = stats.wins || 0;
				}
				if (lossesCount) {
					lossesCount.textContent = stats.losses || 0;
				}
				if (winRateCount) {
					winRateCount.textContent = `${stats.winRate || 0}%`;
				}

				const totalTournamentsCount = document.getElementById('totalTournamentsCount');
				const tournamentWinsCount = document.getElementById('tournamentWinsCount');
				const tournamentLossesCount = document.getElementById('tournamentLossesCount');
				const tournamentWinRateCount = document.getElementById('tournamentWinRateCount');

				if (totalTournamentsCount) {
					totalTournamentsCount.textContent = stats.totalTournaments || 0;
				}
				if (tournamentWinsCount) {
					tournamentWinsCount.textContent = stats.tournamentWins || 0;
				}
				if (tournamentLossesCount) {
					tournamentLossesCount.textContent = stats.tournamentLosses || 0;
				}
				if (tournamentWinRateCount) {
					tournamentWinRateCount.textContent = `${stats.tournamentWinRate || 0}%`;
				}

				console.log('Detailed statistics loaded successfully');
			} else {
				console.error('Failed to load detailed statistics');
			}
		} catch (error) {
			console.error('Error loading detailed statistics:', error);
		}
	}

	private async loadMatchHistory(): Promise<void> {
		const container = document.getElementById('matchHistoryContainer');
		if (!container) return;

		try {
			const response = await fetch(`${FETCH_ADDRESS}/user/match-history?limit=5`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const data = await response.json();
				const matches = data.matches || [];

				if (matches.length === 0) {
					container.innerHTML = `
						<div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);">
							<p data-i18n="match_history_empty">${t('match_history_empty')}</p>
						</div>
					`;
					return;
				}

				const profileResponse = await fetch(`${FETCH_ADDRESS}/user/profile`, {
					method: 'GET',
					credentials: 'include',
					headers: {
						'Content-Type': 'application/json'
					}
				});
				
				let currentUserId: number | null = null;
				if (profileResponse.ok) {
					const profileData = await profileResponse.json();
					currentUserId = profileData.id;
				}

				container.innerHTML = matches.map((match: any) => {
					const isWinner = currentUserId && match.winner_id === currentUserId;
					const matchTypeIcon = match.match_type === 'tournament' ? '🏆' : match.match_type === 'multiplayer' ? '👥' : '⚔️';
					const resultColor = isWinner ? 'var(--neon-green)' : '#ff0066';
					const winnerName = match.winner_username || 'Unknown';
					
					return `
						<div style="padding: 1rem; margin-bottom: 0.75rem; background: rgba(20, 20, 40, 0.5); border-radius: 12px; border-left: 4px solid ${resultColor};">
							<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
								<div style="display: flex; align-items: center; gap: 0.75rem;">
									<span style="font-size: 1.5rem;">${matchTypeIcon}</span>
									<div>
										<div style="font-weight: 600; color: white;">
											${match.player1_username} vs ${match.player2_username}
										</div>
										<div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">
											${match.match_type} • ${new Date(match.played_at).toLocaleDateString('tr-TR')}
										</div>
									</div>
								</div>
								<div style="text-align: right;">
									<div style="font-weight: 700; font-size: 1.25rem; color: ${resultColor};">
										${t('winner_label')} ${winnerName}
									</div>
									<div style="font-size: 1rem; color: rgba(255, 255, 255, 0.8);">
										${match.p1_score} - ${match.p2_score}
									</div>
								</div>
							</div>
						</div>
					`;
				}).join('');
			} else {
				container.innerHTML = `
					<div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);">
						<p data-i18n="match_history_load_error">${t('match_history_load_error')}</p>
					</div>
				`;
			}
		} catch (error) {
			console.error('Error loading match history:', error);
			container.innerHTML = `
				<div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);">
					<p data-i18n="match_history_load_error">${t('match_history_load_error')}</p>
				</div>
			`;
		}
	}

	private async loadTournamentHistory(): Promise<void> {
		const container = document.getElementById('tournamentHistoryContainer');
		if (!container) return;

		try {
			const response = await fetch(`${FETCH_ADDRESS}/user/tournament-history?limit=5`, {
				method: 'GET',
				credentials: 'include',
				headers: {
					'Content-Type': 'application/json'
				}
			});

			if (response.ok) {
				const data = await response.json();
				const tournaments = data.tournaments || [];

				if (tournaments.length === 0) {
					container.innerHTML = `
						<div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);">
							<p data-i18n="tournament_history_empty">${t('tournament_history_empty')}</p>
						</div>
					`;
					return;
				}

				container.innerHTML = tournaments.map((tournament: any) => {
					const isWinner = tournament.winner_id && tournament.final_position === 1;
					const positionText = tournament.final_position === 1 ? '🥇 1. Sıra' : 
										 tournament.final_position === 2 ? '🥈 2. Sıra' : 
										 tournament.final_position === 3 ? '🥉 3. Sıra' : 
										 `#${tournament.final_position}`;
					const positionColor = tournament.final_position === 1 ? 'var(--neon-yellow)' : 
										  tournament.final_position === 2 ? '#C0C0C0' : 
										  tournament.final_position === 3 ? '#CD7F32' : 
										  'rgba(255, 255, 255, 0.6)';
					
					return `
						<div style="padding: 1rem; margin-bottom: 0.75rem; background: rgba(20, 20, 40, 0.5); border-radius: 12px; border-left: 4px solid ${positionColor};">
							<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
								<div>
									<div style="font-weight: 600; color: white; margin-bottom: 0.25rem;">
										Turnuva ${tournament.id.substring(0, 8)}
									</div>
									<div style="font-size: 0.875rem; color: rgba(255, 255, 255, 0.6);">
										${tournament.required_players} Oyuncu • ${new Date(tournament.completed_at).toLocaleDateString('tr-TR')}
									</div>
									${tournament.winner_username ? `
										<div style="font-size: 0.875rem; color: var(--neon-green); margin-top: 0.25rem;">
											🏆 ${t('champion_label')} ${tournament.winner_username}
										</div>
									` : ''}
								</div>
								<div style="text-align: right;">
									<div style="font-weight: 700; font-size: 1.25rem; color: ${positionColor};">
										${positionText}
									</div>
								</div>
							</div>
						</div>
					`;
				}).join('');
			} else {
				container.innerHTML = `
					<div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);">
						<p data-i18n="tournament_history_load_error">${t('tournament_history_load_error')}</p>
					</div>
				`;
			}
		} catch (error) {
			console.error('Error loading tournament history:', error);
			container.innerHTML = `
				<div style="text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.5);">
					<p data-i18n="tournament_history_load_error">${t('tournament_history_load_error')}</p>
				</div>
			`;
		}
	}
};

const PROFILE_PAGE = new ProfilePage();

export { ProfilePage, PROFILE_PAGE };
