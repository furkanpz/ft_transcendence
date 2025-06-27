
export enum userRole {
	user = "USER",
	admin = "ADMIN"
};


export interface User {
	id? : number,
	email: string,
	username: string,
	password?: string,
	avatar_url? : string,
	is_online? : boolean;
	created_at? : string,
	updated_at? : string,
	role? : userRole;
	last_login? : string
};

export interface db_User {
	id : number,
	email: string,
	username: string,
	password: string,
	avatar_url : string,
	is_online : boolean;
	created_at : string,
	updated_at : string,
	user_role : userRole,
	last_login? : string
};

export enum friendstat {
	Pending = "Pending",
	Accepted = "Accepted",
	Remove = "Remove"
};


export interface u_friendship {
	id: number,
	user_id: number,
	friend_id: number,
	stat: friendstat
};

export interface jwtUser {
	username: string,
	email: string,
	id: number,
	role: userRole 
}