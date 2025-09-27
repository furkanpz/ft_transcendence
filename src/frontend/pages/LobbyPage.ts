export async function Lobby(): Promise<string> {
    const response = await fetch("http://localhost:3000/api/game/rooms", {credentials: "include", method: "GET"});
    if (!response.ok) return "Some kind of connection error";

    const data = await response.json();

    if (!data.success || data.rooms.length === 0) {
        return `<div class="flex justify-center">
            <button onclick="createRoom()" 
                class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition">
                Create Room
            </button>
        </div>`;
    }

    const roomsHtml = data.rooms.map((room: any) => {
        const playerCount = room.players.length + '/' + room.teamCount;
        const status = room.state.state === "Waiting" ? "Waiting" : "In Progress";
        const isPrivate = room.isPrivate ? "Private" : "Public";

        return `
        <div class="flex items-center justify-between border-2 rounded-xl p-6 bg-white shadow-md mb-4">
            <div class="flex flex-col w-1/4 text-center">
                <span class="text-sm text-slate-500">ID</span>
                <span class="truncate text-lg font-semibold">${room.id}</span>
            </div>
            <div class="flex flex-col w-1/4 text-center">
                <span class="text-sm text-slate-500">Player Count</span>
                <span class="text-lg">${playerCount}</span>
            </div>
            <div class="flex flex-col w-1/4 text-center">
                <span class="text-sm text-slate-500">Status</span>
                <span class="text-lg font-medium text-green-600">${status}</span>
            </div>
            <div class="flex flex-col w-1/4 text-center">
                <span class="text-sm text-slate-500">Type</span>
                <span class="text-lg">${isPrivate}</span>
            </div>
            <div class="w-1/4 flex justify-center">
                <button onclick="joinRoom(${room.id})" 
                    class="px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-xl text-white font-semibold shadow-md transition">
                    Join
                </button>
            </div>
        </div>`;
    }).join("");

    return `
    <div class="mx-32 my-8 space-y-6">
        <div class="flex justify-center">
            <button onclick="createRoom()" 
                class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition">
                Create Room
            </button>
        </div>
        ${roomsHtml}
    </div>
    `;
}

// Script olarak sayfaya ekle
window.createRoom = () => {
    const ws = new WebSocket('ws://localhost:3000/ws/game');
    ws.onopen = () => {
        ws.send(JSON.stringify({type: 'createRoom', data: {maxPlayer: 2, isPrivate: false, password: null, teamCount: 2}}));
    };
};

window.joinRoom = (roomId: number) => {
    const ws = new WebSocket('ws://localhost:3000/ws/game');
    ws.onopen = () => {
        ws.send(JSON.stringify({type: 'joinRoom', data: {roomId, password: null}}));
    };
};
