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
  onSnapshot,
  serverTimestamp,
  addDoc
} from "firebase/firestore";
import { db } from "./FirebaseConfig";
import { sendMessage, getCanonicalConversationId } from "./messageService";

const CALLS_COLLECTION = "calls";

/**
 * Creates a new call document in Firestore
 * @param {Object} caller - { uid, displayName, username, photoURL }
 * @param {Object} receiver - { uid, displayName, username, photoURL }
 * @param {string} type - 'voice' | 'video'
 */
export async function createCallDoc(caller, receiver, type) {
  if (!caller?.uid || !receiver?.uid) throw new Error("Caller and Receiver UIDs are required.");

  const conversationId = getCanonicalConversationId(caller.uid, receiver.uid);
  const callRef = doc(collection(db, CALLS_COLLECTION));
  const callId = callRef.id;

  const callData = {
    callId,
    conversationId,
    callerId: caller.uid,
    callerDisplayName: caller.displayName || 'Tivora User',
    callerUsername: caller.username || 'user',
    callerPhotoURL: caller.photoURL || '',
    receiverId: receiver.uid,
    receiverDisplayName: receiver.displayName || 'Tivora User',
    receiverUsername: receiver.username || 'user',
    receiverPhotoURL: receiver.photoURL || '',
    type, // 'voice' | 'video'
    status: 'calling', // 'calling' | 'ringing' | 'connecting' | 'connected' | 'reconnecting' | 'rejected' | 'cancelled' | 'missed' | 'busy' | 'failed' | 'ended'
    offer: null,
    answer: null,
    createdAt: serverTimestamp(),
    startedAt: null,
    connectedAt: null,
    endedAt: null,
    endedBy: null,
    duration: 0
  };

  await setDoc(callRef, callData);
  return { ...callData, callId };
}

/**
 * Subscribe to incoming calls where receiverId == uid and status == 'calling'
 * @param {string} userUid 
 * @param {function} callback 
 */
export function subscribeToIncomingCalls(userUid, callback) {
  if (!userUid) return () => {};

  const callsRef = collection(db, CALLS_COLLECTION);
  const q = query(
    callsRef,
    where("receiverId", "==", userUid),
    where("status", "==", "calling")
  );

  return onSnapshot(q, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added" || change.type === "modified") {
        const callData = { ...change.doc.data(), callId: change.doc.id };
        callback(callData);
      }
    });
  }, (err) => {
    console.warn("Incoming call subscription notice:", err);
  });
}

/**
 * Subscribe to a specific call document for status & answer updates
 * @param {string} callId 
 * @param {function} callback 
 */
export function subscribeToCallDoc(callId, callback) {
  if (!callId) return () => {};

  const callRef = doc(db, CALLS_COLLECTION, callId);
  return onSnapshot(callRef, (snapshot) => {
    if (snapshot.exists()) {
      callback({ ...snapshot.data(), callId: snapshot.id });
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn("Call doc subscription notice:", err);
  });
}

/**
 * Store WebRTC Offer SDP in call document
 * @param {string} callId 
 * @param {Object} offer - { type, sdp }
 */
export async function sendCallOffer(callId, offer) {
  if (!callId || !offer) return;
  const callRef = doc(db, CALLS_COLLECTION, callId);
  await updateDoc(callRef, {
    offer: { type: offer.type, sdp: offer.sdp }
  });
}

/**
 * Store WebRTC Answer SDP in call document and update status
 * @param {string} callId 
 * @param {Object} answer - { type, sdp }
 */
export async function sendCallAnswer(callId, answer) {
  if (!callId || !answer) return;
  const callRef = doc(db, CALLS_COLLECTION, callId);
  await updateDoc(callRef, {
    answer: { type: answer.type, sdp: answer.sdp },
    status: 'connecting',
    connectedAt: serverTimestamp()
  });
}

/**
 * Add an ICE candidate to callerCandidates or receiverCandidates subcollection
 * @param {string} callId 
 * @param {boolean} isCaller 
 * @param {Object} candidate 
 */
export async function addIceCandidate(callId, isCaller, candidate) {
  if (!callId || !candidate) return;
  try {
    const candidateData = typeof candidate.toJSON === 'function' ? candidate.toJSON() : candidate;
    const subcollectionName = isCaller ? "callerCandidates" : "receiverCandidates";
    const candidatesRef = collection(db, CALLS_COLLECTION, callId, subcollectionName);
    await addDoc(candidatesRef, candidateData);
  } catch (err) {
    console.warn("addIceCandidate error:", err);
  }
}

/**
 * Subscribe to partner's ICE candidates
 * @param {string} callId 
 * @param {boolean} isCaller - If true, listens to receiverCandidates
 * @param {function} callback 
 */
export function subscribeToIceCandidates(callId, isCaller, callback) {
  if (!callId) return () => {};

  // Caller listens to receiver's candidates, Receiver listens to caller's candidates
  const targetSubcollection = isCaller ? "receiverCandidates" : "callerCandidates";
  const candidatesRef = collection(db, CALLS_COLLECTION, callId, targetSubcollection);

  return onSnapshot(candidatesRef, (snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "added") {
        callback(change.doc.data());
      }
    });
  }, (err) => {
    console.warn("ICE candidate subscription notice:", err);
  });
}

/**
 * Update call status and metadata
 * @param {string} callId 
 * @param {string} status 
 * @param {Object} [extraData={}] 
 */
export async function updateCallStatus(callId, status, extraData = {}) {
  if (!callId) return;
  try {
    const callRef = doc(db, CALLS_COLLECTION, callId);
    const updatePayload = {
      status,
      updatedAt: serverTimestamp(),
      ...extraData
    };
    if (status === 'ended' || status === 'rejected' || status === 'cancelled' || status === 'busy' || status === 'failed' || status === 'missed') {
      updatePayload.endedAt = serverTimestamp();
    }
    await updateDoc(callRef, updatePayload);
  } catch (err) {
    console.warn("updateCallStatus error:", err);
  }
}

/**
 * Record a call history message in conversation
 * @param {Object} callData 
 */
export async function recordCallHistory(callData) {
  if (!callData?.conversationId || !callData?.callerId || !callData?.receiverId) return;

  try {
    const messagesRef = collection(db, "conversations", callData.conversationId, "messages");
    const callTypeStr = callData.type === 'video' ? 'Video Call' : 'Voice Call';
    let durationText = '';

    if (callData.duration && callData.duration > 0) {
      const mins = Math.floor(callData.duration / 60);
      const secs = callData.duration % 60;
      durationText = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    let statusLabel = 'Call';
    if (callData.status === 'completed' || callData.status === 'ended') {
      statusLabel = durationText ? `${callTypeStr} · ${durationText}` : callTypeStr;
    } else if (callData.status === 'missed') {
      statusLabel = `Missed ${callTypeStr}`;
    } else if (callData.status === 'rejected') {
      statusLabel = `${callTypeStr} Declined`;
    } else if (callData.status === 'busy') {
      statusLabel = `User Busy (${callTypeStr})`;
    } else if (callData.status === 'cancelled') {
      statusLabel = `Cancelled ${callTypeStr}`;
    } else {
      statusLabel = `${callTypeStr} (${callData.status})`;
    }

    await addDoc(messagesRef, {
      type: 'call',
      callId: callData.callId,
      callType: callData.type,
      callStatus: callData.status,
      duration: callData.duration || 0,
      senderId: callData.callerId,
      receiverId: callData.receiverId,
      text: statusLabel,
      createdAt: serverTimestamp(),
      readBy: [callData.callerId]
    });
  } catch (err) {
    console.warn("recordCallHistory error:", err);
  }
}
