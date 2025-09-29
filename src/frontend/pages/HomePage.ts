import { Canvas, gameStart, loadPage } from "../main";
import { Lobby } from "./LobbyPage";

export async function HomePage(): Promise<string> {
  
    return `
    <div class="mx-32">
        <!-- Logo and Title -->
        
        <!-- main body-->
         <div class="mx-32 h-[92vh] text-center items-center flex flex-col justify-center gap-6">
            <div class="flex  flex-row w-2xl justify-between gap-6">
            <button onclick=" (async () => {await loadPage(Canvas, 'canvas'); gameStart(false);})();" class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">1v1</button>
            <button onclick=" (async () => {await loadPage(Canvas, 'canvas'); gameStart(true);})();" class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">Single Player</button>
            </div>
            
          </button>
              <button id="multiplayer-btn"  onclick="loadPage(Lobby, 'lobby')" class="hidden bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
              Multiplayer
              </button>

        <button id="logout" class="hidden bg-red-500 text-white px-4 cursor-pointer py-2 rounded">Logout</button>
        </div>


      </div>
    `;
}

export function setupHomePage() {
  document.getElementById("btn-1v1")?.addEventListener("click", () => {
    loadPage(Canvas, "canvas");
    gameStart(false);
  });

  document.getElementById("btn-single")?.addEventListener("click", () => {
    loadPage(Canvas, "canvas");
    gameStart(true);
  });

  document.getElementById("btn-multi")?.addEventListener("click", () => {
    loadPage(Lobby, "lobby");
  });
}