'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, PlanTier, UserRole } from '@/lib/types';
import { createClient } from '@/lib/supabase/client';
import { profileService } from '@/lib/supabase/db';

export const INITIAL_USERS: UserProfile[] = [];

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
  country: 'India',
  mobile: '',
  timezone: 'Asia/Kolkata',
  preferredContactMethod: 'email',
  contactAvailability: '',
  plan: 'trial',
  hasGoldenTick: false,
  isVerified: false,
  role: 'user',
};

const ACTIVE_SESSION_KEY = 'fr8x_active_user_uid';
const STATUS_KEY = 'fr8x_user_status';
const DEVICE_EMAIL_KEY = 'fr8x_remembered_email_v3';
const SESSION_START_KEY = 'fr8x_session_start_time';
const LAST_ACTIVITY_KEY = 'fr8x_last_activity_time';

export const INACTIVITY_TIMEOUT_MS = 2 * 60 * 60 * 1000;
export const MAX_SESSION_DURATION_MS = 2 * 60 * 60 * 1000;

export function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let deviceId = localStorage.getItem('fr8x_device_id');
    if (!deviceId) {
      const match = document.cookie.match(/(?:^|;\s*)fr8x_device_id=([^;]+)/);
      if (match && match[1]) {
        deviceId = match[1];
        localStorage.setItem('fr8x_device_id', deviceId);
      }
    }
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem('fr8x_device_id', deviceId);
    }
    try {
      document.cookie = `fr8x_device_id=${deviceId}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {}
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

function saveRememberedEmail(email: string) {
  try { localStorage.setItem(DEVICE_EMAIL_KEY, email.trim().toLowerCase()); } catch {}
}

function loadRememberedEmail(): string | null {
  try { return localStorage.getItem(DEVICE_EMAIL_KEY) || null; } catch { return null; }
}

function clearRememberedEmail() {
  try { localStorage.removeItem(DEVICE_EMAIL_KEY); } catch {}
}

export type UserStatus = 'available' | 'offline';

export interface AuthContextType {
  user: UserProfile;
  isAuthenticated: boolean;
  isLoading: boolean;
  allUsers: UserProfile[];
  userStatus: UserStatus;
  setUserStatus: (status: UserStatus) => void;
  switchUser: (uid: string) => void;
  updateUser: (updatedFields: Partial<UserProfile>) => void;
  upgradePlan: (plan: PlanTier) => void;
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
  loadRememberedEmail: () => string | null;
  loadRemembered: () => string | null;
  bidPostingFee: number;
  bidDiscountPercentage: number;
  deleteAccount: (
    type: 'five_day_grace' | 'permanent',
    reason?: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  cancelAccountDeletion: () => Promise<{ success: boolean; error?: string; message?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [allUsers, setAllUsers] = useState<UserProfile[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [userStatus, setUserStatusState] = useState<UserStatus>('offline');
  const [isLoading, setIsLoading] = useState(true);

  const currentUserRef = React.useRef<UserProfile | null>(null);
  currentUserRef.current = currentUser;

  // Supabase Auth & Session Hydration
  useEffect(() => {
    let isSubscribed = true;
    const supabase = createClient();

    // 1. Initial Session Check
    supabase.auth.getSession().then(async ({ data: { session } }: any) => {
      if (!isSubscribed) return;
      if (session?.user && !checkIsSessionExpired()) {
        try {
          const profile = await profileService.getProfile(session.user.id);
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
          }
        } catch (fetchErr) {
          console.warn('[AuthContext] Error loading initial profile:', fetchErr);
        }
      } else if (session && checkIsSessionExpired()) {
        supabase.auth.signOut().catch(() => {});
        setCurrentUser(null);
        currentUserRef.current = null;
        setUserStatusState('offline');
      }
      if (isSubscribed) setIsLoading(false);
    }).catch(() => {
      if (isSubscribed) setIsLoading(false);
    });

    // 2. Authoritative Supabase Auth State Change Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!isSubscribed) return;

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          try {
            const profile = await profileService.getProfile(session.user.id);
            if (isSubscribed) {
              if (profile) {
                setCurrentUser(profile);
                currentUserRef.current = profile;
                setUserStatusState('available');
                setAllUsers((prev) => [profile, ...prev.filter((u) => u.uid !== profile.uid)]);
              }
            }
          } catch (err) {
            console.error('[AuthContext] onAuthStateChange profile load error:', err);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (isSubscribed) {
          setCurrentUser(null);
          currentUserRef.current = null;
          setUserStatusState('offline');
          try {
            localStorage.removeItem(ACTIVE_SESSION_KEY);
            localStorage.setItem(STATUS_KEY, 'offline');
          } catch {}
        }
      }
    });

    // 3. Load directory members for global platform directory
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

    return () => {
      isSubscribed = false;
      subscription.unsubscribe();
    };
  }, []);

  // Cross-tab Synchronization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('fr8x_auth_sync');
      }
    } catch {}

    const handleSync = async (data: { type: string; uid?: string | null }) => {
      if (data.type === 'LOGOUT') {
        setCurrentUser(null);
        setUserStatusState('offline');
      } else if (data.type === 'LOGIN' && data.uid) {
        const profile = await profileService.getProfile(data.uid);
        if (profile) {
          setCurrentUser(profile);
          setUserStatusState('available');
        }
      }
    };

    if (channel) {
      channel.onmessage = (e) => handleSync(e.data);
    }

    return () => {
      if (channel) channel.close();
    };
  }, []);

  // Session activity & expiration tracker
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const onUserInteraction = () => {
      const now = Date.now().toString();
      try { localStorage.setItem(LAST_ACTIVITY_KEY, now); } catch {}
    };

    window.addEventListener('mousemove', onUserInteraction, { passive: true });
    window.addEventListener('keydown', onUserInteraction, { passive: true });
    window.addEventListener('click', onUserInteraction, { passive: true });

    const checkInterval = setInterval(() => {
      if (currentUserRef.current && checkIsSessionExpired()) {
        console.warn('[AuthContext] Inactivity timeout reached. Logging out.');
        logout('Session expired due to inactivity.');
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', onUserInteraction);
      window.removeEventListener('keydown', onUserInteraction);
      window.removeEventListener('click', onUserInteraction);
      clearInterval(checkInterval);
    };
  }, []);

  const setUserStatus = (status: UserStatus) => {
    setUserStatusState(status);
    try { localStorage.setItem(STATUS_KEY, status); } catch {}
  };

  const switchUser = (_uid: string) => {
    logout('Account switching requires explicit login.');
  };

  /**
   * Deterministic Profile Update:
   * Writes directly to Supabase PostgreSQL `profiles` table.
   * Updates UI state strictly from confirmed database response.
   */
  const updateUser = async (updatedFields: Partial<UserProfile>) => {
    const base = currentUser || GUEST_USER;
    const targetUid = base.uid || (typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_SESSION_KEY) : null);
    if (!targetUid) return;

    // Optimistic update for responsiveness
    const optimistic: UserProfile = { ...base, ...updatedFields };
    setCurrentUser(optimistic);

    try {
      const result = await profileService.updateProfile(targetUid, updatedFields);
      if (result.success && result.user) {
        setCurrentUser(result.user);
        setAllUsers((list) => {
          const exists = list.some((u) => u.uid === result.user!.uid);
          return exists
            ? list.map((u) => (u.uid === result.user!.uid ? result.user! : u))
            : [result.user!, ...list];
        });
      }
    } catch (err) {
      console.error('[AuthContext] updateUser error:', err);
    }
  };

  const upgradePlan = async (plan: PlanTier) => {
    const hasGoldenTick = plan === 'premium';
    await updateUser({ plan, hasGoldenTick });
  };

  const deleteAccount = async (
    type: 'five_day_grace' | 'permanent',
    reason?: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const targetUid = currentUser?.uid || (typeof window !== 'undefined' ? localStorage.getItem(ACTIVE_SESSION_KEY) : null);
    if (!targetUid) return { success: false, error: 'No active session found.' };

    try {
      const now = new Date();
      const effectiveAt = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

      if (type === 'five_day_grace') {
        await profileService.updateProfile(targetUid, {
          accountStatus: 'pending_deletion',
          status: 'pending_deletion',
        });
        updateUser({
          accountStatus: 'pending_deletion',
          status: 'pending_deletion',
        });
        return {
          success: true,
          message: 'Account scheduled for deletion in 5 days. You can cancel anytime before it expires.',
        };
      }

      if (type === 'permanent') {
        const supabase = createClient();
        await supabase.from('profiles').delete().eq('id', targetUid);
        await supabase.auth.signOut();
        logout();
        return { success: true, message: 'Account permanently purged.' };
      }

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to process account deletion.' };
    }
  };

  const cancelAccountDeletion = async (): Promise<{ success: boolean; error?: string; message?: string }> => {
    const targetUid = currentUser?.uid;
    if (!targetUid) return { success: false, error: 'No active session found.' };

    try {
      await profileService.updateProfile(targetUid, {
        accountStatus: 'active',
        status: 'active',
      });
      updateUser({
        accountStatus: 'active',
        status: 'active',
      });
      return { success: true, message: 'Account restored to active status.' };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to cancel deletion.' };
    }
  };

  /**
   * Finalises client-side session after server authentication succeeds.
   */
  const login = (
    identifier: string,
    remember = false,
    serverVerifiedUser?: Partial<UserProfile>,
    _password?: string
  ): boolean => {
    if (!serverVerifiedUser || !serverVerifiedUser.uid) {
      console.error('[Auth] login() called without server-verified user.');
      return false;
    }

    const confirmed: UserProfile = {
      ...GUEST_USER,
      ...serverVerifiedUser,
      uid: serverVerifiedUser.uid,
      email: serverVerifiedUser.email || identifier,
      displayName: serverVerifiedUser.displayName || identifier,
    } as UserProfile;

    setCurrentUser(confirmed);
    setUserStatusState('available');

    const now = Date.now().toString();
    try {
      localStorage.setItem(ACTIVE_SESSION_KEY, confirmed.uid);
      localStorage.setItem(STATUS_KEY, 'available');
      localStorage.setItem(SESSION_START_KEY, now);
      localStorage.setItem(LAST_ACTIVITY_KEY, now);
    } catch {}

    if (remember) {
      saveRememberedEmail(confirmed.email);
    } else {
      clearRememberedEmail();
    }

    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('fr8x_auth_sync');
        bc.postMessage({ type: 'LOGIN', uid: confirmed.uid });
        bc.close();
      }
    } catch {}

    return true;
  };

  /**
   * Authoritative Supabase Email/Password Authentication.
   */
  const loginWithCredentials = async (
    email: string,
    password: string,
    remember = false
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> => {
    try {
      setIsLoading(true);
      const cleanEmail = email.trim().toLowerCase();
      const supabase = createClient();

      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('Invalid login credentials')) {
          msg = 'Invalid corporate email or password. Please verify your credentials.';
        }
        return { success: false, error: msg };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed. Please try again.' };
      }

      // Fetch confirmed profile from Supabase PostgreSQL
      let profile = await profileService.getProfile(data.user.id);

      if (!profile) {
        // Self-heal initial profile row
        const newProfile: Partial<UserProfile> = {
          email: cleanEmail,
          displayName: data.user.user_metadata?.displayName || cleanEmail.split('@')[0],
          firstName: data.user.user_metadata?.firstName || cleanEmail.split('@')[0],
          lastName: data.user.user_metadata?.lastName || '',
          company: data.user.user_metadata?.company || 'Enterprise Logistics',
          designation: data.user.user_metadata?.designation || 'Freight Procurement Manager',
          role: 'company_admin',
          plan: 'trial',
        };
        const upsertRes = await profileService.updateProfile(data.user.id, newProfile);
        profile = upsertRes.user || null;
      }

      const activeProfile = profile || {
        ...GUEST_USER,
        uid: data.user.id,
        email: cleanEmail,
        displayName: cleanEmail.split('@')[0],
      };

      setCurrentUser(activeProfile);
      setUserStatusState('available');

      if (remember) {
        saveRememberedEmail(cleanEmail);
      } else {
        clearRememberedEmail();
      }

      const now = Date.now().toString();
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, data.user.id);
        localStorage.setItem(STATUS_KEY, 'available');
        localStorage.setItem(SESSION_START_KEY, now);
        localStorage.setItem(LAST_ACTIVITY_KEY, now);
      } catch {}

      try {
        if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
          const bc = new BroadcastChannel('fr8x_auth_sync');
          bc.postMessage({ type: 'LOGIN', uid: data.user.id });
          bc.close();
        }
      } catch {}

      return { success: true, user: activeProfile };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to sign in.' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Authoritative Supabase User Registration.
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
      const supabase = createClient();

      const displayName =
        profile.displayName ||
        `${profile.firstName || ''} ${profile.lastName || ''}`.trim() ||
        cleanEmail;

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            displayName,
            firstName: profile.firstName || displayName.split(' ')[0] || '',
            lastName: profile.lastName || displayName.split(' ').slice(1).join(' ') || '',
            company: cleanCompany,
            companyId: profile.companyId || `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
            mobile: cleanMobile,
            designation: profile.designation || 'Freight Procurement Manager',
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (msg.includes('already registered')) {
          msg = `An account with this email (${cleanEmail}) already exists. Please sign in instead.`;
        }
        return { success: false, error: msg };
      }

      if (!data.user) {
        return { success: false, error: 'Registration failed. Please check your credentials.' };
      }

      // Provision profile in PostgreSQL `profiles` table
      await profileService.updateProfile(data.user.id, {
        email: cleanEmail,
        displayName,
        firstName: profile.firstName || displayName.split(' ')[0] || '',
        lastName: profile.lastName || displayName.split(' ').slice(1).join(' ') || '',
        mobile: cleanMobile,
        phone: cleanMobile,
        company: cleanCompany,
        companyId: profile.companyId || `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
        designation: profile.designation || 'Freight Procurement Manager',
        position: profile.position || profile.designation || 'Manager',
        department: profile.department || 'Logistics & Supply Chain',
        city: profile.city || 'Mumbai',
        state: profile.state || '',
        district: profile.district || '',
        country: profile.country || 'India',
        address: profile.address || profile.formattedAddress || '',
        formattedAddress: profile.formattedAddress || profile.address || '',
        postalCode: profile.postalCode || '',
        role: profile.role === 'user' ? 'user' : 'company_admin',
        plan: profile.plan || 'trial',
      });

      const confirmedProfile = await profileService.getProfile(data.user.id);
      if (confirmedProfile) {
        setCurrentUser(confirmedProfile);
        setUserStatusState('available');
      }

      const now = Date.now().toString();
      try {
        localStorage.setItem(ACTIVE_SESSION_KEY, data.user.id);
        localStorage.setItem(STATUS_KEY, 'available');
        localStorage.setItem(SESSION_START_KEY, now);
        localStorage.setItem(LAST_ACTIVITY_KEY, now);
      } catch {}

      return { success: true, user: confirmedProfile || undefined };
    } catch (err: any) {
      return { success: false, error: err.message || 'Registration failed.' };
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Password Reset via Supabase Auth.
   */
  const sendPasswordReset = async (
    email: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your corporate email address.' };
    }

    try {
      const supabase = createClient();
      const origin = typeof window !== 'undefined' ? window.location.origin : 'https://con.fr8x.in';
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return {
        success: true,
        message: `Password reset instructions have been sent to ${cleanEmail}. Please check your inbox.`,
      };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to send password reset.' };
    }
  };

  const resetPasswordWithOtp = async (
    email: string,
    otp: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string; message?: string }> => {
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_and_reset', email, otp, newPassword }),
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
   * Explicit Logout: Signs out from Supabase Auth and purges local storage.
   */
  const logout = async (reason?: string) => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('[AuthContext] Supabase signOut error:', err);
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
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('fr8x_auth_sync');
        bc.postMessage({ type: 'LOGOUT' });
        bc.close();
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
      loadRememberedEmail,
      loadRemembered: loadRememberedEmail,
      bidPostingFee,
      bidDiscountPercentage,
      deleteAccount,
      cancelAccountDeletion,
    }),
    [activeUser, isAuthenticated, isLoading, allUsers, userStatus, bidPostingFee, bidDiscountPercentage]
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
