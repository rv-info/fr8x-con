'use client';

import React, { useState } from 'react';
import {
  Key,
  ShieldCheck,
  UserCheck,
  ShieldAlert,
  Check,
  X,
  Lock,
  Shield,
  Plus,
  Edit2,
  Trash2,
  Activity,
  Globe,
  Fingerprint,
} from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ROLE_PERMISSIONS } from '@/lib/godfather/utils/audit';
import { GodfatherOperator, GodfatherRole } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function AccessControlPage() {
  const { operatorsList, switchOperator, operator, requestStepUpVerification } = useGodfatherAuth();

  const [operators, setOperators] = useState<GodfatherOperator[]>(operatorsList);
  const [selectedOperator, setSelectedOperator] = useState<GodfatherOperator | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form state
  const [operatorForm, setOperatorForm] = useState({
    displayName: '',
    email: '',
    role: 'godfather_operations' as GodfatherRole,
    roleTitle: '',
    ipAddress: '',
    location: '',
    mfaEnabled: true,
    sessionHours: 8,
    auditReason: '',
  });

  // Confirmation modal
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    onConfirm: (reason: string) => void;
  } | null>(null);

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

  const handleOpenEdit = (op: GodfatherOperator) => {
    setSelectedOperator(op);
    setOperatorForm({
      displayName: op.displayName,
      email: op.email,
      role: op.role,
      roleTitle: op.roleTitle,
      ipAddress: op.ipAddress || '103.21.144.92 (Authorized VPN Mumbai-01)',
      location: op.location || 'Mumbai, India',
      mfaEnabled: op.mfaEnabled,
      sessionHours: 8,
      auditReason: `Updated RBAC subrole delegation and IP whitelist bindings for ${op.displayName}`,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenAdd = () => {
    setOperatorForm({
      displayName: '',
      email: '',
      role: 'godfather_operations',
      roleTitle: 'Regional Freight Operations Specialist',
      ipAddress: '103.21.144.100 (Authorized VPN Mumbai-04)',
      location: 'Mumbai, India',
      mfaEnabled: true,
      sessionHours: 8,
      auditReason: 'Provisioning new verified Godfather super-admin operator',
    });
    setIsAddModalOpen(true);
  };

  const handleSaveOperator = async (e: React.FormEvent, isCreatingNew: boolean) => {
    e.preventDefault();
    if (!operatorForm.auditReason.trim()) return;

    const verified = await requestStepUpVerification(
      isCreatingNew
        ? `Provision new Godfather operator ${operatorForm.email}`
        : `Modify operator privileges for ${operatorForm.displayName}`
    );
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: isCreatingNew ? 'Authorize New Operator Account Creation' : 'Commit Operator Privileges & Role Update',
      actionType: isCreatingNew ? 'OPERATOR_ACCOUNT_PROVISIONED' : 'OPERATOR_PERMISSIONS_UPDATED',
      targetLabel: `${operatorForm.displayName} (${operatorForm.email})`,
      targetId: isCreatingNew ? `gf-op-${Date.now()}` : selectedOperator?.uid || 'gf-op',
      onConfirm: () => {
        if (isCreatingNew) {
          const newOp: GodfatherOperator = {
            uid: `gf-op-${Math.floor(100 + Math.random() * 900)}`,
            displayName: operatorForm.displayName,
            email: operatorForm.email,
            role: operatorForm.role,
            roleTitle: operatorForm.roleTitle,
            ipAddress: operatorForm.ipAddress,
            location: operatorForm.location,
            mfaEnabled: operatorForm.mfaEnabled,
            mfaVerified: false,
            lastLoginAt: new Date().toISOString(),
            lastStepUpAt: new Date().toISOString(),
            activeSessionExpiry: new Date(Date.now() + operatorForm.sessionHours * 3600000).toISOString(),
          };
          setOperators([...operators, newOp]);
        } else if (selectedOperator) {
          setOperators(
            operators.map((op) =>
              op.uid === selectedOperator.uid
                ? {
                    ...op,
                    displayName: operatorForm.displayName,
                    role: operatorForm.role,
                    roleTitle: operatorForm.roleTitle,
                    ipAddress: operatorForm.ipAddress,
                    location: operatorForm.location,
                    mfaEnabled: operatorForm.mfaEnabled,
                  }
                : op
            )
          );
        }
        setIsEditModalOpen(false);
        setIsAddModalOpen(false);
        setModalConfig(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">SECURITY &amp; RBAC</span>
            <span className="gf-badge gf-badge-green text-[11px] font-mono font-bold">LEAST-PRIVILEGE MATRIX</span>
          </div>
          <h1 className="gf-page-title">Access Control, Operator Subroles &amp; RBAC Matrix</h1>
          <p className="gf-page-subtitle">
            Configure granular subrole delegation, hardware token enforcement, and privilege scopes across Con.FR8X.IN operators.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold"
        >
          <Plus className="lucide w-4 h-4" />
          <span>Provision New Operator</span>
        </button>
      </div>

      {/* Operator Accounts Card */}
      <div className="gf-card">
        <div className="gf-card-header">
          <div className="gf-card-title">
            <UserCheck className="lucide w-4 h-4 text-sky-600" />
            <span>Authorized Super-Admin Operator Profiles</span>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            ENFORCED VIA FIREBASE CUSTOM CLAIMS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th>Operator Name &amp; Identity</th>
                <th>Subrole &amp; Title</th>
                <th>Authentication Node</th>
                <th>MFA Status</th>
                <th>Session Expiry</th>
                <th className="text-right">Actions &amp; Switch</th>
              </tr>
            </thead>
            <tbody>
              {operators.map((op) => {
                const isActive = operator.uid === op.uid;
                return (
                  <tr key={op.uid} className={isActive ? 'bg-sky-50/70 font-medium' : 'hover:bg-slate-50'}>
                    <td>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {op.displayName}
                        {isActive && (
                          <span className="gf-badge gf-badge-green text-[9px] uppercase font-mono font-bold">
                            ACTIVE
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{op.email}</div>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-blue text-[10px] uppercase font-mono font-bold">
                        {op.role}
                      </span>
                      <div className="text-[11px] text-slate-600 mt-0.5">{op.roleTitle}</div>
                    </td>
                    <td>
                      <span className="font-mono text-slate-700 text-[11px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {op.ipAddress}
                      </span>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-green text-[10px] font-mono font-bold">
                        TOTP-MFA ACTIVE
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-slate-600 text-[11px]">
                        {new Date(op.activeSessionExpiry).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(op)}
                          className="gf-btn gf-btn-secondary text-[11px] py-1 px-2 font-bold flex items-center gap-1 text-sky-700 hover:bg-sky-50"
                          title="Edit subrole and permissions"
                        >
                          <Edit2 className="lucide w-3 h-3 text-sky-600" />
                          <span>Edit</span>
                        </button>

                        {!isActive ? (
                          <button
                            type="button"
                            onClick={() => switchOperator(op.uid)}
                            className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 font-bold"
                          >
                            Switch Role
                          </button>
                        ) : (
                          <span className="text-emerald-700 font-bold text-xs font-mono px-2">Current Session</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Granular Least Privilege Matrix */}
      <div className="gf-card">
        <div className="gf-card-header">
          <div className="gf-card-title">
            <ShieldCheck className="lucide w-4 h-4 text-emerald-600" />
            <span>Granular Subrole Permission Matrix</span>
          </div>
          <span className="text-xs text-slate-500 font-mono font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            ROLE-BASED ACCESS CONTROL (RBAC)
          </span>
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
                <tr key={perm.key} className="hover:bg-slate-50">
                  <td className="font-semibold text-slate-900">{perm.label}</td>
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
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300">
                            <Check className="lucide w-3 h-3" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400 border border-slate-200">
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

      {/* EDIT / ADD OPERATOR MODAL */}
      {(isEditModalOpen || isAddModalOpen) && (
        <div
          className="gf-modal-overlay"
          onClick={() => {
            setIsEditModalOpen(false);
            setIsAddModalOpen(false);
          }}
        >
          <div className="gf-modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <ShieldCheck className="lucide w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="gf-modal-title">
                    {isAddModalOpen ? 'Provision New Operator Account' : `Edit Operator: ${operatorForm.displayName}`}
                  </h3>
                  <p className="gf-modal-subtitle font-mono">
                    Firebase Custom Claims · Least-Privilege Role Assignment
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsAddModalOpen(false);
                }}
                className="gf-modal-close-btn"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveOperator(e, isAddModalOpen)}>
              <div className="gf-modal-body space-y-3.5 max-h-[72vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Operator Full Name *</label>
                    <input
                      type="text"
                      required
                      value={operatorForm.displayName}
                      onChange={(e) => setOperatorForm({ ...operatorForm, displayName: e.target.value })}
                      className="gf-input font-bold"
                      placeholder="e.g. Anand Mahindra"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">Authorized Mailbox (@fr8x.in / @con.fr8x.in) *</label>
                    <input
                      type="email"
                      required
                      disabled={!isAddModalOpen}
                      value={operatorForm.email}
                      onChange={(e) => setOperatorForm({ ...operatorForm, email: e.target.value })}
                      className="gf-input font-mono"
                      placeholder="operator.name@con.fr8x.in"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Assigned Subrole *</label>
                    <select
                      value={operatorForm.role}
                      onChange={(e) =>
                        setOperatorForm({ ...operatorForm, role: e.target.value as GodfatherRole })
                      }
                      className="gf-select font-mono font-bold"
                    >
                      <option value="godfather_owner">godfather_owner (Full Sovereign Access)</option>
                      <option value="godfather_operations">godfather_operations (Freight Ops &amp; Rates)</option>
                      <option value="godfather_moderator">godfather_moderator (Trust &amp; Safety)</option>
                      <option value="godfather_finance">godfather_finance (Billing &amp; Commercial)</option>
                      <option value="godfather_compliance">godfather_compliance (KYC &amp; Legal)</option>
                      <option value="godfather_support">godfather_support (Dossier Lookup &amp; Cases)</option>
                    </select>
                  </div>

                  <div>
                    <label className="gf-form-label">Role Title Designation *</label>
                    <input
                      type="text"
                      required
                      value={operatorForm.roleTitle}
                      onChange={(e) => setOperatorForm({ ...operatorForm, roleTitle: e.target.value })}
                      className="gf-input"
                      placeholder="e.g. Chief Risk Officer"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Authorized IP Whitelist / VPN Node *</label>
                    <input
                      type="text"
                      required
                      value={operatorForm.ipAddress}
                      onChange={(e) => setOperatorForm({ ...operatorForm, ipAddress: e.target.value })}
                      className="gf-input font-mono"
                      placeholder="103.21.144.92 (Authorized VPN Mumbai-01)"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">Operating Location *</label>
                    <input
                      type="text"
                      required
                      value={operatorForm.location}
                      onChange={(e) => setOperatorForm({ ...operatorForm, location: e.target.value })}
                      className="gf-input"
                      placeholder="Mumbai, India"
                    />
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-900">Enforce Hardware TOTP / WebAuthn MFA</div>
                    <div className="text-[10.5px] text-slate-500">Require 2FA challenge on every privileged session</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={operatorForm.mfaEnabled}
                    onChange={(e) => setOperatorForm({ ...operatorForm, mfaEnabled: e.target.checked })}
                    className="w-4 h-4 rounded text-sky-600"
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="text-xs font-bold text-amber-900 block mb-1">
                    Audited Authorization Reason *
                  </label>
                  <input
                    type="text"
                    required
                    value={operatorForm.auditReason}
                    onChange={(e) => setOperatorForm({ ...operatorForm, auditReason: e.target.value })}
                    className="gf-input"
                    placeholder="Provide operational justification for role assignment or operator provisioning"
                  />
                </div>
              </div>

              <div className="gf-modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsAddModalOpen(false);
                  }}
                  className="gf-btn gf-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  {isAddModalOpen ? 'Authorize Operator Provisioning' : 'Save Operator Permissions'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalConfig && (
        <ActionConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          actionType={modalConfig.actionType}
          targetLabel={modalConfig.targetLabel}
          targetId={modalConfig.targetId}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
