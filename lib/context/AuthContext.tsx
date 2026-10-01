'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, PlanTier, UserRole } from '@/lib/types';
import { auth } from '@/lib/firebase/client';
import {
  signInWithCustomToken,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  createCanonicalUserInFirestore,
  getCanonicalUserProfile,
  updateCanonicalUserProfile,
  healOrProvisionUserInFirestore,
  saveUserProfileToFirestore,
  ensureFirebaseAuth,
  getUserProfileFromFirestore,
  logStructuredError,
} from '@/lib/firebase/firestore';

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
  displayName: 'Guest',
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
// Session validity strictly 2 hours (120 minutes) on the same device/browser
export const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;
// Maximum absolute session duration: 2 hours (Requirement 4)
export const MAX_SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let deviceId = localStorage.getItem('fr8x_device_id');
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('fr8x_device_id', deviceId);
    }
    return deviceId;
  } catch {
    return 'dev_fallback';
  }
}

function checkIsSessionExpired(): boolean {
  try {
    const lastActivity = localStorage.getItem(LAST_ACTIVITY_KEY);
    const sessionStart = localStorage.getItem(SESSION_START_KEY);
    if (!lastActivity && !sessionStart) return false;
    const now = Date.now();
    if (lastActivity) {
      const idleTime = now - Number(lastActivity);
      if (idleTime > INACTIVITY_TIMEOUT_MS) return true;
    }
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
    serverVerifiedUser?: Partial<UserProfile>,
    password?: string
  ) => boolean;
  loginWithCredentials: (
    email: string,
    password: string,
    remember?: boolean
  ) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  register: (
    profile: Partial<UserProfile>,
    password?: string
  ) => Promise<{ success: boolean; error?: string; user?: UserProfile }>;
  resetPasswordWithOtp: (
    email: string,
    otp: string,
    newPassword: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  sendPasswordReset: (
    email: string
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

  // ─── Canonical Firebase Auth Listener + Active Session Hydration ─────────
  useEffect(() => {
    let isSubscribed = true;

    // 1. Initial cached users load for instant render
    let cachedUsers: UserProfile[] = [];
    try {
      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (storedUsersRaw) {
        const parsed = JSON.parse(storedUsersRaw);
        if (Array.isArray(parsed)) {
          cachedUsers = parsed;
          setAllUsers(parsed);
        }
      }
    } catch {}

    // INSTANT LOCAL SESSION RESTORATION ON REFRESH (Requirement 1 & 4):
    // Check if an active session exists in localStorage and is within the 2-hour window
    const activeUid = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_SESSION_KEY) : null;
    if (activeUid && !checkIsSessionExpired()) {
      const foundUser = cachedUsers.find(
        (u) => u.uid === activeUid || (u.email && u.email.toLowerCase() === activeUid.toLowerCase())
      );
      if (foundUser) {
        setCurrentUser(foundUser);
        currentUserRef.current = foundUser;
        setUserStatusState('available');
        setIsLoading(false);
        const now = Date.now().toString();
        try {
          localStorage.setItem(LAST_ACTIVITY_KEY, now);
        } catch {}
      }
    }

    // 2. Fetch network members roster for search / directory features
    fetch('/api/members')
      .then((r) => r.json())
      .then((data) => {
        if (isSubscribed && data?.members && Array.isArray(data.members)) {
          setAllUsers((prev) => {
            const map = new Map<string, UserProfile>();
            for (const u of prev) if (u.uid) map.set(u.uid, u);
            for (const m of data.members) if (m.uid) map.set(m.uid, { ...map.get(m.uid), ...m });
            return Array.from(map.values());
          });
        }
      })
      .catch(() => {});

    // 3. True Authority: Firebase onAuthStateChanged listener
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (!isSubscribed) return;

      if (firebaseUser) {
        try {
          setIsLoading(true);
          let profile = await getCanonicalUserProfile(firebaseUser.uid);
          if (!profile) {
            // Self-heal or provision canonical record if missing (prevents stranded accounts)
            profile = await healOrProvisionUserInFirestore(firebaseUser);
          }
          if (isSubscribed && profile) {
            setCurrentUser(profile);
            currentUserRef.current = profile;
            setUserStatusState('available');
            try {
              localStorage.setItem(ACTIVE_SESSION_KEY, profile.uid);
              localStorage.setItem(STATUS_KEY, 'available');
              const now = Date.now().toString();
              localStorage.setItem(LAST_ACTIVITY_KEY, now);
              if (!localStorage.getItem(SESSION_START_KEY)) {
                localStorage.setItem(SESSION_START_KEY, now);
              }
            } catch {}

            // Ensure server session and 2-hour httpOnly cookie are bound so page refresh never causes logout
            try {
              const currentDevSessionId = typeof window !== 'undefined' ? localStorage.getItem('fr8x_device_session_id') : null;
              const devId = getOrCreateDeviceId();
              const sessRes = await fetch('/api/auth/session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  uid: profile.uid,
                  email: profile.email,
                  deviceId: devId,
                  sessionId: currentDevSessionId || undefined,
                }),
              });
              if (sessRes.ok) {
                const sessData = await sessRes.json();
                if (sessData.sessionId) {
                  localStorage.setItem('fr8x_device_session_id', sessData.sessionId);
                }
              }
            } catch (sessErr) {
              console.warn('[AuthContext] Session sync error:', sessErr);
            }
            setAllUsers((prev) => {
              const exists = prev.some((u) => u.uid === profile!.uid);
              const next = exists
                ? prev.map((u) => (u.uid === profile!.uid ? { ...u, ...profile } : u))
                : [profile!, ...prev];
              try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next)); } catch {}
              return next;
            });
          }
        } catch (err: any) {
          logStructuredError('onAuthStateChanged:profileFetch', err, firebaseUser.uid);
        } finally {
          if (isSubscribed) setIsLoading(false);
        }
      } else {
        if (isSubscribed) {
          // If we have an active client session that is not expired, maintain it
          const currentActive = typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_SESSION_KEY) : null;
          if (!currentActive || checkIsSessionExpired()) {
            setCurrentUser(null);
            currentUserRef.current = null;
            setUserStatusState('offline');
          }
          setIsLoading(false);
        }
      }
    });

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  // Cross-tab synchronization: broadcast & listen for login, logout, and user switch
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('fr8x_auth_sync');
      }
    } catch {}

    const handleSync = (data: { type: string; uid?: string | null }) => {
      if (data.type === 'LOGOUT') {
        setCurrentUser(null);
        setUserStatusState('offline');
      } else if (data.type === 'LOGIN' || data.type === 'USER_SWITCHED') {
        const activeUid = localStorage.getItem(ACTIVE_SESSION_KEY);
        if (activeUid) {
          const stored = localStorage.getItem(USERS_STORAGE_KEY);
          if (stored) {
            try {
              const list: UserProfile[] = JSON.parse(stored);
              const found = list.find((u) => u.uid === activeUid || (u.email && u.email.toLowerCase() === activeUid.toLowerCase()));
              if (found) {
                setCurrentUser(found);
                setUserStatusState('available');
              }
            } catch {}
          }
        }
      }
    };

    if (channel) {
      channel.onmessage = (event) => {
        if (event.data) handleSync(event.data);
      };
    }

    const handleStorageEvent = (event: StorageEvent) => {
      if (event.key === ACTIVE_SESSION_KEY) {
        if (!event.newValue) {
          handleSync({ type: 'LOGOUT' });
        } else {
          handleSync({ type: 'LOGIN', uid: event.newValue });
        }
      } else if (event.key === STATUS_KEY && event.newValue) {
        setUserStatusState(event.newValue as UserStatus);
      }
    };

    window.addEventListener('storage', handleStorageEvent);

    return () => {
      if (channel) {
        channel.close();
      }
      window.removeEventListener('storage', handleStorageEvent);
    };
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

  // Periodic and visibility/focus session validity checks (handles browser left open / dormant for a long time & enforces single-device session)
  useEffect(() => {
    const performSessionCheck = async () => {
      if (!currentUserRef.current) return;

      if (checkIsSessionExpired()) {
        setCurrentUser(null);
        currentUserRef.current = null;
        setUserStatusState('offline');
        try {
          localStorage.removeItem(ACTIVE_SESSION_KEY);
          localStorage.removeItem(SESSION_START_KEY);
          localStorage.removeItem(LAST_ACTIVITY_KEY);
          localStorage.removeItem('fr8x_device_session_id');
          localStorage.setItem(STATUS_KEY, 'offline');
        } catch {}
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
          window.location.href = '/login?reason=session_expired';
        }
        return;
      }

      // Check single active device enforcement via server heartbeat
      const deviceSessionId = localStorage.getItem('fr8x_device_session_id');
      const deviceId = getOrCreateDeviceId();
      if (currentUserRef.current?.uid) {
        try {
          const res = await fetch('/api/auth/session-heartbeat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              uid: currentUserRef.current.uid,
              email: currentUserRef.current.email,
              sessionId: deviceSessionId || '',
              deviceId: deviceId,
            }),
          });
          const data = await res.json();
          // Requirement 2: This error is ONLY for the device change, not on the same device!
          // Only sign out if an ACTUAL concurrent device login from a DIFFERENT device occurred.
          if (!data.valid && data.reason === 'concurrent_device_login') {
            setCurrentUser(null);
            currentUserRef.current = null;
            setUserStatusState('offline');
            try {
              localStorage.removeItem(ACTIVE_SESSION_KEY);
              localStorage.removeItem(SESSION_START_KEY);
              localStorage.removeItem(LAST_ACTIVITY_KEY);
              localStorage.removeItem('fr8x_device_session_id');
              localStorage.setItem(STATUS_KEY, 'offline');
            } catch {}

            if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !window.location.pathname.startsWith('/register')) {
              window.location.href = '/login?reason=concurrent_device_login';
            }
          } else if (data.valid && data.sessionId && !deviceSessionId) {
            localStorage.setItem('fr8x_device_session_id', data.sessionId);
          } else if (!data.valid && data.reason !== 'concurrent_device_login' && !checkIsSessionExpired()) {
            // Auto re-bind session on same device (e.g. server restart or transient state)
            fetch('/api/auth/session', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                uid: currentUserRef.current.uid,
                email: currentUserRef.current.email,
                deviceId: deviceId,
                sessionId: deviceSessionId || undefined,
              }),
            })
              .then((r) => r.json())
              .then((s) => {
                if (s?.sessionId) localStorage.setItem('fr8x_device_session_id', s.sessionId);
              })
              .catch(() => {});
          }
        } catch {}
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

    // Periodic check every 15 seconds
    const interval = setInterval(performSessionCheck, 15000);

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
    const base = currentUser || GUEST_USER;
    const merged = { ...base, ...updatedFields };
    // Safety: these two fields must never be null/undefined — they are called
    // without null-guards in multiple render paths (e.g. .split(), .toUpperCase())
    const updated: UserProfile = {
      ...merged,
      displayName: merged.displayName || `${merged.firstName || ''} ${merged.lastName || ''}`.trim() || merged.email || 'Member',
      plan: merged.plan || 'trial',
    };
    setCurrentUser(updated);
    setAllUsers((list) => {
      const exists = list.some((u) => u.uid === updated.uid);
      const next = exists ? list.map((u) => (u.uid === updated.uid ? updated : u)) : [updated, ...list];
      try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next)); } catch {}
      return next;
    });
    const targetUid = updated.uid || (typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_SESSION_KEY) : null);

    // Cache rich assets to dedicated keys for instant hydration
    if (typeof window !== 'undefined' && targetUid) {
      if (updatedFields.avatarUrl) {
        try {
          localStorage.setItem(`fr8x_user_avatar_${targetUid}`, updatedFields.avatarUrl);
          localStorage.setItem('fr8x_user_avatar', updatedFields.avatarUrl);
        } catch {}
      }
      if (updatedFields.companyLogoUrl) {
        try {
          localStorage.setItem(`fr8x_user_logo_${targetUid}`, updatedFields.companyLogoUrl);
          localStorage.setItem('fr8x_user_logo', updatedFields.companyLogoUrl);
        } catch {}
      }
      if (Array.isArray(updatedFields.experiences) && updatedFields.experiences.length > 0) {
        try {
          localStorage.setItem(`fr8x_user_exp_${targetUid}`, JSON.stringify(updatedFields.experiences));
        } catch {}
      }
      if (Array.isArray(updatedFields.educations) && updatedFields.educations.length > 0) {
        try {
          localStorage.setItem(`fr8x_user_edu_${targetUid}`, JSON.stringify(updatedFields.educations));
        } catch {}
      }
      if (Array.isArray(updatedFields.certifications) && updatedFields.certifications.length > 0) {
        try {
          localStorage.setItem(`fr8x_user_cert_${targetUid}`, JSON.stringify(updatedFields.certifications));
        } catch {}
      }
    }

    // Authoritative Firestore Persistence & Background Server API Sync
    if (!targetUid) return;
    try {
      updateCanonicalUserProfile(targetUid, updatedFields).catch((err) => {
        logStructuredError('updateUser:canonicalUpdate', err, targetUid);
      });
      fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fr8x-user-uid': targetUid,
          'x-fr8x-session': targetUid,
        },
        body: JSON.stringify({
          uid: targetUid,
          email: updated.email,
          updates: updatedFields,
        }),
      }).catch((err) => {
        console.warn('[Auth] Background DBMS user sync error:', err);
      });
    } catch {}
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
    serverVerifiedUser?: Partial<UserProfile>,
    password?: string
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

    // Find any existing locally stored profile for this user to preserve customizations
    const existingLocal = allUsers.find(
      (u) =>
        u.uid === serverVerifiedUser.uid ||
        (u.email && u.email.toLowerCase() === (serverVerifiedUser.email || identifier).toLowerCase())
    );

    // Build user profile from server-returned data and merge with existing local customizations
    const serverUser = serverVerifiedUser;
    const found: UserProfile = {
      uid: serverUser.uid!,
      email: serverUser.email || identifier,
      firstName: serverUser.firstName || existingLocal?.firstName || serverUser.displayName?.split(' ')[0] || 'User',
      lastName: serverUser.lastName || existingLocal?.lastName || serverUser.displayName?.split(' ').slice(1).join(' ') || '',
      displayName: serverUser.displayName || existingLocal?.displayName || identifier,
      designation: serverUser.designation || existingLocal?.designation || '',
      company: serverUser.company || existingLocal?.company || '',
      companyId: serverUser.companyId || existingLocal?.companyId || 'CMP-00000',
      city: serverUser.city || existingLocal?.city || '',
      state: serverUser.state || existingLocal?.state || '',
      country: serverUser.country || existingLocal?.country || '',
      formattedAddress: (serverUser as any).formattedAddress || existingLocal?.formattedAddress || '',
      mobile: serverUser.mobile || existingLocal?.mobile || '',
      timezone: serverUser.timezone || existingLocal?.timezone || 'Asia/Kolkata',
      preferredContactMethod: serverUser.preferredContactMethod || existingLocal?.preferredContactMethod || 'tradeChat',
      contactAvailability: serverUser.contactAvailability || existingLocal?.contactAvailability || '09:00 - 18:00',
      plan: serverUser.plan || existingLocal?.plan || 'trial',
      hasGoldenTick: serverUser.hasGoldenTick ?? existingLocal?.hasGoldenTick ?? false,
      isVerified: serverUser.isVerified ?? serverUser.email_verified ?? existingLocal?.isVerified ?? true,
      email_verified: serverUser.email_verified ?? serverUser.isVerified ?? existingLocal?.email_verified ?? true,
      role: serverUser.role || existingLocal?.role || 'user',
      avatarUrl: (serverUser as any).avatarUrl || existingLocal?.avatarUrl || (typeof window !== 'undefined' ? (localStorage.getItem(`fr8x_user_avatar_${serverUser.uid}`) || localStorage.getItem('fr8x_user_avatar') || '') : ''),
      companyLogoUrl: (serverUser as any).companyLogoUrl || existingLocal?.companyLogoUrl || (typeof window !== 'undefined' ? (localStorage.getItem(`fr8x_user_logo_${serverUser.uid}`) || localStorage.getItem('fr8x_user_logo') || '') : ''),
      summary: (serverUser as any).summary || existingLocal?.summary || '',
      gstn: (serverUser as any).gstn || existingLocal?.gstn || '',
      pan: (serverUser as any).pan || existingLocal?.pan || '',
      iec: (serverUser as any).iec || existingLocal?.iec || '',
      mto: (serverUser as any).mto || existingLocal?.mto || '',
      experiences: (serverUser as any).experiences || existingLocal?.experiences || [],
      educations: (serverUser as any).educations || existingLocal?.educations || [],
      certifications: (serverUser as any).certifications || existingLocal?.certifications || [],
      firebaseCustomToken: serverUser.firebaseCustomToken || existingLocal?.firebaseCustomToken,
    };

    // AUTH-02: Connect client to Firebase Auth via Custom Token or direct Email/Password for live Firestore permissions
    if (typeof window !== 'undefined') {
      if (serverUser.firebaseCustomToken) {
        try {
          if (auth && (auth as any).app) {
            signInWithCustomToken(auth, serverUser.firebaseCustomToken)
              .then((cred) => {
                console.info('[AuthContext] Signed into Firebase Auth successfully as', cred.user.uid);
                saveUserProfileToFirestore(found).catch(() => {});
              })
              .catch((err) => {
                console.warn('[AuthContext] Firebase Custom Token sign-in warning:', err.message);
                ensureFirebaseAuth(found.email, password).then(() => saveUserProfileToFirestore(found)).catch(() => {});
              });
          }
        } catch (e: any) {
          ensureFirebaseAuth(found.email, password).then(() => saveUserProfileToFirestore(found)).catch(() => {});
        }
      } else {
        ensureFirebaseAuth(found.email, password).then(() => saveUserProfileToFirestore(found)).catch(() => {});
      }
    }

    // Upsert profile into local list (no passwords stored)
    setAllUsers((prev) => {
      const next = [
        found,
        ...prev.filter((u) => u.uid !== found.uid && u.email.toLowerCase() !== found.email.toLowerCase()),
      ];
      try {
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });

    setCurrentUser(found);
    setUserStatus('available');

    const now = Date.now().toString();
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, found.uid);
      if ((serverVerifiedUser as any).sessionId) {
        localStorage.setItem('fr8x_device_session_id', (serverVerifiedUser as any).sessionId);
      }
      localStorage.setItem(STATUS_KEY, 'available');
      localStorage.setItem(SESSION_START_KEY, now);
      localStorage.setItem(LAST_ACTIVITY_KEY, now);
    } catch {}

    // Ensure authoritative server session and 2-hour cookie are bound
    try {
      const devId = getOrCreateDeviceId();
      fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: found.uid,
          email: found.email,
          deviceId: devId,
          sessionId: (serverVerifiedUser as any).sessionId || undefined,
        }),
      })
        .then((r) => r.json())
        .then((sessData) => {
          if (sessData?.sessionId) {
            localStorage.setItem('fr8x_device_session_id', sessData.sessionId);
          }
        })
        .catch(() => {});
    } catch {}

    if (remember) {
      // Store only email for UX convenience — NEVER store password
      saveRememberedEmail(found.email);
    } else {
      clearRememberedEmail();
    }

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('fr8x_auth_sync');
        bc.postMessage({ type: 'LOGIN', uid: found.uid });
        bc.close();
      }
    } catch {}

    return true;
  };

  const loadRememberedEmailFn = React.useCallback(() => loadRememberedEmail(), []);

  /**
   * Register a new freight organization and user account atomically.
   * Step 1: Create Firebase Auth user
   * Step 2: Obtain canonical UID
   * Step 3: Write required Firestore records with read-back verification
   * Step 4: Complete registration only on verified success
   */
  const register = async (
    profile: Partial<UserProfile> & {
      position?: string;
      department?: string;
      area?: string;
      district?: string;
      postalCode?: string;
      formattedAddress?: string;
      address?: string;
    },
    password = 'Password@123'
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    const cleanEmail = (profile.email || '').trim().toLowerCase();
    const cleanCompany = (profile.company || '').trim();
    const cleanMobile = (profile.mobile || '').replace(/[^0-9+]/g, '');

    if (!cleanEmail || !password) {
      return { success: false, error: 'Email and password are required for registration.' };
    }

    try {
      setIsLoading(true);

      // 1. Create Firebase Auth user
      const cred = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const uid = cred.user.uid;

      // 2. Set Firebase Auth displayName
      const displayName =
        profile.displayName ||
        `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
        cleanEmail;
      try {
        await updateProfile(cred.user, { displayName });
      } catch {}

      // 3. Atomically create canonical Firestore document & subcollections
      const createRes = await createCanonicalUserInFirestore({
        uid,
        email: cleanEmail,
        displayName,
        firstName: profile.firstName || displayName.split(' ')[0] || '',
        lastName: profile.lastName || displayName.split(' ').slice(1).join(' ') || '',
        mobile: cleanMobile || profile.mobile || '',
        companyId: profile.companyId || `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
        companyName: cleanCompany || 'Enterprise Logistics Co.',
        designation: profile.designation || 'Freight Procurement Manager',
        position: profile.position || profile.designation || 'Manager',
        department: profile.department || 'Logistics & Supply Chain',
        country: profile.country || 'India',
        state: profile.state || '',
        district: profile.district || '',
        city: profile.city || 'Mumbai',
        area: profile.area || '',
        address: profile.address || profile.formattedAddress || '',
        postalCode: profile.postalCode || '',
        role: profile.role === 'user' ? 'user' : 'company_admin',
        plan: profile.plan || 'trial',
      });

      if (!createRes.success) {
        // Rollback created Firebase Auth user so account is not left stranded without Firestore
        try {
          const { deleteUser } = await import('firebase/auth');
          await deleteUser(cred.user);
        } catch (delErr) {
          console.warn('[AuthContext] Rollback of stranded auth user failed:', delErr);
        }
        return { success: false, error: createRes.error || 'Failed to initialize Firestore user profile.' };
      }

      let canonicalUser = await getCanonicalUserProfile(uid);
      if (!canonicalUser) {
        canonicalUser = (await healOrProvisionUserInFirestore(cred.user))!;
      }

      // 4. Update local state
      setCurrentUser(canonicalUser);
      setUserStatus('available');
      setAllUsers((prev) => {
        const next = [canonicalUser!, ...prev.filter((u) => u.uid !== uid)];
        try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next)); } catch {}
        return next;
      });

      const now = Date.now().toString();
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, uid);
        localStorage.setItem(STATUS_KEY, 'available');
        localStorage.setItem(SESSION_START_KEY, now);
        localStorage.setItem(LAST_ACTIVITY_KEY, now);
      } catch {}

      // Establish authoritative server session and 2-hour cookie
      try {
        const devId = getOrCreateDeviceId();
        const sessRes = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            email: cleanEmail,
            deviceId: devId,
          }),
        });
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData.sessionId) {
            localStorage.setItem('fr8x_device_session_id', sessData.sessionId);
          }
        }
      } catch (sessErr) {
        console.warn('[AuthContext] Session binding error:', sessErr);
      }

      // 5. Background sync for legacy API compatibility
      fetch('/api/auth/register-sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(canonicalUser),
      }).catch(() => {});

      return { success: true, user: canonicalUser };
    } catch (err: any) {
      logStructuredError('register', err, undefined, { email: cleanEmail });
      let message = 'Registration failed. Please check your details.';
      if (err.code === 'auth/email-already-in-use') {
        // Self-healing recovery: if user already exists in Firebase Auth but has no Firestore document, attempt recovery
        try {
          const signCred = await signInWithEmailAndPassword(auth, cleanEmail, password);
          const existingProfile = await getCanonicalUserProfile(signCred.user.uid);
          if (!existingProfile) {
            const healRes = await createCanonicalUserInFirestore({
              uid: signCred.user.uid,
              email: cleanEmail,
              displayName: profile.displayName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || cleanEmail,
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              mobile: cleanMobile || profile.mobile || '',
              companyId: profile.companyId || `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
              companyName: cleanCompany || 'Enterprise Logistics Co.',
              designation: profile.designation || 'Freight Procurement Manager',
              position: profile.position || profile.designation || 'Manager',
              department: profile.department || 'Logistics & Supply Chain',
              country: profile.country || 'India',
              state: profile.state || '',
              district: profile.district || '',
              city: profile.city || 'Mumbai',
              area: profile.area || '',
              address: profile.address || profile.formattedAddress || '',
              postalCode: profile.postalCode || '',
              role: profile.role === 'user' ? 'user' : 'company_admin',
              plan: profile.plan || 'trial',
            });
            if (healRes.success) {
              const healedUser = await getCanonicalUserProfile(signCred.user.uid);
              if (healedUser) {
                setCurrentUser(healedUser);
                setUserStatus('available');
                return { success: true, user: healedUser };
              }
            }
          }
        } catch (recoverErr) {
          console.warn('[AuthContext] Recovery of existing auth user note:', recoverErr);
        }
        message = `An account with this email (${cleanEmail}) already exists. Please sign in instead.`;
      } else if (err.code === 'auth/weak-password') {
        message = 'The password is too weak. Please use at least 8 characters with letters, numbers, and symbols.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'The email address is invalid.';
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Direct Firebase Authentication with Email & Password.
   * Fetches canonical Firestore user and heals if missing.
   */
  const loginWithCredentials = async (
    email: string,
    password: string,
    remember = false
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const cred = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const uid = cred.user.uid;

      // Fetch canonical profile
      let profile = await getCanonicalUserProfile(uid);
      if (!profile) {
        // Self-heal or provision canonical record without deleting auth user
        profile = await healOrProvisionUserInFirestore(cred.user);
      }

      if (profile) {
        setCurrentUser(profile);
        setUserStatus('available');
        setAllUsers((prev) => {
          const next = [profile!, ...prev.filter((u) => u.uid !== profile!.uid)];
          try { localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(next)); } catch {}
          return next;
        });
      }

      if (remember) {
        saveRememberedEmail(cleanEmail);
      } else {
        clearRememberedEmail();
      }

      const now = Date.now().toString();
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, uid);
        localStorage.setItem(STATUS_KEY, 'available');
        localStorage.setItem(SESSION_START_KEY, now);
        localStorage.setItem(LAST_ACTIVITY_KEY, now);
      } catch {}

      // Establish authoritative server session and 2-hour httpOnly cookie
      try {
        const devId = getOrCreateDeviceId();
        const sessRes = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            uid,
            email: cleanEmail,
            deviceId: devId,
          }),
        });
        if (sessRes.ok) {
          const sessData = await sessRes.json();
          if (sessData.sessionId) {
            localStorage.setItem('fr8x_device_session_id', sessData.sessionId);
          }
        }
      } catch (sessErr) {
        console.warn('[AuthContext] Session binding error:', sessErr);
      }

      return { success: true, user: profile || undefined };
    } catch (err: any) {
      logStructuredError('loginWithCredentials', err, undefined, { email });
      let message = 'Failed to sign in. Please verify your email and password.';
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/user-not-found' ||
        err.code === 'auth/wrong-password'
      ) {
        message = 'Invalid corporate email or password. Please verify your credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please reset your password or try again later.';
      } else if (err.code === 'auth/user-disabled') {
        message = 'This account has been suspended or disabled. Please contact support.';
      } else if (err.message) {
        message = err.message;
      }
      return { success: false, error: message };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Send Firebase password reset email.
   */
  const sendPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your corporate email address.' };
    }
    try {
      await sendPasswordResetEmail(auth, cleanEmail);
      return {
        success: true,
        message: `Password reset link has been dispatched to ${cleanEmail} via Firebase Authentication.`,
      };
    } catch (err: any) {
      logStructuredError('sendPasswordReset', err, undefined, { email: cleanEmail });
      let msg = 'Failed to dispatch password reset email. Please try again.';
      if (err.code === 'auth/user-not-found') {
        // Controlled message to protect user privacy
        return {
          success: true,
          message: `If an account is associated with ${cleanEmail}, a password reset link has been sent.`,
        };
      } else if (err.code === 'auth/invalid-email') {
        msg = 'Please enter a valid corporate email address.';
      } else if (err.message) {
        msg = err.message;
      }
      return { success: false, error: msg };
    }
  };

  /**
   * Verify server-issued OTP and reset account password (backward compatibility)
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

      return { success: true, message: json.message || 'Password successfully reset.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to connect to password reset service.' };
    }
  };

  /**
   * Explicit Logout: destroys the session and signs out from Firebase Authentication.
   */
  const logout = async (reason?: string) => {
    try {
      if (auth && auth.currentUser) {
        await firebaseSignOut(auth);
      }
    } catch (err) {
      console.warn('[AuthContext] Firebase signOut warning:', err);
    }
    setCurrentUser(null);
    setUserStatusState('offline');
    clearRememberedEmail();
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem('fr8x_device_session_id');
      localStorage.setItem(STATUS_KEY, 'offline');
      if (typeof window !== 'undefined') {
        fetch('/api/auth/login', { method: 'DELETE' }).catch(() => {});
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('fr8x_auth_sync');
          bc.postMessage({ type: 'LOGOUT' });
          bc.close();
        }
      }
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

  const authContextValue = React.useMemo<AuthContextType>(
    () => ({
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
      loginWithCredentials,
      register,
      resetPasswordWithOtp,
      sendPasswordReset,
      logout,
      loadRememberedEmail: loadRememberedEmailFn,
      loadRemembered: loadRememberedEmailFn,
      bidPostingFee,
      bidDiscountPercentage,
    }),
    // Intentional: Context value is memoized on identity & auth state; handlers reference latest state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeUser,
      isAuthenticated,
      isLoading,
      allUsers,
      userStatus,
      bidPostingFee,
      bidDiscountPercentage,
      loadRememberedEmailFn,
    ]
  );

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
