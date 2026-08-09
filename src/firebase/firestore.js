import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./FirebaseConfig";

/**
 * Creates or updates a basic user document in Firestore at users/{uid}
 * @param {import("firebase/auth").User} user 
 * @param {Object} [additionalData] 
 */
export async function createUserDocument(user, additionalData = {}) {
  if (!user) return null;

  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const { email, displayName, photoURL, emailVerified } = user;
    const createdAt = serverTimestamp();

    const userData = {
      uid: user.uid,
      displayName: displayName || additionalData.displayName || "Demo User",
      email: email || "",
      photoURL: photoURL || "",
      emailVerified: emailVerified || (email === "demo@tivora.app"),
      isDemo: additionalData.isDemo || (email === "demo@tivora.app"),
      createdAt
    };

    try {
      await setDoc(userRef, userData);
      return userData;
    } catch (error) {
      console.error("Error creating user document in Firestore:", error);
      throw error;
    }
  } else {
    // Document exists - update necessary fields without overwriting createdAt
    const existingData = snapshot.data();
    const updatePayload = {};

    if (additionalData.displayName && existingData.displayName !== additionalData.displayName) {
      updatePayload.displayName = additionalData.displayName;
    }
    if (user.emailVerified !== undefined && existingData.emailVerified !== user.emailVerified) {
      updatePayload.emailVerified = user.emailVerified;
    }

    if (Object.keys(updatePayload).length > 0) {
      try {
        await updateDoc(userRef, updatePayload);
      } catch (err) {
        console.error("Error updating user document in Firestore:", err);
      }
    }

    return { ...existingData, ...updatePayload };
  }
}

/**
 * Fetch user document from Firestore by UID
 * @param {string} uid 
 */
export async function getUserDocument(uid) {
  if (!uid) return null;
  const userRef = doc(db, "users", uid);
  const snapshot = await getDoc(userRef);
  return snapshot.exists() ? snapshot.data() : null;
}
