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
            }
        } catch (error) {
        }

        return null;
    }

    static invalidateAvatarCache(username?: string): void {
        if (username) {
            const oldUrl = ChatPage.userAvatars[username];
            delete ChatPage.userAvatars[username];
            
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


                switch (data.type) {
                    case 'message':
                        const msgData = data.data;

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
                                    sender: msg.username === ChatPage.getCurrentUsername() ? i18n.t('you') : msg.username,
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

                        
                        if (Array.isArray(usersList)) {
                            ChatPage.onlineUsers = usersList;

                            
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

                        const joinedUsername = data.username || data.data?.username;
                        if (joinedUsername && !ChatPage.onlineUsers.includes(joinedUsername)) {
                            ChatPage.onlineUsers.push(joinedUsername);

                            
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

                        const leftUsername = data.username || data.data?.username;
                        if (leftUsername) {
                            const beforeLength = ChatPage.onlineUsers.length;
                            ChatPage.onlineUsers = ChatPage.onlineUsers.filter(user => user !== leftUsername);

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
                        const errorMessage = data.data?.message || (window as any).i18n.t('unknown_error');
                        

                        if (errorMessage.toLowerCase().includes('access denied') || 
                            errorMessage.toLowerCase().includes('denied') ||
                            errorMessage.toLowerCase().includes('blocked')) {
                            
                            const warningMessage = (window as any).i18n.getLanguage() === 'tr' 
                                ? `❌ ${ChatPage.activeChatUser || 'Bu kullanıcı'} sizi engellemiş. Sayfa yenileniyor...`
                                : `❌ ${ChatPage.activeChatUser || 'This user'} has blocked you. Refreshing page...`;
                                
                            ChatPage.addSystemMessage(warningMessage);
                            

                            setTimeout(() => {
                                window.location.reload();
                            }, 2000)
                        } else {
                            ChatPage.addSystemMessage(`${(window as any).i18n.t('error_prefix')}: ${errorMessage}`);
                        }
                        break;
                }
            };

            socket.onclose = (event) => {
                if (!event.wasClean) {
                    Notification.error((window as any).i18n.t('unable_to_connect_chat'), 8000);
                }
            };

            socket.onerror = (error) => {
                Notification.error((window as any).i18n.t('failed_establish_connection'), 8000);
            };

        } catch (error) {
            Notification.error((window as any).i18n.t('chat_service_unavailable'), 8000);
        }
    }

    static async loadExistingChats() {
        try {

            const response = await fetch(`${FETCH_ADDRESS}/chat/rooms`, {
                credentials: 'include'
            });

            if (response.ok) {
                const data = await response.json();
                const rooms = data.rooms || data || [];


                for (const room of rooms) {
                    if (room.is_private) {
                        let username: string | undefined = room.peer_username;
                        if (!username && room.name && room.name.startsWith('private_')) {
                            const parts = room.name.replace('private_', '').split('_');
                            const currentUser = ChatPage.getCurrentUsername();
                            username = parts.find((u: string) => u !== currentUser) || parts[0];
                        }
                        if (!username) continue;


                        ChatPage.userRoomIds[username] = room.id;

                        try {
                            const historyResponse = await fetch(`${FETCH_ADDRESS}/chat/rooms/${room.id}/history?limit=50`, {
                                credentials: 'include'
                            });

                            if (historyResponse.ok) {
                                const historyData = await historyResponse.json();
                                const messages = historyData.messages || historyData || [];

                                ChatPage.userChats[username] = messages.map((msg: any) => ({
                                    sender: msg.username === ChatPage.getCurrentUsername() ? i18n.t('you') : msg.username,
                                    message: msg.message,
                                    type: msg.username === ChatPage.getCurrentUsername() ? 'sent' : 'received',
                                    timestamp: new Date(msg.timestamp),
                                    messageType: msg.message_type || 'text'
                                }));
                                
                            }
                        } catch (historyError) {

                        }

                        if (!ChatPage.allUsers.includes(username)) {
                            ChatPage.allUsers.push(username);
                        }
                    }
                }

                ChatPage.updateChatsList();
            }
        } catch (error) {
        }
    }

    static async sendChatMessage(event: Event) {
        event.preventDefault();
        const messageInput = document.getElementById("messageInput") as HTMLInputElement;

        if (!ChatPage.activeChatUser) {
            ChatPage.addSystemMessage((window as any).i18n.t('please_select_user'));
            return;
        }

        const message = messageInput.value.trim();
        if (!message) return;

        if (ChatPage.blockedUsers.includes(ChatPage.activeChatUser)) {
            ChatPage.addSystemMessage((window as any).i18n.t('user_blocked_by_you_warning'));
            return;
        }

        const roomId = ChatPage.userRoomIds[ChatPage.activeChatUser];
        const socket = GlobalState.getSocket();

        if (!roomId) {
            ChatPage.addSystemMessage((window as any).i18n.t('room_preparing'));

            const createdRoomId = await ChatPage.createOrJoinPrivateRoom(ChatPage.activeChatUser);
            if (!createdRoomId) {
                ChatPage.addSystemMessage((window as any).i18n.t('room_creation_failed'));
                return;
            }
        }

        if (!socket || socket.readyState !== WebSocket.OPEN) {
            ChatPage.addSystemMessage((window as any).i18n.t('websocket_disconnected'));

            ChatPage.connectWebSocket();

            ChatPage.addMessageToActiveChat(i18n.t('you'), message, 'sent');
            messageInput.value = '';
            return;
        }

        const finalRoomId = ChatPage.userRoomIds[ChatPage.activeChatUser];
        if (!finalRoomId) {
            ChatPage.addSystemMessage((window as any).i18n.t('room_id_not_found'));
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

            ChatPage.addMessageToActiveChat(i18n.t('you'), message, 'sent');
            messageInput.value = '';
        } catch (error) {
            ChatPage.addSystemMessage((window as any).i18n.t('message_send_failed'));
        }
    }

    static async blockUser(username: string) {
        const confirmMessage = (window as any).i18n.getLanguage() === 'tr' 
            ? `${username} kullanıcısını engellemek istediğinizden emin misiniz? Engellediğinizde birbirinize mesaj gönderemezsiniz.`
            : `Are you sure you want to block ${username}? You won't be able to send messages to each other.`;
        
        if (confirm(confirmMessage)) {
            try {

                const userIdResponse = await fetch(`${FETCH_ADDRESS}/user/getUserId/${username}`, {
                    method: 'GET',
                    credentials: 'include'
                });

                if (!userIdResponse.ok) {
                    ChatPage.addSystemMessage((window as any).i18n.t('user_not_found'));
                    return;
                }

                const userIdData = await userIdResponse.json();
                if (!userIdData.success || !userIdData.userId) {
                    ChatPage.addSystemMessage((window as any).i18n.t('user_id_failed'));
                    return;
                }


                const response = await fetch(`${FETCH_ADDRESS}/user/friends/block`, {
                    method: 'POST',
                    credentials: 'include',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ blocked_id: userIdData.userId })
                });

                if (response.ok) {

                    window.location.reload();
                } else {
                    const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
                    ChatPage.addSystemMessage(`${(window as any).i18n.t('block_failed')}: ${errorData.message || response.status}`);
                }
            } catch (error) {
                ChatPage.addSystemMessage((window as any).i18n.t('block_operation_failed'));
            }
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
                ChatPage.addSystemMessage((window as any).i18n.t('profile_load_failed'));
            }
        } catch (error) {
            ChatPage.addSystemMessage((window as any).i18n.t('profile_load_failed'));
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
            
            <div class="flex gap-3 mb-3">
                <button id="sendMessageBtn" data-username="${safeUsername}"
                        class="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold">
                    ${(window as any).i18n.t('send') || 'Send Message'}
                </button>
                <button id="inviteGameBtn" data-username="${safeUsername}"
                        class="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition duration-200 font-semibold">
                    ${(window as any).i18n.t('invite_to_pong') || 'Invite to Game'}
                </button>
            </div>
            
            ${!ChatPage.blockedUsers.includes(safeUsername) ? `
                <button id="blockUserBtn" data-username="${safeUsername}"
                        class="w-full bg-red-500 text-white px-4 py-3 rounded-lg hover:bg-red-600 transition duration-200 font-semibold">
                    🚫 ${(window as any).i18n.t('block_user') || 'Block User'}
                </button>
            ` : `
                <div class="w-full p-3 bg-red-50 border border-red-200 rounded-lg text-center">
                    <span class="text-red-700 text-sm">${(window as any).i18n.t('user_blocked_by_you_warning') || 'You have blocked this user.'}</span>
                </div>
            `}
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
        modal.querySelector('#blockUserBtn')?.addEventListener('click', () => {
            const username = (modal.querySelector('#blockUserBtn') as HTMLElement)?.dataset.username;
            if (username) {
                ChatPage.blockUser(username);
                modal.remove();
            }
        });
    }

    static async createOrJoinPrivateRoom(username: string): Promise<string | null> {
        try {

            const roomsResponse = await fetch(`${FETCH_ADDRESS}/chat/rooms`, {
                credentials: 'include'
            });

            if (roomsResponse.ok) {
                const roomsData = await roomsResponse.json();
                const rooms = roomsData.rooms || roomsData.data?.rooms || roomsData || [];

                for (const room of rooms) {
                    if (room.is_private && (room.peer_username === username)) {
                        ChatPage.userRoomIds[username] = room.id;

                        const socket = GlobalState.getSocket();
                        if (socket && socket.readyState === WebSocket.OPEN) {
                            socket.send(JSON.stringify({
                                type: 'join_room',
                                data: { room_id: room.id }
                            }));
                        }

                        return room.id;
                    }
                }
            }

            ChatPage.addSystemMessage((window as any).i18n.t('friends_only_chat'));
            return null;
        } catch (error) {
            return null;
        }
    }

    static async startChatWith(username: string) {
        ChatPage.activeChatUser = username;

        ChatPage.updateChatHeader();
        ChatPage.updateChatsList();

        const roomId = await ChatPage.createOrJoinPrivateRoom(username);

        if (!roomId) {
            ChatPage.addSystemMessage((window as any).i18n.t('room_creation_failed'));
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
            messageInput.placeholder = i18n.t('user_blocked');
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
            messageInput.placeholder = i18n.t('type_message');
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
                <div style="display: flex; align-items: center; gap: 1rem; cursor: pointer;" onclick="(async () => { await ChatPage.showUserProfile('${ChatPage.activeChatUser}'); })()">
                    <div style="position: relative;">
                        ${avatarHtml}
                    </div>
                    <div>
                        <h3 style="font-weight: 600; font-size: 1.125rem; color: white; margin: 0; transition: color 0.3s;" onmouseover="this.style.color='var(--neon-cyan)'" onmouseout="this.style.color='white'">${ChatPage.escapeHtml(ChatPage.activeChatUser)}</h3>
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
                    🎮 ${i18n.t('invite_to_pong')}
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
                    <p>${(window as any).i18n.t('user_not_found')}</p>
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
                            (lastMessage.type === 'game_invite' ? i18n.t('game_invite') : ChatPage.escapeHtml(lastMessage.message)) :
                            i18n.t('new_chat')
                        }</span>
                                <span style="font-size: 0.75rem; color: ${isOnline ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.4)'};">
                                    ${isOnline ? '● ' + i18n.t('online') : '○ ' + i18n.t('offline')}
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
        
        const chatsList = document.getElementById("chatsList");
        if (chatsList) {
            const chatUsers = Object.keys(ChatPage.userChats).sort((a, b) => {
                    const lastMessageA = ChatPage.userChats[a]?.[ChatPage.userChats[a].length - 1]?.timestamp || 0;
                    const lastMessageB = ChatPage.userChats[b]?.[ChatPage.userChats[b].length - 1]?.timestamp || 0;
                    return new Date(lastMessageB).getTime() - new Date(lastMessageA).getTime();
                });


            if (chatUsers.length === 0) {
                chatsList.innerHTML = `
                <div style="text-align: center; color: rgba(255, 255, 255, 0.5); padding: 2rem;">
                    <p data-i18n="no_chats_yet">No chats yet</p>
                    <p style="font-size: 0.875rem; margin-top: 0.5rem;" data-i18n="find_user_above">Find a user with the search above</p>
                </div>
            `;
                return;
            }


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
                    const avatarHtml = ChatPage.getAvatarHtml(user, isOnline, 48);

                    return `
                    <div class="user-item ${isActive ? 'active' : ''}" data-username="${safeUser}">
                        ${avatarHtml}
                        <div class="user-info">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.25rem;">
                                <div class="user-name" style="cursor: pointer;" title="Çift tıklayarak profil görüntüle">${safeUser}</div>
                                ${unreadCount > 0 ? `<span class="unread-badge">${unreadCount}</span>` : ''}
                            </div>
                            <div class="user-status" style="display: flex; align-items: center; gap: 0.5rem;">
                                <span>${lastMessage ? (lastMessage.type === 'game_invite' ? i18n.t('game_invite') : (ChatPage.escapeHtml(lastMessage.message || '').substring(0, 30) + '...')) : i18n.t('new_chat')}</span>
                                <span style="font-size: 0.75rem; color: ${isOnline ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.4)'};">
                                    ${isOnline ? '● ' + i18n.t('online') : '○ ' + i18n.t('offline')}
                                </span>
                            </div>
                        </div>
                    </div>
                `;
                }).join('');
                
                document.querySelectorAll('.user-item[data-username]').forEach(item => {
                    const username = (item as HTMLElement).dataset.username;
                    
                    item.addEventListener('click', () => {
                        if (username) ChatPage.startChatWith(username);
                    });
                    
                    item.addEventListener('dblclick', async () => {
                        if (username) await ChatPage.showUserProfile(username);
                    });
                });
            });
        }
    }

    static async showUserProfile(username: string) {
        const isOnline = ChatPage.onlineUsers.includes(username);
        const avatar = ChatPage.getAvatarHtml(username, isOnline, 64);
        
        let stats = { wins: 0, losses: 0, totalMatches: 0, winRate: 0 };
        let displayUsername = username;
        
        try {
            
            const userIdResponse = await fetch(`${FETCH_ADDRESS}/user/getUserId/${username}`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (userIdResponse.ok) {
                const userIdData = await userIdResponse.json();
                
                if (userIdData.success && userIdData.userId) {
                    
                    const statsResponse = await fetch(`${FETCH_ADDRESS}/user/other/${userIdData.userId}/detailed-stats`, {
                        method: 'GET',
                        credentials: 'include',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    
                    if (statsResponse.ok) {
                        const statsData = await statsResponse.json();
                        
                        if (statsData.success && statsData.stats) {
                            const userStats = statsData.stats;
                            const totalMatches = (userStats.wins || 0) + (userStats.losses || 0);
                            const winRate = totalMatches > 0 ? Math.round(((userStats.wins || 0) / totalMatches) * 100) : 0;
                            
                            stats = {
                                wins: userStats.wins || 0,
                                losses: userStats.losses || 0,
                                totalMatches: totalMatches,
                                winRate: winRate
                            };
                            
                        } else {
                        }
                    } else {
                    }
                } else {
                }
            } else {
            }
        } catch (error) {
        }
        
        const modal = document.createElement('div');
        modal.id = 'profileModal';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.7); display: flex; align-items: center; 
            justify-content: center; z-index: 9999; backdrop-filter: blur(5px);
        `;
        
        modal.innerHTML = `
            <div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 2rem; border-radius: 16px; max-width: 400px; width: 90%; border: 1px solid rgba(0, 240, 255, 0.3); box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    ${avatar}
                    <div>
                        <h3 style="margin: 0; color: white; font-size: 1.25rem; font-weight: 600;">${ChatPage.escapeHtml(username)}</h3>
                        <p style="margin: 0.5rem 0 0 0; color: ${isOnline ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.6)'}; display: flex; align-items: center; gap: 0.5rem; font-weight: 500;">
                            <span style="display: inline-block; width: 10px; height: 10px; background: ${isOnline ? 'var(--neon-green)' : 'rgba(255, 255, 255, 0.4)'}; border-radius: 50%; ${isOnline ? 'box-shadow: 0 0 8px var(--neon-green);' : ''}"></span>
                            ${isOnline ? i18n.t('online') : i18n.t('offline')}
                        </p>
                    </div>
                </div>
                
                <div style="background: rgba(255, 255, 255, 0.05); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; border: 1px solid rgba(255, 255, 255, 0.1);">
                    <h4 style="margin: 0 0 0.75rem 0; color: var(--neon-cyan); font-size: 1rem; font-weight: 600;">📊 ${i18n.t('stats')}</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; color: rgba(255, 255, 255, 0.8); font-size: 0.9rem;">
                        <div style="text-align: center; padding: 0.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                            <div style="color: var(--neon-green); font-weight: 600; font-size: 1.1rem;">${stats.wins || 0}</div>
                            <div>${i18n.t('wins')}</div>
                        </div>
                        <div style="text-align: center; padding: 0.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                            <div style="color: #ff6b6b; font-weight: 600; font-size: 1.1rem;">${stats.losses || 0}</div>
                            <div>${i18n.t('losses')}</div>
                        </div>
                        <div style="text-align: center; padding: 0.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                            <div style="color: var(--neon-cyan); font-weight: 600; font-size: 1.1rem;">${stats.totalMatches || 0}</div>
                            <div>${i18n.t('total_matches')}</div>
                        </div>
                        <div style="text-align: center; padding: 0.5rem; background: rgba(255, 255, 255, 0.05); border-radius: 8px;">
                            <div style="color: #ffd93d; font-weight: 600; font-size: 1.1rem;">${stats.winRate || 0}%</div>
                            <div>${i18n.t('win_rate')}</div>
                        </div>
                    </div>
                </div>

                <div style="display: flex; justify-content: center; gap: 1rem;">
                    ${!ChatPage.blockedUsers.includes(username) ? `
                        <button onclick="ChatPage.blockUser('${username}'); ChatPage.closeProfileModal();" 
                                style="background: linear-gradient(135deg, #ff4444, #cc0000); color: white; border: none; padding: 0.75rem 2rem; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 15px rgba(255, 68, 68, 0.3); transition: all 0.3s;"
                                onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 68, 68, 0.4)';"
                                onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 68, 68, 0.3)';">
                            🚫 ${i18n.t('block_user')}
                        </button>
                    ` : ''}
                    <button onclick="ChatPage.closeProfileModal()" 
                            style="background: linear-gradient(135deg, var(--neon-cyan), var(--neon-green)); color: white; border: none; padding: 0.75rem 2rem; border-radius: 12px; cursor: pointer; font-weight: 600; font-size: 1rem; box-shadow: 0 4px 15px rgba(0, 240, 255, 0.3); transition: all 0.3s;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(0, 240, 255, 0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(0, 240, 255, 0.3)';">
                        ${i18n.t('close')}
                    </button>
                </div>
            </div>
        `;
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) ChatPage.closeProfileModal();
        });
        
        document.body.appendChild(modal);
    }

    static closeProfileModal() {
        const modal = document.getElementById('profileModal');
        if (modal) {
            modal.remove();
            document.body.style.filter = '';
            document.body.style.overflow = '';
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
                        <div class="text-green-600 font-semibold mb-2">${i18n.t('game_invite_sent')}</div>
                        <div class="text-sm text-green-700">${i18n.t('you_sent_pong_invite')} ${safeUsername}</div>
                    </div>
                </div>
            `;
            } else {
                inviteDiv.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-xl p-4 max-w-sm">
                    <div class="text-center">
                        <div class="text-green-600 font-semibold mb-2">${i18n.t('game_invite')}</div>
                        <div class="text-sm text-green-700 mb-3">${safeUsername} ${i18n.t('invites_you_to_pong')}</div>
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
            } else {
                ChatPage.addSystemMessage((window as any).i18n.t('room_creation_failed'));
            }
        } catch (error) {
            ChatPage.addSystemMessage((window as any).i18n.t('message_error'));
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
            Notification.error((window as any).i18n.t('chat_connection_lost'), 3000);
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
                Notification.success(`${username} ${(window as any).i18n.t('game_invite_sent_notification')}`, 3000);
            } else {
                Notification.error((window as any).i18n.t('user_not_found'), 3000);
            }
        })
        .catch(error => {
            Notification.error((window as any).i18n.t('game_invite_send_failed'), 3000);
        });
    }

    static handleGameInvite(data: any) {
        if (data.sent) {
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
                        ${i18n.t('accept')}
                    </button>
                    <button onclick="ChatPage.declineGameInvite('${inviteId}', '${notificationId}')" 
                            style="flex: 1; padding: 0.5rem 1rem; background: rgba(255, 0, 0, 0.7); color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;">
                        ${i18n.t('decline')}
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
            Notification.error((window as any).i18n.t('chat_connection_lost'), 3000);
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
            Notification.error((window as any).i18n.t('chat_connection_lost'), 3000);
            return;
        }

        socket.send(JSON.stringify({
            type: 'game_invite_response',
            data: {
                inviteId,
                accept: false
            }
        }));
        
        Notification.info((window as any).i18n.t('game_invite_declined'), 2000);
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
