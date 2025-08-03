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


export function HomePage() : string
{
    return `
    <div class="mx-32">

        <!-- Logo and Title -->
        
        <!-- main body-->
         <div class="mx-32 h-[92vh] text-center items-center flex flex-col justify-center gap-6">
            <div class="flex  flex-row w-2xl justify-between gap-6">
            <button class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">1v1</button>
            <button class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">Single Player</button>
            </div>
            
          </button>
          <button class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
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
