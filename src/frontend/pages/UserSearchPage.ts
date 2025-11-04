import { Page, GlobalState, FETCH_ADDRESS } from "../main";
import { USER_PROFILE_PAGE } from "./UserProfilePage";
import { HOME_PAGE } from "./HomePage";

declare const Notification: typeof import("../components/Notification").Notification;

class UserSearchPage implements Page {
  title: string = "Find Users";
  data: any = { results: [] };

  async onPreLoad(): Promise<void> {
    this.title = "Find Users";
  }

  async render(): Promise<void> {
    const app = document.getElementById("app");
    if (!app) return;
    app.innerHTML = `
      <style>
        .container{max-width:900px;margin:0 auto;padding:2rem 1rem}
        .search-wrap{display:flex;gap:.5rem;margin-bottom:1rem}
        .search-input{flex:1;padding:.75rem 1rem;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(20,20,40,.5);color:white}
        .search-btn{padding:.75rem 1rem;border-radius:10px;background:var(--neon-cyan);color:#001010;font-weight:700}
        .user-item{display:flex;align-items:center;justify-content:space-between;gap:1rem;padding:1rem;margin-bottom:.75rem;background:rgba(20,20,40,.5);border-radius:12px;border-left:4px solid rgba(255,255,255,.15)}
      </style>
      <div class="container animate-fade-in">
        <h1 class="neon-text-magenta" style="font-size:2rem;font-weight:bold;margin-bottom:1rem;" data-i18n="search_user">Search User</h1>
        <div class="glass-card" style="border-color: var(--neon-yellow);padding:1rem;">
          <div class="search-wrap">
            <input id="userSearchInput" class="search-input" data-i18n-placeholder="enter_username" placeholder="Enter username..." />
            <button id="userSearchBtn" class="search-btn" data-i18n="search">Search</button>
          </div>
        </div>
        <div class="glass-card" style="border-color: var(--neon-purple);padding:1rem;margin-top:1rem;">
          <h2 class="neon-text-purple" style="font-size:1.25rem;font-weight:600;margin-bottom:1rem;" data-i18n="results">Results</h2>
          <div id="results"></div>
        </div>
        <div style="text-align:center;margin-top:1.5rem;">
          <button id="homeBtn" class="btn-primary" data-i18n="back_to_home">← Back to Home</button>
        </div>
      </div>
    `;
  }

  async onLoad(): Promise<void> {
    const homeBtn = document.getElementById('homeBtn');
    homeBtn?.addEventListener('click', () => GlobalState.setPage(HOME_PAGE));

    const input = document.getElementById('userSearchInput') as HTMLInputElement | null;
    const btn = document.getElementById('userSearchBtn');
    const search = async () => {
      const q = (input?.value || '').trim();
  if (!q) { Notification.warning('Enter username'); return; }
      try {
        const res = await fetch(`${FETCH_ADDRESS}/user/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
        const data = await res.json();
        const users = data.users || data.data?.users || [];
        this.renderResults(users);
      } catch (e) {
        console.error(e);
        Notification.error('Search failed');
      }
    };
    btn?.addEventListener('click', search);
    input?.addEventListener('keydown', (e) => { if (e.key === 'Enter') search(); });
  }

  async onUnload(): Promise<void> {}

  private renderResults(users: Array<{ id: number, username: string, avatar_url?: string, is_online: boolean }>) {
    const results = document.getElementById('results');
    if (!results) return;
    if (!users || users.length === 0) {
      results.innerHTML = `<div style="text-align:center;color:rgba(255,255,255,.6);padding:1rem;" data-i18n="no_results">No results</div>`;
      return;
    }
    
    const escapeHtml = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    
    results.innerHTML = users.map(u => `
      <div class="user-item">
        <div style="display:flex;align-items:center;gap:.75rem;">
          <div style="width:44px;height:44px;border-radius:50%;overflow:hidden;background:linear-gradient(135deg,var(--neon-cyan),var(--neon-purple));display:flex;align-items:center;justify-content:center;color:white;font-weight:bold;">
            ${u.avatar_url ? `<img src="${u.avatar_url.startsWith('/uploads/') ? 'https://localhost:3000'+u.avatar_url : u.avatar_url}" style="width:100%;height:100%;object-fit:cover;"/>` : escapeHtml((u.username[0] || '?').toUpperCase())}
          </div>
          <div>
            <div style="font-weight:600;color:white;">${escapeHtml(u.username)}</div>
            <div style="font-size:.8rem;color:${u.is_online ? 'var(--neon-green)' : 'rgba(255,255,255,.6)'};">${u.is_online ? '<span data-i18n="online">Online</span>' : '<span data-i18n="offline">Offline</span>'}</div>
          </div>
        </div>
        <div style="display:flex;gap:.5rem;">
          <button class="btn-secondary" data-username="${escapeHtml(u.username)}" data-action="view"><span data-i18n="view_profile">View Profile</span></button>
          <button class="btn-success" data-username="${escapeHtml(u.username)}" data-action="add"><span data-i18n="add_friend">Add Friend</span></button>
        </div>
      </div>
    `).join('');

    results.querySelectorAll('button').forEach((b) => {
      b.addEventListener('click', async (e) => {
        const btn = e.currentTarget as HTMLButtonElement;
        const uname = btn.dataset.username!;
        const action = btn.dataset.action;
        if (action === 'view') {
          await GlobalState.setPageWithQuery(USER_PROFILE_PAGE, `username=${encodeURIComponent(uname)}`);
          return;
        }
        if (action === 'add') {
          try {
            const resp = await fetch(`${FETCH_ADDRESS}/user/friends/request`, {
              credentials: 'include',
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username: uname, request_type: 'Pending' })
            });
            const js = await resp.json();
            if (resp.ok) Notification.success(js.message || 'Request sent');
            else Notification.error(js.message || 'Request failed');
          } catch (err) {
            console.error(err);
            Notification.error('Request failed');
          }
        }
      });
    });
    (window as any).i18n?.translateDOM();
  }
}

const USER_SEARCH_PAGE = new UserSearchPage();
export { UserSearchPage, USER_SEARCH_PAGE };
