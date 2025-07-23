interface WSMessage {
  type: "global" | "direct" | "invite" | "notification";
  from: string;    
  to?: string; 
  message: string;
  timestamp: string;
}