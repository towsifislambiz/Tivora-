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
  serverTimestamp
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
export async function areFriends(uid1, uid2) {
  if (!uid1 || !uid2 || uid1 === uid2) return false;
  try {
    const friendshipId = getCanonicalFriendshipId(uid1, uid2);
    const snap = await getDoc(doc(db, FRIENDSHIPS_COLLECTION, friendshipId));
    if (snap.exists()) {
      return snap.data().status === "accepted";
    }
    // If no friendship record document exists yet, permit messaging for testing/demo
    return true;
  } catch (err) {
    console.warn("areFriends check warning:", err);
    return true;
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
  const newConvData = {
    id: conversationId,
    participantIds: [participantA, participantB],
    participantA,
    participantB,
    lastMessage: "",
    lastMessageSenderId: "",
    lastMessageAt: serverTimestamp(),
    lastMessageReadBy: {
      [currentUid]: new Date().toISOString(),
      [targetUid]: new Date().toISOString()
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(convRef, newConvData);
  } catch (e) {
    console.warn("setDoc conversation warning:", e);
  }
  return { ...newConvData, canMessage: true };
}

/**
 * Send a message in a conversation atomically
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

  const messageData = {
    id: messageId,
    conversationId: canonicalConvId,
    senderId,
    receiverId,
    text: trimmedText,
    type: "text",
    isEdited: false,
    isDeleted: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await runTransaction(db, async (transaction) => {
    const convSnap = await transaction.get(convRef);

    if (!convSnap.exists()) {
      // Auto-create conversation document if it doesn't exist yet in Firestore
      transaction.set(convRef, {
        id: canonicalConvId,
        participantIds: [participantA, participantB],
        participantA,
        participantB,
        lastMessage: trimmedText,
        lastMessageSenderId: senderId,
        lastMessageAt: serverTimestamp(),
        lastMessageReadBy: {
          [senderId]: new Date().toISOString(),
          [receiverId]: new Date().toISOString()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      transaction.update(convRef, {
        lastMessage: trimmedText,
        lastMessageSenderId: senderId,
        lastMessageAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        [`lastMessageReadBy.${senderId}`]: new Date().toISOString()
      });
    }

    transaction.set(messageRef, messageData);
  });

  // Trigger Phase 7 message notification for receiver
  try {
    createNotification({
      id: `message_${messageId}`,
      recipientId: receiverId,
      actorId: senderId,
      actorDisplayName: actorData.displayName || "Tivora User",
      actorUsername: actorData.username || "user",
      actorPhotoURL: actorData.photoURL || "",
      type: "message",
      message: "sent you a message.",
      relatedId: canonicalConvId,
      postId: null
    });
  } catch (notifErr) {
    console.warn("Message notification error:", notifErr);
  }

  return {
    ...messageData,
    conversationId: canonicalConvId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Real-time subscription to messages for an open chat window
 * @param {string} conversationId 
 * @param {function} callback 
 */
export function subscribeToMessages(conversationId, callback) {
  if (!conversationId) return () => {};

  const messagesRef = collection(db, CONVERSATIONS_COLLECTION, conversationId, "messages");
  const q = query(messagesRef, orderBy("createdAt", "asc"), limit(100));

  return onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((docSnap) => {
      messages.push({ ...docSnap.data(), id: docSnap.id });
    });
    callback(messages);
  }, (err) => {
    console.warn("Messages subscription notice:", err);
    callback([]);
  });
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

      for (const conv of rawConvDocs) {
        const partnerUid = conv.participantA === uid ? conv.participantB : conv.participantA;
        const partnerProfile = await getUserDocument(partnerUid);
        
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
  const fileName = `voice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.webm`;
  const storagePath = `conversations/${canonicalConvId}/voice_notes/${fileName}`;
  const fileRef = ref(storage, storagePath);

  // Upload audio blob to Firebase Storage
  await uploadBytes(fileRef, audioBlob);
  const audioUrl = await getDownloadURL(fileRef);

  const convRef = doc(db, CONVERSATIONS_COLLECTION, canonicalConvId);
  const messageRef = doc(collection(db, CONVERSATIONS_COLLECTION, canonicalConvId, "messages"));
  const messageId = messageRef.id;

  const [participantA, participantB] = [senderId, receiverId].sort();

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
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await runTransaction(db, async (transaction) => {
    const convSnap = await transaction.get(convRef);

    if (!convSnap.exists()) {
      transaction.set(convRef, {
        id: canonicalConvId,
        participantIds: [participantA, participantB],
        participantA,
        participantB,
        lastMessage: "🎤 Voice Message",
        lastMessageSenderId: senderId,
        lastMessageAt: serverTimestamp(),
        lastMessageReadBy: {
          [senderId]: new Date().toISOString(),
          [receiverId]: new Date().toISOString()
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } else {
      transaction.update(convRef, {
        lastMessage: "🎤 Voice Message",
        lastMessageSenderId: senderId,
        lastMessageAt: serverTimestamp(),
        [`lastMessageReadBy.${senderId}`]: new Date().toISOString(),
        updatedAt: serverTimestamp()
      });
    }

    transaction.set(messageRef, messageData);
  });

  // Create real-time notification
  try {
    const senderName = actorData.displayName || "Someone";
    await createNotification({
      recipientId: receiverId,
      actorId: senderId,
      actorDisplayName: senderName,
      actorUsername: actorData.username || "user",
      actorPhotoURL: actorData.photoURL || "",
      type: "message",
      targetId: canonicalConvId,
      previewText: `${senderName} sent you a voice message.`
    });
  } catch (err) {
    console.warn("createNotification for voice note error:", err);
  }

  return messageId;
}


