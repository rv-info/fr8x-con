/**
 * lib/billing/free-access-manager.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Godfather Super Admin Global Free-Access Engine.
 * Controls Platform Billing Mode (PAID vs FREE), Super Admin personal perks,
 * User & Company Level Free-Access Overrides, Service-Specific Toggles,
 * and Immutable Audit Logging.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { ChargeableServiceType } from './billing-engine';

export type GlobalBillingMode = 'PAID' | 'FREE';

export interface ServicePolicyMap {
  subscription: 'free' | 'paid';
  jobs: 'free' | 'paid';
  advertising: 'free' | 'paid';
  auctions: 'free' | 'paid';
  registration: 'free' | 'paid';
}

export interface UserFreeOverride {
  targetId: string; // userId or companyId
  targetType: 'user' | 'company';
  targetName?: string;
  status: 'free' | 'chargeable';
  duration: 'permanent' | 'until_date' | 'days';
  expiresAt?: string;
  reason: string;
  grantedBy: string;
  grantedAt: string;
}

export interface BillingAuditLog {
  id: string;
  operatorId: string;
  operatorEmail: string;
  timestamp: string;
  action: string;
  previousState: any;
  newState: any;
  reason: string;
}

export interface PlatformBillingConfig {
  globalBillingMode: GlobalBillingMode;
  superAdminPersonalFreeAccess: boolean;
  servicePolicies: ServicePolicyMap;
  userOverrides: UserFreeOverride[];
  auditLogs: BillingAuditLog[];
  updatedAt: string;
  updatedBy: string;
}

const DEFAULT_BILLING_CONFIG: PlatformBillingConfig = {
  globalBillingMode: 'PAID',
  superAdminPersonalFreeAccess: true,
  servicePolicies: {
    subscription: 'paid',
    jobs: 'paid',
    advertising: 'paid',
    auctions: 'paid',
    registration: 'free',
  },
  userOverrides: [],
  auditLogs: [],
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

// Memory cache with fallback persistence
let inMemoryConfig: PlatformBillingConfig = { ...DEFAULT_BILLING_CONFIG };
let isInitialized = false;

const PERSISTENCE_FILE_PATH = path.join(process.cwd(), '.gemini', 'billing-config.json');

function ensurePersistenceDir() {
  try {
    const dir = path.dirname(PERSISTENCE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch {}
}

function loadPersistedConfig(): void {
  if (isInitialized) return;
  try {
    ensurePersistenceDir();
    if (fs.existsSync(PERSISTENCE_FILE_PATH)) {
      const raw = fs.readFileSync(PERSISTENCE_FILE_PATH, 'utf-8');
      const parsed = JSON.parse(raw);
      inMemoryConfig = {
        ...DEFAULT_BILLING_CONFIG,
        ...parsed,
        servicePolicies: {
          ...DEFAULT_BILLING_CONFIG.servicePolicies,
          ...(parsed.servicePolicies || {}),
        },
        userOverrides: Array.isArray(parsed.userOverrides) ? parsed.userOverrides : [],
        auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
      };
    }
  } catch (err) {
    console.warn('[lib/billing/free-access-manager] Could not read billing persistence file, using defaults.', err);
  }
  isInitialized = true;
}

function savePersistedConfig(): void {
  try {
    ensurePersistenceDir();
    fs.writeFileSync(PERSISTENCE_FILE_PATH, JSON.stringify(inMemoryConfig, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[lib/billing/free-access-manager] Could not write billing persistence file.', err);
  }
}

/**
 * Retrieves the authoritative platform billing configuration.
 */
export function getPlatformBillingConfig(): PlatformBillingConfig {
  loadPersistedConfig();
  return {
    ...inMemoryConfig,
    userOverrides: [...inMemoryConfig.userOverrides],
    auditLogs: [...inMemoryConfig.auditLogs],
  };
}

/**
 * Updates the platform billing configuration with immutable audit logging.
 */
export function updatePlatformBillingConfig(params: {
  operatorId: string;
  operatorEmail: string;
  globalBillingMode?: GlobalBillingMode;
  superAdminPersonalFreeAccess?: boolean;
  servicePolicies?: Partial<ServicePolicyMap>;
  addUserOverride?: UserFreeOverride;
  removeUserOverrideId?: string;
  reason: string;
}): PlatformBillingConfig {
  loadPersistedConfig();

  const prev = JSON.parse(JSON.stringify(inMemoryConfig));
  const now = new Date().toISOString();

  if (params.globalBillingMode !== undefined) {
    inMemoryConfig.globalBillingMode = params.globalBillingMode;
  }

  if (params.superAdminPersonalFreeAccess !== undefined) {
    inMemoryConfig.superAdminPersonalFreeAccess = params.superAdminPersonalFreeAccess;
  }

  if (params.servicePolicies) {
    inMemoryConfig.servicePolicies = {
      ...inMemoryConfig.servicePolicies,
      ...params.servicePolicies,
    };
  }

  if (params.removeUserOverrideId) {
    inMemoryConfig.userOverrides = inMemoryConfig.userOverrides.filter(
      (o) => o.targetId !== params.removeUserOverrideId
    );
  }

  if (params.addUserOverride) {
    // Replace existing override for target if present, otherwise append
    inMemoryConfig.userOverrides = inMemoryConfig.userOverrides.filter(
      (o) => o.targetId !== params.addUserOverride!.targetId
    );
    inMemoryConfig.userOverrides.push(params.addUserOverride);
  }

  inMemoryConfig.updatedAt = now;
  inMemoryConfig.updatedBy = params.operatorEmail || params.operatorId;

  // Append immutable audit log
  const auditLog: BillingAuditLog = {
    id: `blog_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    operatorId: params.operatorId,
    operatorEmail: params.operatorEmail,
    timestamp: now,
    action: params.globalBillingMode !== undefined
      ? `SET_GLOBAL_BILLING_MODE_${params.globalBillingMode}`
      : params.addUserOverride
      ? `ADD_USER_OVERRIDE_${params.addUserOverride.targetId}`
      : params.removeUserOverrideId
      ? `REMOVE_USER_OVERRIDE_${params.removeUserOverrideId}`
      : 'UPDATE_SERVICE_POLICIES',
    previousState: {
      globalBillingMode: prev.globalBillingMode,
      servicePolicies: prev.servicePolicies,
      superAdminPersonalFreeAccess: prev.superAdminPersonalFreeAccess,
    },
    newState: {
      globalBillingMode: inMemoryConfig.globalBillingMode,
      servicePolicies: inMemoryConfig.servicePolicies,
      superAdminPersonalFreeAccess: inMemoryConfig.superAdminPersonalFreeAccess,
    },
    reason: params.reason || 'Godfather administrative policy change',
  };

  inMemoryConfig.auditLogs.unshift(auditLog);
  // Cap audit logs in memory to 200
  if (inMemoryConfig.auditLogs.length > 200) {
    inMemoryConfig.auditLogs = inMemoryConfig.auditLogs.slice(0, 200);
  }

  savePersistedConfig();
  return getPlatformBillingConfig();
}

export type EntitlementPolicySource =
  | 'GLOBAL_FREE_MODE'
  | 'SUPER_ADMIN_PERK'
  | 'USER_OVERRIDE'
  | 'COMPANY_OVERRIDE'
  | 'SERVICE_POLICY'
  | 'PAID_TARIFF';

export interface EntitlementResult {
  isFree: boolean;
  reason: string;
  policySource: EntitlementPolicySource;
}

/**
 * Authoritatively evaluates whether a specific user, company, and service
 * is entitled to 100% free complimentary access.
 */
export function evaluateEntitlement(params: {
  userId?: string | null;
  companyId?: string | null;
  userRole?: string | null;
  serviceType: ChargeableServiceType;
}): EntitlementResult {
  loadPersistedConfig();

  // 1. MASTER GLOBAL FREE MODE CHECK
  if (inMemoryConfig.globalBillingMode === 'FREE') {
    return {
      isFree: true,
      reason: 'Godfather Sovereign Master Free Access mode is globally active for all services.',
      policySource: 'GLOBAL_FREE_MODE',
    };
  }

  // 2. SUPER ADMIN PERSONAL COMPLIMENTARY ACCESS
  const isSuperAdminRole =
    params.userRole === 'godfather_owner' ||
    params.userRole === 'godfather_admin' ||
    params.userRole === 'admin';

  if (isSuperAdminRole && inMemoryConfig.superAdminPersonalFreeAccess) {
    return {
      isFree: true,
      reason: 'Super Admin complimentary enterprise privileges active.',
      policySource: 'SUPER_ADMIN_PERK',
    };
  }

  // 3. INDIVIDUAL USER OVERRIDE
  if (params.userId) {
    const userOverride = inMemoryConfig.userOverrides.find(
      (o) => o.targetType === 'user' && o.targetId === params.userId
    );
    if (userOverride) {
      const now = new Date();
      const isExpired = userOverride.expiresAt ? new Date(userOverride.expiresAt) < now : false;
      if (!isExpired) {
        return {
          isFree: userOverride.status === 'free',
          reason: userOverride.reason || 'Individual User Free-Access Override active.',
          policySource: 'USER_OVERRIDE',
        };
      }
    }
  }

  // 4. COMPANY LEVEL OVERRIDE
  if (params.companyId) {
    const companyOverride = inMemoryConfig.userOverrides.find(
      (o) => o.targetType === 'company' && o.targetId === params.companyId
    );
    if (companyOverride) {
      const now = new Date();
      const isExpired = companyOverride.expiresAt ? new Date(companyOverride.expiresAt) < now : false;
      if (!isExpired) {
        return {
          isFree: companyOverride.status === 'free',
          reason: companyOverride.reason || 'Company Enterprise Complimentary Access active.',
          policySource: 'COMPANY_OVERRIDE',
        };
      }
    }
  }

  // 5. SERVICE-SPECIFIC POLICY TOGGLE
  const serviceKeyMap: Record<ChargeableServiceType, keyof ServicePolicyMap> = {
    subscription: 'subscription',
    job: 'jobs',
    ad: 'advertising',
    auction: 'auctions',
    registration: 'registration',
  };
  const policyKey = serviceKeyMap[params.serviceType] || 'subscription';
  const servicePolicy = inMemoryConfig.servicePolicies[policyKey];
  if (servicePolicy === 'free') {
    return {
      isFree: true,
      reason: `Service '${params.serviceType}' is currently promotional free for all network members.`,
      policySource: 'SERVICE_POLICY',
    };
  }

  // 6. DEFAULT COMMERCIAL TARIFF
  return {
    isFree: false,
    reason: `Standard commercial tariff applies for ${params.serviceType}.`,
    policySource: 'PAID_TARIFF',
  };
}
