import { GlobalState, Page, FETCH_ADDRESS, WS_ADDRESS } from "../main"
import * as i18n from "../i18n";
import { HOME_PAGE } from "./HomePage"

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

    async render(): Promise<void> {
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
                <div class="min-h-screen bg-gray-50">
                    <nav class="bg-white border-b border-gray-200 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <div class="flex items-center gap-4">
                                <button onclick="GlobalState.setPage(HOME_PAGE)" class="text-2xl font-bold text-blue-600 hover:text-blue-700 transition duration-200">
                                    💬 <span data-i18n="chat">Live Chat</span>
                                </button>
                                <div class="ml-4">
                                    <button id="lang-en" class="mr-2">EN</button>
                                    <button id="lang-tr">TR</button>
                                </div>
                            </div>
                            <button onclick="GlobalState.setPage(HOME_PAGE)" class="text-gray-600 hover:text-gray-800 transition duration-200">
                                ← <span data-i18n="back_to_home">Ana Sayfa</span>
                            </button>
                        </div>
                    </nav>

                    <div class="flex h-[calc(100vh-80px)]">
                        
                        <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
                            <div class="p-4 border-b border-gray-200">
                                <div class="relative">
                                    <input type="text" id="userSearchInput" placeholder="Kullanıcı Ara" data-i18n-placeholder="search_user"
                                           class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                                           oninput="ChatPage.searchUsers()"
                                           onkeyup="ChatPage.searchUsers()"
                                           onpaste="ChatPage.setTimeout(searchUsers, 100)">
                                    <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
                                </div>
                            </div>
                            
                            <div class="flex-1 overflow-y-auto">
                                <div id="chatsList" class="py-2">
                                    <div class="text-center text-gray-500 py-8">
                                        <p data-i18n="no_chats_yet">Henüz sohbet yok</p>
                                        <p class="text-sm" data-i18n="find_user_above">Yukarıdaki arama ile kullanıcı bulun</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex-1 flex flex-col">
                            <div id="chatHeader" class="bg-white border-b border-gray-200 p-4">
                                <div class="text-center text-gray-500">
                                    <p data-i18n="select_chat">Bir sohbet seçin</p>
                                </div>
                            </div>
                            
                            <div id="chatMessages" class="flex-1 overflow-y-auto p-4 bg-gray-50">
                                <div class="text-center text-gray-500 py-16">
                                    <div class="text-6xl mb-4">💬</div>
                                    <p class="text-lg">Mesajlaşmaya başlamak için bir kullanıcı seçin</p>
                                </div>
                            </div>
                            
                            <div class="bg-white border-t border-gray-200 p-4">
                                <form id="messageForm" method="post" class="flex gap-3" onsubmit="ChatPage.sendChatMessage(event)">
                                    <input type="text" id="messageInput" placeholder="Mesajını yaz..." data-i18n-placeholder="type_message"
                                           class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                           disabled>
                                    <button type="submit" id="sendButton" 
                                            class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold disabled:opacity-50" data-i18n="send"
                                            disabled>
                                        Gönder
                                    </button>
                                </form>
                            </div>
                        </div>
                        
                        <div id="userInfoPanel" class="w-80 bg-white border-l border-gray-200 hidden">
                            <div class="text-center text-gray-500 py-16">
                                <p data-i18n="user_profile">Kullanıcı bilgisi burada görünecek</p>
                            </div>
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

        ChatPage.connectWebSocket();
        ChatPage.updateChatsList();
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
    }

    static getCurrentUsername(): string {
        return window.localStorage.getItem("username") || "Guest";
    }

    static connectWebSocket() {
        try {
            const socket = new WebSocket(`${WS_ADDRESS}/chat`);

            socket.onopen = () => {
                GlobalState.setSocket(socket);
                ChatPage.addSystemMessage('Chat bağlantısı kuruldu');

                socket.send(JSON.stringify({ type: 'get_online_users' }));
                socket.send(JSON.stringify({ type: 'get_offline_messages' }));
            };

            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);

                switch (data.type) {
                    case 'message':
                        const msgData = data.data;
                        const senderUsername = msgData.username;

                        if (senderUsername !== ChatPage.getCurrentUsername()) {
                            for (const [user, roomId] of Object.entries(ChatPage.userRoomIds)) {
                                if (roomId === msgData.room_id) {
                                    if (!ChatPage.blockedUsers.includes(user)) {
                                        if (ChatPage.activeChatUser === user) {
                                            ChatPage.addMessageToActiveChat(senderUsername, msgData.message, 'received');
                                        } else {
                                            ChatPage.unreadCounts[user] = (ChatPage.unreadCounts[user] || 0) + 1;
                                            if (!ChatPage.userChats[user]) {
                                                ChatPage.userChats[user] = [];
                                            }
                                            ChatPage.userChats[user].push({
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
                                    break;
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

                    case 'user_joined':
                        break;

                    case 'user_left':
                        break;

                    case 'game_invite':
                        if (ChatPage.activeChatUser === data.from) {
                            ChatPage.addGameInviteToChat(data.from, 'received');
                        }
                        break;

                    case 'tournament_notification':
                        ChatPage.displayTournamentNotification(data.message);
                        break;

                    case 'online_users':
                        ChatPage.onlineUsers = data.users || [];
                        ChatPage.onlineUsers.forEach(user => {
                            if (!ChatPage.allUsers.includes(user)) {
                                ChatPage.allUsers.push(user);
                            }
                        });

                        ChatPage.updateChatsList();
                        i18n.translateDOM();
                        if (ChatPage.activeChatUser) {
                            ChatPage.updateChatHeader();
                        }
                        break;

                    case 'user_joined':
                        if (!ChatPage.onlineUsers.includes(data.username)) {
                            ChatPage.onlineUsers.push(data.username);
                            if (!ChatPage.allUsers.includes(data.username)) {
                                ChatPage.allUsers.push(data.username);
                            }
                            ChatPage.updateChatsList();
                            i18n.translateDOM();
                            if (ChatPage.activeChatUser === data.username) {
                                ChatPage.updateChatHeader();
                            }
                        }
                        break;

                    case 'user_left':
                        ChatPage.onlineUsers = ChatPage.onlineUsers.filter(user => user !== data.username);
                        ChatPage.updateChatsList();
                        if (ChatPage.activeChatUser === data.username) {
                            ChatPage.updateChatHeader();
                        }
                        break;

                    case 'error':
                        ChatPage.addSystemMessage(`Hata: ${data.data?.message || 'Bilinmeyen hata'}`);
                        break;
                }
            };

            socket.onclose = () => {
                ChatPage.addSystemMessage('Bağlantı kesildi');
            };

            socket.onerror = (error) => {
                ChatPage.addSystemMessage('Bağlantı hatası');
            };

        } catch (error) {
            ChatPage.addSystemMessage('WebSocket bağlantısı kurulamadı');
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
                    if (room.is_private && room.name.startsWith('private_')) {
                        const username = room.name.replace('private_', '');

                        ChatPage.userRoomIds[username] = room.id;

                        try {
                            const historyResponse = await fetch(`${FETCH_ADDRESS}/chat/rooms/${room.id}/history?limit=50`, {
                                credentials: 'include'
                            });

                            if (historyResponse.ok) {
                                const historyData = await historyResponse.json();
                                const messages = historyData.messages || historyData || [];

                                ChatPage.userChats[username] = messages.map((msg: any) => ({
                                    sender: msg.username === ChatPage.getCurrentUsername() ? 'Siz' : msg.username,
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

    static async inviteToGame(username: string) {
        const socket = GlobalState.getSocket();
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'game_invite',
                to: username,
                from: ChatPage.getCurrentUsername(),
                gameType: 'pong'
            }));

            ChatPage.addGameInviteToChat(username, 'sent');
        } else {
            ChatPage.addSystemMessage('Bağlantı sorunu. Oyun davetiyesi gönderilemedi.');
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
        modal.innerHTML = `
        <div class="bg-white rounded-xl p-8 max-w-lg w-full m-4 shadow-2xl">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold text-gray-800">${profile.username} - Profil</h3>
                <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600 text-3xl">×</button>
            </div>
            
            <div class="flex items-center mb-6">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                    ${profile.username.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h4 class="text-xl font-semibold text-gray-800">${profile.username}</h4>
                    <p class="text-gray-600">${profile.online ? '🟢 Çevrimiçi' : '🔴 Çevrimdışı'}</p>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-green-600">${profile.wins || 0}</div>
                    <div class="text-sm text-gray-600">Galibiyet</div>
                </div>
                <div class="bg-gray-50 p-4 rounded-lg text-center">
                    <div class="text-2xl font-bold text-red-600">${profile.losses || 0}</div>
                    <div class="text-sm text-gray-600">Mağlubiyet</div>
                </div>
            </div>
            
            <div class="flex gap-3">
                <button onclick="ChatPage.startChatWith('${profile.username}'); this.closest('.fixed').remove();" 
                        class="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold">
                    💬 Mesaj Gönder
                </button>
                <button onclick="ChatPage.inviteToGame('${profile.username}'); this.closest('.fixed').remove();" 
                        class="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition duration-200 font-semibold">
                    🎮 Oyuna Davet Et
                </button>
            </div>
        </div>
    `;
        document.body.appendChild(modal);
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
                    if (room.is_private && room.name === `private_${username}`) {
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

            const createResponse = await fetch(`${FETCH_ADDRESS}/chat/rooms`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `private_${username}`,
                    isPrivate: true
                })
            });

            if (createResponse.ok) {
                const createData = await createResponse.json();

                const roomId = createData.room?.id || createData.data?.room?.id || createData.id;

                if (roomId) {
                    ChatPage.userRoomIds[username] = roomId;

                    const socket = GlobalState.getSocket();
                    if (socket && socket.readyState === WebSocket.OPEN) {
                        socket.send(JSON.stringify({
                            type: 'join_room',
                            data: { room_id: roomId }
                        }));
                    }

                    return roomId;
                }
            } else {
                const tempRoomId = `temp_${username}_${Date.now()}`;
                ChatPage.userRoomIds[username] = tempRoomId;
                return tempRoomId;
            }

            return null;
        } catch (error) {
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

    static updateChatHeader() {
        const chatHeader = document.getElementById("chatHeader");
        if (chatHeader && ChatPage.activeChatUser) {
            const isOnline = ChatPage.onlineUsers.includes(ChatPage.activeChatUser);
            const statusColor = isOnline ? 'bg-green-500' : 'bg-gray-400';
            const statusText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';

            chatHeader.innerHTML = `
            <div class="flex items-center cursor-pointer" onclick="ChatPage.toggleUserInfoPanel()">
                <div class="relative mr-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        ${ChatPage.activeChatUser.charAt(0).toUpperCase()}
                    </div>
                    <div class="absolute -bottom-1 -right-1 w-4 h-4 ${statusColor} border-2 border-white rounded-full"></div>
                </div>
                <div>
                    <h3 class="font-semibold text-gray-800 text-lg">${ChatPage.activeChatUser}</h3>
                    <p class="text-sm text-gray-600">${statusText}</p>
                </div>
            </div>
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

            chatsList.innerHTML = users.map(user => {
                const isOnline = ChatPage.onlineUsers.includes(user);
                const statusIcon = isOnline ? '🟢' : '🔴';
                const hasExistingChat = ChatPage.userChats[user];
                const lastMessage = hasExistingChat ? ChatPage.userChats[user][ChatPage.userChats[user].length - 1] : null;

                return `
                <div class="flex items-center p-3 hover:bg-gray-50 transition duration-200 cursor-pointer rounded-lg mx-2"
                     onclick="ChatPage.startChatWith('${user}')">
                    <div class="relative mr-3">
                        <div class="w-12 h-12 bg-gradient-to-br ${hasExistingChat ? 'from-blue-500 to-purple-600' : 'from-gray-400 to-gray-600'} rounded-full flex items-center justify-center text-white font-bold">
                            ${user.charAt(0).toUpperCase()}
                        </div>
                        <div class="absolute -bottom-1 -right-1 text-xs">${statusIcon}</div>
                    </div>
                    <div class="flex-1">
                        <h4 class="font-semibold text-gray-800">${user}</h4>
                        <p class="text-sm text-gray-600">
                            ${hasExistingChat && lastMessage ?
                        (lastMessage.type === 'game_invite' ? '🎮 Oyun davetiyesi' : lastMessage.message) :
                        'Yeni sohbet başlat'
                    }
                        </p>
                    </div>
                </div>
            `;
            }).join('');
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
                <div class="text-center text-gray-500 py-8">
                    <p>Henüz sohbet yok</p>
                    <p class="text-sm">Yukarıdaki arama ile kullanıcı bulun</p>
                </div>
            `;
                return;
            }

            chatsList.innerHTML = chatUsers.map(user => {
                const isActive = ChatPage.activeChatUser === user;
                const isOnline = ChatPage.onlineUsers.includes(user);
                const statusIcon = isOnline ? '🟢' : '🔴';
                const lastMessage = ChatPage.userChats[user]?.[ChatPage.userChats[user].length - 1];
                const unreadCount = ChatPage.unreadCounts[user] || 0;

                return `
                <div class="flex items-center p-3 hover:bg-gray-50 transition duration-200 cursor-pointer rounded-lg mx-2 ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''}"
                     onclick="ChatPage.startChatWith('${user}')">
                    <div class="relative mr-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                            ${user.charAt(0).toUpperCase()}
                        </div>
                        <div class="absolute -bottom-1 -right-1 text-xs">${statusIcon}</div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex justify-between items-center">
                            <h4 class="font-semibold text-gray-800 truncate">${user}</h4>
                            ${unreadCount > 0 ? `
                                <span class="bg-red-500 text-white text-xs px-2 py-1 rounded-full ml-2">
                                    ${unreadCount}
                                </span>
                            ` : ''}
                        </div>
                        <p class="text-sm text-gray-600 truncate">
                            ${lastMessage ? (lastMessage.type === 'game_invite' ? '🎮 Oyun davetiyesi' : lastMessage.message) : 'Yeni sohbet'}
                        </p>
                    </div>
                </div>
            `;
            }).join('');
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
            messageDiv.className = `flex ${messageData.type === 'sent' ? 'justify-end' : 'justify-start'} mb-4`;

            const bgColor = messageData.type === 'sent' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800';
            const alignment = messageData.type === 'sent' ? 'rounded-bl-xl rounded-tl-xl rounded-tr-xl' : 'rounded-br-xl rounded-tr-xl rounded-tl-xl';

            messageDiv.innerHTML = `
            <div class="${bgColor} ${alignment} px-4 py-2 max-w-xs lg:max-w-md shadow-sm">
                <div class="break-words">${messageData.message}</div>
                <div class="text-xs opacity-75 mt-1">${messageData.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
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

            if (messageData.type === 'sent') {
                inviteDiv.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-xl p-4 max-w-sm">
                    <div class="text-center">
                        <div class="text-green-600 font-semibold mb-2">🎮 Oyun Davetiyesi Gönderildi</div>
                        <div class="text-sm text-green-700">${username} kullanıcısına Pong davetiyesi gönderdin</div>
                    </div>
                </div>
            `;
            } else {
                inviteDiv.innerHTML = `
                <div class="bg-green-50 border border-green-200 rounded-xl p-4 max-w-sm">
                    <div class="text-center">
                        <div class="text-green-600 font-semibold mb-2">🎮 Oyun Davetiyesi</div>
                        <div class="text-sm text-green-700 mb-3">${username} seni bir Pong maçına davet ediyor!</div>
                        <div class="flex gap-2">
                            <button onclick="ChatPage.acceptGameInvite('${username}')" 
                                    class="flex-1 bg-green-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-green-600 transition duration-200">
                                Kabul Et
                            </button>
                            <button onclick="this.closest('.bg-green-50').remove()" 
                                    class="flex-1 bg-red-500 text-white px-3 py-2 rounded-lg text-sm hover:bg-red-600 transition duration-200">
                                Reddet
                            </button>
                        </div>
                    </div>
                </div>
            `;
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
            messageDiv.className = 'flex justify-center mb-3';
            messageDiv.innerHTML = `
            <div class="bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm">
                🔔 ${message}
            </div>
        `;
            chatMessages.appendChild(messageDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    static acceptGameInvite(inviter: string) {
        const socket = GlobalState.getSocket();
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({
                type: 'game_invite_accepted',
                to: inviter,
                from: ChatPage.getCurrentUsername()
            }));
            ChatPage.addSystemMessage(`${inviter} ile oyun başlatılıyor...`);
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
};

const CHAT_PAGE = new ChatPage();

export { ChatPage, CHAT_PAGE };
