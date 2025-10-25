import { GlobalState } from "../main";
import { Vector2 } from "../../backend/server/types/vector.types";
import { HEIGHT, WIDTH, PLAYER_GAP, PLAYER_HEIGHT, PLAYER_WIDTH} from "../../backend/server/types/game.types";

interface Player {
    pos: Vector2;
    target_pos: Vector2;
    dim: Vector2;
    style: string;
    score: number;
}

interface Ball {
    pos: Vector2;
    target_pos: Vector2;
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

export class ClassicGame {
    public canvas?: HTMLCanvasElement;
    public ctx?: CanvasRenderingContext2D;
    public ball: Ball;
    public players: Player[] = [];
    public scored: boolean;
    public socket: WebSocket;
    public interpolationFactor: number;
    private ballTrail: Vector2[] = [];
    public isPlaying: boolean;
    public isBallVisible: boolean = true;
    private particles: Particle[] = [];

    constructor(socket: WebSocket)
    {
        this.ball = {
            pos: new Vector2(WIDTH / 2, HEIGHT / 2),
            target_pos: new Vector2(WIDTH / 2, HEIGHT / 2),
            radius: 10,
            style: "red"
        };
        this.players.push({
            pos: new Vector2(PLAYER_GAP, HEIGHT / 2),
            target_pos: new Vector2(PLAYER_GAP, HEIGHT / 2),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            style: "blue",
            score: 0,
        });
        this.players.push({
            pos: new Vector2(WIDTH - PLAYER_WIDTH - PLAYER_GAP, HEIGHT / 2),
            target_pos: new Vector2(WIDTH - PLAYER_WIDTH - PLAYER_GAP, HEIGHT / 2),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            style: "green",
            score: 0,
        });
        this.scored = false;
        this.socket = socket;
        this.interpolationFactor = 0.5;
        this.isPlaying = true; 
    }

    setCanvas(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    }

    gameStart() {
        document.addEventListener("keydown", (event) => {
            if (event.repeat) return;
            if (event.key === "w" || event.key === "ArrowUp") {
                this.socket.send(JSON.stringify({ action: "key", key: "up", type: "press" }));
            }
            if (event.key === "s" || event.key === "ArrowDown") {
                this.socket.send(JSON.stringify({ action: "key", key: "down", type: "press" }));
            }
        });

        document.addEventListener("keyup", (event) => {
            if (event.key === "w" || event.key === "ArrowUp") {
                this.socket.send(JSON.stringify({ action: "key", key: "up", type: "release" }));
            }
            if (event.key === "s" || event.key === "ArrowDown") {
                this.socket.send(JSON.stringify({ action: "key", key: "down", type: "release" }));
            }
        });

        this.gameLoop();
    }
    
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

        const ballColor = "#FFD700";
        
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
        const p1Color = "#00BFFF";
        this.ctx!.fillStyle = p1Color;
        this.ctx!.shadowColor = p1Color;
        this.ctx!.shadowBlur = 25;

        this.ctx!.fillRect(this.players[0].pos.x - this.players[0].dim.x / 2, this.players[0].pos.y - this.players[0].dim.y / 2, this.players[0].dim.x, this.players[0].dim.y);

        const p2Color = "#39FF14";
        this.ctx!.fillStyle = p2Color;
        this.ctx!.shadowColor = p2Color;
        this.ctx!.shadowBlur = 25;

        this.ctx!.fillRect(this.players[1].pos.x - this.players[1].dim.x / 2, this.players[1].pos.y - this.players[1].dim.y / 2, this.players[1].dim.x, this.players[1].dim.y);

        this.ctx!.shadowBlur = 0;
    }

	handleEvents(message: any) {
        if (message.type === "gameState") {
            
            const players: any[] = message.players;

            const scoreHappened = players[0].score !== this.players[0].score || players[1].score !== this.players[1].score;

            if (scoreHappened) {
                console.log("Skor algılandı! Patlama ve İçe Çekilme tetikleniyor.");
                
                this.createExplosion(this.ball.pos);

                this.ball.target_pos = message.ball.pos;
                this.ball.pos.x = message.ball.pos.x;
                this.ball.pos.y = message.ball.pos.y;

                this.createImplosion(this.ball.pos);

                this.ballTrail = [];

                this.isBallVisible = false;
                setTimeout(() => {
                    this.isBallVisible = true;
                }, 500);

            } else {
                this.ball.target_pos = message.ball.pos;
            }

            players.forEach((p, index) => {
                this.players[index].target_pos = p.pos;
                this.players[index].score = p.score;
            });

        } else if (message.type === "gameOver") {
            this.isPlaying = false;
        }
    }

    render() {
        this.drawBackground();
        this.drawBall();
        this.drawPlayers();
        this.drawParticles();

        if (!this.isPlaying) {
            this.ctx!.fillStyle = "white";
            this.ctx!.font = "bold 60px 'Press Start 2P', monospace"; 
            this.ctx!.textAlign = "center";
            this.ctx!.textBaseline = "middle";
            
            this.ctx!.shadowColor = "#FF00FF"; // Neon Pembe/Macenta
            this.ctx!.shadowBlur = 20;
    
            this.ctx!.fillText("Game Over", WIDTH / 2, HEIGHT / 2);
    
            this.ctx!.shadowBlur = 0;
        }
    }

    private interpolatePositions() {
        if (this.isBallVisible) {
            this.ball.pos.x += (this.ball.target_pos.x - this.ball.pos.x) * this.interpolationFactor;
            this.ball.pos.y += (this.ball.target_pos.y - this.ball.pos.y) * this.interpolationFactor;
        }

        this.players.forEach((player) => {
            player.pos.x += (player.target_pos.x - player.pos.x) * this.interpolationFactor;
            player.pos.y += (player.target_pos.y - player.pos.y) * this.interpolationFactor;
        });
    }

    private createExplosion(position: Vector2) {
        const particleCount = 25;
        const ballColor = "#FFD700";

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

            const vel = new Vector2(
                targetPosition.x - startPos.x,
                targetPosition.y - startPos.y
            );

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

    private updateParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.pos.x += p.vel.x;
            p.pos.y += p.vel.y;
            
            p.vel.x *= 0.97;
            p.vel.y *= 0.97;
            
            p.alpha -= 0.02; 
            
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

    public stopGame() {
        const frameId = GlobalState.getAnimationFrameId();
        if (frameId) {
            cancelAnimationFrame(frameId);
            GlobalState.setAnimationFrameId(null);
        }
    }

    gameLoop() {
        if (this.isPlaying) {
            this.interpolatePositions();
        }

        this.updateParticles();

        if (this.isPlaying && this.isBallVisible) {
            this.ballTrail.push(new Vector2(this.ball.pos.x, this.ball.pos.y));
            if (this.ballTrail.length > 20) {
                this.ballTrail.shift();
            }
        }
        
        this.render();

        const frameId = requestAnimationFrame(this.gameLoop.bind(this));
        GlobalState.setAnimationFrameId(frameId);
    }
}