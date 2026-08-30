'use client';

import React from 'react';
import { Key, ShieldCheck, UserCheck, ShieldAlert, Check, X, Lock } from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ROLE_PERMISSIONS } from '@/lib/godfather/utils/audit';

export default function AccessControlPage() {
  const { operatorsList, switchOperator, operator } = useGodfatherAuth();

  const permissionsList = [
    { key: 'canManageUsers', label: 'Users & Profiles Governance' },
    { key: 'canManageCompanies', label: 'Corporate KYC & Tax Licenses' },
    { key: 'canManageAuctions', label: 'Auctions & Tender Administration' },
    { key: 'canManageRates', label: 'Rates & Bulk Import Pipeline' },
    { key: 'canModerateContent', label: 'Trust & Content Moderation' },
    { key: 'canManageBlacklist', label: 'Blacklist Registry & Member Blocks' },
    { key: 'canManagePlans', label: 'Plans & Versioned Pricing' },
    { key: 'canManagePayments', label: 'Payment Gateways & Configurations' },
    { key: 'canManageRoles', label: 'Access Control & Subrole Delegation' },
    { key: 'canViewAudit', label: 'Immutable Audit Ledger' },
    { key: 'canManageTemplates', label: 'System Message Templates' },
    { key: 'canManageSupport', label: 'Support Cases & Customer Dossier' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">PLATFORM</span>
            <span className="gf-badge gf-badge-green text-[11px]">Least-Privilege RBAC Matrix</span>
          </div>
          <h1 className="gf-page-title">Access Control, Operator Subroles & Governance Matrix</h1>
          <p className="gf-page-subtitle">
            Configure granular subrole delegation, hardware token enforcement, and privilege scopes across Con.FR8X.IN operators
          </p>
        </div>
      </div>

      {/* Operator Accounts Card */}
      <div className="gf-card">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserCheck className="lucide w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-bold text-slate-100">Authorized Super-Admin Operator Profiles</h3>
          </div>
          <span className="text-xs text-mut font-mono">ENFORCED VIA FIREBASE CUSTOM CLAIMS</span>
        </div>

        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th>Operator Name & Identity</th>
                <th>Subrole & Title</th>
                <th>Authentication Node</th>
                <th>MFA Status</th>
                <th>Session Expiry</th>
                <th className="text-right">Quick Testing Switch</th>
              </tr>
            </thead>
            <tbody>
              {operatorsList.map((op) => {
                const isActive = operator.uid === op.uid;
                return (
                  <tr key={op.uid} className={isActive ? 'bg-sky-950/20' : ''}>
                    <td>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        {op.displayName}
                        {isActive && (
                          <span className="gf-badge gf-badge-green text-[9px] uppercase font-mono">
                            ACTIVE OPERATOR
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-mut font-mono">{op.email}</div>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-blue text-[10px] uppercase font-mono font-bold">
                        {op.role}
                      </span>
                      <div className="text-[10px] text-slate-300 mt-0.5">{op.roleTitle}</div>
                    </td>
                    <td>
                      <span className="font-mono text-slate-300 text-[11px]">{op.ipAddress}</span>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-green text-[10px] font-mono">
                        TOTP-MFA ENABLED
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-slate-400 text-[10px]">
                        {new Date(op.activeSessionExpiry).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="text-right">
                      {!isActive ? (
                        <button
                          type="button"
                          onClick={() => switchOperator(op.uid)}
                          className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5"
                        >
                          Switch Role
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-bold text-xs font-mono">Current</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Granular Least Privilege Matrix */}
      <div className="gf-card p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="lucide w-4 h-4 text-emerald-400" />
            <h3 className="text-sm font-bold text-slate-100">Granular Subrole Permission Matrix</h3>
          </div>
          <span className="text-xs text-mut font-mono">ROLE-BASED ACCESS CONTROL (RBAC)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th>Operational Scope</th>
                <th className="text-center font-mono">godfather_owner</th>
                <th className="text-center font-mono">godfather_operations</th>
                <th className="text-center font-mono">godfather_moderator</th>
                <th className="text-center font-mono">godfather_finance</th>
                <th className="text-center font-mono">godfather_compliance</th>
                <th className="text-center font-mono">godfather_support</th>
              </tr>
            </thead>
            <tbody>
              {permissionsList.map((perm) => (
                <tr key={perm.key}>
                  <td className="font-semibold text-slate-200">{perm.label}</td>
                  {(
                    [
                      'godfather_owner',
                      'godfather_operations',
                      'godfather_moderator',
                      'godfather_finance',
                      'godfather_compliance',
                      'godfather_support',
                    ] as const
                  ).map((role) => {
                    const isGranted = (ROLE_PERMISSIONS[role] as any)[perm.key];
                    return (
                      <td key={role} className="text-center">
                        {isGranted ? (
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                            <Check className="lucide w-3 h-3" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-slate-600 border border-slate-800">
                            <X className="lucide w-3 h-3" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
