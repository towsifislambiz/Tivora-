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
  increment,
  serverTimestamp
} from "firebase/firestore";
import { db } from "./FirebaseConfig";
import { getPostById } from "./postService";
import { createNotification } from "./notificationService";
import { getUserDocument } from "./firestore";

const POSTS_COLLECTION = "posts";

/**
 * ----------------------------------------------------
 * LIKES SYSTEM (Atomic & Idempotent: posts/{postId}/likes/{uid})
 * ----------------------------------------------------
 */

/**
 * Like a post atomically
 * @param {string} postId 
 * @param {string} uid 
 * @param {Object} [actorData] - { displayName, username, photoURL }
 */
export async function likePost(postId, uid, actorData = {}) {
  if (!postId || !uid) throw new Error("postId and uid are required to like a post.");

  const likeRef = doc(db, POSTS_COLLECTION, postId, "likes", uid);
  const postRef = doc(db, POSTS_COLLECTION, postId);

  let targetAuthorId = null;

  const result = await runTransaction(db, async (transaction) => {
    const likeSnap = await transaction.get(likeRef);
    if (likeSnap.exists()) {
      return false; // Already liked
    }

    const postSnap = await transaction.get(postRef);
    if (!postSnap.exists()) {
      throw new Error("Post does not exist.");
    }

    const postData = postSnap.data();
    targetAuthorId = postData.authorId;
    const currentLikes = postData.likeCount || 0;

    transaction.set(likeRef, {
      uid,
      likedAt: serverTimestamp()
    });

    transaction.update(postRef, {
      likeCount: currentLikes + 1,
      updatedAt: serverTimestamp()
    });

    return true;
  });

  // Create notification if like was added and not self-like
  if (result && targetAuthorId && targetAuthorId !== uid) {
    createNotification({
      recipientId: targetAuthorId,
      actorId: uid,
      actorDisplayName: actorData.displayName || "Tivora User",
      actorUsername: actorData.username || "user",
      actorPhotoURL: actorData.photoURL || "",
      type: "post_like",
      message: "liked your post.",
      relatedId: postId,
      postId
    });
  }

  return result;
}

/**
 * Unlike a post atomically
 * @param {string} postId 
 * @param {string} uid 
 */
export async function unlikePost(postId, uid) {
  if (!postId || !uid) throw new Error("postId and uid are required to unlike a post.");

  const likeRef = doc(db, POSTS_COLLECTION, postId, "likes", uid);
  const postRef = doc(db, POSTS_COLLECTION, postId);

  return await runTransaction(db, async (transaction) => {
    const likeSnap = await transaction.get(likeRef);
    if (!likeSnap.exists()) {
      return false; // Not liked
    }

    const postSnap = await transaction.get(postRef);
    const currentLikes = postSnap.exists() ? (postSnap.data().likeCount || 0) : 1;
    const nextLikeCount = Math.max(0, currentLikes - 1);

    transaction.delete(likeRef);

    if (postSnap.exists()) {
      transaction.update(postRef, {
        likeCount: nextLikeCount,
        updatedAt: serverTimestamp()
      });
    }

    return true;
  });
}

/**
 * Check if a user has liked a specific post
 * @param {string} postId 
 * @param {string} uid 
 */
export async function checkUserLiked(postId, uid) {
  if (!postId || !uid) return false;
  try {
    const likeRef = doc(db, POSTS_COLLECTION, postId, "likes", uid);
    const snap = await getDoc(likeRef);
    return snap.exists();
  } catch (err) {
    console.warn("Check user liked error:", err);
    return false;
  }
}

/**
 * Fetch list of user profiles who liked a specific post
 * @param {string} postId 
 */
export async function getPostLikers(postId) {
  if (!postId) return [];
  try {
    const likesRef = collection(db, POSTS_COLLECTION, postId, "likes");
    const snap = await getDocs(likesRef);
    const uids = snap.docs.map((docSnap) => docSnap.id);

    if (uids.length === 0) return [];

    const likers = await Promise.all(
      uids.map(async (uid) => {
        const userDoc = await getUserDocument(uid);
        if (userDoc) return userDoc;
        return { uid, displayName: 'Tivora User', username: 'user' };
      })
    );

    return likers.filter(Boolean);
  } catch (err) {
    console.warn("getPostLikers error:", err);
    return [];
  }
}

/**
 * ----------------------------------------------------
 * COMMENTS SYSTEM (posts/{postId}/comments/{commentId})
 * ----------------------------------------------------
 */

/**
 * Add a comment to a post atomically
 * @param {string} postId 
 * @param {Object} author - { uid, username, displayName, photoURL }
 * @param {string} text 
 */
export async function addComment(postId, author, text) {
  if (!postId || !author || !author.uid) {
    throw new Error("Post ID and Author info are required to comment.");
  }

  const trimmedText = (text || "").trim();
  if (!trimmedText) {
    throw new Error("Comment text cannot be empty.");
  }

  const commentRef = doc(collection(db, POSTS_COLLECTION, postId, "comments"));
  const commentId = commentRef.id;
  const postRef = doc(db, POSTS_COLLECTION, postId);

  const commentData = {
    id: commentId,
    postId,
    authorId: author.uid,
    authorUsername: author.username || "user",
    authorDisplayName: author.displayName || "Tivora User",
    authorPhotoURL: author.photoURL || "",
    text: trimmedText,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  let targetAuthorId = null;

  await runTransaction(db, async (transaction) => {
    const postSnap = await transaction.get(postRef);
    if (!postSnap.exists()) throw new Error("Post does not exist.");

    const postData = postSnap.data();
    targetAuthorId = postData.authorId;
    const currentComments = postData.commentCount || 0;

    transaction.set(commentRef, commentData);
    transaction.update(postRef, {
      commentCount: currentComments + 1,
      updatedAt: serverTimestamp()
    });
  });

  // Create notification if commenter is not post author
  if (targetAuthorId && targetAuthorId !== author.uid) {
    createNotification({
      recipientId: targetAuthorId,
      actorId: author.uid,
      actorDisplayName: author.displayName || "Tivora User",
      actorUsername: author.username || "user",
      actorPhotoURL: author.photoURL || "",
      type: "post_comment",
      message: "commented on your post.",
      relatedId: postId,
      postId,
      commentId
    });
  }

  return {
    ...commentData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Fetch comments for a post with pagination
 * @param {string} postId 
 * @param {number} limitCount 
 * @param {Object} [lastDocSnap] 
 */
export async function getComments(postId, limitCount = 10, lastDocSnap = null) {
  if (!postId) return { comments: [], lastDocSnap: null };

  try {
    const commentsRef = collection(db, POSTS_COLLECTION, postId, "comments");
    let q;

    if (lastDocSnap) {
      q = query(commentsRef, orderBy("createdAt", "asc"), startAfter(lastDocSnap), limit(limitCount));
    } else {
      q = query(commentsRef, orderBy("createdAt", "asc"), limit(limitCount));
    }

    const snap = await getDocs(q);
    const comments = [];
    let newLastDoc = null;

    snap.forEach((docSnap) => {
      comments.push({ ...docSnap.data(), id: docSnap.id });
      newLastDoc = docSnap;
    });

    return { comments, lastDocSnap: newLastDoc };
  } catch (err) {
    console.warn("Get comments error:", err);
    return { comments: [], lastDocSnap: null };
  }
}

/**
 * Real-time subscription to comments for an open post
 * @param {string} postId 
 * @param {function} callback 
 */
export function subscribeToComments(postId, callback) {
  if (!postId) return () => {};

  const commentsRef = collection(db, POSTS_COLLECTION, postId, "comments");
  const q = query(commentsRef, orderBy("createdAt", "asc"), limit(30));

  return onSnapshot(q, (snapshot) => {
    const comments = [];
    snapshot.forEach((docSnap) => {
      comments.push({ ...docSnap.data(), id: docSnap.id });
    });
    callback(comments);
  }, (err) => {
    console.warn("Comments subscription notice:", err);
  });
}

/**
 * Update an existing comment
 * @param {string} postId 
 * @param {string} commentId 
 * @param {string} authorId 
 * @param {string} newText 
 */
export async function updateComment(postId, commentId, authorId, newText) {
  if (!postId || !commentId || !authorId) {
    throw new Error("postId, commentId and authorId are required.");
  }

  const trimmed = (newText || "").trim();
  if (!trimmed) throw new Error("Comment text cannot be empty.");

  const commentRef = doc(db, POSTS_COLLECTION, postId, "comments", commentId);
  const snap = await getDoc(commentRef);

  if (!snap.exists()) throw new Error("Comment does not exist.");
  if (snap.data().authorId !== authorId) {
    throw new Error("Permission Denied: You can only edit your own comment.");
  }

  await updateDoc(commentRef, {
    text: trimmed,
    updatedAt: serverTimestamp(),
    isEdited: true
  });

  return { ...snap.data(), text: trimmed, isEdited: true, updatedAt: new Date().toISOString() };
}

/**
 * Delete a comment atomically
 * @param {string} postId 
 * @param {string} commentId 
 * @param {string} authorId 
 */
export async function deleteComment(postId, commentId, authorId) {
  if (!postId || !commentId || !authorId) {
    throw new Error("postId, commentId and authorId are required.");
  }

  const commentRef = doc(db, POSTS_COLLECTION, postId, "comments", commentId);
  const postRef = doc(db, POSTS_COLLECTION, postId);

  return await runTransaction(db, async (transaction) => {
    const commentSnap = await transaction.get(commentRef);
    if (!commentSnap.exists()) return true;

    if (commentSnap.data().authorId !== authorId) {
      throw new Error("Permission Denied: You can only delete your own comment.");
    }

    const postSnap = await transaction.get(postRef);
    const currentComments = postSnap.exists() ? (postSnap.data().commentCount || 0) : 1;
    const nextCommentCount = Math.max(0, currentComments - 1);

    transaction.delete(commentRef);

    if (postSnap.exists()) {
      transaction.update(postRef, {
        commentCount: nextCommentCount,
        updatedAt: serverTimestamp()
      });
    }

    return true;
  });
}

/**
 * ----------------------------------------------------
 * SAVED POSTS SYSTEM (users/{uid}/savedPosts/{postId})
 * ----------------------------------------------------
 */

/**
 * Save a post for user
 * @param {string} uid 
 * @param {string} postId 
 */
export async function savePost(uid, postId) {
  if (!uid || !postId) throw new Error("UID and postId required to save post.");

  const savedRef = doc(db, "users", uid, "savedPosts", postId);
  await setDoc(savedRef, {
    postId,
    savedAt: serverTimestamp()
  }, { merge: true });

  return true;
}

/**
 * Unsave a post for user
 * @param {string} uid 
 * @param {string} postId 
 */
export async function unsavePost(uid, postId) {
  if (!uid || !postId) throw new Error("UID and postId required to unsave post.");

  const savedRef = doc(db, "users", uid, "savedPosts", postId);
  await deleteDoc(savedRef);
  return true;
}

/**
 * Check if a user has saved a post
 * @param {string} uid 
 * @param {string} postId 
 */
export async function checkUserSaved(uid, postId) {
  if (!uid || !postId) return false;
  try {
    const savedRef = doc(db, "users", uid, "savedPosts", postId);
    const snap = await getDoc(savedRef);
    return snap.exists();
  } catch (err) {
    console.warn("Check user saved error:", err);
    return false;
  }
}

/**
 * Fetch saved posts for a user with pagination
 * @param {string} uid 
 * @param {number} limitCount 
 * @param {Object} [lastDocSnap] 
 */
export async function getSavedPosts(uid, limitCount = 10, lastDocSnap = null) {
  if (!uid) return { posts: [], lastDocSnap: null };

  try {
    const savedCollectionRef = collection(db, "users", uid, "savedPosts");
    let q;

    if (lastDocSnap) {
      q = query(savedCollectionRef, orderBy("savedAt", "desc"), startAfter(lastDocSnap), limit(limitCount));
    } else {
      q = query(savedCollectionRef, orderBy("savedAt", "desc"), limit(limitCount));
    }

    const snap = await getDocs(q);
    const posts = [];
    let newLastDoc = null;

    for (const docSnap of snap.docs) {
      const { postId } = docSnap.data();
      newLastDoc = docSnap;
      if (postId) {
        const fullPost = await getPostById(postId);
        if (fullPost) {
          posts.push(fullPost);
        }
      }
    }

    return { posts, lastDocSnap: newLastDoc };
  } catch (err) {
    console.warn("Get saved posts error:", err);
    return { posts: [], lastDocSnap: null };
  }
}

/**
 * ----------------------------------------------------
 * SHARE TRACKING SYSTEM (posts/{postId}/shares/{uid})
 * Unique share counting per user
 * ----------------------------------------------------
 */

/**
 * Atomically track a unique user share and increment shareCount
 * @param {string} postId 
 * @param {string} uid 
 * @param {Object} [actorData] - { displayName, username, photoURL }
 */
export async function sharePost(postId, uid, actorData = {}) {
  if (!postId) return false;

  const postUrl = `${window.location.origin}/#post/${postId}`;

  if (!uid) return postUrl;

  const shareRef = doc(db, POSTS_COLLECTION, postId, "shares", uid);
  const postRef = doc(db, POSTS_COLLECTION, postId);

  let targetAuthorId = null;

  try {
    await runTransaction(db, async (transaction) => {
      const shareSnap = await transaction.get(shareRef);
      if (shareSnap.exists()) {
        return; // User already shared this post
      }

      const postSnap = await transaction.get(postRef);
      if (!postSnap.exists()) return;

      const postData = postSnap.data();
      targetAuthorId = postData.authorId;
      const currentShares = postData.shareCount || 0;

      transaction.set(shareRef, {
        uid,
        sharedAt: serverTimestamp()
      });

      transaction.update(postRef, {
        shareCount: currentShares + 1,
        updatedAt: serverTimestamp()
      });
    });

    if (targetAuthorId && targetAuthorId !== uid) {
      createNotification({
        recipientId: targetAuthorId,
        actorId: uid,
        actorDisplayName: actorData.displayName || "Tivora User",
        actorUsername: actorData.username || "user",
        actorPhotoURL: actorData.photoURL || "",
        type: "post_share",
        message: "shared your post.",
        relatedId: postId,
        postId
      });
    }
  } catch (err) {
    console.warn("Share tracking notice:", err);
  }

  return postUrl;
}
