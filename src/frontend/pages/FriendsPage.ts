import { GlobalState, Page, FETCH_ADDRESS} from "../Page"
import { HOME_PAGE } from "./HomePage";

export const FRIENDS_PAGE: Page = {
	title: "Friends",
	data: null,
	
	render: async () => {
		const pendingRequests = FRIENDS_PAGE.data?.pending_2 || [];

		const pendingHtml = pendingRequests.length > 0
			? pendingRequests.map((req: any) => `
				<div class="flex justify-between w-sm items-center bg-white p-4 rounded-md shadow-sm border border-gray-200">
					<span class="font-medium">${req.username || "Unknown User"}</span>
					<div class="flex gap-2">
						<button data-id="${req.user_id}" class="accept-btn px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
							✔
						</button>
						<button data-id="${req.user_id}" class="reject-btn px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
							✖
						</button>
					</div>
				</div>
			`).join("")
			: `<p class="text-gray-500">Hiç bekleyen istek yok</p>`;
		const app = document.getElementById("app");
		if (app){
		
			app.innerHTML = `<div class="min-h-screen bg-gray-100 p-6">
      <h1 class="text-3xl font-bold mb-6">Arkadaşlık Sayfası</h1>

      <div class="mb-10">
        <h2 class="text-xl font-semibold mb-2">Arkadaşlık İsteği Gönder</h2>
		<input
            type="text"
            placeholder="Username girin..."
			id="inp"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"/>
			<button id="sendBtn" class="px-4 cursor-pointer py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
				Send
			</button>
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-4">Gelen Arkadaşlık İstekleri</h2>
        <div class="flex flex-col gap-4">
            ${pendingHtml}
        </div>
      </div>

	  <div>
        <h2 class="text-xl font-semibold mb-4 pt-5">Arkadaşların</h2>
        <div class="flex flex-col gap-4">
            <div
              class="flex justify-between w-sm items-center bg-white p-4 rounded-md shadow-sm border border-gray-200"
            >
              <span class="font-medium">erkoc</span>
            </div>
        </div>
      </div>
    </div>`
		}
	const sendButton = document.getElementById("sendBtn");
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
	},
	onPreLoad: async () => {
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
				FRIENDS_PAGE.data = { pending_2: [] };
			}
		} catch (err) {
			console.error("Fetch hatası:", err);
			FRIENDS_PAGE.data = { pending_2: [] };
		}
	},
	onLoad: async () => {console.log("Friends page loaded")},
	onUnload: async () => {console.log("Friends page unloaded")}
}