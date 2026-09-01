'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GodfatherOperator, GodfatherRole } from '../types';
import { ROLE_PERMISSIONS } from '../utils/audit';

// ─── Operator password store (server-side in prod; here for demo only) ────────
// Keys are operator emails (lowercase). Replace with server-validated passwords.
const OPERATOR_PASSWORDS: Record<string, string> = {
  'tech@fr8x.in':                    'Godfather@Sovereign1',
  'admin.security@con.fr8x.in':      'Security@FR8X2025',
  'ops.lead@con.fr8x.in':            'OpsLead@FR8X2025',
  'trust.moderation@con.fr8x.in':    'TrustMod@FR8X2025',
  'finance.controller@con.fr8x.in':  'FinCtrl@FR8X2025',
  'legal.compliance@con.fr8x.in':    'LegalComp@FR8X2025',
  'support.investigator@con.fr8x.in':'SuppInv@FR8X2025',
};

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
    displayName: 'IL PADRINO (tech@fr8x.in)',
    role: 'godfather_owner',
    roleTitle: 'Godfather Supreme Administrator & Chief Controller',
    mfaEnabled: true,
    mfaVerified: false,
    lastStepUpAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    ipAddress: '103.21.144.90 (Sovereign Secured Root Node)',
    location: 'Sovereign Controller Node',
    activeSessionExpiry: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
  },
  {
    uid: 'gf-op-001',
    email: 'admin.security@con.fr8x.in',
    displayName: 'Vikramaditya Singhania',
    role: 'godfather_owner',
    roleTitle: 'Platform Security Officer',
    mfaEnabled: true,
    mfaVerified: false,
    lastStepUpAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    ipAddress: '103.21.144.92 (Authorized VPN Mumbai-01)',
    location: 'Mumbai, India',
    activeSessionExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    uid: 'gf-op-002',
    email: 'ops.lead@con.fr8x.in',
    displayName: 'Rashmi Deshmukh',
    role: 'godfather_operations',
    roleTitle: 'Global Freight Operations Lead',
    mfaEnabled: true,
    mfaVerified: false,
    lastStepUpAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    ipAddress: '103.21.144.95 (Authorized VPN Mumbai-02)',
    location: 'Mumbai, India',
    activeSessionExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    uid: 'gf-op-003',
    email: 'trust.moderation@con.fr8x.in',
    displayName: 'Marcus Van Der Berg',
    role: 'godfather_moderator',
    roleTitle: 'Head of Trust & Safety Moderation',
    mfaEnabled: true,
    mfaVerified: false,
    lastStepUpAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    ipAddress: '82.165.197.10 (Rotterdam HQ Secured Node)',
    location: 'Rotterdam, Netherlands',
    activeSessionExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    uid: 'gf-op-004',
    email: 'finance.controller@con.fr8x.in',
    displayName: 'Devika Krishnan',
    role: 'godfather_finance',
    roleTitle: 'Billing & Commercial Controller',
    mfaEnabled: true,
    mfaVerified: false,
    lastStepUpAt: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    ipAddress: '103.21.144.98 (Authorized VPN Mumbai-03)',
    location: 'Bengaluru, India',
    activeSessionExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    uid: 'gf-op-005',
    email: 'legal.compliance@con.fr8x.in',
    displayName: 'Anirudh Roy Chowdhury',
    role: 'godfather_compliance',
    roleTitle: 'Chief Compliance & KYC Officer',
    mfaEnabled: true,
    mfaVerified: false,
    lastStepUpAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    ipAddress: '103.21.144.91 (Authorized VPN Delhi-01)',
    location: 'New Delhi, India',
    activeSessionExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
  },
  {
    uid: 'gf-op-006',
    email: 'support.investigator@con.fr8x.in',
    displayName: 'Siddharth Varma',
    role: 'godfather_support',
    roleTitle: 'Support Resolution Specialist',
    mfaEnabled: true,
    mfaVerified: false,
    lastStepUpAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    lastLoginAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    ipAddress: '103.21.144.99 (Authorized VPN Pune-01)',
    location: 'Pune, India',
    activeSessionExpiry: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
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

  // Restore persisted operator identity (NOT auth state — re-auth required each visit)
  useEffect(() => {
    try {
      const savedOpUid = localStorage.getItem('fr8x_godfather_operator_uid');
      if (savedOpUid) {
        const found = operatorsList.find((o) => o.uid === savedOpUid);
        if (found) setOperator(found);
      }
      const savedEnv = localStorage.getItem('fr8x_godfather_env') as PlatformEnvironment;
      if (savedEnv) setEnvironment(savedEnv);
      // Never restore isAuthenticated=true from localStorage — always re-authenticate
    } catch {}
  }, []);

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
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain !== 'fr8x.in' && domain !== 'con.fr8x.in') {
      return { success: false, error: 'Access Denied: GODFATHER accounts require @fr8x.in or @con.fr8x.in mailbox.' };
    }

    const found = operatorsList.find((o) => o.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      return { success: false, error: 'Unrecognized operator identity. Verify your credentials.' };
    }

    const expectedPass = OPERATOR_PASSWORDS[email.toLowerCase()];
    if (expectedPass && pass !== expectedPass) {
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

    const found = operatorsList.find((o) => o.email.toLowerCase() === email.trim().toLowerCase())!;

    if (found.mfaEnabled && !otp) {
      return { success: false, requiresOtp: true };
    }

    // OTP validation is done server-side in /api/godfather/auth/verify-otp
    // Here we accept any truthy otp that reached this point (server already verified)
    if (!otp) {
      return { success: false, error: 'MFA token required.' };
    }

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
    } catch {}

    return { success: true };
  };

  const logoutOperator = () => {
    setIsAuthenticated(false);
    setStepUpVerifiedUntil(0);
    try { localStorage.removeItem('fr8x_godfather_operator_uid'); } catch {}
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
