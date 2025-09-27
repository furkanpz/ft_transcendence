import { GameRoom } from "../../backend/server/types/game.types";
import { loadPage } from "../main";
import { HomePage } from "./HomePage";

export async function Lobby(): Promise<string> {
    try {
        const response = await fetch("http://localhost:3000/api/game/rooms", {
            credentials: "include",
            method: "GET"
        });

        if (!response.ok) {
            alert("Error");
            loadPage(HomePage, "home");
            return ""; // Burada hemen çık
        }

        const rooms = await response.json();

        return `
          ${rooms.rooms.map((element: GameRoom) => `
            <div class="flex justify-between items-start ...">
              <div class="flex flex-col h-full w-1/4 text-center">
                <div class="w-full ">
                  <span class="text-md text-slate-500">ID</span>
                </div>
                <div class="w-full my-auto">
                  <span class="truncate text-lg font-semibold">${element.id}</span>
                </div>
              </div>
              <div class="flex flex-col h-full w-1/4 text-center">
                <div class="w-full ">
                  <span class="text-md text-slate-500">Player Count</span>
                </div>
                <div class="w-full my-auto">
                  <span class="truncate text-lg">${element.players.length}/2</span>
                </div>
              </div>
              <div class="flex flex-col h-full w-1/4 text-center">
                <div class="w-full ">
                  <span class="text-md text-slate-500">Status</span>
                </div>
                <div class="text-xs truncate my-auto">
                  <span class="text-lg overflow-hidden whitespace-nowrap">${element.state.state}</span>
                </div>
              </div>
              <div class="flex flex-col h-full w-1/4 text-center">
                <div class="w-full my-auto">
                  <button onclick="alert('naber yavrum')" class="text-lg p-4 bg-blue-500 cursor-pointer rounded-2xl text-white">Join</button>
                </div>
              </div>
            </div>
          `).join("")}
        `;
    } catch (err) {
        console.error(err);
        alert("Sunucuya bağlanırken hata oluştu");
        loadPage(HomePage, "home");
        return "";
    }
}