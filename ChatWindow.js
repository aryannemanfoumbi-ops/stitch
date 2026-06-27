import {
  getFirestore, collection, query, where,
  getDocs, addDoc, orderBy, onSnapshot, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getApps } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

async function getOrCreateConversation(clientId, stylistId) {
    try {
        const app = window.firebaseApp || getApps()[0];
        const db = getFirestore(app);
        const convRef = collection(db, 'conversations');
        const q = query(convRef, where('participants', 'array-contains', clientId));
        const snapshot = await getDocs(q);
        
        let existingDocId = null;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.participants && data.participants.includes(stylistId)) {
                existingDocId = doc.id;
            }
        });

        if (existingDocId) {
            return existingDocId;
        }

        const newDoc = await addDoc(convRef, {
            participants: [clientId, stylistId],
            clientId: clientId,
            stylistId: stylistId,
            createdAt: serverTimestamp()
        });

        return newDoc.id;
    } catch (err) {
        console.error(err.code, err.message);
        throw err;
    }
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
            if (typeof navigate === 'function') navigate('screen-home');
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
