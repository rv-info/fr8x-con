'use client';

import React, { useState } from 'react';
import {
  Users,
  Search,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Edit,
  LogOut,
  Clock,
  MapPin,
  Mail,
  Phone,
  Building,
  Award,
  Lock,
  Eye,
  Sliders,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { UserProfile } from '@/lib/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';
import { BlockScope } from '@/lib/godfather/types';

export default function UsersGovernancePage() {
  const {
    users,
    toggleUserVerification,
    toggleUserGoldTick,
    updateUserProfileAudited,
    blockUserScoped,
    forceUserLogout,
    grantFreeTrial,
  } = useGodfatherData();
  const { requestStepUpVerification, checkPermission } = useGodfatherAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Free trial modal state
  const [trialUserTarget, setTrialUserTarget] = useState<UserProfile | null>(null);
  const [trialDuration, setTrialDuration] = useState(30);
  const [trialReason, setTrialReason] = useState('Promotional enterprise onboarding approved by Godfather');
  const [isTrialModalOpen, setIsTrialModalOpen] = useState(false);

  // Modal states
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    beforeSnapshot?: any;
    afterSnapshot?: any;
    isDestructive?: boolean;
    onConfirm: (reason: string) => void;
  } | null>(null);

  // Block modal specific state
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockUserTarget, setBlockUserTarget] = useState<UserProfile | null>(null);
  const [selectedScopes, setSelectedScopes] = useState<BlockScope[]>(['feed_post', 'auction_bid', 'chat']);
  const [blockReasonCode, setBlockReasonCode] = useState<any>('fraud_risk');
  const [blockReasonText, setBlockReasonText] = useState('');

  // Profile correction modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<Partial<UserProfile>>({});

  const filteredUsers = users.filter(
    (u) =>
      u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.gstn && u.gstn.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleToggleVerification = (u: UserProfile) => {
    const newState = !u.isVerified;
    setModalConfig({
      isOpen: true,
      title: newState ? 'Approve Member Verification' : 'Revoke Member Verification',
      actionType: newState ? 'USER_VERIFICATION_GRANT' : 'USER_VERIFICATION_REVOKE',
      targetLabel: u.displayName,
      targetId: u.uid,
      beforeSnapshot: { isVerified: u.isVerified },
      afterSnapshot: { isVerified: newState },
      isDestructive: !newState,
      onConfirm: async (reason) => {
        await toggleUserVerification(u.uid, newState, reason);
        setModalConfig(null);
      },
    });
  };

  const handleToggleGoldTick = async (u: UserProfile) => {
    // Step-up verification required for Gold verification
    const verified = await requestStepUpVerification('Grant / Revoke Premium Gold Verification Tick');
    if (!verified) return;

    const newState = !u.hasGoldenTick;
    setModalConfig({
      isOpen: true,
      title: newState ? 'Grant Gold Verified Badge (Premium)' : 'Revoke Gold Verified Badge',
      actionType: newState ? 'GOLDEN_TICK_GRANTED' : 'GOLDEN_TICK_REVOKED',
      targetLabel: u.displayName,
      targetId: u.uid,
      beforeSnapshot: { hasGoldenTick: u.hasGoldenTick },
      afterSnapshot: { hasGoldenTick: newState },
      isDestructive: !newState,
      onConfirm: async (reason) => {
        await toggleUserGoldTick(u.uid, newState, reason);
        setModalConfig(null);
      },
    });
  };

  const handleForceLogout = async (u: UserProfile) => {
    setModalConfig({
      isOpen: true,
      title: 'Force Revocation of Active Sessions',
      actionType: 'FORCE_LOGOUT_REVOKE_SESSIONS',
      targetLabel: u.displayName,
      targetId: u.uid,
      isDestructive: true,
      onConfirm: async (reason) => {
        await forceUserLogout(u.uid, reason);
        setModalConfig(null);
      },
    });
  };

  const handleOpenEdit = (u: UserProfile) => {
    setSelectedUser(u);
    setEditFormData({
      firstName: u.firstName,
      lastName: u.lastName,
      designation: u.designation,
      company: u.company,
      city: u.city,
      gstn: u.gstn || '',
      pan: u.pan || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setModalConfig({
      isOpen: true,
      title: 'Commit Audited Profile Corrections',
      actionType: 'USER_PROFILE_CORRECTED',
      targetLabel: selectedUser.displayName,
      targetId: selectedUser.uid,
      beforeSnapshot: selectedUser,
      afterSnapshot: { ...selectedUser, ...editFormData },
      onConfirm: async (reason) => {
        await updateUserProfileAudited(selectedUser.uid, editFormData, reason);
        setIsEditModalOpen(false);
        setModalConfig(null);
      },
    });
  };

  const handleOpenBlockModal = (u: UserProfile) => {
    setBlockUserTarget(u);
    setBlockReasonText('');
    setIsBlockModalOpen(true);
  };

  const handleCommitBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockUserTarget) return;

    // High risk action: requires Step-up verification
    const verified = await requestStepUpVerification(`Apply Member Scoped Block on ${blockUserTarget.displayName}`);
    if (!verified) return;

    await blockUserScoped({
      uid: blockUserTarget.uid,
      name: blockUserTarget.displayName,
      email: blockUserTarget.email,
      scopes: selectedScopes,
      reasonCode: blockReasonCode,
      reasonText: blockReasonText,
    });

    setIsBlockModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">OPERATIONS</span>
            <span className="gf-badge gf-badge-gray text-[11px]">{users.length} Active Records</span>
          </div>
          <h1 className="gf-page-title">Users & Profiles Governance Workspace</h1>
          <p className="gf-page-subtitle">
            Search, inspect, verify, apply feature blocks, correct profiles, and audit freight member credentials
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="gf-card">
        {/* Excel Formula Bar Toolbar */}
        <div className="gf-excel-toolbar">
          <div className="gf-excel-formula-bar">
            <span className="gf-excel-formula-fx">fx</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search or filter operators by name, email, company, GSTN..."
              className="gf-excel-formula-input"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-600 font-mono">
            <span>SHOWING: <strong className="text-slate-900">{filteredUsers.length}</strong> / {users.length} ROWS</span>
          </div>
        </div>

        {/* Users Dense Table in Excel Grid */}
        <div className="gf-excel-sheet border-t-0 rounded-t-none">
          <table className="gf-table">
            <thead>
              <tr>
                <th className="col-index">#</th>
                <th className="text-left">OPERATOR &amp; IDENTITY</th>
                <th className="text-left">COMPANY &amp; TAX IDS</th>
                <th className="text-left">LOCATION &amp; TIMEZONE</th>
                <th className="text-center">PLAN &amp; VERIFICATION</th>
                <th className="text-center">PRIVILEGES</th>
                <th className="text-right">GOVERNANCE ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u, idx) => {
                return (
                  <tr key={u.uid}>
                    {/* Index */}
                    <td className="col-index">{idx + 1}</td>

                    {/* Identity */}
                    <td className="text-left">
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        {u.displayName}
                        {u.hasGoldenTick && (
                          <span className="text-amber-500 font-bold" title="Premium Gold Tick Verified">
                            ★
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">{u.email}</div>
                      <div className="text-[10px] text-slate-400">{u.designation}</div>
                    </td>

                    {/* Company */}
                    <td className="text-left">
                      <div className="font-semibold text-slate-800">{u.company}</div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        GST: {u.gstn ? <span className="text-sky-700 font-bold">{u.gstn}</span> : 'Not Provided'}
                      </div>
                      {u.pan && <div className="text-[10px] text-slate-400 font-mono">PAN: {u.pan}</div>}
                    </td>

                    {/* Location & Timezone Clock */}
                    <td className="text-left">
                      <div className="flex items-center gap-1 text-slate-700">
                        <MapPin className="lucide w-3 h-3 text-slate-400" />
                        <span>{u.city}, {u.country}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
                        <Clock className="lucide w-3 h-3 text-slate-400" />
                        <span className="font-mono text-slate-600 px-1 py-0.5 rounded border border-slate-200 bg-slate-100 text-[10px]">
                          {u.timezone}
                        </span>
                      </div>
                    </td>

                    {/* Plan & Verification */}
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className={`gf-badge ${u.plan === 'premium' ? 'gf-badge-gold' : u.plan === 'professional' ? 'gf-badge-blue' : 'gf-badge-gray'} text-[10px] uppercase font-bold`}>
                          {u.plan}
                        </span>
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        {u.isVerified ? (
                          <span className="gf-badge gf-badge-green text-[10px]">
                            <CheckCircle2 className="lucide w-3 h-3 mr-1" /> Verified
                          </span>
                        ) : (
                          <span className="gf-badge gf-badge-amber text-[10px]">
                            Pending Verification
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Privileges */}
                    <td className="text-center">
                      <span className="text-[11px] font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {u.role}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-right" style={{ whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px' }}>
                        {/* Grant Promotional 100% Free Access */}
                        <button
                          type="button"
                          onClick={() => {
                            setTrialUserTarget(u);
                            setTrialReason('100% Fee-Waiver Promotional Access authorized by Godfather Super Admin');
                            setIsTrialModalOpen(true);
                          }}
                          className="gf-btn"
                          style={{
                            fontSize: '11px',
                            padding: '3px 8px',
                            height: '26px',
                            background: '#ecfdf5',
                            color: '#065f46',
                            border: '1px solid #a7f3d0',
                            fontWeight: 800,
                          }}
                          title="Grant 100% Free Promotional Period (Internal Override)"
                        >
                          🎁 Promo Access
                        </button>

                        {/* Edit Profile */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="gf-btn gf-btn-secondary"
                          style={{ fontSize: '11px', padding: '3px 7px', height: '26px' }}
                          title="Correct Profile Data"
                        >
                          <Edit style={{ width: '13px', height: '13px', color: '#475569' }} />
                        </button>

                        {/* Toggle Verification */}
                        <button
                          type="button"
                          onClick={() => handleToggleVerification(u)}
                          className={`gf-btn ${u.isVerified ? 'gf-btn-secondary' : 'gf-btn-success'}`}
                          style={{ fontSize: '11px', padding: '3px 8px', height: '26px' }}
                          title={u.isVerified ? 'Revoke Verification' : 'Verify Member'}
                        >
                          {u.isVerified ? 'Unverify' : 'Verify'}
                        </button>

                        {/* Toggle Gold Tick */}
                        <button
                          type="button"
                          onClick={() => handleToggleGoldTick(u)}
                          className={`gf-btn ${u.hasGoldenTick ? 'gf-btn-secondary' : 'gf-btn-warning'}`}
                          style={{ fontSize: '11px', padding: '3px 8px', height: '26px' }}
                          title="Toggle Premium Gold Tick"
                        >
                          ★ Gold
                        </button>

                        {/* Block Scopes */}
                        <button
                          type="button"
                          onClick={() => handleOpenBlockModal(u)}
                          className="gf-btn gf-btn-danger"
                          style={{ fontSize: '11px', padding: '3px 7px', height: '26px' }}
                          title="Apply Feature / Login Block"
                        >
                          <Lock style={{ width: '13px', height: '13px' }} />
                        </button>

                        {/* Force Logout */}
                        <button
                          type="button"
                          onClick={() => handleForceLogout(u)}
                          className="gf-btn gf-btn-secondary"
                          style={{ fontSize: '11px', padding: '3px 7px', height: '26px' }}
                          title="Force Session Revocation"
                        >
                          <LogOut style={{ width: '13px', height: '13px' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <div className="gf-excel-status-bar">
            <span>● OPERATOR DIRECTORY</span>
            <span>Total Rows: {filteredUsers.length} of {users.length} | Selected: 0 | Auto-Filter: Active</span>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title">Audited Profile Correction</h3>
                <p className="gf-modal-subtitle">{selectedUser.displayName} ({selectedUser.uid})</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="gf-modal-body space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="gf-form-group">
                  <label className="gf-form-label">First Name</label>
                  <input
                    type="text"
                    value={editFormData.firstName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                    className="gf-input w-full text-xs"
                  />
                </div>
                <div className="gf-form-group">
                  <label className="gf-form-label">Last Name</label>
                  <input
                    type="text"
                    value={editFormData.lastName || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                    className="gf-input w-full text-xs"
                  />
                </div>
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label">Company Legal Name</label>
                <input
                  type="text"
                  value={editFormData.company || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, company: e.target.value })}
                  className="gf-input w-full text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="gf-form-group">
                  <label className="gf-form-label">GST Identification (GSTN)</label>
                  <input
                    type="text"
                    value={editFormData.gstn || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, gstn: e.target.value })}
                    className="gf-input w-full text-xs font-mono"
                  />
                </div>
                <div className="gf-form-group">
                  <label className="gf-form-label">PAN Number</label>
                  <input
                    type="text"
                    value={editFormData.pan || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, pan: e.target.value })}
                    className="gf-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  Review & Commit Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scoped Block Modal */}
      {isBlockModalOpen && blockUserTarget && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card gf-action-modal">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title">Apply Scoped Platform Restriction / Block</h3>
                <p className="gf-modal-subtitle">Member: {blockUserTarget.displayName} ({blockUserTarget.email})</p>
              </div>
              <button onClick={() => setIsBlockModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleCommitBlock} className="gf-modal-body space-y-4">
              <div className="gf-callout gf-callout-amber text-xs">
                Select granular feature restrictions. The user will be barred only from the selected scopes rather than an unlogged hard block.
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Restriction Scopes</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {[
                    { id: 'login', label: 'Total Login Block' },
                    { id: 'feed_post', label: 'Feed & Post Publishing' },
                    { id: 'chat', label: 'Trade Chat Messaging' },
                    { id: 'nexus', label: 'Nexus & Reviews Posting' },
                    { id: 'auction_bid', label: 'Submitting Auction Bids' },
                    { id: 'auction_create', label: 'Creating New Auctions' },
                    { id: 'rate_pub', label: 'Publishing Freight Rates' },
                    { id: 'job_pub', label: 'Posting Logistics Jobs' },
                  ].map((scope) => {
                    const isChecked = selectedScopes.includes(scope.id as BlockScope);
                    return (
                      <label
                        key={scope.id}
                        className={`flex items-center gap-2 p-2 rounded border text-xs cursor-pointer transition-colors ${
                          isChecked ? 'bg-slate-800 border-red-700 text-red-300 font-semibold' : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedScopes([...selectedScopes, scope.id as BlockScope]);
                            } else {
                              setSelectedScopes(selectedScopes.filter((s) => s !== scope.id));
                            }
                          }}
                        />
                        <span>{scope.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Reason Code</label>
                  <select
                    value={blockReasonCode}
                    onChange={(e) => setBlockReasonCode(e.target.value as any)}
                    className="gf-select w-full text-xs"
                  >
                    <option value="fraud_risk">Fraud / Payment Risk</option>
                    <option value="abuse">Harassment / Platform Abuse</option>
                    <option value="policy_violation">Terms of Service Violation</option>
                    <option value="non_payment">Unresolved Commercial Claim</option>
                    <option value="document_issue">Unverified Legal Documents</option>
                    <option value="spam">Commercial Solicitation / Spam</option>
                  </select>
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Expiry Window</label>
                  <select className="gf-select w-full text-xs">
                    <option value="30d">30 Days</option>
                    <option value="90d">90 Days</option>
                    <option value="indefinite">Indefinite (Compliance Review)</option>
                  </select>
                </div>
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Mandatory Operational Rationale</label>
                <textarea
                  required
                  rows={2}
                  value={blockReasonText}
                  onChange={(e) => setBlockReasonText(e.target.value)}
                  placeholder="Detail the exact compliance or fraud findings..."
                  className="gf-textarea w-full text-xs"
                />
              </div>

              <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsBlockModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-danger">
                  Execute Step-Up & Apply Block
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Free Trial Modal */}
      {isTrialModalOpen && trialUserTarget && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card" style={{ maxWidth: '600px' }}>
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title" style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#065f46' }}>
                  <span>🎁</span> Grant 100% Fee-Waiver Promotional Access
                </h3>
                <p className="gf-modal-subtitle">
                  Member: {trialUserTarget.displayName} · {trialUserTarget.company} ({trialUserTarget.email})
                </p>
              </div>
              <button onClick={() => setIsTrialModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await grantFreeTrial(trialUserTarget.uid, trialDuration, trialReason);
                setIsTrialModalOpen(false);
              }}
              className="gf-modal-body"
              style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div style={{ padding: '10px 12px', borderRadius: '6px', background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#065f46', fontSize: '12px', lineHeight: '1.5' }}>
                <strong style={{ display: 'block', fontWeight: 800, marginBottom: '2px', color: '#064e3b' }}>
                  Internal Sovereign Exemption & Privilege Details:
                </strong>
                Authorizing this promotional grant immediately unlocks <strong>Premium Enterprise Privileges</strong> with <strong>₹0 Platform & Auction Bidding Fees</strong> for the selected promotional duration. Grants the <strong>Gold Verification Tick</strong> and logs an immutable audit event in the cryptographic ledger.
                <div style={{ marginTop: '4px', fontSize: '11px', color: '#047857', fontWeight: 700 }}>
                  ℹ️ Note: The user-facing app displays this as an active Premium Enterprise Plan (no &ldquo;free&rdquo; label is exposed to the public user).
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="gf-form-group">
                  <label className="gf-form-label" style={{ fontWeight: 800 }}>Promotional Duration</label>
                  <select
                    value={trialDuration}
                    onChange={(e) => setTrialDuration(Number(e.target.value))}
                    className="gf-select"
                    style={{ fontWeight: 700 }}
                  >
                    <option value={30}>30 Days (1 Full Month - Standard)</option>
                    <option value={60}>60 Days (2 Months - Extended)</option>
                    <option value={90}>90 Days (Quarterly Waiver)</option>
                    <option value={180}>180 Days (Semi-Annual Access)</option>
                    <option value={365}>365 Days (1-Year Strategic Onboarding)</option>
                    <option value={9999}>Unlimited / Lifetime Strategic Waiver</option>
                  </select>
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label" style={{ fontWeight: 800 }}>Provisioned Plan Tier</label>
                  <input
                    type="text"
                    disabled
                    value="Premium Gold Enterprise"
                    className="gf-input"
                    style={{ fontWeight: 800, background: '#f1f5f9', color: '#334155' }}
                  />
                </div>
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label" style={{ fontWeight: 800 }}>Godfather Approval Rationale (Immutable Audit Log)</label>
                <textarea
                  required
                  rows={2}
                  value={trialReason}
                  onChange={(e) => setTrialReason(e.target.value)}
                  className="gf-textarea"
                />
              </div>

              <div className="gf-modal-footer" style={{ padding: '12px 0 0', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setIsTrialModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-success" style={{ fontWeight: 800 }}>
                  Authorize & Apply Promotional Waiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standard Action Confirmation Modal */}
      {modalConfig && (
        <ActionConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          actionType={modalConfig.actionType}
          targetLabel={modalConfig.targetLabel}
          targetId={modalConfig.targetId}
          beforeSnapshot={modalConfig.beforeSnapshot}
          afterSnapshot={modalConfig.afterSnapshot}
          isDestructive={modalConfig.isDestructive}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
