const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

const db = admin.firestore();

/**
 * Cloud Function: Send FCM Notification on New Direct Message
 * Trigger: conversations/{conversationId}/messages/{messageId}
 */
exports.onMessageCreated = functions.firestore
  .document("conversations/{conversationId}/messages/{messageId}")
  .onCreate(async (snapshot, context) => {
    const messageData = snapshot.data();
    if (!messageData || !messageData.senderId) return null;

    const conversationId = context.params.conversationId;

    try {
      // 1. Fetch conversation document to find participants
      const convSnap = await db.collection("conversations").doc(conversationId).get();
      if (!convSnap.exists) return null;

      const convData = convSnap.data();
      const participants = convData.participantIds || convData.participants || [];
      const recipientId = participants.find((id) => id !== messageData.senderId);

      if (!recipientId) return null;

      // 2. Fetch sender profile
      const senderSnap = await db.collection("users").doc(messageData.senderId).get();
      const senderName = senderSnap.exists
        ? senderSnap.data().displayName || senderSnap.data().username || "Tivora User"
        : "Tivora User";

      // 3. Fetch recipient FCM tokens from users/{recipientId}/fcmTokens
      const tokensSnap = await db.collection("users").doc(recipientId).collection("fcmTokens").get();
      if (tokensSnap.empty) return null;

      const tokens = [];
      tokensSnap.forEach((doc) => {
        const data = doc.data();
        if (data.token) tokens.push(data.token);
      });

      if (tokens.length === 0) return null;

      const bodyText = messageData.text || (messageData.imageURL ? "📷 Sent a photo" : "Sent a message");

      // 4. Construct Multicast Payload
      const payload = {
        tokens,
        notification: {
          title: senderName,
          body: bodyText,
        },
        data: {
          type: "message",
          conversationId: conversationId,
          messageId: snapshot.id,
          senderId: messageData.senderId,
          senderName: senderName,
          text: bodyText,
        },
        android: {
          priority: "high",
          notification: {
            channelId: "tivora_messages",
            sound: "tivora_message",
          },
        },
      };

      const response = await admin.messaging().sendEachForMulticast(payload);

      // Clean up invalid/expired tokens reported by FCM
      const tokensToDelete = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const errCode = resp.error?.code;
          if (
            errCode === "messaging/invalid-registration-token" ||
            errCode === "messaging/registration-token-not-registered"
          ) {
            tokensToDelete.push(tokens[idx]);
          }
        }
      });

      if (tokensToDelete.length > 0) {
        const batch = db.batch();
        tokensToDelete.forEach((t) => {
          const tokenRef = db.collection("users").doc(recipientId).collection("fcmTokens").doc(t);
          batch.delete(tokenRef);
        });
        await batch.commit();
      }

      return { successCount: response.successCount };
    } catch (err) {
      console.error("onMessageCreated Cloud Function error:", err);
      return null;
    }
  });

/**
 * Cloud Function: Send High-Priority FCM Data Message on Call State Changes
 * Trigger: calls/{callId}
 */
exports.onCallStateChanged = functions.firestore
  .document("calls/{callId}")
  .onWrite(async (change, context) => {
    const callId = context.params.callId;
    const callData = change.after.exists ? change.after.data() : null;
    const prevData = change.before.exists ? change.before.data() : null;

    if (!callData && !prevData) return null;

    const targetCall = callData || prevData;
    const status = callData ? callData.status : "ended";
    const prevStatus = prevData ? prevData.status : null;

    // Skip if status hasn't changed meaningfully
    if (status === prevStatus) return null;

    const receiverId = targetCall.receiverId;
    const callerId = targetCall.callerId;

    if (!receiverId) return null;

    try {
      // Fetch receiver FCM tokens
      const tokensSnap = await db.collection("users").doc(receiverId).collection("fcmTokens").get();
      if (tokensSnap.empty) return null;

      const tokens = [];
      tokensSnap.forEach((doc) => {
        const data = doc.data();
        if (data.token) tokens.push(data.token);
      });

      if (tokens.length === 0) return null;

      const callerName = targetCall.callerDisplayName || targetCall.callerUsername || "Tivora Friend";
      const callType = targetCall.type || "voice";

      // Send HIGH-PRIORITY DATA MESSAGE (wakes background & killed app on Android)
      const payload = {
        tokens,
        data: {
          type: "incoming_call",
          callId: callId,
          status: status,
          callType: callType,
          callerName: callerName,
          callerId: callerId,
          timestamp: String(Date.now()),
        },
        android: {
          priority: "high",
          ttl: 35 * 1000, // 35 second time-to-live matching call timeout
        },
      };

      const response = await admin.messaging().sendEachForMulticast(payload);
      return { successCount: response.successCount };
    } catch (err) {
      console.error("onCallStateChanged Cloud Function error:", err);
      return null;
    }
  });
