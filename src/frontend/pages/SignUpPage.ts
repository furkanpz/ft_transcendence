import { loadPage } from "../main";
import { LoginPage } from "./LoginPage";

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