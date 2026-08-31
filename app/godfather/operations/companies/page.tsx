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
          <div className="gf-card p-3 space-y-2 bg-slate-50 border-slate-200">
            <div className="gf-search-input-wrap w-full bg-white border-slate-300">
              <Search className="lucide w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by legal name, GSTN, PAN, ID..."
                className="gf-search-input font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1">
              {['all', 'pending', 'verified', 'additional_info_required', 'rejected'].map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 rounded-md capitalize font-bold transition-colors whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
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
                  className={`gf-card p-4 cursor-pointer transition-all ${
                    isSelected ? 'border-sky-400 bg-sky-50/70 shadow-sm ring-1 ring-sky-300' : 'hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Building className="lucide w-3.5 h-3.5 text-sky-600" />
                        {comp.legalName}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">{comp.companyId} · {comp.city}, {comp.country}</div>
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

                  <div className="mt-2.5 text-[11px] flex items-center justify-between text-slate-600 border-t border-slate-100 pt-2 font-mono">
                    <span>GSTN: {comp.gstn || 'N/A'}</span>
                    <span className="font-semibold text-slate-700">{comp.documents.length} Docs</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Document & KYC Review Panel (7 cols) */}
        <div className="lg:col-span-7">
          {selectedCompany ? (
            <div className="gf-card divide-y divide-slate-100">
              {/* Review Panel Header */}
              <div className="p-4 bg-slate-50 flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-extrabold text-slate-900">{selectedCompany.legalName}</h2>
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold font-mono">
                      {selectedCompany.companyId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Primary Contact: <strong className="text-slate-900">{selectedCompany.primaryContactName}</strong> ({selectedCompany.primaryContactEmail})
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
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 text-xs">
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">GST Registration</span>
                  <span className="font-mono text-sky-700 font-bold block mt-0.5">{selectedCompany.gstn || 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">PAN Card Number</span>
                  <span className="font-mono text-slate-800 font-bold block mt-0.5">{selectedCompany.pan || 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">DGFT IEC Code</span>
                  <span className="font-mono text-slate-800 font-bold block mt-0.5">{selectedCompany.iec || 'N/A'}</span>
                </div>
                <div className="p-2.5 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">MTO Registration</span>
                  <span className="font-mono text-slate-800 font-bold block mt-0.5">{selectedCompany.mto || 'N/A'}</span>
                </div>
              </div>

              {/* Uploaded Documents Review List */}
              <div className="p-4 space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Attached Compliance Documents ({selectedCompany.documents.length})</span>
                  <span className="text-[11px] text-slate-500 font-mono font-semibold">Secured Cloud Vault</span>
                </div>

                <div className="space-y-2">
                  {selectedCompany.documents.map((doc) => (
                    <div
                      key={doc.docId}
                      className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-md bg-white border border-slate-200 text-sky-600">
                          <FileText className="lucide w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {doc.name}
                            <span className="gf-badge gf-badge-gray text-[9px] uppercase font-mono">{doc.type}</span>
                          </div>
                          <div className="text-[10px] text-slate-500">
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
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <MessageSquare className="lucide w-3.5 h-3.5 text-sky-600" />
                  <span>Internal Compliance Review Notes (Confidential)</span>
                </div>
                {selectedCompany.adminNotes.length === 0 ? (
                  <div className="text-xs text-slate-400 italic">No compliance notes logged yet.</div>
                ) : (
                  <div className="space-y-1.5">
                    {selectedCompany.adminNotes.map((note, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 flex items-start gap-2">
                        <span className="text-sky-600 font-bold">•</span>
                        <span>{note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="gf-card p-12 text-center text-xs text-slate-500">
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
