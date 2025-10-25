import { WebSocket } from "ws";
import { getDb } from "../../db/db.get";
import { classicGameManager } from "./game.manager";
import { GameType } from "../../types/game.types";

interface TournamentPlayer {
    id: number;
    username: string;
    socket?: WebSocket;
    seedPosition: number;
    currentRound: number;
    isEliminated: boolean;
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

    public async createTournament(playerIds: number[]): Promise<string> {
        if (playerIds.length !== 8) {
            throw new Error("Tournament requires exactly 8 players");
        }

        const db = await getDb();
        const tournamentId = crypto.randomUUID();

        await db.run(
            `INSERT INTO ft_tournaments (id, status, required_players, current_round, max_rounds) 
             VALUES (?, 'waiting', 8, 1, 3)`,
            [tournamentId]
        );

        const players = new Map<number, TournamentPlayer>();
        for (let i = 0; i < playerIds.length; i++) {
            const userId = playerIds[i];
            const user = await db.get(`SELECT username FROM ft_users WHERE id = ?`, [userId]);
            
            await db.run(
                `INSERT INTO ft_tournament_participants (tournament_id, user_id, seed_position, current_round) 
                 VALUES (?, ?, ?, 1)`,
                [tournamentId, userId, i + 1]
            );

            players.set(userId, {
                id: userId,
                username: user?.username || `Player${userId}`,
                seedPosition: i + 1,
                currentRound: 1,
                isEliminated: false
            });

            this.playerTournaments.set(userId, tournamentId);
        }

        const tournament: Tournament = {
            id: tournamentId,
            status: 'waiting',
            requiredPlayers: 8,
            currentRound: 1,
            maxRounds: 3,
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

        const db = await getDb();
        const activePlayers = Array.from(tournament.players.values()).filter(p => !p.isEliminated);
        
        const matchesInRound: TournamentMatch[] = [];
        const matchCount = activePlayers.length / 2;

        for (let i = 0; i < matchCount; i++) {
            const player1 = activePlayers[i * 2];
            const player2 = activePlayers[i * 2 + 1];

            const result = await db.run(
                `INSERT INTO ft_tournament_matches 
                 (tournament_id, round_number, match_number, player1_id, player2_id, status) 
                 VALUES (?, ?, ?, ?, ?, 'pending')`,
                [tournamentId, round, i + 1, player1.id, player2.id]
            );

            matchesInRound.push({
                id: result.lastID!,
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

        const db = await getDb();
        await db.run(
            `UPDATE ft_tournaments SET status = 'in_progress', started_at = CURRENT_TIMESTAMP WHERE id = ?`,
            [tournamentId]
        );

        tournament.status = 'in_progress';
        await this.startRoundMatches(tournamentId, 1);
        this.broadcastTournamentState(tournamentId);
    }

    private async startRoundMatches(tournamentId: string, round: number): Promise<void> {
        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const matches = tournament.matches.get(round);
        if (!matches) return;

        for (let i = 0; i < matches.length; i++) {
            const match = matches[i];
            if (match.player1Id && match.player2Id) {
                await this.startMatch(tournamentId, match);
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
    }

    private async startMatch(tournamentId: string, match: TournamentMatch): Promise<void> {
        if (!match.player1Id || !match.player2Id) return;

        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const player1Socket = tournament.sockets.get(match.player1Id);
        const player2Socket = tournament.sockets.get(match.player2Id);

        if (!player1Socket || !player2Socket) {
            console.error(`Cannot start match ${match.matchNumber}: Players not connected`);
            return;
        }

        const roomId = classicGameManager.createRoom([match.player1Id, match.player2Id], GameType.Tournament);
        match.roomId = roomId;
        match.status = 'in_progress';

        const db = await getDb();
        await db.run(
            `UPDATE ft_tournament_matches 
             SET status = 'in_progress', room_id = ?, started_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [roomId, match.id]
        );

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

        const db = await getDb();
        await db.run(
            `UPDATE ft_tournament_matches 
             SET winner_id = ?, player1_score = ?, player2_score = ?, status = 'completed', completed_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [winnerId, player1Score, player2Score, match.id]
        );

        await db.run(
            `UPDATE ft_tournament_participants 
             SET is_eliminated = TRUE, eliminated_at = CURRENT_TIMESTAMP 
             WHERE tournament_id = ? AND user_id = ?`,
            [tournamentId, loserId]
        );

        await db.run(
            `INSERT INTO ft_match_history 
             (player1_id, player2_id, winner_id, loser_id, p1_score, p2_score, match_type, tournament_id) 
             VALUES (?, ?, ?, ?, ?, ?, 'tournament', ?)`,
            [player1Id, player2Id, winnerId, loserId, player1Score, player2Score, tournamentId]
        );

        const tournament = this.tournaments.get(tournamentId);
        if (!tournament) return;

        const loserPlayer = tournament.players.get(loserId);
        if (loserPlayer) {
            loserPlayer.isEliminated = true;
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
        
        const db = await getDb();
        await db.run(
            `UPDATE ft_tournaments SET current_round = ? WHERE id = ?`,
            [tournament.currentRound, tournamentId]
        );

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
        await db.run(
            `UPDATE ft_tournaments 
             SET status = 'completed', winner_id = ?, completed_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [winnerId, tournamentId]
        );

        await db.run(
            `UPDATE ft_tournament_participants 
             SET final_position = 1 
             WHERE tournament_id = ? AND user_id = ?`,
            [tournamentId, winnerId]
        );

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
            tournament.sockets.delete(userId);
            if (player) {
                player.socket = undefined;
            }
        });
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
            isConnected: tournament.sockets.has(p.id)
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
