class Vector2 {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
    add(other: Vector2): Vector2 {
        return new Vector2(this.x + other.x, this.y + other.y);
    }
    sub(other: Vector2): Vector2 {
        return new Vector2(this.x - other.x, this.y - other.y);
    }
    mul(scaler: number): Vector2 {
        return new Vector2(this.x * scaler, this.y * scaler);
    }
    div(scaler: number): Vector2 {
        if (scaler == 0)
            return Vector2.Zero();
        return new Vector2(this.x / scaler, this.y / scaler);
    }
    dot(other: Vector2): number {
        return (this.x * other.x) + (this.y * other.y);
    }
    lenght(): number {
        return Math.sqrt(this.dot(this));
    }
    norm(): Vector2 {
        return this.div(this.lenght());
    }
    static Zero(): Vector2 {
        return new Vector2(0, 0);
    }
    static I(): Vector2 {
        return new Vector2(1, 0);
    }
    static J(): Vector2 {
        return new Vector2(0, 1);
    }
}

interface Ball {
    pos: Vector2;
    dir: Vector2;
    radius: number;
    style: string | CanvasGradient | CanvasPattern;
    speed: number;
}

interface Player {
    pos: Vector2;
    dim: Vector2;
    style: string | CanvasGradient | CanvasPattern;
    speed: number;
    score: number;
}

interface Pong {
    ctx: CanvasRenderingContext2D;
    ball: Ball;
    player1: Player;
    player2: Player;
    lastTime: number;
}

const HEIGHT = 600;
const WIDTH = 800;
const PLAYER_HEIGHT = 100;
const PLAYER_WIDTH = 15;
const PLAYER_GAP = 10;
const PLAYER_SPEED = 400;
const BALL_SPEED = 600;

const canvas = document.createElement("canvas") as HTMLCanvasElement;
canvas.width = WIDTH;
canvas.height = HEIGHT;
document.body.appendChild(canvas);

const ctx = canvas.getContext("2d");

const pressedKeys = new Set<string>();

document.addEventListener("keydown", (event) => {
    pressedKeys.add(event.key);
})

document.addEventListener("keyup", (event) => {
    pressedKeys.delete(event.key);
})

if (ctx == null)
    throw Error("Failed to get canvas context.");

let ball: Ball = {
    pos: new Vector2(WIDTH / 2, HEIGHT / 2),
    dir: new Vector2(1, 1).norm(),
    radius: 25,
    speed: BALL_SPEED,
    style: "red"
}

let player1: Player = {
    pos: new Vector2(PLAYER_GAP, HEIGHT / 2),
    dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
    speed: PLAYER_SPEED,
    style: "blue",
    score: 0,
}

let player2: Player = {
    pos: new Vector2(WIDTH - PLAYER_WIDTH - PLAYER_GAP, HEIGHT / 2),
    dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
    speed: PLAYER_SPEED,
    style: "green",
    score: 0,
}

let game: Pong = {
    ctx: ctx,
    ball: ball,
    player1: player1,
    player2: player2,
    lastTime: 0,
};

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
    ctx.beginPath();
    ctx.fillStyle = ball.style;
    ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
    ctx.fillStyle = player.style;
    ctx.fillRect(player.pos.x, player.pos.y, player.dim.x, player.dim.y);
}

function updatePlayer1(deltaTime: number) {
    if (pressedKeys.has("w")) {
        if (game.player1.pos.y <= 0)
            game.player1.pos.y = 0;
        else
            game.player1.pos = game.player1.pos.sub(Vector2.J().mul(game.player1.speed * deltaTime));

    }
    if (pressedKeys.has("s")) {

        if (game.player1.pos.y >= HEIGHT - PLAYER_HEIGHT)
            game.player1.pos.y = HEIGHT - PLAYER_HEIGHT;
        else
            game.player1.pos = game.player1.pos.add(Vector2.J().mul(game.player1.speed * deltaTime));
    }
}

function updatePlayer2(deltaTime: number, isAI: boolean) {
    if (!isAI) {
        if (pressedKeys.has("ArrowUp")) {
            if (game.player2.pos.y <= 0)
                game.player2.pos.y = 0;
            else
                game.player2.pos = game.player2.pos.sub(Vector2.J().mul(game.player2.speed * deltaTime));
        }
        if (pressedKeys.has("ArrowDown")) {

            if (game.player2.pos.y >= HEIGHT - PLAYER_HEIGHT)
                game.player2.pos.y = HEIGHT - PLAYER_HEIGHT;
            else
                game.player2.pos = game.player2.pos.add(Vector2.J().mul(game.player2.speed * deltaTime));
        }
    }
    else {
        if (game.ball.pos.y < game.player2.pos.y) {
            if (game.player2.pos.y <= 0)
                game.player2.pos.y = 0;
            else
                game.player2.pos = game.player2.pos.sub(Vector2.J().mul(game.player2.speed * deltaTime));
        }
        if (game.ball.pos.y > game.player2.pos.y) {

            if (game.player2.pos.y >= HEIGHT - PLAYER_HEIGHT)
                game.player2.pos.y = HEIGHT - PLAYER_HEIGHT;
            else
                game.player2.pos = game.player2.pos.add(Vector2.J().mul(game.player2.speed * deltaTime));
        }
    }
}

function isCircleRectColliding(ball: Ball, player1: Player): boolean {
    // En yakın noktayı bul (dikdörtgene kenetlenmiş)
    const closestX = Math.max(player1.pos.x, Math.min(ball.pos.x, player1.pos.x + player1.dim.x));
    const closestY = Math.max(player1.pos.y, Math.min(ball.pos.y, player1.pos.y + player1.dim.y));

    // Daire merkezinden bu en yakın noktaya uzaklık
    const dx = ball.pos.x - closestX;
    const dy = ball.pos.y - closestY;

    return (dx * dx + dy * dy) <= (ball.radius * ball.radius);
}

function updateBall(deltaTime: number) {

    if (game.ball.pos.x + game.ball.radius > WIDTH) {
        game.player1.score++;
        ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
        ball.dir = Vector2.I();
        console.log(game.player1.score + " | " + game.player2.score)
    }

    if (game.ball.pos.x - game.ball.radius < 0) {
        game.player2.score++;
        ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
        ball.dir = Vector2.I().mul(-1);
        console.log(game.player1.score + " | " + game.player2.score)
    }

    if (isCircleRectColliding(game.ball, game.player1)) {
        const newDir = game.ball.pos.sub(game.player1.pos.add(game.player1.dim.div(2)).add(Vector2.I().mul(-25))).norm();
        game.ball.dir = newDir;
    }

    if (isCircleRectColliding(game.ball, game.player2)) {
        const newDir = game.ball.pos.sub(game.player2.pos.add(game.player2.dim.div(2)).add(Vector2.I().mul(25))).norm();
        game.ball.dir = newDir;
    }

    if (game.ball.pos.y + game.ball.radius > HEIGHT) {
        game.ball.pos.y = HEIGHT - game.ball.radius;
        game.ball.dir.y *= -1;
    }
    else if (game.ball.pos.y - game.ball.radius < 0) {
        game.ball.pos.y = game.ball.radius;
        game.ball.dir.y *= -1;
    }
    game.ball.pos = game.ball.pos.add(ball.dir.mul(deltaTime * game.ball.speed));
}

function update(deltaTime: number) {
    updatePlayer1(deltaTime);
    updatePlayer2(deltaTime, true);
    updateBall(deltaTime);
}

function drawBackground(ctx: CanvasRenderingContext2D)
{
    // Background
    ctx.fillStyle = "#303030";
    ctx.fillRect(0, 0, 1200, 900);
    // CenterLine
    ctx.strokeStyle = "#606060";
    ctx.beginPath();
    ctx.lineWidth = 10;
    ctx.moveTo(WIDTH / 2, 0);
    ctx.lineTo(WIDTH / 2, HEIGHT);
    ctx.stroke();
    // Scores
    ctx.fillStyle = "white"
    ctx.font = "50px Ariel"
    ctx.fillText(game.player1.score.toString(), WIDTH / 4, HEIGHT / 2);
    ctx.fillText(game.player2.score.toString(), 3 * WIDTH / 4, HEIGHT / 2);
}

function render(pong: Pong) {
    drawBackground(pong.ctx);
    drawBall(pong.ctx, game.ball);
    drawPlayer(pong.ctx, game.player1);
    drawPlayer(pong.ctx, game.player2);
}

function gameLoop(currentTime: number) {
    let deltaTime = Math.min(currentTime - game.lastTime, 100) / 1000;
    game.lastTime = currentTime;
    update(deltaTime);
    render(game);
    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
