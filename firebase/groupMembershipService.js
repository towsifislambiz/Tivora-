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

const GROUPS_COLLECTION = "groups";

/**
 * Get user's membership status and role in a group
 * Returns: "owner" | "admin" | "moderator" | "member" | "pending" | "none"
 * @param {string} groupId 
 * @param {string} uid 
 */
export async function getMembershipStatus(groupId, uid) {
  if (!groupId || !uid) return "none";

  try {
    const memberRef = doc(db, GROUPS_COLLECTION, groupId, "members", uid);
    const memberSnap = await getDoc(memberRef);
    if (memberSnap.exists()) {
      return memberSnap.data().role || "member";
    }

    const requestRef = doc(db, GROUPS_COLLECTION, groupId, "joinRequests", uid);
    const requestSnap = await getDoc(requestRef);
    if (requestSnap.exists()) {
      return "pending";
    }

    return "none";
  } catch (err) {
    console.warn("getMembershipStatus error:", err);
    return "none";
  }
}

/**
 * Join a public group instantly
 * @param {string} groupId 
 * @param {string} uid 
 */
export async function joinPublicGroup(groupId, uid) {
  if (!groupId || !uid) throw new Error("groupId and uid are required.");

  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const memberRef = doc(db, GROUPS_COLLECTION, groupId, "members", uid);

  return await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) throw new Error("Group does not exist.");

    const groupData = groupSnap.data();
    if (groupData.privacy === "private") {
      throw new Error("Cannot join a private group instantly. Please request to join.");
    }

    const memberSnap = await transaction.get(memberRef);
    if (memberSnap.exists()) return true; // Already joined

    transaction.set(memberRef, {
      uid,
      role: "member",
      joinedAt: serverTimestamp()
    });

    transaction.update(groupRef, {
      memberCount: (groupData.memberCount || 0) + 1,
      updatedAt: serverTimestamp()
    });

    return true;
  });
}

/**
 * Request to join a private group
 * @param {string} groupId 
 * @param {string} uid 
 * @param {Object} [actorData] - { displayName, username, photoURL }
 */
export async function requestToJoinPrivateGroup(groupId, uid, actorData = {}) {
  if (!groupId || !uid) throw new Error("groupId and uid are required.");

  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) throw new Error("Group does not exist.");

  const groupData = groupSnap.data();
  const requestRef = doc(db, GROUPS_COLLECTION, groupId, "joinRequests", uid);

  await setDoc(requestRef, {
    uid,
    groupId,
    requestedAt: serverTimestamp()
  });

  // Notify Group Owner / Admins about join request
  if (groupData.ownerId && groupData.ownerId !== uid) {
    createNotification({
      id: `group_req_${groupId}_${uid}`,
      recipientId: groupData.ownerId,
      actorId: uid,
      actorDisplayName: actorData.displayName || "Tivora User",
      actorUsername: actorData.username || "user",
      actorPhotoURL: actorData.photoURL || "",
      type: "group_join_request",
      message: `requested to join ${groupData.name}.`,
      relatedId: groupData.slug || groupId,
      postId: null
    });
  }

  return true;
}

/**
 * Cancel a pending join request to a private group
 * @param {string} groupId 
 * @param {string} uid 
 */
export async function cancelJoinRequest(groupId, uid) {
  if (!groupId || !uid) return true;
  const requestRef = doc(db, GROUPS_COLLECTION, groupId, "joinRequests", uid);
  await deleteDoc(requestRef);
  return true;
}

/**
 * Approve a pending join request (Admin/Owner action)
 * @param {string} groupId 
 * @param {string} targetUid 
 * @param {string} adminUid 
 * @param {Object} [adminData]
 */
export async function approveJoinRequest(groupId, targetUid, adminUid, adminData = {}) {
  if (!groupId || !targetUid || !adminUid) throw new Error("Missing arguments.");

  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const memberRef = doc(db, GROUPS_COLLECTION, groupId, "members", targetUid);
  const requestRef = doc(db, GROUPS_COLLECTION, groupId, "joinRequests", targetUid);

  return await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) throw new Error("Group not found.");

    const groupData = groupSnap.data();

    transaction.set(memberRef, {
      uid: targetUid,
      role: "member",
      joinedAt: serverTimestamp()
    });

    transaction.delete(requestRef);

    transaction.update(groupRef, {
      memberCount: (groupData.memberCount || 0) + 1,
      updatedAt: serverTimestamp()
    });

    // Notify User that request was approved
    createNotification({
      id: `group_app_${groupId}_${targetUid}`,
      recipientId: targetUid,
      actorId: adminUid,
      actorDisplayName: adminData.displayName || "Group Admin",
      actorUsername: adminData.username || "admin",
      actorPhotoURL: adminData.photoURL || "",
      type: "group_join_approved",
      message: `approved your request to join ${groupData.name}.`,
      relatedId: groupData.slug || groupId,
      postId: null
    });

    return true;
  });
}

/**
 * Reject a pending join request (Admin/Owner action)
 * @param {string} groupId 
 * @param {string} targetUid 
 */
export async function rejectJoinRequest(groupId, targetUid) {
  if (!groupId || !targetUid) return true;
  const requestRef = doc(db, GROUPS_COLLECTION, groupId, "joinRequests", targetUid);
  await deleteDoc(requestRef);
  return true;
}

/**
 * Leave a group (Owner cannot leave without transferring ownership)
 * @param {string} groupId 
 * @param {string} uid 
 */
export async function leaveGroup(groupId, uid) {
  if (!groupId || !uid) throw new Error("groupId and uid are required.");

  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const memberRef = doc(db, GROUPS_COLLECTION, groupId, "members", uid);

  return await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) return true;

    const groupData = groupSnap.data();
    if (groupData.ownerId === uid) {
      throw new Error("Group owner cannot leave without transferring group ownership first.");
    }

    const memberSnap = await transaction.get(memberRef);
    if (!memberSnap.exists()) return true;

    transaction.delete(memberRef);
    transaction.update(groupRef, {
      memberCount: Math.max(1, (groupData.memberCount || 1) - 1),
      updatedAt: serverTimestamp()
    });

    return true;
  });
}

/**
 * Remove a member from group (Owner/Admin action)
 * @param {string} groupId 
 * @param {string} targetUid 
 * @param {string} actorUid 
 */
export async function removeMember(groupId, targetUid, actorUid) {
  if (!groupId || !targetUid || !actorUid) throw new Error("Missing parameters.");
  if (targetUid === actorUid) throw new Error("Cannot remove yourself with removeMember. Use leaveGroup.");

  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const targetMemberRef = doc(db, GROUPS_COLLECTION, groupId, "members", targetUid);
  const actorMemberRef = doc(db, GROUPS_COLLECTION, groupId, "members", actorUid);

  return await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) throw new Error("Group does not exist.");

    const groupData = groupSnap.data();
    if (groupData.ownerId === targetUid) {
      throw new Error("Permission Denied: Group owner cannot be removed.");
    }

    const actorSnap = await transaction.get(actorMemberRef);
    if (!actorSnap.exists()) throw new Error("Permission Denied: You are not a member.");

    const actorRole = actorSnap.data().role;
    if (actorRole !== "owner" && actorRole !== "admin" && actorRole !== "moderator") {
      throw new Error("Permission Denied: You do not have moderation rights.");
    }

    transaction.delete(targetMemberRef);
    transaction.update(groupRef, {
      memberCount: Math.max(1, (groupData.memberCount || 1) - 1),
      updatedAt: serverTimestamp()
    });

    return true;
  });
}

/**
 * Change a member's role (Owner action)
 * @param {string} groupId 
 * @param {string} targetUid 
 * @param {string} actorUid 
 * @param {string} newRole - "admin" | "moderator" | "member"
 */
export async function changeMemberRole(groupId, targetUid, actorUid, newRole) {
  if (!groupId || !targetUid || !actorUid || !newRole) throw new Error("Missing parameters.");

  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const groupSnap = await getDoc(groupRef);
  if (!groupSnap.exists()) throw new Error("Group not found.");

  if (groupSnap.data().ownerId !== actorUid) {
    throw new Error("Permission Denied: Only Group Owner can change member roles.");
  }

  if (targetUid === actorUid) {
    throw new Error("Owner role is permanent. Transfer ownership to change owner.");
  }

  const memberRef = doc(db, GROUPS_COLLECTION, groupId, "members", targetUid);
  await updateDoc(memberRef, { role: newRole });
  return true;
}

/**
 * Fetch members of a group with profiles
 * @param {string} groupId 
 * @param {number} limitCount 
 */
export async function getGroupMembers(groupId, limitCount = 20) {
  if (!groupId) return [];

  try {
    const membersRef = collection(db, GROUPS_COLLECTION, groupId, "members");
    const q = query(membersRef, limit(limitCount));
    const snap = await getDocs(q);

    const members = [];
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const userProfile = await getUserDocument(data.uid);
      if (userProfile) {
        members.push({
          ...userProfile,
          role: data.role,
          joinedAt: data.joinedAt
        });
      }
    }
    return members;
  } catch (err) {
    console.warn("getGroupMembers error:", err);
    return [];
  }
}

/**
 * Fetch pending join requests for a group (Admin/Owner only)
 * @param {string} groupId 
 */
export async function getJoinRequests(groupId) {
  if (!groupId) return [];

  try {
    const requestsRef = collection(db, GROUPS_COLLECTION, groupId, "joinRequests");
    const snap = await getDocs(query(requestsRef, limit(30)));

    const requests = [];
    for (const docSnap of snap.docs) {
      const data = docSnap.data();
      const userProfile = await getUserDocument(data.uid);
      if (userProfile) {
        requests.push({
          ...userProfile,
          requestedAt: data.requestedAt
        });
      }
    }
    return requests;
  } catch (err) {
    console.warn("getJoinRequests notice:", err);
    return [];
  }
}
