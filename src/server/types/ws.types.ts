interface WSMessage {
  type: "global" | "direct" | "invite" | "notification";
  from: string;       // user ID
  to?: string;        // receiver user ID (optional for global)
  message: string;
  timestamp: string;
}