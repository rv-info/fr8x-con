'use client';

import React, { useState } from 'react';
import {
  FileCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Clock,
  ExternalLink,
  Eye,
  X,
  MessageSquare,
  XCircle,
  HelpCircle,
  FileText,
  AlertOctagon,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

interface PlatformReport {
  id: string;
  type: string;
  reporterName: string;
  reporterEmail: string;
  targetType: string;
  targetId: string;
  targetCompany?: string;
  module: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'open' | 'under_review' | 'resolved' | 'closed';
  reason: string;
  description: string;
  evidenceRef?: string;
  createdAt: string;
  assignedAdmin?: string;
}

export default function ReportsAppealsPage() {
  const { auditLogs } = useGodfatherData();
  const { operator } = useGodfatherAuth();

  const [reports, setReports] = useState<PlatformReport[]>([
    {
      id: 'REP-2026-001',
      type: 'Commercial Dispute',
      reporterName: 'Arjun Rao',
      reporterEmail: 'arjun@atlaslogistics.com',
      targetType: 'Company',
      targetId: 'CMP-00103',
      targetCompany: 'Indo Ocean Lines',
      module: 'Auctions',
      severity: 'HIGH',
      status: 'open',
      reason: 'Demurrage free time deviation in spot quote confirmation',
      description: 'Liner billed additional $450 demurrage despite 14 combined free days agreement agreed in auction bid terms.',
      evidenceRef: 'BL-98127391-JEA',
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
    {
      id: 'REP-2026-002',
      type: 'Content Violation',
      reporterName: 'Sarah Lewis',
      reporterEmail: 'sarah.lewis@rotterdamfreight.nl',
      targetType: 'User Post',
      targetId: 'post-109',
      targetCompany: 'Unverified Entity',
      module: 'Feeds',
      severity: 'MEDIUM',
      status: 'under_review',
      reason: 'Off-platform payment solicitation',
      description: 'User repeatedly posted personal WhatsApp numbers requesting upfront crypto deposit.',
      evidenceRef: 'POST-088-SS.png',
      createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
      assignedAdmin: 'Vikramaditya Singhania',
    },
  ]);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [moduleFilter, setModuleFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReport, setSelectedReport] = useState<PlatformReport | null>(null);

  // Request info modal
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [infoRequestText, setInfoRequestText] = useState('');

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

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      r.id.toLowerCase().includes(q) ||
      r.reporterName.toLowerCase().includes(q) ||
      r.reporterEmail.toLowerCase().includes(q) ||
      r.targetId.toLowerCase().includes(q) ||
      (r.targetCompany && r.targetCompany.toLowerCase().includes(q)) ||
      r.module.toLowerCase().includes(q) ||
      r.reason.toLowerCase().includes(q);

    const matchesStatus =
      statusFilter === 'ALL' || r.status.toUpperCase() === statusFilter.replace(/\s+/g, '_');
    const matchesSeverity = severityFilter === 'ALL' || r.severity === severityFilter;
    const matchesModule = moduleFilter === 'ALL' || r.module.toUpperCase() === moduleFilter;

    return matchesSearch && matchesStatus && matchesSeverity && matchesModule;
  });

  const handleStartReview = (rep: PlatformReport) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === rep.id ? { ...r, status: 'under_review', assignedAdmin: operator.displayName } : r
      )
    );
    if (selectedReport?.id === rep.id) {
      setSelectedReport({ ...rep, status: 'under_review', assignedAdmin: operator.displayName });
    }
  };

  const handleResolve = (rep: PlatformReport) => {
    setModalConfig({
      isOpen: true,
      title: 'Resolve Report & Issue Remediation',
      actionType: 'REPORT_RESOLVED',
      targetLabel: `${rep.id} · ${rep.reason}`,
      targetId: rep.id,
      onConfirm: (reason) => {
        setReports((prev) =>
          prev.map((r) => (r.id === rep.id ? { ...r, status: 'resolved' } : r))
        );
        if (selectedReport?.id === rep.id) {
          setSelectedReport({ ...rep, status: 'resolved' });
        }
        setModalConfig(null);
      },
    });
  };

  const handleClose = (rep: PlatformReport) => {
    setModalConfig({
      isOpen: true,
      title: 'Close & Dismiss Report',
      actionType: 'REPORT_CLOSED',
      targetLabel: `${rep.id} · ${rep.reason}`,
      targetId: rep.id,
      isDestructive: true,
      onConfirm: (reason) => {
        setReports((prev) =>
          prev.map((r) => (r.id === rep.id ? { ...r, status: 'closed' } : r))
        );
        if (selectedReport?.id === rep.id) {
          setSelectedReport({ ...rep, status: 'closed' });
        }
        setModalConfig(null);
      },
    });
  };

  const handleRequestInfoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReport || !infoRequestText.trim()) return;
    setIsInfoModalOpen(false);
    setInfoRequestText('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-red font-bold">TRUST & SAFETY GOVERNANCE</span>
            <span className="gf-badge gf-badge-amber font-mono font-bold">
              {reports.filter((r) => r.status === 'open').length} OPEN REPORTS
            </span>
          </div>
          <h1 className="gf-page-title flex items-center gap-2">
            <FileCheck className="lucide w-4 h-4 text-rose-600" />
            <span>Platform Reports, Disputes & Appeals Queue</span>
          </h1>
          <p className="gf-page-subtitle">
            Formal grievance registry for commercial disputes, off-platform solicitations, KYC impersonations, and rating appeals.
          </p>
        </div>
      </div>

      {/* Top Status Summary Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All Reports', count: reports.length },
          { key: 'OPEN', label: 'Open', count: reports.filter((r) => r.status === 'open').length },
          { key: 'UNDER_REVIEW', label: 'Under Review', count: reports.filter((r) => r.status === 'under_review').length },
          { key: 'RESOLVED', label: 'Resolved', count: reports.filter((r) => r.status === 'resolved').length },
          { key: 'CLOSED', label: 'Closed', count: reports.filter((r) => r.status === 'closed').length },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded text-[10px] font-bold flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              statusFilter === tab.key
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full font-mono text-[9px] ${
                statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Filter Toolbar */}
      <div className="gf-filter-bar">
        <div className="gf-search-input-wrap">
          <Search className="lucide w-3 h-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search report ID, user, company, module..."
            className="gf-search-input font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="gf-select"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => setModuleFilter(e.target.value)}
            className="gf-select"
          >
            <option value="ALL">All Modules</option>
            <option value="AUCTIONS">Auctions</option>
            <option value="FEEDS">Feeds</option>
            <option value="RATES">Rates</option>
            <option value="NEXUS">Nexus</option>
          </select>

          <span className="text-[10px] font-bold text-slate-600 font-mono">
            Showing {filteredReports.length} of {reports.length}
          </span>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="gf-card">
        <div className="gf-table-container">
          <table className="gf-table">
            <thead>
              <tr>
                <th>REPORT ID</th>
                <th>TYPE</th>
                <th>REPORTED BY</th>
                <th>TARGET</th>
                <th>MODULE</th>
                <th>SEVERITY</th>
                <th>STATUS</th>
                <th>DATE</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <CheckCircle2 className="lucide w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-60" />
                    <div className="font-bold text-slate-700 text-xs">No Reports Found</div>
                    <div className="text-[9px]">Zero open grievance reports or appeals matching your criteria.</div>
                  </td>
                </tr>
              ) : (
                filteredReports.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedReport(row)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td>
                      <span className="font-mono text-[9.5px] font-bold text-rose-800 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                        {row.id}
                      </span>
                    </td>
                    <td>
                      <span className="font-bold text-slate-900">{row.type}</span>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900">{row.reporterName}</div>
                      <div className="text-[9px] font-mono text-slate-500">{row.reporterEmail}</div>
                    </td>
                    <td>
                      <div className="font-bold text-slate-800">{row.targetCompany || row.targetId}</div>
                      <div className="text-[9px] font-mono text-slate-500">{row.targetType} ({row.targetId})</div>
                    </td>
                    <td>
                      <span className="font-bold text-slate-700">{row.module}</span>
                    </td>
                    <td>
                      <span
                        className={`gf-badge ${
                          row.severity === 'CRITICAL'
                            ? 'gf-badge-red'
                            : row.severity === 'HIGH'
                            ? 'gf-badge-amber'
                            : 'gf-badge-blue'
                        }`}
                      >
                        {row.severity}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`gf-badge ${
                          row.status === 'resolved'
                            ? 'gf-badge-green'
                            : row.status === 'under_review'
                            ? 'gf-badge-blue'
                            : row.status === 'open'
                            ? 'gf-badge-amber'
                            : 'gf-badge-gray'
                        }`}
                      >
                        {row.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[9px] text-slate-600">
                        {new Date(row.createdAt).toLocaleDateString()}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedReport(row)}
                          className="gf-btn gf-btn-secondary"
                        >
                          <Eye className="lucide w-3 h-3" />
                          <span>Review</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report Detail Drawer */}
      {selectedReport && (
        <div className="gf-drawer-overlay" onClick={() => setSelectedReport(null)}>
          <div className="gf-drawer-panel max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-drawer-header bg-rose-50 border-b border-rose-200">
              <div>
                <div className="gf-drawer-title text-rose-900 flex items-center gap-2">
                  <FileCheck className="lucide w-4 h-4 text-rose-600" />
                  <span>Report Dossier #{selectedReport.id}</span>
                </div>
                <div className="gf-drawer-subtitle">{selectedReport.type} · Severity: {selectedReport.severity}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="gf-modal-close-btn"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            {/* Actions Bar */}
            <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {selectedReport.status === 'open' && (
                  <button
                    type="button"
                    onClick={() => handleStartReview(selectedReport)}
                    className="gf-btn gf-btn-primary font-bold"
                  >
                    Start Review
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsInfoModalOpen(true)}
                  className="gf-btn gf-btn-secondary"
                >
                  <MessageSquare className="lucide w-3 h-3" />
                  <span>Request Info</span>
                </button>
                {selectedReport.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => handleResolve(selectedReport)}
                    className="gf-btn gf-btn-success font-bold"
                  >
                    <CheckCircle2 className="lucide w-3 h-3" />
                    <span>Resolve</span>
                  </button>
                )}
                {selectedReport.status !== 'closed' && (
                  <button
                    type="button"
                    onClick={() => handleClose(selectedReport)}
                    className="gf-btn gf-btn-danger"
                  >
                    <XCircle className="lucide w-3 h-3" />
                    <span>Close</span>
                  </button>
                )}
              </div>
              <span className="font-mono text-[9px] text-slate-500">
                Assigned: <strong>{selectedReport.assignedAdmin || 'Unassigned'}</strong>
              </span>
            </div>

            <div className="gf-drawer-body space-y-4">
              {/* Reason & Description */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1">
                  <AlertOctagon className="lucide w-3.5 h-3.5 text-rose-600" />
                  <span>Incident Description & Allegation</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div>
                    <span className="text-slate-400 font-bold">PRIMARY REASON:</span>
                    <strong className="text-slate-900 block mt-0.5">{selectedReport.reason}</strong>
                  </div>
                  <div className="pt-1">
                    <span className="text-slate-400 font-bold">FULL STATEMENT:</span>
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded border border-slate-200 mt-1 leading-relaxed">
                      {selectedReport.description}
                    </p>
                  </div>
                  {selectedReport.evidenceRef && (
                    <div className="pt-1">
                      <span className="text-slate-400 font-bold">ATTACHED EVIDENCE REFERENCE:</span>
                      <div className="font-mono text-sky-700 font-bold bg-sky-50 px-2 py-1 rounded border border-sky-200 mt-0.5 inline-block">
                        {selectedReport.evidenceRef}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reporter & Target Information */}
              <div className="grid grid-cols-2 gap-3">
                <div className="gf-card p-3 space-y-1 text-[10px]">
                  <span className="text-slate-400 uppercase font-bold text-[8.5px]">REPORTED BY</span>
                  <div className="font-bold text-slate-900">{selectedReport.reporterName}</div>
                  <div className="font-mono text-[9px] text-slate-500">{selectedReport.reporterEmail}</div>
                </div>

                <div className="gf-card p-3 space-y-1 text-[10px]">
                  <span className="text-slate-400 uppercase font-bold text-[8.5px]">TARGETED ENTITY</span>
                  <div className="font-bold text-slate-900">{selectedReport.targetCompany || selectedReport.targetId}</div>
                  <div className="font-mono text-[9px] text-slate-500">{selectedReport.targetType} ({selectedReport.targetId})</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Info Modal */}
      {isInfoModalOpen && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header bg-sky-50 border-b border-sky-200">
              <div className="gf-modal-title text-sky-900 flex items-center gap-2">
                <MessageSquare className="lucide w-4 h-4 text-sky-600" />
                <span>Request Information from Reporter</span>
              </div>
            </div>

            <form onSubmit={handleRequestInfoSubmit} className="p-4 space-y-3">
              <div className="text-xs text-slate-700">
                Notice to <strong className="text-slate-900">{selectedReport?.reporterName}</strong> regarding Report #{selectedReport?.id}.
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label">
                  Information / Additional Evidence Needed <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={infoRequestText}
                  onChange={(e) => setInfoRequestText(e.target.value)}
                  placeholder="e.g. Please provide the stamped Bill of Lading and written liner booking confirmation."
                  className="gf-textarea w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInfoModalOpen(false)}
                  className="gf-btn gf-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!infoRequestText.trim()}
                  className="gf-btn gf-btn-primary"
                >
                  Send Information Notice
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
          isDestructive={modalConfig.isDestructive}
          onConfirm={modalConfig.onConfirm}
          onClose={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
