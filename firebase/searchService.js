import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./FirebaseConfig";

const USERS_COLLECTION = "users";
const GROUPS_COLLECTION = "groups";
const POSTS_COLLECTION = "posts";

/**
 * Search Users by displayName or username
 * @param {string} searchQuery 
 * @param {number} limitCount 
 */
export async function searchUsers(searchQuery, limitCount = 10) {
  const term = (searchQuery || "").trim().toLowerCase();
  if (!term) return [];

  try {
    const snap = await getDocs(query(collection(db, USERS_COLLECTION), limit(40)));
    const matches = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      if (data.accountStatus === "deactivated") return;

      const dName = (data.displayName || "").toLowerCase();
      const uName = (data.username || data.profileId || "").toLowerCase();

      if (dName.includes(term) || uName.includes(term)) {
        matches.push({ ...data, uid: docSnap.id });
      }
    });

    return matches.slice(0, limitCount);
  } catch (err) {
    console.warn("searchUsers error:", err);
    return [];
  }
}

/**
 * Search Groups by name or slug
 * @param {string} searchQuery 
 * @param {number} limitCount 
 */
export async function searchGroups(searchQuery, limitCount = 10) {
  const term = (searchQuery || "").trim().toLowerCase();
  if (!term) return [];

  try {
    const snap = await getDocs(query(collection(db, GROUPS_COLLECTION), limit(40)));
    const matches = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const gName = (data.name || "").toLowerCase();
      const gSlug = (data.slug || "").toLowerCase();

      if (gName.includes(term) || gSlug.includes(term)) {
        matches.push({ ...data, id: docSnap.id });
      }
    });

    return matches.slice(0, limitCount);
  } catch (err) {
    console.warn("searchGroups error:", err);
    return [];
  }
}

/**
 * Search Posts by content text
 * @param {string} searchQuery 
 * @param {number} limitCount 
 */
export async function searchPosts(searchQuery, limitCount = 10) {
  const term = (searchQuery || "").trim().toLowerCase();
  if (!term) return [];

  try {
    const snap = await getDocs(query(collection(db, POSTS_COLLECTION), orderBy("createdAt", "desc"), limit(40)));
    const matches = [];

    snap.forEach((docSnap) => {
      const data = docSnap.data();
      const content = (data.content || "").toLowerCase();
      if (content.includes(term)) {
        matches.push({ ...data, id: docSnap.id });
      }
    });

    return matches.slice(0, limitCount);
  } catch (err) {
    console.warn("searchPosts error:", err);
    return [];
  }
}

/**
 * Global Combined Search for Topbar & Search Results page
 * @param {string} searchQuery 
 */
export async function globalSearch(searchQuery, limitCount = 5) {
  if (!searchQuery?.trim()) return { users: [], groups: [], posts: [] };

  const [users, groups, posts] = await Promise.all([
    searchUsers(searchQuery, limitCount),
    searchGroups(searchQuery, limitCount),
    searchPosts(searchQuery, limitCount)
  ]);

  return { users, groups, posts };
}

/**
 * Record a search query in user's search history
 * @param {string} uid 
 * @param {string} searchQuery 
 */
export async function saveSearchHistory(uid, searchQuery) {
  if (!uid || !searchQuery?.trim()) return;

  try {
    const historyRef = doc(collection(db, USERS_COLLECTION, uid, "searchHistory"));
    await setDoc(historyRef, {
      query: searchQuery.trim(),
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn("saveSearchHistory notice:", err);
  }
}
