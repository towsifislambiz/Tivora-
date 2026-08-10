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

const GROUPS_COLLECTION = "groups";
const GROUP_SLUGS_COLLECTION = "groupSlugs";

/**
 * Normalizes and validates group slug (e.g. "Web Developers" -> "web-developers")
 * @param {string} rawSlug 
 */
export function normalizeGroupSlug(rawSlug) {
  if (!rawSlug) return "";
  return rawSlug
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create a new group atomically with unique slug registration
 * @param {string} ownerId 
 * @param {Object} groupData - { name, slug, description, privacy, groupPhotoURL, coverPhotoURL }
 */
export async function createGroup(ownerId, groupData) {
  if (!ownerId) throw new Error("Owner ID is required.");
  const name = (groupData.name || "").trim();
  const rawSlug = groupData.slug || name;
  const slug = normalizeGroupSlug(rawSlug);

  if (!name) throw new Error("Group name is required.");
  if (!slug) throw new Error("Valid group slug is required.");
  if (slug.length < 3) throw new Error("Group slug must be at least 3 characters long.");

  const privacy = groupData.privacy === "private" ? "private" : "public";
  const slugRef = doc(db, GROUP_SLUGS_COLLECTION, slug);
  const groupRef = doc(collection(db, GROUPS_COLLECTION));
  const groupId = groupRef.id;

  const ownerMemberRef = doc(db, GROUPS_COLLECTION, groupId, "members", ownerId);

  const newGroup = {
    id: groupId,
    name,
    slug,
    description: (groupData.description || "").trim(),
    privacy,
    ownerId,
    groupPhotoURL: groupData.groupPhotoURL || null,
    coverPhotoURL: groupData.coverPhotoURL || null,
    memberCount: 1,
    postCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await runTransaction(db, async (transaction) => {
    const slugSnap = await transaction.get(slugRef);
    if (slugSnap.exists()) {
      throw new Error(`The group URL slug '${slug}' is already taken. Please choose another.`);
    }

    transaction.set(slugRef, {
      groupId,
      slug,
      createdAt: serverTimestamp()
    });

    transaction.set(groupRef, newGroup);

    transaction.set(ownerMemberRef, {
      uid: ownerId,
      role: "owner",
      joinedAt: serverTimestamp()
    });
  });

  return { ...newGroup, id: groupId };
}

/**
 * Fetch group document by its unique slug
 * @param {string} slug 
 */
export async function getGroupBySlug(slug) {
  if (!slug) return null;
  const cleanSlug = normalizeGroupSlug(slug);

  try {
    const slugSnap = await getDoc(doc(db, GROUP_SLUGS_COLLECTION, cleanSlug));
    if (!slugSnap.exists()) return null;

    const { groupId } = slugSnap.data();
    return await getGroupById(groupId);
  } catch (err) {
    console.warn("getGroupBySlug error:", err);
    return null;
  }
}

/**
 * Fetch group document by ID
 * @param {string} groupId 
 */
export async function getGroupById(groupId) {
  if (!groupId) return null;
  try {
    const snap = await getDoc(doc(db, GROUPS_COLLECTION, groupId));
    if (!snap.exists()) return null;
    return { ...snap.data(), id: snap.id };
  } catch (err) {
    console.warn("getGroupById error:", err);
    return null;
  }
}

/**
 * Update group details (Only owner/admin)
 * @param {string} groupId 
 * @param {string} userId 
 * @param {Object} updates 
 */
export async function updateGroup(groupId, userId, updates) {
  if (!groupId || !userId) throw new Error("groupId and userId required.");

  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const memberRef = doc(db, GROUPS_COLLECTION, groupId, "members", userId);

  const [groupSnap, memberSnap] = await Promise.all([getDoc(groupRef), getDoc(memberRef)]);
  if (!groupSnap.exists()) throw new Error("Group not found.");
  if (!memberSnap.exists()) throw new Error("Permission Denied: You are not a group member.");

  const role = memberSnap.data().role;
  if (role !== "owner" && role !== "admin") {
    throw new Error("Permission Denied: Only Group Owner or Admin can update settings.");
  }

  const safeUpdates = {};
  if (updates.name !== undefined) safeUpdates.name = updates.name.trim();
  if (updates.description !== undefined) safeUpdates.description = updates.description.trim();
  if (updates.groupPhotoURL !== undefined) safeUpdates.groupPhotoURL = updates.groupPhotoURL;
  if (updates.coverPhotoURL !== undefined) safeUpdates.coverPhotoURL = updates.coverPhotoURL;
  if (updates.privacy !== undefined && role === "owner") safeUpdates.privacy = updates.privacy;
  safeUpdates.updatedAt = serverTimestamp();

  await updateDoc(groupRef, safeUpdates);
  return true;
}

/**
 * Search groups by name or slug
 * @param {string} searchQuery 
 * @param {number} limitCount 
 */
export async function searchGroups(searchQuery, limitCount = 10) {
  const term = (searchQuery || "").trim().toLowerCase();
  if (!term) return [];

  try {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const q = query(groupsRef, limit(30));
    const snap = await getDocs(q);

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
 * Fetch public groups for discovery
 * @param {number} limitCount 
 */
export async function getPublicGroups(limitCount = 12) {
  try {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const q = query(groupsRef, where("privacy", "==", "public"), orderBy("createdAt", "desc"), limit(limitCount));
    const snap = await getDocs(q);

    const groups = [];
    snap.forEach((docSnap) => {
      groups.push({ ...docSnap.data(), id: docSnap.id });
    });
    return groups;
  } catch (err) {
    console.warn("getPublicGroups notice:", err);
    return [];
  }
}

/**
 * Fetch groups a user belongs to
 * @param {string} uid 
 */
export async function getUserGroups(uid) {
  if (!uid) return [];

  try {
    const groupsRef = collection(db, GROUPS_COLLECTION);
    const snap = await getDocs(query(groupsRef, limit(50)));

    const userGroups = [];
    for (const docSnap of snap.docs) {
      const groupId = docSnap.id;
      const memberSnap = await getDoc(doc(db, GROUPS_COLLECTION, groupId, "members", uid));
      if (memberSnap.exists()) {
        userGroups.push({ ...docSnap.data(), id: groupId, myRole: memberSnap.data().role });
      }
    }

    return userGroups;
  } catch (err) {
    console.warn("getUserGroups notice:", err);
    return [];
  }
}
