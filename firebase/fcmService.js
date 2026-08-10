import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, deleteDoc, serverTimestamp } from "firebase/firestore";
import app, { db } from "./FirebaseConfig";

let messaging = null;

try {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.warn("Firebase Messaging initialization note:", err?.message || err);
}

// Optional VAPID key for web push if configured
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

/**
 * Register FCM Token for the authenticated user
 * Stores token securely under users/{uid}/fcmTokens/{token}
 */
export async function registerFCMToken(uid) {
  if (!uid || !messaging) return null;

  try {
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        console.warn("Notification permission was not granted by user.");
        return null;
      }
    }

    const currentToken = await getToken(messaging, {
      vapidKey: VAPID_KEY || undefined,
    });

    if (currentToken) {
      const tokenRef = doc(db, "users", uid, "fcmTokens", currentToken);
      await setDoc(
        tokenRef,
        {
          token: currentToken,
          platform: "web",
          updatedAt: serverTimestamp(),
          userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "web",
        },
        { merge: true }
      );
      return currentToken;
    }
  } catch (err) {
    console.warn("FCM token registration note:", err?.message || err);
  }
  return null;
}

/**
 * Remove FCM Token on User Logout
 */
export async function removeFCMToken(uid) {
  if (!uid || !messaging) return;
  try {
    const currentToken = await getToken(messaging);
    if (currentToken) {
      const tokenRef = doc(db, "users", uid, "fcmTokens", currentToken);
      await deleteDoc(tokenRef);
    }
  } catch (err) {
    console.warn("FCM token removal note:", err?.message || err);
  }
}

/**
 * Listen for foreground FCM messages (when web app is open)
 */
export function onForegroundFCMMessage(callback) {
  if (!messaging) return () => {};
  return onMessage(messaging, (payload) => {
    if (callback) callback(payload);
  });
}
