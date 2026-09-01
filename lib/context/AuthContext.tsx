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
  login: (identifier: string, pass: string, remember?: boolean) => boolean;
  register: (profile: Partial<UserProfile>, password?: string) => void;
  logout: () => void;
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

  // Initial load: restore registered users and active session from localStorage
  useEffect(() => {
    try {
      // 1. Load registered users
      const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      let usersList = INITIAL_USERS;
      if (storedUsersRaw) {
        try {
          const parsed = JSON.parse(storedUsersRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            usersList = parsed;
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

      // 3. Restore active session ONLY if explicitly saved
      const savedUid = localStorage.getItem(ACTIVE_SESSION_KEY);
      if (savedUid) {
        const found = usersList.find((u) => u.uid === savedUid);
        if (found) {
          setCurrentUser(found);
          const savedStatus = (localStorage.getItem(STATUS_KEY) as UserStatus) || 'available';
          setUserStatusState(savedStatus);
        } else {
          // Stale UID — clear
          localStorage.removeItem(ACTIVE_SESSION_KEY);
          setCurrentUser(null);
          setUserStatusState('offline');
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

  const setUserStatus = (status: UserStatus) => {
    setUserStatusState(status);
    try { localStorage.setItem(STATUS_KEY, status); } catch {}
  };

  const switchUser = (uid: string) => {
    const found = allUsers.find((u) => u.uid === uid);
    if (found) {
      setCurrentUser(found);
      setUserStatusState('available');
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, uid);
        localStorage.setItem(STATUS_KEY, 'available');
      } catch {}
    }
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
   */
  const login = (identifier: string, pass: string, remember = false): boolean => {
    const id = identifier.trim().toLowerCase();

    // Find user by uid or email
    const found = allUsers.find(
      (u) => u.uid.toLowerCase() === id || u.email.toLowerCase() === id
    );

    if (!found) {
      return false;
    }

    // Validate password
    const expectedPass = userPasswords[found.uid] || DEFAULT_PASSWORDS[found.uid];
    if (expectedPass && pass !== expectedPass) {
      return false;
    }

    setCurrentUser(found);
    setUserStatus('available');

    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, found.uid);
      localStorage.setItem(STATUS_KEY, 'available');
    } catch {}

    if (remember) {
      saveToDevice(found.uid, pass);
    }

    return true;
  };

  const loadRemembered = () => loadFromDevice();

  /**
   * Register a new freight organization and user account.
   */
  const register = (profile: Partial<UserProfile>, password = 'Password@123') => {
    const newUid = `u-${Date.now()}`;
    const newUser: UserProfile = {
      uid: newUid,
      email: profile.email || `user@${(profile.company || 'logistics').toLowerCase().replace(/\s+/g, '')}.com`,
      firstName: profile.firstName || 'User',
      lastName: profile.lastName || '',
      displayName: `${profile.firstName || 'User'} ${profile.lastName || ''}`.trim(),
      designation: profile.designation || 'Freight Procurement Manager',
      company: profile.company || 'Enterprise Logistics Co.',
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

    const nextUsers = [newUser, ...allUsers];
    setAllUsers(nextUsers);
    setCurrentUser(newUser);
    setUserStatus('available');

    // Save password
    const nextPasswords = { ...userPasswords, [newUid]: password };
    setUserPasswords(nextPasswords);

    try {
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(nextUsers));
      localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(nextPasswords));
      localStorage.setItem(ACTIVE_SESSION_KEY, newUid);
      localStorage.setItem(STATUS_KEY, 'available');
    } catch {}
  };

  /**
   * Explicit Logout: destroys the session and sets user to null (unauthenticated).
   */
  const logout = () => {
    setCurrentUser(null);
    setUserStatusState('offline');
    clearDevice();
    try {
      localStorage.removeItem(ACTIVE_SESSION_KEY);
      localStorage.setItem(STATUS_KEY, 'offline');
    } catch {}
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
