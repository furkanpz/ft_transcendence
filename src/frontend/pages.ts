import { gameStart } from "./game";
import { loadPage } from "./main";
import { Page, GlobalState, FETCH_ADDRESS } from "./Page";
import { HomePage } from "./pages/HomePage";

const HOME_PAGE: Page = {
	title: "Home",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
			<div class="mx-32">
				<!-- Logo and Title -->
				<nav id="nav" class="px-32 py-2 flex flex-row w-full bg-blue-500 rounded-b-xl justify-between">
					<div>
						<button onclick="GlobalState.setPage(HOME_PAGE)" class="font-bold cursor-pointer text-6xl">PONG</button>
					</div>
					<div class="flex items-center">
					${
						window.localStorage.getItem("isAuthenticated") === "1" ? `<button id="authButton" onclick="GlobalState.setPage(LOGIN_PAGE)"
						class="cursor-pointer text-2xl font-semibold text-white hover:text-amber-400">Profil</button>` : `<button id="authButton" onclick="GlobalState.setPage(LOGIN_PAGE)"
						class="cursor-pointer text-2xl font-semibold text-white hover:text-amber-400">Login</button>`
					}
						
					</div>
				</nav>

				<!-- main body -->
				<div class="mx-32 h-[92vh] text-center items-center flex flex-col justify-center gap-6">
					<div class="flex flex-row w-2xl justify-between gap-6">
						<button onclick="GlobalState.setPage(PVP_GAME_PAGE)" 
							class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
							1v1
						</button>
						<button onclick="GlobalState.setPage(AI_GAME_PAGE)" 
							class="bg-blue-500 w-[50%] text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
							Single Player
						</button>
					</div>

					${
						window.localStorage.getItem("isAuthenticated") === "1"
							? `
								<button onclick="GlobalState.setPage(LOBBY_PAGE)" id="multiplayer-btn"
									class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
									Multiplayer
								</button>
								
								<button id="friends-btn"
									class="bg-blue-500 min-w-2xl text-white font-bold py-6 px-10 rounded hover:bg-blue-700 transition duration-300 ease-in-out">
									Friends
								</button>
								<button id="logout"
									class="bg-red-500 text-white px-4 cursor-pointer py-2 rounded">
									Logout
								</button>
							  `
							: ""
					}
				</div>
			</div>
			`;
			const multiplayerBtn = document.getElementById("multiplayer-btn");
			if (multiplayerBtn) {
				multiplayerBtn.addEventListener("click", () => {
					console.log("multiplayer clicked");
				});
			}

			const friendsBtn = document.getElementById("friends-btn");
			if (friendsBtn)
			{
				friendsBtn.addEventListener("click", async () => {
					GlobalState.setPage(FRIENDS_PAGE);
				})
			}

			const logoutBtn = document.getElementById("logout");
			if (logoutBtn) {
				logoutBtn.addEventListener("click", async () => {
					await fetch(`${FETCH_ADDRESS}/auth/logout`, {credentials: "include"});
					window.localStorage.removeItem("isAuthenticated");
					window.location.reload();
				});
			}
		}
	},
	onPreLoad: async () => {
		console.log("Preparing to load Home page");
	},
	onLoad: async () => {
		console.log("Home page loaded");
	},
	onUnload: async () => {
		console.log("Home page unloaded");
	}
};

const PROFILE_PAGE: Page = {
	title: "Profile",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = "<h1 class='m-2 text-2xl font-bold'>User Profile</h1><button id=homeBtn class='ml-4 mt-4 p-2 bg-blue-500 text-white rounded' onclick='loadPage(HOME_PAGE)'>Go to Home</button>";
		}
	},
	onPreLoad: async () => {
		console.log("Preparing to load Profile page");
	},
	onLoad: async () => {
		console.log("Profile page loaded");
	},
	onUnload: async () => {
		console.log("Profile page unloaded");
	}
};

async function login(event: Event) {
	event.preventDefault();
	const email = document.getElementById("email") as HTMLInputElement;
	const password = document.getElementById("password") as HTMLInputElement;
	fetch(`${FETCH_ADDRESS}/auth/sign-in`, {
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
				window.localStorage.setItem("isAuthenticated", "1");
				GlobalState.setPage(HOME_PAGE);
			}
			else {
				alert("Login Failed: " + data.message);
				GlobalState.setPage(LOGIN_PAGE);
			}
		});
}

const LOGIN_PAGE: Page = {
	title: "Login",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<div id="loginArea" class="mx-32 min-h-[92vh] items-center flex flex-col justify-center text-center gap-6 ">
					<button id="backButton" onclick="GlobalState.setPage(HOME_PAGE)">Back to Home</button>
					<form method="post"  class="bg-blue-500 rounded-2xl min-w-2xl p-12 items-center flex flex-col justify-center text-center gap-6">
						<input type="text" id="email" placeholder="Email" class="bg-white p-1"></input>
						<input type="password" id="password" placeholder="Password" class="bg-white p-1"></input>
						<button type="submit" onclick="login(event)" class="bg-white text-black py-2 px-4 rounded">Login</button>
					</form>
					<div class="flex flex-row w-2xl  justify-between items-center gap-4">
						<button id="toggleSignUp" class="underline cursor-pointer" onclick="GlobalState.setPage(SIGNUP_PAGE)">Don't have an account? Sign Up</button>
					</div>
				</div>
			`;
		}
	},
	onPreLoad: async () => {
		console.log("Preparing to load Login page");
	},
	onLoad: async () => {
		console.log("Login page loaded");
	},
	onUnload: async () => {
		console.log("Login page unloaded");
	}
};

async function signUp(event: Event) {
	event.preventDefault();
	const username = document.getElementById("username") as HTMLInputElement;
	const email = document.getElementById("email") as HTMLInputElement;
	const password = document.getElementById("password") as HTMLInputElement;
	const confirmPassword = document.getElementById("confirmPassword") as HTMLInputElement;
	if (password.value !== confirmPassword.value) {
		alert("Passwords do not match!");
		return;
	}
	await fetch(`${FETCH_ADDRESS}/auth/sign-up`, {
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
				GlobalState.setPage(LOGIN_PAGE);
			}
			else {
				alert("Sign-up Failed: " + data.message);
			}
		});
}

const SIGNUP_PAGE: Page = {
	title: "Sign Up",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<div id="signUpArea" class="mx-32 min-h-[92vh] items-center flex flex-col justify-center text-center gap-6 ">
					<button id="backButton" onclick="GlobalState.setPage(HOME_PAGE)">Back to Home</button>
					<form method="post" class="bg-blue-500 rounded-2xl min-w-2xl p-12 items-center flex flex-col justify-center text-center gap-6">
						<input type="text" id="username" placeholder="Username" value="erkoc" class="bg-white p-1"></input>
						<input type="text" id="email" placeholder="Email"       value="asda@gmail.com"   class="bg-white p-1"></input>
						<input type="password" id="password"                    value="asdasd"  placeholder="Password" class="bg-white p-1"></input>
						<input type="password" id="confirmPassword"             value="asdasd"     placeholder="Confirm Password" class="bg-white p-1"></input>
						<button type="submit" onclick="signUp(event)" class="bg-white text-black py-2 px-4 rounded">Sign-Up</button>
					</form>
					<div class="flex flex-row w-2xl  justify-between items-center gap-4">
						<button id="toggleSignUp" class="underline cursor-pointer" onclick="GlobalState.setPage(LOGIN_PAGE)">Already have an account? Sign In</button>
					</div>
				</div>
			`;
		}
	},
	onPreLoad: async () => {
		console.log("Preparing to load Sign Up page");
	},
	onLoad: async () => {
		console.log("Sign Up page loaded");
	},
	onUnload: async () => {
		console.log("Sign Up page unloaded");
	}
};

const PVP_GAME_PAGE: Page = {
	title: "1V1 Game",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<h1 class="text-4xl font-bold">1v1 Game</h1>
				<p class="mt-4">Welcome to the 1v1 Game Page!</p>
				<canvas id="canvas" width="800" height="600" class="border border-black mt-4"></canvas>
			`;
		}
	},
	onPreLoad: async () => {
		window.onclick = (event) => {
			console.log(event.target);
		};
		console.log("Preparing to load 1v1 Game page");
	},
	onLoad: async () => {
		gameStart(false);
		console.log("1v1 Game page loaded");
	},
	onUnload: async () => {
		window.onclick = null;
		if (GlobalState.getAnimationFrameId() !== null) {
			cancelAnimationFrame(GlobalState.getAnimationFrameId()!);
			GlobalState.setAnimationFrameId(null);
		}
		console.log("1v1 Game page unloaded");
	}
};

const FRIENDS_PAGE: Page = {
	title: "Friends",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app){
		
			app.innerHTML = `<div class="min-h-screen bg-gray-100 p-6">
      <h1 class="text-3xl font-bold mb-6">Arkadaşlık Sayfası</h1>

      <div class="mb-10">
        <h2 class="text-xl font-semibold mb-2">Arkadaşlık İsteği Gönder</h2>
		<form>
		<input
            type="text"
            placeholder="Username girin..."
			id="inp"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-400"/>
			<button id="sendBtn" onClick="() => {}" class="px-4 cursor-pointer py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition">
				Send
			</button>
		</form>
      </div>

      <div>
        <h2 class="text-xl font-semibold mb-4">Gelen Arkadaşlık İstekleri</h2>
        <div class="flex flex-col gap-4">
            <div
              class="flex justify-between w-sm items-center bg-white p-4 rounded-md shadow-sm border border-gray-200"
            >
              <span class="font-medium">erkoc</span>
              <div class="flex gap-2">
                <button class="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition">
                  ✔
                </button>
                <button class="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition">
                  ✖
                </button>
              </div>
            </div>
        </div>
      </div>

	  <div>
        <h2 class="text-xl font-semibold mb-4 pt-5">Arkadaşların</h2>
        <div class="flex flex-col gap-4">
            <div
              class="flex justify-between w-sm items-center bg-white p-4 rounded-md shadow-sm border border-gray-200"
            >
              <span class="font-medium">erkoc</span>
            </div>
        </div>
      </div>
    </div>`
		}
	const sendButton = document.getElementById("sendBtn");
	if (sendButton)
	{
		sendButton.addEventListener("click", async () => {
			const id = (document.getElementById("inp") as HTMLInputElement).value;
			const response = await fetch(`${FETCH_ADDRESS}/friends/request`, {credentials: "include", method: "POST", body: JSON.stringify({
				friend_id: parseInt(id, 10),
				user_id: null,
				request_type: "Pending",
			})});

			if (!response.ok)
			{
				alert("Fail");
				// GlobalState.setPage(HOME_PAGE);
			}
			else
			{
				alert("Success");
			}

		})
	}
	},
	onPreLoad: async () => {
		const response = await fetch(`${FETCH_ADDRESS}/user/profile`, {credentials: "include", method: "GET"});
		if (!response.ok)
		{
			// GlobalState.setPage(HOME_PAGE);
			console.log("onpreload");
		}
	},
	onLoad: async () => {console.log("Friends page loaded")},
	onUnload: async () => {console.log("Friends page unloaded")}
}

const AI_GAME_PAGE: Page = {
	title: "AI Game",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<h1 class="text-4xl font-bold">AI Game</h1>
				<p class="mt-4">Welcome to the AI Game page!</p>
				<canvas id="canvas" width="800" height="600" class="border border-black mt-4"></canvas>
			`;
		}
	},
	onPreLoad: async () => {
		window.onclick = (event) => {
			console.log(event.target);
		};
		console.log("Preparing to load AI Game page");
	},
	onLoad: async () => {
		gameStart(true);
		console.log("AI Game page loaded");
	},
	onUnload: async () => {
		window.onclick = null;
		if (GlobalState.getAnimationFrameId() !== null) {
			cancelAnimationFrame(GlobalState.getAnimationFrameId()!);
			GlobalState.setAnimationFrameId(null);
		}
		console.log("AI Game page unloaded");
	}
};

const LOBBY_PAGE: Page = {
	title: "Lobby",
	data: null,
	render: async () => {
		const app = document.getElementById("app");
		if (app) {
			app.innerHTML = `
				<div class="flex justify-center">
					<div id="waitingPopup" class="hidden fixed inset-0 bg-black bg-opacity-50 items-center justify-center">
						<div class="bg-white p-6 rounded-lg w-1/3 text-center">
							<h2 class="text-2xl font-semibold text-gray-700">Waiting for Players...</h2>
							<p class="mt-2 text-gray-500">Please wait while the room is being prepared.</p>
							<button onclick="BURADA ODA KAPATILACAK" class="mt-4 px-6 py-2 bg-blue-500 text-white rounded-md">Close</button>
						</div>
					</div>
				</div>
				<div> 
					<div class="text-center">
						<button onclick="window.createRoom()" 
						class="px-6 py-3 cursor-pointer bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg shadow-md transition">
							Create Room
						</button>
							<div class="flex justify-between items-start ...">
								<div class="flex flex-col h-full w-1/4 text-center">
									<div class="w-full ">
										<span class="text-md text-slate-500">ID</span>
									</div>
									<div class="w-full my-auto">
										<span class="truncate text-lg font-semibold"></span>
									</div>
									</div>
									<div class="flex flex-col h-full w-1/4 text-center">
										<div class="w-full ">
											<span class="text-md text-slate-500">Player Count</span>
										</div>
									<div class="w-full my-auto">
									<span class="truncate text-lg"></span>
									</div>
								</div>
									<div class="flex flex-col h-full w-1/4 text-center">
									<div class="w-full ">
									<span class="text-md text-slate-500">Status</span>
									</div>
									<div class="text-xs truncate my-auto">
									<span class="text-lg overflow-hidden whitespace-nowrap"></span>
									</div>
									</div>
									<div class="flex flex-col h-full w-1/4 text-center">
									<div class="w-full my-auto">
									<button onclick="joinRoom('');" class="text-lg p-4 bg-blue-500 cursor-pointer rounded-2xl text-white">Join</button>
								</div>
							</div>
						</div>
					</div>
                </div>
			`;
		}
	},
	onPreLoad: async () => {
		console.log("Preparing to load Lobby page")
	},
	onLoad: async () => {console.log("Lobby page loaded")},
	onUnload: async () => {console.log("Lobby page unloaded")}
}

const PAGES: { [key: string]: Page } = {
	"home": HOME_PAGE,
	"profile": PROFILE_PAGE,
	"login": LOGIN_PAGE,
	"signup": SIGNUP_PAGE,
	"ai-game": AI_GAME_PAGE,
	"1v1-game": PVP_GAME_PAGE,
	"lobby": LOBBY_PAGE,
};

export {
	HOME_PAGE,
	PVP_GAME_PAGE,
	PROFILE_PAGE,
	LOGIN_PAGE,
	FRIENDS_PAGE,
	SIGNUP_PAGE,
	AI_GAME_PAGE,
	LOBBY_PAGE,
	PAGES,
	signUp,
	login };