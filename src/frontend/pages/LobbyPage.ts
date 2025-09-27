export function connectSocket()
{
    const sock = new WebSocket("ws://localhost:3000/ws/game");
    
    sock.onopen = () => {
        console.log("WebSocket connected");
        sock.send(JSON.stringify({type: "createRoom", data: {maxPlayer: 2, isPrivate: false, password: null, teamCount: 2}}));
    };
    
    sock.onmessage = (event) => {
        console.log("Message received:", event.data);
    };
    
    sock.onerror = (error) => {
        console.error("WebSocket error:", error);
    };
    
    sock.onclose = () => {
        console.log("WebSocket connection closed");
    };
}

export function Lobby(): string {
    return `
    <div class="mx-32 my-8 space-y-6">

        <!-- Create Room Button -->
        <div class="flex justify-center">
            <button 
                class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition"
                onclick="connectSocket();">
                Create Room
            </button>
        </div>

        <!-- Room Card -->
        <div class="flex items-center justify-between border-2 rounded-xl p-6 bg-white shadow-md">

            <!-- Room ID -->
            <div class="flex flex-col w-1/4 text-center">
                <span class="text-sm text-slate-500">ID</span>
                <span class="truncate text-lg font-semibold">RandomID</span>
            </div>

            <!-- Player Count -->
            <div class="flex flex-col w-1/4 text-center">
                <span class="text-sm text-slate-500">Player Count</span>
                <span class="text-lg">1/2</span>
            </div>

            <!-- Status -->
            <div class="flex flex-col w-1/4 text-center">
                <span class="text-sm text-slate-500">Status</span>
                <span class="text-lg font-medium text-green-600">Online</span>
            </div>

            <!-- Join Button -->
            <div class="w-1/4 flex justify-center">
                <button 
                    onclick="alert('naber yavrum')" 
                    class="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-semibold shadow-md transition">
                    Join
                </button>
            </div>
        </div>
    </div>
    `;
}
