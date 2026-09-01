'use client';

import React, { useState } from 'react';
import {
  Scale,
  Search,
  CheckCircle2,
  Edit,
  ShieldCheck,
  FileText,
  Clock,
  Layers,
  Lock,
  ArrowRight,
  Sparkles,
  Plus,
  X,
  FileCheck,
  Eye,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { TermsAgreement } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function TermsAndSafetyPage() {
  const { termsAgreements, updateTermsAgreement, toggleTermsEnforcement } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [selectedAgreement, setSelectedAgreement] = useState<TermsAgreement | null>(termsAgreements[0] || null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Form State
  const [termForm, setTermForm] = useState({
    title: '',
    code: '',
    version: '',
    summary: '',
    fullText: '',
    effectiveDate: '',
    mandatoryClickwrap: true,
    enforceAtRegistration: true,
    enforceAtAuctionCreate: true,
    enforceAtBidSubmit: true,
    enforceAtJobPost: false,
    enforceAtAdPost: false,
    editReason: '',
  });

  // Confirmation modal
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    isDestructive?: boolean;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const handleOpenEdit = (agreement: TermsAgreement) => {
    setSelectedAgreement(agreement);
    setTermForm({
      title: agreement.title,
      code: agreement.code,
      version: agreement.version,
      summary: agreement.summary,
      fullText: agreement.fullText,
      effectiveDate: agreement.effectiveDate || new Date().toISOString().split('T')[0],
      mandatoryClickwrap: agreement.mandatoryClickwrap,
      enforceAtRegistration: agreement.enforceAtRegistration,
      enforceAtAuctionCreate: agreement.enforceAtAuctionCreate,
      enforceAtBidSubmit: agreement.enforceAtBidSubmit,
      enforceAtJobPost: agreement.enforceAtJobPost,
      enforceAtAdPost: agreement.enforceAtAdPost,
      editReason: `Updated terms clauses to reflect enhanced platform cargo insurance and compliance standards`,
    });
    setIsEditModalOpen(true);
  };

  const handleOpenCreate = () => {
    setTermForm({
      title: 'Ocean Cargo Escrow & Dispute Resolution Agreement',
      code: 'AGREEMENT_ESCROW_DISPUTE',
      version: '1.0.0',
      summary: 'Binding terms for digital freight escrow settlement, container detention disputes, and arbitration.',
      fullText: `# Ocean Cargo Escrow & Dispute Resolution Agreement\n\n1. Scope of Escrow Protection\nAll ocean freight booking transactions initiated through the Con.FR8X.IN platform are safeguarded under sovereign digital escrow protocols.\n\n2. Container Slot Commitments\nCarriers must honor published departure dates. Shipper detention fees shall be capped pursuant to FMC and Indian Major Port Authority regulations.\n\n3. Anti-Circumvention\nPlatform operators and participants agree not to solicit offline direct settlement for tenders discovered via Con.FR8X.IN.`,
      effectiveDate: new Date().toISOString().split('T')[0],
      mandatoryClickwrap: true,
      enforceAtRegistration: false,
      enforceAtAuctionCreate: true,
      enforceAtBidSubmit: true,
      enforceAtJobPost: false,
      enforceAtAdPost: false,
      editReason: 'Creation of new digital escrow dispute agreement',
    });
    setIsCreateModalOpen(true);
  };

  const handleSaveTerms = async (e: React.FormEvent, isCreatingNew: boolean) => {
    e.preventDefault();
    if (!termForm.editReason.trim()) return;

    const verified = await requestStepUpVerification(
      isCreatingNew
        ? `Publish New Legal Agreement: ${termForm.title}`
        : `Publish Updated Terms Version for ${termForm.title}`
    );
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: isCreatingNew ? 'Publish New Governance Agreement' : 'Publish Versioned Legal Terms & Contract',
      actionType: isCreatingNew ? 'TERMS_AGREEMENT_CREATED' : 'TERMS_AGREEMENT_VERSION_BUMPED',
      targetLabel: `${termForm.title} (v${termForm.version})`,
      targetId: termForm.code,
      onConfirm: async (reason) => {
        await updateTermsAgreement(
          termForm.code as any,
          {
            title: termForm.title,
            version: termForm.version,
            summary: termForm.summary,
            fullText: termForm.fullText,
          },
          reason
        );
        setIsEditModalOpen(false);
        setIsCreateModalOpen(false);
        setModalConfig(null);
      },
    });
  };

  const handleToggleEnforcement = async (
    agreement: TermsAgreement,
    field: 'enforceAtRegistration' | 'enforceAtAuctionCreate' | 'enforceAtBidSubmit' | 'enforceAtJobPost' | 'enforceAtAdPost'
  ) => {
    const currentVal = agreement[field];
    await toggleTermsEnforcement(
      agreement.code,
      field,
      !currentVal,
      `Toggled clickwrap enforcement for ${field} on ${agreement.title}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">LEGAL & GOVERNANCE</span>
            <span className="gf-badge gf-badge-gold text-[11px] font-mono font-bold">CLICKWRAP ENFORCED</span>
          </div>
          <h1 className="gf-page-title">Terms & Conditions, Safety Agreements & Clickwrap Governance</h1>
          <p className="gf-page-subtitle">
            Configure versioned legal contracts, reverse tender commercial commitments, copyright protection, and mandatory user acceptance gates.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenCreate}
          className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold"
        >
          <Plus className="lucide w-4 h-4" />
          <span>Create New Agreement</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="gf-metric-grid">
        <div className="gf-metric-card">
          <div className="gf-metric-title">Master Legal Contracts</div>
          <div className="gf-metric-value text-slate-900">{termsAgreements.length}</div>
          <div className="gf-metric-foot text-slate-600">
            <Scale className="lucide w-3.5 h-3.5 text-sky-600" /> Versioned &amp; Cryptographically Audited
          </div>
        </div>

        <div className="gf-metric-card">
          <div className="gf-metric-title">Total User Acceptances Logged</div>
          <div className="gf-metric-value text-sky-700">
            {termsAgreements.reduce((sum, t) => sum + (t.totalAcceptances || 0), 0).toLocaleString()}
          </div>
          <div className="gf-metric-foot text-sky-700">
            <CheckCircle2 className="lucide w-3.5 h-3.5" /> Immutable User Consent Proofs
          </div>
        </div>

        <div className="gf-metric-card">
          <div className="gf-metric-title">Active Clickwrap Enforcements</div>
          <div className="gf-metric-value text-emerald-700">
            {termsAgreements.filter((t) => t.mandatoryClickwrap).length}
          </div>
          <div className="gf-metric-foot text-emerald-700">
            <ShieldCheck className="lucide w-3.5 h-3.5" /> Mandatory Checkbox Gates Active
          </div>
        </div>
      </div>

      {/* Agreements Selector & Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Agreement Selector */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-700 px-1">
            Standard Governance Agreements
          </h3>

          {termsAgreements.map((t) => {
            const isSelected = selectedAgreement?.id === t.id;
            return (
              <div
                key={t.id}
                onClick={() => setSelectedAgreement(t)}
                className={`p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-sky-50/70 border-sky-400 shadow-sm ring-1 ring-sky-300'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-bold text-xs text-slate-900 truncate max-w-[180px]">{t.title}</span>
                  <span className="gf-badge gf-badge-blue text-[10px] font-mono font-bold">v{t.version}</span>
                </div>

                <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed mb-3">{t.summary}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 border-t border-slate-100 font-mono">
                  <span className="font-semibold text-slate-700">{t.totalAcceptances} signed</span>
                  <span>{t.effectiveDate}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Agreement Details & Clickwrap Matrix */}
        <div className="lg:col-span-2 space-y-4">
          {selectedAgreement && (
            <div className="gf-card p-5 space-y-5">
              {/* Header */}
              <div className="flex items-start justify-between flex-wrap gap-2 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="gf-badge gf-badge-blue text-[10px] uppercase font-mono font-bold">
                      {selectedAgreement.code}
                    </span>
                    <span className="gf-badge gf-badge-gold text-[10px] font-mono font-bold">
                      VERSION {selectedAgreement.version}
                    </span>
                  </div>
                  <h2 className="text-base font-extrabold text-slate-900">{selectedAgreement.title}</h2>
                  <p className="text-xs text-slate-600 mt-1">{selectedAgreement.summary}</p>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(selectedAgreement)}
                  className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold"
                >
                  <Edit className="lucide w-3.5 h-3.5" />
                  <span>Edit &amp; Bump Version</span>
                </button>
              </div>

              {/* Clickwrap Enforcement Gates Switchboard */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2">
                  Mandatory Clickwrap Enforcement Checkpoints
                </h4>
                <p className="text-xs text-slate-600 mb-3">
                  Toggle whether members are required to explicitly tick and accept this legal contract before completing specific platform actions:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Registration Checkpoint */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-900">Member Registration</strong>
                      <span className="text-[11px] text-slate-500">Sign-up &amp; company onboarding</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleEnforcement(selectedAgreement, 'enforceAtRegistration')}
                      className={`gf-badge ${
                        selectedAgreement.enforceAtRegistration ? 'gf-badge-green' : 'gf-badge-gray'
                      } cursor-pointer font-bold text-xs`}
                    >
                      {selectedAgreement.enforceAtRegistration ? 'ENFORCED' : 'OFF'}
                    </button>
                  </div>

                  {/* Reverse Auction Creation */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-900">Create Reverse Auction</strong>
                      <span className="text-[11px] text-slate-500">Post freight shipper tender</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleEnforcement(selectedAgreement, 'enforceAtAuctionCreate')}
                      className={`gf-badge ${
                        selectedAgreement.enforceAtAuctionCreate ? 'gf-badge-green' : 'gf-badge-gray'
                      } cursor-pointer font-bold text-xs`}
                    >
                      {selectedAgreement.enforceAtAuctionCreate ? 'ENFORCED' : 'OFF'}
                    </button>
                  </div>

                  {/* Submit Bids */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-900">Submit Auction Bids</strong>
                      <span className="text-[11px] text-slate-500">Binding container quote placement</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleEnforcement(selectedAgreement, 'enforceAtBidSubmit')}
                      className={`gf-badge ${
                        selectedAgreement.enforceAtBidSubmit ? 'gf-badge-green' : 'gf-badge-gray'
                      } cursor-pointer font-bold text-xs`}
                    >
                      {selectedAgreement.enforceAtBidSubmit ? 'ENFORCED' : 'OFF'}
                    </button>
                  </div>

                  {/* Post Job Ads */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-900">Post Job Vacancies</strong>
                      <span className="text-[11px] text-slate-500">Recruitment &amp; talent posting</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleEnforcement(selectedAgreement, 'enforceAtJobPost')}
                      className={`gf-badge ${
                        selectedAgreement.enforceAtJobPost ? 'gf-badge-green' : 'gf-badge-gray'
                      } cursor-pointer font-bold text-xs`}
                    >
                      {selectedAgreement.enforceAtJobPost ? 'ENFORCED' : 'OFF'}
                    </button>
                  </div>

                  {/* Post Advertisements */}
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between">
                    <div>
                      <strong className="block text-slate-900">Post Commercial Ads</strong>
                      <span className="text-[11px] text-slate-500">Sponsored media &amp; banners</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleEnforcement(selectedAgreement, 'enforceAtAdPost')}
                      className={`gf-badge ${
                        selectedAgreement.enforceAtAdPost ? 'gf-badge-green' : 'gf-badge-gray'
                      } cursor-pointer font-bold text-xs`}
                    >
                      {selectedAgreement.enforceAtAdPost ? 'ENFORCED' : 'OFF'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Full Legal Text View */}
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1">
                  Full Contract &amp; Safety Clauses Text
                </label>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-700 font-mono max-h-60 overflow-y-auto whitespace-pre-wrap">
                  {selectedAgreement.fullText}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EDIT / CREATE AGREEMENT MODAL */}
      {(isEditModalOpen || isCreateModalOpen) && (
        <div
          className="gf-modal-overlay"
          onClick={() => {
            setIsEditModalOpen(false);
            setIsCreateModalOpen(false);
          }}
        >
          <div className="gf-modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <Scale className="lucide w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="gf-modal-title">
                    {isCreateModalOpen ? 'Create New Legal Agreement' : `Edit Agreement: ${termForm.title}`}
                  </h3>
                  <p className="gf-modal-subtitle font-mono">
                    Clickwrap Legal Engine · Append-Only Consent Ledger
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsCreateModalOpen(false);
                }}
                className="gf-modal-close-btn"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleSaveTerms(e, isCreateModalOpen)}>
              <div className="gf-modal-body space-y-3.5 max-h-[72vh] overflow-y-auto">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <label className="gf-form-label">Agreement Title *</label>
                    <input
                      type="text"
                      required
                      value={termForm.title}
                      onChange={(e) => setTermForm({ ...termForm, title: e.target.value })}
                      className="gf-input font-bold"
                      placeholder="e.g. Ocean Freight Booking Terms & Escrow Policy"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">Version Number *</label>
                    <input
                      type="text"
                      required
                      value={termForm.version}
                      onChange={(e) => setTermForm({ ...termForm, version: e.target.value })}
                      className="gf-input font-mono font-bold"
                      placeholder="2.4.0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Agreement Code *</label>
                    <input
                      type="text"
                      required
                      value={termForm.code}
                      onChange={(e) => setTermForm({ ...termForm, code: e.target.value.toUpperCase() })}
                      className="gf-input font-mono uppercase"
                      placeholder="AGREEMENT_OCEAN_TERMS"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">Effective Date *</label>
                    <input
                      type="date"
                      required
                      value={termForm.effectiveDate}
                      onChange={(e) => setTermForm({ ...termForm, effectiveDate: e.target.value })}
                      className="gf-input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="gf-form-label">Executive Legal Summary *</label>
                  <textarea
                    rows={2}
                    required
                    value={termForm.summary}
                    onChange={(e) => setTermForm({ ...termForm, summary: e.target.value })}
                    className="gf-textarea"
                    placeholder="Short summary displayed on registration and tender clickwrap gates..."
                  />
                </div>

                <div>
                  <label className="gf-form-label">Full Legal Clauses &amp; Terms Contract Text *</label>
                  <textarea
                    rows={7}
                    required
                    value={termForm.fullText}
                    onChange={(e) => setTermForm({ ...termForm, fullText: e.target.value })}
                    className="gf-textarea font-mono text-xs"
                    placeholder="Enter complete contractual clauses, dispute arbitration rules, and liability terms..."
                  />
                </div>

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="text-xs font-bold text-amber-900 block mb-1">
                    Audited Legal Reason for Version Update *
                  </label>
                  <input
                    type="text"
                    required
                    value={termForm.editReason}
                    onChange={(e) => setTermForm({ ...termForm, editReason: e.target.value })}
                    className="gf-input"
                    placeholder="e.g. Updated cargo detention liability pursuant to FMC 2026 guidelines"
                  />
                </div>
              </div>

              <div className="gf-modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsCreateModalOpen(false);
                  }}
                  className="gf-btn gf-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  {isCreateModalOpen ? 'Publish Agreement' : 'Save & Bump Terms Version'}
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
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
