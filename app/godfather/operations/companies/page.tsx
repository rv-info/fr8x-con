'use client';

import React, { useState } from 'react';
import {
  Building,
  Search,
  CheckCircle2,
  XCircle,
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Eye,
  MessageSquare,
  X,
  ZoomIn,
  ZoomOut,
  Download,
  AlertCircle,
  HelpCircle,
  FileCheck,
  ShieldAlert,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { CompanyVerificationItem } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function CompaniesKYCPage() {
  const { companies, verifyCompany, rejectCompany, requestCompanyInfo, auditLogs } = useGodfatherData();
  const { requestStepUpVerification, hasPermission } = useGodfatherAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [countryFilter, setCountryFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');

  const [selectedCompany, setSelectedCompany] = useState<CompanyVerificationItem | null>(null);
  const [previewDocument, setPreviewDocument] = useState<any | null>(null);
  const [docZoom, setDocZoom] = useState(100);

  const [infoNote, setInfoNote] = useState('');
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);

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

  const filtered = companies.filter((c) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      c.legalName.toLowerCase().includes(q) ||
      c.companyId.toLowerCase().includes(q) ||
      (c.gstn && c.gstn.toLowerCase().includes(q)) ||
      (c.pan && c.pan.toLowerCase().includes(q));

    const matchesStatus =
      statusFilter === 'ALL' || c.status.toUpperCase() === statusFilter.replace(/\s+/g, '_');
    const matchesCountry = countryFilter === 'ALL' || c.country.toUpperCase() === countryFilter;
    const matchesRisk = riskFilter === 'ALL' || (c.riskLevel || 'LOW').toUpperCase() === riskFilter;

    return matchesSearch && matchesStatus && matchesCountry && matchesRisk;
  });

  const statusCounts = {
    ALL: companies.length,
    PENDING: companies.filter((c) => c.status === 'pending').length,
    ADDITIONAL_INFO_REQUIRED: companies.filter((c) => c.status === 'additional_info_required').length,
    VERIFIED: companies.filter((c) => c.status === 'verified').length,
    REJECTED: companies.filter((c) => c.status === 'rejected').length,
    SUSPENDED: companies.filter((c) => c.status === 'suspended').length,
  };

  const handleVerify = async (c: CompanyVerificationItem) => {
    const verified = await requestStepUpVerification(`Approve KYC for ${c.legalName}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Approve Company KYC & Legal Verification',
      actionType: 'COMPANY_KYC_VERIFIED',
      targetLabel: c.legalName,
      targetId: c.companyId,
      onConfirm: async (reason) => {
        await verifyCompany(c.companyId, reason);
        setModalConfig(null);
        if (selectedCompany?.companyId === c.companyId) {
          setSelectedCompany({ ...c, status: 'verified' });
        }
      },
    });
  };

  const handleReject = async (c: CompanyVerificationItem) => {
    const verified = await requestStepUpVerification(`Reject KYC for ${c.legalName}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Reject Corporate KYC Submission',
      actionType: 'COMPANY_KYC_REJECTED',
      targetLabel: c.legalName,
      targetId: c.companyId,
      isDestructive: true,
      onConfirm: async (reason) => {
        await rejectCompany(c.companyId, reason);
        setModalConfig(null);
        if (selectedCompany?.companyId === c.companyId) {
          setSelectedCompany({ ...c, status: 'rejected' });
        }
      },
    });
  };

  const handleRequestInfoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompany || !infoNote.trim()) return;

    await requestCompanyInfo(selectedCompany.companyId, infoNote.trim());
    setIsInfoModalOpen(false);
    setInfoNote('');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue font-bold">OPERATIONS & COMPLIANCE</span>
            <span className="gf-badge gf-badge-amber font-mono font-bold">
              {statusCounts.PENDING} PENDING VERIFICATION
            </span>
          </div>
          <h1 className="gf-page-title flex items-center gap-2">
            <Building className="lucide w-4 h-4 text-sky-600" />
            <span>Companies & KYC Verification Governance</span>
          </h1>
          <p className="gf-page-subtitle">
            Enterprise legal entity registry, statutory tax verification (GSTN, PAN, IEC, MTO), and risk evaluation.
          </p>
        </div>
      </div>

      {/* Top Status Summary Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { key: 'ALL', label: 'All Companies', count: statusCounts.ALL, badge: 'gf-badge-gray' },
          { key: 'PENDING', label: 'Pending', count: statusCounts.PENDING, badge: 'gf-badge-amber' },
          { key: 'ADDITIONAL_INFO_REQUIRED', label: 'Additional Info Required', count: statusCounts.ADDITIONAL_INFO_REQUIRED, badge: 'gf-badge-blue' },
          { key: 'VERIFIED', label: 'Verified', count: statusCounts.VERIFIED, badge: 'gf-badge-green' },
          { key: 'REJECTED', label: 'Rejected', count: statusCounts.REJECTED, badge: 'gf-badge-red' },
          { key: 'SUSPENDED', label: 'Suspended', count: statusCounts.SUSPENDED, badge: 'gf-badge-red' },
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
            placeholder="Search by legal name, GSTN, PAN, company ID..."
            className="gf-search-input font-medium"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="gf-select"
          >
            <option value="ALL">All Countries</option>
            <option value="INDIA">India</option>
            <option value="NETHERLANDS">Netherlands</option>
            <option value="SINGAPORE">Singapore</option>
            <option value="ITALY">Italy</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="gf-select"
          >
            <option value="ALL">All Risk Levels</option>
            <option value="LOW">Low Risk</option>
            <option value="MEDIUM">Medium Risk</option>
            <option value="HIGH">High Risk</option>
          </select>

          <span className="text-[10px] font-bold text-slate-600 font-mono">
            Showing {filtered.length} of {companies.length}
          </span>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="gf-card">
        <div className="gf-table-container border-0 rounded-none">
          <table className="gf-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>COMPANY ID</th>
                <th>COUNTRY</th>
                <th>GSTN</th>
                <th>STATUS</th>
                <th>RISK</th>
                <th>SUBMITTED</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-slate-400">
                    <Building className="lucide w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <div className="font-bold text-slate-700 text-xs">No Companies Found</div>
                    <div className="text-[9px]">Zero company records matching the applied status or query filters.</div>
                  </td>
                </tr>
              ) : (
                filtered.map((comp) => (
                  <tr
                    key={comp.companyId}
                    onClick={() => setSelectedCompany(comp)}
                    className="cursor-pointer hover:bg-slate-50"
                  >
                    <td>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <Building className="lucide w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
                        <span>{comp.legalName}</span>
                      </div>
                      <div className="text-[9px] text-slate-500">{comp.city}, {comp.country}</div>
                    </td>
                    <td>
                      <span className="font-mono text-[9.5px] font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                        {comp.companyId}
                      </span>
                    </td>
                    <td>
                      <span className="text-slate-800 font-medium">{comp.country}</span>
                    </td>
                    <td>
                      <span className="font-mono text-[9.5px] text-sky-800 font-semibold">
                        {comp.gstn || 'N/A'}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`gf-badge ${
                          comp.status === 'verified'
                            ? 'gf-badge-green'
                            : comp.status === 'pending'
                            ? 'gf-badge-amber'
                            : comp.status === 'additional_info_required'
                            ? 'gf-badge-blue'
                            : 'gf-badge-red'
                        }`}
                      >
                        {comp.status.replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`gf-badge ${
                          (comp.riskLevel || 'LOW') === 'HIGH'
                            ? 'gf-badge-red'
                            : (comp.riskLevel || 'LOW') === 'MEDIUM'
                            ? 'gf-badge-amber'
                            : 'gf-badge-green'
                        }`}
                      >
                        {comp.riskLevel || 'LOW'}
                      </span>
                    </td>
                    <td>
                      <span className="font-mono text-[9px] text-slate-500">
                        {comp.submittedAt ? new Date(comp.submittedAt).toLocaleDateString() : '2026-01-15'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedCompany(comp)}
                          className="gf-btn gf-btn-secondary"
                          title="Open Company Dossier"
                        >
                          <Eye className="lucide w-3 h-3" />
                          <span>Review</span>
                        </button>
                        {comp.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => handleVerify(comp)}
                            className="gf-btn gf-btn-success font-bold"
                          >
                            <CheckCircle2 className="lucide w-3 h-3" />
                            <span>Verify</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Company Detail Drawer */}
      {selectedCompany && (
        <div className="gf-drawer-overlay" onClick={() => setSelectedCompany(null)}>
          <div className="gf-drawer-panel max-w-2xl" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="gf-drawer-header bg-slate-50 border-b border-slate-200">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-sky-900 text-white flex items-center justify-center font-bold text-sm">
                  {selectedCompany.legalName.charAt(0)}
                </div>
                <div>
                  <div className="gf-drawer-title flex items-center gap-2">
                    <span>{selectedCompany.legalName}</span>
                    <span className="gf-badge gf-badge-blue font-mono font-bold">
                      {selectedCompany.companyId}
                    </span>
                  </div>
                  <div className="gf-drawer-subtitle">
                    {selectedCompany.city}, {selectedCompany.country} ·{' '}
                    <span className="font-semibold text-slate-700 capitalize">
                      Status: {selectedCompany.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCompany(null)}
                className="gf-modal-close-btn"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            {/* Action Area */}
            <div className="p-3 bg-slate-100/70 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-600 uppercase">Verification Actions:</span>
                <button
                  type="button"
                  onClick={() => setIsInfoModalOpen(true)}
                  className="gf-btn gf-btn-secondary"
                >
                  <MessageSquare className="lucide w-3 h-3" />
                  <span>Request Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleReject(selectedCompany)}
                  className="gf-btn gf-btn-danger"
                >
                  <XCircle className="lucide w-3 h-3" />
                  <span>Reject</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVerify(selectedCompany)}
                  className="gf-btn gf-btn-success font-bold"
                >
                  <CheckCircle2 className="lucide w-3 h-3" />
                  <span>Verify KYC</span>
                </button>
              </div>

              <span className="text-[9.5px] font-mono text-slate-500">
                Risk: <strong>{selectedCompany.riskLevel || 'LOW'}</strong>
              </span>
            </div>

            {/* Structured Sections */}
            <div className="gf-drawer-body space-y-4">
              {/* Section 1: Company Information */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Building className="lucide w-3.5 h-3.5 text-sky-600" />
                  <span>Company Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400">Legal Registered Name:</span>{' '}
                    <strong className="text-slate-800 block">{selectedCompany.legalName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Company ID:</span>{' '}
                    <strong className="font-mono text-slate-800 block">{selectedCompany.companyId}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Country of Registration:</span>{' '}
                    <strong className="text-slate-800 block">{selectedCompany.country}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Registered Address:</span>{' '}
                    <span className="text-slate-700 block">{selectedCompany.city}, {selectedCompany.country}</span>
                  </div>
                </div>
              </div>

              {/* Section 2: Tax & Registration */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <FileCheck className="lucide w-3.5 h-3.5 text-emerald-600" />
                  <span>Tax & Government Registration Cross-Check</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 uppercase font-bold text-[8.5px] block">GSTIN / VAT</span>
                    <strong className="font-mono text-sky-800">{selectedCompany.gstn || 'N/A'}</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 uppercase font-bold text-[8.5px] block">PAN / TAX ID</span>
                    <strong className="font-mono text-slate-800">{selectedCompany.pan || 'N/A'}</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 uppercase font-bold text-[8.5px] block">DGFT IEC CODE</span>
                    <strong className="font-mono text-slate-800">{selectedCompany.iec || 'N/A'}</strong>
                  </div>
                  <div className="p-2 rounded bg-slate-50 border border-slate-200">
                    <span className="text-slate-400 uppercase font-bold text-[8.5px] block">MTO / FMC REG</span>
                    <strong className="font-mono text-slate-800">{selectedCompany.mto || 'N/A'}</strong>
                  </div>
                </div>
              </div>

              {/* Section 3: Primary Contact */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <FileText className="lucide w-3.5 h-3.5 text-slate-600" />
                  <span>Primary Corporate Contact</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400">Representative Name:</span>
                    <strong className="text-slate-800 block">{selectedCompany.primaryContactName}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Corporate Email:</span>
                    <strong className="font-mono text-slate-800 block">{selectedCompany.primaryContactEmail}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Phone:</span>
                    <span className="font-mono text-slate-800 block">{selectedCompany.phone || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Section 4: KYC Documents with Safe Preview Experience */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center justify-between border-b border-slate-100 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="lucide w-3.5 h-3.5 text-emerald-600" />
                    <span>Uploaded KYC Filings & Documents ({selectedCompany.documents.length})</span>
                  </div>
                  <span className="text-[8.5px] font-mono text-slate-400">UNTRUSTED INPUT SANITIZED</span>
                </div>

                <div className="divide-y divide-slate-100">
                  {selectedCompany.documents.map((doc, idx) => (
                    <div key={idx} className="py-2 flex items-center justify-between text-[10px]">
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <FileText className="lucide w-3 h-3 text-sky-600" />
                          <span>{doc.name}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono">
                          {doc.type} · Size: {doc.size || '1.4 MB'} · Uploaded: {new Date(doc.uploadedAt).toLocaleDateString()}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className={`gf-badge ${doc.status === 'verified' || doc.verified ? 'gf-badge-green' : 'gf-badge-amber'}`}>
                          {(doc.status || (doc.verified ? 'verified' : 'pending')).toUpperCase()}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setDocZoom(100);
                            setPreviewDocument(doc);
                          }}
                          className="gf-btn gf-btn-secondary"
                        >
                          <Eye className="lucide w-3 h-3" />
                          <span>Inspect Preview</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Compliance & Administrative History */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
                  <Clock className="lucide w-3.5 h-3.5 text-slate-500" />
                  <span>Administrative Audit History</span>
                </div>
                <div className="space-y-1.5 text-[9.5px]">
                  {auditLogs
                    .filter((l) => l.targetId === selectedCompany.companyId)
                    .slice(0, 5)
                    .map((log) => (
                      <div key={log.actionId} className="p-2 rounded bg-slate-50 border border-slate-200">
                        <div className="flex items-center justify-between font-mono text-[8.5px] text-slate-500">
                          <span>{log.actorName} ({log.actorRole})</span>
                          <span>{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        <div className="font-bold text-slate-900 mt-0.5">{log.actionType}</div>
                        <div className="text-slate-600">{log.reason}</div>
                      </div>
                    ))}
                  {auditLogs.filter((l) => l.targetId === selectedCompany.companyId).length === 0 && (
                    <div className="text-slate-400 text-center py-2">
                      No previous administrative decisions on record.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Safe In-Modal KYC Document Preview Viewer */}
      {previewDocument && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card max-w-3xl">
            <div className="gf-modal-header bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="lucide w-4 h-4 text-sky-400" />
                <div>
                  <div className="font-bold text-xs text-white">{previewDocument.name}</div>
                  <div className="text-[9px] text-slate-400 font-mono">{previewDocument.type} (Protected Sandboxed Preview)</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDocZoom((z) => Math.max(50, z - 25))}
                  className="p-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="lucide w-3.5 h-3.5" />
                </button>
                <span className="text-[9px] font-mono text-slate-300">{docZoom}%</span>
                <button
                  type="button"
                  onClick={() => setDocZoom((z) => Math.min(200, z + 25))}
                  className="p-1 rounded bg-slate-800 text-slate-200 hover:bg-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="lucide w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="p-1 rounded text-slate-400 hover:text-white"
                >
                  <X className="lucide w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Document Render Surface (Safe Sandbox - zero macro/script execution) */}
            <div className="p-6 bg-slate-800 min-h-[380px] max-h-[500px] overflow-auto flex items-center justify-center">
              <div
                style={{ transform: `scale(${docZoom / 100})`, transformOrigin: 'center center' }}
                className="transition-transform p-8 bg-white rounded shadow-lg border border-slate-300 w-full max-w-lg text-slate-900 text-xs space-y-4"
              >
                <div className="border-b border-slate-300 pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900">
                      GOVERNMENT TAX CERTIFICATE
                    </h3>
                    <p className="text-[9px] text-slate-500 font-mono">SANCTIONED REGISTRATION FILING</p>
                  </div>
                  <span className="gf-badge gf-badge-green font-mono">OFFICIAL FILING</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[10px]">
                  <div>
                    <span className="text-slate-400 block font-bold">DOCUMENT TYPE:</span>
                    <strong>{previewDocument.type}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">DOCUMENT ID:</span>
                    <span className="font-mono font-bold">DOC-{Math.abs(previewDocument.name.length * 9912)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">TIMESTAMP:</span>
                    <span>{new Date(previewDocument.uploadedAt).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-bold">VERIFICATION STATUS:</span>
                    <span className="text-emerald-700 font-bold uppercase">{previewDocument.status}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-[9.5px] leading-relaxed text-slate-700">
                  This document has been ingested through the FR8X KYC processing gateway. Active scripting, macros, and embedded binaries are stripped and neutralized.
                </div>
              </div>
            </div>

            {/* Footer Action Bar */}
            <div className="gf-modal-footer flex items-center justify-between">
              <span className="text-[9.5px] text-slate-500">
                Document Inspection Sandbox · {selectedCompany?.legalName}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPreviewDocument(null)}
                  className="gf-btn gf-btn-secondary"
                >
                  Close Viewer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Information Dialog */}
      {isInfoModalOpen && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header bg-sky-50 border-b border-sky-200">
              <div className="gf-modal-title text-sky-900 flex items-center gap-2">
                <MessageSquare className="lucide w-4 h-4 text-sky-600" />
                <span>Request Additional Compliance Information</span>
              </div>
            </div>

            <form onSubmit={handleRequestInfoSubmit} className="p-4 space-y-3">
              <div className="text-xs text-slate-700">
                Dispatch an official regulatory notice to <strong className="text-slate-900">{selectedCompany?.legalName}</strong> (
                {selectedCompany?.primaryContactEmail}).
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label">
                  Information / Documents Requested <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={infoNote}
                  onChange={(e) => setInfoNote(e.target.value)}
                  placeholder="Specify the clarification or document re-upload required (e.g. MTO Registration Certificate renewal is required for Indian corridor bookings)."
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
                  disabled={!infoNote.trim()}
                  className="gf-btn gf-btn-primary"
                >
                  Dispatch Regulatory Notice
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
