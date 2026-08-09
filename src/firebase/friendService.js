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
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./FirebaseConfig";
import { getUserDocument } from "./firestore";
import { createNotification } from "./notificationService";

const FRIENDSHIPS_COLLECTION = "friendships";

/**
 * Returns canonical deterministic friendship document ID (minUid_maxUid)
 * @param {string} uid1 
 * @param {string} uid2 
 */
export function getCanonicalFriendshipId(uid1, uid2) {
  if (!uid1 || !uid2) throw new Error("Two user UIDs are required.");
  if (uid1 === uid2) throw new Error("Self friendship is not permitted.");
  const [minUid, maxUid] = [uid1, uid2].sort();
  return `${minUid}_${maxUid}`;
}

/**
 * Send a friend request atomically from `fromUid` to `toUid`
 * @param {string} fromUid 
 * @param {string} toUid 
 * @param {Object} [actorData] - { displayName, username, photoURL }
 */
export async function sendFriendRequest(fromUid, toUid, actorData = {}) {
  if (!fromUid || !toUid) throw new Error("Requester and Receiver UIDs are required.");
  if (fromUid === toUid) throw new Error("You cannot send a friend request to yourself.");

  const friendshipId = getCanonicalFriendshipId(fromUid, toUid);
  const friendshipRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId);
  const [userA, userB] = [fromUid, toUid].sort();

  const res = await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(friendshipRef);

    if (snap.exists()) {
      const data = snap.data();
      if (data.status === "accepted") return { status: "friends", friendshipId, created: false };
      if (data.status === "pending") {
        if (data.requesterId === fromUid) return { status: "pending_sent", friendshipId, created: false };
        return { status: "pending_received", friendshipId, created: false };
      }
    }

    const newFriendshipData = {
      id: friendshipId,
      userA,
      userB,
      requesterId: fromUid,
      receiverId: toUid,
      status: "pending",
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      acceptedAt: null
    };

    transaction.set(friendshipRef, newFriendshipData);
    return { status: "pending_sent", friendshipId, created: true };
  });

  if (res.created) {
    createNotification({
      id: `friend_request_${friendshipId}`,
      recipientId: toUid,
      actorId: fromUid,
      actorDisplayName: actorData.displayName || "Tivora User",
      actorUsername: actorData.username || "user",
      actorPhotoURL: actorData.photoURL || "",
      type: "friend_request",
      message: "sent you a friend request.",
      relatedId: friendshipId
    });
  }

  return res;
}

/**
 * Get friendship status between currentUid and targetUid
 * Returns: "self" | "none" | "pending_sent" | "pending_received" | "friends"
 * @param {string} currentUid 
 * @param {string} targetUid 
 */
export async function getFriendshipStatus(currentUid, targetUid) {
  if (!currentUid || !targetUid) return "none";
  if (currentUid === targetUid) return "self";

  try {
    const friendshipId = getCanonicalFriendshipId(currentUid, targetUid);
    const friendshipRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId);
    const snap = await getDoc(friendshipRef);

    if (!snap.exists()) return "none";

    const data = snap.data();
    if (data.status === "accepted") return "friends";
    if (data.status === "pending") {
      return data.requesterId === currentUid ? "pending_sent" : "pending_received";
    }

    return "none";
  } catch (err) {
    console.warn("getFriendshipStatus error:", err);
    return "none";
  }
}

/**
 * Accept an incoming friend request
 * @param {string} friendshipId 
 * @param {string} uid 
 * @param {Object} [actorData] - { displayName, username, photoURL }
 */
export async function acceptFriendRequest(friendshipId, uid, actorData = {}) {
  if (!friendshipId || !uid) throw new Error("friendshipId and uid are required.");

  const friendshipRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId);
  const snap = await getDoc(friendshipRef);

  if (!snap.exists()) throw new Error("Friend request does not exist.");

  const data = snap.data();
  if (data.receiverId !== uid) {
    throw new Error("Permission Denied: Only the receiver can accept a friend request.");
  }

  await updateDoc(friendshipRef, {
    status: "accepted",
    acceptedAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });

  // Create friend_accepted notification for the original requester
  createNotification({
    id: `friend_accepted_${friendshipId}`,
    recipientId: data.requesterId,
    actorId: uid,
    actorDisplayName: actorData.displayName || "Tivora User",
    actorUsername: actorData.username || "user",
    actorPhotoURL: actorData.photoURL || "",
    type: "friend_accepted",
    message: "accepted your friend request.",
    relatedId: friendshipId
  });

  return true;
}

/**
 * Decline an incoming friend request
 * @param {string} friendshipId 
 * @param {string} uid 
 */
export async function declineFriendRequest(friendshipId, uid) {
  if (!friendshipId || !uid) throw new Error("friendshipId and uid are required.");

  const friendshipRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId);
  const snap = await getDoc(friendshipRef);

  if (!snap.exists()) return true;

  const data = snap.data();
  if (data.receiverId !== uid) {
    throw new Error("Permission Denied: Only the receiver can decline a friend request.");
  }

  await deleteDoc(friendshipRef);
  return true;
}

/**
 * Cancel an outgoing pending request
 * @param {string} friendshipId 
 * @param {string} uid 
 */
export async function cancelFriendRequest(friendshipId, uid) {
  if (!friendshipId || !uid) throw new Error("friendshipId and uid are required.");

  const friendshipRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId);
  const snap = await getDoc(friendshipRef);

  if (!snap.exists()) return true;

  const data = snap.data();
  if (data.requesterId !== uid) {
    throw new Error("Permission Denied: Only the requester can cancel a sent request.");
  }

  await deleteDoc(friendshipRef);
  return true;
}

/**
 * Remove an accepted friend
 * @param {string} friendshipId 
 * @param {string} uid 
 */
export async function removeFriend(friendshipId, uid) {
  if (!friendshipId || !uid) throw new Error("friendshipId and uid are required.");

  const friendshipRef = doc(db, FRIENDSHIPS_COLLECTION, friendshipId);
  const snap = await getDoc(friendshipRef);

  if (!snap.exists()) return true;

  const data = snap.data();
  if (data.userA !== uid && data.userB !== uid) {
    throw new Error("Permission Denied: Only participants can remove a friendship.");
  }

  await deleteDoc(friendshipRef);
  return true;
}

/**
 * Fetch accepted friends list for user with pagination
 * @param {string} uid 
 * @param {number} limitCount 
 * @param {Object} [lastDocSnap] 
 */
export async function getFriends(uid, limitCount = 10, lastDocSnap = null) {
  if (!uid) return { friends: [], lastDocSnap: null };

  try {
    const friendshipsRef = collection(db, FRIENDSHIPS_COLLECTION);
    
    // Query 1: userA == uid & status == accepted
    const q1 = query(
      friendshipsRef,
      where("userA", "==", uid),
      where("status", "==", "accepted"),
      limit(limitCount)
    );

    // Query 2: userB == uid & status == accepted
    const q2 = query(
      friendshipsRef,
      where("userB", "==", uid),
      where("status", "==", "accepted"),
      limit(limitCount)
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const friendshipDocs = [...snap1.docs, ...snap2.docs];

    const friends = [];
    let lastDoc = null;

    for (const docSnap of friendshipDocs) {
      const data = docSnap.data();
      const friendUid = data.userA === uid ? data.userB : data.userA;
      lastDoc = docSnap;

      const profile = await getUserDocument(friendUid);
      if (profile) {
        friends.push({
          ...profile,
          friendshipId: docSnap.id,
          acceptedAt: data.acceptedAt
        });
      }
    }

    return { friends, lastDocSnap: lastDoc };
  } catch (err) {
    console.warn("getFriends error:", err);
    return { friends: [], lastDocSnap: null };
  }
}

/**
 * Fetch incoming pending friend requests (receiverId == uid & status == pending)
 * @param {string} uid 
 * @param {number} limitCount 
 * @param {Object} [lastDocSnap] 
 */
export async function getIncomingFriendRequests(uid, limitCount = 10, lastDocSnap = null) {
  if (!uid) return { requests: [], lastDocSnap: null };

  try {
    const friendshipsRef = collection(db, FRIENDSHIPS_COLLECTION);
    let q;

    if (lastDocSnap) {
      q = query(
        friendshipsRef,
        where("receiverId", "==", uid),
        where("status", "==", "pending"),
        startAfter(lastDocSnap),
        limit(limitCount)
      );
    } else {
      q = query(
        friendshipsRef,
        where("receiverId", "==", uid),
        where("status", "==", "pending"),
        limit(limitCount)
      );
    }

    const snap = await getDocs(q);
    const requests = [];
    let newLastDoc = null;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      newLastDoc = docSnap;
      const profile = await getUserDocument(data.requesterId);
      if (profile) {
        requests.push({
          ...profile,
          friendshipId: docSnap.id,
          createdAt: data.createdAt
        });
      }
    }

    return { requests, lastDocSnap: newLastDoc };
  } catch (err) {
    console.warn("getIncomingFriendRequests error:", err);
    return { requests: [], lastDocSnap: null };
  }
}

/**
 * Fetch outgoing pending friend requests (requesterId == uid & status == pending)
 * @param {string} uid 
 * @param {number} limitCount 
 * @param {Object} [lastDocSnap] 
 */
export async function getOutgoingFriendRequests(uid, limitCount = 10, lastDocSnap = null) {
  if (!uid) return { requests: [], lastDocSnap: null };

  try {
    const friendshipsRef = collection(db, FRIENDSHIPS_COLLECTION);
    let q;

    if (lastDocSnap) {
      q = query(
        friendshipsRef,
        where("requesterId", "==", uid),
        where("status", "==", "pending"),
        startAfter(lastDocSnap),
        limit(limitCount)
      );
    } else {
      q = query(
        friendshipsRef,
        where("requesterId", "==", uid),
        where("status", "==", "pending"),
        limit(limitCount)
      );
    }

    const snap = await getDocs(q);
    const requests = [];
    let newLastDoc = null;

    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      newLastDoc = docSnap;
      const profile = await getUserDocument(data.receiverId);
      if (profile) {
        requests.push({
          ...profile,
          friendshipId: docSnap.id,
          createdAt: data.createdAt
        });
      }
    }

    return { requests, lastDocSnap: newLastDoc };
  } catch (err) {
    console.warn("getOutgoingFriendRequests error:", err);
    return { requests: [], lastDocSnap: null };
  }
}

/**
 * Fetch real suggested users from Firestore (excluding current user and existing friends/pending)
 * @param {string} currentUid 
 * @param {number} limitCount 
 */
export async function getSuggestedUsers(currentUid, limitCount = 5) {
  if (!currentUid) return [];

  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, limit(20));
    const snap = await getDocs(q);

    const candidates = [];
    snap.forEach((docSnap) => {
      if (docSnap.id !== currentUid) {
        candidates.push({ uid: docSnap.id, ...docSnap.data() });
      }
    });

    if (candidates.length === 0) return [];

    // Filter out users who are already friends or have pending requests
    const filtered = [];
    for (const candidate of candidates) {
      const status = await getFriendshipStatus(currentUid, candidate.uid);
      if (status === "none") {
        filtered.push(candidate);
      }
      if (filtered.length >= limitCount) break;
    }

    return filtered;
  } catch (err) {
    console.warn("getSuggestedUsers error:", err);
    return [];
  }
}

