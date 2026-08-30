'use client';

import React, { useState } from 'react';
import {
  FileText,
  Search,
  ShieldCheck,
  Clock,
  User,
  ArrowRight,
  Filter,
  Eye,
  Hash,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { AdminAction } from '@/lib/godfather/types';
import { JSONDiffViewer } from '@/components/godfather/JSONDiffViewer';

export default function AuditLogsPage() {
  const { auditLogs } = useGodfatherData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(auditLogs[0] || null);

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.actionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.correlationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.targetLabel && log.targetLabel.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">PLATFORM</span>
            <span className="gf-badge gf-badge-green text-[11px]">Append-Only Immutable Ledger</span>
          </div>
          <h1 className="gf-page-title">Immutable Platform Audit Records & Correlation Ledger</h1>
          <p className="gf-page-subtitle">
            Cryptographic ledger tracking all operator state mutations, step-up verifications, correlation IDs, and JSON state diffs
          </p>
        </div>
      </div>

      {/* Split View: Audit Logs List (5 cols) & Diff Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Logs List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="gf-card p-3 space-y-2">
            <div className="gf-search-input-wrap w-full">
              <Search className="lucide w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail by correlation ID, actor, reason..."
                className="gf-search-input font-mono"
              />
            </div>
            <div className="text-[11px] text-mut">
              Tracking <strong className="text-slate-200">{filteredLogs.length}</strong> immutable events
            </div>
          </div>

          <div className="space-y-2">
            {filteredLogs.map((log) => {
              const isSelected = selectedAction?.actionId === log.actionId;
              return (
                <div
                  key={log.actionId}
                  onClick={() => setSelectedAction(log)}
                  className={`gf-card p-3.5 cursor-pointer transition-all ${
                    isSelected ? 'border-sky-500 bg-slate-850 shadow-md' : 'hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="font-mono text-[10px] text-sky-400 font-bold bg-sky-950 px-1 py-0.5 rounded border border-sky-900">
                          {log.actionType}
                        </span>
                        {log.stepUpVerified && (
                          <span className="gf-badge gf-badge-green text-[9px] font-mono">
                            MFA ELEVATED
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-100 text-xs truncate max-w-[240px]">
                        {log.targetLabel || log.targetId}
                      </div>
                      <p className="text-[11px] text-mut truncate mt-0.5">{log.reason}</p>
                    </div>

                    <span className="text-[10px] text-faint font-mono text-right">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="mt-2 text-[10px] flex items-center justify-between text-slate-400 border-t border-slate-800 pt-2 font-mono">
                    <span>Actor: {log.actorName.split(' ')[0]} ({log.actorRole.replace('godfather_', '')})</span>
                    <span className="text-sky-400">{log.correlationId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Audit Record & JSON Diff Inspector */}
        <div className="lg:col-span-7">
          {selectedAction ? (
            <div className="gf-card divide-y divide-slate-800">
              {/* Header */}
              <div className="p-4 bg-slate-900 flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100 font-mono">{selectedAction.actionType}</h2>
                    <span className="gf-badge gf-badge-blue text-[10px] font-mono font-bold">
                      {selectedAction.correlationId}
                    </span>
                  </div>
                  <p className="text-xs text-mut mt-0.5">
                    Target: <strong className="text-slate-200">{selectedAction.targetLabel || selectedAction.targetId}</strong> ({selectedAction.targetType})
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[10px] text-faint block font-mono">
                    {new Date(selectedAction.createdAt).toUTCString()}
                  </span>
                  <span className="text-emerald-400 font-mono font-bold text-[11px]">
                    STATUS: COMMITTED
                  </span>
                </div>
              </div>

              {/* Actor & Security Metadata */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 text-xs">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">Operator Actor</span>
                  <span className="font-semibold text-slate-200 truncate block">{selectedAction.actorName}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">Assigned Role</span>
                  <span className="font-mono text-sky-400 font-bold">{selectedAction.actorRole}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">Step-Up Verified</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {selectedAction.stepUpVerified ? 'YES (TOTP-2FA)' : 'STANDARD'}
                  </span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">Operator Node</span>
                  <span className="font-mono text-slate-400 text-[10px] truncate block">{selectedAction.ipHash}</span>
                </div>
              </div>

              {/* Rationale Box */}
              <div className="p-4 space-y-1.5">
                <span className="text-xs font-bold text-slate-300 block">Mandatory Operational Rationale</span>
                <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans">
                  &ldquo;{selectedAction.reason}&rdquo;
                </div>
              </div>

              {/* JSON Diff Viewer */}
              <div className="p-4 space-y-2">
                <span className="text-xs font-bold text-slate-300 block">State Snapshot Diff (Before vs After)</span>
                <JSONDiffViewer before={selectedAction.beforeSnapshot} after={selectedAction.afterSnapshot} />
              </div>
            </div>
          ) : (
            <div className="gf-card p-12 text-center text-xs text-mut">
              Select an immutable record from the left to inspect state diffs and operator attribution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
