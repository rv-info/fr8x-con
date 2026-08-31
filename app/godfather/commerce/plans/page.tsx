'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  Percent,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { PlanVersion } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function PlansConfigurationPage() {
  const { plans, createPlanVersion } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [selectedPlan, setSelectedPlan] = useState<PlanVersion>(plans[3]); // Premium India
  const [isNewVersionModalOpen, setIsNewVersionModalOpen] = useState(false);
  const [newPrice, setNewPrice] = useState(3000);
  const [newBidFee, setNewBidFee] = useState(180);
  const [newDiscount, setNewDiscount] = useState(40);
  const [effectiveDate, setEffectiveDate] = useState('2026-10-01');
  const [grandfatherPolicy, setGrandfatherPolicy] = useState<'maintain_original_price' | 'notify_and_upgrade_in_90_days' | 'auto_migrate'>('maintain_original_price');

  // Confirmation modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    beforeSnapshot?: any;
    afterSnapshot?: any;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const handleOpenNewVersionModal = () => {
    setNewPrice(selectedPlan.monthlyPrice);
    setNewBidFee(selectedPlan.bidFee);
    setNewDiscount(selectedPlan.bidDiscountPercent);
    setIsNewVersionModalOpen(true);
  };

  const handleSaveNewVersion = async (e: React.FormEvent) => {
    e.preventDefault();

    // High risk action: requires Step-up verification
    const verified = await requestStepUpVerification(`Create effective-dated price version for ${selectedPlan.planName}`);
    if (!verified) return;

    const payload: Partial<PlanVersion> = {
      plan: selectedPlan.plan,
      planName: `${selectedPlan.planName} (V${selectedPlan.version + 1})`,
      countryScope: selectedPlan.countryScope,
      currency: selectedPlan.currency,
      monthlyPrice: Number(newPrice),
      bidFee: Number(newBidFee),
      bidDiscountPercent: Number(newDiscount),
      effectiveFrom: new Date(effectiveDate).toISOString(),
      legacyGrandfatheringPolicy: grandfatherPolicy,
      taxPolicy: selectedPlan.taxPolicy,
    };

    setModalConfig({
      isOpen: true,
      title: 'Publish New Effective-Dated Plan Version',
      actionType: 'PLAN_VERSION_PUBLISHED',
      targetLabel: `${selectedPlan.planName} V${selectedPlan.version + 1}`,
      targetId: `PV-${selectedPlan.plan.toUpperCase()}-V${selectedPlan.version + 1}`,
      beforeSnapshot: selectedPlan,
      afterSnapshot: payload,
      onConfirm: async (reason) => {
        await createPlanVersion(payload, reason);
        setIsNewVersionModalOpen(false);
        setModalConfig(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-green text-[11px] font-bold">COMMERCE</span>
            <span className="gf-badge gf-badge-blue text-[11px]">Effective-Dated Versioning Engine</span>
          </div>
          <h1 className="gf-page-title">Plans, Subscriptions & Versioned Pricing</h1>
          <p className="gf-page-subtitle">
            Configure subscription tiers (Trial, Pro, Premium), bidding fees (₹300 vs ₹180), and legacy customer grandfathering policies
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewVersionModal}
          className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold"
        >
          <Plus className="lucide w-3.5 h-3.5" />
          Create New Plan Version
        </button>
      </div>

      {/* Plan Version Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isSelected = selectedPlan.planVersionId === p.planVersionId;
          return (
            <div
              key={p.planVersionId}
              onClick={() => setSelectedPlan(p)}
              className={`gf-card p-5 cursor-pointer transition-all ${
                isSelected ? 'border-sky-500 bg-sky-50/50 shadow-md ring-2 ring-sky-400' : 'hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span
                  className={`gf-badge ${
                    p.plan === 'premium' ? 'gf-badge-gold' : p.plan === 'professional' ? 'gf-badge-blue' : 'gf-badge-gray'
                  } text-[10px] uppercase font-bold`}
                >
                  {p.plan} · V{p.version}.0
                </span>
                <span className="text-[10px] text-slate-500 font-mono font-bold">{p.countryScope}</span>
              </div>

              <h3 className="text-base font-extrabold text-slate-900">{p.planName}</h3>
              <div className="my-3 font-mono">
                <span className="text-2xl font-black text-slate-900">
                  {p.currency === 'INR' ? '₹' : '$'}{p.monthlyPrice.toLocaleString()}
                </span>
                <span className="text-xs text-slate-500 font-sans"> / month ({p.taxPolicy.replace('_', ' ')})</span>
              </div>

              {/* Core Features */}
              <div className="space-y-2 text-xs text-slate-700 border-t border-slate-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Bid Posting Fee:</span>
                  <span className="font-mono font-bold text-sky-700">
                    {p.currency === 'INR' ? '₹' : '$'}{p.bidFee} {p.bidDiscountPercent > 0 && `(${p.bidDiscountPercent}% Off)`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Monthly Auctions Limit:</span>
                  <span className="font-mono font-bold text-slate-800">{p.limits.monthlyAuctions} tenders</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Gold Tick Verification:</span>
                  <span className="font-bold text-slate-900">{p.featureFlags.goldVerification ? 'Included' : 'None'}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Effective: {new Date(p.effectiveFrom).toLocaleDateString()}</span>
                <span className="text-sky-700 font-bold">Active Model</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grandfathering & Pricing Integrity Notice */}
      <div className="gf-card p-4 bg-slate-50 border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <Shield className="lucide w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 block mb-1">Commercial Billing Immutability Guarantee</strong>
          In accordance with Con.FR8X.IN commercial governance rules, updating a plan configuration creates an append-only version with a forward effective date. Existing paid subscribers and historical tax invoices remain completely immutable.
        </div>
      </div>

      {/* New Plan Version Modal */}
      {isNewVersionModalOpen && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title">Create New Plan Version</h3>
                <p className="gf-modal-subtitle">Forward Effective-Dated Pricing for {selectedPlan.planName}</p>
              </div>
              <button onClick={() => setIsNewVersionModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewVersion} className="gf-modal-body space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Monthly Price ({selectedPlan.currency})</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    className="gf-input w-full text-xs font-mono font-bold text-emerald-400"
                  />
                </div>
                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={effectiveDate}
                    onChange={(e) => setEffectiveDate(e.target.value)}
                    className="gf-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Bid Posting Fee ({selectedPlan.currency})</label>
                  <input
                    type="number"
                    required
                    value={newBidFee}
                    onChange={(e) => setNewBidFee(Number(e.target.value))}
                    className="gf-input w-full text-xs font-mono font-bold"
                  />
                </div>
                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Bid Discount %</label>
                  <input
                    type="number"
                    required
                    value={newDiscount}
                    onChange={(e) => setNewDiscount(Number(e.target.value))}
                    className="gf-input w-full text-xs font-mono"
                  />
                </div>
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Legacy Customer Grandfathering Policy</label>
                <select
                  value={grandfatherPolicy}
                  onChange={(e) => setGrandfatherPolicy(e.target.value as any)}
                  className="gf-select w-full text-xs"
                >
                  <option value="maintain_original_price">Maintain original signup price indefinitely (Grandfathered)</option>
                  <option value="notify_and_upgrade_in_90_days">Notice period with 90-day grace migration</option>
                  <option value="auto_migrate">Migrate on next annual renewal cycle</option>
                </select>
              </div>

              <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsNewVersionModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  Review & Authorize Version
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
          beforeSnapshot={modalConfig.beforeSnapshot}
          afterSnapshot={modalConfig.afterSnapshot}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
