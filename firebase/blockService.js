import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./FirebaseConfig";
import { getUserDocument } from "./firestore";

const USERS_COLLECTION = "users";

/**
 * Block a target user (`users/{uid}/blockedUsers/{targetUid}`)
 * @param {string} uid 
 * @param {string} targetUid 
 */
export async function blockUser(uid, targetUid) {
  if (!uid || !targetUid) throw new Error("UID and targetUid required to block.");
  if (uid === targetUid) throw new Error("Cannot block yourself.");

  const blockRef = doc(db, USERS_COLLECTION, uid, "blockedUsers", targetUid);
  await setDoc(blockRef, {
    uid: targetUid,
    blockedAt: serverTimestamp()
  });

  return true;
}

/**
 * Unblock a target user
 * @param {string} uid 
 * @param {string} targetUid 
 */
export async function unblockUser(uid, targetUid) {
  if (!uid || !targetUid) return true;

  const blockRef = doc(db, USERS_COLLECTION, uid, "blockedUsers", targetUid);
  await deleteDoc(blockRef);
  return true;
}

/**
 * Check if targetUid is blocked by uid
 * @param {string} uid 
 * @param {string} targetUid 
 */
export async function isUserBlocked(uid, targetUid) {
  if (!uid || !targetUid) return false;

  try {
    const blockRef = doc(db, USERS_COLLECTION, uid, "blockedUsers", targetUid);
    const snap = await getDoc(blockRef);
    return snap.exists();
  } catch (err) {
    console.warn("isUserBlocked check notice:", err);
    return false;
  }
}

/**
 * Fetch blocked users list with profiles
 * @param {string} uid 
 */
export async function getBlockedUsers(uid) {
  if (!uid) return [];

  try {
    const blockedColRef = collection(db, USERS_COLLECTION, uid, "blockedUsers");
    const snap = await getDocs(blockedColRef);

    const blockedList = [];
    for (const docSnap of snap.docs) {
      const targetUid = docSnap.id;
      const profile = await getUserDocument(targetUid);
      if (profile) {
        blockedList.push({
          ...profile,
          blockedAt: docSnap.data().blockedAt
        });
      }
    }

    return blockedList;
  } catch (err) {
    console.warn("getBlockedUsers error:", err);
    return [];
  }
}
