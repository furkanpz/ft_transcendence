import { Page, GlobalState, FETCH_ADDRESS } from "../main"
import { LOGIN_PAGE } from "./LoginPage"

class ProfilePage implements Page {
	title: string = "Profile";
	data: any = null;
	
	async render() : Promise<void> {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<div class="container mx-auto p-6 max-w-4xl">
					<h1 class="text-3xl font-bold mb-8 text-center">User Profile</h1>
					
					<!-- Current User Info -->
					<div class="bg-white rounded-lg shadow-md p-6 mb-6">
						<h2 class="text-xl font-semibold mb-4">Current User Information</h2>
						<div id="profileStatus" class="mb-4 p-3 rounded-lg bg-gray-100 text-sm text-gray-600">
							Loading profile information...
						</div>
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium mb-2">Username:</label>
								<input type="text" id="currentUsername" class="w-full p-3 border rounded-lg bg-gray-100" readonly>
							</div>
							<div>
								<label class="block text-sm font-medium mb-2">Email:</label>
								<input type="text" id="currentEmail" class="w-full p-3 border rounded-lg bg-gray-100" readonly>
							</div>
						</div>
					</div>

					<!-- Password Change Section -->
					<div class="bg-white rounded-lg shadow-md p-6 mb-6">
						<h2 class="text-xl font-semibold mb-4">Change Password</h2>
						<div class="space-y-4">
							<div>
								<label class="block text-sm font-medium mb-2">Current Password:</label>
								<input type="password" id="currentPassword" class="w-full p-3 border rounded-lg" placeholder="Enter current password">
							</div>
							<div>
								<label class="block text-sm font-medium mb-2">New Password:</label>
								<input type="password" id="newPassword" class="w-full p-3 border rounded-lg" placeholder="Enter new password">
							</div>
							<div>
								<label class="block text-sm font-medium mb-2">Confirm New Password:</label>
								<input type="password" id="confirmPassword" class="w-full p-3 border rounded-lg" placeholder="Confirm new password">
							</div>
							<button id="changePasswordBtn" class="bg-green-500 text-white px-6 py-2 rounded-lg hover:bg-green-600 transition">
								Update Password
							</button>
						</div>
					</div>

					<!-- 2FA Section -->
					<div class="bg-white rounded-lg shadow-md p-6 mb-6">
						<h2 class="text-xl font-semibold mb-4">Two-Factor Authentication (2FA)</h2>
						<div class="space-y-4">
							<div class="flex items-center justify-between">
								<div>
									<p class="font-medium">2FA Status:</p>
									<p id="twoFAStatus" class="text-sm text-gray-600">Disabled</p>
								</div>
								<button id="toggle2FABtn" class="bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition">
									Enable 2FA
								</button>
							</div>
							
							<!-- 2FA Setup Section (initially hidden) -->
							<div id="twoFASetup" class="hidden space-y-4 border-t pt-4">
								<div>
									<p class="text-sm mb-2">Scan this QR code with your authenticator app:</p>
									<div id="qrCodeContainer" class="bg-gray-100 p-4 rounded-lg text-center">
										<!-- QR Code will be generated here -->
										<p class="text-gray-500">QR Code will appear here</p>
									</div>
								</div>
								<div>
									<label class="block text-sm font-medium mb-2">Enter verification code:</label>
									<input type="text" id="verificationCode" class="w-full p-3 border rounded-lg" placeholder="Enter 6-digit code">
								</div>
								<button id="verify2FABtn" class="bg-purple-500 text-white px-6 py-2 rounded-lg hover:bg-purple-600 transition">
									Verify & Enable 2FA
								</button>
							</div>
						</div>
					</div>

					<!-- Navigation -->
					<div class="text-center">
						<button id="homeBtn" class="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition" onclick="loadPage(HOME_PAGE)">
							Back to Home
						</button>
					</div>
				</div>
			`;
		}
	}

	async onPreLoad() : Promise<void> {
		console.log("Preparing to load Profile page");
	}

	async onLoad() : Promise<void> {
		console.log("Profile page loaded");
		
		// Load current user data
		await this.loadUserData();
		
		// Setup event listeners
		this.setupEventListeners();
	}

	private async loadUserData(): Promise<void> {
		this.updateProfileStatus('Loading profile information...', 'info');
		
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
				if (currentUsernameInput) {
					currentUsernameInput.value = userData.username || 'Current User';
				}
				if (currentEmailInput) {
					currentEmailInput.value = userData.email || 'user@example.com';
				}
				
				// Update 2FA status - backend'den gelen veride twoFactorEnabled veya 2fa_enabled olabilir
				this.update2FAStatus(userData.twoFactorEnabled || userData['2fa_enabled'] || false);
				this.updateProfileStatus('Profile loaded successfully', 'success');
				console.log('User data loaded successfully');
			} else if (response.status === 401) {
				// Unauthorized - redirect to login
				console.warn('User not authenticated');
				this.updateProfileStatus('Authentication required', 'error');
				alert('You must be logged in to view your profile. Redirecting to login page...');
				// Redirect to login page using GlobalState
				GlobalState.setPage(LOGIN_PAGE);
			} else {
				// API error
				console.error('API error, status:', response.status);
				this.updateProfileStatus('Error loading profile data', 'error');
				alert('Error loading profile. Please try again later.');
			}
		} catch (error) {
			console.error('Network error:', error);
			this.updateProfileStatus('Network error - Please check your connection', 'error');
			alert('Network error. Please check your internet connection and try again.');
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
		
		// Mock 2FA as disabled for development
		this.update2FAStatus(false);
		this.updateProfileStatus('Using demo data - Login to view real profile', 'info');
		console.log('Using mock user data for development (not logged in)');
	}

	private update2FAStatus(isEnabled: boolean): void {
		const twoFAStatus = document.getElementById('twoFAStatus');
		const toggle2FABtn = document.getElementById('toggle2FABtn') as HTMLButtonElement;
		
		if (twoFAStatus && toggle2FABtn) {
			if (isEnabled) {
				twoFAStatus.textContent = 'Enabled';
				twoFAStatus.className = 'text-sm text-green-600';
				toggle2FABtn.textContent = 'Disable 2FA';
				toggle2FABtn.className = 'bg-red-500 text-white px-6 py-2 rounded-lg hover:bg-red-600 transition';
			} else {
				twoFAStatus.textContent = 'Disabled';
				twoFAStatus.className = 'text-sm text-red-600';
				toggle2FABtn.textContent = 'Enable 2FA';
				toggle2FABtn.className = 'bg-orange-500 text-white px-6 py-2 rounded-lg hover:bg-orange-600 transition';
			}
		}
	}

	private updateProfileStatus(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
		const statusElement = document.getElementById('profileStatus');
		if (statusElement) {
			statusElement.textContent = message;
			
			// Reset classes
			statusElement.className = 'mb-4 p-3 rounded-lg text-sm';
			
			// Apply type-specific styling
			switch (type) {
				case 'success':
					statusElement.className += ' bg-green-100 text-green-700 border border-green-200';
					break;
				case 'error':
					statusElement.className += ' bg-red-100 text-red-700 border border-red-200';
					break;
				case 'warning':
					statusElement.className += ' bg-yellow-100 text-yellow-700 border border-yellow-200';
					break;
				default:
					statusElement.className += ' bg-blue-100 text-blue-700 border border-blue-200';
					break;
			}
		}
	}

	private setupEventListeners(): void {
		// Password change
		const changePasswordBtn = document.getElementById('changePasswordBtn');
		if (changePasswordBtn) {
			changePasswordBtn.addEventListener('click', this.handlePasswordChange.bind(this));
		}

		// 2FA toggle
		const toggle2FABtn = document.getElementById('toggle2FABtn');
		if (toggle2FABtn) {
			toggle2FABtn.addEventListener('click', this.handleToggle2FA.bind(this));
		}

		// 2FA verification
		const verify2FABtn = document.getElementById('verify2FABtn');
		if (verify2FABtn) {
			verify2FABtn.addEventListener('click', this.handleVerify2FA.bind(this));
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
			alert('Please fill in all password fields');
			return;
		}

		if (newPassword !== confirmPassword) {
			alert('New passwords do not match');
			return;
		}

		if (newPassword.length < 6) {
			alert('New password must be at least 6 characters long');
			return;
		}

		if (newPassword === currentPassword) {
			alert('New password must be different from current password');
			return;
		}

		// Password strength check
		const hasUpperCase = /[A-Z]/.test(newPassword);
		const hasLowerCase = /[a-z]/.test(newPassword);
		const hasNumbers = /\d/.test(newPassword);
		
		if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
			alert('Password must contain at least one uppercase letter, one lowercase letter, and one number');
			return;
		}

		// Disable button to prevent double submission
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
					alert(result.message || 'Password updated successfully!');
				} catch {
					alert('Password updated successfully!');
				}
				
				// Clear all password fields
				currentPasswordInput.value = '';
				newPasswordInput.value = '';
				confirmPasswordInput.value = '';
			} else if (response.status === 401) {
				alert('Please login to update your password');
			} else if (response.status === 403) {
				alert('Current password is incorrect');
			} else {
				try {
					const error = await response.json();
					alert(`Error: ${error.message || 'Failed to update password'}`);
				} catch {
					alert('Failed to update password. Please try again.');
				}
			}
		} catch (error) {
			console.error('Network error updating password:', error);
			alert('Network error. Please check your connection and try again.');
		} finally {
			// Re-enable button
			changePasswordBtn.disabled = false;
			changePasswordBtn.textContent = originalText;
		}
	}

	private async handleToggle2FA(): Promise<void> {
		const toggle2FABtn = document.getElementById('toggle2FABtn') as HTMLButtonElement;
		const twoFASetup = document.getElementById('twoFASetup');
		const twoFAStatus = document.getElementById('twoFAStatus');

		const isCurrentlyEnabled = twoFAStatus?.textContent === 'Enabled';

		// Disable button during operation
		const originalText = toggle2FABtn.textContent;
		toggle2FABtn.disabled = true;

		if (isCurrentlyEnabled) {
			// Disable 2FA
			const confirmDisable = confirm('Are you sure you want to disable 2FA? This will make your account less secure.');
			if (!confirmDisable) {
				toggle2FABtn.disabled = false;
				return;
			}

			toggle2FABtn.textContent = 'Disabling...';

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
					alert('2FA disabled successfully!');
					this.update2FAStatus(false);
				} else if (response.status === 401) {
					alert('Please login to disable 2FA');
				} else {
					try {
						const error = await response.json();
						alert(`Error: ${error.message || 'Failed to disable 2FA'}`);
					} catch {
						alert('Failed to disable 2FA. Please try again.');
					}
				}
			} catch (error) {
				console.error('Network error disabling 2FA:', error);
				alert('Network error. Please check your connection and try again.');
			}
		} else {
			// Check if setup is already visible (cancel setup)
			if (twoFASetup && !twoFASetup.classList.contains('hidden')) {
				// Cancel setup
				twoFASetup.classList.add('hidden');
				this.update2FAStatus(false);
				toggle2FABtn.disabled = false;
				return;
			}

			// Enable 2FA - show setup
			toggle2FABtn.textContent = 'Setting up...';

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
						alert('A verification code has been sent to your email. Please enter it below.');
						this.show2FASetup();
					} else {
						alert(`Error: ${result.message || 'Failed to start 2FA setup'}`);
					}
				} else if (response.status === 401) {
					alert('Please login to setup 2FA');
				} else {
					try {
						const error = await response.json();
						alert(`Error: ${error.message || 'Failed to setup 2FA'}`);
					} catch {
						alert('Failed to setup 2FA. Please try again.');
					}
				}
			} catch (error) {
				console.error('Network error setting up 2FA:', error);
				alert('Network error. Please check your connection and try again.');
			}
		}

		// Re-enable button
		toggle2FABtn.disabled = false;
		if (toggle2FABtn.textContent !== 'Cancel Setup') {
			toggle2FABtn.textContent = originalText;
		}
	}

	private show2FASetup(): void {
		const twoFASetup = document.getElementById('twoFASetup');
		const toggle2FABtn = document.getElementById('toggle2FABtn') as HTMLButtonElement;
		
		if (twoFASetup) {
			twoFASetup.classList.remove('hidden');
		}

		const qrCodeContainer = document.getElementById('qrCodeContainer');
		if (qrCodeContainer) {
			qrCodeContainer.innerHTML = `
				<div class="text-center">
					<p class="text-gray-700 mb-2">Please check your email for the 6-digit verification code.</p>
					<p class="text-sm text-gray-500">Enter the code below to enable 2FA.</p>
				</div>
			`;
		}

		toggle2FABtn.textContent = 'Cancel Setup';
		toggle2FABtn.className = 'bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition';
	}

	private async handleVerify2FA(): Promise<void> {
		const verificationCodeInput = document.getElementById('verificationCode') as HTMLInputElement;
		const verificationCode = verificationCodeInput?.value.trim();

		if (!verificationCode || verificationCode.length !== 6) {
			alert('Please enter a valid 6-digit verification code');
			return;
		}

		if (!/^\d{6}$/.test(verificationCode)) {
			alert('Verification code must be 6 digits');
			return;
		}

		// Disable button during verification
		const verify2FABtn = document.getElementById('verify2FABtn') as HTMLButtonElement;
		const originalText = verify2FABtn.textContent;
		verify2FABtn.disabled = true;
		verify2FABtn.textContent = 'Verifying...';

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
				alert('2FA enabled successfully!');
				this.update2FAStatus(true);
				
				// Hide setup section
				const twoFASetup = document.getElementById('twoFASetup');
				if (twoFASetup) {
					twoFASetup.classList.add('hidden');
				}
				
				// Clear verification code
				verificationCodeInput.value = '';
			} else if (response.status === 401) {
				alert('Please login to verify 2FA');
			} else if (response.status === 400) {
				alert('Invalid verification code. Please try again.');
			} else {
				try {
					const error = await response.json();
					alert(`Error: ${error.message || 'Invalid verification code'}`);
				} catch {
					alert('Invalid verification code. Please try again.');
				}
			}
		} catch (error) {
			console.error('Network error verifying 2FA:', error);
			alert('Network error. Please check your connection and try again.');
		} finally {
			// Re-enable button
			verify2FABtn.disabled = false;
			verify2FABtn.textContent = originalText;
		}
	}

	async onUnload() : Promise<void> {
		console.log("Profile page unloaded");
	}
};

const PROFILE_PAGE = new ProfilePage();

export { ProfilePage, PROFILE_PAGE };