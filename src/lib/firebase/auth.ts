// FR8X-CON Firebase & Local Demo Auth Helpers

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  OAuthProvider,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
  type UserCredential,
} from "firebase/auth";
import { firebaseAuth } from "./config";
import { setDocument } from "./firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { isDemoCredentialMatch, getDemoUserSession } from "@/lib/config/demoCredentials";
import { sendCustomerPasswordResetEmail } from "@/lib/email/service";

// Auth providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.addScope("email");
microsoftProvider.addScope("profile");

/**
 * Custom event for local demo user auth sync
 */
export const DEMO_AUTH_EVENT = "fr8x_demo_auth_changed";

export function getStoredDemoUser() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("fr8x_demo_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Sign in with email and password (with standalone demo fallback support).
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  const trimmed = email.trim();

  // Check standalone demo credentials file first
  const demoMatch = isDemoCredentialMatch(trimmed, password);
  if (demoMatch) {
    if (typeof window !== "undefined") {
      localStorage.setItem("fr8x_demo_user", JSON.stringify(demoMatch));
      window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
    }
    // Return mock UserCredential object
    return {
      user: {
        uid: demoMatch.id,
        email: demoMatch.email,
        displayName: demoMatch.displayName,
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: "demo-token",
        tenantId: null,
        delete: async () => {},
        getIdToken: async () => "demo-token",
        getIdTokenResult: async () => ({} as any),
        reload: async () => {},
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: "demo",
      } as unknown as FirebaseUser,
      providerId: "demo",
      operationType: "signIn",
    };
  }

  // Live Firebase auth attempt
  try {
    return await signInWithEmailAndPassword(firebaseAuth, trimmed, password);
  } catch (err: unknown) {
    // If demo email but different password, throw invalid password
    const demoSession = getDemoUserSession(trimmed);
    if (demoSession) {
      throw new Error("Invalid email or password.");
    }
    throw err;
  }
}

/**
 * Create a new account with email and password.
 */
export async function createAccountWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<UserCredential> {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth,
    email,
    password
  );
  await updateProfile(credential.user, { displayName });
  return credential;
}

/**
 * Sign in with Google.
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  return signInWithPopup(firebaseAuth, googleProvider);
}

/**
 * Sign in with Microsoft.
 */
export async function signInWithMicrosoft(): Promise<UserCredential> {
  return signInWithPopup(firebaseAuth, microsoftProvider);
}

/**
 * Send password reset email via Zoho SMTP / /api/send-email.
 */
export async function resetPassword(email: string): Promise<void> {
  const response = await fetch("/api/send-email", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: email.trim(),
      type: "reset",
    }),
  });

  const data = await response.json();
  if (!response.ok || !data.success) {
    throw new Error(data.error || "Failed to send reset email. Please try again.");
  }
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  if (typeof window !== "undefined") {
    localStorage.removeItem("fr8x_demo_user");
    window.dispatchEvent(new Event(DEMO_AUTH_EVENT));
  }
  try {
    await firebaseSignOut(firebaseAuth);
  } catch (e) {
    // Ignore firebase signout error if offline
  }
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthChange(
  callback: (user: FirebaseUser | null) => void
): () => void {
  return onAuthStateChanged(firebaseAuth, callback);
}

/**
 * Get current user ID token
 */
export async function getIdToken(): Promise<string | null> {
  const demoUser = getStoredDemoUser();
  if (demoUser) return "demo-token";
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
}
