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
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { CompanyVerificationItem } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function CompaniesKYCPage() {
  const { companies, verifyCompany, rejectCompany, requestCompanyInfo } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedCompany, setSelectedCompany] = useState<CompanyVerificationItem | null>(companies[0]);
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
    const matchesSearch =
      c.legalName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.companyId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.gstn && c.gstn.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.pan && c.pan.toLowerCase().includes(searchQuery.toLowerCase()));

    if (statusFilter === 'all') return matchesSearch;
    return matchesSearch && c.status === statusFilter;
  });

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
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">OPERATIONS</span>
            <span className="gf-badge gf-badge-amber text-[11px]">
              {companies.filter((c) => c.status === 'pending').length} Awaiting Verification
            </span>
          </div>
          <h1 className="gf-page-title">Companies & Corporate KYC Verification Queue</h1>
          <p className="gf-page-subtitle">
            Cross-verify legal entities, inspect government tax licenses (GSTN, PAN, IEC, MTO), and govern company status
          </p>
        </div>
      </div>

      {/* Workspace Split Layout: List on Left, Detailed Inspector on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter & Companies List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="gf-card p-3 space-y-2">
            <div className="gf-search-input-wrap w-full">
              <Search className="lucide w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by legal name, GSTN, PAN, ID..."
                className="gf-search-input"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px]">
              {['all', 'pending', 'verified', 'additional_info_required', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2 py-1 rounded capitalize font-semibold transition-colors ${
                    statusFilter === st ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {filtered.map((comp) => {
              const isSelected = selectedCompany?.companyId === comp.companyId;
              return (
                <div
                  key={comp.companyId}
                  onClick={() => setSelectedCompany(comp)}
                  className={`gf-card p-3.5 cursor-pointer transition-all ${
                    isSelected ? 'border-sky-500 bg-slate-850 shadow-md' : 'hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-100 text-xs flex items-center gap-1.5">
                        <Building className="lucide w-3.5 h-3.5 text-sky-400" />
                        {comp.legalName}
                      </div>
                      <div className="text-[11px] text-mut font-mono mt-0.5">{comp.companyId} · {comp.city}, {comp.country}</div>
                    </div>
                    <span
                      className={`gf-badge gf-badge-${
                        comp.status === 'verified'
                          ? 'green'
                          : comp.status === 'pending'
                          ? 'amber'
                          : comp.status === 'additional_info_required'
                          ? 'blue'
                          : 'red'
                      } text-[10px] uppercase font-bold`}
                    >
                      {comp.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="mt-2 text-[11px] flex items-center justify-between text-slate-400 border-t border-slate-800 pt-2 font-mono">
                    <span>GSTN: {comp.gstn || 'N/A'}</span>
                    <span>{comp.documents.length} Docs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Document & KYC Review Panel (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCompany ? (
            <div className="gf-card divide-y divide-slate-800">
              {/* Review Panel Header */}
              <div className="p-4 bg-slate-900 flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-100">{selectedCompany.legalName}</h2>
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold">
                      {selectedCompany.companyId}
                    </span>
                  </div>
                  <p className="text-xs text-mut mt-0.5">
                    Primary Contact: <strong className="text-slate-200">{selectedCompany.primaryContactName}</strong> ({selectedCompany.primaryContactEmail})
                  </p>
                </div>

                {/* Primary Decision Action Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsInfoModalOpen(true)}
                    className="gf-btn gf-btn-secondary text-xs"
                  >
                    Request Info
                  </button>
                  <button
                    type="button"
                    onClick={() => handleReject(selectedCompany)}
                    className="gf-btn gf-btn-danger text-xs"
                  >
                    Reject
                  </button>
                  <button
                    type="button"
                    onClick={() => handleVerify(selectedCompany)}
                    className="gf-btn gf-btn-success text-xs font-bold flex items-center gap-1"
                  >
                    <CheckCircle2 className="lucide w-3.5 h-3.5" />
                    Verify KYC
                  </button>
                </div>
              </div>

              {/* Tax & Registration Cross-Check Box */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/40 text-xs">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">GST Registration</span>
                  <span className="font-mono text-sky-400 font-bold">{selectedCompany.gstn || 'N/A'}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">PAN Card Number</span>
                  <span className="font-mono text-slate-200 font-bold">{selectedCompany.pan || 'N/A'}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">DGFT IEC Code</span>
                  <span className="font-mono text-slate-200 font-bold">{selectedCompany.iec || 'N/A'}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-mut text-[10px] uppercase font-bold block">MTO Registration</span>
                  <span className="font-mono text-slate-200 font-bold">{selectedCompany.mto || 'N/A'}</span>
                </div>
              </div>

              {/* Uploaded Documents Review List */}
              <div className="p-4 space-y-3">
                <div className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Attached Compliance Documents ({selectedCompany.documents.length})</span>
                  <span className="text-[11px] text-faint font-mono">Secured Cloud Vault</span>
                </div>

                <div className="space-y-2">
                  {selectedCompany.documents.map((doc) => (
                    <div
                      key={doc.docId}
                      className="p-3 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded bg-slate-800 text-sky-400">
                          <FileText className="lucide w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-200 flex items-center gap-2">
                            {doc.name}
                            <span className="gf-badge gf-badge-gray text-[9px] uppercase font-mono">{doc.type}</span>
                          </div>
                          <div className="text-[10px] text-faint">
                            Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 font-semibold"
                      >
                        <ExternalLink className="lucide w-3 h-3" />
                        Open File
                      </a>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Compliance Notes */}
              <div className="p-4 space-y-2">
                <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MessageSquare className="lucide w-3.5 h-3.5 text-sky-400" />
                  <span>Internal Compliance Review Notes (Confidential)</span>
                </div>
                {selectedCompany.adminNotes.length === 0 ? (
                  <div className="text-xs text-mut italic">No compliance notes logged yet.</div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedCompany.adminNotes.map((note, idx) => (
                      <div key={idx} className="p-2.5 rounded bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-start gap-2">
                        <span className="text-sky-400 font-bold">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="gf-card p-12 text-center text-xs text-mut">
              Select a company from the queue on the left to inspect documents and record a compliance decision.
            </div>
          )}
        </div>
      </div>

      {/* Request Info Modal */}
      {isInfoModalOpen && selectedCompany && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title">Request Additional Compliance Information</h3>
                <p className="gf-modal-subtitle">{selectedCompany.legalName}</p>
              </div>
              <button onClick={() => setIsInfoModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleRequestInfoSubmit} className="gf-modal-body space-y-3">
              <div className="gf-form-group">
                <label className="gf-form-label">Message to Primary Contact ({selectedCompany.primaryContactEmail})</label>
                <textarea
                  required
                  rows={4}
                  value={infoNote}
                  onChange={(e) => setInfoNote(e.target.value)}
                  placeholder="Specify the exact documentation required (e.g. certified translation of incorporation extract, updated GST certificate)..."
                  className="gf-textarea w-full text-xs"
                />
              </div>

              <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsInfoModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  Dispatch Info Request
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
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
