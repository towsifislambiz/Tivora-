import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./FirebaseConfig";

const NOTIFICATIONS_COLLECTION = "notifications";

/**
 * Create a new notification document atomically
 * Prevents self-notifications (recipientId === actorId)
 * @param {Object} notificationData 
 */
export async function createNotification(data) {
  if (!data || !data.recipientId || !data.actorId) return null;
  
  // Rule: Never create notification if user is acting on their own content
  if (data.recipientId === data.actorId) return null;

  try {
    let customId = data.id;

    // Generate deterministic IDs to prevent duplicate notifications
    if (!customId) {
      if (data.type === "friend_request" && data.relatedId) {
        customId = `friend_request_${data.relatedId}`;
      } else if (data.type === "friend_accepted" && data.relatedId) {
        customId = `friend_accepted_${data.relatedId}`;
      } else if (data.type === "post_like" && data.postId && data.actorId) {
        customId = `like_${data.postId}_${data.actorId}`;
      } else if (data.type === "post_comment" && data.commentId) {
        customId = `comment_${data.commentId}`;
      } else if (data.type === "comment_reply" && data.commentId) {
        customId = `reply_${data.commentId}`;
      } else if (data.type === "post_share" && data.postId && data.actorId) {
        customId = `share_${data.postId}_${data.actorId}`;
      }
    }

    const notifRef = customId 
      ? doc(db, NOTIFICATIONS_COLLECTION, customId) 
      : doc(collection(db, NOTIFICATIONS_COLLECTION));

    const finalDoc = {
      id: notifRef.id,
      recipientId: data.recipientId,
      actorId: data.actorId,
      actorDisplayName: data.actorDisplayName || "Tivora User",
      actorUsername: data.actorUsername || "user",
      actorPhotoURL: data.actorPhotoURL || "",
      type: data.type,
      message: data.message || "interacted with your content.",
      relatedId: data.relatedId || null,
      postId: data.postId || null,
      commentId: data.commentId || null,
      isRead: false,
      createdAt: serverTimestamp()
    };

    await setDoc(notifRef, finalDoc, { merge: true });
    return notifRef.id;
  } catch (err) {
    console.warn("createNotification notice:", err);
    return null;
  }
}

/**
 * Real-time subscription to current user's notifications
 * @param {string} uid 
 * @param {function} callback 
 */
export function subscribeToUserNotifications(uid, callback) {
  if (!uid) return () => {};

  const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
  const q = query(
    notifRef,
    where("recipientId", "==", uid),
    orderBy("createdAt", "desc"),
    limit(20)
  );

  return onSnapshot(q, (snapshot) => {
    const notifications = [];
    let unreadCount = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      notifications.push({ ...data, id: docSnap.id });
      if (!data.isRead) unreadCount++;
    });

    callback({ notifications, unreadCount });
  }, (err) => {
    console.warn("User notifications subscription notice:", err);
  });
}

/**
 * Fetch notifications for user with pagination & filter support
 * @param {string} uid 
 * @param {number} limitCount 
 * @param {Object} [lastDocSnap] 
 * @param {boolean} [filterUnread] 
 */
export async function getUserNotifications(uid, limitCount = 20, lastDocSnap = null, filterUnread = false) {
  if (!uid) return { notifications: [], lastDocSnap: null };

  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    let q;

    if (filterUnread) {
      if (lastDocSnap) {
        q = query(
          notifRef,
          where("recipientId", "==", uid),
          where("isRead", "==", false),
          orderBy("createdAt", "desc"),
          startAfter(lastDocSnap),
          limit(limitCount)
        );
      } else {
        q = query(
          notifRef,
          where("recipientId", "==", uid),
          where("isRead", "==", false),
          orderBy("createdAt", "desc"),
          limit(limitCount)
        );
      }
    } else {
      if (lastDocSnap) {
        q = query(
          notifRef,
          where("recipientId", "==", uid),
          orderBy("createdAt", "desc"),
          startAfter(lastDocSnap),
          limit(limitCount)
        );
      } else {
        q = query(
          notifRef,
          where("recipientId", "==", uid),
          orderBy("createdAt", "desc"),
          limit(limitCount)
        );
      }
    }

    const snap = await getDocs(q);
    const notifications = [];
    let newLastDoc = null;

    snap.forEach((docSnap) => {
      notifications.push({ ...docSnap.data(), id: docSnap.id });
      newLastDoc = docSnap;
    });

    return { notifications, lastDocSnap: newLastDoc };
  } catch (err) {
    console.warn("getUserNotifications error:", err);
    return { notifications: [], lastDocSnap: null };
  }
}

/**
 * Mark a single notification as read
 * @param {string} notificationId 
 * @param {string} uid 
 */
export async function markNotificationAsRead(notificationId, uid) {
  if (!notificationId || !uid) return;

  try {
    const notifRef = doc(db, NOTIFICATIONS_COLLECTION, notificationId);
    const snap = await getDoc(notifRef);

    if (snap.exists() && snap.data().recipientId === uid) {
      await updateDoc(notifRef, { isRead: true });
    }
  } catch (err) {
    console.warn("markNotificationAsRead error:", err);
  }
}

/**
 * Mark all unread notifications for a user as read in a batch
 * @param {string} uid 
 */
export async function markAllNotificationsAsRead(uid) {
  if (!uid) return;

  try {
    const notifRef = collection(db, NOTIFICATIONS_COLLECTION);
    const q = query(
      notifRef,
      where("recipientId", "==", uid),
      where("isRead", "==", false),
      limit(100)
    );

    const snap = await getDocs(q);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((docSnap) => {
      batch.update(docSnap.ref, { isRead: true });
    });

    await batch.commit();
  } catch (err) {
    console.warn("markAllNotificationsAsRead error:", err);
  }
}
