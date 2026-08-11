import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./FirebaseConfig";

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

/**
 * Validates image file type and size
 * @param {File} file 
 */
export function validateImageFile(file) {
  if (!file) {
    throw new Error("No file selected.");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("Only image files (JPEG, PNG, WEBP) are supported.");
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error("File size exceeds 10MB limit. Please choose a smaller image.");
  }
  return true;
}

/**
 * Uploads a profile picture to users/{uid}/profile/{filename} in Firebase Storage
 * @param {string} uid 
 * @param {File} file 
 * @returns {Promise<string>} download URL
 */
export async function uploadProfileImage(uid, file) {
  validateImageFile(file);
  const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
  const filePath = `users/${uid}/profile/${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, filePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading profile image to Firebase Storage:", error);
    if (error.code === 'storage/unauthorized') {
      throw new Error("Storage Permission Denied. Please update Firebase Storage Security Rules.");
    }
    if (error.code === 'storage/project-not-found' || error.code === 'storage/bucket-not-found') {
      throw new Error("Firebase Storage bucket is not created yet in Firebase Console.");
    }
    throw new Error("Failed to upload profile picture. Please make sure Firebase Storage is enabled.");
  }
}

/**
 * Uploads a cover photo to users/{uid}/cover/{filename} in Firebase Storage
 * @param {string} uid 
 * @param {File} file 
 * @returns {Promise<string>} download URL
 */
export async function uploadCoverImage(uid, file) {
  validateImageFile(file);
  const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
  const filePath = `users/${uid}/cover/${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, filePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error("Error uploading cover image to Firebase Storage:", error);
    if (error.code === 'storage/unauthorized') {
      throw new Error("Storage Permission Denied. Please update Firebase Storage Security Rules.");
    }
    if (error.code === 'storage/project-not-found' || error.code === 'storage/bucket-not-found') {
      throw new Error("Firebase Storage bucket is not created yet in Firebase Console.");
    }
    throw new Error("Failed to upload cover photo. Please make sure Firebase Storage is enabled.");
  }
}

/**
 * Uploads a post image to users/{uid}/posts/{postId}/{filename} in Firebase Storage
 * @param {string} uid 
 * @param {string} postId 
 * @param {File} file 
 * @returns {Promise<string>} download URL
 */
export async function uploadPostImage(uid, postId, file) {
  validateImageFile(file);
  const fileExt = file.name ? file.name.split('.').pop() : 'jpg';
  const filePath = `users/${uid}/posts/${postId}/${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, filePath);

  try {
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.warn("Firebase Storage post image upload notice:", error);
    // If Storage bucket is not enabled or throws error, return null so fallback Data URL is used seamlessly
    return null;
  }
}

/**
 * Delete a post image from Storage if it is a Storage URL
 * @param {string} imageURL 
 */
export async function deletePostImage(imageURL) {
  if (!imageURL || !imageURL.includes("firebasestorage")) return;
  try {
    const storageRef = ref(storage, imageURL);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn("Storage image deletion notice:", err);
  }
}
