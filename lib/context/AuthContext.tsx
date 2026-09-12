'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, PlanTier, UserRole } from '@/lib/types';

// SECURITY: INITIAL_USERS seed data removed.
// Demo/test users must NOT be hardcoded in client-side code.
// Authentication is exclusively handled via /api/auth/login (server-side).
// No plaintext passwords are stored or compared client-side.

// ─── Empty starting user list — populated from server session only ─────────
export const INITIAL_USERS: UserProfile[] = [];

// ─── Default Safe Guest User (Used when NOT authenticated) ──────────────────
export const GUEST_USER: UserProfile = {
  uid: '',
  email: '',
  firstName: '',
  lastName: '',
  displayName: '',
  designation: 'Guest User',
  company: '',
  companyId: '',
  city: '',
  state: '',
  country: '',
  mobile: '',
  timezone: 'UTC',
  preferredContactMethod: 'email',
  contactAvailability: '',
  plan: 'trial',
  hasGoldenTick: false,
  isVerified: false,
  role: 'user',
};

// SECURITY: DEFAULT_PASSWORDS removed. Client code must NEVER store or compare passwords.
// All authentication is performed exclusively server-side via /api/auth/login.

// ─── Storage Keys ────────────────────────────────────────────────────────────
const USERS_STORAGE_KEY = 'fr8x_all_users_v2';
// SECURITY: PASSWORDS_STORAGE_KEY removed — passwords must not be stored client-side.
const ACTIVE_SESSION_KEY = 'fr8x_active_user_uid';
const STATUS_KEY = 'fr8x_user_status';
// DEVICE_KEY now stores only the remembered email, not the password.
const DEVICE_EMAIL_KEY = 'fr8x_remembered_email_v3';
const SESSION_START_KEY = 'fr8x_session_start_time';
const LAST_ACTIVITY_KEY = 'fr8x_last_activity_time';

// ─── Session Expiration & Inactivity Limits ─────────────────────────────────
// Inactivity timeout: 30 minutes of no interaction / browser backgrounded
export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
// Maximum absolute session duration: 12 hours
export const MAX_SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

function checkIsSessionExpired(): boolean {
  try {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    if (!lastActivity) return false;
    const now = Date.now();
    const idleTime = now - Number(lastActivity);
    if (idleTime > INACTIVITY_TIMEOUT_MS) return true;
    if (sessionStart && now - Number(sessionStart) > MAX_SESSION_DURATION_MS) return true;
    return false;
  } catch {
    return false;
  }
}

// ─── Device-memory helpers — EMAIL ONLY, never password ──────────────────────
// SECURITY: Only the email address is stored for "Remember Me" UX convenience.
// Passwords are NEVER stored client-side in any form.
function saveRememberedEmail(email: string) {
  try { localStorage.setItem(DEVICE_EMAIL_KEY, email.trim().toLowerCase()); } catch {}
}

function loadRememberedEmail(): string | null {
  try { return localStorage.getItem(DEVICE_EMAIL_KEY) || null; } catch { return null; }
}

function clearRememberedEmail() {
  try {
    localStorage.removeItem(DEVICE_EMAIL_KEY);
    // Also clear any legacy credential store from previous version
    localStorage.removeItem('fr8x_remembered_creds_v2');
  } catch {}
}

export type UserStatus = 'available' | 'offline';

// ─── Auth Context Interface ──────────────────────────────────────────────────
interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  allUsers: UserProfile[];
  userStatus: UserStatus;
  setUserStatus: (status: UserStatus) => void;
  switchUser: (uid: string) => void;
  updateUser: (updatedFields: Partial<UserProfile>) => void;
  upgradePlan: (plan: PlanTier) => void;
  /**
   * Finalises client-side session after server authentication succeeds.
   * MUST be called with serverVerifiedUser from /api/auth/login response.
   * Never performs its own password check.
   */
  login: (
    identifier: string,
    remember?: boolean,
    serverVerifiedUser?: Partial<UserProfile>
  ) => boolean;
  register: (
    profile: Partial<UserProfile>,
    password?: string
  ) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  resetPasswordWithOtp: (
    email: string,
    otp: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  logout: (reason?: string) => void;
  /** Returns only the remembered email (never a password). */
  loadRememberedEmail: () => string | null;
  /** Backwards compatibility alias for loadRememberedEmail */
  loadRemembered: () => string | null;
  bidPostingFee: number;
  bidDiscountPercentage: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  // SECURITY: No password state — passwords never held in client memory.
  const [userStatus, setUserStatusState] = useState<UserStatus>('offline');
  const [isLoading, setIsLoading] = useState(true);

  // Keep a ref to currentUser for event handlers and intervals
  const currentUserRef = React.useRef<UserProfile | null>(null);
  currentUserRef.current = currentUser;

  const lastTrackedTimeRef = React.useRef<number>(Date.now());

  // Initial load: restore active session from localStorage (profile only, never password)
  useEffect(() => {
    try {
      // 1. Load registered user profiles (no passwords, no demo seed data)
      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      let usersList: UserProfile[] = [];
      if (storedUsersRaw) {
        try {
          const parsed = JSON.parse(storedUsersRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Deduplicate by normalized email
            const seenEmails = new Set<string>();
            const deduped: UserProfile[] = [];
            for (const u of parsed) {
              const emailKey = (u.email || '').trim().toLowerCase();
              // Filter out any legacy seeded demo users by their known UIDs
              const isDemoUser = ['u-arjun', 'u-sarah', 'u-kiran', 'u-elena', 'u-david'].includes(u.uid);
              if (emailKey && !seenEmails.has(emailKey) && !isDemoUser) {
                seenEmails.add(emailKey);
                deduped.push(u);
              }
            }
            usersList = deduped;
          }
        } catch {}
      }
      setAllUsers(usersList);

      // SECURITY: No password loading from localStorage.
      // Passwords are validated exclusively server-side via /api/auth/login.
      // Clear any legacy password store that may exist from previous versions.
      try { localStorage.removeItem('fr8x_user_passwords_v2'); } catch {}

      // 2. Restore active session ONLY if explicitly saved and NOT expired
      const savedUid = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedUid) {
        const isExpired = checkIsSessionExpired();
        if (isExpired) {
          localStorage.removeItem(ACTIVE_SESSION_KEY);
          localStorage.removeItem(SESSION_START_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          setCurrentUser(null);
          setUserStatusState('offline');
        } else {
          const found = usersList.find((u) => u.uid === savedUid);
          if (found) {
            setCurrentUser(found);
            const savedStatus = (localStorage.getItem(STATUS_KEY) as UserStatus) || 'available';
            setUserStatusState(savedStatus);
            try { localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString()); } catch {}
          } else {
            // Stale UID — clear session
            localStorage.removeItem(ACTIVE_SESSION_KEY);
            setCurrentUser(null);
            setUserStatusState('offline');
          }
        }
      } else {
        setCurrentUser(null);
        setUserStatusState('offline');
      }
    } catch {
      setCurrentUser(null);
      setUserStatusState('offline');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Mark user offline when tab/window closes
  useEffect(() => {
    const onUnload = () => {
      try { localStorage.setItem(STATUS_KEY, 'offline'); } catch {}
    };
    window.addEventListener('beforeunload', onUnload);
    return () => window.removeEventListener('beforeunload', onUnload);
  }, []);

  // Track user activity across interactions (clicks, keyboard, scroll, touch)
  useEffect(() => {
    const handleUserActivity = () => {
      if (!currentUserRef.current) return;
      const now = Date.now();
      // Throttle localStorage writes to at most once every 10 seconds
      if (now - lastTrackedTimeRef.current > 10000) {
        lastTrackedTimeRef.current = now;
        try {
          localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
        } catch {}
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
    };
  }, []);

  // Periodic and visibility/focus session validity checks (handles browser left open / dormant for a long time)
  useEffect(() => {
    const performSessionCheck = () => {
      if (!currentUserRef.current) return;

      if (checkIsSessionExpired()) {
        // Inactivity or max session duration exceeded
        setCurrentUser(null);
        setUserStatusState('offline');
        clearRememberedEmail();
        try {
          localStorage.removeItem(ACTIVE_SESSION_KEY);
          localStorage.removeItem(SESSION_START_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          localStorage.setItem(STATUS_KEY, 'offline');
        } catch {}

        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login?reason=session_expired';
        }
      }
    };

    // Check when user refocuses or wakes the tab
    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        performSessionCheck();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    // Periodic check every 20 seconds
    const interval = setInterval(performSessionCheck, 20000);

    return () => {
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
      clearInterval(interval);
    };
  }, []);

  const setUserStatus = (status: UserStatus) => {
    setUserStatusState(status);
    try { localStorage.setItem(STATUS_KEY, status); } catch {}
  };

  const switchUser = (_uid: string) => {
    // Under One User, One Login: direct switching between accounts is prohibited.
    // Explicit sign out required.
    console.warn('[Auth] Direct account switching prohibited under One User, One Login policy.');
    logout('Account switching prohibited under One User, One Login policy. Please log in.');
  };

  const updateUser = (updatedFields: Partial<UserProfile>) => {
    if (!currentUser) return;
    const updated = { ...currentUser, ...updatedFields };
    setCurrentUser(updated);
    setAllUsers((list) => {
      const next = list.map((u) => (u.uid === updated.uid ? updated : u));
      try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
  };

  const upgradePlan = (plan: PlanTier) => {
    const hasGoldenTick = plan === 'premium';
    updateUser({ plan, hasGoldenTick });
  };

  /**
   * Finalises client-side session after server authentication succeeds.
   *
   * SECURITY CONTRACT:
   * - This function NEVER validates a password.
   * - It must ONLY be called after /api/auth/login returns success.
   * - serverVerifiedUser is required — the profile comes from the server response.
   * - No local fallback authentication is performed.
   */
  const login = (
    identifier: string,
    remember = false,
    serverVerifiedUser?: Partial<UserProfile>
  ): boolean => {
    if (!serverVerifiedUser || !serverVerifiedUser.uid) {
      console.error('[Auth] login() called without server-verified user. Refusing to authenticate.');
      return false;
    }

    // Purge any preexisting active session data to enforce one user, one login
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(STATUS_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch {}

    // Build user profile from server-returned data
    const serverUser = serverVerifiedUser;
    const found: UserProfile = {
      uid: serverUser.uid!,
      email: serverUser.email || identifier,
      firstName: serverUser.firstName || serverUser.displayName?.split(' ')[0] || 'User',
      lastName: serverUser.lastName || serverUser.displayName?.split(' ').slice(1).join(' ') || '',
      displayName: serverUser.displayName || identifier,
      designation: serverUser.designation || 'Freight Procurement Manager',
      company: serverUser.company || 'Enterprise Logistics Co.',
      companyId: serverUser.companyId || 'CMP-00000',
      city: serverUser.city || '',
      state: serverUser.state || '',
      country: serverUser.country || '',
      mobile: serverUser.mobile || '',
      timezone: serverUser.timezone || 'Asia/Kolkata',
      preferredContactMethod: serverUser.preferredContactMethod || 'tradeChat',
      contactAvailability: serverUser.contactAvailability || '09:00 - 18:00',
      plan: serverUser.plan || 'trial',
      hasGoldenTick: serverUser.hasGoldenTick || false,
      isVerified: serverUser.isVerified ?? serverUser.email_verified ?? true,
      email_verified: serverUser.email_verified ?? serverUser.isVerified ?? true,
      role: serverUser.role || 'user',
    };

    // Upsert profile into local list (no passwords stored)
    setAllUsers((prev) => [
      found,
      ...prev.filter((u) => u.uid !== found.uid && u.email.toLowerCase() !== found.email.toLowerCase()),
    ]);

    setCurrentUser(found);
    setUserStatus('available');

    const now = Date.now().toString();
    try {
      // Persist only the user profile and session timestamps — never a password
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify([found]));
      localStorage.setItem(ACTIVE_SESSION_KEY, found.uid);
      localStorage.setItem(STATUS_KEY, 'available');
      localStorage.setItem(SESSION_START_KEY, now);
      localStorage.setItem(LAST_ACTIVITY_KEY, now);
    } catch {}

    if (remember) {
      // Store only email for UX convenience — NEVER store password
      saveRememberedEmail(found.email);
    } else {
      clearRememberedEmail();
    }

    return true;
  };

  const loadRememberedEmailFn = React.useCallback(() => loadRememberedEmail(), []);

  /**
   * Register a new freight organization and user account.
   * Enforces strict One User, One Login policy: rejects duplicate accounts across same or different organizations.
   */
  const register = async (
    profile: Partial<UserProfile>,
    password = 'Password@123'
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    const cleanEmail = (profile.email || '').trim().toLowerCase();
    const cleanCompany = (profile.company || '').trim();
    const cleanMobile = (profile.mobile || '').replace(/[^0-9+]/g, '');

    // 1. One User, One Login check: duplicate email across same or different orgs (only verified accounts block)
    const existingByEmail = allUsers.find(
      (u) => u.email.trim().toLowerCase() === cleanEmail && u.isVerified
    );
    if (existingByEmail) {
      const isSameOrg = existingByEmail.company.trim().toLowerCase() === cleanCompany.toLowerCase();
      if (isSameOrg) {
        return {
          success: false,
          error: `An account with this corporate email (${profile.email}) is already registered and verified in ${existingByEmail.company}. Multi-accounting in the same organization is prohibited under the One User, One Login policy. Please sign in instead.`,
        };
      } else {
        return {
          success: false,
          error: `This corporate email (${profile.email}) is already associated with another verified organization (${existingByEmail.company}). Multi-accounting across different organizations is strictly prohibited (One User, One Login policy). Each user is permitted only one active account.`,
        };
      }
    }

    // 2. One User, One Login check: duplicate mobile phone number (only verified accounts block)
    if (cleanMobile && cleanMobile.length >= 8) {
      const existingByMobile = allUsers.find(
        (u) => u.mobile && u.mobile.replace(/[^0-9+]/g, '') === cleanMobile && u.isVerified && u.email.trim().toLowerCase() !== cleanEmail
      );
      if (existingByMobile) {
        return {
          success: false,
          error: `This mobile phone number (${profile.mobile}) is already associated with an active account (${existingByMobile.email}). Multi-accounting is prohibited under the One User, One Login policy.`,
        };
      }
    }

    const newUid = `u-${Date.now()}`;
    const newUser: UserProfile = {
      uid: newUid,
      email: cleanEmail,
      firstName: profile.firstName || 'User',
      lastName: profile.lastName || '',
      displayName: `${profile.firstName || 'User'} ${profile.lastName || ''}`.trim(),
      designation: profile.designation || 'Freight Procurement Manager',
      company: cleanCompany || 'Enterprise Logistics Co.',
      companyId: profile.companyId || `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
      city: profile.city || 'Mumbai',
      state: profile.state || '',
      country: profile.country || 'India',
      mobile: profile.mobile || '+91 90000 00000',
      timezone: profile.timezone || 'Asia/Kolkata',
      preferredContactMethod: profile.preferredContactMethod || 'tradeChat',
      contactAvailability: profile.contactAvailability || '09:00 - 18:00',
      plan: profile.plan || 'trial',
      hasGoldenTick: profile.plan === 'premium',
      isVerified: false,
      email_verified: false,
      role: 'company_admin',
      ...profile,
    };

    // 3. Register with server API to ensure server-side auth sync
    let isVerificationRequired = false;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUser,
          password,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        return {
          success: false,
          error: json.error || 'Server rejected registration under the One User, One Login policy.',
        };
      }
      isVerificationRequired = Boolean(json.isVerificationRequired);
    } catch (err) {
      console.warn('[Auth] Server register request skipped, using client registry:', err);
    }

    if (isVerificationRequired) {
      // Do not auto-login unverified accounts
      return { success: true, user: newUser };
    }

    // 4. Save profile only to local storage — never password
    const nextUsers = [newUser, ...allUsers.filter((u) => u.email.trim().toLowerCase() !== cleanEmail)];
    setAllUsers(nextUsers);

    // SECURITY: Password is NOT stored client-side.
    const now = Date.now().toString();
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
      localStorage.setItem(ACTIVE_SESSION_KEY, newUid);
      localStorage.setItem(STATUS_KEY, 'available');
      localStorage.setItem(SESSION_START_KEY, now);
      localStorage.setItem(LAST_ACTIVITY_KEY, now);
    } catch {}

    setCurrentUser(newUser);
    setUserStatus('available');

    return { success: true, user: newUser };
  };

  /**
   * Verify server-issued OTP and reset account password
   */
  const resetPasswordWithOtp = async (
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_and_reset',
          email,
          otp,
          newPassword,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        return { success: false, error: json.error || 'Password reset failed.' };
      }

      // SECURITY: Client-side password store removed.
      // Server has updated the password. No client-side action needed.

      return { success: true, message: json.message || 'Password successfully reset.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to connect to password reset service.' };
    }
  };

  /**
   * Explicit Logout: destroys the session and sets user to null (unauthenticated).
   */
  const logout = (reason?: string) => {
    setCurrentUser(null);
    setUserStatusState('offline');
    clearRememberedEmail();
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.setItem(STATUS_KEY, 'offline');
    } catch {}

    if (reason && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
      window.location.href = `/login?reason=${encodeURIComponent(reason)}`;
    }
  };

  const activeUser = currentUser || GUEST_USER;
  const isAuthenticated = Boolean(currentUser && currentUser.uid);
  const isPremium = activeUser.plan === 'premium';
  const bidPostingFee = isPremium ? 180 : 300;
  const bidDiscountPercentage = isPremium ? 40 : 0;

  return (
    <AuthContext.Provider
      value={{
        user: activeUser,
        isAuthenticated,
        isLoading,
        allUsers,
        userStatus,
        setUserStatus,
        switchUser,
        updateUser,
        upgradePlan,
        login,
        register,
        resetPasswordWithOtp,
        logout,
        loadRememberedEmail: loadRememberedEmailFn,
        loadRemembered: loadRememberedEmailFn,
        bidPostingFee,
        bidDiscountPercentage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
