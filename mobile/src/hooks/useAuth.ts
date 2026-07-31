// FR8X-CON Mobile — Secure Auth Hook
// Handles Email OTP authentication flow, biometric unlock,
// and secure token storage via expo-secure-store.

import { useState, useEffect, useCallback } from "react";
import {
  signInWithCustomToken,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import { auth } from "../lib/firebase";

const SECURE_TOKEN_KEY = "fr8x_mobile_token";
const SECURE_UID_KEY = "fr8x_mobile_uid";
const BIOMETRIC_ENABLED_KEY = "fr8x_biometric_enabled";

const API_BASE = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

export type AuthState = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
};

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);

  useEffect(() => {
    // Check biometric availability with crash-proof fallbacks
    LocalAuthentication.hasHardwareAsync()
      .then((has) => setBiometricAvailable(has))
      .catch(() => setBiometricAvailable(false));

    SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY)
      .then((val) => setBiometricEnabled(val === "true"))
      .catch(() => setBiometricEnabled(false));

    // Firebase auth state listener
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  /**
   * Send OTP to email — calls the shared web API endpoint.
   */
  const sendOTP = useCallback(async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error ?? "Failed to send OTP" };
      return { success: true };
    } catch {
      return { success: false, error: "Network error. Please check your connection." };
    }
  }, []);

  /**
   * Verify OTP — calls the shared web API endpoint.
   * On success, signs in with Firebase custom token and stores token securely.
   */
  const verifyOTP = useCallback(
    async (email: string, otp: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch(`${API_BASE}/api/auth/otp/verify`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, otp }),
        });
        const data = await res.json();
        if (!res.ok || !data.customToken) {
          return { success: false, error: data.error ?? "Invalid or expired OTP" };
        }

        // Sign in with Firebase custom token
        const credential = await signInWithCustomToken(auth, data.customToken);
        const idToken = await credential.user.getIdToken();

        // Store tokens securely — NEVER in plain AsyncStorage
        await SecureStore.setItemAsync(SECURE_TOKEN_KEY, idToken);
        await SecureStore.setItemAsync(SECURE_UID_KEY, credential.user.uid);

        return { success: true };
      } catch {
        return { success: false, error: "Authentication failed. Please try again." };
      }
    },
    []
  );

  /**
   * Authenticate with biometrics (Face ID / Fingerprint).
   * Used for re-authentication after app resume.
   */
  const authenticateWithBiometrics = useCallback(async (): Promise<boolean> => {
    if (!biometricAvailable || !biometricEnabled) return false;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Verify your identity to access FR8X-CON",
        fallbackLabel: "Use Passcode",
        disableDeviceFallback: false,
      });
      return result.success;
    } catch {
      return false;
    }
  }, [biometricAvailable, biometricEnabled]);

  /**
   * Enable biometric unlock for subsequent app opens.
   */
  const enableBiometric = useCallback(async (): Promise<boolean> => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: "Confirm your identity to enable biometric login",
    });
    if (result.success) {
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, "true");
      setBiometricEnabled(true);
    }
    return result.success;
  }, []);

  /**
   * Sign out: clears Firebase session and secure store.
   */
  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    await SecureStore.deleteItemAsync(SECURE_TOKEN_KEY);
    await SecureStore.deleteItemAsync(SECURE_UID_KEY);
    setUser(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    biometricAvailable,
    biometricEnabled,
    sendOTP,
    verifyOTP,
    authenticateWithBiometrics,
    enableBiometric,
    signOut,
  };
}
