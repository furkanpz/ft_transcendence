import { Socket } from "dgram";
import { GameRoom } from "../../types/game.types";
import { Vector2 } from "../../types/vector.types";
import { classicGameManager } from "./game.manager";
import { WebSocket } from "ws";

interface Ball {
	pos: Vector2;
	dir: Vector2;
	radius: number;
	speed: number;
}

interface Player {
	id: number;
	pos: Vector2;
	dim: Vector2;
	speed: number;
	score: number;
	socket?: WebSocket;
}

enum PlayerKeys {
	UP,
	DOWN
}

class ClassicGameInstance {
	private HEIGHT: number = 600;
	private WIDTH: number = 800;
	private PLAYER_HEIGHT: number = 100;
	private PLAYER_WIDTH: number = 15;
	private PLAYER_GAP: number = 10;
	private PLAYER_SPEED: number = 400;
	private BALL_START_SPEED: number = 300;
	private BALL_FIRST_HIT_SPEED: number = 450;
	private BALL_SPEED_INC: number = 25;
	private BALL_MAX_SPEED: number = 700;

	private ball: Ball = {
		pos: new Vector2(this.WIDTH / 2, this.HEIGHT / 2),
		dir: Vector2.I(),
		radius: 10,
		speed: this.BALL_START_SPEED,
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
		this.room = room;
		this.player1 = {
			id: player1,
			pos: new Vector2(this.WIDTH - this.PLAYER_GAP - this.PLAYER_WIDTH, this.HEIGHT / 2),
			dim: new Vector2(this.PLAYER_WIDTH, this.PLAYER_HEIGHT),
			speed: this.PLAYER_SPEED,
			score: 0,
		};
		this.player2 = {
			id: player2,
			pos: new Vector2(this.WIDTH - this.PLAYER_GAP - this.PLAYER_WIDTH, this.HEIGHT / 2),
			dim: new Vector2(this.PLAYER_WIDTH, this.PLAYER_HEIGHT),
			speed: this.PLAYER_SPEED,
			score: 0,
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
			if (message.type === "keyPress") {
				if (message.state === "down") {
					this.playerKeys.get(message.playerId)?.add(message.key);
				} else if (message.state === "up") {
					this.playerKeys.get(message.playerId)?.delete(message.key);
				}
			}
		});

		this.player2.socket?.on("message", (data) => {
			const message = JSON.parse(data.toString());
			if (message.type === "keyPress") {
				if (message.state === "down") {
					this.playerKeys.get(message.playerId)?.add(message.key);
				} else if (message.state === "up") {
					this.playerKeys.get(message.playerId)?.delete(message.key);
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
		this.updatePlayer(this.player1, ["w", "s"]);
		this.updatePlayer(this.player2, ["ArrowUp", "ArrowDown"]);
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

	updatePlayer(player: Player, keys: [string, string]) {
		if (this.playerKeys.get(player.id)?.has(keys[PlayerKeys.UP])) {
			if (player.pos.y - player.dim.y / 2 <= 0)
				player.pos.y = player.dim.y / 2;
			else
				player.pos = player.pos.sub(Vector2.J().mul(player.speed * this.deltaTime));
		}
		if (this.playerKeys.get(player.id)?.has(keys[PlayerKeys.DOWN])) {

			if (player.pos.y + player.dim.y / 2 >= this.HEIGHT)
				player.pos.y = this.HEIGHT - player.dim.y / 2;
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
			this.ball.speed = this.BALL_START_SPEED;
			this.ball.pos = new Vector2(this.WIDTH / 2, this.HEIGHT / 2);
			this.ball.dir = Vector2.I();
			this.ball.dir.y += (Math.random() / 2) - 1;
			this.ball.dir = this.ball.dir.norm();
		}
		else {
			this.ball.speed = this.BALL_START_SPEED;
			this.ball.pos = new Vector2(this.WIDTH / 2, this.HEIGHT / 2);
			this.ball.dir = Vector2.I().mul(-1);
			this.ball.dir.y += (Math.random() / 2) - 1;
			this.ball.dir = this.ball.dir.norm();
		}
		this.ballcount++;
	}

	updateBall() : void {

		if (this.ball.pos.x + this.ball.radius > this.WIDTH)
			this.setScore(this.player1);

		if (this.ball.pos.x - this.ball.radius < 0)
			this.setScore(this.player2);

		if (this.isCircleRectColliding(this.ball, this.player1)) {
			const bounceDir = new Vector2(-this.ball.dir.x, this.ball.dir.y);
			const newDir2 = bounceDir.y + ((this.ball.pos.y - this.player1.pos.y) / (this.player1.dim.y / 2));
			bounceDir.y = newDir2;
			if (this.firstTouch == false) {
				this.firstTouch = true;
				this.ball.speed = this.BALL_FIRST_HIT_SPEED;
			}
			else {
				this.ball.speed += this.BALL_SPEED_INC;
				if (this.ball.speed > this.BALL_MAX_SPEED)
					this.ball.speed = this.BALL_MAX_SPEED;
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
				this.ball.speed = this.BALL_FIRST_HIT_SPEED;
			}
			else {
				this.ball.speed += this.BALL_SPEED_INC;
				if (this.ball.speed > this.BALL_MAX_SPEED)
					this.ball.speed = this.BALL_MAX_SPEED;
			}
			this.ball.pos.x = (this.player2.pos.x - (this.player2.dim.x / 2)) - this.ball.radius;
			this.ball.dir = bounceDir.norm();
		}

		if (this.ball.pos.y + this.ball.radius > this.HEIGHT) {
			this.ball.pos.y = this.HEIGHT - this.ball.radius;
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
		this.ball.pos = new Vector2(this.WIDTH + (this.ball.radius * 2), this.HEIGHT + (this.ball.radius * 2));
		setTimeout(() => {
			this.ball.pos = new Vector2(this.WIDTH / 2, this.HEIGHT / 2);
		}, 1000);
		setTimeout(() => {
			this.scored = false;
			this.sendBall();
		}, 2000);
	}
}

export { ClassicGameInstance };
