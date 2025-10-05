import { FETCH_ADDRESS, GlobalState, Page } from "../Page";
import { HOME_PAGE } from "./HomePage";

export const BLOCKED_USERS_PAGE: Page =
{
    title: "Blocked Users",
    data: null,

    render: async () => {
        let blockedUsers = BLOCKED_USERS_PAGE.data?.blockedUsers || [];
        const blockedUsersHTML =
			blockedUsers.length > 0
				? blockedUsers
						.map(
							(req: any) => `
				<div class="flex justify-between items-center bg-white p-4 rounded-lg shadow border border-gray-200 mb-3">
					<span class="font-medium text-gray-800">${req.username}</span>
					<button 
						class="unblock-btn px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition"
                        data-id="${req.user_id}"
                        id="unblockBtn"
						data-username="${req.username}">
						Unblock
					</button>
				</div>
			`
						)
						.join("")
				: `<p class="text-gray-500">Hiç blokladığın kullanıcı yok.</p>`;
        const app = document.getElementById("app");
        if (app)
        {
            app.innerHTML = `
			<div class="min-h-screen bg-gray-100 p-6">
				<h1 class="text-3xl font-bold mb-6">Bloklanan Kullanıcılar</h1>
				<div id="blockedList">${blockedUsersHTML}</div>
			</div>`
        }
        const unblockButton = document.getElementById("unblockBtn");
        if (unblockButton)
        {
            unblockButton.addEventListener("click", async () => {
                await fetch(`${FETCH_ADDRESS}/user/friends/block/${unblockButton.dataset.id}`, {credentials: "include", method: "DELETE", })
            });
        }
    },
    onPreLoad: async () => {
        console.log("Blocked user preload");
        const response = await fetch(`${FETCH_ADDRESS}/user/friends/block`, {credentials: "include"});
        if (!response.ok)
        {
            alert("Something went wrong");
            GlobalState.setPage(HOME_PAGE);
        }
        const data = await response.json();
        BLOCKED_USERS_PAGE.data = data;
	},
	onLoad: async () => {console.log("onload")},
	onUnload: async () => {console.log("Friends page unloaded")}
}