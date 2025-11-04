import { GlobalState, Page, FETCH_ADDRESS, WS_ADDRESS } from "../main"
import * as i18n from "../i18n";
import { HOME_PAGE } from "./HomePage"
import { CLASSIC_GAME_PAGE } from "./ClassicGamePage"

declare const Notification: typeof import("../components/Notification").Notification;

class ChatPage implements Page {
    title: string = "Live Chat";
    static onlineUsers: string[] = [];
    static allUsers: string[] = [];
    static blockedUsers: string[] = [];
    static chatHistory: any[] = [];
    static activeChatUser: string | null = null;
    static userChats: { [key: string]: any[] } = {};
    static unreadCounts: { [key: string]: number } = {};
    static userRoomIds: { [key: string]: string } = {};
    static userAvatars: { [key: string]: string } = {}; 

    static escapeHtml(input: any): string {
        const s = String(input ?? "");
        return s
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");
    }

    async render(): Promise<void> {
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
            <style>
                .chat-container {
                    display: flex;
                    height: calc(100vh - 80px);
                    min-height: calc(100vh - 80px);
                    overflow: hidden;
                }
                
                .chat-sidebar {
                    width: 320px;
                    min-width: 280px;
                    display: flex;
                    flex-direction: column;
                    background: rgba(20, 20, 40, 0.6);
                    backdrop-filter: blur(20px);
                    border-right: 1px solid rgba(0, 240, 255, 0.3);
                }
                
                .chat-main {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    background: rgba(10, 10, 32, 0.3);
                    min-width: 0;
                }
                
                .chat-search-container {
                    position: relative;
                    padding: 1rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .chat-search-icon {
                    position: absolute;
                    left: 1.5rem;
                    top: 50%;
                    transform: translateY(-50%);
                    font-size: 1rem;
                    color: rgba(255, 255, 255, 0.5);
                }
                
                .chat-list {
                    flex: 1;
                    overflow-y: auto;
                    padding: 0.5rem;
                }
                
                .chat-header {
                    padding: 1rem 1.5rem;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(20, 20, 40, 0.6);
                    backdrop-filter: blur(20px);
                }
                
                .chat-messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                }
                
                .chat-input-container {
                    padding: 1rem 1.5rem;
                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                    background: rgba(20, 20, 40, 0.6);
                    backdrop-filter: blur(20px);
                }
                
                .chat-input-form {
                    display: flex;
                    gap: 0.75rem;
                }
                
                .message-sent {
                    align-self: flex-end;
                    background: linear-gradient(135deg, var(--neon-cyan), var(--neon-blue));
                    color: white;
                    padding: 0.75rem 1rem;
                    border-radius: 18px 18px 4px 18px;
                    max-width: 70%;
                    word-wrap: break-word;
                    box-shadow: 0 4px 15px rgba(0, 240, 255, 0.3);
                }
                
                .message-received {
                    align-self: flex-start;
                    background: rgba(255, 255, 255, 0.1);
                    color: white;
                    padding: 0.75rem 1rem;
                    border-radius: 18px 18px 18px 4px;
                    max-width: 70%;
                    word-wrap: break-word;
                    border: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .message-time {
                    font-size: 0.75rem;
                    opacity: 0.6;
                    margin-top: 0.25rem;
                }
                
                .user-item {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem;
                    border-radius: 12px;
                    cursor: pointer;
                    transition: all 0.3s;
                    margin-bottom: 0.5rem;
                }
                
                .user-item:hover {
                    background: rgba(0, 240, 255, 0.1);
                }
                
                .user-item.active {
                    background: rgba(0, 240, 255, 0.2);
                    border: 1px solid var(--neon-cyan);
                }
                
                .user-avatar {
                    width: 48px;
                    height: 48px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 1.25rem;
                    background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
                    color: white;
                    flex-shrink: 0;
                    overflow: hidden;
                    position: relative;
                }
                
                .user-avatar img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    border-radius: 50%;
                }
                
                .online-indicator {
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    width: 14px;
                    height: 14px;
                    background: var(--neon-green);
                    border: 2px solid rgba(10, 10, 32, 0.9);
                    border-radius: 50%;
                    box-shadow: 0 0 8px var(--neon-green);
                }
                
                .offline-indicator {
                    position: absolute;
                    bottom: 2px;
                    right: 2px;
                    width: 14px;
                    height: 14px;
                    background: rgba(255, 255, 255, 0.3);
                    border: 2px solid rgba(10, 10, 32, 0.9);
                    border-radius: 50%;
                }
                
                .user-info {
                    flex: 1;
                    min-width: 0;
                }
                
                .user-name {
                    font-weight: 600;
                    font-size: 0.875rem;
                    color: white;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                
                .user-status {
                    font-size: 0.75rem;
                    color: rgba(255, 255, 255, 0.6);
                }
                
                .unread-badge {
                    background: #ff0066;
                    color: white;
                    font-size: 0.75rem;
                    padding: 0.25rem 0.5rem;
                    border-radius: 12px;
                    font-weight: 600;
                }
                
                @media (max-width: 768px) {
                    .chat-sidebar {
                        width: 100%;
                        position: absolute;
                        z-index: 10;
                        height: 100%;
                        transform: translateX(-100%);
                        transition: transform 0.3s;
                    }
                    
                    .chat-sidebar.show {
                        transform: translateX(0);
                    }
                    
                    .chat-main {
                        width: 100%;
                    }
                }
            </style>
            
            <div class="chat-container">
                <div class="chat-sidebar">
                    <div class="chat-search-container">
                        <div class="chat-search-icon">🔍</div>
                        <input type="text" id="userSearchInput" placeholder="Search user..." data-i18n-placeholder="search_user"
                               style="width: 100%; padding-left: 2.5rem; padding-right: 1rem; padding-top: 0.75rem; padding-bottom: 0.75rem;"
                               oninput="ChatPage.searchUsers()"
                               onkeyup="ChatPage.searchUsers()"
                               onpaste="setTimeout(() => ChatPage.searchUsers(), 100)">
                    </div>
                    
                    <div class="chat-list" id="chatsList">
                        <div style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 2rem;">
                            <p data-i18n="no_chats_yet">No chats yet</p>
                            <p style="font-size: 0.875rem; margin-top: 0.5rem;" data-i18n="find_user_above">Find a user with the search above</p>
                        </div>
                    </div>
                </div>
                
                <div class="chat-main">
                    <div id="chatHeader" class="chat-header">
                        <div style="text-align: center; color: rgba(255, 255, 255, 0.5);" data-i18n="select_chat">Select a chat</div>
                    </div>
                    
                    <div id="chatMessages" class="chat-messages">
                    </div>
                    
                    <div class="chat-input-container">
                        <form id="messageForm" method="post" class="chat-input-form" onsubmit="ChatPage.sendChatMessage(event)">
                            <input type="text" id="messageInput" placeholder="Select a user first..." data-i18n-placeholder=""
                                   style="flex: 1;"
                                   disabled>
                            <button type="submit" id="sendButton" class="btn-primary"
                                    style="padding: 0.75rem 1.5rem; white-space: nowrap;"
                                    data-i18n="send" disabled>
                                Send
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            `;
        }
    }

    async onPreLoad(): Promise<void> {
        console.log("Preparing to load Chat page");
    }

    async onLoad(): Promise<void> {
        ChatPage.activeChatUser = null;
        
        try {
            const response = await fetch(`${FETCH_ADDRESS}/user/friends/block`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                ChatPage.blockedUsers = data.blockedUsers || data || [];
            }
        } catch (error) {
        }

        await ChatPage.loadFriendsList();
        await ChatPage.loadAllUsers();
        await ChatPage.loadExistingChats();

        const allUsersToFetch = [...new Set([...ChatPage.allUsers, ...Object.keys(ChatPage.userChats)])];
        Promise.all(allUsersToFetch.map(user => ChatPage.fetchUserAvatar(user))).then(() => {
            ChatPage.updateChatsList();
        });

        ChatPage.connectWebSocket();
        
        setTimeout(() => {
            console.log('🕐 Delayed updateChatsList call');
            ChatPage.updateChatsList();
        }, 500);
        
        i18n.translateDOM();

        const messageInput = document.getElementById("messageInput");
        if (messageInput) {
            messageInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    ChatPage.sendChatMessage(e);
                }
            });
        }
    }

    async onUnload(): Promise<void> {
        const socket = GlobalState.getSocket();
        if (socket) {
            socket.close();
            GlobalState.setSocket(null);
        }
        
        ChatPage.activeChatUser = null;
        ChatPage.chatHistory = [];
        ChatPage.onlineUsers = [];
        ChatPage.unreadCounts = {};
        ChatPage.userChats = {};
    }

    static getCurrentUsername(): string {
        return window.localStorage.getItem("username") || "Guest";
    }

    static async fetchUserAvatar(username: string, forceRefresh: boolean = false): Promise<string | null> {
        if (!forceRefresh && ChatPage.userAvatars[username]) {
            return ChatPage.userAvatars[username];
        }

        try {
            const url = `${FETCH_ADDRESS}/user/details/by-username${forceRefresh ? `?t=${Date.now()}` : ''}`;
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache'
                },
                body: JSON.stringify({ usernames: [username] })
            });

            if (response.ok) {
                const data = await response.json();
                if ((data.success || data.message === "") && data.data && data.data.length > 0) {
                    const userData = data.data[0];
                    if (userData.avatar_url) {
                        let avatarUrl = userData.avatar_url;
                        if (avatarUrl.startsWith('/uploads/')) {
                            avatarUrl = `https://localhost:3000${avatarUrl}`;
                        }
                        const timestamp = Date.now();
                        const finalUrl = `${avatarUrl}?t=${timestamp}`;
                        ChatPage.userAvatars[username] = avatarUrl;
                        return finalUrl;
                    } else {
                        delete ChatPage.userAvatars[username];
                    }
                } else {
                    
                }
            } else {
                console.error(`❌ Avatar fetch failed for ${username}: ${response.status}`);
            }
        } catch (error) {
            console.error(`Failed to fetch avatar for ${username}:`, error);
        }

        return null;
    }

    static invalidateAvatarCache(username?: string): void {
        if (username) {
            console.log('🗑️ Invalidating avatar cache for:', username);
            const oldUrl = ChatPage.userAvatars[username];
            delete ChatPage.userAvatars[username];
            console.log(`🗑️ Deleted cache: ${oldUrl}`);
            
            const chatsList = document.getElementById("chatsList");
            if (chatsList) {
                const userItems = chatsList.querySelectorAll('.user-item');
                let updated = false;
                userItems.forEach((item) => {
                    const nameElement = item.querySelector('.user-name');
                    if (nameElement && nameElement.textContent === username) {
                        const avatarElement = item.querySelector('.user-avatar');
                        if (avatarElement) {
                            const isOnline = ChatPage.onlineUsers.includes(username);
                            const newAvatarHtml = ChatPage.getAvatarHtml(username, isOnline, 48, true);
                            avatarElement.outerHTML = newAvatarHtml;
                            updated = true;
                            console.log(`✅ Updated DOM avatar for ${username}`);
                        }
                    }
                });
                
                const allImages = chatsList.querySelectorAll('.user-avatar img');
                allImages.forEach((img: Element) => {
                    const parent = img.closest('.user-item');
                    if (parent) {
                        const nameEl = parent.querySelector('.user-name');
                        if (nameEl && nameEl.textContent === username) {
                            const currentSrc = (img as HTMLImageElement).src;
                            const newSrc = currentSrc.split('?')[0] + `?t=${Date.now()}`;
                            (img as HTMLImageElement).src = newSrc;
                            console.log(`🔄 Forced image reload for ${username}`);
                        }
                    }
                });
            }
            
            if (ChatPage.activeChatUser === username) {
                const chatHeader = document.getElementById("chatHeader");
                if (chatHeader) {
                    const headerAvatar = chatHeader.querySelector('.user-avatar');
                    if (headerAvatar) {
                        const isOnline = ChatPage.onlineUsers.includes(username);
                        const newAvatarHtml = ChatPage.getAvatarHtml(username, isOnline, 48, true);
                        headerAvatar.outerHTML = newAvatarHtml;
                        console.log(`✅ Updated header avatar for ${username}`);
                    }
                    const headerImages = chatHeader.querySelectorAll('.user-avatar img');
                    headerImages.forEach((img: Element) => {
                        const currentSrc = (img as HTMLImageElement).src;
                        const newSrc = currentSrc.split('?')[0] + `?t=${Date.now()}`;
                        (img as HTMLImageElement).src = newSrc;
                    });
                }
            }
            
            ChatPage.updateChatsList();
        } else {
            console.log('🗑️ Clearing all avatar cache');
            ChatPage.userAvatars = {};
            ChatPage.updateChatsList();
            if (ChatPage.activeChatUser) {
                ChatPage.updateChatHeader();
            }
        }
    }

    static getAvatarHtml(username: string, isOnline: boolean, size: number = 48, forceRefresh: boolean = false): string {
        const avatarUrl = ChatPage.userAvatars[username];
        const initials = ChatPage.escapeHtml(username.charAt(0).toUpperCase());
        const indicator = isOnline 
            ? '<div class="online-indicator"></div>' 
            : '<div class="offline-indicator"></div>';

        if (avatarUrl) {
            const timestamp = forceRefresh ? Date.now() : (Date.now() - Math.floor(Date.now() / 100000) * 100000);
            const imgSrc = `${avatarUrl}?t=${timestamp}`;
            return `
                <div class="user-avatar" style="width: ${size}px; height: ${size}px;">
                    <img src="${imgSrc}" alt="${ChatPage.escapeHtml(username)}" loading="eager" onerror="this.style.display='none'; const fb=this.nextElementSibling; if(fb){fb.style.display='flex';}">
                    <div class="avatar-fallback" style="display:none;align-items:center;justify-content:center;width:${size}px;height:${size}px;">${initials}</div>
                    ${indicator}
                </div>
            `;
        } else {
            return `
                <div class="user-avatar" style="width: ${size}px; height: ${size}px;">
                    ${initials}
                    ${indicator}
                </div>
            `;
        }
    }

    static connectWebSocket() {
        try {
            const socket = new WebSocket(`${WS_ADDRESS}/chat`);

            socket.onopen = () => {
                GlobalState.setSocket(socket);
                console.log('✅ Chat WebSocket connected');

                socket.send(JSON.stringify({ type: 'get_online_users' }));
                socket.send(JSON.stringify({ type: 'get_offline_messages' }));
                
                const intervalId = setInterval(() => {
                    if (socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({ type: 'get_online_users' }));
                    } else {
                        clearInterval(intervalId);
                    }
                }, 30000); 
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                console.log('📨 WebSocket message received:', data.type, data);

                switch (data.type) {
                    case 'message':
                        const msgData = data.data;
                        console.log('💬 Message data:', msgData);
                        const senderUsername = msgData.username;

                        if (senderUsername !== ChatPage.getCurrentUsername()) {
                            let foundUser = null;
                            for (const [user, roomId] of Object.entries(ChatPage.userRoomIds)) {
                                if (roomId === msgData.room_id) {
                                    foundUser = user;
                                    break;
                                }
                            }
                            
                            if (!foundUser) {
                                foundUser = senderUsername;
                                ChatPage.userRoomIds[senderUsername] = msgData.room_id;
                                
                                if (!ChatPage.allUsers.includes(senderUsername)) {
                                    ChatPage.allUsers.push(senderUsername);
                                }
                                
                                const socket = GlobalState.getSocket();
                                if (socket && socket.readyState === WebSocket.OPEN) {
                                    console.log(`📥 Auto-joining room ${msgData.room_id} for conversation with ${senderUsername}`);
                                    socket.send(JSON.stringify({
                                        type: 'join_room',
                                        data: { room_id: msgData.room_id }
                                    }));
                                }
                            }
                            
                            if (!ChatPage.blockedUsers.includes(foundUser)) {
                                if (ChatPage.activeChatUser === foundUser) {
                                    ChatPage.addMessageToActiveChat(senderUsername, msgData.message, 'received');
                                } else {
                                    ChatPage.unreadCounts[foundUser] = (ChatPage.unreadCounts[foundUser] || 0) + 1;
                                    if (!ChatPage.userChats[foundUser]) {
                                        ChatPage.userChats[foundUser] = [];
                                    }
                                    ChatPage.userChats[foundUser].push({
                                        sender: senderUsername,
                                        message: msgData.message,
                                        type: 'received',
                                        timestamp: new Date(msgData.timestamp),
                                        messageType: 'text'
                                    });

                                    ChatPage.updateChatsList();
                                    i18n.translateDOM();
                                }
                            }
                        }
                        break;

                    case 'chat_history':
                        const historyData = data.data;
                        const roomMessages = historyData.messages || [];

                        for (const [user, roomId] of Object.entries(ChatPage.userRoomIds)) {
                            if (roomId === historyData.room_id) {
                                ChatPage.userChats[user] = roomMessages.map((msg: any) => ({
                                    sender: msg.username === ChatPage.getCurrentUsername() ? 'Siz' : msg.username,
                                    message: msg.message,
                                    type: msg.username === ChatPage.getCurrentUsername() ? 'sent' : 'received',
                                    timestamp: new Date(msg.timestamp),
                                    messageType: msg.message_type || 'text'
                                }));

                                if (ChatPage.activeChatUser === user) {
                                    ChatPage.loadChatMessages(user);
                                }
                                break;
                            }
                        }
                        break;

                    

                    case 'game_invite':
                        ChatPage.handleGameInvite(data.data);
                        break;

                    case 'game_invite_response':
                        ChatPage.handleGameInviteResponse(data.data);
                        break;

                    case 'game_starting':
                        ChatPage.handleGameStarting(data.data);
                        break;

                    case 'tournament_notification':
                        ChatPage.displayTournamentNotification(data.message);
                        break;

                    case 'online_users':
                        const usersList = data.data?.users || data.users || [];
                        console.log('📊 Received online users:', usersList);
                        console.log('📊 Current username:', ChatPage.getCurrentUsername());
                        
                        if (Array.isArray(usersList)) {
                            ChatPage.onlineUsers = usersList;
                            console.log('✅ Updated onlineUsers:', ChatPage.onlineUsers);
                            
                            ChatPage.onlineUsers.forEach(user => {
                                if (!ChatPage.allUsers.includes(user)) {
                                    ChatPage.allUsers.push(user);
                                }
                                ChatPage.fetchUserAvatar(user).then(() => {
                                    ChatPage.updateChatsList();
                                    if (ChatPage.activeChatUser === user) {
                                        ChatPage.updateChatHeader();
                                    }
                                });
                            });
                        } else {
                            console.warn('⚠️ online_users received invalid data:', data);
                            ChatPage.onlineUsers = [];
                        }

                        ChatPage.updateChatsList();
                        i18n.translateDOM();
                        if (ChatPage.activeChatUser) {
                            ChatPage.updateChatHeader();
                        }
                        break;

                    case 'user_joined':
                        console.log('👤 User joined:', data.username, 'Full data:', data);
                        const joinedUsername = data.username || data.data?.username;
                        if (joinedUsername && !ChatPage.onlineUsers.includes(joinedUsername)) {
                            ChatPage.onlineUsers.push(joinedUsername);
                            console.log('✅ Added to onlineUsers. Current list:', ChatPage.onlineUsers);
                            
                            if (!ChatPage.allUsers.includes(joinedUsername)) {
                                ChatPage.allUsers.push(joinedUsername);
                            }
                            ChatPage.fetchUserAvatar(joinedUsername).then(() => {
                                ChatPage.updateChatsList();
                                if (ChatPage.activeChatUser === joinedUsername) {
                                    ChatPage.updateChatHeader();
                                }
                            });
                            ChatPage.updateChatsList();
                            i18n.translateDOM();
                            if (ChatPage.activeChatUser === joinedUsername) {
                                ChatPage.updateChatHeader();
                            }
                        }
                        break;

                    case 'user_left':
                        console.log('👋 User left:', data.username, 'Full data:', data);
                        const leftUsername = data.username || data.data?.username;
                        if (leftUsername) {
                            const beforeLength = ChatPage.onlineUsers.length;
                            ChatPage.onlineUsers = ChatPage.onlineUsers.filter(user => user !== leftUsername);
                            console.log(`✅ Removed ${leftUsername} from onlineUsers. Before: ${beforeLength}, After: ${ChatPage.onlineUsers.length}`);
                            ChatPage.updateChatsList();
                            i18n.translateDOM();
                            if (ChatPage.activeChatUser === leftUsername) {
                                ChatPage.updateChatHeader();
                            }
                        }
                        break;

                    case 'avatar_updated':
                        {
                            const updatedUsername = data.username || data.data?.username;
                            const newUrl = data.avatar_url || data.data?.avatar_url;
                            if (updatedUsername) {
                                if (newUrl) {
                                    let avatarUrl = newUrl as string;
                                    if (avatarUrl.startsWith('/uploads/')) {
                                        avatarUrl = `https://localhost:3000${avatarUrl}`;
                                    }
                                    ChatPage.userAvatars[updatedUsername] = avatarUrl;
                                }
                                ChatPage.invalidateAvatarCache(updatedUsername);
                                ChatPage.fetchUserAvatar(updatedUsername, true).then(() => {
                                    ChatPage.updateChatsList();
                                    if (ChatPage.activeChatUser === updatedUsername) {
                                        ChatPage.updateChatHeader();
                                    }
                                });
                            }
                        }
                        break;

                    case 'error':
                        ChatPage.addSystemMessage(`Hata: ${data.data?.message || 'Bilinmeyen hata'}`);
                        break;
                }
            };

            socket.onclose = (event) => {
                if (!event.wasClean) {
                    Notification.error('Unable to connect to chat service. Please check your internet connection and try again.', 8000);
                }
            };

            socket.onerror = (error) => {
                Notification.error('Failed to establish chat connection. Please refresh the page to reconnect.', 8000);
            };

        } catch (error) {
            Notification.error('Chat service is currently unavailable. Please try again later.', 8000);
        }
    }

    static async loadExistingChats() {
        try {
            console.log('🔄 Loading existing chats...');
            const response = await fetch(`${FETCH_ADDRESS}/chat/rooms`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const rooms = data.rooms || data || [];
                console.log(`📦 Fetched ${rooms.length} rooms from backend`);

                for (const room of rooms) {
                    if (room.is_private) {
                        let username: string | undefined = room.peer_username;
                        if (!username && room.name && room.name.startsWith('private_')) {
                            const parts = room.name.replace('private_', '').split('_');
                            const currentUser = ChatPage.getCurrentUsername();
                            username = parts.find((u: string) => u !== currentUser) || parts[0];
                        }
                        if (!username) continue;

                        console.log(`📂 Room: ${room.name} → Other user: ${username}`);

                        ChatPage.userRoomIds[username] = room.id;

                        try {
                            const historyResponse = await fetch(`${FETCH_ADDRESS}/chat/rooms/${room.id}/history?limit=50`, {
                                credentials: 'include'
                            });

                            if (historyResponse.ok) {
                                const historyData = await historyResponse.json();
                                const messages = historyData.messages || historyData || [];
                                console.log(`📨 Room ${room.name} has ${messages.length} messages`);

                                ChatPage.userChats[username] = messages.map((msg: any) => ({
                                    sender: msg.username === ChatPage.getCurrentUsername() ? 'Siz' : msg.username,
                                    message: msg.message,
                                    type: msg.username === ChatPage.getCurrentUsername() ? 'sent' : 'received',
                                    timestamp: new Date(msg.timestamp),
                                    messageType: msg.message_type || 'text'
                                }));
                                
                                console.log(`✅ Stored ${ChatPage.userChats[username].length} messages for user: ${username}`);
                            }
                        } catch (historyError) {
                            console.error(`❌ Error loading history for room ${room.id}:`, historyError);
                        }

                        if (!ChatPage.allUsers.includes(username)) {
                            ChatPage.allUsers.push(username);
                        }
                    }
                }

                console.log('📊 Final userChats:', Object.keys(ChatPage.userChats));
                console.log('📊 UserChats object:', ChatPage.userChats);
                ChatPage.updateChatsList();
            }
        } catch (error) {
            console.error('❌ Error loading existing chats:', error);
        }
    }

    static async sendChatMessage(event: Event) {
        event.preventDefault();
        const messageInput = document.getElementById("messageInput") as HTMLInputElement;

        if (!ChatPage.activeChatUser) {
            ChatPage.addSystemMessage('Lütfen bir kullanıcı seçin');
            return;
        }

        const message = messageInput.value.trim();
        if (!message) return;

        if (ChatPage.blockedUsers.includes(ChatPage.activeChatUser)) {
            ChatPage.addSystemMessage(`${ChatPage.activeChatUser} kullanıcısı bloklanmış. Mesaj gönderilemez.`);
            return;
        }

        const roomId = ChatPage.userRoomIds[ChatPage.activeChatUser];
        const socket = GlobalState.getSocket();

        if (!roomId) {
            ChatPage.addSystemMessage('Oda hazırlanıyor, lütfen bekleyin...');

            const createdRoomId = await ChatPage.createOrJoinPrivateRoom(ChatPage.activeChatUser);
            if (!createdRoomId) {
                ChatPage.addSystemMessage('Oda oluşturulamadı. Lütfen tekrar deneyin.');
                return;
            }
        }

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            ChatPage.addSystemMessage('WebSocket bağlantısı yok. Sayfa yenileniyor...');

            ChatPage.connectWebSocket();

            ChatPage.addMessageToActiveChat('Siz', message, 'sent');
            messageInput.value = '';
            return;
        }

        const finalRoomId = ChatPage.userRoomIds[ChatPage.activeChatUser];
        if (!finalRoomId) {
            ChatPage.addSystemMessage('Oda ID bulunamadı. Lütfen kullanıcıyı tekrar seçin.');
            return;
        }

        try {
            socket.send(JSON.stringify({
                type: 'message',
                data: {
                    message: message,
                    room_id: finalRoomId
                }
            }));

            ChatPage.addMessageToActiveChat('Siz', message, 'sent');
            messageInput.value = '';
        } catch (error) {
            ChatPage.addSystemMessage('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
        }
    }

    static async blockUser(username: string) {
        if (confirm(`${username} kullanıcısını engellemek istediğinizden emin misiniz? Engellediğinizde birbirinize mesaj gönderemezsiniz.`)) {
            try {
                const response = await fetch(`${FETCH_ADDRESS}/user/friends/block`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username })
                });

                if (response.ok) {
                    ChatPage.blockedUsers.push(username);
                    ChatPage.addSystemMessage(`${username} kullanıcısı engellendi.`);
                    ChatPage.updateChatsList();
                    ChatPage.updateUserInfoPanel();

                    if (ChatPage.activeChatUser === username) {
                        ChatPage.disableChatInput();
                    }
                }
            } catch (error) {
                ChatPage.addSystemMessage('Engelleme işlemi başarısız.');
            }
        }
    }

    static async unblockUser(username: string) {
        try {
            const response = await fetch(`${FETCH_ADDRESS}/user/friends/block/${username}`, {
                method: 'DELETE',
                credentials: 'include'
            }); 
            if (response.ok) {
                ChatPage.blockedUsers = ChatPage.blockedUsers.filter(user => user !== username);
                ChatPage.addSystemMessage(`${username} kullanıcısının engeli kaldırıldı.`);
                ChatPage.updateChatsList();
                ChatPage.updateUserInfoPanel();

                if (ChatPage.activeChatUser === username) {
                    ChatPage.enableChatInput();
                }
            }
        } catch (error) {
            ChatPage.addSystemMessage('Engel kaldırma işlemi başarısız.');
        }
    }

    static async viewProfile(username: string) {
        try {
            const response = await fetch(`${FETCH_ADDRESS}/user/profile`, {
                credentials: 'include'
            }); 
            if (response.ok) {
                const profile = await response.json();
                ChatPage.showProfileModal(profile);
            } else {
                ChatPage.addSystemMessage('Profil yüklenemedi.');
            }
        } catch (error) {
            ChatPage.addSystemMessage('Profil yüklenemedi.');
        }
    }

    static showProfileModal(profile: any) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        const safeUsername = ChatPage.escapeHtml(profile.username);
        modal.innerHTML = `
        <div class="bg-white rounded-xl p-8 max-w-lg w-full m-4 shadow-2xl">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold text-gray-800">${safeUsername} - Profile</h3>
                <button id="closeProfileModal" class="text-gray-400 hover:text-gray-600 text-3xl">×</button>
            </div>
            
            <div class="flex items-center mb-6">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                    ${safeUsername.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 class="text-xl font-semibold text-gray-800">${safeUsername}</h4>
                    <p class="text-gray-600">${profile.online ? 'Online' : 'Offline'}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-green-600">${profile.wins || 0}</div>
                    <div class="text-sm text-gray-600">Wins</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-red-600">${profile.losses || 0}</div>
                    <div class="text-sm text-gray-600">Losses</div>
                </div>
            </div>
            
            <div class="flex gap-3">
                <button id="sendMessageBtn" data-username="${safeUsername}"
                        class="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold">
                    Send Message
                </button>
                <button id="inviteGameBtn" data-username="${safeUsername}"
                        class="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition duration-200 font-semibold">
                    Invite to Game
                </button>
            </div>
        </div>
    `;
        document.body.appendChild(modal);
        
        modal.querySelector('#closeProfileModal')?.addEventListener('click', () => modal.remove());
        modal.querySelector('#sendMessageBtn')?.addEventListener('click', () => {
            const username = (modal.querySelector('#sendMessageBtn') as HTMLElement)?.dataset.username;
            if (username) {
                ChatPage.startChatWith(username);
                modal.remove();
            }
        });
        modal.querySelector('#inviteGameBtn')?.addEventListener('click', () => {
            const username = (modal.querySelector('#inviteGameBtn') as HTMLElement)?.dataset.username;
            if (username) {
                ChatPage.inviteToGame(username);
                modal.remove();
            }
        });
    }

    static async createOrJoinPrivateRoom(username: string): Promise<string | null> {
        try {
            const currentUser = ChatPage.getCurrentUsername();
            console.log(`🔍 Current user: "${currentUser}", Target user: "${username}"`);
            const users = [currentUser, username].sort();
            console.log(`🔍 Sorted users:`, users);
            const roomName = `private_${users[0]}_${users[1]}`;
            
            console.log(`🔍 Looking for room: ${roomName}`);
            const roomsResponse = await fetch(`${FETCH_ADDRESS}/chat/rooms`, {
                credentials: 'include'
            });

            if (roomsResponse.ok) {
                const roomsData = await roomsResponse.json();
                const rooms = roomsData.rooms || roomsData.data?.rooms || roomsData || [];
                console.log(`📋 Found ${rooms.length} rooms:`, rooms);

                for (const room of rooms) {
                    if (room.is_private && (room.peer_username === username)) {
                        ChatPage.userRoomIds[username] = room.id;
                        console.log(`✅ Found existing room: ${room.id}`);

                        const socket = GlobalState.getSocket();
                        if (socket && socket.readyState === WebSocket.OPEN) {
                            console.log(`📤 Sending join_room for: ${room.id}`);
                            socket.send(JSON.stringify({
                                type: 'join_room',
                                data: { room_id: room.id }
                            }));
                        }

                        return room.id;
                    }
                }
            } else {
                console.error(`❌ Failed to fetch rooms: ${roomsResponse.status}`);
            }

            ChatPage.addSystemMessage('Sadece arkadaşlarla özel sohbet mümkündür. Arkadaş olunca sohbet odası otomatik oluşur.');
            return null;
        } catch (error) {
            console.error(`❌ createOrJoinPrivateRoom error:`, error);
            return null;
        }
    }

    static async startChatWith(username: string) {
        ChatPage.activeChatUser = username;

        ChatPage.updateChatHeader();
        ChatPage.updateChatsList();
        ChatPage.updateUserInfoPanel();

        const roomId = await ChatPage.createOrJoinPrivateRoom(username);

        if (!roomId) {
            ChatPage.addSystemMessage('Oda oluşturulamadı. Lütfen tekrar deneyin.');
        }

        ChatPage.loadChatMessages(username);
        await ChatPage.loadRoomHistory(username);

        ChatPage.unreadCounts[username] = 0;
        ChatPage.updateChatsList();

        if (ChatPage.blockedUsers.includes(username)) {
            ChatPage.disableChatInput();
        } else {
            ChatPage.enableChatInput();
        }
    }

    static disableChatInput() {
        const messageInput = document.getElementById("messageInput") as HTMLInputElement;
        const sendButton = document.getElementById("sendButton") as HTMLButtonElement;
        const messageForm = document.getElementById("messageForm") as HTMLFormElement;

        if (messageInput && sendButton && messageForm) {
            messageInput.disabled = true;
            messageInput.placeholder = "Bu kullanıcıyı engelledin";
            sendButton.disabled = true;
            messageForm.style.opacity = "0.5";
        }
    }

    static enableChatInput() {
        const messageInput = document.getElementById("messageInput") as HTMLInputElement;
        const sendButton = document.getElementById("sendButton") as HTMLButtonElement;
        const messageForm = document.getElementById("messageForm") as HTMLFormElement;

        if (messageInput && sendButton && messageForm) {
            messageInput.disabled = false;
            messageInput.placeholder = "Mesajını yaz...";
            sendButton.disabled = false;
            messageForm.style.opacity = "1";
        }
    }

    static async updateChatHeader() {
        const chatHeader = document.getElementById("chatHeader");
        if (chatHeader && ChatPage.activeChatUser) {
            const isOnline = ChatPage.onlineUsers.includes(ChatPage.activeChatUser);
            const statusText = isOnline ? 'Online' : 'Offline';
            const statusColor = isOnline ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.4)';
            const isBlocked = ChatPage.blockedUsers.includes(ChatPage.activeChatUser);

            if (!ChatPage.userAvatars[ChatPage.activeChatUser]) {
                await ChatPage.fetchUserAvatar(ChatPage.activeChatUser);
            }

            const avatarHtml = ChatPage.getAvatarHtml(ChatPage.activeChatUser, isOnline, 48);

            chatHeader.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="position: relative;">
                        ${avatarHtml}
                    </div>
                    <div>
                        <h3 style="font-weight: 600; font-size: 1.125rem; color: white; margin: 0;">${ChatPage.escapeHtml(ChatPage.activeChatUser)}</h3>
                        <p style="font-size: 0.875rem; color: ${statusColor}; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                            <span style="display: inline-block; width: 8px; height: 8px; background: ${statusColor}; border-radius: 50%; ${isOnline ? 'box-shadow: 0 0 8px var(--neon-green);' : ''}"></span>
                            ${statusText}
                        </p>
                    </div>
                </div>
                ${!isBlocked && isOnline ? `
                <button onclick="ChatPage.inviteToGame('${ChatPage.activeChatUser}')" 
                        style="padding: 0.75rem 1.5rem; background: linear-gradient(135deg, var(--neon-green), var(--neon-cyan)); color: white; border: none; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 0.5rem; transition: all 0.3s; box-shadow: 0 4px 15px rgba(0, 240, 255, 0.3);"
                        onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 240, 255, 0.4)';"
                        onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 240, 255, 0.3)';">
                    🎮 Pong'a Davet Et
                </button>
                ` : ''}
            </div>
        `;
        } else if (chatHeader) {
            chatHeader.innerHTML = `
                <div style="text-align: center; color: rgba(255, 255, 255, 0.5);" data-i18n="select_chat">Select a chat</div>
            `;
        }
    }

    static toggleUserInfoPanel() {
        const userInfoPanel = document.getElementById("userInfoPanel");
        if (userInfoPanel) {
            userInfoPanel.classList.toggle('hidden');
        }
    }

    static updateUserInfoPanel() {
        const userInfoPanel = document.getElementById("userInfoPanel");
        if (userInfoPanel && ChatPage.activeChatUser) {
            const isBlocked = ChatPage.blockedUsers.includes(ChatPage.activeChatUser);

            userInfoPanel.innerHTML = `
            <div class="p-6">
                <div class="text-center mb-6">
                    <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                        ${ChatPage.activeChatUser.charAt(0).toUpperCase()}
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800">${ChatPage.activeChatUser}</h3>
                    <p class="text-gray-600 text-sm">Galibiyet/Mağlubiyet: 5/2</p>
                </div>
                
                <div class="space-y-3 mb-6">
                    <button onclick="ChatPage.viewProfile('${ChatPage.activeChatUser}')" 
                            class="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold">
                        👤 Profili Görüntüle
                    </button>
                    
                    ${!isBlocked ? `
                        <button onclick="ChatPage.inviteToGame('${ChatPage.activeChatUser}')" 
                                class="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition duration-200 font-semibold flex items-center justify-center">
                            🎮 Pong Oynamaya Davet Et
                        </button>
                    ` : ''}
                </div>
                
                <div class="border-t pt-4">
                    <div class="relative">
                        <button onclick="ChatPage.toggleOptionsMenu()" class="flex items-center text-gray-600 hover:text-gray-800 transition duration-200">
                            <span class="text-xl mr-2">⋮</span>
                            Daha Fazla Seçenek
                        </button>
                        
                        <div id="optionsMenu" class="hidden absolute top-full left-0 mt-2 w-full bg-white border rounded-lg shadow-lg z-10">
                            ${!isBlocked ? `
                                <button onclick="ChatPage.blockUser('${ChatPage.activeChatUser}')" 
                                        class="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition duration-200">
                                    🚫 Kullanıcıyı Engelle
                                </button>
                            ` : `
                                <button onclick="ChatPage.unblockUser('${ChatPage.activeChatUser}')" 
                                        class="w-full text-left px-4 py-3 text-green-600 hover:bg-green-50 transition duration-200">
                                    ✅ Engeli Kaldır
                                </button>
                            `}
                        </div>
                    </div>
                </div>
                
                ${isBlocked ? `
                    <div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                        <p class="text-red-700 text-sm text-center">Bu kullanıcıyı engelledin</p>
                    </div>
                ` : ''}
            </div>
        `;
        }
    }

    static toggleOptionsMenu() {
        const optionsMenu = document.getElementById("optionsMenu");
        if (optionsMenu) {
            optionsMenu.classList.toggle('hidden');
        }
    }

    static async searchUsers() {
        const searchInput = document.getElementById("userSearchInput") as HTMLInputElement;
        const searchTerm = searchInput?.value.toLowerCase() || '';

        if (searchTerm === '') {
            ChatPage.updateChatsList();
            return;
        }

        const existingChatUsers = Object.keys(ChatPage.userChats);
        const onlineUsersList = ChatPage.onlineUsers || [];

        if (ChatPage.allUsers.length === 0) {
            await ChatPage.loadFriendsList();
            await ChatPage.loadAllUsers();
        }

        const allAvailableUsers = [...new Set([
            ...ChatPage.allUsers,
            ...existingChatUsers,
            ...onlineUsersList
        ])];

        const currentUser = ChatPage.getCurrentUsername();
        const filteredUsers = allAvailableUsers.filter(user => {
            return user.toLowerCase().includes(searchTerm) && user !== currentUser;
        });

        ChatPage.updateSearchResults(filteredUsers);
    }

    static updateSearchResults(users: string[]) {
        const chatsList = document.getElementById("chatsList");
        if (chatsList) {
            if (users.length === 0) {
                chatsList.innerHTML = `
                <div class="text-center text-gray-500 py-8">
                    <p>Kullanıcı bulunamadı</p>
                </div>
            `;
                return;
            }

            const searchAvatarPromises = users.map(user => {
                if (!ChatPage.userAvatars[user]) {
                    return ChatPage.fetchUserAvatar(user);
                }
                return Promise.resolve();
            });
            
            Promise.all(searchAvatarPromises).then(() => {
                chatsList.innerHTML = users.map(user => {
                    const safeUser = ChatPage.escapeHtml(user);
                    const isOnline = ChatPage.onlineUsers.includes(user);
                    const hasExistingChat = ChatPage.userChats[user];
                    const lastMessage = hasExistingChat ? ChatPage.userChats[user][ChatPage.userChats[user].length - 1] : null;
                    const avatarHtml = ChatPage.getAvatarHtml(user, isOnline, 48);

                    return `
                    <div class="user-item" data-username="${safeUser}">
                        ${avatarHtml}
                        <div class="user-info">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                <div class="user-name">${safeUser}</div>
                            </div>
                            <div class="user-status" style="display: flex; align-items: center; gap: 0.5rem;">
                                <span>${hasExistingChat && lastMessage ?
                            (lastMessage.type === 'game_invite' ? 'Game invite' : ChatPage.escapeHtml(lastMessage.message)) :
                            'New chat'
                        }</span>
                                <span style="font-size: 0.75rem; color: ${isOnline ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.4)'};">
                                    ${isOnline ? '● Online' : '○ Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
                }).join('');
                
                document.querySelectorAll('.user-item[data-username]').forEach(item => {
                    item.addEventListener('click', () => {
                        const username = (item as HTMLElement).dataset.username;
                        if (username) ChatPage.startChatWith(username);
                    });
                });
            });
        }
    }

    static updateChatsList() {
        console.log('🔄 updateChatsList called');
        console.log('📊 Current userChats keys:', Object.keys(ChatPage.userChats));
        
        const chatsList = document.getElementById("chatsList");
        if (chatsList) {
            const chatUsers = Object.keys(ChatPage.userChats).sort((a, b) => {
                const lastMessageA = ChatPage.userChats[a]?.[ChatPage.userChats[a].length - 1]?.timestamp || 0;
                const lastMessageB = ChatPage.userChats[b]?.[ChatPage.userChats[b].length - 1]?.timestamp || 0;
                return new Date(lastMessageB).getTime() - new Date(lastMessageA).getTime();
            });

            console.log(`📋 Sorted chat users (${chatUsers.length}):`, chatUsers);

            if (chatUsers.length === 0) {
                console.log('⚠️ No chat users found, showing empty state');
                chatsList.innerHTML = `
                <div style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 2rem;">
                    <p data-i18n="no_chats_yet">No chats yet</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;" data-i18n="find_user_above">Find a user with the search above</p>
                </div>
            `;
                return;
            }

            console.log('✅ Rendering chat list with users:', chatUsers);

            const avatarPromises = chatUsers.map(user => {
                if (!ChatPage.userAvatars[user]) {
                    return ChatPage.fetchUserAvatar(user);
                }
                return Promise.resolve();
            });
            
            Promise.all(avatarPromises).then(() => {
                chatsList.innerHTML = chatUsers.map(user => {
                    const safeUser = ChatPage.escapeHtml(user);
                    const isActive = ChatPage.activeChatUser === user;
                    const isOnline = ChatPage.onlineUsers.includes(user);
                    const lastMessage = ChatPage.userChats[user]?.[ChatPage.userChats[user].length - 1];
                    const unreadCount = ChatPage.unreadCounts[user] || 0;
                    console.log(`User: ${user}, isOnline: ${isOnline}, onlineUsers:`, ChatPage.onlineUsers);
                    const avatarHtml = ChatPage.getAvatarHtml(user, isOnline, 48);

                    return `
                    <div class="user-item ${isActive ? 'active' : ''}" data-username="${safeUser}">
                        ${avatarHtml}
                        <div class="user-info">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                <div class="user-name">${safeUser}</div>
                                ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                            </div>
                            <div class="user-status" style="display: flex; align-items: center; gap: 0.5rem;">
                                <span>${lastMessage ? (lastMessage.type === 'game_invite' ? 'Game invite' : (ChatPage.escapeHtml(lastMessage.message || '').substring(0, 30) + '...')) : 'New chat'}</span>
                                <span style="font-size: 0.75rem; color: ${isOnline ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.4)'};">
                                    ${isOnline ? '● Online' : '○ Offline'}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
                }).join('');
                
                document.querySelectorAll('.user-item[data-username]').forEach(item => {
                    item.addEventListener('click', () => {
                        const username = (item as HTMLElement).dataset.username;
                        if (username) ChatPage.startChatWith(username);
                    });
                });
            });
        }
    }

    static addMessageToActiveChat(sender: string, message: string, type: 'sent' | 'received') {
        if (!ChatPage.activeChatUser) return;

        const messageData = {
            sender,
            message,
            type,
            timestamp: new Date(),
            messageType: 'text'
        };

        if (!ChatPage.userChats[ChatPage.activeChatUser]) {
            ChatPage.userChats[ChatPage.activeChatUser] = [];
        }
        ChatPage.userChats[ChatPage.activeChatUser].push(messageData);

        ChatPage.displayMessage(messageData);

        ChatPage.updateChatsList();
    }

    static addGameInviteToChat(username: string, type: 'sent' | 'received') {
        if (!ChatPage.activeChatUser && type === 'sent') ChatPage.activeChatUser = username;
        if (!ChatPage.activeChatUser) return;

        const messageData = {
            sender: type === 'sent' ? 'Siz' : username,
            message: 'Pong davetiyesi',
            type,
            timestamp: new Date(),
            messageType: 'game_invite'
        };

        if (!ChatPage.userChats[ChatPage.activeChatUser]) {
            ChatPage.userChats[ChatPage.activeChatUser] = [];
        }
        ChatPage.userChats[ChatPage.activeChatUser].push(messageData);

        ChatPage.displayGameInvite(messageData, username);

        ChatPage.updateChatsList();
    }

    static displayMessage(messageData: any) {
        const chatMessages = document.getElementById("chatMessages");
        if (chatMessages) {
            const messageDiv = document.createElement("div");
            messageDiv.style.cssText = `display: flex; ${messageData.type === 'sent' ? 'justify-content: flex-end;' : 'justify-content: flex-start;'} margin-bottom: 1rem;`;

            const messageClass = messageData.type === 'sent' ? 'message-sent' : 'message-received';

            const safeMsg = ChatPage.escapeHtml(messageData.message);
            messageDiv.innerHTML = `
            <div class="${messageClass}">
                <div style="word-wrap: break-word;">${safeMsg}</div>
                <div class="message-time">${messageData.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
        `;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    static displayGameInvite(messageData: any, username: string) {
        const chatMessages = document.getElementById("chatMessages");
        if (chatMessages) {
            const inviteDiv = document.createElement("div");
            inviteDiv.className = 'flex justify-center mb-4';
            
            const safeUsername = ChatPage.escapeHtml(username);

            if (messageData.type === 'sent') {
                inviteDiv.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-xl p-4 max-w-sm">
                    <div class="text-center">
                        <div class="text-green-600 font-semibold mb-2">Game Invite Sent</div>
                        <div class="text-sm text-green-700">You sent a Pong invite to ${safeUsername}</div>
                    </div>
                </div>
            `;
            } else {
                inviteDiv.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-xl p-4 max-w-sm">
                    <div class="text-center">
                        <div class="text-green-600 font-semibold mb-2">Game Invite</div>
                        <div class="text-sm text-green-700 mb-3">${safeUsername} invites you to a Pong match!</div>
                        <div class="flex gap-2">
                            <button data-username="${safeUsername}" data-action="accept" 
                                    class="game-invite-btn flex-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 transition duration-200">
                                Accept
                            </button>
                            <button data-action="decline" 
                                    class="game-invite-btn flex-1 bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition duration-200">
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            `;
                
                inviteDiv.querySelectorAll('.game-invite-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const target = e.currentTarget as HTMLElement;
                        const action = target.dataset.action;
                        if (action === 'accept') {
                            const user = target.dataset.username;
                            if (user) ChatPage.acceptGameInvite(user);
                        } else if (action === 'decline') {
                            inviteDiv.remove();
                        }
                    });
                });
            }

            chatMessages.appendChild(inviteDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    static displayTournamentNotification(message: string) {
        const chatMessages = document.getElementById("chatMessages");
        if (chatMessages) {
            const notificationDiv = document.createElement("div");
            notificationDiv.className = 'flex justify-center mb-4';
            notificationDiv.innerHTML = `
            <div class="bg-yellow-50 border border-yellow-200 rounded-xl p-4 max-w-md">
                <div class="flex items-center">
                    <span class="text-2xl mr-3">🏆</span>
                    <div>
                        <div class="font-semibold text-yellow-800 mb-1">Turnuva Bildirimi</div>
                        <div class="text-sm text-yellow-700 mb-2">${message}</div>
                        <button class="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600 transition duration-200">
                            Maça Katıl
                        </button>
                    </div>
                </div>
            </div>
        `;
            chatMessages.appendChild(notificationDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    static loadChatMessages(username: string) {
        const chatMessages = document.getElementById("chatMessages");
        if (chatMessages) {
            chatMessages.innerHTML = '';

            if (ChatPage.userChats[username]) {
                ChatPage.userChats[username].forEach(message => {
                    if (message.messageType === 'game_invite') {
                        ChatPage.displayGameInvite(message, username);
                    } else {
                        ChatPage.displayMessage(message);
                    }
                });
            }
        }
    }

    static async loadRoomHistory(username: string) {
        const roomId = ChatPage.userRoomIds[username];
        if (!roomId) return;

        try {
            const response = await fetch(`${FETCH_ADDRESS}/chat/rooms/${roomId}/history?limit=50`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const messages = data.messages || data || [];

                ChatPage.userChats[username] = messages.map((msg: any) => ({
                    sender: msg.username === ChatPage.getCurrentUsername() ? 'Siz' : msg.username,
                    message: msg.message,
                    type: msg.username === ChatPage.getCurrentUsername() ? 'sent' : 'received',
                    timestamp: new Date(msg.timestamp),
                    messageType: msg.message_type || 'text'
                }));

                ChatPage.loadChatMessages(username);
            }
        } catch (error) {
        }
    }

    static addSystemMessage(message: string) {
        const chatMessages = document.getElementById("chatMessages");
        if (chatMessages) {
            const messageDiv = document.createElement("div");
            messageDiv.style.cssText = 'display: flex; justify-content: center; margin-bottom: 1rem;';
            const safe = ChatPage.escapeHtml(message);
            messageDiv.innerHTML = `
            <div style="background: rgba(0, 240, 255, 0.2); border: 1px solid rgba(0, 240, 255, 0.3); border-radius: 999px; padding: 0.75rem 1.5rem; font-size: 0.875rem; color: var(--neon-cyan);">
                🔔 ${safe}
            </div>
        `;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    static async sendOfflineMessage(messageData: any) {
        try {
            const createRoomResponse = await fetch(`${FETCH_ADDRESS}/chat/rooms`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `Chat with ${messageData.to}`,
                    participants: [ChatPage.getCurrentUsername(), messageData.to]
                })
            });

            if (createRoomResponse.ok) {
                const roomData = await createRoomResponse.json();

                ChatPage.addSystemMessage(`Mesaj ${messageData.to} kullanıcısına gönderildi (room created)`);
            } else {
                ChatPage.addSystemMessage('Mesaj gönderilemedi. Room oluşturulamadı.');
            }
        } catch (error) {
            ChatPage.addSystemMessage('Mesaj gönderme hatası.');
        }
    }

    static async loadFriendsList() {
        try {
            const response = await fetch(`${FETCH_ADDRESS}/user/friends`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                let friendsList = [];
                if (data.user_friends && Array.isArray(data.user_friends)) {
                    friendsList = data.user_friends.map((f: any) => f.username || f.friend_username || f.name || f);
                } else if (data.friends && Array.isArray(data.friends)) {
                    friendsList = data.friends.map((f: any) => f.username || f.name || f);
                } else if (Array.isArray(data)) {
                    friendsList = data.map((f: any) => f.username || f.name || f);
                } else if (data.users && Array.isArray(data.users)) {
                    friendsList = data.users.map((f: any) => f.username || f.name || f);
                }

                friendsList.forEach((friend: string) => {
                    if (!ChatPage.allUsers.includes(friend)) {
                        ChatPage.allUsers.push(friend);
                    }
                });
            }
        } catch (error) {
        }
    }

    static async loadAllUsers() {
        const endpoints = [
            `${FETCH_ADDRESS}/user/friends`,
            `${FETCH_ADDRESS}/chat/rooms`,
            `${FETCH_ADDRESS}/user/profile`
        ];

        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint, {
                    credentials: 'include'
                });

                if (response.ok) {
                    const data = await response.json();

                    if (endpoint.includes('/friends')) {
                        if (data.user_friends && Array.isArray(data.user_friends)) {
                            ChatPage.allUsers = data.user_friends.map((f: any) => f.username || f.friend_username || f.name || f);
                        } else if (data.friends && Array.isArray(data.friends)) {
                            ChatPage.allUsers = data.friends.map((f: any) => f.username || f.name || f);
                        } else if (Array.isArray(data)) {
                            ChatPage.allUsers = data.map((f: any) => f.username || f.name || f);
                        }
                    } else if (endpoint.includes('/rooms')) {
                        if (data.rooms && Array.isArray(data.rooms)) {
                            const participants: string[] = [];
                            data.rooms.forEach((r: any) => {
                                if (r.participants && Array.isArray(r.participants)) {
                                    participants.push(...r.participants);
                                }
                            });
                            ChatPage.allUsers = participants.filter((u: any) => u !== ChatPage.getCurrentUsername());
                        } else if (Array.isArray(data)) {
                            const participants: string[] = [];
                            data.forEach((r: any) => {
                                if (r.participants && Array.isArray(r.participants)) {
                                    participants.push(...r.participants);
                                }
                            });
                            ChatPage.allUsers = participants.filter((u: any) => u !== ChatPage.getCurrentUsername());
                        }
                    } else if (endpoint.includes('/profile')) {
                        if (data.username) {
                            ChatPage.allUsers = [data.username];
                        }
                    } else {
                        continue;
                    }

                    if (ChatPage.allUsers.length > 0) {
                        break;
                    }
                }
            } catch (error) {
            }
        }
    }

    static inviteToGame(username: string) {
        const socket = GlobalState.getSocket();
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            Notification.error('Chat bağlantısı yok. Lütfen sayfayı yenileyin.', 3000);
            return;
        }

        fetch(`${FETCH_ADDRESS}/user/getUserId/${username}`, {
            credentials: 'include'
        })
        .then(response => response.json())
        .then(data => {
            if (data.userId) {
                socket.send(JSON.stringify({
                    type: 'game_invite',
                    data: {
                        toUserId: data.userId,
                        toUsername: username
                    }
                }));
                Notification.success(`${username} kullanıcısına oyun daveti gönderildi!`, 3000);
            } else {
                Notification.error('Kullanıcı bulunamadı.', 3000);
            }
        })
        .catch(error => {
            console.error('Error getting user ID:', error);
            Notification.error('Oyun daveti gönderilemedi.', 3000);
        });
    }

    static handleGameInvite(data: any) {
        if (data.sent) {
            console.log('Game invite sent:', data);
            return;
        }

        const { inviteId, fromUsername, message } = data;
        
        const notificationId = `game-invite-${inviteId}`;
        const notificationDiv = document.createElement('div');
        notificationDiv.id = notificationId;
        notificationDiv.style.cssText = `
            position: fixed;
            top: 100px;
            right: 2rem;
            background: linear-gradient(135deg, var(--neon-cyan), var(--neon-purple));
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3), 0 0 20px rgba(0, 240, 255, 0.3);
            z-index: 10000;
            min-width: 350px;
            max-width: 500px;
            animation: slideInRight 0.3s ease-out;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        notificationDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 0.75rem;">
                <p style="margin: 0; font-weight: 600; font-size: 1rem;">${ChatPage.escapeHtml(message)}</p>
                <div style="display: flex; gap: 0.5rem;">
                    <button onclick="ChatPage.acceptGameInvite('${inviteId}', '${notificationId}')" 
                            style="flex: 1; padding: 0.5rem 1rem; background: var(--neon-green); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Kabul Et
                    </button>
                    <button onclick="ChatPage.declineGameInvite('${inviteId}', '${notificationId}')" 
                            style="flex: 1; padding: 0.5rem 1rem; background: rgba(255, 0, 0, 0.7); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        Reddet
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(notificationDiv);
        
        setTimeout(() => {
            const elem = document.getElementById(notificationId);
            if (elem) {
                elem.style.animation = 'slideOutRight 0.3s ease-out';
                setTimeout(() => elem.remove(), 300);
            }
        }, 30000);
    }

    static acceptGameInvite(inviteId: string, notificationId?: string) {
        if (notificationId) {
            const elem = document.getElementById(notificationId);
            if (elem) elem.remove();
        }
        
        const socket = GlobalState.getSocket();
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            Notification.error('Chat bağlantısı yok. Lütfen sayfayı yenileyin.', 3000);
            return;
        }

        socket.send(JSON.stringify({
            type: 'game_invite_response',
            data: {
                inviteId,
                accept: true
            }
        }));
    }

    static declineGameInvite(inviteId: string, notificationId?: string) {
        if (notificationId) {
            const elem = document.getElementById(notificationId);
            if (elem) elem.remove();
        }
        
        const socket = GlobalState.getSocket();
        if (!socket || socket.readyState !== WebSocket.OPEN) {
            Notification.error('Chat bağlantısı yok. Lütfen sayfayı yenileyin.', 3000);
            return;
        }

        socket.send(JSON.stringify({
            type: 'game_invite_response',
            data: {
                inviteId,
                accept: false
            }
        }));
        
        Notification.info('Oyun daveti reddedildi.', 2000);
    }

    static handleGameInviteResponse(data: any) {
        const { accepted, expired, message } = data;
        
        if (expired) {
            Notification.warning(message, 3000);
        } else if (accepted === false) {
            Notification.info(message, 3000);
        }
    }

    static handleGameStarting(data: any) {
        const { roomId, opponentUsername, message } = data;
        
        Notification.success(message, 3000);

        setTimeout(() => {
            GlobalState.setPage(CLASSIC_GAME_PAGE(roomId));
        }, 1500);
    }
};

const CHAT_PAGE = new ChatPage();

export { ChatPage, CHAT_PAGE };
