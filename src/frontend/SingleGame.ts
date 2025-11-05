// game/SingleGame.ts
// (Yorum satırları ve importlar kolaylık olması için kaldırıldı)

import { GlobalState } from "./main";
import { Vector2 } from "../backend/server/types/vector.types"; 
import { SINGLE_GAME_RESULT } from "./pages/SingleGameResult"; 

// --- 🎮 OYUN SABİTLERİ ---
const WIDTH = 800;
const HEIGHT = 600;
const PLAYER_GAP = 20;
const PLAYER_WIDTH = 20;
const PLAYER_HEIGHT = 100;
const FIXED_FPS = 60;
const FIXED_UPDATE_MS = 1000 / FIXED_FPS; 
const PLAYER_SPEED = 8;       
const BALL_START_SPEED = 6;   
const BALL_MAX_SPEED_X = 20;
const BALL_MAX_SPEED_Y = 15;
const WIN_SCORE = 5;
// --- SABİTLER SONU ---


// --- Arayüzler ---
interface Player {
    pos: Vector2;
    dim: Vector2;
    style: string;
    score: number;
    dy: number; 
}
interface Ball {
    pos: Vector2;
    vel: Vector2;
    radius: number;
    style: string;
}
interface Particle {
    pos: Vector2;
    vel: Vector2; 
    radius: number;
    color: string;
    alpha: number;
}
// --- Arayüzler Sonu ---


export class SingleGame {
    public canvas?: HTMLCanvasElement;
    public ctx?: CanvasRenderingContext2D;
    public ball: Ball;
    public players: Player[] = [];
    public isPlaying: boolean;
    public isBallVisible: boolean = true;
    
    private ballTrail: Vector2[] = [];
    private particles: Particle[] = [];

    private player1ScoreEl: HTMLElement | null = null;
    private player2ScoreEl: HTMLElement | null = null;
    private keys: { [key: string]: boolean } = {};

    private physicsIntervalId: number | null = null;
    
    private lastTime: number = 0;

    constructor() {
        this.ball = {
            pos: new Vector2(WIDTH / 2, HEIGHT / 2),
            vel: new Vector2(0, 0),
            radius: 10,
            style: "#FFD700"
        };
        this.players.push({
            pos: new Vector2(PLAYER_GAP + PLAYER_WIDTH / 2, HEIGHT / 2),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            style: "#00BFFF",
            score: 0,
            dy: 0,
        });
        this.players.push({
            pos: new Vector2(WIDTH - PLAYER_WIDTH / 2 - PLAYER_GAP, HEIGHT / 2),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            style: "#39FF14",
            score: 0,
            dy: 0,
        });
        this.isPlaying = true;
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    }

    gameStart(
        canvas: HTMLCanvasElement, 
        score1El: HTMLElement, 
        score2El: HTMLElement
    ) {
        this.setCanvas(canvas);
        this.player1ScoreEl = score1El;
        this.player2ScoreEl = score2El;

        document.addEventListener("keydown", (event) => {
            if (event.repeat) return;
            this.keys[event.key] = true;
        });
        document.addEventListener("keyup", (event) => {
            this.keys[event.key] = false;
        });

        this.resetBall(true); 
        
        this.physicsIntervalId = window.setInterval(
            this.update.bind(this), 
            FIXED_UPDATE_MS
        );

        this.lastTime = performance.now();
        const frameId = requestAnimationFrame(this.gameLoop.bind(this));
        GlobalState.setAnimationFrameId(frameId);
    }
    
    // --- ÇİZİM METODLARI ---

    drawBackground() {
        this.ctx!.fillStyle = "#000010";
        this.ctx!.fillRect(0, 0, WIDTH, HEIGHT);
        const lineY = this.ball.pos.y * 0.1; 
        this.ctx!.strokeStyle = "#FF00FF";
        this.ctx!.lineWidth = 5;
        this.ctx!.shadowColor = "#FF00FF";
        this.ctx!.shadowBlur = 20;       
        this.ctx!.setLineDash([25, 15]);
        this.ctx!.lineDashOffset = -lineY; 
        this.ctx!.beginPath();
        this.ctx!.moveTo(WIDTH / 2, 0);
        this.ctx!.lineTo(WIDTH / 2, HEIGHT);
        this.ctx!.stroke();
        this.ctx!.shadowBlur = 0;
        this.ctx!.setLineDash([]);
        this.ctx!.fillStyle = "#FFFFFF";
        this.ctx!.font = "bold 80px 'Press Start 2P', monospace"; 
        this.ctx!.textAlign = "center";
        this.ctx!.textBaseline = "middle";
        this.ctx!.shadowColor = "#00BFFF";
        this.ctx!.shadowBlur = 15;
        this.ctx!.fillText(this.players[0].score.toString(), WIDTH / 4, HEIGHT / 2);
        this.ctx!.fillText(this.players[1].score.toString(), 3 * WIDTH / 4, HEIGHT / 2);
        this.ctx!.shadowBlur = 0;
    }

    drawBall() {
        if (!this.isBallVisible) return;
        const ballColor = this.ball.style;
        this.ctx!.beginPath();
        this.ctx!.fillStyle = ballColor;
        this.ctx!.shadowColor = ballColor;
        this.ctx!.shadowBlur = 20;
        this.ctx!.arc(this.ball.pos.x, this.ball.pos.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx!.fill();
        this.ctx!.closePath();
        this.ctx!.shadowBlur = 0;
        
        if (this.ballTrail && this.ballTrail.length > 1) {
            this.ctx!.lineCap = "round"; 
            for (let i = 1; i < this.ballTrail.length; i++) {
                const point = this.ballTrail[i];
                const prevPoint = this.ballTrail[i-1];
                const alpha = i / this.ballTrail.length; 
                this.ctx!.beginPath(); 
                this.ctx!.moveTo(prevPoint.x, prevPoint.y);
                this.ctx!.lineTo(point.x, point.y);
                this.ctx!.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.5})`; 
                this.ctx!.lineWidth = (this.ball.radius * 0.8) * alpha + (this.ball.radius * 0.2); 
                this.ctx!.shadowColor = ballColor;
                this.ctx!.shadowBlur = 15 * alpha; 
                this.ctx!.stroke();
            }
            this.ctx!.shadowBlur = 0;
            this.ctx!.lineCap = "butt";
        }
    }

    drawPlayers() {
        const p1Color = this.players[0].style;
        this.ctx!.fillStyle = p1Color;
        this.ctx!.shadowColor = p1Color;
        this.ctx!.shadowBlur = 25;
        this.ctx!.fillRect(this.players[0].pos.x - this.players[0].dim.x / 2, this.players[0].pos.y - this.players[0].dim.y / 2, this.players[0].dim.x, this.players[0].dim.y);

        const p2Color = this.players[1].style;
        this.ctx!.fillStyle = p2Color;
        this.ctx!.shadowColor = p2Color;
        this.ctx!.shadowBlur = 25;
        this.ctx!.fillRect(this.players[1].pos.x - this.players[1].dim.x / 2, this.players[1].pos.y - this.players[1].dim.y / 2, this.players[1].dim.x, this.players[1].dim.y);
        
        this.ctx!.shadowBlur = 0;
    }
    
    render() {
        this.drawBackground();
        this.drawBall();
        this.drawPlayers();
        this.drawParticles();
    }

    // --- PARTİKÜL METODLARI ---
    
    private createExplosion(position: Vector2) {
        const particleCount = 25;
        const ballColor = this.ball.style;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 6 + 2; 
            this.particles.push({
                pos: new Vector2(position.x, position.y),
                vel: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
                radius: Math.random() * 3 + 2,
                color: ballColor,
                alpha: 1.0,
            });
        }
    }
    private createImplosion(targetPosition: Vector2) {
        const particleCount = 30;
        const implosionColor = "#00BFFF"; 
        const startRadius = 150;
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 3; 
            const startPos = new Vector2(
                targetPosition.x + Math.cos(angle) * (startRadius + Math.random() * 50),
                targetPosition.y + Math.sin(angle) * (startRadius + Math.random() * 50)
            );
            const vel = new Vector2(targetPosition.x - startPos.x, targetPosition.y - startPos.y);
            const dist = Math.sqrt(vel.x * vel.x + vel.y * vel.y);
            vel.x = (vel.x / dist) * speed;
            vel.y = (vel.y / dist) * speed;
            this.particles.push({
                pos: startPos,
                vel: vel,
                radius: Math.random() * 2 + 1,
                color: implosionColor,
                alpha: 1.0,
            });
        }
    }
    
    // --- DEĞİŞİKLİK 1: updateParticles ---
    // Parçacık fiziği (sönümlenme ve solma) 'ClassicGame' ile aynı olacak şekilde
    // 'dt' (delta time) kullanımından bağımsız hale getirildi.
    private updateParticles(dt: number) {
        // 'dt' parametresi artık kullanılmıyor, ancak pürüzsüzlük için 'gameLoop' 
        // içinden çağrılmaya devam ediyor.

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // Orijinal 'SingleGame' dt'ye bağlı mantığı:
            // const dtFactor = dt * FIXED_FPS; 
            // p.pos.x += p.vel.x * dtFactor; 
            // p.pos.y += p.vel.y * dtFactor;
            // const damping = 1.0 - (0.03 * dtFactor); 
            // p.vel.x *= damping;
            // p.vel.y *= damping;
            // p.alpha -= 0.02 * dtFactor; 
            
            // 'ClassicGame' mantığı (dt'den bağımsız):
            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
            p.vel.x *= 0.97; // Sabit sönümlenme
            p.vel.y *= 0.97; // Sabit sönümlenme
            p.alpha -= 0.02; // Sabit solma
            
            
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    private drawParticles() {
        this.ctx!.save(); 
        for (const p of this.particles) {
            this.ctx!.beginPath();
            this.ctx!.globalAlpha = p.alpha;
            this.ctx!.fillStyle = p.color;
            this.ctx!.shadowColor = p.color;
            this.ctx!.shadowBlur = 15;
            this.ctx!.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
            this.ctx!.fill();
        }
        this.ctx!.restore();
    }

    // --- OYUN MANTIĞI METODLARI ---

    // --- DEĞİŞİKLİK 2: resetBall ---
    // Efekt zamanlaması 'ClassicGame' ile aynı olacak şekilde güncellendi:
    // Skor anında: Patlama -> Merkeze Al -> İçe Çekilme -> 500ms Gizle
    // 800ms sonra (oynanış kuralı): Hareket et.
    private resetBall(isFirstServe: boolean = false) {
        
        // 1. Patlama (Sadece skor anında, ilk serviste değil)
        if (!isFirstServe) {
            this.createExplosion(this.ball.pos);
        }
        
        // 2. Topu merkeze al, durdur, izi sil
        this.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
        this.ball.vel = new Vector2(0, 0); 
        this.ballTrail = [];

        if (!isFirstServe) {
            // 3. (Skor anında) İçe Çekilmeyi hemen yap
            this.createImplosion(this.ball.pos);
            // 4. (Skor anında) Topu gizle
            this.isBallVisible = false;
            
            // 5. (Skor anında) 500ms sonra topu görünür yap (ClassicGame)
            setTimeout(() => {
                if (!this.isPlaying) return;
                this.isBallVisible = true;
            }, 500); 
            
        } else {
            // İlk serviste top görünür başlar
            this.isBallVisible = true;
        }


        // 6. Topun HAREKETE başlaması için 800ms bekle (SingleGame oynanış kuralı)
        // (Skor olduysa, 500ms gizlilikten 300ms sonra hareket edecek)
        setTimeout(() => {
            if (!this.isPlaying) return; 

            // İlk servisse, İçe Çekilmeyi şimdi (hareketten hemen önce) yap
            if (isFirstServe) {
                this.createImplosion(this.ball.pos);
            }

            // Hareketi başlat
            this.ball.vel.x = (Math.random() > 0.5 ? 1 : -1) * BALL_START_SPEED;
            this.ball.vel.y = (Math.random() - 0.5) * (BALL_START_SPEED / 2);
            
        }, 2000); // Orijinal 800ms oynanış beklemesi korundu
    }
    // --- DEĞİŞİKLİK 2 SONU ---


    private checkCollision(ball: Ball, player: Player): boolean {
        const playerTop = player.pos.y - player.dim.y / 2;
        const playerBottom = player.pos.y + player.dim.y / 2;
        const playerLeft = player.pos.x - player.dim.x / 2;
        const playerRight = player.pos.x + player.dim.x / 2;
        const ballTop = ball.pos.y - ball.radius;
        const ballBottom = ball.pos.y + ball.radius;
        const ballLeft = ball.pos.x - ball.radius;
        const ballRight = ball.pos.x + ball.radius;
        return ballLeft < playerRight && 
               ballRight > playerLeft && 
               ballTop < playerBottom && 
               ballBottom > playerTop;
    }
    
    private update() {
        if (!this.isPlaying) return;

        // 1. Oyuncu Kontrolleri (W/S)
        if (this.keys['w']) {
            this.players[0].dy = -PLAYER_SPEED;
        } else if (this.keys['s']) {
            this.players[0].dy = PLAYER_SPEED;
        } else {
            this.players[0].dy = 0;
        }

        // 2. Oyuncu Kontrolleri (ArrowUp/ArrowDown)
        if (this.keys['ArrowUp']) {
            this.players[1].dy = -PLAYER_SPEED;
        } else if (this.keys['ArrowDown']) {
            this.players[1].dy = PLAYER_SPEED;
        } else {
            this.players[1].dy = 0;
        }

        // 3. Oyuncuları Hareket Ettir
        this.players.forEach(player => {
            player.pos.y += player.dy;
            const halfPaddle = player.dim.y / 2;
            player.pos.y = Math.max(halfPaddle, Math.min(HEIGHT - halfPaddle, player.pos.y));
        });


        // 4. Topu Hareket Ettir
        if (this.isBallVisible && (this.ball.vel.x !== 0 || this.ball.vel.y !== 0)) {
            this.ball.pos.x += this.ball.vel.x;
            this.ball.pos.y += this.ball.vel.y;
        } else if (!this.isBallVisible) {
            return; 
        }

        // 5. Çarpışma Kontrolleri
        // Üst ve Alt Duvarlar
        if (this.ball.pos.y - this.ball.radius <= 0 || this.ball.pos.y + this.ball.radius >= HEIGHT) {
            this.ball.vel.y *= -1;
            this.ball.pos.y = Math.max(this.ball.radius, Math.min(HEIGHT - this.ball.radius, this.ball.pos.y));
        }

        // Oyuncu Raketleri
        let collidingPlayer = this.ball.vel.x < 0 ? this.players[0] : this.players[1];
        
        if (this.checkCollision(this.ball, collidingPlayer)) {
            this.ball.vel.x *= -1.03; 
            
            let diff = this.ball.pos.y - collidingPlayer.pos.y;
            this.ball.vel.y = (diff / (collidingPlayer.dim.y / 2)) * (Math.abs(this.ball.vel.x) * 0.5);

            this.ball.vel.x = Math.sign(this.ball.vel.x) * Math.min(Math.abs(this.ball.vel.x), BALL_MAX_SPEED_X);
            this.ball.vel.y = Math.sign(this.ball.vel.y) * Math.min(Math.abs(this.ball.vel.y), BALL_MAX_SPEED_Y);

            if (this.ball.vel.x > 0) { 
                this.ball.pos.x = this.players[0].pos.x + this.players[0].dim.x / 2 + this.ball.radius;
            } else { 
                this.ball.pos.x = this.players[1].pos.x - this.players[1].dim.x / 2 - this.ball.radius;
            }
        }

        // 6. Skor Kontrolü (Sol ve Sağ Duvarlar)
        if (this.ball.pos.x - this.ball.radius < 0) {
            this.players[1].score++;
            if (this.player2ScoreEl) this.player2ScoreEl.textContent = this.players[1].score.toString();
            if (this.checkWinCondition()) return; 
            this.resetBall();

        } else if (this.ball.pos.x + this.ball.radius > WIDTH) {
            this.players[0].score++;
            if (this.player1ScoreEl) this.player1ScoreEl.textContent = this.players[0].score.toString();
            if (this.checkWinCondition()) return; 
            this.resetBall();
        }

        // 7. Top izini güncelle
        if (this.isPlaying && this.isBallVisible) {
            this.ballTrail.push(new Vector2(this.ball.pos.x, this.ball.pos.y));
            if (this.ballTrail.length > 20) {
                this.ballTrail.shift();
            }
        }
    }

    private checkWinCondition() : boolean {
        if (this.players[0].score >= WIN_SCORE || this.players[1].score >= WIN_SCORE) {
            this.isPlaying = false; 
            
            const result = {
                players: [
                    { name: "Player 1", score: this.players[0].score },
                    { name: "Player 2", score: this.players[1].score }
                ]
            };
            
            setTimeout(() => { 
                this.stopGame(); 
                GlobalState.setPage(SINGLE_GAME_RESULT(result));
            }, 500); 

            return true;
        }
        return false;
    }

    // --- OYUN DÖNGÜSÜ YÖNETİMİ ---

    public stopGame() {
        this.isPlaying = false; 
        
        const frameId = GlobalState.getAnimationFrameId();
        if (frameId) {
            cancelAnimationFrame(frameId);
            GlobalState.setAnimationFrameId(null);
        }

        if (this.physicsIntervalId) {
            clearInterval(this.physicsIntervalId);
            this.physicsIntervalId = null;
        }
    }

    gameLoop(timestamp: number) {
        
        if (!this.lastTime) {
            this.lastTime = timestamp;
        }
        let dt = (timestamp - this.lastTime) / 1000.0;
        this.lastTime = timestamp;

        if (dt > 0.1) {
            dt = 0.1; 
        }

        // Parçacıkları 'dt' ile güncelle
        // (updateParticles fonksiyonu içindeki değişiklik nedeniyle dt artık göz ardı ediliyor,
        // ancak pürüzsüzlük için hala render döngüsünde çağrılıyor)
        this.updateParticles(dt);
        
        this.render();

        if (GlobalState.getAnimationFrameId() !== null) {
            const frameId = requestAnimationFrame(this.gameLoop.bind(this));
            GlobalState.setAnimationFrameId(frameId);
        }
    }
}