import {
  doc,
  getDoc,
  getDocs,
  setDoc,
  collection,
  query,
  where,
  limit,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./FirebaseConfig";
import { normalizeUsername, validateUsername, buildBaseUsername } from "../utils/usernameValidator";

/**
 * Check if a normalized username is available in usernames/{username}
 * @param {string} rawUsername 
 * @param {string} [currentUid]
 */
export async function checkUsernameAvailable(rawUsername, currentUid = null) {
  const normalized = normalizeUsername(rawUsername);
  if (!validateUsername(normalized)) {
    return { available: false, reason: "invalid", username: normalized };
  }

  try {
    const usernameRef = doc(db, "usernames", normalized);
    const snapshot = await getDoc(usernameRef);

    if (!snapshot.exists()) {
      return { available: true, username: normalized };
    }

    const data = snapshot.data();
    if (currentUid && data.uid === currentUid) {
      return { available: true, isOwn: true, username: normalized };
    }

    return { available: false, reason: "taken", username: normalized };
  } catch (error) {
    console.warn("Firestore availability check warning:", error);
    return { available: true, username: normalized, fallback: true };
  }
}

/**
 * Automatically generate a unique available username for Facebook-style instant sign up
 * @param {string} displayName 
 * @param {string} email 
 * @param {string} [currentUid] 
 */
export async function generateUniqueUsername(displayName, email, currentUid = null) {
  const base = buildBaseUsername(displayName, email);
  let candidate = base;
  let counter = 1;

  while (counter < 50) {
    const check = await checkUsernameAvailable(candidate, currentUid);
    if (check.available) {
      return candidate;
    }
    candidate = `${base.slice(0, 15)}_${counter}`;
    counter++;
  }

  return `${base.slice(0, 12)}_${Date.now().toString().slice(-4)}`;
}

/**
 * Atomically reserve a unique permanent username/profileId and create/update user profile in users/{uid}
 * @param {string} uid 
 * @param {string} rawUsername 
 * @param {Object} profileData 
 */
export async function reserveUsernameAndCreateProfile(uid, rawUsername, profileData = {}) {
  if (!uid) throw new Error("User UID is required.");
  
  const normalized = normalizeUsername(rawUsername);
  if (!validateUsername(normalized)) {
    throw new Error("Invalid username format.");
  }

  const usernameRef = doc(db, "usernames", normalized);
  const userRef = doc(db, "users", uid);

  try {
    return await runTransaction(db, async (transaction) => {
      // 1. Check if username document exists
      const usernameSnap = await transaction.get(usernameRef);
      if (usernameSnap.exists()) {
        const existingMapping = usernameSnap.data();
        if (existingMapping.uid !== uid) {
          throw new Error("USERNAME_TAKEN");
        }
      }

      // 2. Fetch current user document
      const userSnap = await transaction.get(userRef);
      const existingUserData = userSnap.exists() ? userSnap.data() : {};
      const oldUsername = existingUserData.username;

      // If user already has a permanent username, keep it
      const finalUsername = oldUsername || normalized;

      // 3. Reserve username document mapping
      transaction.set(usernameRef, { uid });

      // 4. Create or update user profile document
      const updatedUserProfile = {
        uid,
        username: finalUsername,
        profileId: finalUsername,
        displayName: profileData.displayName || existingUserData.displayName || "Tivora User",
        email: profileData.email || existingUserData.email || "",
        photoURL: profileData.photoURL || existingUserData.photoURL || "",
        coverPhotoURL: profileData.coverPhotoURL || profileData.coverURL || existingUserData.coverPhotoURL || existingUserData.coverURL || "",
        bio: profileData.bio !== undefined ? profileData.bio : (existingUserData.bio || ""),
        hobbies: Array.isArray(profileData.hobbies) ? profileData.hobbies : (existingUserData.hobbies || ["Coding", "Gaming"]),
        location: profileData.location !== undefined ? profileData.location : (existingUserData.location || ""),
        isDemo: profileData.isDemo !== undefined ? profileData.isDemo : (existingUserData.isDemo || false),
        emailVerified: profileData.emailVerified !== undefined ? profileData.emailVerified : (existingUserData.emailVerified || false),
        createdAt: existingUserData.createdAt || serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      transaction.set(userRef, updatedUserProfile, { merge: true });

      return updatedUserProfile;
    });
  } catch (err) {
    console.error("Error in reserveUsernameAndCreateProfile:", err);
    throw err;
  }
}

/**
 * Perform exact username search via O(1) lookup in usernames/{username} -> users/{uid}
 * Falls back to querying users collection directly if usernames doc doesn't exist.
 * @param {string} rawUsername 
 */
export async function getUserByUsername(rawUsername) {
  if (!rawUsername) return null;
  const trimmed = String(rawUsername).trim();
  const normalized = normalizeUsername(trimmed);

  try {
    // 1. Direct UID lookup check (covers users whose UID is passed or missing username)
    if (trimmed) {
      const directUserSnap = await getDoc(doc(db, "users", trimmed));
      if (directUserSnap.exists()) {
        return directUserSnap.data();
      }
    }

    if (!normalized) return null;

    // 2. Primary: O(1) lookup via usernames index
    const usernameRef = doc(db, "usernames", normalized);
    const usernameSnap = await getDoc(usernameRef);

    if (usernameSnap.exists()) {
      const { uid } = usernameSnap.data();
      if (uid) {
        const userRef = doc(db, "users", uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) return userSnap.data();
      }
    }

    // 3. Fallback: Query users collection directly by username field
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("username", "==", normalized), limit(1));
    const qSnap = await getDocs(q);
    if (!qSnap.empty) return qSnap.docs[0].data();

    // 4. Also try the raw (un-normalized) username in case it's stored with different casing
    if (trimmed !== normalized) {
      const q2 = query(usersRef, where("username", "==", trimmed), limit(1));
      const qSnap2 = await getDocs(q2);
      if (!qSnap2.empty) return qSnap2.docs[0].data();
    }

    return null;
  } catch (error) {
    console.warn("Firestore getUserByUsername error:", error);
    return null;
  }
}

/**
 * Search users by username/profileId or Display Name
 * @param {string} rawQuery 
 */
export async function searchUsers(rawQuery) {
  const queryText = (rawQuery || "").trim();
  if (!queryText) return [];

  const normalized = normalizeUsername(queryText);

  // 1. Try direct exact O(1) lookup first
  const exactUser = await getUserByUsername(normalized);
  if (exactUser) {
    return [exactUser];
  }

  // 2. Query users collection by prefix or name
  try {
    const usersRef = collection(db, "users");
    const q = query(
      usersRef,
      where("username", ">=", normalized),
      where("username", "<=", normalized + "\uf8ff"),
      limit(5)
    );
    const snap = await getDocs(q);
    const results = [];
    snap.forEach((docSnap) => results.push(docSnap.data()));
    return results;
  } catch (err) {
    console.warn("Search users error:", err);
    return [];
  }
}

/**
 * Update user editable profile fields ONLY (displayName, photoURL, coverPhotoURL, bio, hobbies, location)
 * PERMANENT FIELDS (uid, username, profileId, createdAt) ARE IMMUTABLE AND CANNOT BE OVERWRITTEN.
 * @param {string} uid 
 * @param {Object} editableData 
 */
export async function updateUserProfile(uid, editableData = {}) {
  if (!uid) throw new Error("User UID is required for profile update.");

  const userRef = doc(db, "users", uid);

  const updatePayload = {
    updatedAt: serverTimestamp()
  };

  if (editableData.displayName !== undefined) updatePayload.displayName = editableData.displayName;
  if (editableData.photoURL !== undefined) updatePayload.photoURL = editableData.photoURL;
  if (editableData.coverPhotoURL !== undefined) updatePayload.coverPhotoURL = editableData.coverPhotoURL;
  if (editableData.bio !== undefined) updatePayload.bio = editableData.bio;
  if (editableData.location !== undefined) updatePayload.location = editableData.location;
  if (Array.isArray(editableData.hobbies)) updatePayload.hobbies = editableData.hobbies;

  try {
    await setDoc(userRef, updatePayload, { merge: true });
  } catch (err) {
    console.error("Firestore setDoc merge error:", err);
  }

  const updatedSnap = await getDoc(userRef);
  return updatedSnap.exists() ? updatedSnap.data() : updatePayload;
}
