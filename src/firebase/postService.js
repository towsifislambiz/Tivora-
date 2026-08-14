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
import { getFriends } from "./friendService";

const POSTS_COLLECTION = "posts";

/**
 * Dedicated Demo Sample Posts for Demo Account isolation
 */
export const DEMO_MOCK_POSTS = [
  {
    id: "demo_post_welcome",
    authorId: "demo_user_bot",
    authorUsername: "tivorabot",
    authorDisplayName: "Tivora Bot 🤖",
    authorPhotoURL: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
    content: "Welcome to Tivora Demo Mode! 🤖✨\n\nYou are exploring Tivora with a Demo Guest Account. Real user posts and private profile feeds are completely isolated from demo accounts. Feel free to preview UI elements, light/dark themes, and social features here!\n\nTo publish your own real posts to real users, sign up for a free Tivora account! 🚀",
    imageURL: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=800&q=80",
    privacy: "public",
    isDemo: true,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    likeCount: 42,
    commentCount: 8,
    shareCount: 12
  },
  {
    id: "demo_post_privacy_guide",
    authorId: "demo_user_bot",
    authorUsername: "tivorabot",
    authorDisplayName: "Tivora Bot 🤖",
    authorPhotoURL: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=200&q=80",
    content: "🔒 Facebook-Style Audience Control Feature!\n\nWhen creating a post on Tivora, you can choose who sees your content:\n• 🌐 Public — Visible to all Tivora members in the main feed\n• 👥 Friends — Visible ONLY to accepted friends in your friend list!\n\nSign up today to test audience privacy controls with your friends!",
    imageURL: "https://images.unsplash.com/photo-1522542550221-31fd19575a2d?auto=format&fit=crop&w=800&q=80",
    privacy: "friends",
    isDemo: true,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    likeCount: 89,
    commentCount: 15,
    shareCount: 24
  }
];

/**
 * Helper to fetch friend UIDs set for privacy matching
 */
export async function getFriendUidsSet(uid) {
  if (!uid) return new Set();
  try {
    const { friends } = await getFriends(uid, 100);
    return new Set(friends.map(f => f.uid || f.id));
  } catch (e) {
    return new Set();
  }
}

/**
 * Filter posts by privacy rules & demo user status
 */
export function filterPostsByPrivacy(posts, currentUid, isDemoUser = false, friendUidsSet = new Set()) {
  if (isDemoUser) {
    return DEMO_MOCK_POSTS;
  }

  return posts.filter(post => {
    // Hide demo posts from real users
    if (post.isDemo) return false;

    const privacy = post.privacy || 'public';

    // Public posts are visible to all real users
    if (privacy === 'public') return true;

    // Friends-only post: visible to author and accepted friends
    if (privacy === 'friends') {
      if (!currentUid) return false;
      if (post.authorId === currentUid) return true;
      if (friendUidsSet && (friendUidsSet.has(post.authorId) || friendUidsSet.has(post.authorUsername))) return true;
      return false;
    }

    return true;
  });
}

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
 * @param {string} privacy - "public" | "friends"
 */
export async function createPost(author, content = "", imageFileOrDataUrl = null, privacy = "public") {
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
      try {
        const storageURL = await uploadPostImage(author.uid, postId, imageFileOrDataUrl);
        if (storageURL) {
          finalImageURL = storageURL;
        } else {
          finalImageURL = await compressAndResizeImage(imageFileOrDataUrl, 1080, 1080, 150);
        }
      } catch (err) {
        console.warn("Storage upload notice, utilizing compressed fallback:", err);
        finalImageURL = await compressAndResizeImage(imageFileOrDataUrl, 1080, 1080, 150);
      }
    }
  }

  const validPrivacy = (privacy === "friends") ? "friends" : "public";

  const postDocData = {
    id: postId,
    authorId: author.uid,
    authorUsername: author.username || "user",
    authorDisplayName: author.displayName || "Tivora User",
    authorPhotoURL: author.photoURL || "",
    content: trimmedContent,
    imageURL: finalImageURL,
    privacy: validPrivacy,
    isDemo: Boolean(author.isDemo || author.uid === "demo_user"),
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
 * Fetch home feed posts with pagination & privacy filtering
 * @param {number} limitCount 
 * @param {Object} [lastDocSnap] 
 * @param {Object} [userContext] - { currentUid, isDemoUser, friendUidsSet }
 */
export async function getHomeFeedPosts(limitCount = 10, lastDocSnap = null, userContext = {}) {
  const { currentUid = null, isDemoUser = false, friendUidsSet = null } = userContext;

  if (isDemoUser) {
    return { posts: DEMO_MOCK_POSTS, lastDocSnap: null };
  }

  try {
    const friendSet = friendUidsSet || (currentUid ? await getFriendUidsSet(currentUid) : new Set());
    const postsRef = collection(db, POSTS_COLLECTION);
    let q;

    if (lastDocSnap) {
      q = query(
        postsRef,
        orderBy("createdAt", "desc"),
        startAfter(lastDocSnap),
        limit(limitCount * 2)
      );
    } else {
      q = query(
        postsRef,
        orderBy("createdAt", "desc"),
        limit(limitCount * 2)
      );
    }

    const querySnapshot = await getDocs(q);
    const rawPosts = [];
    let newLastDoc = null;

    querySnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      rawPosts.push({
        ...data,
        id: docSnap.id
      });
      newLastDoc = docSnap;
    });

    const filtered = filterPostsByPrivacy(rawPosts, currentUid, false, friendSet).slice(0, limitCount);
    return { posts: filtered, lastDocSnap: newLastDoc };
  } catch (error) {
    console.warn("Error fetching home feed posts:", error);
    return { posts: [], lastDocSnap: null };
  }
}

/**
 * Fetch user posts for profile Posts tab (where authorId == uid)
 */
export async function getUserPosts(targetUidOrUsername, limitCount = 20, lastDocSnap = null, userContext = {}) {
  if (!targetUidOrUsername) return { posts: [], lastDocSnap: null };
  const { currentUid = null, isDemoUser = false, friendUidsSet = null } = userContext;

  if (isDemoUser) {
    return { posts: DEMO_MOCK_POSTS, lastDocSnap: null };
  }

  try {
    const postsRef = collection(db, POSTS_COLLECTION);
    const q1 = query(postsRef, where("authorId", "==", targetUidOrUsername), limit(limitCount));
    const q2 = query(postsRef, where("authorUsername", "==", targetUidOrUsername), limit(limitCount));

    const [snap1, snap2] = await Promise.all([
      getDocs(q1).catch(() => ({ docs: [] })),
      getDocs(q2).catch(() => ({ docs: [] }))
    ]);

    const postMap = new Map();
    [...snap1.docs, ...snap2.docs].forEach((docSnap) => {
      postMap.set(docSnap.id, { ...docSnap.data(), id: docSnap.id });
    });

    const rawPosts = Array.from(postMap.values());

    rawPosts.sort((a, b) => {
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });

    const friendSet = friendUidsSet || (currentUid ? await getFriendUidsSet(currentUid) : new Set());
    const posts = filterPostsByPrivacy(rawPosts, currentUid, false, friendSet);

    return { posts, lastDocSnap: null };
  } catch (error) {
    console.warn("Error fetching user posts:", error);
    return { posts: [], lastDocSnap: null };
  }
}

/**
 * Real-time subscription to a user's posts
 */
export function subscribeToUserPosts(targetUidOrUsername, callback, userContext = {}) {
  if (!targetUidOrUsername) return () => {};
  const { currentUid = null, isDemoUser = false, friendUidsSet = null } = userContext;

  if (isDemoUser) {
    callback(DEMO_MOCK_POSTS);
    return () => {};
  }

  const postsRef = collection(db, POSTS_COLLECTION);
  const q = query(postsRef, where("authorId", "==", targetUidOrUsername), limit(20));

  return onSnapshot(q, async (snapshot) => {
    const rawPosts = [];
    snapshot.forEach((docSnap) => {
      rawPosts.push({ ...docSnap.data(), id: docSnap.id });
    });

    rawPosts.sort((a, b) => {
      const tA = a.createdAt?.toDate ? a.createdAt.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
      const tB = b.createdAt?.toDate ? b.createdAt.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
      return tB - tA;
    });

    const friendSet = friendUidsSet || (currentUid ? await getFriendUidsSet(currentUid) : new Set());
    const posts = filterPostsByPrivacy(rawPosts, currentUid, false, friendSet);
    callback(posts);
  }, (err) => {
    console.warn("User posts subscription notice:", err);
  });
}

/**
 * Fetch a single post by ID from top-level posts/{postId}
 */
export async function getPostById(postId, userContext = {}) {
  if (!postId) return null;
  const { currentUid = null, isDemoUser = false } = userContext;

  if (isDemoUser) {
    return DEMO_MOCK_POSTS.find(p => p.id === postId) || DEMO_MOCK_POSTS[0];
  }

  try {
    const postRef = doc(db, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) return null;

    const post = {
      ...postSnap.data(),
      id: postSnap.id
    };

    if (post.privacy === "friends") {
      const friendSet = currentUid ? await getFriendUidsSet(currentUid) : new Set();
      const isVisible = post.authorId === currentUid || friendSet.has(post.authorId);
      if (!isVisible) return null;
    }

    return post;
  } catch (error) {
    console.warn("Error fetching post by ID:", error);
    return null;
  }
}

/**
 * Update an existing post (content, image, or privacy)
 */
export async function updatePost(postId, authorId, newContent, newImageFileOrDataUrl = null, removeExistingImage = false, privacy = null) {
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

  if (privacy === "public" || privacy === "friends") {
    updatePayload.privacy = privacy;
  }

  await updateDoc(postRef, updatePayload);

  const updatedSnap = await getDoc(postRef);
  return {
    ...updatedSnap.data(),
    id: postId
  };
}

/**
 * Delete a post from top-level posts/{postId} and Storage
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

  const targetImageURL = imageURL || data.imageURL;
  if (targetImageURL) {
    await deletePostImage(targetImageURL);
  }

  await deleteDoc(postRef);
  return true;
}

/**
 * Real-time subscription to a single post document
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
 * Real-time subscription to global home feed posts with privacy filtering
 */
export function subscribeToHomeFeed(limitCount = 10, callback, userContext = {}) {
  const { currentUid = null, isDemoUser = false } = userContext;

  if (isDemoUser) {
    callback({ posts: DEMO_MOCK_POSTS, lastDocSnap: null });
    return () => {};
  }

  const postsRef = collection(db, POSTS_COLLECTION);
  const q = query(postsRef, orderBy("createdAt", "desc"), limit(limitCount * 2));
  
  return onSnapshot(q, async (snapshot) => {
    const rawPosts = [];
    let lastDoc = null;
    snapshot.forEach((docSnap) => {
      rawPosts.push({ ...docSnap.data(), id: docSnap.id });
      lastDoc = docSnap;
    });

    const friendSet = currentUid ? await getFriendUidsSet(currentUid) : new Set();
    const filtered = filterPostsByPrivacy(rawPosts, currentUid, false, friendSet).slice(0, limitCount);
    callback({ posts: filtered, lastDocSnap: lastDoc });
  }, (err) => {
    console.warn("Home feed subscription notice:", err);
  });
}



