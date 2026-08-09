import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updateProfile
} from "firebase/auth";
import { auth } from "./FirebaseConfig";
import { generateUniqueUsername, reserveUsernameAndCreateProfile } from "./profileService";

export const DEMO_EMAIL = "demo@tivora.app";

/**
 * Sign up new user with Email, Password & Display Name
 * Automatically generates & reserves unique Tivora username (Facebook style)
 */
export async function signUp(email, password, displayName) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update Auth Profile Display Name
  if (displayName) {
    await updateProfile(user, { displayName });
  }

  // Auto-generate unique Tivora username
  const isDemo = email.toLowerCase() === DEMO_EMAIL.toLowerCase();
  const autoUsername = isDemo ? "ethancarter" : await generateUniqueUsername(displayName, email, user.uid);

  // Reserve username & create Firestore profile document
  await reserveUsernameAndCreateProfile(user.uid, autoUsername, {
    displayName: displayName || "Tivora User",
    email: user.email,
    isDemo,
    emailVerified: user.emailVerified || isDemo
  });

  // Send Verification Email for normal users
  if (!isDemo) {
    await sendEmailVerification(user);
  }

  return user;
}

/**
 * Sign in existing user with Email & Password
 */
export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign out current user
 */
export async function signOutUser() {
  await signOut(auth);
}

/**
 * Send password reset email
 */
export async function resetPassword(email) {
  await sendPasswordResetEmail(auth, email);
}

/**
 * Resend email verification link
 */
export async function resendVerificationLink(user) {
  if (user && user.email !== DEMO_EMAIL) {
    await sendEmailVerification(user);
  }
}

/**
 * Reload Firebase user object to check latest verification status
 */
export async function reloadUser(user) {
  if (user) {
    await user.reload();
    return auth.currentUser;
  }
  return null;
}
