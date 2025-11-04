import { GlobalState, Page, FETCH_ADDRESS } from "../main";
import { HOME_PAGE } from "./HomePage";
import { CLASSIC_GAME_PAGE } from "./ClassicGamePage";

class TournamentPage implements Page {
    title: string = "Tournament";
    tournamentId: string;
    socket: WebSocket | null = null;
    tournamentState: any = null;
    currentUserId: number = 0;
    currentGuestId: number | null = null;
    private reconnectAttempted: boolean = false;
    private pollTimer: any = null;

    constructor(tournamentId: string) {
        this.tournamentId = tournamentId;
    }

    async render(): Promise<void> {
        const app = document.getElementById("app");
        if (!app) return;

        app.innerHTML = `
            <style>
                .tournament-layout { display: grid; grid-template-columns: 2fr 1fr; gap: 1.5rem; }
                @media (max-width: 1024px) { .tournament-layout { grid-template-columns: 1fr; } }
                .card { background: var(--glass-bg); border: 1px solid var(--glass-border); border-radius: 16px; padding: 1.25rem; box-shadow: var(--glass-shadow); }
                .status-pill { padding: 0.25rem 0.75rem; border-radius: 999px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
                .status-waiting { background: #a16207; }
                .status-in_progress { background: #166534; }
                .status-completed { background: #1d4ed8; }
                .status-cancelled { background: #991b1b; }
                .match { border: 2px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 1rem; background: rgba(0,0,0,0.25); }
                .match.live { border-color: #ca8a04; background: rgba(180, 83, 9, 0.15); }
                .match.completed { border-color: #16a34a; background: rgba(22, 163, 74, 0.12); }
                .player-row { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0.75rem; border-radius: 8px; background: rgba(55,65,81,0.6); }
                .player-row.winner { background: rgba(34,197,94,0.35); font-weight: 700; }
                .player-row.loser { background: rgba(127,29,29,0.35); opacity: 0.85; }
                .bracket-col { display: flex; flex-direction: column; gap: 0.75rem; }
                .scroll-y { max-height: 600px; overflow-y: auto; }
            </style>
            <div style="min-height: calc(100vh - 80px); color: white; padding: 2rem;">
                <div style="max-width: 1280px; margin: 0 auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h1 style="font-size: 3rem; font-weight: bold; color: var(--neon-magenta); text-shadow: 0 0 10px var(--neon-magenta);">
                            Tournament
                        </h1>
                        <button id="backBtn" class="btn-danger" style="padding: 0.75rem 1.5rem;">
                            ← Back
                        </button>
                    </div>

                    <div id="tournamentContent">
                        <div style="display:flex; align-items:center; justify-content:center; height: 24rem;">
                            <div class="spinner"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('backBtn')?.addEventListener('click', () => {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                try { this.socket.send(JSON.stringify({ action: 'leaveTournament' })); } catch {}
                try { this.socket.close(); } catch {}
            }
            
            if (this.tournamentState && this.tournamentState.status === 'completed') {
                localStorage.removeItem('activeTournament');
            }
            
            GlobalState.setPage(HOME_PAGE);
        });
    }

    private renderTournamentState(): void {
        const content = document.getElementById('tournamentContent');
        if (!content || !this.tournamentState) return;

        const state = this.tournamentState;
        const statusClass: any = {
            'waiting': 'status-waiting',
            'in_progress': 'status-in_progress',
            'completed': 'status-completed',
            'cancelled': 'status-cancelled'
        };

        let html = `
            <div class="tournament-layout">
                <div>
                    <div class="card" style="margin-bottom: 1rem;">
                        <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
                            <h2 class="text-3xl font-bold neon-text-purple">Tournament Bracket</h2>
                            <span class="status-pill ${statusClass[state.status]}">
                                ${state.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div style="color: rgba(255,255,255,0.7); display:flex; gap: 1.5rem;">
                            <span>Round ${state.currentRound} / ${state.maxRounds}</span>
                            <span>Active Players: ${state.activePlayers}</span>
                        </div>
                    </div>
                    ${this.renderBracket()}
                </div>
                <div>
                    ${this.renderParticipants()}
                    ${this.renderPersonalResult()}
                    ${state.status === 'completed' && state.winner ? this.renderWinner() : ''}
                </div>
            </div>
        `;

        content.innerHTML = html;
    }

    private renderBracket(): string {
        if (!this.tournamentState || !this.tournamentState.matches) return '';

        const matchesByRound: any = {};
        this.tournamentState.matches.forEach((match: any) => {
            if (!matchesByRound[match.round]) {
                matchesByRound[match.round] = [];
            }
            matchesByRound[match.round].push(match);
        });

    let html = '<div class="bracket-col">';
        
        for (let round = 1; round <= this.tournamentState.maxRounds; round++) {
            const matches = matchesByRound[round] || [];
            const roundTitle = round === this.tournamentState.maxRounds ? 'Final' : 
                             round === this.tournamentState.maxRounds - 1 ? 'Semi-Finals' : 
                             `Round ${round}`;

            html += `
                <div class="card">
                    <h3 class="text-2xl font-bold mb-4 text-purple-400">${roundTitle}</h3>
                    <div class="bracket-col">
                        ${matches.map((match: any) => this.renderMatch(match)).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    private renderMatch(match: any): string {
        const statusClass: any = {
            'pending': '',
            'in_progress': 'live',
            'completed': 'completed'
        };

        const isWinner = (playerId: number) => match.winner?.id === playerId;
        const getPlayerClasses = (playerId: number) => {
            if (match.status === 'completed') {
                return isWinner(playerId) ? 'bg-green-700 font-bold' : 'bg-red-900 opacity-75';
            }
            return 'bg-gray-700';
        };

        return `
            <div class="match ${statusClass[match.status]}">
                <div style="display:flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <span class="text-sm" style="color: rgba(255,255,255,0.6)">Match ${match.matchNumber}</span>
                    ${match.status === 'in_progress' ? '<span class="text-xs status-pill status-waiting" style="background:#a16207">LIVE</span>' : ''}
                </div>
                <div class="bracket-col">
                    <div class="${getPlayerClasses(match.player1?.id)} player-row">
                        <span class="font-medium">${this.escapeHtml(match.player1?.username || 'TBD')}</span>
                        <span class="text-xl font-bold">${match.player1Score || 0}</span>
                    </div>
                    <div class="${getPlayerClasses(match.player2?.id)} player-row">
                        <span class="font-medium">${this.escapeHtml(match.player2?.username || 'TBD')}</span>
                        <span class="text-xl font-bold">${match.player2Score || 0}</span>
                    </div>
                </div>
                ${match.status === 'completed' && match.winner ? 
                    `<div style="margin-top:0.5rem; text-align:center; font-size: 0.875rem; color: #34d399;">
                        Winner: ${this.escapeHtml(match.winner.username)}
                    </div>` : ''}
            </div>
        `;
    }

    private renderParticipants(): string {
        if (!this.tournamentState || !this.tournamentState.players) return '';

        const activePlayers = this.tournamentState.players.filter((p: any) => !p.isEliminated);
        const eliminatedPlayers = this.tournamentState.players.filter((p: any) => p.isEliminated);

        return `
            <div class="card scroll-y" style="border-color: rgba(170,0,255,0.6);">
                <h3 class="text-2xl font-bold mb-4">Participants</h3>
                <div class="mb-4">
                    <h4 class="text-lg font-semibold" style="color:#34d399; margin-bottom: 0.5rem;">
                        Active (${activePlayers.length})
                    </h4>
                    <div class="bracket-col">
                        ${activePlayers.map((p: any) => `
                            <div class="player-row">
                                <div style="display:flex; align-items:center; gap: 0.5rem;">
                                    <div class="w-2 h-2 rounded-full ${p.isConnected ? 'bg-green-500' : 'bg-gray-500'}"></div>
                                    ${p.hasJoined ? '<span class="text-xs" style="color:#34d399">✓</span>' : '<span class="text-xs" style="color:#f59e0b"></span>'}
                                    <span class="font-medium">${this.escapeHtml(p.username)}</span>
                                </div>
                                <span class="text-xs" style="color: rgba(255,255,255,0.6)">Seed #${p.seedPosition}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${eliminatedPlayers.length > 0 ? `
                    <div>
                        <h4 class="text-lg font-semibold" style="color:#f87171; margin-bottom: 0.5rem;">
                            Eliminated (${eliminatedPlayers.length})
                        </h4>
                        <div class="bracket-col">
                            ${eliminatedPlayers.map((p: any) => `
                                <div class="player-row" style="opacity:0.7; background: rgba(17,24,39,0.8)">
                                    <span class="font-medium" style="text-decoration: line-through;">${this.escapeHtml(p.username)}</span>
                                    <span class="text-xs" style="color:#f87171">OUT</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    private escapeHtml(text: string): string {
        const map: Record<string, string> = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, (m) => map[m]);
    }

    private renderWinner(): string {
        const winner = this.tournamentState.winner;
        return `
            <div class="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 shadow-2xl border-4 border-yellow-400 animate-pulse">
                <div class="text-center">
                    <div class="text-6xl mb-4">🏆</div>
                    <h3 class="text-2xl font-bold mb-2">CHAMPION</h3>
                    <p class="text-3xl font-bold">${winner.username}</p>
                </div>
            </div>
        `;
    }

    async onPreLoad(): Promise<void> {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            this.currentUserId = user.id;
        }

        const guestStr = localStorage.getItem('guestPlayerId') || localStorage.getItem('currentGuestId');
        if (guestStr) {
            const parsed = parseInt(guestStr, 10);
            if (!isNaN(parsed)) this.currentGuestId = parsed;
        }

    localStorage.setItem('activeTournament', this.tournamentId);

    const guestId = localStorage.getItem('guestPlayerId');
    const guestAlias = localStorage.getItem('guestAlias');
    const qs = guestId ? `?guestId=${encodeURIComponent(guestId)}${guestAlias?`&alias=${encodeURIComponent(guestAlias)}`:''}` : '';
    this.socket = new WebSocket(`wss://localhost:3000/ws/tournament/${this.tournamentId}${qs}`);
        try {
            const resp = await fetch(`${FETCH_ADDRESS}/tournament/${this.tournamentId}`, { credentials: 'include' });
            if (resp.ok) {
                const json = await resp.json();
                if (json?.data?.tournament) {
                    this.tournamentState = json.data.tournament;
                    if (this.tournamentState?.status === 'completed') {
                        localStorage.removeItem('activeTournament');
                    }
                    this.renderTournamentState();
                }
            }
        } catch (e) {
            console.warn('HTTP fallback for tournament state failed:', e);
        }

        this.pollTimer = setInterval(async () => {
            try {
                const resp = await fetch(`${FETCH_ADDRESS}/tournament/${this.tournamentId}`, { credentials: 'include' });
                if (resp.ok) {
                    const json = await resp.json();
                    if (json?.data?.tournament) {
                        this.tournamentState = json.data.tournament;
                        this.renderTournamentState();
                        if (this.tournamentState?.status === 'completed') {
                            clearInterval(this.pollTimer);
                            this.pollTimer = null;
                            localStorage.removeItem('activeTournament');
                        }
                    }
                }
            } catch {}
        }, 5000);

        this.socket.onopen = () => {
            console.log("Connected to tournament");
    
            setTimeout(() => {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    this.socket.send(JSON.stringify({
                        action: 'joinTournament'
                    }));
                    console.log("Sent joinTournament event");
                }
            }, 500);
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            console.log("Tournament message:", message);

            if (message.action === 'tournamentState' || message.action === 'tournamentUpdate') {
                this.tournamentState = message.state;
                
                if (this.tournamentState.status === 'completed') {
                    localStorage.removeItem('activeTournament');
                }
                
                this.renderTournamentState();
            } else if (message.action === 'matchStarting') {
                if (typeof message.playerId !== 'undefined') {
                    localStorage.setItem('currentGuestId', String(message.playerId));
                    this.currentGuestId = Number(message.playerId);
                }
                GlobalState.setPage(CLASSIC_GAME_PAGE(message.roomId));
            }
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        this.socket.onclose = async () => {
            console.log("Disconnected from tournament");
            if (!this.reconnectAttempted) {
                this.reconnectAttempted = true;
                try {
                    await new Promise(r => setTimeout(r, 1000));
                    const guestId = localStorage.getItem('guestPlayerId');
                    const guestAlias = localStorage.getItem('guestAlias');
                    const qs = guestId ? `?guestId=${encodeURIComponent(guestId)}${guestAlias?`&alias=${encodeURIComponent(guestAlias)}`:''}` : '';
                    this.socket = new WebSocket(`wss://localhost:3000/ws/tournament/${this.tournamentId}${qs}`);
                    this.socket.onopen = () => {
                        try { this.socket?.send(JSON.stringify({ action: 'joinTournament' })); } catch {}
                    };
                    this.socket.onmessage = (ev) => {
                        const msg = JSON.parse(ev.data);
                        if (msg.action === 'tournamentState' || msg.action === 'tournamentUpdate') {
                            this.tournamentState = msg.state;
                            this.renderTournamentState();
                        }
                    };
                } catch (_) {}
            }
            try {
                const resp = await fetch(`${FETCH_ADDRESS}/tournament/${this.tournamentId}`, { credentials: 'include' });
                if (resp.ok) {
                    const json = await resp.json();
                    if (json?.data?.tournament) {
                        this.tournamentState = json.data.tournament;
                        this.renderTournamentState();
                    }
                }
            } catch {}
        };
    }

    async onLoad(): Promise<void> {
        console.log("Tournament Page loaded");
        window.addEventListener('beforeunload', this.handleBeforeUnload as any);
    }

    async onUnload(): Promise<void> {
        window.removeEventListener('beforeunload', this.handleBeforeUnload as any);
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        if (this.pollTimer) {
            clearInterval(this.pollTimer);
            this.pollTimer = null;
        }
        
        if (this.tournamentState && this.tournamentState.status !== 'completed') {
            console.log("Tournament still active, keeping in localStorage");
        } else {
            localStorage.removeItem('activeTournament');
        }
        
        console.log("Tournament Page unloaded");
    }

    private handleBeforeUnload = () => {
        try {
            if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                this.socket.send(JSON.stringify({ action: 'leaveTournament' }));
            }
        } catch {}
    };

    private getCurrentPlayerId(): number | null {
        if (this.currentUserId && this.currentUserId !== 0) return this.currentUserId;
        if (this.currentGuestId && !isNaN(this.currentGuestId)) return this.currentGuestId;
        const gs = localStorage.getItem('guestPlayerId');
        if (gs) {
            const parsed = parseInt(gs, 10);
            if (!isNaN(parsed)) return parsed;
        }
        return null;
    }

    private renderPersonalResult(): string {
        const me = this.getCurrentPlayerId();
        if (!me || !this.tournamentState?.matches) return '';

        const myMatches = this.tournamentState.matches
            .filter((m: any) => (m.player1?.id === me || m.player2?.id === me))
            .sort((a: any, b: any) => (b.round - a.round) || (b.matchNumber - a.matchNumber));

        if (myMatches.length === 0) return '';
        const latest = myMatches[0];

        let statusText = '';
        let statusColor = '';
        let scoreText = '';

        if (latest.status === 'completed') {
            const iWon = latest.winner?.id === me;
            statusText = iWon ? 'You Won' : 'You Lost';
            statusColor = iWon ? '#34d399' : '#f87171';
            scoreText = `${latest.player1Score ?? 0} - ${latest.player2Score ?? 0}`;
        } else if (latest.status === 'in_progress') {
            statusText = 'Match in progress';
            statusColor = '#f59e0b';
            scoreText = `${latest.player1Score ?? 0} - ${latest.player2Score ?? 0}`;
        } else {
            statusText = 'Waiting for match';
            statusColor = 'rgba(255,255,255,0.7)';
            scoreText = '';
        }

        const opponent = latest.player1?.id === me ? latest.player2 : latest.player1;
        const oppName = opponent?.username ? this.escapeHtml(opponent.username) : 'TBD';

        return `
            <div class="card" style="margin-top: 1rem; border-color: rgba(52, 211, 153, 0.4)">
                <h3 class="text-2xl font-bold mb-2">Your Match</h3>
                <div style="display:flex; justify-content: space-between; align-items:center;">
                    <div>
                        <div style="font-size: 0.875rem; color: rgba(255,255,255,0.6)">vs</div>
                        <div style="font-size: 1.25rem; font-weight: 700;">${oppName}</div>
                    </div>
                    <div style="text-align:right;">
                        <div style="font-weight: 700; color: ${statusColor}">${statusText}</div>
                        ${scoreText ? `<div style="opacity:0.9;">${scoreText}</div>` : ''}
                    </div>
                </div>
            </div>
        `;
    }
}

const GAME_TOURNAMENT_PAGE = (tournamentID: string) => new TournamentPage(tournamentID);

export { GAME_TOURNAMENT_PAGE, TournamentPage };
