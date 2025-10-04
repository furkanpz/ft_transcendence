import { loadPage } from "../main";
import { FETCH_ADDRESS, GlobalState } from "../Page";
import { HOME_PAGE } from "../pages";
import { HomePage } from "./HomePage";

export async function login(event: Event) {
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
                GlobalState.setPage(HOME_PAGE);
            }
            else {
                alert("Login Failed: " + data.message);
                loadPage(LoginPage, "login");
            }
        });
}



export async function LoginPage(): Promise<string> {
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