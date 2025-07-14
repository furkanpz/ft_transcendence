export interface ChatMessage {
  id?: string;
  user_id: number;
  username: string;
  message: string;
  timestamp: Date;
  room_id?: string;
  message_type: 'text' | 'system' | 'join' | 'leave';
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
  type: 'message' | 'join_room' | 'leave_room' | 'user_joined' | 'user_left' | 'error' | 'chat_history';
  data: any;
}
