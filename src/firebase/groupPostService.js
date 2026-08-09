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
  onSnapshot,
  runTransaction,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./FirebaseConfig";

const GROUPS_COLLECTION = "groups";

/**
 * Create a new post inside a group (`groups/{groupId}/posts/{postId}`)
 * @param {string} groupId 
 * @param {Object} author - { uid, username, displayName, photoURL }
 * @param {Object} postData - { content, imageURL }
 */
export async function createGroupPost(groupId, author, postData) {
  if (!groupId || !author || !author.uid) throw new Error("groupId and Author info required.");

  const content = (postData.content || "").trim();
  const imageURL = postData.imageURL || null;

  if (!content && !imageURL) {
    throw new Error("Group post must contain text or an image.");
  }

  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const postRef = doc(collection(db, GROUPS_COLLECTION, groupId, "posts"));
  const postId = postRef.id;

  const newPost = {
    id: postId,
    groupId,
    authorId: author.uid,
    authorUsername: author.username || "user",
    authorDisplayName: author.displayName || "Tivora User",
    authorPhotoURL: author.photoURL || "",
    content,
    imageURL,
    likeCount: 0,
    commentCount: 0,
    isPinned: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    if (!groupSnap.exists()) throw new Error("Group does not exist.");

    transaction.set(postRef, newPost);
    transaction.update(groupRef, {
      postCount: (groupSnap.data().postCount || 0) + 1,
      updatedAt: serverTimestamp()
    });
  });

  return {
    ...newPost,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Real-time subscription to group feed posts
 * @param {string} groupId 
 * @param {function} callback 
 */
export function subscribeToGroupPosts(groupId, callback) {
  if (!groupId) return () => {};

  const postsRef = collection(db, GROUPS_COLLECTION, groupId, "posts");
  const q = query(postsRef, limit(30));

  return onSnapshot(q, (snapshot) => {
    const posts = [];
    snapshot.forEach((docSnap) => {
      posts.push({ ...docSnap.data(), id: docSnap.id });
    });

    // In-memory sort: Pinned posts first, then newest createdAt
    posts.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : new Date(a.createdAt || 0).getTime();
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : new Date(b.createdAt || 0).getTime();
      return tB - tA;
    });

    callback(posts);
  }, (err) => {
    console.warn("Group posts subscription notice:", err);
    callback([]);
  });
}

/**
 * Pin or Unpin a group post (Admin/Owner action)
 * @param {string} groupId 
 * @param {string} postId 
 * @param {boolean} isPinned 
 */
export async function togglePinGroupPost(groupId, postId, isPinned) {
  if (!groupId || !postId) return;
  const postRef = doc(db, GROUPS_COLLECTION, groupId, "posts", postId);
  await updateDoc(postRef, {
    isPinned: Boolean(isPinned),
    updatedAt: serverTimestamp()
  });
}

/**
 * Delete a group post (Author or Admin/Moderator)
 * @param {string} groupId 
 * @param {string} postId 
 */
export async function deleteGroupPost(groupId, postId) {
  if (!groupId || !postId) return;

  const groupRef = doc(db, GROUPS_COLLECTION, groupId);
  const postRef = doc(db, GROUPS_COLLECTION, groupId, "posts", postId);

  await runTransaction(db, async (transaction) => {
    const groupSnap = await transaction.get(groupRef);
    const postSnap = await transaction.get(postRef);

    if (postSnap.exists()) {
      transaction.delete(postRef);
    }

    if (groupSnap.exists()) {
      transaction.update(groupRef, {
        postCount: Math.max(0, (groupSnap.data().postCount || 1) - 1),
        updatedAt: serverTimestamp()
      });
    }
  });
}
