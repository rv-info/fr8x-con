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
  } = useGodfatherData();
  const { requestStepUpVerification, checkPermission } = useGodfatherAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

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
        <div className="gf-filter-bar">
          <div className="gf-search-input-wrap">
            <Search className="lucide w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter users by name, email, company, or GSTN..."
              className="gf-search-input"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-mut">
            <span>Showing <strong className="text-slate-200">{filteredUsers.length}</strong> operators</span>
          </div>
        </div>

        {/* Users Dense Table */}
        <div className="overflow-x-auto">
          <table className="gf-table">
            <thead>
              <tr>
                <th>Operator & Identity</th>
                <th>Company & Tax IDs</th>
                <th>Location & Timezone</th>
                <th>Plan & Verification</th>
                <th>Privileges</th>
                <th className="text-right">Governance Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                return (
                  <tr key={u.uid}>
                    {/* Identity */}
                    <td>
                      <div className="font-bold text-slate-100 flex items-center gap-1.5">
                        {u.displayName}
                        {u.hasGoldenTick && (
                          <span className="text-amber-400" title="Premium Gold Tick Verified">
                            ★
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-mut font-mono">{u.email}</div>
                      <div className="text-[10px] text-faint">{u.designation}</div>
                    </td>

                    {/* Company */}
                    <td>
                      <div className="font-semibold text-slate-200">{u.company}</div>
                      <div className="text-[11px] text-mut font-mono">
                        GST: {u.gstn ? <span className="text-sky-400 font-bold">{u.gstn}</span> : 'Not Provided'}
                      </div>
                      {u.pan && <div className="text-[10px] text-faint font-mono">PAN: {u.pan}</div>}
                    </td>

                    {/* Location & Timezone Clock */}
                    <td>
                      <div className="flex items-center gap-1 text-slate-300">
                        <MapPin className="lucide w-3 h-3 text-slate-500" />
                        <span>{u.city}, {u.country}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-mut mt-0.5">
                        <Clock className="lucide w-3 h-3 text-slate-500" />
                        <span className="font-mono text-slate-300 px-1 py-0.2 rounded border border-red-700/60 bg-red-950/40 text-red-300 text-[10px]">
                          {u.timezone}
                        </span>
                      </div>
                    </td>

                    {/* Plan & Verification */}
                    <td>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`gf-badge ${u.plan === 'premium' ? 'gf-badge-gold' : u.plan === 'professional' ? 'gf-badge-blue' : 'gf-badge-gray'} text-[10px] uppercase font-bold`}>
                          {u.plan}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
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
                    <td>
                      <span className="text-[11px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                        {u.role}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Profile */}
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          className="gf-btn gf-btn-secondary text-[11px] py-1 px-2"
                          title="Correct Profile Data"
                        >
                          <Edit className="lucide w-3 h-3" />
                        </button>

                        {/* Toggle Verification */}
                        <button
                          type="button"
                          onClick={() => handleToggleVerification(u)}
                          className={`gf-btn text-[11px] py-1 px-2 ${u.isVerified ? 'gf-btn-secondary' : 'gf-btn-success'}`}
                          title={u.isVerified ? 'Revoke Verification' : 'Verify Member'}
                        >
                          {u.isVerified ? 'Unverify' : 'Verify'}
                        </button>

                        {/* Toggle Gold Tick */}
                        <button
                          type="button"
                          onClick={() => handleToggleGoldTick(u)}
                          className={`gf-btn text-[11px] py-1 px-2 ${u.hasGoldenTick ? 'gf-btn-secondary' : 'gf-btn-warning'}`}
                          title="Toggle Premium Gold Tick"
                        >
                          ★ Gold
                        </button>

                        {/* Block Scopes */}
                        <button
                          type="button"
                          onClick={() => handleOpenBlockModal(u)}
                          className="gf-btn gf-btn-danger text-[11px] py-1 px-2"
                          title="Apply Feature / Login Block"
                        >
                          <Lock className="lucide w-3 h-3" />
                        </button>

                        {/* Force Logout */}
                        <button
                          type="button"
                          onClick={() => handleForceLogout(u)}
                          className="gf-btn gf-btn-secondary text-[11px] py-1 px-2 text-slate-400 hover:text-red-400"
                          title="Force Session Revocation"
                        >
                          <LogOut className="lucide w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
