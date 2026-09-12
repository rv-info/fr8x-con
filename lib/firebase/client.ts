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

// Initialize Firebase client instance safely
let app: FirebaseApp;
try {
  app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
} catch {
  app = getApps()[0];
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

// Safe Client Analytics Initializer
let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      analytics = getAnalytics(app);
    }
  }).catch(() => {});
}

export { analytics };
export default app;
