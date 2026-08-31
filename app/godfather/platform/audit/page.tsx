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
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">PLATFORM AUDIT</span>
            <span className="gf-badge gf-badge-green text-[11px] font-mono">APPEND-ONLY IMMUTABLE LEDGER</span>
          </div>
          <h1 className="gf-page-title">Platform Audit Records & Correlation Ledger</h1>
          <p className="gf-page-subtitle">
            Cryptographic ledger tracking all operator state mutations, step-up verifications, correlation IDs, and JSON state diffs
          </p>
        </div>
      </div>

      {/* Split View: Audit Logs List (5 cols) & Diff Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Logs List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="gf-card p-3 space-y-2 bg-slate-50 border-slate-200">
            <div className="gf-search-input-wrap w-full bg-white border-slate-300">
              <Search className="lucide w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail by correlation ID, actor, reason..."
                className="gf-search-input font-mono"
              />
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              Tracking <strong className="text-slate-900">{filteredLogs.length}</strong> immutable events
            </div>
          </div>

          <div className="space-y-2">
            {filteredLogs.map((log) => {
              const isSelected = selectedAction?.actionId === log.actionId;
              return (
                <div
                  key={log.actionId}
                  onClick={() => setSelectedAction(log)}
                  className={`gf-card p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-sky-400 bg-sky-50/70 shadow-sm ring-1 ring-sky-300' : 'hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="font-mono text-[10px] text-sky-800 font-bold bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200">
                          {log.actionType}
                        </span>
                        {log.stepUpVerified && (
                          <span className="gf-badge gf-badge-green text-[9px] font-mono font-bold">
                            MFA ELEVATED
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-xs truncate max-w-[240px]">
                        {log.targetLabel || log.targetId}
                      </div>
                      <p className="text-[11px] text-slate-600 truncate mt-0.5">{log.reason}</p>
                    </div>

                    <span className="text-[10px] text-slate-500 font-mono text-right flex-shrink-0">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </span>
                  </div>

                  <div className="mt-2.5 text-[10px] flex items-center justify-between text-slate-500 border-t border-slate-100 pt-2 font-mono">
                    <span className="font-medium text-slate-700">Actor: {log.actorName.split(' ')[0]} ({log.actorRole.replace('godfather_', '')})</span>
                    <span className="text-sky-700 font-bold">{log.correlationId}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Deep Audit Record & JSON Diff Inspector */}
        <div className="lg:col-span-7">
          {selectedAction ? (
            <div className="gf-card divide-y divide-slate-100">
              {/* Header */}
              <div className="p-4 bg-slate-50 flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-900 font-mono">{selectedAction.actionType}</h2>
                    <span className="gf-badge gf-badge-blue text-[10px] font-mono font-bold">
                      {selectedAction.correlationId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Target: <strong className="text-slate-900">{selectedAction.targetLabel || selectedAction.targetId}</strong> ({selectedAction.targetType})
                  </p>
                </div>

                <div className="text-right text-xs">
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {new Date(selectedAction.createdAt).toUTCString()}
                  </span>
                  <span className="text-emerald-700 font-mono font-bold text-[11px]">
                    STATUS: COMMITTED
                  </span>
                </div>
              </div>

              {/* Actor & Security Metadata */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Operator Actor</span>
                  <span className="font-bold text-slate-900 truncate block mt-0.5">{selectedAction.actorName}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned Role</span>
                  <span className="font-mono text-sky-700 font-bold block mt-0.5">{selectedAction.actorRole}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Step-Up Verified</span>
                  <span className="font-mono text-emerald-700 font-bold block mt-0.5">
                    {selectedAction.stepUpVerified ? 'YES (TOTP-2FA)' : 'STANDARD'}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Operator Node</span>
                  <span className="font-mono text-slate-600 text-[10px] truncate block mt-0.5">{selectedAction.ipHash}</span>
                </div>
              </div>

              {/* Rationale Box */}
              <div className="p-4 space-y-1.5">
                <span className="text-xs font-bold text-slate-800 block">Mandatory Operational Rationale</span>
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans font-medium">
                  &ldquo;{selectedAction.reason}&rdquo;
                </div>
              </div>

              {/* JSON Diff Viewer */}
              <div className="p-4 space-y-2">
                <span className="text-xs font-bold text-slate-800 block">State Snapshot Diff (Before vs After)</span>
                <JSONDiffViewer before={selectedAction.beforeSnapshot} after={selectedAction.afterSnapshot} />
              </div>
            </div>
          ) : (
            <div className="gf-card p-12 text-center text-xs text-slate-500">
              Select an immutable record from the left to inspect state diffs and operator attribution.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

