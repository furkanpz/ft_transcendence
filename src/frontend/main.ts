
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

function gameStart()
{
const canvas = document.getElementById("canvas") as HTMLCanvasElement;
canvas.width = WIDTH;
canvas.height = HEIGHT
const ctx = canvas.getContext("2d");
gameLoop(0);
}

const HEIGHT = 600;
const WIDTH = 800;
const PLAYER_HEIGHT = 100;
const PLAYER_WIDTH = 15;
const PLAYER_GAP = 10;
const PLAYER_SPEED = 400;
const BALL_SPEED = 600;


// document.body.appendChild(canvas);


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

export function gameLoop(currentTime: number) {
    let deltaTime = Math.min(currentTime - game.lastTime, 100) / 1000;
    game.lastTime = currentTime;
    update(deltaTime);
    render(game);
    requestAnimationFrame(gameLoop);
}

// requestAnimationFrame(gameLoop);




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
        if (authButton)
        {

            authButton.textContent = username;
            authButton.onclick = null; // tıklanmasın
            authButton.classList.remove("hover:text-amber-400");
            authButton.classList.remove("cursor-pointer");
        }
        if (logoutButton)
        {
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
    } else if (authButton){
        authButton.textContent = "Login";
        authButton.onclick = () => loadPage(LoginPage, "login");
        authButton.classList.add("hover:text-amber-400");
        authButton.classList.add("cursor-pointer");
    }
}



export function login(event : Event)
{
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
        if (data.success == true)
        {
            localStorage.setItem("username", email.value);
            loadPage(HomePage, "home");
        }
        else
        {
            alert("Login Failed: " + data.message);
            loadPage(LoginPage, "login");
        }
    });
}

export function signUp(event: Event)
{
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
        if (data.success == true)
        {
            alert("Sign-up Success! You can now log in.");
            loadPage(LoginPage, "login");
        }
        else
        {
            alert("Sign-up Failed: " + data.message);
        }
    });
}

export function SignUpPage() : string
{
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

export function LoginPage() : string
{
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

export function Lobby() : string
{
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

export function ProfilePage(userData: { username: string, email: string })
{
    return `
        <div id="profileArea" class="profile-area">
            <h1>Profile</h1>
            <p>Username: <span id="usernameDisplay">${userData.username}</span></p>
            <p>Email: <span id="emailDisplay">${userData.email}</span></p>
        </div>
    `;
}

export function loadPage(page: () => string, pageName: string = "home")
{

    const app = document.getElementById("app");
    if (app)
    {
        history.pushState({ page: pageName }, `${pageName}`, `/#${pageName}`);
        app.innerHTML = page();
        updateNavUser();
    }
}

export function Canvas()
{
    return `
    <div class="items-center justify-center flex text-center border-2">
    <canvas id="canvas" class="border-2 border-amber-500">
    
    </canvas>
    </div>
    `
}

export function HomePage() : string
{
    return `
    <div class="mx-32">

        <!-- Logo and Title -->
        
        <!-- main body-->
         <div class="mx-32 h-[92vh] text-center items-center flex flex-col justify-center gap-6">
            <div class="flex  flex-row w-2xl justify-between gap-6">
            <button onclick="loadPage(Canvas, 'canvas'); gameStart()" class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">1v1</button>
            <button class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">Single Player</button>
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
