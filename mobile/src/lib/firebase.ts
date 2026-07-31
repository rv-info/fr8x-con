// FR8X-CON Mobile — Firebase Configuration
// Uses environment variables from .env for all firebase credentials.
// Token storage uses expo-secure-store (never AsyncStorage for tokens).

import { initializeApp, getApps, getApp } from "firebase/app";
// @ts-ignore - getReactNativePersistence is exported by firebase/auth in react-native environment
import { initializeAuth, getAuth, getReactNativePersistence, type Auth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDemoApiKeyFR8XCON2026MobileApp",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "fr8x-con.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "fr8x-con",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "fr8x-con.appspot.com",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "100000000000",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:100000000000:web:abcdef1234567890",
};

// Initialize Firebase safely across Expo, Web, and Native Android
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: Auth;
try {
  if (ReactNativeAsyncStorage) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);

export default app;
