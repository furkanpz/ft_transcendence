import { GlobalState, Page } from "../main";
import { SingleGame } from "../SingleGame"; // Yeni oluşturacağımız oyun sınıfı

class SingleGamePage implements Page {
    title: string = "Local 1v1"; // Başlık güncellendi
    private game: SingleGame | undefined = undefined;

    async render(): Promise<void> {
        const app = document.getElementById("app");
        if (app) {
            // Render metodu, ClassicGamePage'den kopyalandı.
            // Sadece başlık "1v1 Game" -> "Local 1v1" olarak değiştirildi.
            app.innerHTML = `
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
                /* Neon stilleri buraya... (ClassicGamePage'den kopyalandı) */
                .neon-text-cyan { text-shadow: 0 0 5px #00BFFF, 0 0 10px #00BFFF, 0 0 20px #00BFFF; }
                .neon-text-green { text-shadow: 0 0 5px #39FF14, 0 0 10px #39FF14, 0 0 20px #39FF14; }
                .neon-text-magenta { text-shadow: 0 0 5px #FF00FF, 0 0 10px #FF00FF, 0 0 20px #FF00FF; }
                .neon-shadow-magenta { box-shadow: 0 0 10px #FF00FF, 0 0 20px #FF00FF, 0 0 30px #FF00FF; }
                .neon-border-cyan { border: 2px solid #00BFFF; box-shadow: 0 0 5px #00BFFF, 0 0 10px #00BFFF; }
            </style>

            <div class="w-full" style="min-height: calc(100vh - 80px); background: #000010; color: white; padding: 2rem; display: flex; flex-direction: column; align-items: center; font-family: 'Roboto', sans-serif;">
                
                <h1 data-i18n="local_one_v_one" style="font-family: 'Roboto', sans-serif; font-size: clamp(1.875rem, 4vw, 3rem); font-weight: 700; color: #00BFFF; margin-bottom: 1rem; text-shadow: 0 0 10px #00BFFF;">
                    Local 1v1
                </h1>

                <div style="display: flex; flex-direction: row; align-items: center; justify-content: center; width: 100%; max-width: 1200px; gap: 2rem;">
                    
                    <div style="text-align: center; min-width: 150px;">
                        <h2 id="player1-name" style="font-family: 'Roboto', sans-serif; font-size: clamp(1rem, 2vw, 1.5rem); font-weight: 700; color: #00BFFF; text-shadow: 0 0 10px #00BFFF; word-break: break-word;">
                            -
                        </h2>
                        <div id="player1-score" style="font-family: 'Roboto', sans-serif; font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 700; color: #00BFFF; margin-top: 0.5rem;">0</div>
                    </div>

                    <div style="flex: 1; display: flex; justify-content: center;">
                        <canvas id="game" width="800" height="600" style="width: 100%; max-width: 800px; height: auto; aspect-ratio: 4/3; border-radius: 12px; box-shadow: 0 0 20px #FF00FF, 0 0 40px #FF00FF, 0 0 60px #FF00FF;"></canvas>
                    </div>

                    <div style="text-align: center; min-width: 150px;">
                        <h2 id="player2-name" style="font-family: 'Roboto', sans-serif; font-size: clamp(1rem, 2vw, 1.5rem); font-weight: 700; color: #39FF14; text-shadow: 0 0 10px #39FF14; word-break: break-word;">
                            -
                        </h2>
                        <div id="player2-score" style="font-family: 'Roboto', sans-serif; font-size: clamp(1.5rem, 3vw, 2.5rem); font-weight: 700; color: #39FF14; margin-top: 0.5rem;">0</div>
                    </div>

                </div>
            </div>
            `;
        }
    }

    // Network bağlantısı gerekmediği için onPreLoad boş
    async onPreLoad(): Promise<void> { }

    async onLoad(): Promise<void> {
        // HTML elementlerini bul
        const canvas = document.getElementById("game") as HTMLCanvasElement;
        const player1NameEl = document.getElementById("player1-name");
        const player2NameEl = document.getElementById("player2-name");
        const player1ScoreEl = document.getElementById("player1-score");
        const player2ScoreEl = document.getElementById("player2-score");

        // Oyuncu isimlerini ayarla
        if (player1NameEl) player1NameEl.textContent = "Player 1";
        if (player2NameEl) player2NameEl.textContent = "Player 2";

        if (canvas && player1ScoreEl && player2ScoreEl) {
            // Yeni SingleGame sınıfını başlat
            this.game = new SingleGame();
            // Kanvası ve skor elementlerini oyuna ilet
            this.game.gameStart(canvas, player1ScoreEl, player2ScoreEl);
        } else {
            console.error("Single player game canvas or score elements not found!");
        }
    }

    async onUnload(): Promise<void> {
        // Sayfadan ayrılırken oyun döngüsünü durdur
        if (this.game) {
            this.game.stopGame();
        }
        
        // ClassicGamePage'de olduğu gibi socket'i kapatmaya gerek yok
        console.log("SingleGamePage unloaded");
    }
}

const SINGLE_GAME_PAGE = new SingleGamePage();

export { SINGLE_GAME_PAGE, SingleGamePage };