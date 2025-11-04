import { Page, GlobalState, FETCH_ADDRESS } from "../main";
import { HOME_PAGE } from "./HomePage";
import { t } from "../i18n";

declare const Notification: typeof import("../components/Notification").Notification;

class UserProfilePage implements Page {
  title: string = "User";
  data: any = null;
  private targetUserId: number | null = null;
  private targetUsername: string | null = null;
  private profileUsername: string | null = null;

  async onPreLoad(): Promise<void> {
    this.title = t('profile');
    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id');
    const usernameParam = params.get('username');

    this.targetUserId = idParam ? parseInt(idParam, 10) : null;
    this.targetUsername = usernameParam;

    if (!this.targetUserId && this.targetUsername) {
      try {
        const res = await fetch(`${FETCH_ADDRESS}/user/getUserId/${encodeURIComponent(this.targetUsername)}`, {
          method: 'GET',
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          this.targetUserId = data.userId || data.data?.userId || data.data?.id || null;
        }
      } catch (e) {
        console.error('Failed to resolve username to id', e);
      }
    }
  }

  async render(): Promise<void> {
    const app = document.getElementById("app");
    if (!app) return;

    app.innerHTML = `
      <style>
        .profile-container{max-width:900px;margin:0 auto;padding:2rem 1rem;width:100%}
        .profile-section{margin-bottom:1.5rem}
        .profile-avatar{width:128px;height:128px;border-radius:50%;object-fit:cover;border:4px solid var(--neon-cyan);box-shadow:0 0 20px var(--neon-cyan)}
        .search-wrap{display:flex;gap:.5rem;justify-content:center;margin-bottom:1rem}
        .search-input{flex:1;max-width:420px;padding:.75rem 1rem;border-radius:10px;border:1px solid rgba(255,255,255,.15);background:rgba(20,20,40,.5);color:white}
        .search-btn{padding:.75rem 1rem;border-radius:10px;background:var(--neon-cyan);color:#001010;font-weight:700}
        /* removed messages preview styles */
      </style>
      <div class="profile-container animate-fade-in">
        <h1 style="font-size:2rem;font-weight:bold;margin-bottom:1rem;text-align:center;" class="neon-text-magenta">${t('user_profile')}</h1>

        <div class="glass-card profile-section" style="border-color: var(--neon-yellow);">
          <div class="search-wrap">
            <input id="userSearchInput" class="search-input" type="text" placeholder="Kullanıcı adı ara..." />
            <button id="userSearchBtn" class="search-btn">Ara</button>
          </div>
        </div>

        <div class="glass-card profile-section" style="border-color: var(--neon-cyan);">
          <div style="display:flex;justify-content:center;padding:1.5rem;gap:.75rem;align-items:center;flex-direction:column;">
            <img id="profilePicture" src="Portrait_Placeholder.png" alt="Profile Picture" class="profile-avatar">
            <div id="publicUsername" style="font-weight:700;color:white;"></div>
          </div>
        </div>

        <div class="glass-card profile-section" style="border-color: var(--neon-green);">
          <h2 style="font-size:1.25rem;font-weight:600;text-align:center;margin-bottom:1rem;" class="neon-text-green">${t('stats')}</h2>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:1rem;">
            <div style="text-align:center;padding:1rem;">
              <div id="totalMatchesCount" style="font-size:1.5rem;font-weight:bold;color:var(--neon-cyan);margin-bottom:.5rem;">0</div>
              <div style="font-size:.875rem;color:rgba(255,255,255,.7);">Toplam Maç</div>
            </div>
            <div style="text-align:center;padding:1rem;">
              <div id="winsCount" style="font-size:1.5rem;font-weight:bold;color:var(--neon-green);margin-bottom:.5rem;">0</div>
              <div style="font-size:.875rem;color:rgba(255,255,255,.7);">Win</div>
            </div>
            <div style="text-align:center;padding:1rem;">
              <div id="lossesCount" style="font-size:1.5rem;font-weight:bold;color:#ff0066;margin-bottom:.5rem;">0</div>
              <div style="font-size:.875rem;color:rgba(255,255,255,.7);">Lose</div>
            </div>
            <div style="text-align:center;padding:1rem;">
              <div id="winRateCount" style="font-size:1.5rem;font-weight:bold;color:var(--neon-yellow);margin-bottom:.5rem;">0%</div>
              <div style="font-size:.875rem;color:rgba(255,255,255,.7);">Kazanma Oranı</div>
            </div>
          </div>
          <div style="border-top:1px solid rgba(255,255,255,.1);margin:1rem 0;padding-top:1rem;">
            <h3 style="font-size:1.1rem;font-weight:600;text-align:center;margin-bottom:.75rem;" class="neon-text-magenta">Tournament Statistics</h3>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:1rem;">
              <div style="text-align:center;padding:.75rem;">
                <div id="totalTournamentsCount" style="font-size:1.25rem;font-weight:bold;color:var(--neon-purple);margin-bottom:.5rem;">0</div>
                <div style="font-size:.75rem;color:rgba(255,255,255,.7);">Toplam Turnuva</div>
              </div>
              <div style="text-align:center;padding:.75rem;">
                <div id="tournamentWinsCount" style="font-size:1.25rem;font-weight:bold;color:var(--neon-green);margin-bottom:.5rem;">0</div>
                <div style="font-size:.75rem;color:rgba(255,255,255,.7);">Turnuva Win</div>
              </div>
              <div style="text-align:center;padding:.75rem;">
                <div id="tournamentLossesCount" style="font-size:1.25rem;font-weight:bold;color:#ff0066;margin-bottom:.5rem;">0</div>
                <div style="font-size:.75rem;color:rgba(255,255,255,.7);">Turnuva Lose</div>
              </div>
              <div style="text-align:center;padding:.75rem;">
                <div id="tournamentWinRateCount" style="font-size:1.25rem;font-weight:bold;color:var(--neon-yellow);margin-bottom:.5rem;">0%</div>
                <div style="font-size:.75rem;color:rgba(255,255,255,.7);">Turnuva Kazanma</div>
              </div>
            </div>
          </div>
        </div>

        <div class="glass-card profile-section" style="border-color: var(--neon-purple);">
          <h2 style="font-size:1.25rem;font-weight:600;text-align:center;margin-bottom:1rem;" class="neon-text-purple">📜 Maç Geçmişi</h2>
          <div id="matchHistoryContainer" style="max-height:400px;overflow-y:auto;">
            <div style="text-align:center;padding:2rem;color:rgba(255,255,255,.5);">
              <p>Maç geçmişi yükleniyor...</p>
            </div>
          </div>
        </div>

        <div class="glass-card profile-section" style="border-color: var(--neon-magenta);">
          <h2 style="font-size:1.25rem;font-weight:600;text-align:center;margin-bottom:1rem;" class="neon-text-magenta">Tournament History</h2>
          <div id="tournamentHistoryContainer" style="max-height:400px;overflow-y:auto;">
            <div style="text-align:center;padding:2rem;color:rgba(255,255,255,.5);">
              <p>Turnuva geçmişi yükleniyor...</p>
            </div>
          </div>
        </div>

        <div class="glass-card profile-section" style="border-color: var(--neon-blue);">
          <h2 style="font-size:1.25rem;font-weight:600;text-align:center;margin-bottom:1rem;" class="neon-text-cyan" data-i18n="chat">Live Chat</h2>
          <div style="text-align:center;">
            <button id="goChatBtn" class="btn-secondary" data-i18n="go_to_chat">Go to Chat</button>
          </div>
        </div>

        <div style="text-align:center;margin-top:2rem;">
          <button id="homeBtn" class="btn-primary">← Back to Home</button>
        </div>
      </div>
    `;
  }

  async onLoad(): Promise<void> {
    const homeBtn = document.getElementById('homeBtn');
    homeBtn?.addEventListener('click', () => GlobalState.setPage(HOME_PAGE));

    const searchBtn = document.getElementById('userSearchBtn');
    const searchInput = document.getElementById('userSearchInput') as HTMLInputElement | null;
    searchBtn?.addEventListener('click', async () => {
      const val = searchInput?.value.trim();
      if (!val) return;
      await GlobalState.setPageWithQuery(USER_PROFILE_PAGE, `username=${encodeURIComponent(val)}`);
    });
    searchInput?.addEventListener('keydown', async (e) => {
      if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        if (!val) return;
        await GlobalState.setPageWithQuery(USER_PROFILE_PAGE, `username=${encodeURIComponent(val)}`);
      }
    });

    if (!this.targetUserId) {
      await GlobalState.setPage(HOME_PAGE);
      return;
    }

    await this.loadPublicProfile(this.targetUserId);
    if (!this.profileUsername) {
      await GlobalState.setPage(HOME_PAGE);
      return;
    }
    await this.loadDetailedStats(this.targetUserId);
    await this.loadMatchHistory(this.targetUserId);
    await this.loadTournamentHistory(this.targetUserId);
    const goChatBtn = document.getElementById('goChatBtn');
    goChatBtn?.addEventListener('click', async () => {
      const { CHAT_PAGE, ChatPage } = await import('./ChatPage');
      if (this.profileUsername) {
        (ChatPage as any).activeChatUser = this.profileUsername;
      }
      GlobalState.setPage((CHAT_PAGE as any));
    });
  }

  async onUnload(): Promise<void> {}

  private async loadPublicProfile(userId: number) {
    try {
      const res = await fetch(`${FETCH_ADDRESS}/user/other/${userId}/profile`, { method: 'GET', credentials: 'include' });
      if (!res.ok) return;
      const data = await res.json();
      const u = (data && (data.data || data)) as any;
      const profile = (u && (u.profile || u)) as any;
      const nameEl = document.getElementById('publicUsername');
      const avatar = document.getElementById('profilePicture') as HTMLImageElement;
      if (nameEl) nameEl.textContent = profile.username || '';
      this.profileUsername = profile.username || null;
      if (avatar && profile.avatar_url) {
        avatar.src = profile.avatar_url.startsWith('/uploads/') ? `https://localhost:3000${profile.avatar_url}` : profile.avatar_url;
      }
    } catch (e) { console.error(e); }
  }

  private async loadDetailedStats(userId: number) {
    try {
      const res = await fetch(`${FETCH_ADDRESS}/user/other/${userId}/detailed-stats`, { method: 'GET', credentials: 'include' });
      if (!res.ok) return;
      const { stats } = await res.json();
      (document.getElementById('totalMatchesCount') as HTMLElement).textContent = String(stats.totalMatches || 0);
      (document.getElementById('winsCount') as HTMLElement).textContent = String(stats.wins || 0);
      (document.getElementById('lossesCount') as HTMLElement).textContent = String(stats.losses || 0);
      (document.getElementById('winRateCount') as HTMLElement).textContent = `${stats.winRate || 0}%`;
      (document.getElementById('totalTournamentsCount') as HTMLElement).textContent = String(stats.totalTournaments || 0);
      (document.getElementById('tournamentWinsCount') as HTMLElement).textContent = String(stats.tournamentWins || 0);
      (document.getElementById('tournamentLossesCount') as HTMLElement).textContent = String(stats.tournamentLosses || 0);
      (document.getElementById('tournamentWinRateCount') as HTMLElement).textContent = `${stats.tournamentWinRate || 0}%`;
    } catch (e) { console.error(e); }
  }

  private async loadMatchHistory(userId: number) {
    const container = document.getElementById('matchHistoryContainer');
    if (!container) return;
    try {
      const res = await fetch(`${FETCH_ADDRESS}/user/other/${userId}/match-history?limit=5`, { method: 'GET', credentials: 'include' });
      if (!res.ok) { container.innerHTML = `<div style="text-align:center;padding:2rem;color:rgba(255,255,255,.5);"><p>Maç geçmişi yüklenemedi</p></div>`; return; }
      const data = await res.json();
      const matches = data.matches || [];
      if (matches.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:2rem;color:rgba(255,255,255,.5);"><p>Henüz maç geçmişi yok</p></div>`;
        return;
      }
      container.innerHTML = matches.map((m: any) => {
        const matchTypeIcon = m.match_type === 'tournament' ? '[T]' : m.match_type === 'multiplayer' ? '[M]' : '[C]';
        return `
          <div style="padding:1rem;margin-bottom:.75rem;background:rgba(20,20,40,.5);border-radius:12px;border-left:4px solid rgba(255,255,255,.2);">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
              <div style="display:flex;align-items:center;gap:.75rem;">
                <span style="font-size:1.5rem;">${matchTypeIcon}</span>
                <div>
                  <div style="font-weight:600;color:white;">${m.player1_username} vs ${m.player2_username}</div>
                  <div style="font-size:.875rem;color:rgba(255,255,255,.6);">${m.match_type} • ${new Date(m.played_at).toLocaleDateString('tr-TR')}</div>
                </div>
              </div>
              <div style="text-align:right;">
                <div style="font-weight:700;font-size:1.1rem;color:var(--neon-green);">Kazanan: ${m.winner_username || 'Unknown'}</div>
                <div style="font-size:1rem;color:rgba(255,255,255,.8);">${m.p1_score} - ${m.p2_score}</div>
              </div>
            </div>
          </div>`
      }).join('');
    } catch (e) {
      console.error(e);
      container.innerHTML = `<div style="text-align:center;padding:2rem;color:rgba(255,255,255,.5);"><p>Maç geçmişi yüklenirken hata oluştu</p></div>`;
    }
  }

  private async loadTournamentHistory(userId: number) {
    const container = document.getElementById('tournamentHistoryContainer');
    if (!container) return;
    try {
      const res = await fetch(`${FETCH_ADDRESS}/user/other/${userId}/tournament-history?limit=5`, { method: 'GET', credentials: 'include' });
      if (!res.ok) { container.innerHTML = `<div style="text-align:center;padding:2rem;color:rgba(255,255,255,.5);"><p>Turnuva geçmişi yüklenemedi</p></div>`; return; }
      const data = await res.json();
      const tournaments = data.tournaments || [];
      if (tournaments.length === 0) {
        container.innerHTML = `<div style="text-align:center;padding:2rem;color:rgba(255,255,255,.5);"><p>Henüz turnuva geçmişi yok</p></div>`;
        return;
      }
      container.innerHTML = tournaments.map((t: any) => {
        const positionText = t.final_position === 1 ? '🥇 1. Sıra' : t.final_position === 2 ? '🥈 2. Sıra' : t.final_position === 3 ? '🥉 3. Sıra' : `#${t.final_position}`;
        const positionColor = t.final_position === 1 ? 'var(--neon-yellow)' : t.final_position === 2 ? '#C0C0C0' : t.final_position === 3 ? '#CD7F32' : 'rgba(255,255,255,.6)';
        return `
          <div style="padding:1rem;margin-bottom:.75rem;background:rgba(20,20,40,.5);border-radius:12px;border-left:4px solid ${positionColor};">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:.5rem;">
              <div>
                <div style="font-weight:600;color:white;margin-bottom:.25rem;">Turnuva ${String(t.id).substring(0,8)}</div>
                <div style="font-size:.875rem;color:rgba(255,255,255,.6);">${t.required_players} Oyuncu • ${new Date(t.completed_at).toLocaleDateString('tr-TR')}</div>
                ${t.winner_username ? `<div style=\"font-size:.875rem;color:var(--neon-green);margin-top:.25rem;\">Champion: ${t.winner_username}</div>` : ''}
              </div>
              <div style="text-align:right;">
                <div style="font-weight:700;font-size:1.1rem;color:${positionColor};">${positionText}</div>
              </div>
            </div>
          </div>`
      }).join('');
    } catch (e) {
      console.error(e);
      container.innerHTML = `<div style="text-align:center;padding:2rem;color:rgba(255,255,255,.5);"><p>Turnuva geçmişi yüklenirken hata oluştu</p></div>`;
    }
  }

}

const USER_PROFILE_PAGE = new UserProfilePage();
export { UserProfilePage, USER_PROFILE_PAGE };
