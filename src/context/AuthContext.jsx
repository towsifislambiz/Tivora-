import React, { createContext, useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/FirebaseConfig";
import { 
  DEMO_EMAIL,
  signUp as authSignUp, 
  signIn as authSignIn, 
  signOutUser, 
  resetPassword as authResetPassword,
  resendVerificationLink,
  reloadUser 
} from "../firebase/auth";
import { getUserDocument } from "../firebase/firestore";
import { generateUniqueUsername, reserveUsernameAndCreateProfile, updateUserProfile } from "../firebase/profileService";
import { initPresenceTracker } from "../firebase/presenceService";

export const AuthContext = createContext(null);

const STORAGE_KEY_PREFIX = "tivora_profile_cache_";

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  const isDemoUser = Boolean(
    (currentUser?.email && currentUser.email.toLowerCase() === DEMO_EMAIL.toLowerCase()) ||
    userDoc?.isDemo === true
  );

  useEffect(() => {
    let cleanupPresence = null;

    // Safety max timeout to prevent any stuck splash loader screen
    const maxTimeout = setTimeout(() => {
      setLoading(false);
    }, 800);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Initialize Real-Time Messenger Presence Heartbeat
        if (cleanupPresence) cleanupPresence();
        cleanupPresence = initPresenceTracker(user.uid);

        // 1. Immediately load local persistent cache if available
        const localCacheKey = `${STORAGE_KEY_PREFIX}${user.uid}`;
        const cachedStr = localStorage.getItem(localCacheKey);
        if (cachedStr) {
          try {
            const cachedDoc = JSON.parse(cachedStr);
            setUserDoc(cachedDoc);
          } catch (e) {
            console.warn("Failed to parse cached profile:", e);
          }
        }

        // Unblock splash screen instantly!
        setLoading(false);
        clearTimeout(maxTimeout);

        // 2. Fetch/Initialize Firestore Document in background
        try {
          let docData = await getUserDocument(user.uid);
          
          // Auto-initialize profile with permanent username if doc or username is missing
          if (!docData || !docData.username) {
            const isDemo = user.email && user.email.toLowerCase() === DEMO_EMAIL.toLowerCase();
            const autoUsername = isDemo ? "towsif123" : await generateUniqueUsername(user.displayName, user.email, user.uid);
            
            docData = await reserveUsernameAndCreateProfile(user.uid, autoUsername, {
              displayName: user.displayName || (isDemo ? "Towsif Islam" : "Tivora User"),
              email: user.email || "",
              bio: isDemo ? "Full Stack Developer building digital products & community applications 🚀" : "Building cool digital experiences with Tivora 🚀",
              hobbies: ["Coding", "Gaming", "UI Design"],
              location: isDemo ? "Dhaka, Bangladesh" : "San Francisco, CA",
              isDemo,
              emailVerified: user.emailVerified || isDemo
            });
          }

          // Save to state and update local storage cache
          if (docData) {
            setUserDoc(docData);
            localStorage.setItem(localCacheKey, JSON.stringify(docData));
          }
        } catch (err) {
          console.error("Error fetching user document from Firestore:", err);
        }
      } else {
        if (cleanupPresence) cleanupPresence();
        setCurrentUser(null);
        setUserDoc(null);
        setLoading(false);
        clearTimeout(maxTimeout);
      }
    });

    return () => {
      clearTimeout(maxTimeout);
      if (cleanupPresence) cleanupPresence();
      unsubscribe();
    };
  }, []);

  const handleSignUp = async (email, password, displayName) => {
    return await authSignUp(email, password, displayName);
  };

  const handleSignIn = async (email, password) => {
    return await authSignIn(email, password);
  };

  const handleDemoSignIn = async () => {
    const demoPassword = "DemoUser123!";
    const demoName = "Towsif Islam";

    try {
      return await authSignIn(DEMO_EMAIL, demoPassword);
    } catch (err) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        const user = await authSignUp(DEMO_EMAIL, demoPassword, demoName);
        return user;
      }
      throw err;
    }
  };

  const handleLogout = async () => {
    if (currentUser?.uid) {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${currentUser.uid}`);
    }
    return await signOutUser();
  };

  const handleResetPassword = async (email) => {
    return await authResetPassword(email);
  };

  const handleResendVerification = async () => {
    if (auth.currentUser && !isDemoUser) {
      return await resendVerificationLink(auth.currentUser);
    }
  };

  const handleRefreshUser = async () => {
    if (auth.currentUser) {
      const refreshed = await reloadUser(auth.currentUser);
      setCurrentUser(refreshed);
      if (refreshed) {
        const docData = await getUserDocument(refreshed.uid);
        if (docData) {
          setUserDoc(docData);
          localStorage.setItem(`${STORAGE_KEY_PREFIX}${refreshed.uid}`, JSON.stringify(docData));
        }
      }
      return refreshed;
    }
    return null;
  };

  const handleUpdateProfile = async (editableProfileData) => {
    if (!currentUser) return null;

    // 1. Prepare merged updated document
    const updatedDoc = {
      ...(userDoc || {}),
      uid: currentUser.uid,
      displayName: editableProfileData.displayName !== undefined ? editableProfileData.displayName : userDoc?.displayName,
      photoURL: editableProfileData.photoURL !== undefined ? editableProfileData.photoURL : userDoc?.photoURL,
      coverPhotoURL: editableProfileData.coverPhotoURL !== undefined ? editableProfileData.coverPhotoURL : (userDoc?.coverPhotoURL || userDoc?.coverURL),
      bio: editableProfileData.bio !== undefined ? editableProfileData.bio : userDoc?.bio,
      location: editableProfileData.location !== undefined ? editableProfileData.location : userDoc?.location,
      hobbies: Array.isArray(editableProfileData.hobbies) ? editableProfileData.hobbies : userDoc?.hobbies,
      updatedAt: new Date().toISOString()
    };

    // 2. Immediately update local state & local storage cache so reload NEVER loses data
    setUserDoc(updatedDoc);
    const localCacheKey = `${STORAGE_KEY_PREFIX}${currentUser.uid}`;
    localStorage.setItem(localCacheKey, JSON.stringify(updatedDoc));

    // 3. Persist to Firestore in background
    try {
      const firestoreResult = await updateUserProfile(currentUser.uid, editableProfileData);
      if (firestoreResult) {
        const merged = { ...updatedDoc, ...firestoreResult };
        setUserDoc(merged);
        localStorage.setItem(localCacheKey, JSON.stringify(merged));
      }
    } catch (err) {
      console.warn("Firestore profile update saved locally, sync warning:", err);
    }

    return updatedDoc;
  };

  const value = {
    currentUser,
    userDoc,
    isDemoUser,
    loading,
    signUp: handleSignUp,
    signIn: handleSignIn,
    demoSignIn: handleDemoSignIn,
    logout: handleLogout,
    resetPassword: handleResetPassword,
    resendVerification: handleResendVerification,
    refreshUser: handleRefreshUser,
    updateProfileData: handleUpdateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
