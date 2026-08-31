'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Search,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Lock,
  Unlock,
  AlertOctagon,
  FileText,
  UserX,
  Building,
  Eye,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { BlacklistCase } from '@/lib/types';
import { BlockAction } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function BlacklistManagementPage() {
  const { blocks, blacklist, unblockUser, publishBlacklistEntry, revokeBlacklistEntry } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [activeTab, setActiveTab] = useState<'blacklist' | 'blocks'>('blacklist');
  const [searchQuery, setSearchQuery] = useState('');

  // Confirmation modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    isDestructive?: boolean;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const handlePublishBlacklist = async (item: BlacklistCase) => {
    const verified = await requestStepUpVerification(`Publish Public Blacklist record for ${item.companyName}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Publish Company to Official Public Blacklist Registry',
      actionType: 'BLACKLIST_ENTRY_PUBLICLY_PUBLISHED',
      targetLabel: item.companyName,
      targetId: item.id,
      isDestructive: true,
      onConfirm: async (reason) => {
        await publishBlacklistEntry(item.id, reason);
        setModalConfig(null);
      },
    });
  };

  const handleRevokeBlacklist = async (item: BlacklistCase) => {
    const verified = await requestStepUpVerification(`Revoke Blacklist record for ${item.companyName}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Revoke Blacklist & Restore Entity Standing',
      actionType: 'BLACKLIST_ENTRY_REVOKED',
      targetLabel: item.companyName,
      targetId: item.id,
      onConfirm: async (reason) => {
        await revokeBlacklistEntry(item.id, reason);
        setModalConfig(null);
      },
    });
  };

  const handleLiftBlock = async (block: BlockAction) => {
    setModalConfig({
      isOpen: true,
      title: 'Lift Member Scoped Feature Block',
      actionType: 'MEMBER_BLOCK_LIFTED',
      targetLabel: block.subjectName,
      targetId: block.blockId,
      onConfirm: async (reason) => {
        await unblockUser(block.blockId, reason);
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
            <span className="gf-badge gf-badge-red text-[11px] font-bold">TRUST & SAFETY</span>
            <span className="gf-badge gf-badge-amber text-[11px]">
              {blacklist.length} Blacklist Cases · {blocks.filter((b) => b.status === 'active').length} Active Member Blocks
            </span>
          </div>
          <h1 className="gf-page-title">Blacklist & Member Block Enforcement</h1>
          <p className="gf-page-subtitle">
            Govern public blacklists, commercial fraud claims, dispute appeals, and granular feature restriction scopes
          </p>
        </div>

        {/* Tab Toggle */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('blacklist')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'blacklist' ? 'bg-white text-sky-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Company Blacklist Registry ({blacklist.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('blocks')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'blocks' ? 'bg-white text-sky-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Scoped Member Blocks ({blocks.length})
          </button>
        </div>
      </div>

      {activeTab === 'blacklist' ? (
        /* Company Blacklist Registry */
        <div className="space-y-4">
          {blacklist.map((item) => (
            <div key={item.id} className="gf-card p-4 space-y-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Building className="lucide w-4 h-4 text-rose-600" />
                    <h3 className="font-bold text-slate-900 text-sm">{item.companyName}</h3>
                    <span className="gf-badge gf-badge-red text-[10px] uppercase font-bold font-mono">
                      {item.id}
                    </span>
                    <span className="gf-badge gf-badge-red text-[10px] uppercase font-bold">
                      SEVERITY: {item.severity}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1">
                    Location: <strong className="text-slate-800">{item.location}</strong> · Reported by: {item.reporter} ({item.reportedDate})
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRevokeBlacklist(item)}
                    className="gf-btn gf-btn-secondary text-xs"
                  >
                    Revoke / Resolve
                  </button>
                  <button
                    type="button"
                    onClick={() => handlePublishBlacklist(item)}
                    className="gf-btn gf-btn-danger text-xs font-bold flex items-center gap-1"
                  >
                    <ShieldAlert className="lucide w-3.5 h-3.5" />
                    Publish to Public Blacklist
                  </button>
                </div>
              </div>

              {/* Case Findings Box */}
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 leading-relaxed">
                <span className="font-bold text-rose-950 block mb-1">Commercial Violation Claim:</span>
                {item.reason} — {item.description}
              </div>

              {/* Evidence and Dispute Status */}
              <div className="flex items-center justify-between text-xs text-slate-500 border-t border-slate-100 pt-2 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-slate-700 font-semibold flex items-center gap-1">
                    <FileText className="lucide w-3.5 h-3.5 text-sky-600" />
                    Evidence: {item.evidenceRef}
                  </span>
                  <span>{item.agreedCount || 0} Operators Corroborated</span>
                </div>
                <span className="gf-badge gf-badge-gray text-[10px] font-bold">
                  Status: {item.status.toUpperCase()}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Member Scoped Blocks View */
        <div className="gf-card">
          <div className="overflow-x-auto">
            <table className="gf-table text-xs">
              <thead>
                <tr>
                  <th>Block ID</th>
                  <th>Restricted Member</th>
                  <th>Applied Scopes</th>
                  <th>Reason Code & Notes</th>
                  <th>Created By & Time</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {blocks.map((b) => (
                  <tr key={b.blockId}>
                    <td className="font-mono font-bold text-sky-700">{b.blockId}</td>
                    <td>
                      <div className="font-bold text-slate-900">{b.subjectName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">{b.subjectEmail}</div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {b.scopes.map((s) => (
                          <span key={s} className="gf-badge gf-badge-red text-[9px] font-mono">
                            {s}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span className="font-semibold text-rose-800 block">[{b.reasonCode}]</span>
                      <span className="text-[11px] text-slate-700">{b.reasonText}</span>
                    </td>
                    <td>
                      <div className="text-slate-800 font-semibold">{b.createdByName}</div>
                      <div className="text-[10px] text-slate-500">{new Date(b.createdAt).toLocaleDateString()}</div>
                    </td>
                    <td>
                      <span className={`gf-badge gf-badge-${b.status === 'active' ? 'red' : 'green'} text-[10px] uppercase font-bold`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="text-right">
                      {b.status === 'active' ? (
                        <button
                          type="button"
                          onClick={() => handleLiftBlock(b)}
                          className="gf-btn gf-btn-success text-[11px] py-1 px-2.5 flex items-center gap-1 font-bold"
                        >
                          <Unlock className="lucide w-3 h-3" />
                          Lift Block
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs italic">Lifted</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
          isDestructive={modalConfig.isDestructive}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
