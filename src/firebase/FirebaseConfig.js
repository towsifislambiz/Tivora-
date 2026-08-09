import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
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
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
