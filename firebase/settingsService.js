import {
  doc,
  getDoc,
  updateDoc,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./FirebaseConfig";

const USERS_COLLECTION = "users";

/**
 * Default Privacy & Notification Settings Object
 */
export const DEFAULT_SETTINGS = {
  privacy: {
    profileVisibility: "public", // "public" | "friends"
    searchVisibility: "everyone", // "everyone" | "friends"
    messagePermission: "friends",
    friendRequestPermission: "everyone" // "everyone" | "friendsOfFriends"
  },
  notificationSettings: {
    friendRequests: true,
    friendAccepted: true,
    likes: true,
    comments: true,
    shares: true,
    messages: true,
    groupActivity: true
  },
  accountStatus: "active" // "active" | "deactivated"
};

/**
 * Update user settings in Firestore
 * @param {string} uid 
 * @param {Object} updates - { privacy, notificationSettings, accountStatus, bio, location, displayName, photoURL, coverPhotoURL }
 */
export async function updateUserSettings(uid, updates) {
  if (!uid) throw new Error("UID is required to update settings.");

  const userRef = doc(db, USERS_COLLECTION, uid);
  const safeUpdates = {
    updatedAt: serverTimestamp()
  };

  if (updates.privacy) safeUpdates.privacy = updates.privacy;
  if (updates.notificationSettings) safeUpdates.notificationSettings = updates.notificationSettings;
  if (updates.accountStatus) safeUpdates.accountStatus = updates.accountStatus;

  // Profile fields
  if (updates.displayName !== undefined) safeUpdates.displayName = updates.displayName.trim();
  if (updates.bio !== undefined) safeUpdates.bio = updates.bio.trim();
  if (updates.location !== undefined) safeUpdates.location = updates.location.trim();
  if (updates.photoURL !== undefined) safeUpdates.photoURL = updates.photoURL;
  if (updates.coverPhotoURL !== undefined) safeUpdates.coverPhotoURL = updates.coverPhotoURL;

  await updateDoc(userRef, safeUpdates);
  return true;
}

/**
 * Fetch current user settings & profile
 * @param {string} uid 
 */
export async function getUserSettings(uid) {
  if (!uid) return DEFAULT_SETTINGS;

  try {
    const userRef = doc(db, USERS_COLLECTION, uid);
    const snap = await getDoc(userRef);
    if (!snap.exists()) return DEFAULT_SETTINGS;

    const data = snap.data();
    return {
      privacy: { ...DEFAULT_SETTINGS.privacy, ...(data.privacy || {}) },
      notificationSettings: { ...DEFAULT_SETTINGS.notificationSettings, ...(data.notificationSettings || {}) },
      accountStatus: data.accountStatus || "active",
      displayName: data.displayName || "",
      bio: data.bio || "",
      location: data.location || "",
      photoURL: data.photoURL || "",
      coverPhotoURL: data.coverPhotoURL || ""
    };
  } catch (err) {
    console.warn("getUserSettings error:", err);
    return DEFAULT_SETTINGS;
  }
}
