//import * as Babylon from "babylonjs"

//const canvas: HTMLCanvasElement = document.getElementById("gameCanvas") as HTMLCanvasElement;

//const engine: Babylon.Engine = new Babylon.Engine(canvas, true, {}, true);
//
//const scene = new Babylon.Scene(engine);
//
//const camera = new Babylon.ArcRotateCamera("camera", Math.PI / 4, Math.PI / 4, 10, Babylon.Vector3.Zero(), scene, true);
//
//camera.setTarget(Babylon.Vector3.Zero());
//camera.attachControl(canvas);
//
//const light = new Babylon.PointLight("light", new Babylon.Vector3(1, 2, 2), scene);
//
//const box = Babylon.MeshBuilder.CreateBox("box", {}, scene);
//
//engine.runRenderLoop(() => { scene.render(); })
export function login()
{
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
    .then(response => {
        console.log(response.headers.get("jwt-token"));
        return response.json()
    })
    .then(data => {
        if (data.success == true)
            alert("Login Success!");
        else
            alert("Login Failed: " + data.message);
    });
}

export function signUp()
{
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
            alert("Sign-up Success! You can now log in.");
        else
            alert("Sign-up Failed: " + data.message);
    });
}

export function LoginPage()
{
    return `
        <div id="loginArea" class="login-area">
			<button id="toggleSignUp" onclick="toggleSignUp()">Sign-up</button>
			<h1>Login</h1>
			<input id="email" type="email" placeholder="Email" class="login-input" />
			<input id="password" type="password" placeholder="Password" class="login-input" />
			<button id="loginButton" class="login-button" onclick="login()">Login</button>
		</div>
    `;
}

export function SignUpPage()
{
    return `
        <div id="signUpArea" class="login-area">
            <button id="toggleSignUp" onclick="toggleSignUp()">Login</button>
            <h1>Sign-up</h1>
            <input id="username" type="text" placeholder="Username" class="sign-up-input" />
            <input id="email" type="email" placeholder="Email" class="sign-up-input" />
            <input id="password" type="password" placeholder="Password" class="sign-up-input" />
            <input id="confirmPassword" type="password" placeholder="Confirm Password" class="sign-up-input" />
            <button id="signUpButton" class="sign-up-button" onclick="signUp()">Sign Up</button>
        </div>
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

function loadPage(pageLoader: () => void | void)
{
    const app = document.getElementById("app");
    if (app)
    {
        app.innerHTML = LoginPage();
    }
}

export function toggleSignUp()
{
    const app = document.getElementById("app");
    if (app)
    {
        if (app.innerHTML.includes("signUpArea"))
            app.innerHTML = LoginPage();
        else
            app.innerHTML = SignUpPage();
    }
}

export function loadLoginPage()
{
    const app = document.getElementById("app");
    if (app)
    {
        app.innerHTML = LoginPage();
    }
}

// main.ts'in en altına ekle
(window as any).loadLoginPage = loadLoginPage;
(window as any).login = login;
(window as any).signUp = signUp;
(window as any).toggleSignUp = toggleSignUp;