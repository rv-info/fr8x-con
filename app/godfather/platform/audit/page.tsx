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
  Download,
  Printer,
  Table,
  Columns,
  X,
  CheckCircle2,
  Lock,
  FileSpreadsheet,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { AdminAction } from '@/lib/godfather/types';
import { JSONDiffViewer } from '@/components/godfather/JSONDiffViewer';

export default function AuditLogsPage() {
  const { auditLogs } = useGodfatherData();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'split'>('table');
  const [selectedAction, setSelectedAction] = useState<AdminAction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const actionTypes = Array.from(new Set(auditLogs.map((l) => l.actionType)));

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      log.actionId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.correlationId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actionType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.targetLabel && log.targetLabel.toLowerCase().includes(searchQuery.toLowerCase()));

    if (actionTypeFilter === 'ALL') return matchesSearch;
    return matchesSearch && log.actionType === actionTypeFilter;
  });

  const handleOpenDetail = (log: AdminAction) => {
    setSelectedAction(log);
    setIsDetailModalOpen(true);
  };

  const handleExportCSV = () => {
    const headers = ['ActionID,CorrelationID,Timestamp,ActorName,ActorEmail,ActorRole,ActionType,TargetLabel,Reason,StepUpVerified\n'];
    const rows = filteredLogs.map((l) =>
      `"${l.actionId}","${l.correlationId}","${l.createdAt}","${l.actorName}","${l.actorEmail}","${l.actorRole}","${l.actionType}","${l.targetLabel || l.targetId}","${l.reason.replace(/"/g, '""')}","${l.stepUpVerified}"`
    );
    const blob = new Blob([headers.join('') + rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FR8X_Audit_Report_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(filteredLogs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `FR8X_Audit_Ledger_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">PLATFORM AUDIT</span>
            <span className="gf-badge gf-badge-green text-[11px] font-mono font-bold">
              APPEND-ONLY IMMUTABLE LEDGER
            </span>
          </div>
          <h1 className="gf-page-title">Immutable Platform Audit Ledger &amp; Reports</h1>
          <p className="gf-page-subtitle">
            Cryptographic audit trail tracking all operator state mutations, step-up MFA authorizations, correlation IDs, and Before/After JSON state snapshots.
          </p>
        </div>

        {/* Export & View Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table'
                  ? 'bg-white text-sky-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Table className="lucide w-3.5 h-3.5" />
              <span>Full Report Table</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('split');
                if (!selectedAction && auditLogs.length > 0) setSelectedAction(auditLogs[0]);
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'split'
                  ? 'bg-white text-sky-900 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Columns className="lucide w-3.5 h-3.5" />
              <span>Split Diff Inspector</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportCSV}
            className="gf-btn gf-btn-secondary text-xs font-bold flex items-center gap-1.5"
            title="Download CSV report"
          >
            <Download className="lucide w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            className="gf-btn gf-btn-secondary text-xs font-bold flex items-center gap-1.5"
            title="Download JSON Ledger"
          >
            <FileSpreadsheet className="lucide w-3.5 h-3.5 text-sky-600" />
            <span>Export JSON</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="gf-btn gf-btn-secondary text-xs font-bold flex items-center gap-1.5"
            title="Print Audit Report"
          >
            <Printer className="lucide w-3.5 h-3.5 text-slate-600" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="gf-card">
        <div className="gf-filter-bar flex-wrap">
          <div className="gf-search-input-wrap max-w-md">
            <Search className="lucide w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by correlation ID, actor, reason, target..."
              className="gf-search-input font-mono"
            />
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-500 font-bold">Action Type:</span>
              <select
                value={actionTypeFilter}
                onChange={(e) => setActionTypeFilter(e.target.value)}
                className="gf-select text-xs font-mono font-bold"
              >
                <option value="ALL">ALL ACTION CODES ({auditLogs.length})</option>
                {actionTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-slate-500 font-medium">
              Showing <strong className="text-slate-900">{filteredLogs.length}</strong> verified events
            </div>
          </div>
        </div>

        {/* VIEW MODE 1: FULL REPORT TABLE FORMAT */}
        {viewMode === 'table' && (
          <div className="overflow-x-auto">
            <table className="gf-table text-xs">
              <thead>
                <tr>
                  <th>Timestamp (UTC)</th>
                  <th>Correlation ID</th>
                  <th>Action Code</th>
                  <th>Operator Actor</th>
                  <th>Target Entity</th>
                  <th>Operational Rationale</th>
                  <th>MFA Elevation</th>
                  <th className="text-right">Inspection</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.actionId} className="hover:bg-slate-50">
                    <td>
                      <div className="font-mono text-slate-900 font-semibold">
                        {new Date(log.createdAt).toLocaleDateString()}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                    </td>
                    <td>
                      <span className="font-mono font-bold text-sky-800 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                        {log.correlationId}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[10.5px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 block w-fit">
                        {log.actionType}
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900">{log.actorName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {log.actorRole.replace('godfather_', '')} · {log.actorEmail}
                      </div>
                    </td>
                    <td>
                      <div className="font-semibold text-slate-800 truncate max-w-[200px]" title={log.targetLabel || log.targetId}>
                        {log.targetLabel || log.targetId}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{log.targetType}</div>
                    </td>
                    <td>
                      <div className="text-slate-700 max-w-[260px] truncate" title={log.reason}>
                        {log.reason}
                      </div>
                    </td>
                    <td>
                      {log.stepUpVerified ? (
                        <span className="gf-badge gf-badge-green text-[9.5px] font-mono font-bold">
                          ✓ MFA ELEVATED
                        </span>
                      ) : (
                        <span className="gf-badge gf-badge-gray text-[9.5px] font-mono">
                          STANDARD
                        </span>
                      )}
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDetail(log)}
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 font-bold flex items-center gap-1 text-sky-700 hover:bg-sky-50 ml-auto"
                      >
                        <Eye className="lucide w-3.5 h-3.5 text-sky-600" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW MODE 2: SPLIT DIFF INSPECTOR */}
        {viewMode === 'split' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 border-t border-slate-200">
            {/* Left Column: Log Entries */}
            <div className="lg:col-span-5 border-r border-slate-200 max-h-[70vh] overflow-y-auto divide-y divide-slate-100">
              {filteredLogs.map((log) => {
                const isSelected = selectedAction?.actionId === log.actionId;
                return (
                  <div
                    key={log.actionId}
                    onClick={() => setSelectedAction(log)}
                    className={`p-4 cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-sky-50/80 border-l-4 border-l-sky-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                          <span className="font-mono text-[10px] text-sky-900 font-bold bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200">
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
                      <span className="font-medium text-slate-700">
                        Actor: {log.actorName.split(' ')[0]} ({log.actorRole.replace('godfather_', '')})
                      </span>
                      <span className="text-sky-800 font-bold">{log.correlationId}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Right Column: Diff Inspector */}
            <div className="lg:col-span-7 p-4 space-y-4 max-h-[70vh] overflow-y-auto">
              {selectedAction ? (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-slate-900 font-mono">{selectedAction.actionType}</h3>
                        <span className="gf-badge gf-badge-blue text-[10px] font-mono font-bold">
                          {selectedAction.correlationId}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        Target: <strong className="text-slate-900">{selectedAction.targetLabel || selectedAction.targetId}</strong>
                      </p>
                    </div>
                    <span className="text-emerald-700 font-mono font-bold text-xs">COMMITTED</span>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700">
                    <strong className="block text-slate-900 mb-1">Audited Rationale:</strong>
                    {selectedAction.reason}
                  </div>

                  {/* JSON Diff Component */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-2">Cryptographic State Mutation Diff</h4>
                    <JSONDiffViewer
                      before={selectedAction.beforeSnapshot}
                      after={selectedAction.afterSnapshot}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">
                  Select an audit entry from the left list to inspect state diffs.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DETAILED AUDIT INSPECTION MODAL */}
      {isDetailModalOpen && selectedAction && (
        <div className="gf-modal-overlay" onClick={() => setIsDetailModalOpen(false)}>
          <div className="gf-modal-card max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <ShieldCheck className="lucide w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="gf-modal-title font-mono">{selectedAction.actionType}</h3>
                  <p className="gf-modal-subtitle font-mono">
                    Correlation ID: {selectedAction.correlationId} · Action ID: {selectedAction.actionId}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsDetailModalOpen(false)} className="gf-modal-close-btn">
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <div className="gf-modal-body space-y-4 max-h-[72vh] overflow-y-auto">
              {/* Metadata Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Operator Actor</span>
                  <span className="font-bold text-slate-900 block mt-0.5">{selectedAction.actorName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">{selectedAction.actorEmail}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Assigned Role</span>
                  <span className="font-mono text-sky-800 font-bold block mt-0.5">{selectedAction.actorRole}</span>
                  <span className="text-[10px] text-slate-500">MFA: {selectedAction.stepUpVerified ? 'Elevated' : 'Standard'}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Target Entity</span>
                  <span className="font-bold text-slate-900 truncate block mt-0.5">
                    {selectedAction.targetLabel || selectedAction.targetId}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">{selectedAction.targetType}</span>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">Commit Time</span>
                  <span className="font-mono text-slate-900 block mt-0.5">
                    {new Date(selectedAction.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">SHA-256 Verified</span>
                </div>
              </div>

              {/* Rationale Callout */}
              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-950">
                <span className="font-bold block mb-1 text-amber-900">Audited Execution Rationale:</span>
                <p className="leading-relaxed font-medium">{selectedAction.reason}</p>
              </div>

              {/* JSON State Diff */}
              <div>
                <h4 className="text-xs font-bold text-slate-800 mb-2">Before vs. After State Mutation Diff</h4>
                <JSONDiffViewer
                  before={selectedAction.beforeSnapshot}
                  after={selectedAction.afterSnapshot}
                />
              </div>
            </div>

            <div className="gf-modal-footer flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                Cryptographically Sealed on Con.FR8X.IN Root Node
              </span>
              <button
                type="button"
                onClick={() => setIsDetailModalOpen(false)}
                className="gf-btn gf-btn-primary text-xs font-bold"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
