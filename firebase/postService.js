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
  serverTimestamp
} from "firebase/firestore";
import { db } from "./FirebaseConfig";
import { uploadPostImage, deletePostImage } from "./storageService";
import { compressAndResizeImage } from "../utils/imageOptimizer";

const POSTS_COLLECTION = "posts";

/**
 * Generate a new unique post ID before creation
 */
export function generatePostId() {
  return doc(collection(db, POSTS_COLLECTION)).id;
}

/**
 * Creates a new post document in top-level posts/{postId}
 * @param {Object} author - { uid, username, displayName, photoURL }
 * @param {string} content 
 * @param {File|string|null} imageFileOrDataUrl 
 */
export async function createPost(author, content = "", imageFileOrDataUrl = null) {
  if (!author || !author.uid) {
    throw new Error("Authenticated author UID is required to create a post.");
  }

  const trimmedContent = (content || "").trim();
  if (!trimmedContent && !imageFileOrDataUrl) {
    throw new Error("A post must contain either text content or an image.");
  }

  const postId = generatePostId();
  let finalImageURL = null;

  if (imageFileOrDataUrl) {
    if (typeof imageFileOrDataUrl === "string") {
      finalImageURL = imageFileOrDataUrl;
    } else if (imageFileOrDataUrl instanceof File) {
      // 1. Try Firebase Storage upload
      try {
        const storageURL = await uploadPostImage(author.uid, postId, imageFileOrDataUrl);
        if (storageURL) {
          finalImageURL = storageURL;
        } else {
          // Fallback to client-side compressed Data URL
          finalImageURL = await compressAndResizeImage(imageFileOrDataUrl, 1080, 1080, 150);
        }
      } catch (err) {
        console.warn("Storage upload notice, utilizing compressed fallback:", err);
        finalImageURL = await compressAndResizeImage(imageFileOrDataUrl, 1080, 1080, 150);
      }
    }
  }

  const postDocData = {
    id: postId,
    authorId: author.uid,
    authorUsername: author.username || "user",
    authorDisplayName: author.displayName || "Tivora User",
    authorPhotoURL: author.photoURL || "",
    content: trimmedContent,
    imageURL: finalImageURL,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    likeCount: 0,
    commentCount: 0,
    shareCount: 0
  };

  const postRef = doc(db, POSTS_COLLECTION, postId);
  await setDoc(postRef, postDocData);

  return {
    ...postDocData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Fetch home feed posts with pagination (orderBy createdAt desc)
 * @param {number} limitCount 
 * @param {Object} [lastDocSnap] 
 */
export async function getHomeFeedPosts(limitCount = 10, lastDocSnap = null) {
  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    let q;

    if (lastDocSnap) {
      q = query(
        postsRef,
        orderBy("createdAt", "desc"),
        startAfter(lastDocSnap),
        limit(limitCount)
      );
    } else {
      q = query(
        postsRef,
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
    }

    const querySnapshot = await getDocs(q);
    const posts = [];
    let newLastDoc = null;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      posts.push({
        ...data,
        id: docSnap.id
      });
      newLastDoc = docSnap;
    });

    return { posts, lastDocSnap: newLastDoc };
  } catch (error) {
    console.warn("Error fetching home feed posts:", error);
    return { posts: [], lastDocSnap: null };
  }
}

/**
 * Fetch user posts for profile Posts tab (where authorId == uid, orderBy createdAt desc)
 * @param {string} uid 
 * @param {number} limitCount 
 * @param {Object} [lastDocSnap] 
 */
export async function getUserPosts(targetUidOrUsername, limitCount = 20, lastDocSnap = null) {
  if (!targetUidOrUsername) return { posts: [], lastDocSnap: null };

  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    
    // Query 1: by authorId == targetUidOrUsername
    const q1 = query(postsRef, where("authorId", "==", targetUidOrUsername), limit(limitCount));
    // Query 2: by authorUsername == targetUidOrUsername
    const q2 = query(postsRef, where("authorUsername", "==", targetUidOrUsername), limit(limitCount));

    const [snap1, snap2] = await Promise.all([
      getDocs(q1).catch(() => ({ docs: [] })),
      getDocs(q2).catch(() => ({ docs: [] }))
    ]);

    const postMap = new Map();
    [...snap1.docs, ...snap2.docs].forEach((docSnap) => {
      postMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id });
    });

    const posts = Array.from(postMap.values());

    // Sort client-side by createdAt descending
    posts.sort((a, b) => {
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });

    return { posts, lastDocSnap: null };
  } catch (error) {
    console.warn("Error fetching user posts:", error);
    return { posts: [], lastDocSnap: null };
  }
}

/**
 * Real-time subscription to a user's posts
 * @param {string} targetUidOrUsername 
 * @param {function} callback 
 */
export function subscribeToUserPosts(targetUidOrUsername, callback) {
  if (!targetUidOrUsername) return () => {};

  const postsRef = collection(db, POSTS_COLLECTION);
  const q = query(postsRef, where("authorId", "==", targetUidOrUsername), limit(20));

  return onSnapshot(q, (snapshot) => {
    const posts = [];
    snapshot.forEach((docSnap) => {
      posts.push({ ...docSnap.data(), id: docSnap.id });
    });

    posts.sort((a, b) => {
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });

    callback(posts);
  }, (err) => {
    console.warn("User posts subscription notice:", err);
  });
}

/**
 * Fetch a single post by ID from top-level posts/{postId}
 * @param {string} postId 
 */
export async function getPostById(postId) {
  if (!postId) return null;

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return null;

    return {
      ...postSnap.data(),
      id: postSnap.id
    };
  } catch (error) {
    console.warn("Error fetching post by ID:", error);
    return null;
  }
}

/**
 * Update an existing post (content or image) for post owner
 * @param {string} postId 
 * @param {string} authorId 
 * @param {string} newContent 
 * @param {File|string|null} newImageFileOrDataUrl 
 * @param {boolean} [removeExistingImage=false] 
 */
export async function updatePost(postId, authorId, newContent, newImageFileOrDataUrl = null, removeExistingImage = false) {
  if (!postId || !authorId) {
    throw new Error("Post ID and Author UID are required to update a post.");
  }

  const postRef = doc(db, POSTS_COLLECTION, postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    throw new Error("Post does not exist.");
  }

  const existingData = postSnap.data();
  if (existingData.authorId !== authorId) {
    throw new Error("Permission Denied: You can only edit your own posts.");
  }

  let updatedImageURL = existingData.imageURL;

  if (removeExistingImage) {
    if (existingData.imageURL) {
      await deletePostImage(existingData.imageURL);
    }
    updatedImageURL = null;
  } else if (newImageFileOrDataUrl) {
    if (typeof newImageFileOrDataUrl === "string") {
      updatedImageURL = newImageFileOrDataUrl;
    } else if (newImageFileOrDataUrl instanceof File) {
      try {
        const storageURL = await uploadPostImage(authorId, postId, newImageFileOrDataUrl);
        if (storageURL) {
          updatedImageURL = storageURL;
        } else {
          updatedImageURL = await compressAndResizeImage(newImageFileOrDataUrl, 1200, 1200, 0.85);
        }
      } catch (err) {
        updatedImageURL = await compressAndResizeImage(newImageFileOrDataUrl, 1200, 1200, 0.85);
      }
    }
  }

  const updatePayload = {
    content: (newContent || "").trim(),
    imageURL: updatedImageURL,
    updatedAt: serverTimestamp()
  };

  await updateDoc(postRef, updatePayload);

  const updatedSnap = await getDoc(postRef);
  return {
    ...updatedSnap.data(),
    id: postId
  };
}

/**
 * Delete a post from top-level posts/{postId} and Storage
 * @param {string} postId 
 * @param {string} authorId 
 * @param {string} [imageURL] 
 */
export async function deletePost(postId, authorId, imageURL = null) {
  if (!postId || !authorId) {
    throw new Error("Post ID and Author UID are required to delete a post.");
  }

  const postRef = doc(db, POSTS_COLLECTION, postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    return true;
  }

  const data = postSnap.data();
  if (data.authorId !== authorId) {
    throw new Error("Permission Denied: You can only delete your own posts.");
  }

  // 1. Delete Storage image if present
  const targetImageURL = imageURL || data.imageURL;
  if (targetImageURL) {
    await deletePostImage(targetImageURL);
  }

  // 2. Delete Firestore post document
  await deleteDoc(postRef);
  return true;
}

/**
 * Real-time subscription to a single post document for live like/comment counts & content
 * @param {string} postId 
 * @param {function} callback 
 */
export function subscribeToPostDoc(postId, callback) {
  if (!postId) return () => {};
  const postRef = doc(db, POSTS_COLLECTION, postId);
  return onSnapshot(postRef, (snap) => {
    if (snap.exists()) {
      callback({ id: snap.id, ...snap.data() });
    } else {
      callback(null);
    }
  }, (err) => {
    console.warn("Post doc subscription notice:", err);
    callback(null);
  });
}

/**
 * Real-time subscription to global home feed posts (live new posts instantly!)
 * @param {number} limitCount 
 * @param {function} callback 
 */
export function subscribeToHomeFeed(limitCount = 8, callback) {
  const postsRef = collection(db, POSTS_COLLECTION);
  const q = query(postsRef, orderBy("createdAt", "desc"), limit(limitCount));
  return onSnapshot(q, (snapshot) => {
    const posts = [];
    let lastDoc = null;
    snapshot.forEach((docSnap) => {
      posts.push({ ...docSnap.data(), id: docSnap.id });
      lastDoc = docSnap;
    });
    callback({ posts, lastDocSnap: lastDoc });
  }, (err) => {
    console.warn("Home feed subscription notice:", err);
  });
}


