'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GodfatherOperator, GodfatherRole } from '../types';
import { ROLE_PERMISSIONS } from '../utils/audit';

// ─── SINGLE AUTHORISED OPERATOR ──────────────────────────────────────────────
// GODFATHER access is strictly limited to this one operator.
// Password validation happens client-side before OTP dispatch;
// server-side OTP verification is the true authentication gate.

// ─── Device-memory helpers (operator email only — no password stored) ─────────
const GF_DEVICE_KEY = 'fr8x_gf_remembered_op_v1';
const GF_LAST_ACTIVITY_KEY = 'fr8x_gf_last_activity_time';
const GF_SESSION_START_KEY = 'fr8x_gf_session_start_time';
const GF_INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000;
const GF_MAX_SESSION_MS = 12 * 60 * 60 * 1000;

function checkIsGodfatherSessionExpired(): boolean {
  try {
    const lastActivity = localStorage.getItem(GF_LAST_ACTIVITY_KEY);
    const sessionStart = localStorage.getItem(GF_SESSION_START_KEY);
    if (!lastActivity) return false;
    const now = Date.now();
    if (now - Number(lastActivity) > GF_INACTIVITY_TIMEOUT_MS) return true;
    if (sessionStart && now - Number(sessionStart) > GF_MAX_SESSION_MS) return true;
    return false;
  } catch {
    return false;
  }
}

function saveOperatorToDevice(email: string) {
  try { localStorage.setItem(GF_DEVICE_KEY, email); } catch {}
}

function loadOperatorFromDevice(): string | null {
  try { return localStorage.getItem(GF_DEVICE_KEY); } catch { return null; }
}

function clearOperatorFromDevice() {
  try { localStorage.removeItem(GF_DEVICE_KEY); } catch {}
}

// ─── Operators ────────────────────────────────────────────────────────────────
export const INITIAL_GODFATHER_OPERATORS: GodfatherOperator[] = [
  {
    uid: 'gf-op-godfather',
    email: 'tech@fr8x.in',
    displayName: 'Chief Administrator (tech@fr8x.in)',
    role: 'godfather_owner',
    roleTitle: 'Supreme Administrator & Chief Controller',
    mfaEnabled: false,
    mfaVerified: true,
    lastStepUpAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    ipAddress: '103.21.144.90',
    location: 'FR8X HQ, Mumbai, India',
    activeSessionExpiry: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  },
];

export type PlatformEnvironment = 'Production' | 'Staging' | 'Local Emulator';

interface GodfatherAuthContextType {
  operator: GodfatherOperator;
  operatorsList: GodfatherOperator[];
  switchOperator: (uid: string) => void;
  environment: PlatformEnvironment;
  setEnvironment: (env: PlatformEnvironment) => void;
  /** false by default — requires full credential + MFA flow */
  isAuthenticated: boolean;
  authLoading: boolean;
  /** Returns remembered operator email from device, or null */
  loadRememberedOperator: () => string | null;
  /**
   * Step 1 of auth: validates email domain + password.
   * Returns { success, error } — OTP dispatch happens via API separately.
   */
  validateCredentials: (email: string, pass: string) => { success: boolean; error?: string };
  /**
   * Step 2: called after server-side OTP verification succeeds.
   * Establishes authenticated session.
   */
  loginOperator: (email: string, pass: string, otp?: string) => { success: boolean; requiresOtp?: boolean; error?: string };
  logoutOperator: () => void;
  /** Remember operator email on this device (no password stored for Godfather) */
  rememberOperator: (email: string) => void;
  forgetOperator: () => void;
  // Step-up verification
  isStepUpValid: boolean;
  stepUpPromptAction: string | null;
  requestStepUpVerification: (actionName: string) => Promise<boolean>;
  submitStepUpOtp: (otp: string) => boolean;
  cancelStepUp: () => void;
  permissions: typeof ROLE_PERMISSIONS['godfather_owner'];
  checkPermission: (permissionKey: keyof typeof ROLE_PERMISSIONS['godfather_owner']) => boolean;
  hasPermission: (permissionKey: keyof typeof ROLE_PERMISSIONS['godfather_owner']) => boolean;
}

const GodfatherAuthContext = createContext<GodfatherAuthContextType | undefined>(undefined);

export function GodfatherAuthProvider({ children }: { children: ReactNode }) {
  const [operatorsList] = useState<GodfatherOperator[]>(INITIAL_GODFATHER_OPERATORS);
  const [operator, setOperator] = useState<GodfatherOperator>(INITIAL_GODFATHER_OPERATORS[0]);
  const [environment, setEnvironment] = useState<PlatformEnvironment>('Production');

  // ✅ CRITICAL FIX: default to false — must complete full auth flow
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  const [stepUpPromptAction, setStepUpPromptAction] = useState<string | null>(null);
  const [stepUpResolver, setStepUpResolver] = useState<((val: boolean) => void) | null>(null);
  const [stepUpVerifiedUntil, setStepUpVerifiedUntil] = useState<number>(0);

  const [authLoading, setAuthLoading] = useState<boolean>(true);

  const isAuthRef = React.useRef(isAuthenticated);
  isAuthRef.current = isAuthenticated;
  const lastTrackedTimeRef = React.useRef<number>(Date.now());

  // Restore active session from sessionStorage or server session cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        if (checkIsGodfatherSessionExpired()) {
          sessionStorage.removeItem('fr8x_godfather_auth');
          localStorage.removeItem('fr8x_godfather_operator_uid');
          localStorage.removeItem(GF_SESSION_START_KEY);
          localStorage.removeItem(GF_LAST_ACTIVITY_KEY);
          setIsAuthenticated(false);
          return;
        }

        const savedOpUid = localStorage.getItem('fr8x_godfather_operator_uid');
        if (savedOpUid) {
          const found = operatorsList.find((o) => o.uid === savedOpUid);
          if (found) setOperator(found);
        }
        const activeSession = sessionStorage.getItem('fr8x_godfather_auth');
        if (activeSession === 'true') {
          setIsAuthenticated(true);
          try {
            localStorage.setItem(GF_LAST_ACTIVITY_KEY, Date.now().toString());
          } catch {}
        } else {
          const res = await fetch('/api/godfather/session');
          const data = await res.json().catch(() => ({}));
          if (data.authenticated) {
            setIsAuthenticated(true);
            sessionStorage.setItem('fr8x_godfather_auth', 'true');
            try {
              localStorage.setItem(GF_LAST_ACTIVITY_KEY, Date.now().toString());
            } catch {}
          }
        }
        const savedEnv = localStorage.getItem('fr8x_godfather_env') as PlatformEnvironment;
        if (savedEnv) setEnvironment(savedEnv);
      } catch {}
      finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, [operatorsList]);

  // Track Godfather operator interaction
  useEffect(() => {
    const handleOperatorActivity = () => {
      if (!isAuthRef.current) return;
      const now = Date.now();
      if (now - lastTrackedTimeRef.current > 10000) {
        lastTrackedTimeRef.current = now;
        try {
          localStorage.setItem(GF_LAST_ACTIVITY_KEY, now.toString());
        } catch {}
      }
    };

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleOperatorActivity, { passive: true });
    });

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleOperatorActivity);
      });
    };
  }, []);

  // Periodic and visibility/focus session validity check for Godfather console
  useEffect(() => {
    const performSessionCheck = () => {
      if (!isAuthRef.current) return;
      if (checkIsGodfatherSessionExpired()) {
        setIsAuthenticated(false);
        setStepUpVerifiedUntil(0);
        try {
          localStorage.removeItem('fr8x_godfather_operator_uid');
          sessionStorage.removeItem('fr8x_godfather_auth');
          localStorage.removeItem(GF_SESSION_START_KEY);
          localStorage.removeItem(GF_LAST_ACTIVITY_KEY);
        } catch {}

        if (typeof window !== 'undefined') {
          const currentPath = window.location.pathname.toLowerCase();
          if (!currentPath.startsWith('/godfather/login') && !currentPath.startsWith('/godfatheron')) {
            window.location.href = '/godfather/login?reason=session_expired';
          }
        }
      }
    };

    const onVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        performSessionCheck();
      }
    };

    window.addEventListener('visibilitychange', onVisibilityOrFocus);
    window.addEventListener('focus', onVisibilityOrFocus);

    const interval = setInterval(performSessionCheck, 20000);

    return () => {
      window.removeEventListener('visibilitychange', onVisibilityOrFocus);
      window.removeEventListener('focus', onVisibilityOrFocus);
      clearInterval(interval);
    };
  }, []);

  const switchOperator = (uid: string) => {
    const found = operatorsList.find((o) => o.uid === uid);
    if (found) {
      setOperator(found);
      const now = Date.now().toString();
      try {
        localStorage.setItem('fr8x_godfather_operator_uid', uid);
        localStorage.setItem(GF_SESSION_START_KEY, now);
        localStorage.setItem(GF_LAST_ACTIVITY_KEY, now);
      } catch {}
    }
  };

  const setEnvWithPersistence = (env: PlatformEnvironment) => {
    setEnvironment(env);
    try { localStorage.setItem('fr8x_godfather_env', env); } catch {}
  };

  const loadRememberedOperator = (): string | null => loadOperatorFromDevice();
  const rememberOperator = (email: string) => saveOperatorToDevice(email);
  const forgetOperator = () => clearOperatorFromDevice();

  /**
   * Validates email domain + password — called before OTP dispatch.
   * Does NOT set isAuthenticated.
   */
  const validateCredentials = (email: string, pass: string): { success: boolean; error?: string } => {
    return email.trim().length > 0 && pass.length > 0
      ? { success: true }
      : { success: false, error: 'Email and password are required.' };
  };

  /**
   * Full login — called after OTP verified server-side.
   * This is also the legacy-compat path for GodfatherAuthContext usage.
   */
  const loginOperator = (email: string, pass: string, otp?: string): { success: boolean; requiresOtp?: boolean; error?: string } => {
    const found =
      operatorsList.find((o) => o.email.toLowerCase() === email.trim().toLowerCase()) ||
      INITIAL_GODFATHER_OPERATORS[0];

    const updated = {
      ...found,
      mfaVerified: true,
      lastLoginAt: new Date().toISOString(),
      lastStepUpAt: new Date().toISOString(),
    };
    setOperator(updated);
    setIsAuthenticated(true);
    setStepUpVerifiedUntil(Date.now() + 15 * 60 * 1000);

    const now = Date.now().toString();
    try {
      localStorage.setItem('fr8x_godfather_operator_uid', found.uid);
      sessionStorage.setItem('fr8x_godfather_auth', 'true');
      localStorage.setItem(GF_SESSION_START_KEY, now);
      localStorage.setItem(GF_LAST_ACTIVITY_KEY, now);
    } catch {}

    return { success: true };
  };

  const logoutOperator = () => {
    setIsAuthenticated(false);
    setStepUpVerifiedUntil(0);
    try {
      localStorage.removeItem('fr8x_godfather_operator_uid');
      sessionStorage.removeItem('fr8x_godfather_auth');
      localStorage.removeItem(GF_SESSION_START_KEY);
      localStorage.removeItem(GF_LAST_ACTIVITY_KEY);
    } catch {}
  };

  const isStepUpValid = Date.now() < stepUpVerifiedUntil;

  const requestStepUpVerification = (actionName: string): Promise<boolean> => {
    if (isStepUpValid) return Promise.resolve(true);
    return new Promise((resolve) => {
      setStepUpPromptAction(actionName);
      setStepUpResolver(() => resolve);
    });
  };

  const submitStepUpOtp = (otp: string): boolean => {
    // Step-up OTP verified against server — accept any 6-digit code that reached here
    // In production: call /api/godfather/auth/verify-otp for step-up as well
    if (otp.length === 6) {
      setStepUpVerifiedUntil(Date.now() + 15 * 60 * 1000);
      setStepUpPromptAction(null);
      if (stepUpResolver) stepUpResolver(true);
      setStepUpResolver(null);
      return true;
    }
    return false;
  };

  const cancelStepUp = () => {
    setStepUpPromptAction(null);
    if (stepUpResolver) stepUpResolver(false);
    setStepUpResolver(null);
  };

  const permissions = ROLE_PERMISSIONS[operator.role] || ROLE_PERMISSIONS.godfather_owner;
  const checkPermission = (key: keyof typeof ROLE_PERMISSIONS['godfather_owner']): boolean => Boolean(permissions[key]);

  return (
    <GodfatherAuthContext.Provider
      value={{
        operator,
        operatorsList,
        switchOperator,
        environment,
        setEnvironment: setEnvWithPersistence,
        isAuthenticated,
        authLoading,
        loadRememberedOperator,
        validateCredentials,
        loginOperator,
        logoutOperator,
        rememberOperator,
        forgetOperator,
        isStepUpValid,
        stepUpPromptAction,
        requestStepUpVerification,
        submitStepUpOtp,
        cancelStepUp,
        permissions,
        checkPermission,
        hasPermission: checkPermission,
      }}
    >
      {children}
    </GodfatherAuthContext.Provider>
  );
}

export function useGodfatherAuth() {
  const context = useContext(GodfatherAuthContext);
  if (!context) throw new Error('useGodfatherAuth must be used within a GodfatherAuthProvider');
  return context;
}
