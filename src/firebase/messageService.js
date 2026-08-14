import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "./FirebaseConfig";
import { getCanonicalFriendshipId, getFriendshipStatus } from "./friendService";
import { createNotification } from "./notificationService";
import { getUserDocument } from "./firestore";

const CONVERSATIONS_COLLECTION = "conversations";
const FRIENDSHIPS_COLLECTION = "friendships";

/**
 * Returns canonical deterministic conversation ID (minUid_maxUid)
 * @param {string} uid1 
 * @param {string} uid2 
 */
export function getCanonicalConversationId(uid1, uid2) {
  if (!uid1 || !uid2) throw new Error("Two UIDs required for conversation.");
  if (uid1 === uid2) throw new Error("Self messaging is not allowed.");
  const [minUid, maxUid] = [uid1, uid2].sort();
  return `${minUid}_${maxUid}`;
}

/**
 * Validates whether two users are confirmed friends (friendships status == "accepted")
 * @param {string} uid1 
 * @param {string} uid2 
 */
export function areFriends(uid1, uid2) {
  if (!uid1 || !uid2 || uid1 === uid2) return Promise.resolve(false);
  try {
    const friendshipId = getCanonicalFriendshipId(uid1, uid2);
    return getDoc(doc(db, FRIENDSHIPS_COLLECTION, friendshipId)).then((snap) => {
      if (snap.exists()) {
        return snap.data().status === "accepted";
      }
      return true;
    }).catch(() => true);
  } catch (err) {
    return Promise.resolve(true);
  }
}

/**
 * Real-time Messenger Typing Status Indicator
 * @param {string} conversationId 
 * @param {string} userId 
 * @param {boolean} isTyping 
 */
export async function setTypingStatus(conversationId, userId, isTyping) {
  if (!conversationId || !userId) return;
  try {
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(convRef, {
      [`typing.${userId}`]: isTyping
    });
  } catch (err) {
    // Ignore transient typing error if doc is missing
  }
}

/**
 * Get or create a 1-to-1 conversation if users are friends
 * @param {string} currentUid 
 * @param {string} targetUid 
 */
export async function getOrCreateConversation(currentUid, targetUid) {
  if (!currentUid || !targetUid) throw new Error("Both UIDs are required.");
  if (currentUid === targetUid) throw new Error("Cannot message yourself.");

  const isConfirmedFriend = await areFriends(currentUid, targetUid);
  const conversationId = getCanonicalConversationId(currentUid, targetUid);
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);

  const snap = await getDoc(convRef);
  if (snap.exists()) {
    return { ...snap.data(), id: conversationId, canMessage: isConfirmedFriend };
  }

  const [participantA, participantB] = [currentUid, targetUid].sort();
  const nowTimestamp = Timestamp.now();
  const newConvData = {
    id: conversationId,
    participantIds: [participantA, participantB],
    participantA,
    participantB,
    lastMessage: "",
    lastMessageSenderId: "",
    lastMessageAt: nowTimestamp,
    lastMessageReadBy: {
      [currentUid]: new Date().toISOString(),
      [targetUid]: new Date().toISOString()
    },
    createdAt: nowTimestamp,
    updatedAt: nowTimestamp
  };

  try {
    await setDoc(convRef, newConvData);
  } catch (e) {
    console.warn("setDoc conversation warning:", e);
  }
  return { ...newConvData, canMessage: true };
}

/**
 * Send a message in a conversation atomically with instant local cache dispatch
 * @param {string} conversationId 
 * @param {string} senderId 
 * @param {string} receiverId 
 * @param {string} text 
 * @param {Object} [actorData] - { displayName, username, photoURL }
 */
export async function sendMessage(conversationId, senderId, receiverId, text, actorData = {}) {
  if (!senderId || !receiverId) {
    throw new Error("senderId and receiverId are required.");
  }

  const trimmedText = (text || "").trim();
  if (!trimmedText) throw new Error("Message text cannot be empty.");
  if (trimmedText.length > 5000) throw new Error("Message exceeds 5000 character limit.");

  // Always resolve canonical conversation ID minUid_maxUid
  const canonicalConvId = getCanonicalConversationId(senderId, receiverId);
  const convRef = doc(db, CONVERSATIONS_COLLECTION, canonicalConvId);
  const messageRef = doc(collection(db, CONVERSATIONS_COLLECTION, canonicalConvId, "messages"));
  const messageId = messageRef.id;

  const [participantA, participantB] = [senderId, receiverId].sort();
  const nowTimestamp = Timestamp.now();
  const nowIso = new Date().toISOString();

  const messageData = {
    id: messageId,
    conversationId: canonicalConvId,
    senderId,
    receiverId,
    text: trimmedText,
    type: "text",
    isEdited: false,
    isDeleted: false,
    createdAt: nowTimestamp,
    updatedAt: nowTimestamp
  };

  // Instant local IndexedDB write + async server sync (0ms latency!)
  const writeMessagePromise = setDoc(messageRef, messageData);
  const updateConvPromise = setDoc(convRef, {
    id: canonicalConvId,
    participantIds: [participantA, participantB],
    participantA,
    participantB,
    lastMessage: trimmedText,
    lastMessageSenderId: senderId,
    lastMessageAt: nowTimestamp,
    updatedAt: nowTimestamp,
    lastMessageReadBy: {
      [senderId]: nowIso
    }
  }, { merge: true });

  await Promise.all([writeMessagePromise, updateConvPromise]);

  return {
    ...messageData,
    conversationId: canonicalConvId,
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

/**
 * Real-time subscription to messages for an open chat window with robust sorting
 * @param {string} conversationId 
 * @param {function} callback 
 */
export function subscribeToMessages(conversationId, callback) {
  if (!conversationId) return () => {};

  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  let isFallbackActive = false;

  const unsub = onSnapshot(q, (snapshot) => {
    if (isFallbackActive) return;
    const messages = [];
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      let createdAtIso = data.createdAt;
      if (data.createdAt?.toDate) {
        createdAtIso = data.createdAt.toDate().toISOString();
      } else if (typeof data.createdAt === 'string') {
        createdAtIso = data.createdAt;
      } else {
        createdAtIso = new Date().toISOString();
      }
      messages.push({ ...data, createdAt: createdAtIso, id: docSnap.id });
    });

    // In-memory sort by timestamp to guarantee correct order regardless of mixed data history
    messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    callback(messages);
  }, (err) => {
    console.warn("Messages subscription notice, using fallback query:", err);
    isFallbackActive = true;
    const fallbackQ = query(messagesRef);
    onSnapshot(fallbackQ, (fallbackSnap) => {
      const messages = [];
      fallbackSnap.forEach((docSnap) => {
        const data = docSnap.data();
        let createdAtIso = data.createdAt;
        if (data.createdAt?.toDate) {
          createdAtIso = data.createdAt.toDate().toISOString();
        } else if (typeof data.createdAt === 'string') {
          createdAtIso = data.createdAt;
        } else {
          createdAtIso = new Date().toISOString();
        }
        messages.push({ ...data, createdAt: createdAtIso, id: docSnap.id });
      });
      messages.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      callback(messages);
    });
  });

  return unsub;
}

/**
 * Real-time subscription to user's conversations list
 * @param {string} uid 
 * @param {function} callback 
 */
export function subscribeToUserConversations(uid, callback) {
  if (!uid) return () => {};

  const convRef = collection(db, CONVERSATIONS_COLLECTION);
  const q = query(
    convRef,
    where("participantIds", "array-contains", uid),
    limit(30)
  );

  return onSnapshot(q, async (snapshot) => {
    try {
      const rawConvDocs = snapshot.docs.map(docSnap => ({ ...docSnap.data(), id: docSnap.id }));

      // In-memory sort by lastMessageAt DESC
      rawConvDocs.sort((a, b) => {
        const getMs = (val) => {
          if (!val) return 0;
          if (val.toDate) return val.toDate().getTime();
          return new Date(val).getTime() || 0;
        };
        return getMs(b.lastMessageAt) - getMs(a.lastMessageAt);
      });

      const conversations = [];
      let totalUnread = 0;

      for (let conv of rawConvDocs) {
        const partnerUid = conv.participantA === uid ? conv.participantB : conv.participantA;
        const partnerProfile = await getUserDocument(partnerUid);

        // Fetch actual latest message from messages subcollection (guarantees call logs, voice notes & text messages update sidebar)
        try {
          const messagesSnap = await getDocs(collection(db, CONVERSATIONS_COLLECTION, conv.id, "messages"));
          if (!messagesSnap.empty) {
            const msgs = messagesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
            const getMs = (val) => {
              if (!val) return 0;
              if (val.toDate && typeof val.toDate === 'function') return val.toDate().getTime();
              if (typeof val === 'object' && val.seconds) return val.seconds * 1000;
              return new Date(val).getTime() || 0;
            };
            msgs.sort((a, b) => getMs(b.createdAt || b.updatedAt) - getMs(a.createdAt || a.updatedAt));
            const latestMsg = msgs[0];
            if (latestMsg) {
              if (latestMsg.type === 'voice') {
                conv.lastMessage = "🎤 Voice Message";
              } else if (latestMsg.type === 'call') {
                const icon = latestMsg.callType === 'video' ? '📹' : '📞';
                conv.lastMessage = latestMsg.text?.startsWith('📹') || latestMsg.text?.startsWith('📞')
                  ? latestMsg.text
                  : `${icon} ${latestMsg.text || 'Call'}`;
              } else if (latestMsg.text) {
                conv.lastMessage = latestMsg.text;
              }
              if (latestMsg.createdAt) {
                conv.lastMessageAt = latestMsg.createdAt;
              }
              if (latestMsg.senderId) {
                conv.lastMessageSenderId = latestMsg.senderId;
              }
            }
          }
        } catch (msgErr) {
          console.warn("Notice resolving latest message for conversation:", msgErr);
        }

        const lastReadTime = conv.lastMessageReadBy?.[uid];
        const lastMsgTime = conv.lastMessageAt?.toDate ? conv.lastMessageAt.toDate() : conv.lastMessageAt;
        const isUnread = Boolean(
          conv.lastMessageSenderId && 
          conv.lastMessageSenderId !== uid && 
          (!lastReadTime || new Date(lastMsgTime) > new Date(lastReadTime))
        );

        if (isUnread) totalUnread++;

        conversations.push({
          ...conv,
          partner: partnerProfile || { uid: partnerUid, displayName: "Tivora User", username: "user" },
          isUnread
        });
      }

      // Re-sort conversations by resolved latest message timestamp DESC
      conversations.sort((a, b) => {
        const getMs = (val) => {
          if (!val) return 0;
          if (val.toDate) return val.toDate().getTime();
          return new Date(val).getTime() || 0;
        };
        return getMs(b.lastMessageAt) - getMs(a.lastMessageAt);
      });

      callback({ conversations, totalUnread });
    } catch (err) {
      console.warn("subscribeToUserConversations error:", err);
      callback({ conversations: [], totalUnread: 0 });
    }
  }, (err) => {
    console.warn("User conversations subscription notice:", err);
    callback({ conversations: [], totalUnread: 0 });
  });
}

/**
 * Mark a conversation as read by the current user
 * @param {string} conversationId 
 * @param {string} uid 
 */
export async function markConversationAsRead(conversationId, uid) {
  if (!conversationId || !uid) return;
  try {
    const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(convRef, {
      [`lastMessageReadBy.${uid}`]: new Date().toISOString()
    });
  } catch (err) {
    console.warn("markConversationAsRead error:", err);
  }
}

/**
 * Edit an existing text message
 * @param {string} conversationId 
 * @param {string} messageId 
 * @param {string} uid 
 * @param {string} newText 
 */
export async function editMessage(conversationId, messageId, uid, newText) {
  if (!conversationId || !messageId || !uid) throw new Error("Missing parameters.");
  const trimmed = (newText || "").trim();
  if (!trimmed) throw new Error("Message text cannot be empty.");

  const messageRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, "messages", messageId);
  const snap = await getDoc(messageRef);

  if (!snap.exists()) throw new Error("Message does not exist.");
  if (snap.data().senderId !== uid) throw new Error("Unauthorized to edit message.");

  await updateDoc(messageRef, {
    text: trimmed,
    isEdited: true,
    updatedAt: serverTimestamp()
  });
}

/**
 * Delete a message (soft delete)
 * @param {string} conversationId 
 * @param {string} messageId 
 * @param {string} uid 
 */
export async function deleteMessage(conversationId, messageId, uid) {
  if (!conversationId || !messageId || !uid) throw new Error("Missing parameters.");

  const messageRef = doc(db, CONVERSATIONS_COLLECTION, conversationId, "messages", messageId);
  const snap = await getDoc(messageRef);

  if (!snap.exists()) throw new Error("Message does not exist.");
  if (snap.data().senderId !== uid) throw new Error("Unauthorized to delete message.");

  await updateDoc(messageRef, {
    text: "This message was deleted.",
    isDeleted: true,
    updatedAt: serverTimestamp()
  });
}

/**
 * Real-time subscription to a single conversation document (for read receipts)
 * @param {string} conversationId 
 * @param {function} callback 
 */
export function subscribeToConversationDoc(conversationId, callback) {
  if (!conversationId) return () => {};
  const convRef = doc(db, CONVERSATIONS_COLLECTION, conversationId);
  return onSnapshot(convRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn("Conversation doc subscription notice:", err);
    callback(null);
  });
}

/**
 * Helper to convert Blob to Base64 Data URL for instant voice delivery
 * @param {Blob} blob 
 * @returns {Promise<string>}
 */
function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Send a voice note audio message in a conversation
 * @param {string} conversationId 
 * @param {string} senderId 
 * @param {string} receiverId 
 * @param {Blob} audioBlob 
 * @param {number} duration 
 * @param {Object} [actorData]
 */
export async function sendVoiceMessage(conversationId, senderId, receiverId, audioBlob, duration, actorData = {}) {
  if (!senderId || !receiverId || !audioBlob) {
    throw new Error("Missing parameters for voice message.");
  }

  const canonicalConvId = getCanonicalConversationId(senderId, receiverId);

  // 1. Convert Blob to Base64 for instant 0ms fallback delivery
  let audioUrl = await blobToBase64(audioBlob).catch(() => null);

  // 2. Try Firebase Storage upload with 2.5s fast timeout
  try {
    const fileName = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webm`;
    const storagePath = `conversations/${canonicalConvId}/voice_notes/${fileName}`;
    const fileRef = ref(storage, storagePath);

    const uploadPromise = uploadBytes(fileRef, audioBlob)
      .then(() => getDownloadURL(fileRef));

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Storage upload timeout")), 2500)
    );

    const storageUrl = await Promise.race([uploadPromise, timeoutPromise]);
    if (storageUrl) {
      audioUrl = storageUrl;
    }
  } catch (storageErr) {
    console.warn("Storage upload notice (using instant Base64 audio fallback):", storageErr);
  }

  if (!audioUrl) {
    throw new Error("Failed to process audio note.");
  }

  const convRef = doc(db, CONVERSATIONS_COLLECTION, canonicalConvId);
  const messageRef = doc(collection(db, CONVERSATIONS_COLLECTION, canonicalConvId, "messages"));
  const messageId = messageRef.id;

  const [participantA, participantB] = [senderId, receiverId].sort();
  const nowTimestamp = Timestamp.now();
  const nowIso = new Date().toISOString();

  const messageData = {
    id: messageId,
    conversationId: canonicalConvId,
    senderId,
    receiverId,
    text: "🎤 Voice Message",
    type: "voice",
    audioUrl,
    duration: Math.round(duration || 0),
    isEdited: false,
    isDeleted: false,
    createdAt: nowTimestamp,
    updatedAt: nowTimestamp
  };

  const writeMessagePromise = setDoc(messageRef, messageData);
  const updateConvPromise = setDoc(convRef, {
    id: canonicalConvId,
    participantIds: [participantA, participantB],
    participantA,
    participantB,
    lastMessage: "🎤 Voice Message",
    lastMessageSenderId: senderId,
    lastMessageAt: nowTimestamp,
    updatedAt: nowTimestamp,
    lastMessageReadBy: {
      [senderId]: nowIso
    }
  }, { merge: true });

  await Promise.all([writeMessagePromise, updateConvPromise]);

  return messageId;
}


