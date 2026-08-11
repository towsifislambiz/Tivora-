import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { doc, setDoc, deleteDoc, serverTimestamp, collection, getDocs } from "firebase/firestore";
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import app, { db } from "./FirebaseConfig";

let messaging = null;

try {
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    messaging = getMessaging(app);
  }
} catch (err) {
  console.warn("Firebase Messaging initialization note:", err?.message || err);
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY || "";

/**
 * Register FCM Token for the authenticated user (Native Android + Web)
 * Stores token securely under users/{uid}/fcmTokens/{token}
 */
export async function registerFCMToken(uid) {
  if (!uid) return null;

  // 1. Native Capacitor Push Registration (Android APK)
  if (Capacitor.isNativePlatform()) {
    try {
      let permStatus = await PushNotifications.checkPermissions();
      if (permStatus.receive !== "granted") {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive === "granted") {
        await PushNotifications.register();

        // Listen for FCM registration token on Android
        PushNotifications.addListener("registration", async (tokenData) => {
          if (tokenData?.value) {
            const tokenRef = doc(db, "users", uid, "fcmTokens", tokenData.value);
            await setDoc(
              tokenRef,
              {
                token: tokenData.value,
                platform: "android",
                updatedAt: serverTimestamp(),
                model: navigator.userAgent || "android",
              },
              { merge: true }
            );
          }
        });

        // Create high-importance notification channel with sound
        await PushNotifications.createChannel({
          id: "tivora_messages",
          name: "Tivora Messages",
          description: "Tivora Message Notifications",
          importance: 5,
          visibility: 1,
          sound: "tivora_message",
          vibration: true,
        });

        await PushNotifications.createChannel({
          id: "tivora_calls",
          name: "Tivora Calls",
          description: "Tivora Incoming Calls",
          importance: 5,
          visibility: 1,
          sound: "tivora_ringtone",
          vibration: true,
        });

        // Listen for incoming notifications when app is open or backgrounded
        PushNotifications.addListener("pushNotificationReceived", (notification) => {
          console.log("Push notification received:", notification);
        });
      }
    } catch (nativeErr) {
      console.warn("Native push registration notice:", nativeErr);
    }
    return null;
  }

  // 2. Web Browser Push Registration
  if (!messaging) return null;

  try {
    if (typeof Notification !== "undefined" && Notification.permission !== "granted") {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
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
  if (!uid) return;
  try {
    if (Capacitor.isNativePlatform()) {
      await PushNotifications.removeAllListeners();
    }
    if (messaging) {
      const currentToken = await getToken(messaging);
      if (currentToken) {
        const tokenRef = doc(db, "users", uid, "fcmTokens", currentToken);
        await deleteDoc(tokenRef);
      }
    }
  } catch (err) {
    console.warn("FCM token removal note:", err?.message || err);
  }
}

/**
 * Helper to fetch all FCM tokens for a target user
 */
export async function getUserFCMTokens(recipientUid) {
  if (!recipientUid) return [];
  try {
    const tokensRef = collection(db, "users", recipientUid, "fcmTokens");
    const snap = await getDocs(tokensRef);
    const tokens = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.token) tokens.push(data.token);
    });
    return tokens;
  } catch (err) {
    console.warn("Error fetching recipient FCM tokens:", err);
    return [];
  }
}

/**
 * Send Push Notification to recipient's registered devices
 */
export async function sendPushNotification(recipientUid, title, body, extraData = {}) {
  if (!recipientUid) return;

  try {
    const tokens = await getUserFCMTokens(recipientUid);
    if (!tokens || tokens.length === 0) return;

    for (const token of tokens) {
      try {
        await fetch("https://fcm.googleapis.com/fcm/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: token,
            notification: {
              title: title,
              body: body,
              sound: extraData.sound || "tivora_message",
              channel_id: extraData.channelId || "tivora_messages",
            },
            data: {
              title: title,
              body: body,
              ...extraData,
            },
            priority: "high",
          }),
        });
      } catch (e) {
        console.warn("FCM push send note:", e);
      }
    }
  } catch (err) {
    console.warn("sendPushNotification notice:", err);
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
