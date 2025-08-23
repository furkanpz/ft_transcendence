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

interface Component {
    style: string;
    text: string;
    pos: Vector2;
    dim: Vector2;
    draw: (game: Pong) => void;
    contains: (point: Vector2) => boolean;
}

class Button implements Component {

    style: string;
    text: string;
    pos: Vector2;
    dim: Vector2;
    draw: (game: Pong) => void;
    onClick: (game: Pong) => void;
    contains: (point: Vector2) => boolean;

    constructor(style: string, text: string, pos: Vector2, dim: Vector2, onClick: (game: Pong) => void) {
        this.style = style;
        this.text = text;
        this.pos = pos;
        this.dim = dim;
        this.draw = (game: Pong) => {
            game.ctx.fillStyle = this.style;
            game.ctx.fillRect(this.pos.x - this.dim.x / 2, this.pos.y - this.dim.y / 2, this.dim.x, this.dim.y);
            game.ctx.fillStyle = "white";
            game.ctx.font = "30px Arial";
            game.ctx.textAlign = "center";
            game.ctx.textBaseline = "middle";
            game.ctx.fillText(this.text, this.pos.x, this.pos.y);
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
    draw: (game: Pong) => void;
}

enum GameState {
    Menu,
    Playing,
    GameOver
}

interface Pong {
    ctx: CanvasRenderingContext2D;
    ball: Ball;
    player1: Player;
    player2: Player;
    state: GameState;
    pressedKeys: Set<string>;
    mouseInput: Map<string, Vector2>;
    uis: Map<GameState, UI>;
    lastTime: number;
    scored: boolean;
    firstTouch: boolean;
    ballcount: number;
    isAI: boolean;
}

function drawMenuBackground(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = "#303030";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
}

export function gameStart(isAI: boolean) {

    const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    const ctx = canvas.getContext("2d");
    if (ctx == null)
        throw Error("Failed to get canvas context.");

    let game: Pong = {
        ctx: ctx,
        ball: {
            pos: new Vector2(WIDTH / 2, HEIGHT / 2),
            dir: Vector2.Zero(),
            radius: 10,
            speed: BALL_START_SPEED,
            style: "red"
        },
        player1: {
            pos: new Vector2(PLAYER_GAP, HEIGHT / 2),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            speed: PLAYER_SPEED,
            style: "blue",
            score: 0,
        },
        player2: {
            pos: new Vector2(WIDTH - PLAYER_WIDTH - PLAYER_GAP, HEIGHT / 2),
            dim: new Vector2(PLAYER_WIDTH, PLAYER_HEIGHT),
            speed: PLAYER_SPEED,
            style: "green",
            score: 0,
        },
        pressedKeys: new Set<string>(),
        mouseInput: new Map<string, Vector2>(),
        state: GameState.Menu,
        lastTime: 0,
        uis: new Map<GameState, UI>(),
        scored: false,
        firstTouch: false,
        ballcount: 0,
        isAI: isAI,
    };

    game.ball.dir = Vector2.I();
    game.ball.dir.y += (Math.random() / 2) - 1;
    game.ball.dir = game.ball.dir.norm();

    const menuUI: UI = {
        components: [
            new Button("red", "Start", new Vector2(WIDTH / 2, HEIGHT / 2), new Vector2(200, 100), (game: Pong) => {
                console.log("Game Started");
                
                game.state = GameState.Playing;
            }),
        ],
        draw: (game: Pong) => {
            drawMenuBackground(game.ctx);
            game.uis.get(GameState.Menu)?.components.forEach(component => component.draw(game));
        },
    };

    const playingUI: UI = {
        components: [],
        draw: (game: Pong) => {
            drawBackground(game);
            drawBall(game.ctx, game.ball);
            drawPlayer(game.ctx, game.player1);
            drawPlayer(game.ctx, game.player2);
        },
    };

    const gameOverUI: UI = {
        components: [
            new Button("blue", "Replay",  new Vector2(WIDTH / 2, (HEIGHT / 4) * 3), new Vector2(200, 100), (game: Pong) => {
                game.lastTime = 0;
                game.player1.score = 0;
                game.player2.score = 0;
                game.player1.pos = new Vector2(PLAYER_GAP, HEIGHT / 2);
                game.player2.pos = new Vector2(WIDTH - PLAYER_WIDTH - PLAYER_GAP, HEIGHT / 2);
                game.state = GameState.Playing;
            })
        ],
        draw: (game: Pong) => {
            drawMenuBackground(game.ctx);
            game.ctx.fillStyle = "white";
            game.ctx.font = "50px Arial";
            game.ctx.textAlign = "center";
            game.ctx.textBaseline = "middle";
            game.ctx.fillText("Game Over", WIDTH / 2, HEIGHT / 2);
            game.uis.get(GameState.GameOver)?.components.forEach(component => component.draw(game));

        },
    };

    game.uis.set(GameState.Menu, menuUI);
    game.uis.set(GameState.Playing, playingUI);
    game.uis.set(GameState.GameOver, gameOverUI);

    document.addEventListener("keydown", (event) => {
        console.log("Key pressed: " + event.key);
        game.pressedKeys.add(event.key);
    });

    document.addEventListener("keyup", (event) => {
        console.log("Key released: " + event.key);
        game.pressedKeys.delete(event.key);
    });

    canvas.addEventListener("mousedown", (event) => {
        const rect = canvas.getBoundingClientRect();
        console.log(event.clientX - rect.left, event.clientY - rect.top);
        const vec2 = new Vector2(event.clientX - rect.left, event.clientY - rect.top);
        game.mouseInput.set("Mouse" + event.button.toString(), vec2);
    });

    canvas.addEventListener("mouseup", (event) => {
        game.mouseInput.delete("Mouse" + event.button.toString());
    });

    gameLoop(game, 0);
}

const HEIGHT = 600;
const WIDTH = 800;
const PLAYER_HEIGHT = 100;
const PLAYER_WIDTH = 15;
const PLAYER_GAP = 10;
const PLAYER_SPEED = 400;
const BALL_START_SPEED = 300;
const BALL_FIRST_HIT_SPEED = 450;
const BALL_SPEED_INC = 25;
const BALL_MAX_SPEED = 700;

// Drawing

function drawBackground(game: Pong) {
    // Background
    game.ctx.fillStyle = "#303030";
    game.ctx.fillRect(0, 0, 1200, 900);
    // CenterLine
    game.ctx.strokeStyle = "#606060";
    game.ctx.beginPath();
    game.ctx.lineWidth = 10;
    game.ctx.moveTo(WIDTH / 2, 0);
    game.ctx.lineTo(WIDTH / 2, HEIGHT);
    game.ctx.stroke();
    // Scores
    game.ctx.fillStyle = "white"
    game.ctx.font = "50px Ariel"
    game.ctx.fillText(game.player1.score.toString(), WIDTH / 4, HEIGHT / 2);
    game.ctx.fillText(game.player2.score.toString(), 3 * WIDTH / 4, HEIGHT / 2);
}

function drawBall(ctx: CanvasRenderingContext2D, ball: Ball) {
    ctx.beginPath();
    ctx.fillStyle = ball.style;
    ctx.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
}

function drawPlayer(ctx: CanvasRenderingContext2D, player: Player) {
    ctx.fillStyle = player.style;
    ctx.fillRect(player.pos.x - player.dim.x / 2, player.pos.y - player.dim.y / 2, player.dim.x, player.dim.y);
}



// Drawing End

// Game Logic

function updatePlayer1(game: Pong, deltaTime: number) {
    if (game.pressedKeys.has("w")) {
        if (game.player1.pos.y - game.player1.dim.y / 2 <= 0)
            game.player1.pos.y = game.player1.dim.y / 2;
        else
            game.player1.pos = game.player1.pos.sub(Vector2.J().mul(game.player1.speed * deltaTime));

    }
    if (game.pressedKeys.has("s")) {

        if (game.player1.pos.y + game.player1.dim.y / 2 >= HEIGHT)
            game.player1.pos.y = HEIGHT - game.player1.dim.y / 2;
        else
            game.player1.pos = game.player1.pos.add(Vector2.J().mul(game.player1.speed * deltaTime));
    }
}

function updatePlayer2(game: Pong, deltaTime: number) {
    if (!game.isAI) {
        if (game.pressedKeys.has("ArrowUp")) {
            if (game.player2.pos.y - game.player2.dim.y / 2 <= 0)
                game.player2.pos.y = game.player2.dim.y / 2;
            else
                game.player2.pos = game.player2.pos.sub(Vector2.J().mul(game.player2.speed * deltaTime));
        }
        if (game.pressedKeys.has("ArrowDown")) {

            if (game.player2.pos.y + game.player2.dim.y / 2 >= HEIGHT)
                game.player2.pos.y = HEIGHT - game.player2.dim.y / 2;
            else
                game.player2.pos = game.player2.pos.add(Vector2.J().mul(game.player2.speed * deltaTime));
        }
    }
    else {
        if (game.ball.pos.y < game.player2.pos.y) {
            if (game.player2.pos.y - game.player2.dim.y / 2 <= 0)
                game.player2.pos.y = game.player2.dim.y / 2;
            else
                game.player2.pos = game.player2.pos.sub(Vector2.J().mul(game.player2.speed * deltaTime));
        }
        if (game.ball.pos.y > game.player2.pos.y) {

            if (game.player2.pos.y + game.player2.dim.y / 2 >= HEIGHT)
                game.player2.pos.y = HEIGHT - game.player2.dim.y / 2;
            else
                game.player2.pos = game.player2.pos.add(Vector2.J().mul(game.player2.speed * deltaTime));
        }
    }
}

function isCircleRectColliding(ball: Ball, player1: Player): boolean {
    // En yakın noktayı bul (dikdörtgene kenetlenmiş)
    const rectX = player1.pos.x - player1.dim.x / 2;
    const rectY = player1.pos.y - player1.dim.y / 2;

    const closestX = Math.max(rectX, Math.min(ball.pos.x, rectX + player1.dim.x));
    const closestY = Math.max(rectY, Math.min(ball.pos.y, rectY + player1.dim.y));

    const dx = ball.pos.x - closestX;
    const dy = ball.pos.y - closestY;

    return (dx * dx + dy * dy) < (ball.radius * ball.radius);
}

function sendBall(game: Pong) {
    game.firstTouch = false;
    if (game.ballcount % 2 == 0) {
        game.ball.speed = BALL_START_SPEED;
        game.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
        game.ball.dir = Vector2.I();
        game.ball.dir.y += (Math.random() / 2) - 1;
        game.ball.dir = game.ball.dir.norm();
    }
    else {
        game.ball.speed = BALL_START_SPEED;
        game.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
        game.ball.dir = Vector2.I().mul(-1);
        game.ball.dir.y += (Math.random() / 2) - 1;
        game.ball.dir = game.ball.dir.norm();
    }
    game.ballcount++;
}

async function updateBall(game: Pong, deltaTime: number) {

    console.log("Ball Speed: " + game.ball.speed);
    if (game.ball.pos.x + game.ball.radius > WIDTH) {
        game.scored = true;
        game.player1.score++;
        if (game.player1.score >= 5) {
            game.state = GameState.GameOver;
        }
        console.log(game.player1.score + " | " + game.player2.score)
        game.ball.pos = new Vector2(WIDTH + (game.ball.radius * 2), HEIGHT + (game.ball.radius * 2));
        setTimeout(() => {
            game.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
        }, 1000);
        setTimeout(() => {
            game.scored = false;
            sendBall(game);
        }, 2000);
    }

    if (game.ball.pos.x - game.ball.radius < 0) {
        game.scored = true;
        game.player2.score++;
        if (game.player2.score >= 5) {
            game.state = GameState.GameOver;
        }
        console.log(game.player1.score + " | " + game.player2.score)
        game.ball.pos = new Vector2(WIDTH + (game.ball.radius * 2), HEIGHT + (game.ball.radius * 2));
        setTimeout(() => {
            game.ball.pos = new Vector2(WIDTH / 2, HEIGHT / 2);
        }, 1000);
        setTimeout(() => {
            game.scored = false;
            sendBall(game);
        }, 2000);
    }

    if (isCircleRectColliding(game.ball, game.player1)) {
        const bounceDir = new Vector2(-game.ball.dir.x, game.ball.dir.y);
        const newDir2 = bounceDir.y + ((game.ball.pos.y - game.player1.pos.y) / (game.player1.dim.y / 2));

        bounceDir.y = newDir2;
        
        if (game.firstTouch == false) {
            game.firstTouch = true;
            game.ball.speed = BALL_FIRST_HIT_SPEED;
        }
        else {
            game.ball.speed += BALL_SPEED_INC;
            if (game.ball.speed > BALL_MAX_SPEED)
                game.ball.speed = BALL_MAX_SPEED;
        }
        game.ball.pos.x = (game.player1.pos.x + (game.player1.dim.x / 2)) + game.ball.radius;
        game.ball.dir = bounceDir.norm();
    }
    
    if (isCircleRectColliding(game.ball, game.player2)) {

        const bounceDir = new Vector2(-game.ball.dir.x, game.ball.dir.y);
        const newDir2 = bounceDir.y + ((game.ball.pos.y - game.player2.pos.y) / (game.player2.dim.y / 2));

        bounceDir.y = newDir2;
        
        if (game.firstTouch == false) {
            game.firstTouch = true;
            game.ball.speed = BALL_FIRST_HIT_SPEED;
        }
        else {
            game.ball.speed += BALL_SPEED_INC;
            if (game.ball.speed > BALL_MAX_SPEED)
                game.ball.speed = BALL_MAX_SPEED;
        }
        game.ball.pos.x = (game.player2.pos.x - (game.player2.dim.x / 2)) - game.ball.radius;
        game.ball.dir = bounceDir.norm();
    }

    if (game.ball.pos.y + game.ball.radius > HEIGHT) {
        game.ball.pos.y = HEIGHT - game.ball.radius;
        game.ball.dir.y *= -1;
    }
    else if (game.ball.pos.y - game.ball.radius < 0) {
        game.ball.pos.y = game.ball.radius;
        game.ball.dir.y *= -1;
    }
    game.ball.pos = game.ball.pos.add(game.ball.dir.mul(deltaTime * game.ball.speed));
}

// Game Logic End

function update(game: Pong, deltaTime: number) {
    switch (game.state) {
        case GameState.Menu:
            if (game.mouseInput.has("Mouse0")) {
                const mousePos = game.mouseInput.get("Mouse0");
                game.uis.get(GameState.Menu)?.components.filter((component): component is Button => component instanceof Button).forEach(button => {
                    if (mousePos && button.contains(mousePos))
                        button.onClick(game);
                });
            }
            break;
        case GameState.Playing:
            updatePlayer1(game, deltaTime);
            updatePlayer2(game, deltaTime, false);
            if (!game.scored)
                updateBall(game, deltaTime);
            break;
        case GameState.GameOver:
            if (game.mouseInput.has("Mouse0")) {
                const mousePos = game.mouseInput.get("Mouse0");
                game.uis.get(GameState.GameOver)?.components.filter((component): component is Button => component instanceof Button).forEach(button => {
                    if (mousePos && button.contains(mousePos))
                        button.onClick(game);
                });
            }
            break;
    }
}

function render(game: Pong) {

    switch (game.state) {
        case GameState.Menu:
            game.uis.get(GameState.Menu)?.draw(game);
            break;
        case GameState.Playing:
            game.uis.get(GameState.Playing)?.draw(game);
            break;
        case GameState.GameOver:
            game.uis.get(GameState.GameOver)?.draw(game);
            break;
    }
}

export function gameLoop(game: Pong, currentTime: number) {
    let deltaTime = Math.min(currentTime - game.lastTime, 100) / 1000;
    game.lastTime = currentTime;
    update(game, deltaTime);
    render(game);
    requestAnimationFrame((time) => gameLoop(game, time));
}

//YUKARISI BUGRAYA AIT

window.addEventListener("popstate", (e) => {
    const app = document.getElementById("app");
    if (!app) return;
    const state = e.state;
    if (state?.page === "home") {
        app.innerHTML = HomePage();
    } else if (state?.page === "login") {
        app.innerHTML = LoginPage();
    }
    else if (state?.page === "signup") {
        app.innerHTML = SignUpPage();
    }

});

function updateNavUser() {
    const username = localStorage.getItem("username");
    const authButton = document.getElementById("authButton");
    const logoutButton = document.getElementById("logout");

    if (username) {
        if (authButton) {

            authButton.textContent = username;
            authButton.onclick = null; // tıklanmasın
            authButton.classList.remove("hover:text-amber-400");
            authButton.classList.remove("cursor-pointer");
        }
        if (logoutButton) {
            logoutButton!.classList.remove("hidden");

            logoutButton!.textContent = "Logout";
            logoutButton!.onclick = () => {
                localStorage.removeItem("username");
                fetch(`http://localhost:3000/api/auth/logout`, {
                    method: "POST",
                    credentials: "include"
                })
                updateNavUser();
                loadPage(HomePage, "home");
            };
        }
    } else if (authButton) {
        authButton.textContent = "Login";
        authButton.onclick = () => loadPage(LoginPage, "login");
        authButton.classList.add("hover:text-amber-400");
        authButton.classList.add("cursor-pointer");
    }
}

export function login(event: Event) {
    event.preventDefault();
    const email = document.getElementById("email") as HTMLInputElement;
    const password = document.getElementById("password") as HTMLInputElement;
    fetch(`http://localhost:3000/api/auth/sign-in`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username: email.value,
            password: password.value
        })
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.success == true) {
                localStorage.setItem("username", email.value);
                loadPage(HomePage, "home");
            }
            else {
                alert("Login Failed: " + data.message);
                loadPage(LoginPage, "login");
            }
        });
}

export function signUp(event: Event) {
    event.preventDefault();
    const username = document.getElementById("username") as HTMLInputElement;
    const email = document.getElementById("email") as HTMLInputElement;
    const password = document.getElementById("password") as HTMLInputElement;
    const confirmPassword = document.getElementById("confirmPassword") as HTMLInputElement;
    if (password.value !== confirmPassword.value) {
        alert("Passwords do not match!");
        return;
    }
    fetch(`http://localhost:3000/api/auth/sign-up`, {
        method: "POST",
        credentials: "include",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email.value,
            username: username.value,
            password: password.value
        })
    })
        .then(response => response.json())
        .then(data => {
            if (data.success == true) {
                alert("Sign-up Success! You can now log in.");
                loadPage(LoginPage, "login");
            }
            else {
                alert("Sign-up Failed: " + data.message);
            }
        });
}

export function SignUpPage(): string {
    return `
    <div id="signUpArea" class="mx-32 min-h-[92vh] items-center flex flex-col justify-center text-center gap-6 ">
    <form method="post" class="bg-blue-500 rounded-2xl min-w-2xl p-12 items-center flex flex-col justify-center text-center gap-6">
    <input type="text" id="username" placeholder="Username" class="bg-white p-1"></input>
    <input type="text" id="email" placeholder="Email" class="bg-white p-1"></input>
    <input type="password" id="password" placeholder="Password" class="bg-white p-1"></input>
    <input type="password" id="confirmPassword" placeholder="Confirm Password" class="bg-white p-1"></input>
    <button type="submit" onclick="signUp(event)" class="bg-white text-black py-2 px-4 rounded">Sign-Up</button>
    </form>
    <div class="flex flex-row w-2xl  justify-between items-center gap-4">
    <button id="toggleSignUp" class="underline cursor-pointer" onclick="loadPage(LoginPage, 'login')">Already have an account? Sign In</button>
    </div>
    </div>
    `;
}

export function LoginPage(): string {
    return `
        <div id="loginArea" class="mx-32 min-h-[92vh] items-center flex flex-col justify-center text-center gap-6 ">
            <form method="post" class="bg-blue-500 rounded-2xl min-w-2xl p-12 items-center flex flex-col justify-center text-center gap-6">
                <input type="text" id="email" placeholder="Email" class="bg-white p-1"></input>
                <input type="password" id="password" placeholder="Password" class="bg-white p-1"></input>
                <button type="submit" onclick="login(event)" class="bg-white text-black py-2 px-4 rounded">Login</button>
            </form>
            <div class="flex flex-row w-2xl  justify-between items-center gap-4">
                <button id="toggleSignUp" class="underline cursor-pointer" onclick="loadPage(SignUpPage, 'signup')">Don't have an account? Sign Up</button>
            </div>
        </div>
    `;
}

export function Lobby(): string {
    return `
        <a href="/">

            <div class="flex justify-between items-start px-24 py-2 w-auto text-slate-800 text-lg border-2 p-4 rounded-lg mx-128">
              
              <div class="flex flex-col  h-full w-1/4 text-center">
                <div class="w-full ">
                  <span class="text-md text-slate-500">ID</span>
                </div>
                <div class="  w-full my-auto">
                  <span class="truncate text-lg font-semibold">RandomID</span>
                </div>
              </div>

              <div class="flex flex-col  h-full w-1/4 text-center">
                <div class="w-full ">
                  <span class="text-md text-slate-500">Player Count</span>
                </div>
                <div class="  w-full my-auto">
                  <span class="truncate text-lg ">1/2</span>
                </div>
              </div>

              <div class="flex flex-col  h-full w-1/4 text-center">
                <div class="w-full ">
                  <span class="text-md text-slate-500">Status</span>
                </div>
                <div class=" text-xs truncate my-auto">
                  <span class=" text-lg overflow-hidden whitespace-nowrap">Online</span>
                </div>
              </div>

              <div class="flex flex-col  h-full w-1/4 text-center">
                <div class="  w-full my-auto">
                  <button onclick="alert('naber yavrum')" class="text-lg p-4 bg-blue-500 rounded-2xl text-white ">Join</button>
                </div>
              </div>
            </div>
          </a>
    `;
}

export function ProfilePage(userData: { username: string, email: string }) {
    return `
        <div id="profileArea" class="profile-area">
            <h1>Profile</h1>
            <p>Username: <span id="usernameDisplay">${userData.username}</span></p>
            <p>Email: <span id="emailDisplay">${userData.email}</span></p>
        </div>
    `;
}

export function loadPage(page: () => string, pageName: string = "home") {

    const app = document.getElementById("app");
    if (app) {
        history.pushState({ page: pageName }, `${pageName}`, `/#${pageName}`);
        app.innerHTML = page();
        updateNavUser();
    }
}

export function Canvas() {
    return `
    <div class="items-center justify-center flex text-center border-2">
    <canvas id="canvas" class="border-2 border-amber-500">
    
    </canvas>
    </div>
    `
}

export function HomePage(): string {
    return `
    <div class="mx-32">

        <!-- Logo and Title -->
        
        <!-- main body-->
         <div class="mx-32 h-[92vh] text-center items-center flex flex-col justify-center gap-6">
            <div class="flex  flex-row w-2xl justify-between gap-6">
            <button onclick="loadPage(Canvas, 'canvas'); gameStart(false)" class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">1v1</button>
            <button onclick="loadPage(Canvas, 'canvas'); gameStart(true)" class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">Single Player</button>
            </div>
            
          </button>
          <button onclick="loadPage(Lobby, 'lobby')" class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
            Multiplayer
          </button>
        <button id="logout" class="hidden bg-red-500 text-white px-4 py-2 rounded">Logout</button>
        </div>


      </div>
    `;
}


window.addEventListener("DOMContentLoaded", () => {
    const app = document.getElementById("app");
    const hash = window.location.hash;

    if (!app) return;

    if (hash === "#login") {
        history.replaceState({ page: "login" }, "login", "/#login");
        loadPage(LoginPage, "login");
    } else if (hash === "#signup") {
        history.replaceState({ page: "signup" }, "signup", "/#signup");
        loadPage(SignUpPage, "signup");
    } else {
        history.replaceState({ page: "home" }, "home", "/#home");
        loadPage(HomePage, "home");
    }
});

(window as any).Canvas = Canvas;
(window as any).gameStart = gameStart;
(window as any).gameLoop = gameLoop;
(window as any).Lobby = Lobby;
(window as any).HomePage = HomePage;
(window as any).loadPage = loadPage;
(window as any).LoginPage = LoginPage;
(window as any).loadLoginPage = LoginPage;
(window as any).loadSignUpPage = SignUpPage;
(window as any).loadHomePage = HomePage;
(window as any).login = login;
(window as any).signUp = signUp;
(window as any).SignUpPage = SignUpPage;
// main.ts'in en altına ekle
// (window as any).login = login;
// (window as any).signUp = signUp;
// (window as any).toggleSignUp = toggleSignUp;
// (window as any).LoginPage = LoginPage;
// (window as any).loadPage = loadPage;
