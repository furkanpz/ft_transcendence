import { GlobalState, Page, FETCH_ADDRESS, WS_ADDRESS } from "../Page"
import { HOME_PAGE } from "./HomePage"

let onlineUsers: string[] = [];
let allUsers: string[] = [];
let blockedUsers: string[] = [];
let chatHistory: any[] = [];
let activeChatUser: string | null = null;
let userChats: { [key: string]: any[] } = {};
let unreadCounts: { [key: string]: number } = {};

export async function sendChatMessage(event: Event) {
    event.preventDefault();
    const messageInput = document.getElementById("messageInput") as HTMLInputElement;
    
    if (!activeChatUser) {
        addSystemMessage('Lütfen bir kullanıcı seçin');
        return;
    }
    
    if (messageInput.value.trim()) {
        const message = messageInput.value.trim();
        
        if (blockedUsers.includes(activeChatUser)) {
            addSystemMessage(`${activeChatUser} kullanıcısı bloklanmış. Mesaj gönderilemez.`);
            return;
        }
        
        const messageData = {
            type: 'private_message',
            to: activeChatUser,
            message: message,
            from: getCurrentUsername(),
            timestamp: new Date().toISOString(),
            offline: !onlineUsers.includes(activeChatUser)
        };
        
        const socket = GlobalState.getSocket();
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(messageData));
        } else {
            await sendOfflineMessage(messageData);
        }
        
        addMessageToActiveChat('Siz', message, 'sent');
        messageInput.value = '';
    }
}

export async function inviteToGame(username: string) {
    const socket = GlobalState.getSocket();
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'game_invite',
            to: username,
            from: getCurrentUsername(),
            gameType: 'pong'
        }));
        
        addGameInviteToChat(username, 'sent');
    } else {
        addSystemMessage('Bağlantı sorunu. Oyun davetiyesi gönderilemedi.');
    }
}

export async function blockUser(username: string) {
    if (confirm(`${username} kullanıcısını engellemek istediğinizden emin misiniz? Engellediğinizde birbirinize mesaj gönderemezsiniz.`)) {
        try {
            const response = await fetch(`${FETCH_ADDRESS}/user/friends/block`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            
            if (response.ok) {
                blockedUsers.push(username);
                addSystemMessage(`${username} kullanıcısı engellendi.`);
                updateChatsList();
                updateUserInfoPanel();
                
                if (activeChatUser === username) {
                    disableChatInput();
                }
            }
        } catch (error) {
            addSystemMessage('Engelleme işlemi başarısız.');
        }
    }
}

export async function unblockUser(username: string) {
        try {
            const response = await fetch(`${FETCH_ADDRESS}/user/friends/block/${username}`, {
                method: 'DELETE',
                credentials: 'include'
            });        if (response.ok) {
            blockedUsers = blockedUsers.filter(user => user !== username);
            addSystemMessage(`${username} kullanıcısının engeli kaldırıldı.`);
            updateChatsList();
            updateUserInfoPanel();
            
            if (activeChatUser === username) {
                enableChatInput();
            }
        }
    } catch (error) {
        addSystemMessage('Engel kaldırma işlemi başarısız.');
    }
}

export async function viewProfile(username: string) {
        try {
            const response = await fetch(`${FETCH_ADDRESS}/user/profile`, {
                credentials: 'include'
            });        if (response.ok) {
            const profile = await response.json();
            showProfileModal(profile);
        } else {
            addSystemMessage('Profil yüklenemedi.');
        }
    } catch (error) {
        addSystemMessage('Profil yüklenemedi.');
    }
}

function showProfileModal(profile: any) {
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
                <button onclick="startChatWith('${profile.username}'); this.closest('.fixed').remove();" 
                        class="flex-1 bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold">
                    💬 Mesaj Gönder
                </button>
                <button onclick="inviteToGame('${profile.username}'); this.closest('.fixed').remove();" 
                        class="flex-1 bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition duration-200 font-semibold">
                    🎮 Oyuna Davet Et
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

export function startChatWith(username: string) {
    activeChatUser = username;
    
    updateChatHeader();
    
    updateChatsList();
    
    updateUserInfoPanel();
    
    loadChatMessages(username);
    
    unreadCounts[username] = 0;
    updateChatsList();
    
    if (blockedUsers.includes(username)) {
        disableChatInput();
    } else {
        enableChatInput();
    }
}

function disableChatInput() {
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

function enableChatInput() {
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

function updateChatHeader() {
    const chatHeader = document.getElementById("chatHeader");
    if (chatHeader && activeChatUser) {
        const isOnline = onlineUsers.includes(activeChatUser);
        const statusColor = isOnline ? 'bg-green-500' : 'bg-gray-400';
        const statusText = isOnline ? 'Çevrimiçi' : 'Çevrimdışı';
        
        chatHeader.innerHTML = `
            <div class="flex items-center cursor-pointer" onclick="toggleUserInfoPanel()">
                <div class="relative mr-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        ${activeChatUser.charAt(0).toUpperCase()}
                    </div>
                    <div class="absolute -bottom-1 -right-1 w-4 h-4 ${statusColor} border-2 border-white rounded-full"></div>
                </div>
                <div>
                    <h3 class="font-semibold text-gray-800 text-lg">${activeChatUser}</h3>
                    <p class="text-sm text-gray-600">${statusText}</p>
                </div>
            </div>
        `;
    }
}

export function toggleUserInfoPanel() {
    const userInfoPanel = document.getElementById("userInfoPanel");
    if (userInfoPanel) {
        userInfoPanel.classList.toggle('hidden');
    }
}

function updateUserInfoPanel() {
    const userInfoPanel = document.getElementById("userInfoPanel");
    if (userInfoPanel && activeChatUser) {
        const isBlocked = blockedUsers.includes(activeChatUser);
        
        userInfoPanel.innerHTML = `
            <div class="p-6">
                <div class="text-center mb-6">
                    <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                        ${activeChatUser.charAt(0).toUpperCase()}
                    </div>
                    <h3 class="text-xl font-semibold text-gray-800">${activeChatUser}</h3>
                    <p class="text-gray-600 text-sm">Galibiyet/Mağlubiyet: 5/2</p>
                </div>
                
                <div class="space-y-3 mb-6">
                    <button onclick="viewProfile('${activeChatUser}')" 
                            class="w-full bg-blue-500 text-white px-4 py-3 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold">
                        👤 Profili Görüntüle
                    </button>
                    
                    ${!isBlocked ? `
                        <button onclick="inviteToGame('${activeChatUser}')" 
                                class="w-full bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition duration-200 font-semibold flex items-center justify-center">
                            🎮 Pong Oynamaya Davet Et
                        </button>
                    ` : ''}
                </div>
                
                <div class="border-t pt-4">
                    <div class="relative">
                        <button onclick="toggleOptionsMenu()" class="flex items-center text-gray-600 hover:text-gray-800 transition duration-200">
                            <span class="text-xl mr-2">⋮</span>
                            Daha Fazla Seçenek
                        </button>
                        
                        <div id="optionsMenu" class="hidden absolute top-full left-0 mt-2 w-full bg-white border rounded-lg shadow-lg z-10">
                            ${!isBlocked ? `
                                <button onclick="blockUser('${activeChatUser}')" 
                                        class="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition duration-200">
                                    🚫 Kullanıcıyı Engelle
                                </button>
                            ` : `
                                <button onclick="unblockUser('${activeChatUser}')" 
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

export function toggleOptionsMenu() {
    const optionsMenu = document.getElementById("optionsMenu");
    if (optionsMenu) {
        optionsMenu.classList.toggle('hidden');
    }
}

export async function searchUsers() {
    const searchInput = document.getElementById("userSearchInput") as HTMLInputElement;
    const searchTerm = searchInput?.value.toLowerCase() || '';
    
    if (searchTerm === '') {
        updateChatsList();
        return;
    }
    
    const existingChatUsers = Object.keys(userChats);
    const onlineUsersList = onlineUsers || [];
    
    if (allUsers.length === 0) {
        await loadFriendsList();
        await loadAllUsers();
    }
    
    const allAvailableUsers = [...new Set([
        ...allUsers, 
        ...existingChatUsers, 
        ...onlineUsersList
    ])];
    
    const currentUser = getCurrentUsername();
    const filteredUsers = allAvailableUsers.filter(user => {
        return user.toLowerCase().includes(searchTerm) && user !== currentUser;
    });
    
    updateSearchResults(filteredUsers);
}

function updateSearchResults(users: string[]) {
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
            const isOnline = onlineUsers.includes(user);
            const statusIcon = isOnline ? '🟢' : '🔴';
            const hasExistingChat = userChats[user];
            const lastMessage = hasExistingChat ? userChats[user][userChats[user].length - 1] : null;
            
            return `
                <div class="flex items-center p-3 hover:bg-gray-50 transition duration-200 cursor-pointer rounded-lg mx-2"
                     onclick="startChatWith('${user}')">
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

function updateChatsList() {
    const chatsList = document.getElementById("chatsList");
    if (chatsList) {
        const chatUsers = Object.keys(userChats).sort((a, b) => {
            const lastMessageA = userChats[a]?.[userChats[a].length - 1]?.timestamp || 0;
            const lastMessageB = userChats[b]?.[userChats[b].length - 1]?.timestamp || 0;
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
            const isActive = activeChatUser === user;
            const isOnline = onlineUsers.includes(user);
            const statusIcon = isOnline ? '🟢' : '🔴';
            const lastMessage = userChats[user]?.[userChats[user].length - 1];
            const unreadCount = unreadCounts[user] || 0;
            
            return `
                <div class="flex items-center p-3 hover:bg-gray-50 transition duration-200 cursor-pointer rounded-lg mx-2 ${isActive ? 'bg-blue-50 border-l-4 border-blue-500' : ''}"
                     onclick="startChatWith('${user}')">
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

function addMessageToActiveChat(sender: string, message: string, type: 'sent' | 'received') {
    if (!activeChatUser) return;
    
    const messageData = {
        sender,
        message,
        type,
        timestamp: new Date(),
        messageType: 'text'
    };
    
    if (!userChats[activeChatUser]) {
        userChats[activeChatUser] = [];
    }
    userChats[activeChatUser].push(messageData);
    
    displayMessage(messageData);
    
    updateChatsList();
}

function addGameInviteToChat(username: string, type: 'sent' | 'received') {
    if (!activeChatUser && type === 'sent') activeChatUser = username;
    if (!activeChatUser) return;
    
    const messageData = {
        sender: type === 'sent' ? 'Siz' : username,
        message: 'Pong davetiyesi',
        type,
        timestamp: new Date(),
        messageType: 'game_invite'
    };
    
    if (!userChats[activeChatUser]) {
        userChats[activeChatUser] = [];
    }
    userChats[activeChatUser].push(messageData);
    
    displayGameInvite(messageData, username);
    
    updateChatsList();
}

function displayMessage(messageData: any) {
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) {
        const messageDiv = document.createElement("div");
        messageDiv.className = `flex ${messageData.type === 'sent' ? 'justify-end' : 'justify-start'} mb-4`;
        
        const bgColor = messageData.type === 'sent' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800';
        const alignment = messageData.type === 'sent' ? 'rounded-bl-xl rounded-tl-xl rounded-tr-xl' : 'rounded-br-xl rounded-tr-xl rounded-tl-xl';
        
        messageDiv.innerHTML = `
            <div class="${bgColor} ${alignment} px-4 py-2 max-w-xs lg:max-w-md shadow-sm">
                <div class="break-words">${messageData.message}</div>
                <div class="text-xs opacity-75 mt-1">${messageData.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</div>
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

function displayGameInvite(messageData: any, username: string) {
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
                            <button onclick="acceptGameInvite('${username}')" 
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

function displayTournamentNotification(message: string) {
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

function loadChatMessages(username: string) {
    const chatMessages = document.getElementById("chatMessages");
    if (chatMessages) {
        chatMessages.innerHTML = '';
        
        if (userChats[username]) {
            userChats[username].forEach(message => {
                if (message.messageType === 'game_invite') {
                    displayGameInvite(message, username);
                } else {
                    displayMessage(message);
                }
            });
        }
    }
}

function addSystemMessage(message: string) {
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

function acceptGameInvite(inviter: string) {
    const socket = GlobalState.getSocket();
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'game_invite_accepted',
            to: inviter,
            from: getCurrentUsername()
        }));
        addSystemMessage(`${inviter} ile oyun başlatılıyor...`);
    }
}

async function sendOfflineMessage(messageData: any) {
    try {
        const createRoomResponse = await fetch(`${FETCH_ADDRESS}/chat/rooms`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: `Chat with ${messageData.to}`,
                participants: [getCurrentUsername(), messageData.to]
            })
        });
        
        if (createRoomResponse.ok) {
            const roomData = await createRoomResponse.json();

            addSystemMessage(`Mesaj ${messageData.to} kullanıcısına gönderildi (room created)`);
        } else {
            addSystemMessage('Mesaj gönderilemedi. Room oluşturulamadı.');
        }
    } catch (error) {
        console.error('Offline message error:', error);
        addSystemMessage('Mesaj gönderme hatası.');
    }
}

async function loadFriendsList() {

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
                if (!allUsers.includes(friend)) {
                    allUsers.push(friend);
                }
            });
        }
    } catch (error) {
        console.error('Error loading friends:', error);
    }
}

async function loadAllUsers() {
    const endpoints = [
        `${FETCH_ADDRESS}/user/friends`,     // Arkadaş listesi
        `${FETCH_ADDRESS}/chat/rooms`,       // Sohbet odaları
        `${FETCH_ADDRESS}/user/profile`      // Profil bilgisi
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
                        allUsers = data.user_friends.map((f: any) => f.username || f.friend_username || f.name || f);
                    } else if (data.friends && Array.isArray(data.friends)) {
                        allUsers = data.friends.map((f: any) => f.username || f.name || f);
                    } else if (Array.isArray(data)) {
                        allUsers = data.map((f: any) => f.username || f.name || f);
                    }
                } else if (endpoint.includes('/rooms')) {
                    if (data.rooms && Array.isArray(data.rooms)) {
                        allUsers = data.rooms.map((r: any) => r.participants || []).flat().filter((u: any) => u !== getCurrentUsername());
                    } else if (Array.isArray(data)) {
                        allUsers = data.map((r: any) => r.participants || []).flat().filter((u: any) => u !== getCurrentUsername());
                    }
                } else if (endpoint.includes('/profile')) {
                    if (data.username) {
                        allUsers = [data.username];
                    }
                } else {
                    continue;
                }
                
                if (allUsers.length > 0) {
                    break;
                }
            }
        } catch (error) {
        }
    }
    

}

async function loadExistingChats() {
    try {
        const response = await fetch(`${FETCH_ADDRESS}/chat/rooms`, {
            credentials: 'include'
        });
        
        if (response.ok) {
            const data = await response.json();
            const rooms = data.rooms || data || [];
            for (const room of rooms) {
                if (room.participants && Array.isArray(room.participants)) {
                    const otherUsers = room.participants.filter((user: string) => user !== getCurrentUsername());
                    
                    for (const otherUser of otherUsers) {
                        if (!userChats[otherUser]) {
                            userChats[otherUser] = [];
                        }
                        
                        try {
                            const historyResponse = await fetch(`${FETCH_ADDRESS}/chat/rooms/${room.id}/history`, {
                                credentials: 'include'
                            });
                            
                            if (historyResponse.ok) {
                                const historyData = await historyResponse.json();
                                const messages = historyData.messages || historyData || [];
                                
                                messages.forEach((msg: any) => {
                                    userChats[otherUser].push({
                                        sender: msg.sender === getCurrentUsername() ? 'Siz' : msg.sender,
                                        message: msg.content || msg.message,
                                        type: msg.sender === getCurrentUsername() ? 'sent' : 'received',
                                        timestamp: new Date(msg.timestamp || msg.createdAt),
                                        messageType: 'text'
                                    });
                                });
                            }
                        } catch (historyError) {
                        }
                        
                        // AllUsers listesine ekle
                        if (!allUsers.includes(otherUser)) {
                            allUsers.push(otherUser);
                        }
                    }
                }
            }
            
        } else {
        }
    } catch (error) {
        console.error('Failed to load existing chats:', error);
    }
    

}

function connectWebSocket() {
    try {
        const socket = new WebSocket(`${WS_ADDRESS}/chat`);
        
        socket.onopen = () => {

            GlobalState.setSocket(socket);
            addSystemMessage('Chat bağlantısı kuruldu');
            
            socket.send(JSON.stringify({ type: 'get_online_users' }));
            socket.send(JSON.stringify({ type: 'get_offline_messages' }));
        };

        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch(data.type) {
                case 'private_message':
                    if (!blockedUsers.includes(data.from)) {
                        if (activeChatUser === data.from) {
                            addMessageToActiveChat(data.from, data.message, 'received');
                        } else {
                            unreadCounts[data.from] = (unreadCounts[data.from] || 0) + 1;
                            if (!userChats[data.from]) {
                                userChats[data.from] = [];
                            }
                            userChats[data.from].push({
                                sender: data.from,
                                message: data.message,
                                type: 'received',
                                timestamp: new Date(),
                                messageType: 'text'
                            });
                            
                            updateChatsList();
                        }
                    }
                    break;
                    
                case 'game_invite':
                    if (activeChatUser === data.from) {
                        addGameInviteToChat(data.from, 'received');
                    }
                    break;
                    
                case 'tournament_notification':
                    displayTournamentNotification(data.message);
                    break;
                    
                case 'online_users':
                    onlineUsers = data.users || [];
                    onlineUsers.forEach(user => {
                        if (!allUsers.includes(user)) {
                            allUsers.push(user);
                        }
                    });

                    updateChatsList();
                    if (activeChatUser) {
                        updateChatHeader();
                    }
                    break;
                    
                case 'user_joined':
                    if (!onlineUsers.includes(data.username)) {
                        onlineUsers.push(data.username);
                        // Yeni kullanıcıyı allUsers listesine de ekle
                        if (!allUsers.includes(data.username)) {
                            allUsers.push(data.username);
                        }
                        updateChatsList();
                        if (activeChatUser === data.username) {
                            updateChatHeader();
                        }
                    }
                    break;
                    
                case 'user_left':
                    onlineUsers = onlineUsers.filter(user => user !== data.username);
                    updateChatsList();
                    if (activeChatUser === data.username) {
                        updateChatHeader();
                    }
                    break;
            }
        };

        socket.onclose = () => {

            addSystemMessage('Bağlantı kesildi');
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            addSystemMessage('Bağlantı hatası');
        };

    } catch (error) {
        console.error('Failed to connect WebSocket:', error);
        addSystemMessage('WebSocket bağlantısı kurulamadı');
    }
}

function getCurrentUsername(): string {
    return window.localStorage.getItem("username") || "Guest";
}

export const CHAT_PAGE: Page = {
    title: "Live Chat",
    data: null,
    render: async () => {
        const app = document.getElementById("app");
        if (app) {
            app.innerHTML = `
                <div class="min-h-screen bg-gray-50">
                    <nav class="bg-white border-b border-gray-200 px-6 py-4">
                        <div class="flex justify-between items-center">
                            <button onclick="GlobalState.setPage(HOME_PAGE)" class="text-2xl font-bold text-blue-600 hover:text-blue-700 transition duration-200">
                                💬 Live Chat
                            </button>
                            <button onclick="GlobalState.setPage(HOME_PAGE)" class="text-gray-600 hover:text-gray-800 transition duration-200">
                                ← Ana Sayfa
                            </button>
                        </div>
                    </nav>

                    <div class="flex h-[calc(100vh-80px)]">
                        
                        <div class="w-80 bg-white border-r border-gray-200 flex flex-col">
                            <div class="p-4 border-b border-gray-200">
                                <div class="relative">
                                    <input type="text" id="userSearchInput" placeholder="Kullanıcı Ara" 
                                           class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200" 
                                           oninput="searchUsers()"
                                           onkeyup="searchUsers()"
                                           onpaste="setTimeout(searchUsers, 100)">
                                    <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
                                </div>
                            </div>
                            
                            <div class="flex-1 overflow-y-auto">
                                <div id="chatsList" class="py-2">
                                    <div class="text-center text-gray-500 py-8">
                                        <p>Henüz sohbet yok</p>
                                        <p class="text-sm">Yukarıdaki arama ile kullanıcı bulun</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex-1 flex flex-col">
                            <div id="chatHeader" class="bg-white border-b border-gray-200 p-4">
                                <div class="text-center text-gray-500">
                                    <p>Bir sohbet seçin</p>
                                </div>
                            </div>
                            
                            <div id="chatMessages" class="flex-1 overflow-y-auto p-4 bg-gray-50">
                                <div class="text-center text-gray-500 py-16">
                                    <div class="text-6xl mb-4">💬</div>
                                    <p class="text-lg">Mesajlaşmaya başlamak için bir kullanıcı seçin</p>
                                </div>
                            </div>
                            
                            <div class="bg-white border-t border-gray-200 p-4">
                                <form id="messageForm" method="post" class="flex gap-3" onsubmit="sendChatMessage(event)">
                                    <input type="text" id="messageInput" placeholder="Mesajını yaz..." 
                                           class="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                                           disabled>
                                    <button type="submit" id="sendButton" 
                                            class="bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition duration-200 font-semibold disabled:opacity-50"
                                            disabled>
                                        Gönder
                                    </button>
                                </form>
                            </div>
                        </div>
                        
                        <div id="userInfoPanel" class="w-80 bg-white border-l border-gray-200 hidden">
                            <div class="text-center text-gray-500 py-16">
                                <p>Kullanıcı bilgisi burada görünecek</p>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }
    },
    onPreLoad: async () => {

    },
    onLoad: async () => {

        
        try {
            const response = await fetch(`${FETCH_ADDRESS}/user/friends/block`, {
                credentials: 'include'
            });
            if (response.ok) {
                const data = await response.json();
                blockedUsers = data.blockedUsers || data || [];
            }
        } catch (error) {
            console.error('Failed to load blocked users:', error);
        }
        
        await loadFriendsList();
        await loadAllUsers();
        await loadExistingChats();
        
        connectWebSocket();
        updateChatsList();
        

        const messageInput = document.getElementById("messageInput");
        if (messageInput) {
            messageInput.addEventListener("keypress", (e) => {
                if (e.key === "Enter") {
                    e.preventDefault();
                    sendChatMessage(e);
                }
            });
        }
    },
    onUnload: async () => {

        const socket = GlobalState.getSocket();
        if (socket) {
            socket.close();
            GlobalState.setSocket(null);
        }
    }
};

(window as any).sendChatMessage = sendChatMessage;
(window as any).inviteToGame = inviteToGame;
(window as any).blockUser = blockUser;
(window as any).unblockUser = unblockUser;
(window as any).startChatWith = startChatWith;
(window as any).viewProfile = viewProfile;
(window as any).acceptGameInvite = acceptGameInvite;
(window as any).searchUsers = searchUsers;
(window as any).toggleUserInfoPanel = toggleUserInfoPanel;
(window as any).toggleOptionsMenu = toggleOptionsMenu;