// import { transform } from "typescript";
import { GameRoom } from "../backend/server/types/game.types"
import { HomePage } from "./pages/HomePage";
import { changePassword, ProfilePage } from "./pages/ProfilePage";
import { Lobby } from "./pages/LobbyPage";
import { login, LoginPage } from "./pages/LoginPage";
import { signUp, SignUpPage } from "./pages/SignUpPage";
import { updateNavUser } from "./pages/Navbar";

//YUKARISI BUGRAYA AIT

export type UserProfileDTO = {
    success: boolean;
    message: string;
    id: number;
    username: string;
    email: string;
    avatar_url: string;
    role: string;
    created_at: string;
};


window.addEventListener("popstate", async (e) => {
    const app = document.getElementById("app");
    if (!app) return;
    const state = e.state;
    if (state?.page === "home") {
        app.innerHTML = await HomePage();
    } else if (state?.page === "login") {
        app.innerHTML = await LoginPage();
    }
    else if (state?.page === "signup") {
        app.innerHTML = await SignUpPage();
    }

});

export async function loadPage(page: (name: string | null) => Promise<string>, pageName: string = "home") {

    const app = document.getElementById("app");
    if (app) {
        history.pushState({ page: pageName }, `${pageName}`, `/#${pageName}`);
        if (pageName == "match history")
            app.innerHTML = await page("match history");
        else if (pageName == "profile")
            app.innerHTML = await page("profile");
        else if (pageName == "change password")
            app.innerHTML = await page("change password");
        else
            app.innerHTML = await page(null);
        updateNavUser();
    }
}

export async function Canvas() : Promise<string>     {
    return `
    <div class="items-center justify-center flex text-center border-2">
    <canvas id="canvas" class="border-2 border-amber-500">
    
    </canvas>
    </div>
    `
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
(window as any).ProfilePage = ProfilePage;
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
(window as any).changePassword = changePassword;
(window as any).updateNavUser = updateNavUser;
(window as any).signUp = signUp;
(window as any).SignUpPage = SignUpPage;
// main.ts'in en altına ekle
// (window as any).login = login;
// (window as any).signUp = signUp;
// (window as any).toggleSignUp = toggleSignUp;
// (window as any).LoginPage = LoginPage;
// (window as any).loadPage = loadPage;
