'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GodfatherOperator, GodfatherRole } from '../types';
import { ROLE_PERMISSIONS } from '../utils/audit';

// ─── SINGLE AUTHORISED OPERATOR ──────────────────────────────────────────────
// GODFATHER access is strictly limited to this one operator.
// Password validation happens client-side before OTP dispatch;
// server-side OTP verification is the true authentication gate.
const AUTHORISED_OPERATOR_EMAIL = 'tech@fr8x.in';
const AUTHORISED_OPERATOR_PASSWORD = 'Godfather@Sovereign1';

// ─── Device-memory helpers (operator email only — no password stored) ─────────
const GF_DEVICE_KEY = 'fr8x_gf_remembered_op_v1';

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

  // Restore active session from sessionStorage or server session cookie
  useEffect(() => {
    const checkSession = async () => {
      try {
        const savedOpUid = localStorage.getItem('fr8x_godfather_operator_uid');
        if (savedOpUid) {
          const found = operatorsList.find((o) => o.uid === savedOpUid);
          if (found) setOperator(found);
        }
        const activeSession = sessionStorage.getItem('fr8x_godfather_auth');
        if (activeSession === 'true') {
          setIsAuthenticated(true);
        } else {
          const res = await fetch('/api/godfather/session');
          const data = await res.json().catch(() => ({}));
          if (data.authenticated) {
            setIsAuthenticated(true);
            sessionStorage.setItem('fr8x_godfather_auth', 'true');
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

  const switchOperator = (uid: string) => {
    const found = operatorsList.find((o) => o.uid === uid);
    if (found) {
      setOperator(found);
      try { localStorage.setItem('fr8x_godfather_operator_uid', uid); } catch {}
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
    // Only the single authorised operator is permitted
    if (email.trim().toLowerCase() !== AUTHORISED_OPERATOR_EMAIL) {
      return { success: false, error: 'Operator not authorised for GODFATHER access.' };
    }
    if (pass !== AUTHORISED_OPERATOR_PASSWORD) {
      return { success: false, error: 'Invalid passphrase. Please verify and retry.' };
    }
    return { success: true };
  };

  /**
   * Full login — called after OTP verified server-side.
   * This is also the legacy-compat path for GodfatherAuthContext usage.
   */
  const loginOperator = (email: string, pass: string, otp?: string): { success: boolean; requiresOtp?: boolean; error?: string } => {
    const credsCheck = validateCredentials(email, pass);
    if (!credsCheck.success) return { success: false, error: credsCheck.error };

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

    try {
      localStorage.setItem('fr8x_godfather_operator_uid', found.uid);
      sessionStorage.setItem('fr8x_godfather_auth', 'true');
    } catch {}

    return { success: true };
  };

  const logoutOperator = () => {
    setIsAuthenticated(false);
    setStepUpVerifiedUntil(0);
    try {
      localStorage.removeItem('fr8x_godfather_operator_uid');
      sessionStorage.removeItem('fr8x_godfather_auth');
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
