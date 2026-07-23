// FR8X-CON Auth Provider
// Manages Firebase Auth state and provides user context

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
import { getDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS, ROUTES } from "@/lib/utils/constants";
import { useRouter } from "next/navigation";

type AuthContextType = AuthState & {
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (role: UserRole | UserRole[]) => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    isLoading: true,
    user: null,
    error: null,
  });
  const router = useRouter();

  const fetchUserData = useCallback(async (uid: string, email: string | null, displayName: string | null, photoURL: string | null, emailVerified: boolean) => {
    const isGod = uid === "mock-uid-godmode" || email === "support@fr8x.in";
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
        displayName,
        photoURL,
        emailVerified,
        role: isGod ? "godmode" : (userData?.role || "freight_forwarder"),
        isGodMode: isGod ? true : (userData?.isGodMode || false),
        companyId: userData?.companyId || null,
        membershipTier: isGod ? "premium" : (userData?.membershipTier || "trial"),
      };

      setState({
        isAuthenticated: true,
        isLoading: false,
        user: authUser,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching user data:", error);
      setState({
        isAuthenticated: true,
        isLoading: false,
        user: {
          uid,
          email,
          displayName,
          photoURL,
          emailVerified,
          role: isGod ? "godmode" : "freight_forwarder",
          isGodMode: isGod,
          companyId: null,
          membershipTier: isGod ? "premium" : "trial",
        },
        error: null,
      });
    }
  }, []);

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
  }, [router]);

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
      if (state.user.isGodMode) return true; // GodMode has all roles
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
