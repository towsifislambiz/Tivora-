import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyA3rVPzDS-Caf_DdCcgReYdR3zRi11rMT8",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "tivora-2abd2.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "tivora-2abd2",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "tivora-2abd2.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "134721635663",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:134721635663:web:78bdcc75c0281e0a71713a"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

/**
 * Firestore with an IndexedDB-backed local cache.
 *
 * Without this every query is a network round-trip (~335ms measured), so each
 * screen change showed a spinner even for data already fetched a moment
 * earlier. With persistence, repeat reads resolve from disk immediately and
 * onSnapshot fires cached results first, then reconciles with the server — so
 * navigation renders instantly and updates in place.
 *
 * persistentMultipleTabManager keeps several open tabs sharing one cache
 * instead of the older behaviour where only the first tab got persistence.
 */
function createDb() {
  try {
    return initializeFirestore(app, {
      localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    });
  } catch (err) {
    // Private browsing, disabled storage, or an already-initialised instance
    // (e.g. HMR re-running this module). Memory cache still works.
    console.warn("Firestore persistent cache unavailable, using memory cache:", err?.message);
    return getFirestore(app);
  }
}

export const db = createDb();
export const storage = getStorage(app);

export default app;
