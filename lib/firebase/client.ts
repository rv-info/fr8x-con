import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { getAnalytics, Analytics, isSupported } from 'firebase/analytics';

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""
};

/**
 * Validates that essential Firebase client configuration is present.
 * In development, emits descriptive warnings to assist local setup.
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

// Initialize Firebase client instance safely across Next.js SSR / SSG / Browser
let app: FirebaseApp;
try {
  if (getApps().length > 0) {
    app = getApp();
  } else if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);
  } else {
    // Graceful fallback for build-time static generation without runtime crash
    app = initializeApp({
      apiKey: "build-placeholder-key",
      projectId: "fr8x-con",
      appId: "build-placeholder-app-id"
    }, "BUILD_FALLBACK");
  }
} catch {
  app = getApps()[0] || initializeApp({
    apiKey: "build-placeholder-key",
    projectId: "fr8x-con",
    appId: "build-placeholder-app-id"
  });
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

