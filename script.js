const groupBinId = '68ca41fbae596e708ff1636e
';
const userBinId = '68ca4258ae596e708ff163e3
';

// UI-Elemente
const statusDiv = document.getElementById('status');
const userIdInput = document.getElementById('userIdInput');
const saveIdBtn = document.getElementById('saveIdBtn');
const createGroupBtn = document.getElementById('createGroupBtn');
const savedGroupsDiv = document.getElementById('savedGroups');
const createGroupForm = document.getElementById('createGroupForm');
const newGroupNameInput = document.getElementById('newGroupNameInput');
const memberIdsInput = document.getElementById('memberIdsInput');
const submitGroupBtn = document.getElementById('submitGroupBtn');
const cancelCreateBtn = document.getElementById('cancelCreateBtn');
const chatWindow = document.getElementById('chatWindow');
const currentGroupName = document.getElementById('currentGroupName');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');

let currentUserId = localStorage.getItem('userId');
let currentGroupId = null;
let messagePollingInterval = null;

// Funktion zum Anzeigen von Nachrichten
function displayMessages(messages) {
    messagesDiv.innerHTML = '';
    messages.forEach(msg => {
        const messageElement = document.createElement('p');
        messageElement.textContent = `${msg.sender}: ${msg.text}`;
        messagesDiv.appendChild(messageElement);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

// Funktion zum Abrufen von Nachrichten aus dem Bin
function fetchMessages() {
    if (!currentGroupId) return;
    fetch(`https://api.jsonbin.io/v3/b/${groupBinId}`)
        .then(response => response.json())
        .then(data => {
            const group = data.record.groups.find(g => g.id === currentGroupId);
            if (group) {
                displayMessages(group.messages || []);
            }
        })
        .catch(error => console.error('Fehler beim Laden der Nachrichten:', error));
}

// Funktion zum Abrufen und Anzeigen aller Gruppen
function fetchAndDisplayGroups() {
    createGroupForm.style.display = 'none';
    savedGroupsDiv.style.display = 'block';
    chatWindow.style.display = 'none';
    
    fetch(`https://api.jsonbin.io/v3/b/${groupBinId}`)
        .then(response => response.json())
        .then(data => {
            const groups = data.record.groups || [];
            savedGroupsDiv.innerHTML = '';
            groups.forEach(group => {
                const groupElement = document.createElement('div');
                groupElement.className = 'group-item';
                groupElement.textContent = group.name;
                groupElement.onclick = () => {
                    // Beim Klicken eine Gruppe betreten
                    currentGroupId = group.id;
                    currentGroupName.textContent = group.name;
                    chatWindow.style.display = 'block';
                    savedGroupsDiv.style.display = 'none';
                    if (messagePollingInterval) clearInterval(messagePollingInterval);
                    messagePollingInterval = setInterval(fetchMessages, 2000);
                    fetchMessages();
                };
                savedGroupsDiv.appendChild(groupElement);
            });
        });
}

// Event-Listener
saveIdBtn.onclick = () => {
    const userId = userIdInput.value.trim();
    if (!userId) {
        statusDiv.textContent = 'Bitte eine ID eingeben.';
        return;
    }
    localStorage.setItem('userId', userId);
    currentUserId = userId;
    statusDiv.textContent = `ID ${userId} erfolgreich gespeichert.`;
};

createGroupBtn.onclick = () => {
    createGroupForm.style.display = 'block';
    savedGroupsDiv.style.display = 'none';
};

cancelCreateBtn.onclick = () => {
    createGroupForm.style.display = 'none';
    savedGroupsDiv.style.display = 'block';
};

// Gruppe erstellen
submitGroupBtn.onclick = () => {
    const groupName = newGroupNameInput.value.trim();
    const memberIds = memberIdsInput.value.split(',').map(id => id.trim()).filter(id => id);
    
    // Füge die eigene ID zur Liste hinzu
    if(currentUserId && !memberIds.includes(currentUserId)) {
        memberIds.unshift(currentUserId);
    }

    if (!groupName) {
        statusDiv.textContent = 'Bitte einen Gruppennamen eingeben.';
        return;
    }
    
    // Generiere eine einzigartige ID für die neue Gruppe
    const newGroupId = `group-${Date.now()}`;
    const newGroup = {
        id: newGroupId,
        name: groupName,
        members: memberIds,
        messages: []
    };

    fetch(`https://api.jsonbin.io/v3/b/${groupBinId}`)
        .then(response => response.json())
        .then(data => {
            const groups = data.record.groups || [];
            groups.push(newGroup);

            fetch(`https://api.jsonbin.io/v3/b/${groupBinId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ groups: groups })
            })
            .then(() => {
                statusDiv.textContent = `Gruppe "${groupName}" erfolgreich erstellt.`;
                createGroupForm.style.display = 'none';
                fetchAndDisplayGroups();
            });
        });
};

// Nachricht senden
sendBtn.onclick = () => {
    const messageText = messageInput.value.trim();
    if (!messageText) return;

    fetch(`https://api.jsonbin.io/v3/b/${groupBinId}`)
        .then(response => response.json())
        .then(data => {
            let groups = data.record.groups || [];
            let group = groups.find(g => g.id === currentGroupId);

            if (group) {
                group.messages.push({
                    sender: currentUserId,
                    text: messageText,
                    timestamp: new Date().toISOString()
                });

                fetch(`https://api.jsonbin.io/v3/b/${groupBinId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ groups: groups })
                }).then(() => {
                    messageInput.value = '';
                    fetchMessages();
                });
            }
        });
};

// Beim Laden der Seite
if (currentUserId) {
    userIdInput.value = currentUserId;
    statusDiv.textContent = `Willkommen zurück, ${currentUserId}!`;
}

// Initialer Aufruf
fetchAndDisplayGroups();
