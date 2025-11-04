import { GlobalState, FETCH_ADDRESS } from "../main";
import { HOME_PAGE } from "../pages/HomePage";
import { PROFILE_PAGE } from "../pages/ProfilePage";
import { LOGIN_PAGE } from "../pages/LoginPage";
import { CHAT_PAGE } from "../pages/ChatPage";
import { FRIENDS_PAGE } from "../pages/FriendsPage";
import { USER_SEARCH_PAGE } from "../pages/UserSearchPage";
import { setLanguage, getLanguage } from "../i18n";

export class Navbar {
    private static currentUsername: string | null = null;

    static async render(): Promise<string> {
        // Get current user info
        await Navbar.loadUserInfo();

        return `
            <nav id="global-navbar" style="background: rgba(10, 10, 32, 0.95) !important; backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0, 240, 255, 0.3); padding: 1rem 2rem; position: fixed; top: 0; left: 0; right: 0; width: 100%; z-index: 1000; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);">
                <div style="max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <div style="display: flex; align-items: center; gap: 2rem;">
                        <button onclick="GlobalState.setPage(HOME_PAGE)" 
                            style="background: none; border: none; padding: 0; cursor: pointer;">
                            <h1 style="margin: 0; font-size: 2rem; font-family: 'Roboto', sans-serif; font-weight: 700; background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple), var(--neon-pink)); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; filter: drop-shadow(0 0 20px rgba(0, 240, 255, 0.5));" 
                                data-i18n="PONG">PONG</h1>
                        </button>
                    </div>
                    
                    <div style="display: flex; align-items: center; gap: 1.5rem;">
                        <div style="display: flex; gap: 0.5rem; align-items: center;">
                            <button id="lang-en" 
                                style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); color: var(--neon-cyan); cursor: pointer; font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 8px; transition: all 0.3s; font-family: 'Roboto', sans-serif; font-weight: 700;">
                                EN
                            </button>
                            <button id="lang-tr" 
                                style="background: rgba(0, 240, 255, 0.1); border: 1px solid rgba(0, 240, 255, 0.3); color: var(--neon-cyan); cursor: pointer; font-size: 0.875rem; padding: 0.5rem 1rem; border-radius: 8px; transition: all 0.3s; font-family: 'Roboto', sans-serif; font-weight: 700;">
                                TR
                            </button>
                        </div>
                        
                        ${Navbar.currentUsername 
                            ? `
                                <div style="display: flex; align-items: center; gap: 1rem;">
                                    <button onclick="GlobalState.setPage(CHAT_PAGE)" 
                                        style="background: none; border: none; color: var(--neon-cyan); cursor: pointer; font-size: 0.875rem; font-family: 'Roboto', sans-serif; font-weight: 700; transition: all 0.3s;"
                                        onmouseover="this.style.color='var(--neon-purple)'"
                                        onmouseout="this.style.color='var(--neon-cyan)'">
                                        💬 <span data-i18n="chat">Chat</span>
                                    </button>
                                    <button onclick="GlobalState.setPage(USER_SEARCH_PAGE)" 
                                        style="background: none; border: none; color: var(--neon-cyan); cursor: pointer; font-size: 0.875rem; font-family: 'Roboto', sans-serif; font-weight: 700; transition: all 0.3s;"
                                        onmouseover="this.style.color='var(--neon-purple)'"
                                        onmouseout="this.style.color='var(--neon-cyan)'">
                                        🔎 <span data-i18n="search">Search</span>
                                    </button>
                                    <button onclick="GlobalState.setPage(FRIENDS_PAGE)" 
                                        style="background: none; border: none; color: var(--neon-cyan); cursor: pointer; font-size: 0.875rem; font-family: 'Roboto', sans-serif; font-weight: 700; transition: all 0.3s;"
                                        onmouseover="this.style.color='var(--neon-purple)'"
                                        onmouseout="this.style.color='var(--neon-cyan)'">
                                        👥 <span data-i18n="friends">Friends</span>
                                    </button>
                                    <button id="authButton" onclick="GlobalState.setPage(PROFILE_PAGE)"
                                        style="background: linear-gradient(135deg, var(--neon-cyan), var(--neon-blue)); color: white; cursor: pointer; font-size: 0.875rem; font-family: 'Roboto', sans-serif; font-weight: 700; padding: 0.5rem 1.25rem; border-radius: 8px; border: none; box-shadow: 0 4px 15px rgba(0, 240, 255, 0.3); transition: all 0.3s;">
                                        ${Navbar.currentUsername}
                                    </button>
                                </div>
                            ` 
                            : `
                                <button id="authButton" onclick="GlobalState.setPage(LOGIN_PAGE)"
                                    style="background: linear-gradient(135deg, var(--neon-cyan), var(--neon-blue)); color: white; cursor: pointer; font-size: 0.875rem; font-family: 'Roboto', sans-serif; font-weight: 700; padding: 0.5rem 1.25rem; border-radius: 8px; border: none; box-shadow: 0 4px 15px rgba(0, 240, 255, 0.3); transition: all 0.3s;"
                                    data-i18n="login">Login</button>
                            `
                        }
                    </div>
                </div>
            </nav>
        `;
    }

    private static async loadUserInfo(): Promise<void> {
        try {
            const response = await fetch(`${FETCH_ADDRESS}/auth/check`, {credentials: "include"});
            if (response.ok) {
                const data = await response.json();
                Navbar.currentUsername = data.username || null;
            } else {
                Navbar.currentUsername = null;
            }
        } catch (error) {
            Navbar.currentUsername = null;
        }
    }

    static setupEventListeners(): void {
        // Language switcher - i18n system handles this automatically via setupLanguageButtons
        // But we can update button styles based on current language
        const currentLang = getLanguage();
        const langEn = document.getElementById("lang-en");
        const langTr = document.getElementById("lang-tr");
        
        if (langEn && langTr) {
            if (currentLang === 'tr') {
                langEn.style.opacity = '0.6';
                langTr.style.opacity = '1';
                langTr.style.boxShadow = '0 0 10px var(--neon-cyan)';
                langEn.style.boxShadow = 'none';
            } else {
                langTr.style.opacity = '0.6';
                langEn.style.opacity = '1';
                langEn.style.boxShadow = '0 0 10px var(--neon-cyan)';
                langTr.style.boxShadow = 'none';
            }
        }
    }
}

