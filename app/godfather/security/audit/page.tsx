'use client';

import React, { useState } from 'react';
import {
  History,
  Search,
  ShieldCheck,
  Clock,
  User,
  ArrowRight,
  Filter,
  Eye,
  Hash,
  CheckCircle2,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { AdminAction } from '@/lib/godfather/types';
import { JSONDiffViewer } from '@/components/godfather/JSONDiffViewer';

export default function SecurityAuditPage() {
  const { auditLogs } = useGodfatherData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(auditLogs[0] || null);
  const [selectedModule, setSelectedModule] = useState('ALL');

  const filteredLogs = auditLogs.filter((log) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      log.actionId.toLowerCase().includes(q) ||
      log.correlationId.toLowerCase().includes(q) ||
      log.actionType.toLowerCase().includes(q) ||
      log.actorEmail.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q) ||
      (log.targetLabel && log.targetLabel.toLowerCase().includes(q));

    const matchesModule = selectedModule === 'ALL' || log.targetType === selectedModule.toLowerCase();
    return matchesSearch && matchesModule;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue font-bold">SECURITY & PLATFORM AUDIT</span>
            <span className="gf-badge gf-badge-green font-mono">IMMUTABLE APPEND-ONLY</span>
          </div>
          <h1 className="gf-page-title flex items-center gap-2">
            <History className="lucide w-4 h-4 text-sky-600" />
            <span>Immutable Platform Audit Trail & Cryptographic Ledger</span>
          </h1>
          <p className="gf-page-subtitle">
            Cryptographic ledger tracking all operator mutations, account unblocks, KYC decisions, step-up verifications, and before/after state diffs.
          </p>
        </div>
      </div>

      {/* Split View: Audit Logs List (5 cols) & Diff Inspector (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Logs List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="gf-card p-2.5 space-y-2 bg-slate-50 border-slate-200">
            <div className="gf-search-input-wrap w-full bg-white border-slate-300">
              <Search className="lucide w-3 h-3 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search audit trail by actor, reason, correlation ID..."
                className="gf-search-input font-mono"
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-medium">
              <span>
                Total Events: <strong className="text-slate-900 font-mono">{filteredLogs.length}</strong>
              </span>
              <div className="flex items-center gap-1">
                {['ALL', 'USER', 'COMPANY', 'POST', 'PLAN'].map((mod) => (
                  <button
                    key={mod}
                    type="button"
                    onClick={() => setSelectedModule(mod)}
                    className={`gf-badge cursor-pointer ${
                      selectedModule === mod ? 'gf-badge-blue' : 'gf-badge-gray'
                    }`}
                  >
                    {mod}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-1.5 max-h-[580px] overflow-y-auto pr-1">
            {filteredLogs.length === 0 ? (
              <div className="gf-card p-8 text-center text-slate-400">
                <CheckCircle2 className="lucide w-6 h-6 mx-auto mb-1 text-slate-300" />
                <div className="font-bold text-slate-600">No Audit Events</div>
                <div className="text-[9px]">Zero records matching current query.</div>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const isSelected = selectedAction?.actionId === log.actionId;
                return (
                  <div
                    key={log.actionId}
                    onClick={() => setSelectedAction(log)}
                    className={`gf-card p-2.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-sky-400 bg-sky-50/70 ring-1 ring-sky-300'
                        : 'hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1 mb-0.5 flex-wrap">
                          <span className="font-mono text-[9px] text-sky-800 font-bold bg-sky-100 px-1 py-0.5 rounded border border-sky-200">
                            {log.actionType}
                          </span>
                          {log.stepUpVerified && (
                            <span className="gf-badge gf-badge-green text-[8px] font-mono font-bold">
                              MFA ELEVATED
                            </span>
                          )}
                        </div>
                        <div className="font-bold text-slate-900 text-[10px] truncate">
                          {log.targetLabel || log.targetId}
                        </div>
                        <p className="text-[9.5px] text-slate-600 truncate">{log.reason}</p>
                      </div>

                      <span className="text-[9px] text-slate-500 font-mono text-right flex-shrink-0">
                        {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-slate-200/60 text-[9px] text-slate-500 font-mono">
                      <span>{log.actorEmail}</span>
                      <span>{log.correlationId}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Diff Inspector */}
        <div className="lg:col-span-7">
          {selectedAction ? (
            <div className="gf-card space-y-4 p-4">
              <div className="flex items-start justify-between pb-3 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="gf-badge gf-badge-gold font-mono">{selectedAction.correlationId}</span>
                    <span className="font-mono text-slate-400 text-[9px]">ID: {selectedAction.actionId}</span>
                  </div>
                  <h2 className="text-xs font-bold text-slate-900">{selectedAction.actionType}</h2>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    Target: <strong className="text-slate-800 font-mono">{selectedAction.targetId}</strong> (
                    {selectedAction.targetType})
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-[10px] font-mono text-slate-500">
                    {new Date(selectedAction.createdAt).toLocaleString()}
                  </div>
                  <span className="gf-badge gf-badge-green font-mono mt-1">CRYPTOGRAPHICALLY COMMITTED</span>
                </div>
              </div>

              {/* Actor & Authorization Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200 text-[9.5px]">
                <div>
                  <div className="text-slate-400 uppercase font-bold text-[8.5px]">OPERATOR</div>
                  <div className="font-bold text-slate-900 truncate">{selectedAction.actorName}</div>
                  <div className="font-mono text-slate-500 text-[8.5px] truncate">{selectedAction.actorEmail}</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-bold text-[8.5px]">ROLE ASSIGNED</div>
                  <div className="font-mono font-semibold text-slate-800">{selectedAction.actorRole}</div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-bold text-[8.5px]">AUTHENTICATION</div>
                  <div className="font-bold text-emerald-700">
                    {selectedAction.stepUpVerified ? 'Step-Up MFA (2FA)' : 'Standard Operator'}
                  </div>
                </div>
                <div>
                  <div className="text-slate-400 uppercase font-bold text-[8.5px]">OPERATOR CLIENT IP</div>
                  <div className="font-mono text-slate-600 text-[8.5px] truncate">{selectedAction.ipHash}</div>
                </div>
              </div>

              {/* Reason / Compliance Note */}
              <div className="space-y-1">
                <div className="text-[9.5px] font-bold text-slate-700 uppercase tracking-wide">
                  Mandatory Operational Justification
                </div>
                <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-md text-[10px] text-slate-800 leading-relaxed font-medium">
                  {selectedAction.reason}
                </div>
              </div>

              {/* JSON State Diff Viewer */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="font-bold text-slate-800 uppercase tracking-wide">
                    State Mutation Delta (JSON Snapshot)
                  </span>
                  <span className="font-mono text-slate-400 text-[9px]">PRE-MUTATION → POST-MUTATION</span>
                </div>
                <JSONDiffViewer
                  before={selectedAction.beforeSnapshot}
                  after={selectedAction.afterSnapshot}
                />
              </div>
            </div>
          ) : (
            <div className="gf-card p-12 text-center text-slate-400 text-xs">
              <History className="lucide w-8 h-8 mx-auto mb-2 text-slate-300" />
              <div>Select an audit record on the left to inspect its cryptographic delta.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
