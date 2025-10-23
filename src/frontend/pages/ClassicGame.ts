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

interface Component {
    style: string;
    text: string;
    pos: Vector2;
    dim: Vector2;
    draw: (game: ClassicGame) => void;
    contains: (point: Vector2) => boolean;
}

class Button implements Component {

    style: string;
    text: string;
    pos: Vector2;
    dim: Vector2;
    draw: (game: ClassicGame) => void;
    onClick: (game: ClassicGame) => void;
    contains: (point: Vector2) => boolean;
	isHovered: boolean = false; // Hover durumunu tutmak için

    constructor(style: string, text: string, pos: Vector2, dim: Vector2, onClick: (game: ClassicGame) => void) {
        this.style = style; // Bu artık neon rengi olacak (örn: "#FF00FF")
        this.text = text;
        this.pos = pos;
        this.dim = dim;
        this.onClick = onClick;
        this.contains = (vec2: Vector2) => {
            return vec2.x >= this.pos.x - this.dim.x / 2 &&
                vec2.x <= this.pos.x + this.dim.x / 2 &&
                vec2.y >= this.pos.y - this.dim.y / 2 &&
                vec2.y <= this.pos.y + this.dim.y / 2;
        };
        this.draw = (game: ClassicGame) => {
			const neonColor = this.style;
            const x = this.pos.x - this.dim.x / 2;
            const y = this.pos.y - this.dim.y / 2;
            const w = this.dim.x;
            const h = this.dim.y;

            // Parlama
            game.ctx!.shadowColor = neonColor;
            game.ctx!.shadowBlur = 15;

            if (this.isHovered) {
                // Hover durumu: İçi de neon rengiyle dolsun
                game.ctx!.fillStyle = neonColor;
                game.ctx!.fillRect(x, y, w, h);
            } else {
                // Normal durum: Sadece kenarlık parlasın
                game.ctx!.strokeStyle = neonColor;
                game.ctx!.lineWidth = 4;
                game.ctx!.strokeRect(x, y, w, h);

                // İçi koyu renk
                game.ctx!.fillStyle = "rgba(0, 0, 10, 0.8)";
                game.ctx!.fillRect(x, y, w, h);
            }

            // Gölgeyi sıfırla
            game.ctx!.shadowBlur = 0;

            // Yazı
            // Hover durumunda yazıyı siyah yap, normalde beyaz
            game.ctx!.fillStyle = this.isHovered ? "black" : "white"; 
            game.ctx!.font = "30px 'Press Start 2P', monospace";
            game.ctx!.textAlign = "center";
            game.ctx!.textBaseline = "middle";
            
            if (!this.isHovered) {
                // Normalde yazıya da hafif bir parlama ver
                game.ctx!.shadowColor = "white";
                game.ctx!.shadowBlur = 5;
            }

            game.ctx!.fillText(this.text, this.pos.x, this.pos.y);

            game.ctx!.shadowBlur = 0; // Gölgeyi tekrar sıfırla
        };
        this.onClick = onClick;
        this.contains = (vec2: Vector2) => {
            return vec2.x >= this.pos.x - this.dim.x / 2 &&
                vec2.x <= this.pos.x + this.dim.x / 2 &&
                vec2.y >= this.pos.y - this.dim.y / 2 &&
                vec2.y <= this.pos.y + this.dim.y / 2;
        }
    }
}

interface UI {
    components: Component[];
    draw: (game: ClassicGame) => void;
}

export enum GameState {
    Menu,
    Playing,
    GameOver
}

export class ClassicGame {
	public canvas?: HTMLCanvasElement;
	public ctx?: CanvasRenderingContext2D;
    public ball: Ball;
    public player1: Player;
    public player2: Player;
    public state: GameState;
    public mouseInput: Map<string, Vector2>;
    public uis: Map<GameState, UI>;
    public scored: boolean;
	public socket: WebSocket;
	public interpolationFactor: number;
	private ballTrail: Vector2[] = [];

	constructor(socket: WebSocket)
	{
		this.ball = {
			pos: new Vector2(WIDTH / 2, HEIGHT / 2),
			target_pos: new Vector2(WIDTH / 2, HEIGHT / 2),
			radius: 10,
			style: "red"
		};
		this.player1 = {
			pos: new Vector2(PLAYER_GAP, HEIGHT / 2),
			target_pos: new Vector2(PLAYER_GAP, HEIGHT / 2),
			dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
			style: "blue",
			score: 0,
		};
		this.player2 = {
			pos: new Vector2(WIDTH - PLAYER_WIDTH - PLAYER_GAP, HEIGHT / 2),
			target_pos: new Vector2(WIDTH - PLAYER_WIDTH - PLAYER_GAP, HEIGHT / 2),
			dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
			style: "green",
			score: 0,
		};
		this.state = GameState.Menu;
		this.mouseInput = new Map<string, Vector2>();
		this.uis = new Map<GameState, UI>();
		this.scored = false;
		this.socket = socket;
		this.interpolationFactor = 0.5; // İnterpolasyon faktörü

		this.initUI();
	}

	setCanvas(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
	}

	drawMenuBackground() {
    	this.ctx!.fillStyle = "#303030";
    	this.ctx!.fillRect(0, 0, WIDTH, HEIGHT);
	}

	initUI() {

		const menuUI: UI = {
			components: [
				new Button("#FF00FF", "Start", new Vector2(WIDTH / 2, HEIGHT / 2), new Vector2(200, 100), (game: ClassicGame) => {
					console.log("Game Starting...");
					game.state = GameState.Playing;
				}),
			],
			draw: (game: ClassicGame) => {
				game.drawMenuBackground();
				game.uis.get(GameState.Menu)?.components.forEach(component => component.draw(game));
			},
		};

		const playingUI: UI = {
			components: [],
			draw: (game: ClassicGame) => {
				game.drawBackground();
				game.drawBall();
				game.drawPlayers();
			},
		};

		const gameOverUI: UI = {
			components: [
				new Button("#00BFFF", "Replay", new Vector2(WIDTH / 2, (HEIGHT / 4) * 3), new Vector2(200, 100), (game: ClassicGame) => {
					game.player2.score = 0;
					game.player1.pos = new Vector2(PLAYER_GAP, HEIGHT / 2);
					game.player2.pos = new Vector2(WIDTH - PLAYER_WIDTH - PLAYER_GAP, HEIGHT / 2);
					game.state = GameState.Playing;
				})
			],
			draw: (game: ClassicGame) => {
				game.drawMenuBackground();
				game.ctx!.fillStyle = "white";
				game.ctx!.font = "50px Arial";
				game.ctx!.textAlign = "center";
				game.ctx!.textBaseline = "middle";
				game.ctx!.fillText("Game Over", WIDTH / 2, HEIGHT / 2);
				game.uis.get(GameState.GameOver)?.components.forEach(component => component.draw(game));
			},
		};

		this.uis.set(GameState.Menu, menuUI);
		this.uis.set(GameState.Playing, playingUI);
		this.uis.set(GameState.GameOver, gameOverUI);

	}

	classicGameStart() {

		document.addEventListener("keydown", (event) => {
			if (event.repeat) return;
			console.log("Key pressed: " + event.key);
			this.socket.send(JSON.stringify({ action: "key", key: event.key, type: "press" }));
		});

		document.addEventListener("keyup", (event) => {
			console.log("Key released: " + event.key);
			this.socket.send(JSON.stringify({ action: "key", key: event.key, type: "release" }));
		});

		this.canvas!.addEventListener("mousedown", (event) => {
			const rect = this.canvas!.getBoundingClientRect();
			console.log(event.clientX - rect.left, event.clientY - rect.top);
			const vec2 = new Vector2(event.clientX - rect.left, event.clientY - rect.top);
			this.mouseInput.set("Mouse" + event.button.toString(), vec2);
			this.update();
		});

		this.canvas!.addEventListener("mouseup", (event) => {
			this.mouseInput.delete("Mouse" + event.button.toString());
			this.update();
		});

		this.gameLoop();
	}

	// ClassicGame sınıfı içinde
	drawBackground() {
		// Arka plan (çok koyu mavi)
		this.ctx!.fillStyle = "#000010"; // Neredeyse siyah
		this.ctx!.fillRect(0, 0, WIDTH, HEIGHT);

		// Orta çizgi (Parlayan Macenta)
		const lineY = this.ball.pos.y * 0.1; // Topun hareketine tepki veren hafif animasyon
		
		this.ctx!.strokeStyle = "#FF00FF"; // Parlak Macenta (Hot Pink)
		this.ctx!.lineWidth = 5;
		this.ctx!.shadowColor = "#FF00FF"; // Parlama rengi
		this.ctx!.shadowBlur = 20;         // Parlama yoğunluğu
		
		this.ctx!.setLineDash([25, 15]); // Kesikli çizgi
		this.ctx!.lineDashOffset = -lineY; // Animasyon için

		this.ctx!.beginPath();
		this.ctx!.moveTo(WIDTH / 2, 0);
		this.ctx!.lineTo(WIDTH / 2, HEIGHT);
		this.ctx!.stroke();

		// Diğer çizimler için gölgeyi ve kesikli çizgiyi sıfırla
		this.ctx!.shadowBlur = 0;
		this.ctx!.setLineDash([]);

		// Skorlar (Parlayan Beyaz/Açık Mavi)
		this.ctx!.fillStyle = "#FFFFFF";
		// Retro bir font harika olur (HTML'e eklenmiş olmalı)
		this.ctx!.font = "bold 80px 'Press Start 2P', monospace"; 
		this.ctx!.textAlign = "center";
		this.ctx!.textBaseline = "middle";
		this.ctx!.shadowColor = "#00BFFF"; // Açık Mavi parlama
		this.ctx!.shadowBlur = 15;

		this.ctx!.fillText(this.player1.score.toString(), WIDTH / 4, HEIGHT / 2);
		this.ctx!.fillText(this.player2.score.toString(), 3 * WIDTH / 4, HEIGHT / 2);

		this.ctx!.shadowBlur = 0; // Gölgeyi sıfırla
	}

	// ClassicGame sınıfı içinde
	drawBall() {
		const ballColor = "#FFD700"; // Altın Sarısı / Turuncu bir neon
		
		// Topun kendisi
		this.ctx!.beginPath();
		this.ctx!.fillStyle = ballColor;
		this.ctx!.shadowColor = ballColor;
		this.ctx!.shadowBlur = 20;

		this.ctx!.arc(this.ball.pos.x, this.ball.pos.y, this.ball.radius, 0, Math.PI * 2);
		this.ctx!.fill();
		this.ctx!.closePath();
		
		this.ctx!.shadowBlur = 0;

		// Neon İz Efekti
		if (this.ballTrail && this.ballTrail.length > 1) {
			
			this.ctx!.lineCap = "round"; // Daha yumuşak iz uçları
			
			// İz segmentlerini çiz
			for (let i = 1; i < this.ballTrail.length; i++) {
				const point = this.ballTrail[i];
				const prevPoint = this.ballTrail[i-1];
				
				// Alfa (şeffaflık) kuyruğa doğru azalır
				const alpha = i / this.ballTrail.length; 

				this.ctx!.beginPath(); // Her segment için yeni yol
				this.ctx!.moveTo(prevPoint.x, prevPoint.y);
				this.ctx!.lineTo(point.x, point.y);
				
				// Stili ayarla
				this.ctx!.strokeStyle = `rgba(255, 215, 0, ${alpha * 0.5})`; // Fading renk
				this.ctx!.lineWidth = (this.ball.radius * 0.8) * alpha + (this.ball.radius * 0.2); // Kuyruğa doğru incelir
				this.ctx!.shadowColor = ballColor;
				this.ctx!.shadowBlur = 15 * alpha; // Parlama da azalır
				
				this.ctx!.stroke(); // Segmenti çiz
			}
			
			this.ctx!.shadowBlur = 0;
			this.ctx!.lineCap = "butt"; // Varsayılana dön
		}
	}

	// ClassicGame sınıfı içinde
	drawPlayers() {
		// Player 1 (Elektrik Mavisi)
		const p1Color = "#00BFFF"; // Deep Sky Blue
		this.ctx!.fillStyle = p1Color;
		this.ctx!.shadowColor = p1Color;
		this.ctx!.shadowBlur = 25; // Güçlü parlama

		this.ctx!.fillRect(this.player1.pos.x - this.player1.dim.x / 2, this.player1.pos.y - this.player1.dim.y / 2, this.player1.dim.x, this.player1.dim.y);

		// Player 2 (Neon Yeşili)
		const p2Color = "#39FF14"; // Harlequin Green
		this.ctx!.fillStyle = p2Color;
		this.ctx!.shadowColor = p2Color;
		this.ctx!.shadowBlur = 25;

		this.ctx!.fillRect(this.player2.pos.x - this.player2.dim.x / 2, this.player2.pos.y - this.player2.dim.y / 2, this.player2.dim.x, this.player2.dim.y);

		this.ctx!.shadowBlur = 0; // Gölgeyi sıfırla
	}

	handleEvents(message: any) {
		if (message.type === "gameState") {
			// Konumları DOĞRUDAN ATAMAK YERİNE 'target_pos' olarak ayarla
			this.player1.target_pos = message.player1.pos;
			this.player1.score = message.player1.score;

			this.player2.target_pos = message.player2.pos;
			this.player2.score = message.player2.score;

			this.ball.target_pos = message.ball.pos;
		} else if (message.type === "gameOver") {
			this.state = GameState.GameOver;
			// Gerekirse kazanan/kaybeden bilgisini burada işleyebilirsiniz.
		}
	}

	update() {
		switch (this.state) {
			case GameState.Menu:
				if (this.mouseInput.has("Mouse0")) {
					const mousePos = this.mouseInput.get("Mouse0");
					this.uis.get(GameState.Menu)?.components.filter((component): component is Button => component instanceof Button).forEach(button => {
						if (mousePos && button.contains(mousePos))
							button.onClick(this);
					});
				}
				break;
			case GameState.GameOver:
				if (this.mouseInput.has("Mouse0")) {
					const mousePos = this.mouseInput.get("Mouse0");
					this.uis.get(GameState.GameOver)?.components.filter((component): component is Button => component instanceof Button).forEach(button => {
						if (mousePos && button.contains(mousePos))
							button.onClick(this);
					});
				}
				break;
		}
	}

	render() {

		switch (this.state) {
			case GameState.Menu:
				this.uis.get(GameState.Menu)?.draw(this);
				break;
			case GameState.Playing:
				this.uis.get(GameState.Playing)?.draw(this);
				break;
			case GameState.GameOver:
				this.uis.get(GameState.GameOver)?.draw(this);
				break;
		}
	}

	// EKLENDİ: İnterpolasyon mantığı (Lerp)
    private interpolatePositions() {
        // Top
        this.ball.pos.x += (this.ball.target_pos.x - this.ball.pos.x) * this.interpolationFactor;
        this.ball.pos.y += (this.ball.target_pos.y - this.ball.pos.y) * this.interpolationFactor;

        // Player 1 (Kendi oyuncunuz - aslında bu 'prediction' olmalı ama şimdilik 'interpolation' da olur)
        this.player1.pos.x += (this.player1.target_pos.x - this.player1.pos.x) * this.interpolationFactor;
        this.player1.pos.y += (this.player1.target_pos.y - this.player1.pos.y) * this.interpolationFactor;

        // Player 2 (Rakip)
        this.player2.pos.x += (this.player2.target_pos.x - this.player2.pos.x) * this.interpolationFactor;
        this.player2.pos.y += (this.player2.target_pos.y - this.player2.pos.y) * this.interpolationFactor;
    }

    // EKLENDİ: Döngüyü durdurmak için
    public stopGame() {
        const frameId = GlobalState.getAnimationFrameId();
        if (frameId) {
            cancelAnimationFrame(frameId);
            GlobalState.setAnimationFrameId(null);
        }
    }

	gameLoop() {
		// 1. İnterpolasyon (Sadece oynanış sırasında)
        if (this.state === GameState.Playing) {
            this.interpolatePositions();
        }

		this.ballTrail.push(new Vector2(this.ball.pos.x, this.ball.pos.y));
		if (this.ballTrail.length > 20) {
			this.ballTrail.shift();
		}
        // 2. Render (Her zaman)
        this.render();

        // 3. Bir sonraki kareyi iste
        // GlobalState'teki animationFrameId'yi kullanarak
        // sayfa değişiminde (onUnload) döngüyü durdurabiliriz.
        const frameId = requestAnimationFrame(this.gameLoop.bind(this));
        GlobalState.setAnimationFrameId(frameId);
	}
}
