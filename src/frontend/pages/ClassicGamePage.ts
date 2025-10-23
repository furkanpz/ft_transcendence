import { ClassicGame, GameState } from "./ClassicGame";
import { GlobalState, Page } from "../main";
import { HOME_PAGE } from "./HomePage";
import { CLASSIC_GAME_PAGE_RESULT } from "./ClassicGameResult";

class ClassicGamePage implements Page {
    title: string = "1v1 Game";
    roomId: string;
    game: ClassicGame | undefined = undefined;

    constructor(roomId: string) {
        this.roomId = roomId;
    }

    async render() : Promise<void> {
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
            <!-- Google Font importu neon/retro his için -->
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

                /* EKLENDİ: Neon parlama efektleri için özel CSS */
                .neon-text-cyan {
                    text-shadow: 0 0 5px #00BFFF, 0 0 10px #00BFFF, 0 0 20px #00BFFF;
                }
                .neon-text-green {
                    text-shadow: 0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 20px #39FF14;
                }
                .neon-text-magenta {
                    text-shadow: 0 0 5px #FF00FF, 0 0 10px #FF00FF, 0 0 20px #FF00FF;
                }
                .neon-shadow-magenta {
                    /* DEĞİŞTİ: Her yönden eşit parlama için box-shadow */
                    box-shadow: 0 0 10px #FF00FF, 0 0 20px #FF00FF, 0 0 30px #FF00FF;
                }
                .neon-border-cyan {
                    border: 2px solid #00BFFF;
                    /* DEĞİŞTİ: Butonlar için daha iyi parlama */
                    box-shadow: 0 0 5px #00BFFF, 0 0 10px #00BFFF;
                }
            </style>

            <!-- Ana Konteyner: Koyu arka plan, ortalanmış içerik -->
            <div class="w-full min-h-screen bg-[#000010] text-white p-4 md:p-8 flex flex-col items-center font-['Press_Start_2P']">
                
                <!-- Dil Butonları (Sağ üst köşe) -->
                <div class="w-full flex justify-end mb-4">
                    <!-- DEĞİŞTİ: Tailwind gölgesi yerine neon-border-cyan sınıfı eklendi -->
                    <button id="lang-en" class="mr-2 bg-transparent text-cyan-400 py-1 px-3 rounded hover:bg-cyan-400 hover:text-black transition-all duration-300 neon-border-cyan text-xs">EN</button>
                    <button id="lang-tr" class="bg-transparent text-cyan-400 py-1 px-3 rounded hover:bg-cyan-400 hover:text-black transition-all duration-300 neon-border-cyan text-xs">TR</button>
                </div>

                <!-- Başlık ve Oda ID'si -->
                <!-- EKLENDİ: Parlama sınıfları eklendi -->
                <h1 data-i18n="one_v_one" class="text-3xl md:text-5xl font-bold text-cyan-400 mb-2 neon-text-cyan">1v1 Game</h1>
                <strong id="roomIdDisplay" class="text-sm md:text-lg text-pink-500 mb-2 neon-text-magenta">Room ID: ${this.roomId}</strong>
                <p data-i18n="please_wait" class="text-gray-400 text-xs md:text-sm mb-6">Welcome to the 1v1 Game!</p>

                <!-- EKLENDİ: Oyuncu İsimleri ve Canvas için kapsayıcı -->
                <div class="flex flex-row items-center justify-center w-full max-w-6xl gap-4">
                    
                    <!-- Player 1 Adı (Sol taraf) -->
                    <div class="text-center w-1/6">
                        <!-- EKLENDİ: Parlama sınıfı eklendi -->
                        <h2 id="player1-name" class="text-xl md:text-3xl font-bold text-cyan-400 break-words neon-text-cyan">
                            Player 1
                        </h2>
                    </div>

                    <!-- Oyun Canvas'ı (Orta) -->
                    <div class="flex-grow">
                        <!-- Canvas'ın kendisi (neon tema için gölge eklendi) -->
                        <!-- DEĞİŞTİ: Tailwind gölgesi yerine neon-shadow-magenta sınıfı eklendi -->
                        <canvas id="game" width="800" height="600" class="w-full h-auto aspect-[4/3] rounded-lg neon-shadow-magenta"></canvas>
                    </div>

                    <!-- Player 2 Adı (Sağ taraf) -->
                    <div class="text-center w-1/6">
                        <!-- EKLENDİ: Parlama sınıfı eklendi -->
                        <h2 id="player2-name" class="text-xl md:text-3xl font-bold text-green-400 break-words neon-text-green">
                            Player 2
                        </h2>
                    </div>

                </div>
            </div>
            `;
        }
    }

    async onPreLoad() : Promise<void> {
        return new Promise<void>((resolve) => {
            const socket = new WebSocket(`wss://localhost:3000/room/${this.roomId}`);

            socket.onopen = () => {
                GlobalState.setSocket(socket);
                socket.send(JSON.stringify({ action: "joinGame", roomId: this.roomId }));
                this.game = new ClassicGame(socket);
                resolve();
            };

            socket.onmessage = (event) => {
                const message = JSON.parse(event.data);
                this.game!.handleEvents(message);
                if (message.action == "gameEnded") {
                    GlobalState.setPage(CLASSIC_GAME_PAGE_RESULT(message.result));
                }
            };
        });
    }

    async onLoad(): Promise<void> {
        this.gameRun();
    }

    async onUnload(): Promise<void> {

        if (this.game) {
            this.game?.stopGame();
        }

        const socket = GlobalState.getSocket();
        if (socket) {
            socket.close();
            GlobalState.setSocket(null);
        }
    }

    gameRun() {
        const canvas = document.getElementById("game") as HTMLCanvasElement;
        if (canvas) {
            const socket = GlobalState.getSocket();
            if (!socket) {
                console.error("WebSocket is not established.");
                return;
            }
            this.game?.setCanvas(canvas);
            this.game?.classicGameStart();
        }
    }
}

const CLASSIC_GAME_PAGE = (roomID : string) => new ClassicGamePage(roomID);

export { CLASSIC_GAME_PAGE, ClassicGamePage };