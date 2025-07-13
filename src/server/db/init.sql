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