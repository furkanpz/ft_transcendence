import { GlobalState, Page, FETCH_ADDRESS} from "../main"
import { HOME_PAGE } from "../pages"
import { BLOCKED_USERS_PAGE } from "./BlockedUsersPage"

class FriendsPage implements Page {
	title: string = "Friends"
	data: any = null

	async render() : Promise<void> {
		let pendingRequests = this.data?.user_friends_pending || [];
		if (pendingRequests.length === 0)
		{
		
			try {
				const response = await fetch(`${FETCH_ADDRESS}/user/friends`, {
					credentials: "include",
					method: "GET",
				});
				if (response.ok) {
					const data = await response.json();
					this.data = data;
				} else {
					console.warn("Arkadaş verileri alınamadı");
					this.data = { user_friends_pending: [] };
				}
			} catch (err) {
				console.error("Fetch hatası:", err);
				this.data = { user_friends_pending: [] };
			}
			pendingRequests = this.data?.user_friends_pending || [];
		
		}
		let myFriends = this.data?.user_friends || [];
		const friendsHTML = myFriends.length > 0
		? myFriends.map((req: any) => `
			<div class="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-all duration-300 border border-gray-100">
				<div class="flex justify-between items-center">
					<div class="flex items-center gap-3">
						<div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
							${(req.username || "?").charAt(0).toUpperCase()}
						</div>
						<span class="font-semibold text-lg text-gray-800">${req.username || "Your Friend"}</span>
					</div>
					
					<div class="flex gap-2">
						<button
							data-id="${req.friend_id}"
							id="removeFriendBtn"
							class="px-4 py-2 text-sm font-medium text-red-600 border-2 border-red-600 rounded-lg hover:bg-red-50 active:bg-red-100 transition-all duration-200"
						>
							Arkadaşlıktan Çıkar
						</button>
						<button
							data-id="${req.friend_id}"
							id="blockUserBtn"
							class="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 active:bg-red-800 transition-all duration-200 shadow-md"
						>
							Engelle
						</button>
					</div>
				</div>
			</div>
		`).join("")
		: `<div class="text-center py-12 bg-white rounded-lg shadow-md">
				<div class="text-6xl mb-4">😔</div>
				<p class="text-gray-500 text-lg">Henüz arkadaşın yok</p>
			</div>`;

		const pendingHtml = pendingRequests.length > 0
			? pendingRequests.map((req: any) => `
				<div class="bg-white rounded-lg shadow-md p-5 hover:shadow-lg transition-all duration-300 border border-gray-100">
					<div class="flex justify-between items-center">
						<div class="flex items-center gap-3">
							<div class="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
								${(req.username || "?").charAt(0).toUpperCase()}
							</div>
							<span class="font-semibold text-lg text-gray-800">${req.username || "Unknown User"}</span>
						</div>
						<div class="flex gap-2">
							<button 
								data-username="${req.username}" 
								data-id="${req.friend_id}" 
								id="acceptBtn" 
								class="accept-btn w-10 h-10 bg-green-500 text-white rounded-lg hover:bg-green-600 active:bg-green-700 transition-all duration-200 flex items-center justify-center font-bold shadow-md"
							>
								✓
							</button>
							<button 
								data-id="${req.friend_id}" 
								data-username="${req.username}" 
								id="rejectBtn" 
								class="reject-btn w-10 h-10 bg-red-500 text-white rounded-lg hover:bg-red-600 active:bg-red-700 transition-all duration-200 flex items-center justify-center font-bold shadow-md"
							>
								✕
							</button>
						</div>
					</div>
				</div>
			`).join("")
			: `<div class="text-center py-12 bg-white rounded-lg shadow-md">
					<div class="text-6xl mb-4">📭</div>
					<p class="text-gray-500 text-lg">Bekleyen istek yok</p>
				</div>`;
		const app = document.getElementById("app");
		if (app){

			app.innerHTML = `
			<div class="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
				<div class="max-w-5xl mx-auto">
					<!-- Header Section -->
					<div class="flex justify-between items-center mb-8">
						<div>
							<h1 class="text-4xl font-bold text-gray-800 mb-2">🥼 <span data-i18n="friends">Friends</span></h1>
							<p class="text-gray-600" data-i18n="friends_manage_help">Manage your friends and requests</p>
						</div>
						<div class="flex items-center">
							<button id="lang-en" class="mr-2">EN</button>
							<button id="lang-tr">TR</button>
							<button 
							id="backToHomeBtn"
							class="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-lg shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
							data-i18n="back_to_home"
						>
							← Back to Home
						</button>
						</div>
					</div>

					<!-- Send Friend Request Section -->
					<div class="bg-white rounded-xl shadow-lg p-6 mb-8 border border-gray-100">
						<h2 class="text-2xl font-bold text-gray-800 mb-4" data-i18n="send_friend_request">✉️ Send Friend Request</h2>
						<div class="flex gap-3">
							<input
								type="text"
								placeholder="Enter username..." data-i18n-placeholder="enter_username"
								id="inp"
								class="flex-1 px-5 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
							/>
							<button 
								id="sendBtn" 
								class="px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 shadow-md transform hover:scale-105 active:scale-95"
							>
								<span data-i18n="send">Send</span>
							</button>
						</div>
					</div>

					<!-- Pending Requests Section -->
					<div class="mb-8">
						<h2 class="text-2xl font-bold text-gray-800 mb-4">⏳ <span data-i18n="pending_requests">Pending Requests</span></h2>
						<div class="flex flex-col gap-4">
							${pendingHtml}
						</div>
					</div>

					<!-- Friends List Section -->
					<div class="mb-8">
						<h2 class="text-2xl font-bold text-gray-800 mb-4">💚 <span data-i18n="your_friends">Your Friends</span></h2>
						<div class="flex flex-col gap-4">
							${friendsHTML}
						</div>
					</div>

					<!-- Blocked Users Button -->
					<div class="text-center">
						<button 
							id="blockedUsersBtn"
							class="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg shadow-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 transform hover:scale-105 active:scale-95"
						>
							🚫 <span data-i18n="see_blocked_users">See Blocked Users</span>
						</button>
					</div>
				</div>
			</div>`
		}
	const sendButton = document.getElementById("sendBtn");
	const rejectButton = document.getElementById("rejectBtn");
	const acceptButton = document.getElementById("acceptBtn");
	const blockFriendBtn = document.getElementById("blockUserBtn");
	const backToHomeBtn = document.getElementById("backToHomeBtn");
	const blockedUsersBtn = document.getElementById("blockedUsersBtn");

	// Back to Home button
	if (backToHomeBtn) {
		backToHomeBtn.addEventListener("click", () => {
			GlobalState.setPage(HOME_PAGE);
		});
	}

	// Blocked Users button
	if (blockedUsersBtn) {
		blockedUsersBtn.addEventListener("click", () => {
			GlobalState.setPage(BLOCKED_USERS_PAGE);
		});
	}

	if(blockFriendBtn)
	{
		blockFriendBtn.addEventListener("click", async () => {
			await fetch(`${FETCH_ADDRESS}/user/friends/block`, {credentials: "include", headers: {"Content-Type": "application/json"}, method: "POST", body: JSON.stringify({
				blocked_id: parseInt(blockFriendBtn.dataset.id!, 10),

			})})
		})
	}
	if (acceptButton)
	{
		acceptButton.addEventListener("click",  async () => {
			await fetch(`${FETCH_ADDRESS}/user/friends/request`, {credentials: "include", headers: {"Content-Type": "application/json"}, method: "POST", body: JSON.stringify({
				username: acceptButton.dataset.username,
				request_type: "Accepted"

			})})
			window.location.reload();
		})
	}

	if (rejectButton)
	{
		rejectButton.addEventListener("click",  async () => {
			await fetch(`${FETCH_ADDRESS}/user/friends/request`, {credentials: "include", headers: {"Content-Type": "application/json"}, method: "POST", body: JSON.stringify({
				username: rejectButton.dataset.username,
				request_type: "Remove"

			})})
			window.location.reload();
		})
	}
	if (sendButton)
	{
		
		sendButton.addEventListener("click", async () => {
			const name = (document.getElementById("inp") as HTMLInputElement).value;
			console.log(name);
			const response = await fetch(`${FETCH_ADDRESS}/user/friends/request`, {credentials: "include", headers: {
		"Content-Type": "application/json"
	}, method: "POST", body: JSON.stringify({
				username: name,
				request_type: "Pending"
			})});
			const data = await response.json();
			console.log(data);
			if (!response.ok)
			{
				alert("Fail");
			}
			else
			{
				(document.getElementById("inp") as HTMLInputElement).value = "";
				alert("Success");
			}

		})
	}
	}

	async onPreLoad(): Promise<void> {
		console.log("preload");
		const response = await fetch(`${FETCH_ADDRESS}/user/profile`, {credentials: "include", method: "GET"});
		if (!response.ok)
		{
			GlobalState.setPage(HOME_PAGE);
		}
		try {
			const response = await fetch(`${FETCH_ADDRESS}/user/friends`, {
				credentials: "include",
				method: "GET",
			});
			if (response.ok) {
				const data = await response.json();
				FRIENDS_PAGE.data = data;
			} else {
				console.warn("Arkadaş verileri alınamadı");
				FRIENDS_PAGE.data = { user_friends_pending: [] };
			}
		} catch (err) {
			console.error("Fetch hatası:", err);
			FRIENDS_PAGE.data = { user_friends_pending: [] };
		}
	}

	async onLoad() : Promise<void> {console.log("onload")}
	async onUnload() : Promise<void> {console.log("Friends page unloaded")}
}

const FRIENDS_PAGE = new FriendsPage();

export { FRIENDS_PAGE, FriendsPage };