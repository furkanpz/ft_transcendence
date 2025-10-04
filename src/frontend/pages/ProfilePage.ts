import { loadPage } from "../main";
import { LoginPage } from "./LoginPage";
import { updateNavUser } from "./Navbar";
import { FETCH_ADDRESS } from "../Page";

export async function changePassword(e: Event) {
    e.preventDefault();
    const curPassword = document.getElementById("curPassword") as HTMLInputElement;
    const newPassword = document.getElementById("newPassword") as HTMLInputElement;
    const newPasswordVerify = document.getElementById("newPasswordVerify") as HTMLInputElement;
    fetch(`${FETCH_ADDRESS}/user/password`,
        {
            method: "Put",
            credentials: "include",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                password: curPassword.value,
                new_password: newPassword.value,
                new_re_password: newPasswordVerify.value
            })


        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                curPassword.value = "";
                newPassword.value = "";
                newPasswordVerify.value = "";
                alert("Password has changed");
                localStorage.removeItem("username");
                fetch(`${FETCH_ADDRESS}/auth/logout`, {
                    method: "POST",
                    credentials: "include"
                })
                updateNavUser();
                loadPage(LoginPage, "login");

            }
            else {
                alert(data.message);
            }
        })
}

export async function ProfilePage(tab: Promise<string> | any = "profile") {


    let body = null;
    switch (tab) {
        case "profile":
            body = `<div class="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Profile Tab</h3>
                    <form method="post" class="flex flex-col gap-4 w-full mx-auto items-center justify-center">
                        <img  class="rounded-[100%] w-70 h-70" src="Untitled.png"></img>
                        <input class="p-2 rounded-md bg-white text-black" value="${localStorage.getItem("username")}"></input>
                        <input class="p-2 rounded-md bg-gray-400 text-black" value="${localStorage.getItem("email")}" disabled></input>
                        <button class="bg-blue-500 rounded-md p-4 text-white cursor-pointer" type="submit">Update</button>
                    </form>
                </div>`
            break;
        case "match history":
            body = `<div class="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Profile Tab</h3>
                    <p class="mb-2">This is some placeholder content the Profile tab's associated content, clicking another tab will toggle the visibility of this one for the next.</p>
                    <p>Maç geçmişi olacka</p> 
                </div>`
            break;
        case "change password":
            body = `<div class="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Change Password</h3>
                    <form  onSubmit="changePassword(event)" class="flex flex-col gap-4 w-1/2 mx-auto">
                        <input id="curPassword" class="p-2 rounded-md bg-white text-black" placeholder="Current Password" required></input>
                        <input id="newPassword" class="p-2 rounded-md bg-white text-black" placeholder="New Password" required></input>
                        <input id="newPasswordVerify" class="p-2 rounded-md bg-white text-black" placeholder="New Password Verify" required></input>
                        <button class="bg-blue-500 rounded-md p-4 text-white cursor-pointer" type="submit" >Change Password</button>
                    </form>
                </div>`
            break;
        default:
            body = `<div class="p-6 bg-gray-50 text-medium text-gray-500 dark:text-gray-400 dark:bg-gray-800 rounded-lg w-full">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">Profile Tab</h3>
                    <p class="mb-2">This is some placeholder content the Profile tab's associated content, clicking another tab will toggle the visibility of this one for the next.</p>
                    <p>Defaullllllt</p> 
                </div>`
            break;
    }

    return `
        <div id="profileArea" class="mx-32 py-12">
            

            <div class="md:flex">
                <ul class="flex-column space-y space-y-4 text-sm font-medium text-gray-500 dark:text-gray-400 md:me-4 mb-4 md:mb-0">
                    <li>
                        <button onclick="loadPage(ProfilePage, 'profile')" class="inline-flex items-center cursor-pointer px-4 py-3 rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white">
                            Profile
                        </button>
                    </li>
                    <li>
                        <button onclick="loadPage(ProfilePage, 'match history')" class="inline-flex items-center cursor-pointer px-4 py-3 rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white">
                            Match History
                        </button>
                    </li>
                    <li>
                        <button onclick="loadPage(ProfilePage, 'change password')" class="inline-flex items-center px-4 py-3 rounded-lg hover:text-gray-900 bg-gray-50 hover:bg-gray-100 w-full dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-white">
                            Change Password
                        </button>
                    </li>

                </ul>

                ${body}
                
                
            </div>
        </div>



    `;
}