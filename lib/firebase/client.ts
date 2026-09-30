import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCTFPoToXBfIk4BFTc13a3x5geBTZlWwjk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fr8x-con.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fr8x-con",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fr8x-con.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "238702195734",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:238702195734:web:3f41aafdea91007747f137",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-PCFCQCEVSF"
};

/**
 * Validates that essential Firebase client configuration is present.
 */
export function validateFirebaseClientConfig(): boolean {
  const missing = Object.entries(firebaseConfig)
    .filter(([k, v]) => k !== 'measurementId' && !v)
    .map(([k]) => k);

  if (missing.length > 0 && typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.warn(`[FR8X Firebase Client] Missing configuration variables: ${missing.join(', ')}. Check .env.local.`);
  }
  return missing.length === 0;
}

// Exactly ONE canonical Firebase client instance
let app: FirebaseApp;
if (getApps().length > 0) {
  app = getApp();
} else {
  app = initializeApp(firebaseConfig);
}

let authInstance: Auth;
try {
  authInstance = getAuth(app);
} catch {
  authInstance = {} as Auth;
}

let dbInstance: Firestore;
try {
  dbInstance = getFirestore(app);
} catch {
  dbInstance = {} as Firestore;
}

let storageInstance: FirebaseStorage;
try {
  storageInstance = getStorage(app);
} catch {
  storageInstance = {} as FirebaseStorage;
}

export const auth: Auth = authInstance;
export const db: Firestore = dbInstance;
export const storage: FirebaseStorage = storageInstance;

// Configure browser auth persistence safely in browser environment
if (typeof window !== 'undefined' && authInstance && typeof authInstance.onAuthStateChanged === 'function') {
  import('firebase/auth').then(({ setPersistence, browserLocalPersistence }) => {
    setPersistence(authInstance, browserLocalPersistence).catch((err) => {
      console.warn('[FR8X Firebase Auth] Persistence setup error:', err?.message || err);
    });
  }).catch(() => {});
}

// Auto-connect to Firebase emulators if configured
import('./emulator').then(({ connectFirebaseEmulators }) => {
  connectFirebaseEmulators(auth, db, storage);
}).catch(() => {});

// Safe Client Analytics Initializer (only runs in browser)
let analytics: Analytics | null = null;
if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { analytics };
export default app;

