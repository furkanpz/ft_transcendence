import { GlobalState, Page } from "../main";
import { HOME_PAGE } from "./HomePage";
import { CLASSIC_GAME_PAGE } from "./ClassicGamePage";

class TournamentPage implements Page {
    title: string = "Tournament";
    tournamentId: string;
    socket: WebSocket | null = null;
    tournamentState: any = null;
    currentUserId: number = 0;

    constructor(tournamentId: string) {
        this.tournamentId = tournamentId;
    }

    async render(): Promise<void> {
        const app = document.getElementById("app");
        if (!app) return;

        app.innerHTML = `
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

                    <div id="tournamentContent" class="space-y-6">
                        <div class="flex items-center justify-center h-96">
                            <div class="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-purple-500"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('backBtn')?.addEventListener('click', () => {
            if (this.socket) {
                this.socket.close();
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
        const statusColors: any = {
            'waiting': 'bg-yellow-600',
            'in_progress': 'bg-green-600',
            'completed': 'bg-blue-600',
            'cancelled': 'bg-red-600'
        };

        let html = `
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div class="lg:col-span-2 space-y-6">
                    <div class="neon-card border-purple">
                        <div class="flex justify-between items-center mb-4">
                            <h2 class="text-3xl font-bold neon-text-purple">Tournament Bracket</h2>
                            <span class="px-4 py-2 ${statusColors[state.status]} rounded-full text-sm font-bold uppercase">
                                ${state.status.replace('_', ' ')}
                            </span>
                        </div>
                        <div class="text-gray-400 mb-4">
                            <div class="flex gap-6">
                                <span>Round ${state.currentRound} / ${state.maxRounds}</span>
                                <span>Active Players: ${state.activePlayers}</span>
                            </div>
                        </div>
                    </div>

                    ${this.renderBracket()}
                </div>

                <div class="space-y-6">
                    ${this.renderParticipants()}
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

        let html = '<div class="space-y-6">';
        
        for (let round = 1; round <= this.tournamentState.maxRounds; round++) {
            const matches = matchesByRound[round] || [];
            const roundTitle = round === this.tournamentState.maxRounds ? 'Final' : 
                             round === this.tournamentState.maxRounds - 1 ? 'Semi-Finals' : 
                             `Round ${round}`;

            html += `
                <div class="bg-gray-800 rounded-xl p-6 shadow-xl border border-gray-700">
                    <h3 class="text-2xl font-bold mb-4 text-purple-400">${roundTitle}</h3>
                    <div class="space-y-3">
                        ${matches.map((match: any) => this.renderMatch(match)).join('')}
                    </div>
                </div>
            `;
        }

        html += '</div>';
        return html;
    }

    private renderMatch(match: any): string {
        const statusColors: any = {
            'pending': 'border-gray-600 bg-gray-900',
            'in_progress': 'border-yellow-500 bg-yellow-900 bg-opacity-20',
            'completed': 'border-green-600 bg-green-900 bg-opacity-20'
        };

        const isWinner = (playerId: number) => match.winner?.id === playerId;
        const getPlayerClasses = (playerId: number) => {
            if (match.status === 'completed') {
                return isWinner(playerId) ? 'bg-green-700 font-bold' : 'bg-red-900 opacity-75';
            }
            return 'bg-gray-700';
        };

        return `
            <div class="border-2 ${statusColors[match.status]} rounded-lg p-4 transition-all hover:shadow-lg">
                <div class="flex justify-between items-center mb-2">
                    <span class="text-xs font-semibold text-gray-400">Match ${match.matchNumber}</span>
                    ${match.status === 'in_progress' ? 
                        '<span class="text-xs px-2 py-1 bg-yellow-600 rounded-full animate-pulse">LIVE</span>' : ''}
                </div>
                
                <div class="space-y-2">
                    <div class="flex justify-between items-center ${getPlayerClasses(match.player1?.id)} p-3 rounded">
                        <span class="font-medium">${match.player1?.username || 'TBD'}</span>
                        <span class="text-xl font-bold">${match.player1Score || 0}</span>
                    </div>
                    
                    <div class="flex justify-between items-center ${getPlayerClasses(match.player2?.id)} p-3 rounded">
                        <span class="font-medium">${match.player2?.username || 'TBD'}</span>
                        <span class="text-xl font-bold">${match.player2Score || 0}</span>
                    </div>
                </div>

                ${match.status === 'completed' && match.winner ? 
                    `<div class="mt-3 text-center text-sm text-green-400">
                        Winner: ${match.winner.username}
                    </div>` : ''}
            </div>
        `;
    }

    private renderParticipants(): string {
        if (!this.tournamentState || !this.tournamentState.players) return '';

        const activePlayers = this.tournamentState.players.filter((p: any) => !p.isEliminated);
        const eliminatedPlayers = this.tournamentState.players.filter((p: any) => p.isEliminated);

        return `
            <div class="bg-gray-800 rounded-xl p-6 shadow-2xl border border-purple-500 max-h-[600px] overflow-y-auto">
                <h3 class="text-2xl font-bold mb-4">Participants</h3>
                
                <div class="mb-4">
                    <h4 class="text-lg font-semibold text-green-400 mb-2">
                        Active (${activePlayers.length})
                    </h4>
                    <div class="space-y-2">
                        ${activePlayers.map((p: any) => `
                            <div class="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                                <div class="flex items-center gap-2">
                                    <div class="w-2 h-2 rounded-full ${p.isConnected ? 'bg-green-500' : 'bg-gray-500'}"></div>
                                    ${p.hasJoined ? '<span class="text-xs text-green-400">✓</span>' : '<span class="text-xs text-yellow-400"></span>'}
                                    <span class="font-medium">${p.username}</span>
                                </div>
                                <span class="text-xs text-gray-400">Seed #${p.seedPosition}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>

                ${eliminatedPlayers.length > 0 ? `
                    <div>
                        <h4 class="text-lg font-semibold text-red-400 mb-2">
                            Eliminated (${eliminatedPlayers.length})
                        </h4>
                        <div class="space-y-2">
                            ${eliminatedPlayers.map((p: any) => `
                                <div class="flex justify-between items-center p-3 bg-gray-900 rounded-lg opacity-60">
                                    <span class="font-medium line-through">${p.username}</span>
                                    <span class="text-xs text-red-400">OUT</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
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

        localStorage.setItem('activeTournament', this.tournamentId);

        this.socket = new WebSocket(`wss://localhost:3000/ws/tournament/${this.tournamentId}`);

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
                GlobalState.setPage(CLASSIC_GAME_PAGE(message.roomId));
            }
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket error:", error);
        };

        this.socket.onclose = () => {
            console.log("Disconnected from tournament");
        };
    }

    async onLoad(): Promise<void> {
        console.log("Tournament Page loaded");
    }

    async onUnload(): Promise<void> {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        if (this.tournamentState && this.tournamentState.status !== 'completed') {
            console.log("Tournament still active, keeping in localStorage");
        } else {
            localStorage.removeItem('activeTournament');
        }
        
        console.log("Tournament Page unloaded");
    }
}

const GAME_TOURNAMENT_PAGE = (tournamentID: string) => new TournamentPage(tournamentID);

export { GAME_TOURNAMENT_PAGE, TournamentPage };
