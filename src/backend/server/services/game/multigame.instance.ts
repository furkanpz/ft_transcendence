import { Ball, BALL_FIRST_HIT_SPEED, BALL_MAX_SPEED, BALL_SPEED_INC, BALL_START_SPEED, GameRoom, MULTI_HEIGHT, MULTI_PLAYER_GAP, MULTI_PLAYER_HEIGHT, MULTI_PLAYER_WIDTH, MULTI_WIDTH, Player, PLAYER_SPEED } from "../../types/game.types";
import { Vector2 } from "../../types/vector.types";
import { GameInstance } from "./game.instance";
import { gameManager } from "./game.manager";
import { WebSocket } from "ws";
import * as userServices from "../user/user.services";

const HEIGHT: number = MULTI_HEIGHT;
const WIDTH: number = MULTI_WIDTH;
const PLAYER_HEIGHT: number = MULTI_PLAYER_HEIGHT;
const PLAYER_WIDTH: number = MULTI_PLAYER_WIDTH;
const PLAYER_GAP: number = MULTI_PLAYER_GAP;

class MultiplayerGameInstance implements GameInstance {

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
    players: Player[] = [];
    room: GameRoom;

    public runtimeId: NodeJS.Timeout | null = null;

    constructor(players: number[], room: GameRoom) {
        players.forEach((p) => {
            this.playerKeys.set(p, new Set<string>());
        });
        this.room = room;
        this.players.push({
            id: players[0], // Team 1
            pos: new Vector2(PLAYER_GAP + PLAYER_WIDTH, HEIGHT / 4),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            speed: PLAYER_SPEED,
            score: 0,
            started: false,
        });
        this.players.push({
            id: players[1], // Team 2
            pos: new Vector2(WIDTH - PLAYER_GAP - PLAYER_WIDTH, HEIGHT / 4),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            speed: PLAYER_SPEED,
            score: 0,
            started: false,
        });
        this.players.push({
            id: players[2], // Team 1
            pos: new Vector2(PLAYER_GAP + PLAYER_WIDTH, 3 * HEIGHT / 4),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            speed: PLAYER_SPEED,
            score: 0,
            started: false,
        });
        this.players.push({
            id: players[3], // Team 2
            pos: new Vector2(WIDTH - PLAYER_GAP - PLAYER_WIDTH, 3 * HEIGHT / 4),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            speed: PLAYER_SPEED,
            score: 0,
            started: false,
        });
    }

    public setSocketForPlayer(playerId: number, socket: WebSocket) : void {
        const player = this.players.find(p => p.id === playerId);
        if (player) {
            player.socket = socket;
        }
    }

    public startGame() {

        this.players.forEach((player) => {
            player.socket?.on("message", (data) => {
                const message = JSON.parse(data.toString());
                if (message.action === "key") {
                    if (message.type === "press") {
                        this.playerKeys.get(player.id)?.add(message.key);
                    } else if (message.type === "release") {
                        this.playerKeys.get(player.id)?.delete(message.key);
                    }
                }
            });
        });

        this.sendBall();

        this.runtimeId = setInterval(() => {
            const currentTime = Date.now();
            if (this.lastTime === 0) this.lastTime = currentTime;
            this.deltaTime = (currentTime - this.lastTime) / 1000;
            this.lastTime = currentTime;

            const maxDeltaTime = 1 / 30;
            if (this.deltaTime > maxDeltaTime) {
                this.deltaTime = maxDeltaTime;
            }

            this.updateGame();
        }, 1000 / 60);
    }

    private updateGame() {
        this.players.forEach((player) => {
            this.updatePlayer(player);
        });
        if (!this.scored)
            this.updateBall();

        this.players.forEach((player) => {
            player.socket?.send(JSON.stringify({
                type: "gameState",
                players: this.players.map(p => ({
                    id: p.id,
                    pos: p.pos,
                    score: p.score,
                })),
                ball: {
                    pos: this.ball.pos,
                },
             }));
        });
    }

    public endGame() : void {
        if (this.runtimeId) {
            clearInterval(this.runtimeId);
            this.runtimeId = null;
        }
        this.storeResult();
        gameManager.removeRoom(this.room.id);
    }


    public forceStop() {
        if (this.runtimeId) {
            clearInterval(this.runtimeId);
            this.runtimeId = null;
        }
    }

    private updatePlayer(player: Player) {
		if (this.players.findIndex(p => p.id === player.id) === 0 || this.players.findIndex(p => p.id === player.id) === 1) {
			if (this.playerKeys.get(player.id)?.has("up")) {
				if (player.pos.y - player.dim.y / 2 <= 0)
					player.pos.y = player.dim.y / 2;
				else
					player.pos = player.pos.sub(Vector2.J().mul(player.speed * this.deltaTime));
			}
			if (this.playerKeys.get(player.id)?.has("down")) {
	
				if (player.pos.y + player.dim.y / 2 >= HEIGHT / 2)
					player.pos.y = HEIGHT / 2 - player.dim.y / 2;
				else
					player.pos = player.pos.add(Vector2.J().mul(player.speed * this.deltaTime));
			}
		} else {
			if (this.playerKeys.get(player.id)?.has("up")) {
				if (player.pos.y - player.dim.y / 2 <= HEIGHT / 2)
					player.pos.y = HEIGHT / 2 + player.dim.y / 2;
				else
					player.pos = player.pos.sub(Vector2.J().mul(player.speed * this.deltaTime));
			}
			if (this.playerKeys.get(player.id)?.has("down")) {
	
				if (player.pos.y + player.dim.y / 2 >= HEIGHT)
					player.pos.y = HEIGHT - player.dim.y / 2;
				else
					player.pos = player.pos.add(Vector2.J().mul(player.speed * this.deltaTime));
			}
		}
    }

    private isCircleRectColliding(ball: Ball, player: Player): boolean {
        const rectX = player.pos.x - player.dim.x / 2;
        const rectY = player.pos.y - player.dim.y / 2;

        const closestX = Math.max(rectX, Math.min(ball.pos.x, rectX + player.dim.x));
        const closestY = Math.max(rectY, Math.min(ball.pos.y, rectY + player.dim.y));

        const dx = ball.pos.x - closestX;
        const dy = ball.pos.y - closestY;

        return (dx * dx + dy * dy) < (ball.radius * ball.radius);
    }

    private sendBall() {
        this.firstTouch = false;
        this.ball.speed = BALL_START_SPEED;
        this.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);

        const maxAngleRad = Math.PI / 4;
        let angle = (Math.random() * 2 * maxAngleRad) - maxAngleRad; 

        let dirY = Math.sin(angle);
        let dirX = Math.cos(angle); 

        if (this.ballcount % 2 == 0) {
            this.ball.dir = new Vector2(dirX, dirY);
        } else {
            this.ball.dir = new Vector2(-dirX, dirY);
        }
        this.ballcount++;
    }

    private updateBall() : void {

        const maxBounceAngle = Math.PI / 3;

        this.ball.pos = this.ball.pos.add(this.ball.dir.mul(this.deltaTime * this.ball.speed));
        
        let didBounce = false;
        for (const player of this.players) {
            if (this.isCircleRectColliding(this.ball, player)) {
                
                let relativeHitPos = (this.ball.pos.y - player.pos.y) / (player.dim.y / 2);
                relativeHitPos = Math.max(-1, Math.min(1, relativeHitPos));

                let bounceAngle = relativeHitPos * maxBounceAngle;

                let newDirX: number;
                let correctionX: number;

                if (player.pos.x < WIDTH / 2) {
                    newDirX = Math.cos(bounceAngle);
                    correctionX = (player.pos.x + (player.dim.x / 2)) + this.ball.radius;
                } else {
                    newDirX = -Math.cos(bounceAngle);
                    correctionX = (player.pos.x - (player.dim.x / 2)) - this.ball.radius;
                }

                this.ball.dir = new Vector2(newDirX, Math.sin(bounceAngle));
                this.ball.pos.x = correctionX;

                if (this.firstTouch == false) {
                    this.firstTouch = true;
                    this.ball.speed = BALL_FIRST_HIT_SPEED;
                } else {
                    this.ball.speed += BALL_SPEED_INC;
                    if (this.ball.speed > BALL_MAX_SPEED)
                        this.ball.speed = BALL_MAX_SPEED;
                }

                didBounce = true;
                break;
            }
        }

        if (!didBounce) {
            if (this.ball.pos.x + this.ball.radius > WIDTH) {
                this.setScore(this.players[0]); 
                return;
            } else if (this.ball.pos.x - this.ball.radius < 0) {
                this.setScore(this.players[1]);
                return;
            }
        }

        if (this.ball.pos.y + this.ball.radius > HEIGHT) {
            this.ball.pos.y = HEIGHT - this.ball.radius;
            this.ball.dir.y *= -1;
        } else if (this.ball.pos.y - this.ball.radius < 0) {
            this.ball.pos.y = this.ball.radius;
            this.ball.dir.y *= -1;
        }
    }

    private setScore(scoringPlayer: Player) {
        this.scored = true;

        let team1Scored = (scoringPlayer.id === this.players[0].id || scoringPlayer.id === this.players[2].id);

        let teamToUpdate: Player[];
        let otherTeamScore: number;

        if (team1Scored) {
            teamToUpdate = [this.players[0], this.players[2]];
            otherTeamScore = this.players[1].score;
        } else {
            teamToUpdate = [this.players[1], this.players[3]];
            otherTeamScore = this.players[0].score;
        }

        let newScore = 0;
        teamToUpdate.forEach(p => {
            p.score++;
            newScore = p.score;
        });

        if (newScore >= 5) {
            this.endGame();
            return;
        }

        this.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
        setTimeout(() => {
            this.scored = false;
            this.sendBall();
        }, 2000);
    }

    public storeResult() {
        // For multiplayer (4 players), save each pair's results
        if (this.players.length === 4) {
            // Team 1: players[0] and players[1]
            // Team 2: players[2] and players[3]
            const team1Score = this.players[0].score;
            const team2Score = this.players[2].score;
            
            const team1Players = [this.players[0], this.players[1]];
            const team2Players = [this.players[2], this.players[3]];
            
            const winningTeam = team1Score > team2Score ? team1Players : team2Players;
            const losingTeam = team1Score > team2Score ? team2Players : team1Players;
            
            // Update stats for each player (skip guests)
            winningTeam.forEach(player => {
                userServices.incrementUserWins(player.id).catch(err => 
                    console.error('Failed to increment wins:', err)
                );
            });
            
            losingTeam.forEach(player => {
                userServices.incrementUserLosses(player.id).catch(err => 
                    console.error('Failed to increment losses:', err)
                );
            });
            
            // Save match history for team matchups (skips if guests involved)
            // Team 1 player 1 vs Team 2 player 1
            userServices.saveMatchHistory(
                this.players[0].id,
                this.players[2].id,
                winningTeam[0].id,
                losingTeam[0].id,
                team1Score,
                team2Score,
                'multiplayer'
            ).catch(err => console.error('Failed to save match history:', err));
        }
        
        this.players.forEach((player) => {
            player.socket?.send(JSON.stringify({
                action: "gameEnded",
                result: {
                    players: this.players.map((p) => ({
                        id: p.id,
                        score: p.score,
                    }))
                }
            }));
        });
    }
}

export { MultiplayerGameInstance };