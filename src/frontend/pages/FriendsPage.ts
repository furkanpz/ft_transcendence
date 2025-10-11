import { GlobalState, Page, FETCH_ADDRESS} from "../Page"
import { HOME_PAGE } from "../pages"

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
		? myFriends.map((req: any) => `<div class="flex flex-col gap-4">
            <div
  class="flex justify-between w-full items-center bg-white p-4 rounded-md shadow-sm border border-gray-200"
>
  <span class="font-medium">${req.username || "Your Friend"}</span>
  
  <div class="flex gap-2">
    <button
		data-id="${req.friend_id}"
		id="removeFriendBtn"
      class="text-sm text-red-600 border border-red-600 px-3 py-1 rounded hover:bg-red-50 transition"
    >
      Arkadaşlıktan Çıkar
    </button>
    <button
	data-id="${req.friend_id}"
		id="blockUserBtn"
      class="text-sm text-white bg-red-600 px-3 py-1 rounded hover:bg-red-700 transition"
    >
      Kullanıcıyı Engelle
    </button>
  </div>
</div>

        </div>`).join("")
		: `<p class="text-gray-500">You got no friends</p>`;

		const pendingHtml = pendingRequests.length > 0
			? pendingRequests.map((req: any) => `
				<div class="flex justify-between w-sm items-center bg-white p-4 rounded-md shadow-sm border border-gray-200">
					<span class="font-medium">${req.username || "Unknown User"}</span>
					<div class="flex gap-2">
						<button data-username="${req.username}" data-id="${req.friend_id}" id="acceptBtn" class="accept-btn px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
							✔
						</button>
						<button data-id="${req.friend_id}" data-username="${req.username}" id="rejectBtn" onClick="" class="reject-btn px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
							✖
						</button>
					</div>
				</div>
			`).join("")
			: `<p class="text-gray-500">No Pending Requests</p>`;
		const app = document.getElementById("app");
		if (app){
		
			app.innerHTML = `<div class="min-h-screen bg-gray-100 p-6">
      <h1 class="text-3xl font-bold mb-6">Friendship Page</h1>
			<button class="bg-blue-500 p-2 m-5 text-white" onClick="GlobalState.setPage(HOME_PAGE)" >Go Back To Home</button>
      <div class="mb-10">
        <h2 class="text-xl font-semibold mb-2">Send Friendship Request</h2>
		<input
            type="text"
            placeholder="Username"
			id="inp"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"/>
			<button id="sendBtn" class="px-4 cursor-pointer py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
				Send
			</button>
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-4">Requests</h2>
        <div class="flex flex-col gap-4">
            ${pendingHtml}
        </div>
      </div>

	  <div>
        <h2 class="text-xl font-semibold mb-4 pt-5">Your Friends</h2>
        ${friendsHTML}
      </div>
	  <button onClick="GlobalState.setPage(BLOCKED_USERS_PAGE)" class="bg-blue-500 cursor-pointer p-2 text-white">See Blocked Users</button>
    </div>`
		}
	const sendButton = document.getElementById("sendBtn");
	const rejectButton = document.getElementById("rejectBtn");
	const acceptButton = document.getElementById("acceptBtn");
	const blockFriendBtn = document.getElementById("blockUserBtn");
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