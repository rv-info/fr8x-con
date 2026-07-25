// FR8X-CON Auth Provider — Manages Firebase Auth, Demo Test Credentials & Single-Session Enforcement

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
import { onAuthChange, signOut as firebaseSignOut, getStoredDemoUser, DEMO_AUTH_EVENT } from "@/lib/firebase/auth";
import { getDocument, setDocument, subscribeToDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS, ROUTES } from "@/lib/utils/constants";
import { useRouter } from "next/navigation";

type AuthContextType = AuthState & {
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to get or generate client session token
function getOrCreateSessionId(uid: string): string {
  if (typeof window === "undefined") return "";
  const key = `fr8x_session_${uid}`;
  let sessId = sessionStorage.getItem(key);
  if (!sessId) {
    sessId = `sess_${Math.random().toString(36).substring(2, 9)}_${Date.now()}`;
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

  const syncDemoUser = useCallback(() => {
    const demo = getStoredDemoUser();
    if (demo) {
      const authUser: AuthUser = {
        uid: demo.id,
        email: demo.email,
        displayName: demo.displayName,
        photoURL: null,
        emailVerified: true,
        role: demo.role as UserRole,
        isGodMode: demo.isGodMode,
        companyId: null,
        membershipTier: demo.membershipTier,
      };
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: authUser,
        error: null,
      });
      return true;
    }
    return false;
  }, []);

  const fetchUserData = useCallback(async (uid: string, email: string | null, displayName: string | null, photoURL: string | null, emailVerified: boolean) => {
    try {
      const userData = await getDocument<{
        role: UserRole;
        isGodMode: boolean;
        companyId: string | null;
        membershipTier: "trial" | "basic" | "premium";
        activeSessionId?: string;
      }>(COLLECTIONS.USERS, uid);

      const isDemoAdmin = email === "admin@fr8x.in";
      const authUser: AuthUser = {
        uid,
        email,
        displayName: displayName || (isDemoAdmin ? "GodMode Administrator" : email === "user@fr8x.in" ? "Demo Freight Forwarder" : null),
        photoURL,
        emailVerified,
        role: isDemoAdmin ? "admin" : (userData?.role || "freight_forwarder"),
        isGodMode: isDemoAdmin ? true : (userData?.isGodMode || false),
        companyId: userData?.companyId || null,
        membershipTier: isDemoAdmin ? "premium" : (userData?.membershipTier || "trial"),
      };

      // Single active session enforcement: Register current session ID in Firestore
      if (typeof window !== "undefined") {
        const clientSessionId = getOrCreateSessionId(uid);
        // Save current session ID to Firestore doc
        await setDocument(
          COLLECTIONS.USERS,
          uid,
          {
            activeSessionId: clientSessionId,
            lastLoginAt: new Date().toISOString(),
          },
          true
        );
      }

      setState({
        isAuthenticated: true,
        isLoading: false,
        user: authUser,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      const isDemoAdmin = email === "admin@fr8x.in";
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          uid,
          email,
          displayName: displayName || (isDemoAdmin ? "GodMode Administrator" : email === "user@fr8x.in" ? "Demo Freight Forwarder" : null),
          photoURL,
          emailVerified,
          role: isDemoAdmin ? "admin" : "freight_forwarder",
          isGodMode: isDemoAdmin ? true : false,
          companyId: null,
          membershipTier: isDemoAdmin ? "premium" : "trial",
        },
        error: null,
      });
    }
  }, []);

  // Real-time Single-Session Monitor
  useEffect(() => {
    if (!state.user?.uid) return;

    const uid = state.user.uid;
    const clientSessionId = getOrCreateSessionId(uid);

    // Subscribe to changes on users/{uid} document to detect concurrent logins
    const unsubscribeDoc = subscribeToDocument<{ activeSessionId?: string }>(
      COLLECTIONS.USERS,
      uid,
      (remoteData) => {
        if (remoteData?.activeSessionId && remoteData.activeSessionId !== clientSessionId) {
          console.warn("Single-session violation detected: Account signed in on another device.");
          firebaseSignOut();
          setState({
            isAuthenticated: false,
            isLoading: false,
            user: null,
            error: "Session terminated: Your account was signed in from another device.",
          });
          if (typeof window !== "undefined") {
            alert("Security Alert: You have been logged out because your account was signed in on another device.");
          }
          router.push(ROUTES.LOGIN);
        }
      }
    );

    return () => {
      unsubscribeDoc();
    };
  }, [state.user?.uid, router]);

  useEffect(() => {
    // Check local demo session first
    const hasDemo = syncDemoUser();

    // Listen to local demo auth changes
    const handleDemoChange = () => {
      if (!syncDemoUser()) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
        });
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener(DEMO_AUTH_EVENT, handleDemoChange);
    }

    const unsubscribe = onAuthChange(async (firebaseUser) => {
      const demo = getStoredDemoUser();
      if (demo) {
        syncDemoUser();
      } else if (firebaseUser) {
        await fetchUserData(
          firebaseUser.uid,
          firebaseUser.email,
          firebaseUser.displayName,
          firebaseUser.photoURL,
          firebaseUser.emailVerified
        );
      } else if (!hasDemo) {
        setState({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          error: null,
        });
      }
    });

    return () => {
      unsubscribe();
      if (typeof window !== "undefined") {
        window.removeEventListener(DEMO_AUTH_EVENT, handleDemoChange);
      }
    };
  }, [fetchUserData, syncDemoUser]);

  const signOut = useCallback(async () => {
    try {
      if (state.user?.uid && typeof window !== "undefined") {
        sessionStorage.removeItem(`fr8x_session_${state.user.uid}`);
      }
      await firebaseSignOut();
      setState({
        isAuthenticated: false,
        isLoading: false,
        user: null,
        error: null,
      });
      router.push(ROUTES.LOGIN);
    } catch (error) {
      console.error("Sign out error:", error);
    }
  }, [state.user?.uid, router]);

  const refreshUser = useCallback(async () => {
    if (state.user) {
      if (syncDemoUser()) return;
      await fetchUserData(
        state.user.uid,
        state.user.email,
        state.user.displayName,
        state.user.photoURL,
        state.user.emailVerified
      );
    }
  }, [state.user, fetchUserData, syncDemoUser]);

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
    () => ({
      ...state,
      signOut,
      refreshUser,
      hasRole,
    }),
    [state, signOut, refreshUser, hasRole]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
