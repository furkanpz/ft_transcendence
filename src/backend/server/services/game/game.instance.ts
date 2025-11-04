import { Ball, GameRoom, HEIGHT, Player, WIDTH, BALL_FIRST_HIT_SPEED, BALL_START_SPEED, BALL_MAX_SPEED, BALL_SPEED_INC, PLAYER_GAP, PLAYER_HEIGHT, PLAYER_SPEED, PLAYER_WIDTH, PlayerKeys, ClassicGameResult, GameType} from "../../types/game.types";
import { Vector2 } from "../../types/vector.types";
import { gameManager } from "./game.manager";
import { tournamentManager } from "./tournament.manager";
import { WebSocket } from "ws";
import * as userServices from "../user/user.services";

export interface GameInstance {
    setSocketForPlayer(playerId: number, socket: WebSocket) : void;
    startGame() : void;
    endGame() : void;
    forceStop() : void;
    storeResult() : void;
}

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
    players: Player[] = [];
    room: GameRoom;

    public runtimeId: NodeJS.Timeout | null = null;

    constructor(players: number[], room: GameRoom) {
        this.playerKeys.set(players[0], new Set<string>());
        this.playerKeys.set(players[1], new Set<string>());
        this.room = room;
        this.players.push({
            id: players[0], 
            pos: new Vector2(PLAYER_GAP + PLAYER_WIDTH, HEIGHT / 2),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            speed: PLAYER_SPEED,
            score: 0,
            started: false,
        });
        this.players.push({
            id: players[1], 
            pos: new Vector2(WIDTH - PLAYER_GAP - PLAYER_WIDTH, HEIGHT / 2),
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
        if (this.playerKeys.get(player.id)?.has("up")) {
            if (player.pos.y - player.dim.y / 2 <= 0)
                player.pos.y = player.dim.y / 2;
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

    private setScore(player: Player) {
        this.scored = true;
        player.score++;
        if (player.score >= 5) {
            this.endGame();
            return;
        }
        this.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
        setTimeout(() => {
            this.scored = false;
            this.sendBall();
        }, 2000);
    }

    public storeResult() : void {
        if (this.room.roomType === GameType.Tournament && this.players.length === 2) {
            const player1 = this.players[0];
            const player2 = this.players[1];
            tournamentManager.handleMatchResult(
                this.room.id, 
                player1.id, 
                player2.id, 
                player1.score, 
                player2.score
            );
        }
        
        if (this.players.length === 2 && this.room.roomType !== GameType.Tournament) {
            const player1 = this.players[0];
            const player2 = this.players[1];
            const winner = player1.score > player2.score ? player1 : player2;
            const loser = player1.score > player2.score ? player2 : player1;
            
            const matchType: 'classic' | 'tournament' | 'multiplayer' = 
                this.room.roomType === GameType.Multiplayer ? 'multiplayer' : 'classic';
            
            userServices.saveMatchHistory(
                player1.id,
                player2.id,
                winner.id,
                loser.id,
                player1.score,
                player2.score,
                matchType
            ).catch(err => console.error('Failed to save match history:', err));
            
            userServices.incrementUserWins(winner.id).catch(err => 
                console.error('Failed to increment wins:', err)
            );
            userServices.incrementUserLosses(loser.id).catch(err => 
                console.error('Failed to increment losses:', err)
            );
        }
        
        this.players.forEach((player) => {
            player.socket?.send(JSON.stringify({
                action: "gameEnded",
                result: {
                    players: this.players.map((p) => ({
                        id: p.id,
                        score: p.score,
                    })),
                }
            }));
        });
    }
}

export { ClassicGameInstance };