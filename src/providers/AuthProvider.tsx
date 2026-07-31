// FR8X-CON Auth Provider — Production
// Firebase Auth only. No demo credentials. GodMode verified from Firestore server-side.

"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type { AuthState, AuthUser, UserRole } from "@/lib/types/auth";
import { onAuthChange, signOut as firebaseSignOut } from "@/lib/firebase/auth";
import { getDocument, setDocument, subscribeToDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS, ROUTES } from "@/lib/utils/constants";
import { useRouter } from "next/navigation";

type AuthContextType = AuthState & {
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Generate or retrieve a stable session ID for single-session enforcement */
function getOrCreateSessionId(uid: string): string {
  if (typeof window === "undefined") return "";
  const key = `fr8x_session_${uid}`;
  let sessId = sessionStorage.getItem(key);
  if (!sessId) {
    sessId = `sess_${crypto.randomUUID()}`;
    sessionStorage.setItem(key, sessId);
  }
  return sessId;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });
  const router = useRouter();

  const fetchUserData = useCallback(
    async (
      uid: string,
      email: string | null,
      displayName: string | null,
      photoURL: string | null,
      emailVerified: boolean
    ) => {
      try {
        const userData = await getDocument<{
          role: UserRole;
          isGodMode: boolean;
          companyId: string | null;
          membershipTier: "trial" | "basic" | "premium";
        }>(COLLECTIONS.USERS, uid);

        const authUser: AuthUser = {
          uid,
          email,
          displayName: displayName || email,
          photoURL,
          emailVerified,
          role: userData?.role || "freight_forwarder",
          isGodMode: userData?.isGodMode === true,
          companyId: userData?.companyId || null,
          membershipTier: userData?.membershipTier || "premium",
        };

        // Register current session in Firestore for single-session enforcement
        if (typeof window !== "undefined") {
          const clientSessionId = getOrCreateSessionId(uid);
          await setDocument(
            COLLECTIONS.USERS,
            uid,
            { activeSessionId: clientSessionId, lastLoginAt: new Date().toISOString() },
            true
          );
        }

        setState({
          isAuthenticated: true,
          isLoading: false,
          user: authUser,
          error: null,
        });
      } catch {
        // If Firestore fetch fails, still allow auth but without elevated privileges
        setState({
          isAuthenticated: true,
          isLoading: false,
          user: {
            uid,
            email,
            displayName: displayName || email,
            photoURL,
            emailVerified,
            role: "freight_forwarder",
            isGodMode: false, // Never default to GodMode on error
            companyId: null,
            membershipTier: "trial",
          },
          error: null,
        });
      }
    },
    []
  );

  // Real-time single-session enforcement monitor
  useEffect(() => {
    if (!state.user?.uid) return;
    const uid = state.user.uid;
    const clientSessionId = getOrCreateSessionId(uid);

    const unsubscribe = subscribeToDocument<{ activeSessionId?: string }>(
      COLLECTIONS.USERS,
      uid,
      (remoteData) => {
        if (
          remoteData?.activeSessionId &&
          remoteData.activeSessionId !== clientSessionId
        ) {
          firebaseSignOut();
          setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: "Your session was terminated because your account signed in from another device.",
          });
          router.push(ROUTES.LOGIN);
        }
      }
    );

    return () => unsubscribe();
  }, [state.user?.uid, router]);

  // Firebase Auth state listener
  useEffect(() => {
    const unsubscribe = onAuthChange(async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserData(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName,
          firebaseUser.photoURL,
          firebaseUser.emailVerified
        );
      } else {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
        });
      }
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const signOut = useCallback(async () => {
    try {
      if (typeof window !== "undefined") {
        if (state.user?.uid) {
          sessionStorage.removeItem(`fr8x_session_${state.user.uid}`);
        }
        sessionStorage.removeItem("fr8x_godmode_admin");
        document.cookie = "fr8x_godmode_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT";
      }
      await firebaseSignOut();
      setState({ isAuthenticated: false, isLoading: false, user: null, error: null });
      router.push(ROUTES.LOGIN);
    } catch {
      // Sign out silently
    }
  }, [state.user?.uid, router]);

  const refreshUser = useCallback(async () => {
    if (state.user) {
      await fetchUserData(
        state.user.uid,
        state.user.email,
        state.user.displayName,
        state.user.photoURL,
        state.user.emailVerified
      );
    }
  }, [state.user, fetchUserData]);

  const hasRole = useCallback(
    (role: UserRole | UserRole[]) => {
      if (!state.user) return false;
      if (state.user.isGodMode) return true;
      if (Array.isArray(role)) return role.includes(state.user.role);
      return state.user.role === role;
    },
    [state.user]
  );

  const value = useMemo(
    () => ({ ...state, signOut, refreshUser, hasRole }),
    [state, signOut, refreshUser, hasRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
