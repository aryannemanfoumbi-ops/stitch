import {
  getFirestore, collection, query, where,
  getDocs, addDoc, orderBy, onSnapshot, serverTimestamp, getDoc, doc
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

async function getOrCreateConversation(clientId, stylistId) {
    const app = window.firebaseApp || getApps()[0];
    const db = getFirestore(app);
    
    const userAId = clientId;
    const userBId = stylistId;
    
    // 1 & 2. Read user documents to get roles
    const user1Doc = await getDoc(doc(db, 'users', userAId));
    const user2Doc = await getDoc(doc(db, 'users', userBId));

    // 3. Read the field: role and normalize
    const role1 = user1Doc.exists() ? user1Doc.data().role?.toLowerCase() : null;
    const role2 = user2Doc.exists() ? user2Doc.data().role?.toLowerCase() : null;

    // 4. Validate roles BEFORE creating any conversation
    if (!role1 || !role2 || role1 === role2) {
        throw new Error("Conversation allowed only between Client and Stylist");
    }

    // Determine automatically which user is the Client and which is the Stylist
    const clientUid = role1 === 'client' ? userAId : userBId;
    const stylistUid = role1 === 'stylist' ? userAId : userBId;

    const convRef = collection(db, 'conversations');
    
    // 5. Search an existing conversation using participants
    const q = query(convRef, where('participants', 'array-contains', userAId));
    const snapshot = await getDocs(q);
    
    let existingDocId = null;
    snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data.participants && data.participants.includes(userBId)) {
            existingDocId = docSnap.id;
        }
    });

    if (existingDocId) {
        return existingDocId;
    }

    // 6. If not found, create exactly ONE conversation
    const newDoc = await addDoc(convRef, {
        participants: [clientUid, stylistUid],
        clientId: clientUid,
        stylistId: stylistUid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastMessage: ""
    });

    return newDoc.id;
}

window.openChatWithStylist = async function(stylist) {
    const auth = getAuth();
    if (!auth.currentUser) return;
    
    try {
        const conversationId = await getOrCreateConversation(auth.currentUser.uid, stylist.uid);
        window.currentConversationId = conversationId;
        document.getElementById('chat-stylist-name').textContent = stylist.nom;
        navigate('chat_window');
    } catch (err) {
        console.error("Failed to open chat", err);
    }
};

let unsubscribeMessages = null;

async function sendMessage() {
    const chatInput = document.getElementById('chatInput');
    const text = chatInput.value.trim();
    if (!text || !window.currentConversationId) return;

    try {
        const auth = getAuth();
        const app = window.firebaseApp || getApps()[0];
        const db = getFirestore(app);
        
        await addDoc(
            collection(db, 'conversations', window.currentConversationId, 'messages'),
            { text, senderId: auth.currentUser.uid, createdAt: serverTimestamp() }
        );
        chatInput.value = '';
    } catch (err) {
        console.error(err.code, err.message);
    }
}

window.initChatWindow = function() {
    const auth = getAuth();
    if (!auth.currentUser) return;

    const conversationId = window.currentConversationId;
    const msgContainer = document.getElementById('chat-messages');
    const inputField = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const backBtn = document.getElementById('chat-back-btn');

    if (!conversationId) {
        if (inputField) inputField.disabled = true;
        if (sendBtn) sendBtn.disabled = true;
        if (msgContainer) msgContainer.innerHTML = 'No active conversation';
        return;
    }

    if (unsubscribeMessages) {
        unsubscribeMessages();
        unsubscribeMessages = null;
    }

    if (inputField) inputField.disabled = false;
    if (sendBtn) sendBtn.disabled = false;

    if (sendBtn) {
        sendBtn.onclick = sendMessage;
    }
    
    if (inputField) {
        inputField.onkeydown = (e) => {
            if (e.key === 'Enter') sendMessage();
        };
    }

    if (backBtn) {
        backBtn.onclick = () => {
            if (typeof navigate !== 'function') return;
            const lastScreen = localStorage.getItem('lastScreen');
            const safe = [
                'glamathome_home_screen',
                'discover_styles_stylists',
                'saved_styles_stylists',
                'my_appointments'
            ];
            
            if (lastScreen && safe.includes(lastScreen)) {
                navigate(lastScreen);
            } else {
                navigate('glamathome_home_screen');
            }
        };
    }

    const app = window.firebaseApp || getApps()[0];
    const db = getFirestore(app);
    const messagesRef = collection(db, 'conversations', conversationId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    unsubscribeMessages = onSnapshot(q, (snapshot) => {
        if (!msgContainer) return;
        msgContainer.innerHTML = '';

        if (snapshot.empty) {
            msgContainer.innerHTML = '<p class="empty-chat">No messages yet</p>';
        } else {
            snapshot.forEach(doc => {
                const data = doc.data();
                const div = document.createElement('div');
                div.className = (data.senderId === auth.currentUser.uid) ? 'msg-out' : 'msg-in';
                div.textContent = data.text;
                msgContainer.appendChild(div);
            });
        }
        msgContainer.scrollTop = msgContainer.scrollHeight;
    }, (err) => {
        console.error(err.code, err.message);
    });
};

window.unsubscribeInbox = null;

window.loadInbox = function() {
    const auth = getAuth();
    if (!auth.currentUser) return;
    
    const container = document.getElementById('chats-list-container');
    const emptyState = document.getElementById('chats-empty-state');
    if (!container) return;

    if (window.unsubscribeInbox) {
        window.unsubscribeInbox();
        window.unsubscribeInbox = null;
    }

    const app = window.firebaseApp || getApps()[0];
    const db = getFirestore(app);
    const convRef = collection(db, 'conversations');
    
    // 1 & 3: Query using array-contains and sort by updatedAt desc
    const q = query(convRef, where('participants', 'array-contains', auth.currentUser.uid), orderBy('updatedAt', 'desc'));

    window.unsubscribeInbox = onSnapshot(q, async (snapshot) => {
        if (snapshot.empty) {
            container.innerHTML = '';
            if (emptyState) emptyState.style.display = 'flex';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        container.innerHTML = '';

        // 2. Display every conversation involving that user
        for (const docSnap of snapshot.docs) {
            const data = docSnap.data();
            const otherUid = data.participants.find(uid => uid !== auth.currentUser.uid);
            
            let otherName = 'User';
            if (otherUid) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', otherUid));
                    if (userDoc.exists() && userDoc.data().nom) {
                        otherName = userDoc.data().nom;
                    }
                } catch (e) {
                    console.error("Failed to fetch other user name", e);
                }
            }

            const div = document.createElement('div');
            div.className = 'p-4 bg-surface-container-lowest rounded-xl shadow-sm border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors';
            div.innerHTML = `
                <div class="flex justify-between items-center mb-1">
                    <h3 class="font-bold text-on-surface">${otherName}</h3>
                </div>
                <p class="text-sm text-on-surface-variant truncate">${data.lastMessage || 'Start the conversation'}</p>
            `;
            
            // 4. When a conversation is selected: reuse initChatWindow, sendMessage etc.
            div.onclick = () => {
                window.currentConversationId = docSnap.id;
                const headerName = document.getElementById('chat-stylist-name');
                if (headerName) headerName.textContent = otherName;
                if (typeof window.navigate === 'function') navigate('chat_window');
            };
            container.appendChild(div);
        }
    }, (err) => {
        console.error("Inbox listener error:", err.code, err.message);
    });
};
