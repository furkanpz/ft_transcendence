import { Socket } from "dgram";
import { Ball, GameRoom, HEIGHT, Player, WIDTH, BALL_FIRST_HIT_SPEED, BALL_START_SPEED, BALL_MAX_SPEED, BALL_SPEED_INC, PLAYER_GAP, PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_WIDTH, PlayerKeys} from "../../types/game.types";
import { Vector2 } from "../../types/vector.types";
import { classicGameManager } from "./game.manager";
import { WebSocket } from "ws";

class ClassicGameInstance {

	private ball: Ball = {
		pos: new Vector2(WIDTH / 2, HEIGHT / 2),
		dir: Vector2.I(),
		radius: 10,
		speed: BALL_START_SPEED,
	};

	private deltaTime: number = 0;
	private lastTime: number = 0;
	private playerKeys: Map<number, Set<string>> = new Map();
	private firstTouch: boolean = false;
	private ballcount: number = 0;
	private scored: boolean = false;
	player1: Player;
	player2: Player;
	room: GameRoom;

	public runtimeId: NodeJS.Timeout | null = null;

	constructor(player1: number, player2: number, room: GameRoom) {
		this.playerKeys.set(player1, new Set<string>());
		this.playerKeys.set(player2, new Set<string>());
		this.room = room;
		this.player1 = {
			id: player1,
			pos: new Vector2(PLAYER_GAP + PLAYER_WIDTH, HEIGHT / 2),
			dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
			speed: PLAYER_SPEED,
			score: 0,
			started: false,
		};
		this.player2 = {
			id: player2,
			pos: new Vector2(WIDTH - PLAYER_GAP - PLAYER_WIDTH, HEIGHT / 2),
			dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
			speed: PLAYER_SPEED,
			score: 0,
			started: false,
		};
	}

	setSocketForPlayer(playerId: number, socket: WebSocket) : void {
		if (this.player1.id === playerId) {
			this.player1.socket = socket;
		} else if (this.player2.id === playerId) {
			this.player2.socket = socket;
		}
	}

	startGame() {

		this.player1.socket?.on("message", (data) => {
			const message = JSON.parse(data.toString());
			if (message.action === "key") {
				if (message.type === "press") {
					console.log("Key pressed for player 1: " + message.key);
					this.playerKeys.get(this.player1.id)?.add(message.key);
				} else if (message.type === "release") {
					console.log("Key released for player 1: " + message.key);
					this.playerKeys.get(this.player1.id)?.delete(message.key);
				}
			}
		});

		this.player2.socket?.on("message", (data) => {
			const message = JSON.parse(data.toString());
			if (message.action === "key") {
				if (message.type === "press") {
					console.log("Key pressed for player 2: " + message.key);
					this.playerKeys.get(this.player2.id)?.add(message.key);
				} else if (message.type === "release") {
					console.log("Key released for player 2: " + message.key);
					this.playerKeys.get(this.player2.id)?.delete(message.key);
				}
			}
		});

		this.runtimeId = setInterval(() => {
			const currentTime = Date.now();
			if (this.lastTime === 0) this.lastTime = currentTime;
			this.deltaTime = (currentTime - this.lastTime) / 1000;
			this.lastTime = currentTime;
			this.updateGame();
		}, 1000 / 60);
	}

	updateGame() {
		this.updatePlayer(this.player1);
		this.updatePlayer(this.player2);
		if (!this.scored)
			this.updateBall();
		this.player1.socket?.send(JSON.stringify({
			type: "gameState",
			player1: {
				pos: this.player1.pos,
				score: this.player1.score,
			},
			player2: {
				pos: this.player2.pos,
				score: this.player2.score,
			},
			ball: {
				pos: this.ball.pos,
			},
		}));

		this.player2.socket?.send(JSON.stringify({
			type: "gameState",
			player1: {
				pos: this.player1.pos,
				score: this.player1.score,
			},
			player2: {
				pos: this.player2.pos,
				score: this.player2.score,
			},
			ball: {
				pos: this.ball.pos,
			},
		}));
	}

	endGame() : void {
		if (this.runtimeId) {
			clearInterval(this.runtimeId);
			this.runtimeId = null;
		}
		this.room.gameResult = {
			player1Id: this.player1.id,
			player2Id: this.player2.id,
			player1Score: this.player1.score,
			player2Score: this.player2.score,
		};
		classicGameManager.finishGame(this.room.id);
	}

	forceStop() {
		if (this.runtimeId) {
			clearInterval(this.runtimeId);
			this.runtimeId = null;
		}
	}

	updatePlayer(player: Player) {
		console.log(`${this.playerKeys.get(player.id)?.has("w")} | ${this.playerKeys.get(player.id)?.has("s")}`);
		if (this.playerKeys.get(player.id)?.has("w")) {
			if (player.pos.y - player.dim.y / 2 <= 0)
				player.pos.y = player.dim.y / 2;
			else
				player.pos = player.pos.sub(Vector2.J().mul(player.speed * this.deltaTime));
		}
		if (this.playerKeys.get(player.id)?.has("s")) {

			if (player.pos.y + player.dim.y / 2 >= HEIGHT)
				player.pos.y = HEIGHT - player.dim.y / 2;
			else
				player.pos = player.pos.add(Vector2.J().mul(player.speed * this.deltaTime));
		}
	}

	isCircleRectColliding(ball: Ball, player1: Player): boolean {
		const rectX = player1.pos.x - player1.dim.x / 2;
		const rectY = player1.pos.y - player1.dim.y / 2;

		const closestX = Math.max(rectX, Math.min(ball.pos.x, rectX + player1.dim.x));
		const closestY = Math.max(rectY, Math.min(ball.pos.y, rectY + player1.dim.y));

		const dx = ball.pos.x - closestX;
		const dy = ball.pos.y - closestY;

		return (dx * dx + dy * dy) < (ball.radius * ball.radius);
	}

	sendBall() {
		console.log("Player 1 Score: " + this.player1.score + " | Player 2 Score: " + this.player2.score);
		this.firstTouch = false;
		if (this.ballcount % 2 == 0) {
			this.ball.speed = BALL_START_SPEED;
			this.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
			this.ball.dir = Vector2.I();
			this.ball.dir.y += (Math.random() / 2) - 1;
			this.ball.dir = this.ball.dir.norm();
		}
		else {
			this.ball.speed = BALL_START_SPEED;
			this.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
			this.ball.dir = Vector2.I().mul(-1);
			this.ball.dir.y += (Math.random() / 2) - 1;
			this.ball.dir = this.ball.dir.norm();
		}
		this.ballcount++;
	}

	updateBall() : void {

		if (this.ball.pos.x + this.ball.radius > WIDTH)
			this.setScore(this.player1);

		if (this.ball.pos.x - this.ball.radius < 0)
			this.setScore(this.player2);

		if (this.isCircleRectColliding(this.ball, this.player1)) {
			const bounceDir = new Vector2(-this.ball.dir.x, this.ball.dir.y);
			const newDir2 = bounceDir.y + ((this.ball.pos.y - this.player1.pos.y) / (this.player1.dim.y / 2));
			bounceDir.y = newDir2;
			if (this.firstTouch == false) {
				this.firstTouch = true;
				this.ball.speed = BALL_FIRST_HIT_SPEED;
			}
			else {
				this.ball.speed += BALL_SPEED_INC;
				if (this.ball.speed > BALL_MAX_SPEED)
					this.ball.speed = BALL_MAX_SPEED;
			}
			this.ball.pos.x = (this.player1.pos.x + (this.player1.dim.x / 2)) + this.ball.radius;
			this.ball.dir = bounceDir.norm();
		}

		if (this.isCircleRectColliding(this.ball, this.player2)) {
			const bounceDir = new Vector2(-this.ball.dir.x, this.ball.dir.y);
			const newDir2 = bounceDir.y + ((this.ball.pos.y - this.player2.pos.y) / (this.player2.dim.y / 2));
			bounceDir.y = newDir2;
			if (this.firstTouch == false) {
				this.firstTouch = true;
				this.ball.speed = BALL_FIRST_HIT_SPEED;
			}
			else {
				this.ball.speed += BALL_SPEED_INC;
				if (this.ball.speed > BALL_MAX_SPEED)
					this.ball.speed = BALL_MAX_SPEED;
			}
			this.ball.pos.x = (this.player2.pos.x - (this.player2.dim.x / 2)) - this.ball.radius;
			this.ball.dir = bounceDir.norm();
		}

		if (this.ball.pos.y + this.ball.radius > HEIGHT) {
			this.ball.pos.y = HEIGHT - this.ball.radius;
			this.ball.dir.y *= -1;
		}
		else if (this.ball.pos.y - this.ball.radius < 0) {
			this.ball.pos.y = this.ball.radius;
			this.ball.dir.y *= -1;
		}
		this.ball.pos = this.ball.pos.add(this.ball.dir.mul(this.deltaTime * this.ball.speed));
	}

	setScore(player: Player) {
		this.scored = true;
		player.score++;
		if (player.score >= 5) {
			this.endGame();
			return;
		}
		this.ball.pos = new Vector2(WIDTH + (this.ball.radius * 2), HEIGHT + (this.ball.radius * 2));
		setTimeout(() => {
			this.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
		}, 1000);
		setTimeout(() => {
			this.scored = false;
			this.sendBall();
		}, 2000);
	}
}

export { ClassicGameInstance };
