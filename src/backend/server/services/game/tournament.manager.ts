import { WebSocket } from "ws";
import { getDb } from "../../db/db.get";
import { gameManager } from "./game.manager";
import { GameType } from "../../types/game.types";

interface TournamentPlayer {
    id: number;
    username: string;
    socket?: WebSocket;
    seedPosition: number;
    currentRound: number;
    isEliminated: boolean;
    hasJoined: boolean; // Track if player has sent join event
}

interface TournamentMatch {
    id: number;
    tournamentId: string;
    roundNumber: number;
    matchNumber: number;
    player1Id: number | null;
    player2Id: number | null;
    winnerId: number | null;
    player1Score: number;
    player2Score: number;
    status: 'pending' | 'in_progress' | 'completed';
    roomId: string | null;
}

interface Tournament {
    id: string;
    status: 'waiting' | 'in_progress' | 'completed' | 'cancelled';
    requiredPlayers: number;
    currentRound: number;
    maxRounds: number;
    winnerId: number | null;
    players: Map<number, TournamentPlayer>;
    matches: Map<number, TournamentMatch[]>;
    sockets: Map<number, WebSocket>;
}

class TournamentManager {
    private tournaments: Map<string, Tournament> = new Map();
    private playerTournaments: Map<number, string> = new Map();
    private nextMatchId: number = 1; // in-memory match id generator

    public async createTournament(playerIds: number[]): Promise<string> {
        if (playerIds.length !== 4) {
            throw new Error("Tournament requires exactly 4 players");
        }

        const db = await getDb();
        const tournamentId = crypto.randomUUID();

        const players = new Map<number, TournamentPlayer>();
        for (let i = 0; i < playerIds.length; i++) {
            const userId = playerIds[i];
            const user = await db.get(`SELECT username FROM ft_users WHERE id = ?`, [userId]);
            
            players.set(userId, {
                id: userId,
                username: user?.username || `Player${userId}`,
                seedPosition: i + 1,
                currentRound: 1,
                isEliminated: false,
                hasJoined: false
            });

            this.playerTournaments.set(userId, tournamentId);
        }

        const tournament: Tournament = {
            id: tournamentId,
            status: 'waiting',
            requiredPlayers: 4,
            currentRound: 1,
            maxRounds: 2,
            winnerId: null,
            players,
            matches: new Map(),
            sockets: new Map()
        };

        this.tournaments.set(tournamentId, tournament);
        await this.generateRoundMatches(tournamentId, 1);

        return tournamentId;
    }

    private async generateRoundMatches(tournamentId: string, round: number): Promise<void> {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const activePlayers = Array.from(tournament.players.values()).filter(p => !p.isEliminated);
        
        const matchesInRound: TournamentMatch[] = [];
        const matchCount = activePlayers.length / 2;

        for (let i = 0; i < matchCount; i++) {
            const player1 = activePlayers[i * 2];
            const player2 = activePlayers[i * 2 + 1];

            matchesInRound.push({
                id: this.nextMatchId++,
                tournamentId,
                roundNumber: round,
                matchNumber: i + 1,
                player1Id: player1.id,
                player2Id: player2.id,
                winnerId: null,
                player1Score: 0,
                player2Score: 0,
                status: 'pending',
                roomId: null
            });
        }

        tournament.matches.set(round, matchesInRound);
    }

    public async startTournament(tournamentId: string): Promise<void> {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament || tournament.status !== 'waiting') return;

        tournament.status = 'in_progress';
        await this.startRoundMatches(tournamentId, 1);
        this.broadcastTournamentState(tournamentId);
    }

    private async startRoundMatches(tournamentId: string, round: number): Promise<void> {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const matches = tournament.matches.get(round);
        if (!matches) return;

        // Wait a bit to ensure all players are connected to tournament page
        await new Promise(resolve => setTimeout(resolve, 3000));

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            if (match.player1Id && match.player2Id) {
                await this.startMatch(tournamentId, match);
                // Small delay between matches for UX
                if (i < matches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }
    }

    private async startMatch(tournamentId: string, match: TournamentMatch): Promise<void> {
        if (!match.player1Id || !match.player2Id) return;

        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const player1Socket = tournament.sockets.get(match.player1Id);
        const player2Socket = tournament.sockets.get(match.player2Id);
        const player1 = tournament.players.get(match.player1Id);
        const player2 = tournament.players.get(match.player2Id);

        // Check if players are connected AND have sent join event
        const player1Ready = player1Socket && player1?.hasJoined;
        const player2Ready = player2Socket && player2?.hasJoined;

        if (!player1Ready || !player2Ready) {
            console.error(`Cannot start match ${match.matchNumber}: Players not ready`);
            
            // Auto-forfeit: Give win to connected player or cancel match
            if (player1Ready && !player2Ready) {
                console.log(`Player ${match.player2Id} forfeited, ${match.player1Id} wins by default`);
                if (player2) {
                    player2.isEliminated = true;
                    this.playerTournaments.delete(match.player2Id);
                }
                await this.handleMatchResult('', match.player1Id, match.player2Id, 5, 0);
            } else if (player2Ready && !player1Ready) {
                console.log(`Player ${match.player1Id} forfeited, ${match.player2Id} wins by default`);
                if (player1) {
                    player1.isEliminated = true;
                    this.playerTournaments.delete(match.player1Id);
                }
                await this.handleMatchResult('', match.player1Id, match.player2Id, 0, 5);
            } else {
                console.log(`Both players not ready, cancelling match ${match.matchNumber}`);
                // Cancel this match - both players eliminated
                if (player1) {
                    player1.isEliminated = true;
                    this.playerTournaments.delete(match.player1Id);
                }
                if (player2) {
                    player2.isEliminated = true;
                    this.playerTournaments.delete(match.player2Id);
                }
                match.status = 'completed';
            }
            return;
        }

        const roomId = gameManager.createRoom([match.player1Id, match.player2Id], GameType.Tournament);
        match.roomId = roomId;
        match.status = 'in_progress';

        // Do not persist 'in_progress' state to DB; keep it in memory only.
        // This ensures players can reconnect/join without being blocked by DB state.

        console.log(`Starting tournament match: Round ${match.roundNumber}, Match ${match.matchNumber}, Room: ${roomId}`);

        player1Socket.send(JSON.stringify({
            action: 'matchStarting',
            tournamentId,
            roomId,
            opponentId: match.player2Id,
            round: match.roundNumber,
            matchNumber: match.matchNumber
        }));

        player2Socket.send(JSON.stringify({
            action: 'matchStarting',
            tournamentId,
            roomId,
            opponentId: match.player1Id,
            round: match.roundNumber,
            matchNumber: match.matchNumber
        }));

        this.broadcastTournamentState(tournamentId);
    }

    public async handleMatchResult(roomId: string, player1Id: number, player2Id: number, player1Score: number, player2Score: number): Promise<void> {
        let tournamentId: string | null = null;
        let match: TournamentMatch | null = null;

        for (const [tId, tournament] of this.tournaments) {
            for (const matches of tournament.matches.values()) {
                const foundMatch = matches.find(m => m.roomId === roomId);
                if (foundMatch) {
                    tournamentId = tId;
                    match = foundMatch;
                    break;
                }
            }
            if (match) break;
        }

        if (!tournamentId || !match) return;

        const winnerId = player1Score > player2Score ? player1Id : player2Id;
        const loserId = player1Score > player2Score ? player2Id : player1Id;

        match.winnerId = winnerId;
        match.player1Score = player1Score;
        match.player2Score = player2Score;
        match.status = 'completed';

        // Do not persist per-match results until tournament completes.

        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const loserPlayer = tournament.players.get(loserId);
        if (loserPlayer) {
            loserPlayer.isEliminated = true;
            // Remove eliminated player from active tournament tracking
            this.playerTournaments.delete(loserId);
            console.log(`Player ${loserId} eliminated from tournament ${tournamentId}`);
        }

        this.broadcastTournamentState(tournamentId);

        const currentRoundMatches = tournament.matches.get(tournament.currentRound);
        const allMatchesCompleted = currentRoundMatches?.every(m => m.status === 'completed');

        if (allMatchesCompleted) {
            await this.advanceToNextRound(tournamentId);
        }
    }

    private async advanceToNextRound(tournamentId: string): Promise<void> {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const activePlayers = Array.from(tournament.players.values()).filter(p => !p.isEliminated);

        if (activePlayers.length === 1) {
            await this.completeTournament(tournamentId, activePlayers[0].id);
            return;
        }

        tournament.currentRound++;
        
        // Keep current round only in memory; no DB writes until completion

        await this.generateRoundMatches(tournamentId, tournament.currentRound);
        
        setTimeout(() => {
            this.startRoundMatches(tournamentId, tournament.currentRound);
        }, 5000);

        this.broadcastTournamentState(tournamentId);
    }

    private async completeTournament(tournamentId: string, winnerId: number): Promise<void> {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        tournament.status = 'completed';
        tournament.winnerId = winnerId;

        const db = await getDb();
        // Persist entire tournament only now
        await db.run(
            `INSERT INTO ft_tournaments (id, status, required_players, current_round, max_rounds, winner_id, completed_at)
             VALUES (?, 'completed', ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            [tournamentId, tournament.requiredPlayers, tournament.currentRound, tournament.maxRounds, winnerId]
        );

        // Persist participants (with minimal info; mark winner position=1)
        for (const p of tournament.players.values()) {
            await db.run(
                `INSERT INTO ft_tournament_participants (tournament_id, user_id, seed_position, current_round, is_eliminated, final_position)
                 VALUES (?, ?, ?, ?, ?, ?)`,
                [tournamentId, p.id, p.seedPosition, p.currentRound, p.isEliminated ? 1 : 0, p.id === winnerId ? 1 : null]
            );
        }

        // Persist all matches with final scores and winners
        for (const matches of tournament.matches.values()) {
            for (const m of matches) {
                await db.run(
                    `INSERT INTO ft_tournament_matches (
                        tournament_id, round_number, match_number, player1_id, player2_id,
                        winner_id, player1_score, player2_score, status, completed_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP)`,
                    [tournamentId, m.roundNumber, m.matchNumber, m.player1Id, m.player2Id, m.winnerId, m.player1Score, m.player2Score]
                );

                // Also persist into match history
                if (m.player1Id && m.player2Id && m.winnerId !== null) {
                    const loserId = m.winnerId === m.player1Id ? m.player2Id! : m.player1Id!;
                    await db.run(
                        `INSERT INTO ft_match_history 
                         (player1_id, player2_id, winner_id, loser_id, p1_score, p2_score, match_type, tournament_id) 
                         VALUES (?, ?, ?, ?, ?, ?, 'tournament', ?)`,
                        [m.player1Id, m.player2Id, m.winnerId, loserId, m.player1Score, m.player2Score, tournamentId]
                    );
                }
            }
        }

        this.broadcastTournamentState(tournamentId);

        tournament.players.forEach((player, playerId) => {
            this.playerTournaments.delete(playerId);
        });
    }

    public addPlayerSocket(tournamentId: string, userId: number, socket: WebSocket): void {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        tournament.sockets.set(userId, socket);
        
        const player = tournament.players.get(userId);
        if (player) {
            player.socket = socket;
        }

        this.sendTournamentState(tournamentId, userId);

        socket.on('close', () => {
            console.log(`Player ${userId} disconnected from tournament ${tournamentId}`);
            tournament.sockets.delete(userId);
            if (player) {
                player.socket = undefined;
                // If tournament is in progress and player hasn't finished their match, eliminate them
                if (tournament.status === 'in_progress' && !player.isEliminated) {
                    this.handlePlayerDisconnect(tournamentId, userId);
                }
            }
        });
    }

    public handlePlayerJoin(tournamentId: string, userId: number): void {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const player = tournament.players.get(userId);
        if (player) {
            player.hasJoined = true;
            console.log(`Player ${userId} joined tournament ${tournamentId}`);
            
            // Check if all players have joined
            const allJoined = Array.from(tournament.players.values()).every(p => p.hasJoined);
            if (allJoined && tournament.status === 'waiting') {
                console.log(`All players joined tournament ${tournamentId}, starting soon...`);
            }
            
            this.broadcastTournamentState(tournamentId);
        }
    }

    private handlePlayerDisconnect(tournamentId: string, userId: number): void {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const player = tournament.players.get(userId);
        if (!player || player.isEliminated) return;

        console.log(`Eliminating disconnected player ${userId} from tournament ${tournamentId}`);
        player.isEliminated = true;
        this.playerTournaments.delete(userId);

        // Find if this player is in an active match
        const currentRoundMatches = tournament.matches.get(tournament.currentRound);
        if (currentRoundMatches) {
            const activeMatch = currentRoundMatches.find(m => 
                (m.player1Id === userId || m.player2Id === userId) && 
                m.status === 'in_progress'
            );

            if (activeMatch) {
                // Award the match to the opponent
                const opponentId = activeMatch.player1Id === userId ? activeMatch.player2Id : activeMatch.player1Id;
                if (opponentId) {
                    console.log(`Awarding match to player ${opponentId} due to opponent disconnect`);
                    this.handleMatchResult(activeMatch.roomId || '', 
                        activeMatch.player1Id!, 
                        activeMatch.player2Id!, 
                        activeMatch.player1Id === userId ? 0 : 5,
                        activeMatch.player2Id === userId ? 0 : 5
                    );
                }
            }
        }

        this.broadcastTournamentState(tournamentId);
    }

    private broadcastTournamentState(tournamentId: string): void {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const state = this.getTournamentState(tournamentId);
        const message = JSON.stringify({
            action: 'tournamentUpdate',
            state
        });

        tournament.sockets.forEach((socket) => {
            socket.send(message);
        });
    }

    private sendTournamentState(tournamentId: string, userId: number): void {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const socket = tournament.sockets.get(userId);
        if (!socket) return;

        const state = this.getTournamentState(tournamentId);
        socket.send(JSON.stringify({
            action: 'tournamentState',
            state
        }));
    }

    private getTournamentState(tournamentId: string): any {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return null;

        const players = Array.from(tournament.players.values()).map(p => ({
            id: p.id,
            username: p.username,
            seedPosition: p.seedPosition,
            currentRound: p.currentRound,
            isEliminated: p.isEliminated,
            isConnected: tournament.sockets.has(p.id),
            hasJoined: p.hasJoined
        }));

        const allMatches: any[] = [];
        tournament.matches.forEach((matches, round) => {
            matches.forEach(match => {
                allMatches.push({
                    id: match.id,
                    round: match.roundNumber,
                    matchNumber: match.matchNumber,
                    player1: match.player1Id ? this.getPlayerInfo(tournament, match.player1Id) : null,
                    player2: match.player2Id ? this.getPlayerInfo(tournament, match.player2Id) : null,
                    winner: match.winnerId ? this.getPlayerInfo(tournament, match.winnerId) : null,
                    player1Score: match.player1Score,
                    player2Score: match.player2Score,
                    status: match.status
                });
            });
        });

        return {
            id: tournament.id,
            status: tournament.status,
            currentRound: tournament.currentRound,
            maxRounds: tournament.maxRounds,
            requiredPlayers: tournament.requiredPlayers,
            currentPlayers: tournament.players.size,
            activePlayers: players.filter(p => !p.isEliminated).length,
            players,
            matches: allMatches,
            winner: tournament.winnerId ? this.getPlayerInfo(tournament, tournament.winnerId) : null
        };
    }

    private getPlayerInfo(tournament: Tournament, playerId: number): any {
        const player = tournament.players.get(playerId);
        if (!player) return null;

        return {
            id: player.id,
            username: player.username,
            seedPosition: player.seedPosition,
            isEliminated: player.isEliminated
        };
    }

    public async getPastTournaments(limit: number = 10): Promise<any[]> {
        const db = await getDb();
        const tournaments = await db.all(
            `SELECT t.*, u.username as winner_username 
             FROM ft_tournaments t 
             LEFT JOIN ft_users u ON t.winner_id = u.id 
             WHERE t.status = 'completed' 
             ORDER BY t.completed_at DESC 
             LIMIT ?`,
            [limit]
        );

        const result = [];
        for (const tournament of tournaments) {
            const participants = await db.all(
                `SELECT tp.*, u.username 
                 FROM ft_tournament_participants tp 
                 JOIN ft_users u ON tp.user_id = u.id 
                 WHERE tp.tournament_id = ? 
                 ORDER BY tp.seed_position`,
                [tournament.id]
            );

            result.push({
                id: tournament.id,
                status: tournament.status,
                winner: {
                    id: tournament.winner_id,
                    username: tournament.winner_username
                },
                participantCount: participants.length,
                createdAt: tournament.created_at,
                completedAt: tournament.completed_at
            });
        }

        return result;
    }

    public getTournamentIdForPlayer(userId: number): string | undefined {
        return this.playerTournaments.get(userId);
    }

    public isPlayerInTournament(userId: number): boolean {
        return this.playerTournaments.has(userId);
    }

    public async getTournamentDetails(tournamentId: string): Promise<any> {
        const tournament = this.tournaments.get(tournamentId);
        if (tournament) {
            return this.getTournamentState(tournamentId);
        }

        const db = await getDb();
        const tournamentData = await db.get(
            `SELECT t.*, u.username as winner_username 
             FROM ft_tournaments t 
             LEFT JOIN ft_users u ON t.winner_id = u.id 
             WHERE t.id = ?`,
            [tournamentId]
        );

        if (!tournamentData) return null;

        const participants = await db.all(
            `SELECT tp.*, u.username 
             FROM ft_tournament_participants tp 
             JOIN ft_users u ON tp.user_id = u.id 
             WHERE tp.tournament_id = ? 
             ORDER BY tp.seed_position`,
            [tournamentId]
        );

        const matches = await db.all(
            `SELECT tm.*, 
                    u1.username as player1_username,
                    u2.username as player2_username,
                    w.username as winner_username
             FROM ft_tournament_matches tm
             LEFT JOIN ft_users u1 ON tm.player1_id = u1.id
             LEFT JOIN ft_users u2 ON tm.player2_id = u2.id
             LEFT JOIN ft_users w ON tm.winner_id = w.id
             WHERE tm.tournament_id = ?
             ORDER BY tm.round_number, tm.match_number`,
            [tournamentId]
        );

        return {
            id: tournamentData.id,
            status: tournamentData.status,
            currentRound: tournamentData.current_round,
            maxRounds: tournamentData.max_rounds,
            requiredPlayers: tournamentData.required_players,
            currentPlayers: participants.length,
            activePlayers: participants.filter((p: any) => !p.is_eliminated).length,
            players: participants.map((p: any) => ({
                id: p.user_id,
                username: p.username,
                seedPosition: p.seed_position,
                isEliminated: p.is_eliminated,
                finalPosition: p.final_position
            })),
            matches: matches.map((m: any) => ({
                id: m.id,
                round: m.round_number,
                matchNumber: m.match_number,
                player1: m.player1_id ? { id: m.player1_id, username: m.player1_username } : null,
                player2: m.player2_id ? { id: m.player2_id, username: m.player2_username } : null,
                winner: m.winner_id ? { id: m.winner_id, username: m.winner_username } : null,
                player1Score: m.player1_score,
                player2Score: m.player2_score,
                status: m.status
            })),
            winner: tournamentData.winner_id ? {
                id: tournamentData.winner_id,
                username: tournamentData.winner_username
            } : null,
            createdAt: tournamentData.created_at,
            startedAt: tournamentData.started_at,
            completedAt: tournamentData.completed_at
        };
    }
}

export const tournamentManager = new TournamentManager();
