import { FETCH_ADDRESS, GlobalState, Page } from "../main";
import { HOME_PAGE } from "./HomePage";

declare const Notification: typeof import("../components/Notification").Notification;

class BlockedUsersPage implements Page {
    title: string = "Blocked Users"
    data: any = null;

    async render(): Promise<void> {
        let blockedUsers = this.data?.blockedUsers || [];
        
        const blockedUsersHTML =
            blockedUsers.length > 0
                ? blockedUsers
                    .map(
                        (req: any) => `
                        <div class="glass-card" style="display: flex; justify-content: space-between; align-items: center; padding: 1.25rem; margin-bottom: 1rem; border-color: #ff0066;">
                            <div style="display: flex; align-items: center; gap: 1rem; flex: 1;">
                                <div style="width: 48px; height: 48px; border-radius: 50%; background: linear-gradient(135deg, #ff0066, #ff416c); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 1.25rem; flex-shrink: 0;">
                                    ${(req.username || "?").charAt(0).toUpperCase()}
                                </div>
                                <span style="font-weight: 600; font-size: 1rem; color: white;">${req.username}</span>
                            </div>
                            <button 
                                class="btn-primary"
                                data-id="${req.user_id}"
                                data-username="${req.username}"
                                style="padding: 0.625rem 1.25rem; font-size: 0.875rem; white-space: nowrap;"
                                data-i18n="unblock">
                                Unblock
                            </button>
                        </div>
                    `
                    )
                    .join("")
                : `<div class="glass-card" style="text-align: center; padding: 3rem;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">🚫</div>
                    <p style="color: rgba(255, 255, 255, 0.7); font-size: 1.125rem;" data-i18n="no_blocked_users">You haven't blocked any users.</p>
                </div>`;
                
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
            <style>
                .blocked-users-container {
                    max-width: 900px;
                    margin: 0 auto;
                    padding: 2rem 1rem;
                    width: 100%;
                }
                
                .blocked-users-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 2rem;
                    flex-wrap: wrap;
                    gap: 1rem;
                }
                
                @media (max-width: 768px) {
                    .blocked-users-container {
                        padding: 1rem 0.5rem;
                    }
                    
                    .blocked-users-header {
                        flex-direction: column;
                        align-items: flex-start;
                    }
                }
            </style>
            
            <div class="blocked-users-container animate-fade-in">
                <div class="blocked-users-header">
                    <button onclick="GlobalState.setPage(HOME_PAGE)" 
                        style="background: none; border: none; color: var(--neon-yellow); cursor: pointer; font-size: 0.875rem; font-weight: 500; transition: all 0.3s;"
                        onmouseover="this.style.textShadow='0 0 10px var(--neon-yellow)'"
                        onmouseout="this.style.textShadow='none'"
                        data-i18n="back_to_home">← Back to Home</button>
                </div>
                
                <h1 style="font-size: 2.5rem; font-weight: bold; margin-bottom: 2rem; text-align: center;" class="neon-text-cyan" data-i18n="blocked_users">Blocked Users</h1>
                
                <div id="blockedList">${blockedUsersHTML}</div>
            </div>`
        }
        
        this.setupEventListeners();
    }
    
    setupEventListeners(): void {
        const unblockButtons = document.querySelectorAll('[data-id][data-username]');
        unblockButtons.forEach(button => {
            button.addEventListener("click", async (e) => {
                const target = e.target as HTMLButtonElement;
                const userId = target.dataset.id;
                const username = target.dataset.username;
                
                if (!userId || !username) return;
                
                if (!confirm(`Are you sure you want to unblock ${username}?`)) return;
                
                try {
                    const response = await fetch(`${FETCH_ADDRESS}/user/friends/block/${userId}`, {
                        credentials: "include",
                        method: "DELETE"
                    });
                    
                    if (response.ok) {
                        Notification.success(`${username} has been unblocked`);
                        window.location.reload();
                    } else {
                        Notification.error("Failed to unblock user");
                    }
                } catch (error) {
                    console.error("Error unblocking user:", error);
                    Notification.error("Error unblocking user");
                }
            });
        });
    }

    async onPreLoad(): Promise<void> {
        console.log("Blocked user preload");
        try {
            const response = await fetch(`${FETCH_ADDRESS}/user/friends/block`, { credentials: "include" });
            if (!response.ok) {
                Notification.error("Something went wrong");
                GlobalState.setPage(HOME_PAGE);
                return;
            }
            const data = await response.json();
            this.data = data;
        } catch (error) {
            console.error("Error loading blocked users:", error);
            Notification.error("Error loading blocked users");
            GlobalState.setPage(HOME_PAGE);
        }
    }

    async onLoad(): Promise<void> {
        console.log("Blocked users page loaded");
    }

    async onUnload(): Promise<void> {
        console.log("Blocked users page unloaded");
    }
}

const BLOCKED_USERS_PAGE = new BlockedUsersPage();

export { BLOCKED_USERS_PAGE, BlockedUsersPage };
