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
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { TermsAgreement } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function TermsAndSafetyPage() {
  const { termsAgreements, updateTermsAgreement, toggleTermsEnforcement } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [selectedAgreement, setSelectedAgreement] = useState<TermsAgreement | null>(termsAgreements[0]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editText, setEditText] = useState('');
  const [editReason, setEditReason] = useState('');

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
    setEditTitle(agreement.title);
    setEditVersion(agreement.version);
    setEditSummary(agreement.summary);
    setEditText(agreement.fullText);
    setEditReason(`Updated terms clauses to reflect enhanced platform cargo insurance and anti-circumvention standards`);
    setIsEditModalOpen(true);
  };

  const handleSaveTerms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgreement || !editReason.trim()) return;

    const verified = await requestStepUpVerification(`Publish Updated Terms Version for ${selectedAgreement.title}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Publish Versioned Legal Terms & Commercial Contract',
      actionType: 'TERMS_AGREEMENT_VERSION_BUMPED',
      targetLabel: `${selectedAgreement.title} (v${editVersion})`,
      targetId: selectedAgreement.id,
      onConfirm: async (reason) => {
        await updateTermsAgreement(
          selectedAgreement.code,
          {
            title: editTitle,
            version: editVersion,
            summary: editSummary,
            fullText: editText,
          },
          reason
        );
        setIsEditModalOpen(false);
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
            <span className="gf-badge gf-badge-gold text-[11px] font-mono font-bold">CLICKWRAP ACTIVE</span>
          </div>
          <h1 className="gf-page-title">Terms & Conditions, Safety Agreements & Clickwrap Governance</h1>
          <p className="gf-page-subtitle">
            Configure versioned legal contracts, reverse tender commercial commitments, copyright protection, and mandatory user acceptance gates
          </p>
        </div>
      </div>

      {/* KPI Overview */}
      <div className="gf-metric-grid">
        <div className="gf-metric-card">
          <div className="gf-metric-title">Master Legal Contracts</div>
          <div className="gf-metric-value text-slate-900">{termsAgreements.length}</div>
          <div className="gf-metric-foot text-slate-600">
            <Scale className="lucide w-3.5 h-3.5 text-sky-600" /> Versioned & Cryptographically Audited
          </div>
        </div>

        <div className="gf-metric-card">
          <div className="gf-metric-title">Total User Acceptances Logged</div>
          <div className="gf-metric-value text-sky-700">
            {termsAgreements.reduce((sum, t) => sum + t.totalAcceptances, 0).toLocaleString()}
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

      {/* Agreements List & Switchboard */}
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
                  Edit & Bump Version
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
                      <span className="text-[11px] text-slate-500">Sign-up & company onboarding</span>
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
                      <span className="text-[11px] text-slate-500">Recruitment & talent posting</span>
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
                      <span className="text-[11px] text-slate-500">Sponsored media & banners</span>
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

              {/* Full Contract Preview */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 mb-2">
                  Active Legal Contract Clauses
                </h4>
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800 whitespace-pre-wrap leading-relaxed max-h-72 overflow-y-auto">
                  {selectedAgreement.fullText}
                </div>
              </div>

              {/* Audit Meta */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-3 border-t border-slate-200">
                <span>Last Updated: {selectedAgreement.updatedAt}</span>
                <span>Audited By: <strong className="text-slate-800">{selectedAgreement.updatedBy}</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Edit Terms Modal */}
      {isEditModalOpen && selectedAgreement && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card max-w-2xl">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title flex items-center gap-1.5 text-slate-900">
                  <Scale className="lucide w-4 h-4 text-sky-600" />
                  Edit Legal Agreement & Bump Version
                </h3>
                <p className="gf-modal-subtitle">{selectedAgreement.title} ({selectedAgreement.code})</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveTerms} className="gf-modal-body space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="gf-form-group col-span-2">
                  <label className="gf-form-label font-bold">Agreement Title</label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="gf-input w-full text-xs font-bold"
                  />
                </div>
                <div className="gf-form-group col-span-1">
                  <label className="gf-form-label font-bold">New Version</label>
                  <input
                    type="text"
                    required
                    value={editVersion}
                    onChange={(e) => setEditVersion(e.target.value)}
                    placeholder="e.g. 3.3"
                    className="gf-input w-full text-xs font-mono font-bold"
                  />
                </div>
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Executive Summary</label>
                <input
                  type="text"
                  required
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  className="gf-input w-full text-xs"
                />
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Full Legal Clauses & Terms Text</label>
                <textarea
                  required
                  rows={8}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="gf-textarea w-full text-xs font-mono"
                />
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Godfather Amendment Justification (Audit Record)</label>
                <textarea
                  required
                  rows={2}
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="gf-textarea w-full text-xs"
                />
              </div>

              <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary font-bold">
                  Publish New Version (Step-Up Authorized)
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
