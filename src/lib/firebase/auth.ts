// FR8X-CON Firebase Auth Helpers

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

// Auth providers
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");

const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.addScope("email");
microsoftProvider.addScope("profile");

/**
 * Sign in with email and password.
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  return signInWithEmailAndPassword(firebaseAuth, email.trim(), password);
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
 * Send password reset email.
 */
export async function resetPassword(email: string): Promise<void> {
  return sendPasswordResetEmail(firebaseAuth, email);
}

/**
 * Sign out the current user.
 */
export async function signOut(): Promise<void> {
  return firebaseSignOut(firebaseAuth);
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
 * Get the current user's ID token for server verification.
 */
export async function getIdToken(): Promise<string | null> {
  const user = firebaseAuth.currentUser;
  if (!user) return null;
  return user.getIdToken(true);
}
