import { loadPage, UserProfileDTO } from "../main";
import { FETCH_ADDRESS } from "../Page";
import { HomePage } from "./HomePage";
import { LoginPage } from "./LoginPage";
import { ProfilePage } from "./ProfilePage";

export async function updateNavUser() {
    let data: UserProfileDTO | null = null;
    const authButton = document.getElementById("authButton");
    try {
        const response = await fetch(`${FETCH_ADDRESS}/user/profile`, {
            method: "GET",
            credentials: "include"
        });

        if (!response.ok) {
            data = null;
        } else {
            data = await response.json();
        }

    } catch (err) {
        data = null;
    }

    const logoutButton = document.getElementById("logout");
    const multiplayerButton = document.getElementById("multiplayer-btn");
    if (data && data.username) {
        if (authButton) {
            authButton.textContent = data.username;
            authButton.onclick = () => { loadPage(ProfilePage, "profile") };
            authButton.classList.remove("hover:text-amber-400");
        }
        if (logoutButton && multiplayerButton) {
            logoutButton!.classList.remove("hidden");
            multiplayerButton.classList.remove("hidden");
            logoutButton!.textContent = "Logout";
            logoutButton!.onclick = async () => {
                await fetch(`${FETCH_ADDRESS}/auth/logout`, {
                    method: "GET",
                    credentials: "include"
                });
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
