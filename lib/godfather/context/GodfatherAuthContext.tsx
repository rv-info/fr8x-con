'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GodfatherOperator, GodfatherRole } from '../types';
import { ROLE_PERMISSIONS } from '../utils/audit';

export const INITIAL_GODFATHER_OPERATORS: GodfatherOperator[] = [
  {
    uid: 'gf-op-godfather',
    email: 'tech@fr8x.in',
    displayName: 'IL PADRINO (tech@fr8x.in)',
    role: 'godfather_owner',
    roleTitle: 'Godfather Supreme Administrator & Chief Controller',
    mfaEnabled: true,
    mfaVerified: true,
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
    mfaVerified: true,
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
    mfaVerified: true,
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
    mfaVerified: true,
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
    mfaVerified: true,
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
    mfaVerified: true,
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
    mfaVerified: true,
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
  isAuthenticated: boolean;
  loginOperator: (email: string, pass: string, otp?: string) => { success: boolean; requiresOtp?: boolean; error?: string };
  logoutOperator: () => void;
  // Step-up verification for sensitive actions
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
  const [operatorsList, setOperatorsList] = useState<GodfatherOperator[]>(INITIAL_GODFATHER_OPERATORS);
  const [operator, setOperator] = useState<GodfatherOperator>(INITIAL_GODFATHER_OPERATORS[0]);
  const [environment, setEnvironment] = useState<PlatformEnvironment>('Production');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);

  // Step-up modal management
  const [stepUpPromptAction, setStepUpPromptAction] = useState<string | null>(null);
  const [stepUpResolver, setStepUpResolver] = useState<((val: boolean) => void) | null>(null);
  const [stepUpVerifiedUntil, setStepUpVerifiedUntil] = useState<number>(Date.now() + 15 * 60 * 1000); // 15 mins

  // Load from local storage
  useEffect(() => {
    try {
      const savedOpUid = localStorage.getItem('fr8x_godfather_operator_uid');
      if (savedOpUid) {
        const found = operatorsList.find((o) => o.uid === savedOpUid);
        if (found) setOperator(found);
      }
      const savedEnv = localStorage.getItem('fr8x_godfather_env') as PlatformEnvironment;
      if (savedEnv) setEnvironment(savedEnv);
      const isAuth = localStorage.getItem('fr8x_godfather_auth');
      if (isAuth === 'false') setIsAuthenticated(false);
    } catch {}
  }, []);

  const switchOperator = (uid: string) => {
    const found = operatorsList.find((o) => o.uid === uid);
    if (found) {
      setOperator(found);
      try {
        localStorage.setItem('fr8x_godfather_operator_uid', uid);
      } catch {}
    }
  };

  const setEnvWithPersistence = (env: PlatformEnvironment) => {
    setEnvironment(env);
    try {
      localStorage.setItem('fr8x_godfather_env', env);
    } catch {}
  };

  const loginOperator = (email: string, pass: string, otp?: string) => {
    const found = operatorsList.find((o) => o.email.toLowerCase() === email.trim().toLowerCase());
    if (!found) {
      return { success: false, error: 'Unauthorized credentials or invalid operator account.' };
    }

    if (!otp && found.mfaEnabled) {
      return { success: false, requiresOtp: true };
    }

    if (otp && otp !== '884210' && otp !== '123456') {
      return { success: false, error: 'Invalid MFA verification code. Please check your authenticator app.' };
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
      localStorage.setItem('fr8x_godfather_auth', 'true');
    } catch {}

    return { success: true };
  };

  const logoutOperator = () => {
    setIsAuthenticated(false);
    try {
      localStorage.setItem('fr8x_godfather_auth', 'false');
    } catch {}
  };

  const isStepUpValid = Date.now() < stepUpVerifiedUntil;

  const requestStepUpVerification = (actionName: string): Promise<boolean> => {
    if (isStepUpValid) {
      return Promise.resolve(true);
    }
    return new Promise((resolve) => {
      setStepUpPromptAction(actionName);
      setStepUpResolver(() => resolve);
    });
  };

  const submitStepUpOtp = (otp: string): boolean => {
    if (otp === '884210' || otp === '123456' || otp === '777777') {
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

  const checkPermission = (key: keyof typeof ROLE_PERMISSIONS['godfather_owner']): boolean => {
    return Boolean(permissions[key]);
  };

  return (
    <GodfatherAuthContext.Provider
      value={{
        operator,
        operatorsList,
        switchOperator,
        environment,
        setEnvironment: setEnvWithPersistence,
        isAuthenticated,
        loginOperator,
        logoutOperator,
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
  if (!context) {
    throw new Error('useGodfatherAuth must be used within a GodfatherAuthProvider');
  }
  return context;
}
