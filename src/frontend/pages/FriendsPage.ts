import { GlobalState, Page, FETCH_ADDRESS} from "../main"
import { BLOCKED_USERS_PAGE } from "./BlockedUsersPage"
import { HOME_PAGE } from "./HomePage";

declare const Notification: typeof import("../components/Notification").Notification;

class FriendsPage implements Page {
	title: string = "Friends"
	data: any = null

	async render() : Promise<void> {
		let pendingRequests = this.data?.user_friends_pending || [];
		if (pendingRequests.length === 0) {
			try {
				const response = await fetch(`${FETCH_ADDRESS}/user/friends`, {
					credentials: "include",
					method: "GET",
				});
				if (response.ok) {
					const data = await response.json();
					this.data = data;
				} else {
					console.warn("Friend data could not be retrieved");
					this.data = { user_friends_pending: [] };
				}
			} catch (err) {
				console.error("Fetch error:", err);
				this.data = { user_friends_pending: [] };
			}
			pendingRequests = this.data?.user_friends_pending || [];
		}
		
		let myFriends = this.data?.user_friends || [];
		
		const friendsHTML = myFriends.length > 0
			? myFriends.map((req: any) => `
				<div class="glass-card" style="margin-bottom: 1rem; padding: 1.25rem;">
					<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
						<div style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 200px;">
							<div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple)); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.25rem; flex-shrink: 0;">
								${(req.username || "?").charAt(0).toUpperCase()}
							</div>
							<span style="font-weight: 600; font-size: 1rem; color: white;">${req.username || "Your Friend"}</span>
						</div>
						
						<div style="display: flex; gap: 0.75rem; flex-wrap: wrap;">
							<button
								data-id="${req.friend_id}"
								id="removeFriendBtn"
								class="btn-danger"
								style="padding: 0.625rem 1.25rem; font-size: 0.875rem;"
							>
								Remove Friend
							</button>
							<button
								data-id="${req.friend_id}"
								id="blockUserBtn"
								class="btn-danger"
								style="padding: 0.625rem 1.25rem; font-size: 0.875rem;"
							>
								Block
							</button>
						</div>
					</div>
				</div>
			`).join("")
			: `<div class="glass-card" style="text-align: center; padding: 3rem;">
				<div style="font-size: 4rem; margin-bottom: 1rem;">😔</div>
				<p style="color: rgba(255, 255, 255, 0.7); font-size: 1.125rem;">No friends yet</p>
			</div>`;

		const pendingHtml = pendingRequests.length > 0
			? pendingRequests.map((req: any) => `
				<div class="glass-card" style="margin-bottom: 1rem; padding: 1.25rem;">
					<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
						<div style="display: flex; align-items: center; gap: 1rem; flex: 1; min-width: 200px;">
							<div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, var(--neon-yellow), #ff6b35); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.25rem; flex-shrink: 0;">
								${(req.username || "?").charAt(0).toUpperCase()}
							</div>
							<span style="font-weight: 600; font-size: 1rem; color: white;">${req.username || "Unknown User"}</span>
						</div>
						<div style="display: flex; gap: 0.75rem;">
							<button 
								data-username="${req.username}" 
								data-id="${req.friend_id}" 
								id="acceptBtn" 
								class="btn-success"
								style="padding: 0.625rem 1rem; min-width: 48px; font-size: 1.25rem;"
							>
								✓
							</button>
							<button 
								data-id="${req.friend_id}" 
								data-username="${req.username}" 
								id="rejectBtn" 
								class="btn-danger"
								style="padding: 0.625rem 1rem; min-width: 48px; font-size: 1.25rem;"
							>
								✕
							</button>
						</div>
					</div>
				</div>
			`).join("")
			: `<div class="glass-card" style="text-align: center; padding: 3rem;">
				<div style="font-size: 4rem; margin-bottom: 1rem;">📭</div>
				<p style="color: rgba(255, 255, 255, 0.7); font-size: 1.125rem;">No pending requests</p>
			</div>`;
			
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
			<style>
				.friends-container {
					max-width: 1000px;
					margin: 0 auto;
					padding: 2rem 1rem;
					width: 100%;
				}
				
				.friends-header {
					display: flex;
					justify-content: space-between;
					align-items: flex-start;
					margin-bottom: 2rem;
					flex-wrap: wrap;
					gap: 1rem;
				}
				
				.friends-header-text h1 {
					font-size: 2.5rem;
					font-weight: bold;
					margin-bottom: 0.5rem;
					color: white;
				}
				
				.friends-header-text p {
					color: rgba(255, 255, 255, 0.7);
					font-size: 1rem;
				}
				
				.friends-header-actions {
					display: flex;
					align-items: center;
					gap: 1rem;
				}
				
				.send-request-section {
					margin-bottom: 2rem;
				}
				
				.send-request-form {
					display: flex;
					gap: 0.75rem;
					margin-top: 1rem;
				}
				
				.friends-section {
					margin-bottom: 2rem;
				}
				
				.section-title {
					font-size: 1.5rem;
					font-weight: 600;
					margin-bottom: 1rem;
					color: white;
				}
				
				@media (max-width: 768px) {
					.friends-container {
						padding: 1rem 0.5rem;
					}
					
					.friends-header {
						flex-direction: column;
					}
					
					.send-request-form {
						flex-direction: column;
					}
					
					.send-request-form input,
					.send-request-form button {
						width: 100%;
					}
				}
			</style>
			
			<div class="friends-container animate-fade-in">
				<div class="friends-header">
					<div class="friends-header-text">
						<h1>👥 <span data-i18n="friends">Friends</span></h1>
						<p data-i18n="friends_manage_help">Manage your friends and requests</p>
					</div>
					<div class="friends-header-actions">
						<button id="backToHomeBtn" class="btn-primary" data-i18n="back_to_home">
							← Back to Home
						</button>
					</div>
				</div>

				<div class="glass-card send-request-section">
					<h2 style="font-size: 1.25rem; font-weight: 600; margin-bottom: 1rem; color: white;" data-i18n="send_friend_request">✉️ Send Friend Request</h2>
					<div class="send-request-form">
						<input
							type="text"
							placeholder="Enter username..." data-i18n-placeholder="enter_username"
							id="inp"
							style="flex: 1; min-width: 200px;"
						/>
						<button 
							id="sendBtn" 
							class="btn-success"
							style="padding: 0.875rem 1.5rem; white-space: nowrap;"
						>
							<span data-i18n="send">Send</span>
						</button>
					</div>
				</div>

				<div class="friends-section">
					<h2 class="section-title"><span data-i18n="pending_requests">Pending Requests</span></h2>
					${pendingHtml}
				</div>

				<div class="friends-section">
					<h2 class="section-title"><span data-i18n="your_friends">Your Friends</span></h2>
					${friendsHTML}
				</div>

				<div style="text-align: center; margin-top: 2rem;">
					<button 
						id="blockedUsersBtn"
						class="btn-danger"
						data-i18n="see_blocked_users"
					>
						🚫 See Blocked Users
					</button>
				</div>
			</div>`
		}
		
		this.setupEventListeners();
	}
	
	setupEventListeners(): void {
		const sendButton = document.getElementById("sendBtn");
		const rejectButtons = document.querySelectorAll("#rejectBtn");
		const acceptButtons = document.querySelectorAll("#acceptBtn");
		const blockFriendButtons = document.querySelectorAll("#blockUserBtn");
		const removeFriendButtons = document.querySelectorAll("#removeFriendBtn");
		const backToHomeBtn = document.getElementById("backToHomeBtn");
		const blockedUsersBtn = document.getElementById("blockedUsersBtn");

		if (backToHomeBtn) {
			backToHomeBtn.addEventListener("click", () => {
				GlobalState.setPage(HOME_PAGE);
			});
		}

		if (blockedUsersBtn) {
			blockedUsersBtn.addEventListener("click", () => {
				GlobalState.setPage(BLOCKED_USERS_PAGE);
			});
		}

		blockFriendButtons.forEach(btn => {
			btn.addEventListener("click", async (e) => {
				const button = e.target as HTMLButtonElement;
				const friendId = button.dataset.id;
				if (!friendId) return;
				
				try {
					const response = await fetch(`${FETCH_ADDRESS}/user/friends/block`, {
						credentials: "include",
						headers: {"Content-Type": "application/json"},
						method: "POST",
						body: JSON.stringify({
							blocked_id: parseInt(friendId, 10),
						})
					});
					
					if (response.ok) {
						Notification.success("User blocked successfully");
						window.location.reload();
					} else {
						Notification.error("Failed to block user");
					}
				} catch (error) {
					console.error("Error blocking user:", error);
					Notification.error("Error blocking user");
				}
			});
		});

		removeFriendButtons.forEach(btn => {
			btn.addEventListener("click", async (e) => {
				const button = e.target as HTMLButtonElement;
				const friendId = button.dataset.id;
				if (!friendId) return;
				
				if (!confirm("Are you sure you want to remove this friend?")) return;
				
				try {
					const response = await fetch(`${FETCH_ADDRESS}/user/friends/request`, {
						credentials: "include",
						headers: {"Content-Type": "application/json"},
						method: "POST",
						body: JSON.stringify({
							friend_id: parseInt(friendId, 10),
							request_type: "Remove"
						})
					});
					
					if (response.ok) {
						Notification.success("Friend removed successfully");
						window.location.reload();
					} else {
						Notification.error("Failed to remove friend");
					}
				} catch (error) {
					console.error("Error removing friend:", error);
					Notification.error("Error removing friend");
				}
			});
		});

		acceptButtons.forEach(btn => {
			btn.addEventListener("click", async (e) => {
				const button = e.target as HTMLButtonElement;
				const username = button.dataset.username;
				if (!username) return;
				
				try {
					const response = await fetch(`${FETCH_ADDRESS}/user/friends/request`, {
						credentials: "include",
						headers: {"Content-Type": "application/json"},
						method: "POST",
						body: JSON.stringify({
							username: username,
							request_type: "Accepted"
						})
					});
					
					if (response.ok) {
						Notification.success("Friend request accepted");
						window.location.reload();
					} else {
						Notification.error("Failed to accept friend request");
					}
				} catch (error) {
					console.error("Error accepting request:", error);
					Notification.error("Error accepting friend request");
				}
			});
		});

		rejectButtons.forEach(btn => {
			btn.addEventListener("click", async (e) => {
				const button = e.target as HTMLButtonElement;
				const username = button.dataset.username;
				if (!username) return;
				
				try {
					const response = await fetch(`${FETCH_ADDRESS}/user/friends/request`, {
						credentials: "include",
						headers: {"Content-Type": "application/json"},
						method: "POST",
						body: JSON.stringify({
							username: username,
							request_type: "Remove"
						})
					});
					
					if (response.ok) {
						Notification.success("Friend request rejected");
						window.location.reload();
					} else {
						Notification.error("Failed to reject friend request");
					}
				} catch (error) {
					console.error("Error rejecting request:", error);
					Notification.error("Error rejecting friend request");
				}
			});
		});

		if (sendButton) {
			sendButton.addEventListener("click", async () => {
				const nameInput = document.getElementById("inp") as HTMLInputElement;
				const name = nameInput?.value.trim();
				
				if (!name) {
					Notification.warning("Please enter a username");
					return;
				}
				
				try {
					const response = await fetch(`${FETCH_ADDRESS}/user/friends/request`, {
						credentials: "include",
						headers: {
							"Content-Type": "application/json"
						},
						method: "POST",
						body: JSON.stringify({
							username: name,
							request_type: "Pending"
						})
					});
					
					const data = await response.json();
					
					if (!response.ok) {
						Notification.error(data.message || "Failed to send friend request");
					} else {
						nameInput.value = "";
						Notification.success(data.message || "Friend request sent successfully");
						window.location.reload();
					}
				} catch (error) {
					console.error("Error sending friend request:", error);
					Notification.error("Error sending friend request");
				}
			});
		}
	}

	async onPreLoad(): Promise<void> {
		console.log("preload");
		const response = await fetch(`${FETCH_ADDRESS}/user/profile`, {credentials: "include", method: "GET"});
		if (!response.ok) {
			GlobalState.setPage(HOME_PAGE);
			return;
		}
		try {
			const response = await fetch(`${FETCH_ADDRESS}/user/friends`, {
				credentials: "include",
				method: "GET",
			});
			if (response.ok) {
				const data = await response.json();
				this.data = data;
			} else {
				console.warn("Friend data could not be retrieved");
				this.data = { user_friends_pending: [] };
			}
		} catch (err) {
			console.error("Fetch error:", err);
			this.data = { user_friends_pending: [] };
		}
	}

	async onLoad() : Promise<void> {
		console.log("onload")
	}
	
	async onUnload() : Promise<void> {
		console.log("Friends page unloaded")
	}
}

const FRIENDS_PAGE = new FriendsPage();

export { FRIENDS_PAGE, FriendsPage };
