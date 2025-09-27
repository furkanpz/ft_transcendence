import { loadPage, UserProfileDTO } from "../main";
import { HomePage } from "./HomePage";
import { LoginPage } from "./LoginPage";
import { ProfilePage } from "./ProfilePage";

export async function updateNavUser() {
    let data: UserProfileDTO | null = null;
    const authButton = document.getElementById("authButton");
    let response = null;
    try {
        const response = await fetch('http://localhost:3000/api/user/profile', {
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
    if (data && data.username) {
        if (authButton) {
            authButton.textContent = data.username;
            authButton.onclick = () => { loadPage(ProfilePage, "profile") };
            authButton.classList.remove("hover:text-amber-400");
        }
        if (logoutButton) {
            logoutButton!.classList.remove("hidden");

            logoutButton!.textContent = "Logout";
            logoutButton!.onclick = async () => {
                await fetch(`http://localhost:3000/api/auth/logout`, {
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
