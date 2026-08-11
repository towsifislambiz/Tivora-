import { doc, updateDoc, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "./FirebaseConfig";

// 2 Minutes Inactivity Grace Threshold (120,000ms)
export const ONLINE_GRACE_PERIOD_MS = 2 * 60 * 1000;

/**
 * Updates user online presence in Firestore doc `users/{uid}`
 * @param {string} uid 
 * @param {boolean} isOnline 
 */
export async function updateUserPresence(uid, isOnline) {
  if (!uid) return;
  try {
    const userRef = doc(db, "users", uid);
    const nowIso = new Date().toISOString();
    await updateDoc(userRef, {
      isOnline: Boolean(isOnline),
      lastSeen: nowIso,
      lastActiveAt: serverTimestamp()
    });
  } catch (err) {
    // Ignore transient status update error if user doc is initializing
  }
}

/**
 * Initializes continuous Real-Time Presence Heartbeat & Lifecycle Events for current user
 * @param {string} uid 
 * @returns {function} Cleanup function
 */
export function initPresenceTracker(uid) {
  if (!uid) return () => {};

  // 1. Immediately mark user as Online on app start
  updateUserPresence(uid, true);

  // 2. High-frequency 15s heartbeat to keep active presence timestamp fresh
  const heartbeatTimer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      updateUserPresence(uid, true);
    }
  }, 15000);

  // User activity listeners (mouse move, click, keydown, touch)
  let activityDebounce = null;
  const handleUserActivity = () => {
    if (activityDebounce) return;
    activityDebounce = setTimeout(() => {
      activityDebounce = null;
    }, 10000);
    updateUserPresence(uid, true);
  };

  // 3. Tab Visibility change handler - graceful 2-minute buffer
  const handleVisibilityChange = () => {
    if (document.visibilityState === 'visible') {
      updateUserPresence(uid, true);
    } else {
      // Record last active timestamp when user switches tab
      updateUserPresence(uid, true);
    }
  };

  // 4. Tab Close / Page Unload handler
  const handleUnload = () => {
    updateUserPresence(uid, false);
  };

  window.addEventListener("mousemove", handleUserActivity);
  window.addEventListener("keydown", handleUserActivity);
  window.addEventListener("touchstart", handleUserActivity);
  window.addEventListener("scroll", handleUserActivity);
  window.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", handleUnload);
  window.addEventListener("pagehide", handleUnload);

  return () => {
    clearInterval(heartbeatTimer);
    if (activityDebounce) clearTimeout(activityDebounce);
    window.removeEventListener("mousemove", handleUserActivity);
    window.removeEventListener("keydown", handleUserActivity);
    window.removeEventListener("touchstart", handleUserActivity);
    window.removeEventListener("scroll", handleUserActivity);
    window.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("beforeunload", handleUnload);
    window.removeEventListener("pagehide", handleUnload);
    updateUserPresence(uid, false);
  };
}

/**
 * Subscribes to real-time online status and lastSeen of any user
 * @param {string} uid 
 * @param {function} callback 
 * @returns {function} Unsubscribe function
 */
export function subscribeToUserPresence(uid, callback) {
  if (!uid) return () => {};

  const userRef = doc(db, "users", uid);
  return onSnapshot(userRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      const rawIsOnline = Boolean(data.isOnline);
      const lastSeen = data.lastSeen || (data.lastActiveAt?.toDate ? data.lastActiveAt.toDate().toISOString() : null);
      const online = isUserOnline(rawIsOnline, lastSeen);

      callback({
        isOnline: online,
        lastSeen
      });
    } else {
      callback({ isOnline: false, lastSeen: null });
    }
  }, (err) => {
    console.warn("User presence listener notice:", err);
    callback({ isOnline: false, lastSeen: null });
  });
}

/**
 * Determines if a user is considered Online with a 2-minute grace threshold
 * @param {boolean} rawIsOnline 
 * @param {string|Date|null} lastSeen 
 * @returns {boolean}
 */
export function isUserOnline(rawIsOnline, lastSeen) {
  if (rawIsOnline) return true;
  if (!lastSeen) return false;

  try {
    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const diffMs = Date.now() - lastSeenDate.getTime();
    // Within 2 minutes (120,000 ms) -> Always treat as ONLINE
    return diffMs <= ONLINE_GRACE_PERIOD_MS;
  } catch (e) {
    return false;
  }
}

/**
 * Format Last Seen Time Ago (e.g. "Active now", "Active 5m ago", "Active 2h ago")
 * @param {boolean} rawIsOnline 
 * @param {string|Date|null} lastSeen 
 * @returns {string} Human-friendly Messenger status text
 */
export function formatLastSeen(rawIsOnline, lastSeen) {
  const online = isUserOnline(rawIsOnline, lastSeen);
  if (online) return "Active now";
  if (!lastSeen) return "Offline";

  try {
    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - lastSeenDate.getTime();

    if (isNaN(diffMs) || diffMs < 0) return "Offline";

    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins <= 2) return "Active 2m ago";
    if (diffMins < 60) return `Active ${diffMins}m ago`;
    if (diffHours < 24) return `Active ${diffHours}h ago`;
    if (diffDays === 1) return "Active yesterday";
    if (diffDays < 7) return `Active ${diffDays}d ago`;

    return "Offline";
  } catch (e) {
    return "Offline";
  }
}
