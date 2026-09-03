'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, PlanTier, UserRole } from '@/lib/types';

// ─── Multi-Organization Initial User Directory ──────────────────────────────
export const INITIAL_USERS: UserProfile[] = [
  {
    uid: 'u-arjun',
    email: 'arjun@atlaslogistics.com',
    firstName: 'Arjun',
    lastName: 'Rao',
    displayName: 'Arjun Rao',
    designation: 'Freight Procurement Director',
    company: 'Atlas Logistics Pvt. Ltd.',
    companyId: 'CMP-00101',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    mobile: '+91 98765 43210',
    timezone: 'Asia/Kolkata',
    preferredContactMethod: 'tradeChat',
    contactAvailability: '09:00 - 18:30 IST',
    plan: 'premium',
    hasGoldenTick: true,
    isVerified: true,
    role: 'company_admin',
    avatarUrl: '',
    bio: 'Freight procurement specialist with 9+ years managing ocean FCL and OOG breakbulk across Asia-Europe and US West Coast corridors.',
    summary: 'Expertise in carrier contract negotiations, multimodal inland haulage, customs liaison, and real-time reverse auction execution.',
    specializations: ['FCL Ocean', 'OOG Breakbulk', 'Reefer Logistics', 'Customs Clearance'],
    skills: ['Rate Procurement', 'Carrier Negotiation', 'UN/LOCODE Routing', 'ERP Logistics'],
    languages: ['English', 'Hindi', 'Marathi'],
  },
  {
    uid: 'u-sarah',
    email: 'sarah.lewis@rotterdamfreight.nl',
    firstName: 'Sarah',
    lastName: 'Lewis',
    displayName: 'Sarah Lewis',
    designation: 'Ocean Freight Lead',
    company: 'Rotterdam Freight NV',
    companyId: 'CMP-00102',
    city: 'Rotterdam',
    state: 'South Holland',
    country: 'Netherlands',
    mobile: '+31 10 123 4567',
    timezone: 'Europe/Amsterdam',
    preferredContactMethod: 'email',
    contactAvailability: '08:30 - 17:00 CET',
    plan: 'professional',
    hasGoldenTick: false,
    isVerified: true,
    role: 'company_admin',
    avatarUrl: '',
    bio: 'North Continent port logistics specialist and container supply chain manager.',
    languages: ['English', 'Dutch', 'German'],
  },
  {
    uid: 'u-kiran',
    email: 'kiran.mehta@indoocean.com',
    firstName: 'Kiran',
    lastName: 'Mehta',
    displayName: 'Kiran Mehta',
    designation: 'Trade Lane Manager',
    company: 'Indo Ocean Lines',
    companyId: 'CMP-00103',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    mobile: '+91 98111 22334',
    timezone: 'Asia/Kolkata',
    preferredContactMethod: 'whatsapp',
    contactAvailability: '10:00 - 19:00 IST',
    plan: 'trial',
    hasGoldenTick: false,
    isVerified: true,
    role: 'user',
    avatarUrl: '',
    bio: 'Direct carrier relations manager specializing in Asia-Europe and Middle East trade lanes.',
    languages: ['English', 'Hindi', 'Gujarati'],
  },
  {
    uid: 'u-elena',
    email: 'elena.rossi@mediterraneanlines.it',
    firstName: 'Elena',
    lastName: 'Rossi',
    displayName: 'Elena Rossi',
    designation: 'Commercial Director',
    company: 'Mediterranean Shipping Agency S.p.A.',
    companyId: 'CMP-00104',
    city: 'Genoa',
    state: 'Liguria',
    country: 'Italy',
    mobile: '+39 010 555 9812',
    timezone: 'Europe/Rome',
    preferredContactMethod: 'tradeChat',
    contactAvailability: '08:30 - 17:30 CET',
    plan: 'premium',
    hasGoldenTick: true,
    isVerified: true,
    role: 'company_admin',
    avatarUrl: '',
    bio: 'Mediterranean and Black Sea carrier booking specialist with 12+ years liner agency experience.',
    languages: ['Italian', 'English', 'French'],
  },
  {
    uid: 'u-david',
    email: 'david.chen@pacificcargo.sg',
    firstName: 'David',
    lastName: 'Chen',
    displayName: 'David Chen',
    designation: 'VP Global Forwarding',
    company: 'Pacific Maritime Cargo Pte. Ltd.',
    companyId: 'CMP-00105',
    city: 'Singapore',
    state: 'Singapore',
    country: 'Singapore',
    mobile: '+65 6789 0123',
    timezone: 'Asia/Singapore',
    preferredContactMethod: 'tradeChat',
    contactAvailability: '09:00 - 18:00 SGT',
    plan: 'premium',
    hasGoldenTick: true,
    isVerified: true,
    role: 'company_admin',
    avatarUrl: '',
    bio: 'Intra-Asia and Transpacific container rate negotiator and reverse auction specialist.',
    languages: ['English', 'Mandarin'],
  },
];

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

// ─── Seed Passwords (uid → password) ─────────────────────────────────────────
const DEFAULT_PASSWORDS: Record<string, string> = {
  'u-arjun': 'Atlas@2025',
  'u-sarah': 'Rotterdam@2025',
  'u-kiran': 'IndoOcean@2025',
  'u-elena': 'MedLines@2025',
  'u-david': 'Pacific@2025',
};

// ─── Storage Keys ────────────────────────────────────────────────────────────
const USERS_STORAGE_KEY = 'fr8x_all_users_v2';
const PASSWORDS_STORAGE_KEY = 'fr8x_user_passwords_v2';
const ACTIVE_SESSION_KEY = 'fr8x_active_user_uid';
const STATUS_KEY = 'fr8x_user_status';
const DEVICE_KEY = 'fr8x_remembered_creds_v2';
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

// ─── Device-memory helpers ───────────────────────────────────────────────────
function saveToDevice(userId: string, password: string) {
  try {
    const payload = btoa(JSON.stringify({ userId, password }));
    localStorage.setItem(DEVICE_KEY, payload);
  } catch {}
}

function loadFromDevice(): { userId: string; password: string } | null {
  try {
    const raw = localStorage.getItem(DEVICE_KEY);
    if (!raw) return null;
    return JSON.parse(atob(raw));
  } catch {
    return null;
  }
}

function clearDevice() {
  try { localStorage.removeItem(DEVICE_KEY); } catch {}
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
  /** Accepts uid OR email + password. Returns true on success. */
  login: (
    identifier: string,
    pass: string,
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
  loadRemembered: () => { userId: string; password: string } | null;
  bidPostingFee: number;
  bidDiscountPercentage: number;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>(DEFAULT_PASSWORDS);
  const [userStatus, setUserStatusState] = useState<UserStatus>('offline');
  const [isLoading, setIsLoading] = useState(true);

  // Keep a ref to currentUser for event handlers and intervals
  const currentUserRef = React.useRef<UserProfile | null>(null);
  currentUserRef.current = currentUser;

  const lastTrackedTimeRef = React.useRef<number>(Date.now());

  // Initial load: restore registered users and active session from localStorage
  useEffect(() => {
    try {
      // 1. Load registered users with One User One Login deduplication
      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      let usersList = INITIAL_USERS;
      if (storedUsersRaw) {
        try {
          const parsed = JSON.parse(storedUsersRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Deduplicate by normalized email to enforce One User, One Login
            const seenEmails = new Set<string>();
            const deduped: UserProfile[] = [];
            for (const u of parsed) {
              const emailKey = (u.email || '').trim().toLowerCase();
              if (emailKey && !seenEmails.has(emailKey)) {
                seenEmails.add(emailKey);
                deduped.push(u);
              }
            }
            // Also ensure initial seed users are included if not present
            for (const initUser of INITIAL_USERS) {
              const initKey = initUser.email.trim().toLowerCase();
              if (!seenEmails.has(initKey)) {
                seenEmails.add(initKey);
                deduped.push(initUser);
              }
            }
            usersList = deduped.length > 0 ? deduped : INITIAL_USERS;
          }
        } catch {}
      }
      setAllUsers(usersList);

      // 2. Load stored passwords
      const storedPasswordsRaw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
      let passwordsMap = DEFAULT_PASSWORDS;
      if (storedPasswordsRaw) {
        try {
          const parsed = JSON.parse(storedPasswordsRaw);
          if (parsed && typeof parsed === 'object') {
            passwordsMap = { ...DEFAULT_PASSWORDS, ...parsed };
          }
        } catch {}
      }
      setUserPasswords(passwordsMap);

      // 3. Restore active session ONLY if explicitly saved and NOT expired
      const savedUid = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedUid) {
        const isExpired = checkIsSessionExpired();
        if (isExpired) {
          // Session expired due to inactivity / timeout while browser was closed or dormant
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
            // Refresh activity timestamp
            try {
              localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
            } catch {}
          } else {
            // Stale UID — clear
            localStorage.removeItem(ACTIVE_SESSION_KEY);
            setCurrentUser(null);
            setUserStatusState('offline');
          }
        }
      } else {
        // No session stored — start completely unauthenticated
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
        clearDevice();
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
   * Login by User ID or Corporate Email.
   * Enforces single exclusive active session.
   */
  const login = (
    identifier: string,
    pass: string,
    remember = false,
    serverVerifiedUser?: Partial<UserProfile>
  ): boolean => {
    const id = identifier.trim().toLowerCase();

    // Purge any preexisting active session data to ensure one user, one login
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(STATUS_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch {}

    // Find user by uid or email
    let found = allUsers.find(
      (u) => u.uid.toLowerCase() === id || u.email.toLowerCase() === id
    );

    // If server already authenticated and provided details, adopt user if missing in allUsers
    if (!found && serverVerifiedUser && serverVerifiedUser.uid) {
      found = {
        uid: serverVerifiedUser.uid,
        email: serverVerifiedUser.email || identifier,
        firstName: serverVerifiedUser.firstName || serverVerifiedUser.displayName?.split(' ')[0] || 'User',
        lastName: serverVerifiedUser.lastName || serverVerifiedUser.displayName?.split(' ').slice(1).join(' ') || '',
        displayName: serverVerifiedUser.displayName || identifier,
        designation: serverVerifiedUser.designation || 'Freight Procurement Manager',
        company: serverVerifiedUser.company || 'Enterprise Logistics Co.',
        companyId: serverVerifiedUser.companyId || 'CMP-00000',
        city: serverVerifiedUser.city || 'Mumbai',
        state: serverVerifiedUser.state || '',
        country: serverVerifiedUser.country || 'India',
        mobile: serverVerifiedUser.mobile || '+91 90000 00000',
        timezone: serverVerifiedUser.timezone || 'Asia/Kolkata',
        preferredContactMethod: 'tradeChat',
        contactAvailability: '09:00 - 18:00',
        plan: serverVerifiedUser.plan || 'professional',
        hasGoldenTick: false,
        isVerified: true,
        role: serverVerifiedUser.role || 'company_admin',
      };
      setAllUsers((prev) => [found!, ...prev.filter((u) => u.uid !== found!.uid && u.email.toLowerCase() !== found!.email.toLowerCase())]);
    }

    if (!found) {
      return false;
    }

    // Validate password if not verified already by server
    if (!serverVerifiedUser) {
      const expectedPass = userPasswords[found.uid] || DEFAULT_PASSWORDS[found.uid];
      if (expectedPass && pass !== expectedPass) {
        return false;
      }
    }

    setCurrentUser(found);
    setUserStatus('available');

    const now = Date.now().toString();
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, found.uid);
      localStorage.setItem(STATUS_KEY, 'available');
      localStorage.setItem(SESSION_START_KEY, now);
      localStorage.setItem(LAST_ACTIVITY_KEY, now);
    } catch {}

    if (remember) {
      saveToDevice(found.uid, pass);
    }

    return true;
  };

  const loadRemembered = () => loadFromDevice();

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

    // 1. One User, One Login check: duplicate email across same or different orgs
    const existingByEmail = allUsers.find(
      (u) => u.email.trim().toLowerCase() === cleanEmail
    );
    if (existingByEmail) {
      const isSameOrg = existingByEmail.company.trim().toLowerCase() === cleanCompany.toLowerCase();
      if (isSameOrg) {
        return {
          success: false,
          error: `An account with this corporate email (${profile.email}) is already registered in ${existingByEmail.company}. Multi-accounting in the same organization is prohibited under the One User, One Login policy. Please sign in instead.`,
        };
      } else {
        return {
          success: false,
          error: `This corporate email (${profile.email}) is already associated with another organization (${existingByEmail.company}). Multi-accounting across different organizations is strictly prohibited (One User, One Login policy). Each user is permitted only one active account.`,
        };
      }
    }

    // 2. One User, One Login check: duplicate mobile phone number
    if (cleanMobile && cleanMobile.length >= 8) {
      const existingByMobile = allUsers.find(
        (u) => u.mobile && u.mobile.replace(/[^0-9+]/g, '') === cleanMobile
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
      isVerified: true,
      role: 'company_admin',
      ...profile,
    };

    // 3. Register with server API to ensure server-side auth sync
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newUser,
          password,
        }),
      });

      if (!res.ok) {
        const json = await res.json();
        return {
          success: false,
          error: json.error || 'Server rejected registration under the One User, One Login policy.',
        };
      }
    } catch (err) {
      console.warn('[Auth] Server register request skipped, using client registry:', err);
    }

    // 4. Save to local storage as single exclusive session
    const nextUsers = [newUser, ...allUsers.filter((u) => u.email.trim().toLowerCase() !== cleanEmail)];
    setAllUsers(nextUsers);

    // Save password
    const nextPasswords = { ...userPasswords, [newUid]: password };
    setUserPasswords(nextPasswords);

    const now = Date.now().toString();
    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
      localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(nextPasswords));
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

      // Update client password store if matching user exists locally
      const cleanEmail = email.trim().toLowerCase();
      const matched = allUsers.find((u) => u.email.trim().toLowerCase() === cleanEmail);
      if (matched) {
        const nextPasswords = { ...userPasswords, [matched.uid]: newPassword };
        setUserPasswords(nextPasswords);
        try {
          localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(nextPasswords));
        } catch {}
      }

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
    clearDevice();
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.removeItem(SESSION_START_KEY);
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.setItem(STATUS_KEY, 'offline');
    } catch {}

    if (reason && typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
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
        loadRemembered,
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
