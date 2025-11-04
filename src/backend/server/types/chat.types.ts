export interface ChatMessage {
  id?: string;
  user_id: number;
  username: string;
  message: string;
  timestamp: Date;
  room_id?: string;
  message_type: 'text' | 'system' | 'join' | 'leave' | 'game_invite';
  invite_id?: string;
}

export interface ChatRoom {
  id: string;
  name: string;
  created_by: number;
  created_at: Date;
  is_private: boolean;
  participants: number[];
}

export interface WebSocketUser {
  id: number;
  username: string;
  socket: any;
  current_room?: string;
}

export interface ChatEvent {
  type: 'message' | 'join_room' | 'leave_room' | 'user_joined' | 'user_left' | 'error' | 'chat_history' | 'get_online_users' | 'get_offline_messages' | 'online_users' | 'avatar_updated' | 'game_invite' | 'game_invite_response' | 'game_starting';
  data: any;
}

export interface GameInvite {
  inviteId: string;
  fromUserId: number;
  fromUsername: string;
  toUserId: number;
  toUsername: string;
  timestamp: Date;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  roomId?: string;
}
