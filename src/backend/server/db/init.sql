CREATE TABLE IF NOT EXISTS ft_users (
 	id			INTEGER PRIMARY KEY AUTOINCREMENT,	
	email		VARCHAR(150) UNIQUE NOT NULL,
	username	VARCHAR(50) UNIQUE NOT NULL,
	password	TEXT NOT NULL,
	user_role	TEXT CHECK(user_role IN ('USER', 'ADMIN')) DEFAULT 'USER',
	avatar_url	TEXT DEFAULT 'https://placehold.co/150x150/cccccc/000000?text=Avatar',
    is_online	BOOLEAN DEFAULT FALSE,
	twof_active	BOOLEAN DEFAULT FALSE,
    created_at	DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at	DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login	DATETIME
);

CREATE TABLE IF NOT EXISTS ft_friendship (
	id			INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id		INTEGER NOT NULL,
	friend_id	INTEGER NOT NULL,
	stat		TEXT CHECK(stat IN ('Pending', 'Accepted')) NOT NULL
);

CREATE TABLE IF NOT EXISTS ft_blocks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    blocker_id  INTEGER NOT NULL, 
    blocked_id  INTEGER NOT NULL, 
    blocked_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (blocker_id, blocked_id) 
);

CREATE TABLE IF NOT EXISTS ft_twof (
	id			INTEGER PRIMARY KEY AUTOINCREMENT,
	user_id		INTEGER NOT NULL,
	twof_secret	TEXT NOT NULL,
	twof_code	TEXT NOT NULL,
	twof_expiry	DATETIME NOT NULL,
	is_verified	BOOLEAN DEFAULT FALSE
);

-- Chat tables
CREATE TABLE IF NOT EXISTS ft_chat_rooms (
    id          TEXT PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    created_by  INTEGER NOT NULL,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_private  BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (created_by) REFERENCES ft_users(id)
);

CREATE TABLE IF NOT EXISTS ft_chat_messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id     TEXT NOT NULL,
    user_id     INTEGER NOT NULL,
    message     TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'text',
    timestamp   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES ft_chat_rooms(id),
    FOREIGN KEY (user_id) REFERENCES ft_users(id)
);

CREATE TABLE IF NOT EXISTS ft_chat_participants (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id     TEXT NOT NULL,
    user_id     INTEGER NOT NULL,
    joined_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (room_id, user_id),
    FOREIGN KEY (room_id) REFERENCES ft_chat_rooms(id),
    FOREIGN KEY (user_id) REFERENCES ft_users(id)
);

CREATE TABLE IF NOT EXISTS ft_match_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    player1_id  INTEGER NOT NULL,
    player2_id  INTEGER NOT NULL,
    winner_id   INTEGER NOT NULL,
    loser_id    INTEGER NOT NULL,
    p1_score    INTEGER NOT NULL,
    p2_score    INTEGER NOT NULL,
    match_type  TEXT CHECK(match_type IN ('classic', 'tournament', 'multiplayer')) DEFAULT 'classic',
    tournament_id TEXT,
    played_at   DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player1_id) REFERENCES ft_users(id),
    FOREIGN KEY (player2_id) REFERENCES ft_users(id),
    FOREIGN KEY (winner_id) REFERENCES ft_users(id),
    FOREIGN KEY (loser_id) REFERENCES ft_users(id)
);

CREATE TABLE IF NOT EXISTS ft_tournaments (
    id              TEXT PRIMARY KEY,
    status          TEXT CHECK(status IN ('waiting', 'in_progress', 'completed', 'cancelled')) DEFAULT 'waiting',
    required_players INTEGER DEFAULT 8,
    current_round   INTEGER DEFAULT 1,
    max_rounds      INTEGER DEFAULT 3,
    winner_id       INTEGER,
    created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
    started_at      DATETIME,
    completed_at    DATETIME,
    FOREIGN KEY (winner_id) REFERENCES ft_users(id)
);

CREATE TABLE IF NOT EXISTS ft_tournament_participants (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id   TEXT NOT NULL,
    user_id         INTEGER NOT NULL,
    seed_position   INTEGER NOT NULL,
    current_round   INTEGER DEFAULT 1,
    is_eliminated   BOOLEAN DEFAULT FALSE,
    eliminated_at   DATETIME,
    final_position  INTEGER,
    joined_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (tournament_id, user_id),
    FOREIGN KEY (tournament_id) REFERENCES ft_tournaments(id),
    FOREIGN KEY (user_id) REFERENCES ft_users(id)
);

CREATE TABLE IF NOT EXISTS ft_tournament_matches (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    tournament_id   TEXT NOT NULL,
    round_number    INTEGER NOT NULL,
    match_number    INTEGER NOT NULL,
    player1_id      INTEGER,
    player2_id      INTEGER,
    winner_id       INTEGER,
    player1_score   INTEGER DEFAULT 0,
    player2_score   INTEGER DEFAULT 0,
    status          TEXT CHECK(status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
    room_id         TEXT,
    started_at      DATETIME,
    completed_at    DATETIME,
    FOREIGN KEY (tournament_id) REFERENCES ft_tournaments(id),
    FOREIGN KEY (player1_id) REFERENCES ft_users(id),
    FOREIGN KEY (player2_id) REFERENCES ft_users(id),
    FOREIGN KEY (winner_id) REFERENCES ft_users(id)
)