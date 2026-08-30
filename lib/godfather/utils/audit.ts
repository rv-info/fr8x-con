import { AdminAction, GodfatherRole } from '../types';

export function generateCorrelationId(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `GF-${timestamp}-${random}`;
}

export function generateActionId(): string {
  return `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
}

export function calculateDiff(before: any, after: any): { key: string; oldValue: any; newValue: any }[] {
  if (!before && !after) return [];
  if (!before) return [{ key: 'root', oldValue: null, newValue: after }];
  if (!after) return [{ key: 'root', oldValue: before, newValue: null }];

  const diffs: { key: string; oldValue: any; newValue: any }[] = [];
  const allKeys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})]);

  allKeys.forEach((k) => {
    const oldVal = before[k];
    const newVal = after[k];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      diffs.push({
        key: k,
        oldValue: oldVal !== undefined ? oldVal : '(none)',
        newValue: newVal !== undefined ? newVal : '(deleted)',
      });
    }
  });

  return diffs;
}

export function createAuditRecord(params: {
  actorUid: string;
  actorEmail: string;
  actorName: string;
  actorRole: GodfatherRole;
  targetType: AdminAction['targetType'];
  targetId: string;
  targetLabel?: string;
  actionType: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  reason: string;
  stepUpVerified?: boolean;
}): AdminAction {
  return {
    actionId: generateActionId(),
    actorUid: params.actorUid,
    actorEmail: params.actorEmail,
    actorName: params.actorName,
    actorRole: params.actorRole,
    targetType: params.targetType,
    targetId: params.targetId,
    targetLabel: params.targetLabel,
    actionType: params.actionType,
    beforeSnapshot: params.beforeSnapshot ? JSON.parse(JSON.stringify(params.beforeSnapshot)) : undefined,
    afterSnapshot: params.afterSnapshot ? JSON.parse(JSON.stringify(params.afterSnapshot)) : undefined,
    reason: params.reason || 'Administrative action performed by authorized operator',
    correlationId: generateCorrelationId(),
    createdAt: new Date().toISOString(),
    ipHash: 'sha256:8f4c2e... (Authorized VPN Node)',
    deviceInfo: 'Edge 128.0 / Windows NT 10.0 (Operator Workstation)',
    stepUpVerified: !!params.stepUpVerified,
  };
}

export const ROLE_PERMISSIONS: Record<GodfatherRole, {
  name: string;
  description: string;
  canManageUsers: boolean;
  canManageCompanies: boolean;
  canManageAuctions: boolean;
  canManageRates: boolean;
  canModerateContent: boolean;
  canManageBlacklist: boolean;
  canManagePlans: boolean;
  canManagePayments: boolean;
  canManageRoles: boolean;
  canViewAudit: boolean;
  canManageTemplates: boolean;
  canManageEmail: boolean;
  canManageSupport: boolean;
}> = {
  godfather_owner: {
    name: 'Godfather Owner',
    description: 'Full sovereign platform control, security credentials, pricing configuration, legal controls, and role management.',
    canManageUsers: true,
    canManageCompanies: true,
    canManageAuctions: true,
    canManageRates: true,
    canModerateContent: true,
    canManageBlacklist: true,
    canManagePlans: true,
    canManagePayments: true,
    canManageRoles: true,
    canViewAudit: true,
    canManageTemplates: true,
    canManageEmail: true,
    canManageSupport: true,
  },
  godfather_operations: {
    name: 'Platform Operations Lead',
    description: 'Operational control of users, companies, tenders/auctions, rate intelligence, and support escalations.',
    canManageUsers: true,
    canManageCompanies: true,
    canManageAuctions: true,
    canManageRates: true,
    canModerateContent: false,
    canManageBlacklist: false,
    canManagePlans: false,
    canManagePayments: false,
    canManageRoles: false,
    canViewAudit: true,
    canManageTemplates: true,
    canManageEmail: true,
    canManageSupport: true,
  },
  godfather_moderator: {
    name: 'Trust & Safety Moderator',
    description: 'Feeds, threaded comments, Nexus reviews, company reputation, reports, and public blacklist governance.',
    canManageUsers: false,
    canManageCompanies: false,
    canManageAuctions: false,
    canManageRates: false,
    canModerateContent: true,
    canManageBlacklist: true,
    canManagePlans: false,
    canManagePayments: false,
    canManageRoles: false,
    canViewAudit: true,
    canManageTemplates: false,
    canManageEmail: false,
    canManageSupport: false,
  },
  godfather_finance: {
    name: 'Finance & Billing Controller',
    description: 'Payment configurations, plan pricing, bid fees, discounts, GST/tax ledgers, adjustments, and refunds.',
    canManageUsers: false,
    canManageCompanies: false,
    canManageAuctions: false,
    canManageRates: false,
    canModerateContent: false,
    canManageBlacklist: false,
    canManagePlans: true,
    canManagePayments: true,
    canManageRoles: false,
    canViewAudit: true,
    canManageTemplates: false,
    canManageEmail: false,
    canManageSupport: false,
  },
  godfather_compliance: {
    name: 'Legal & KYC Compliance Officer',
    description: 'Verification documents, KYC/PAN/GSTN/MTO validation, sanctions review, evidence review, and legal holds.',
    canManageUsers: true,
    canManageCompanies: true,
    canManageAuctions: false,
    canManageRates: false,
    canModerateContent: false,
    canManageBlacklist: true,
    canManagePlans: false,
    canManagePayments: false,
    canManageRoles: false,
    canViewAudit: true,
    canManageTemplates: false,
    canManageEmail: false,
    canManageSupport: true,
  },
  godfather_support: {
    name: 'Support Operations Investigator',
    description: 'Read-only customer lookup, dossier inspection, and limited approved ticket remediation.',
    canManageUsers: false,
    canManageCompanies: false,
    canManageAuctions: false,
    canManageRates: false,
    canModerateContent: false,
    canManageBlacklist: false,
    canManagePlans: false,
    canManagePayments: false,
    canManageRoles: false,
    canViewAudit: true,
    canManageTemplates: false,
    canManageEmail: false,
    canManageSupport: true,
  },
};
