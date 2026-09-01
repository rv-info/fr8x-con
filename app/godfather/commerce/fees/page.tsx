'use client';

import React, { useState } from 'react';
import {
  Percent,
  DollarSign,
  Shield,
  CheckCircle2,
  Award,
  ArrowRight,
  Gavel,
  Briefcase,
  Layers,
  Sparkles,
  CreditCard,
  Building,
  Edit2,
  Plus,
  X,
  Zap,
} from 'lucide-react';
import Link from 'next/link';
import { usePlatformConfig } from '@/lib/platform-config';
import { useToast } from '@/lib/context/ToastContext';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

interface CommercialFeeRule {
  id: string;
  name: string;
  code: string;
  category: 'Auction' | 'Subscription' | 'Recruitment' | 'Media' | 'Compliance';
  amount: number;
  currency: string;
  chargeModel: 'fixed' | 'percentage';
  goldDiscountPercent: number;
  status: 'active' | 'waived';
  description: string;
  minCap?: number;
  maxCap?: number;
}

const INITIAL_FEES: CommercialFeeRule[] = [
  {
    id: 'FEE-001',
    name: 'Reverse Auction Spot Bidding Fee',
    code: 'FEE_AUCTION_BID',
    category: 'Auction',
    amount: 300,
    currency: 'INR',
    chargeModel: 'fixed',
    goldDiscountPercent: 40,
    status: 'active',
    description: 'Prevents non-serious ghost bidding, binds forwarders to enforceable 48-hour container slot validity.',
  },
  {
    id: 'FEE-002',
    name: 'Logistics Job Vacancy Listing',
    code: 'FEE_JOB_POST',
    category: 'Recruitment',
    amount: 500,
    currency: 'INR',
    chargeModel: 'fixed',
    goldDiscountPercent: 50,
    status: 'active',
    description: 'Ensures listings represent legitimate freight forwarding & supply chain vacancies.',
  },
  {
    id: 'FEE-003',
    name: 'Commercial Feed Banner Ad Placement',
    code: 'FEE_BANNER_AD',
    category: 'Media',
    amount: 1200,
    currency: 'INR',
    chargeModel: 'fixed',
    goldDiscountPercent: 20,
    status: 'active',
    description: 'Targeted high-conversion promotional visibility across verified NVOCC & forwarder live feeds.',
  },
  {
    id: 'FEE-004',
    name: 'Enterprise KYC & GSTIN Legal Audit',
    code: 'FEE_KYC_AUDIT',
    category: 'Compliance',
    amount: 2500,
    currency: 'INR',
    chargeModel: 'fixed',
    goldDiscountPercent: 100,
    status: 'active',
    description: 'Covers comprehensive statutory verification by licensed legal compliance officers.',
  },
  {
    id: 'FEE-005',
    name: 'Container Slot Escrow Settlement Levy',
    code: 'FEE_ESCROW_SETTLEMENT',
    category: 'Auction',
    amount: 0.75,
    currency: '%',
    chargeModel: 'percentage',
    goldDiscountPercent: 33,
    status: 'active',
    description: 'Platform trust & security fee applied on finalized digital ocean freight escrow payouts.',
    minCap: 500,
    maxCap: 5000,
  },
];

export default function FeesDiscountsPage() {
  const { config, updateConfig } = usePlatformConfig();
  const { toast } = useToast();

  const [feeRules, setFeeRules] = useState<CommercialFeeRule[]>(INITIAL_FEES);
  const [selectedFee, setSelectedFee] = useState<CommercialFeeRule | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [feeForm, setFeeForm] = useState<Partial<CommercialFeeRule>>({
    name: '',
    code: '',
    category: 'Auction',
    amount: 300,
    currency: 'INR',
    chargeModel: 'fixed',
    goldDiscountPercent: 20,
    status: 'active',
    description: '',
  });

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const handleToggleBiddingFee = () => {
    const nextState = !config.biddingFeeEnabled;
    updateConfig({ biddingFeeEnabled: nextState });
    toast(nextState ? 'Bidding fee enabled (₹300/bid).' : 'Bidding fee WAIVED (100% Free Bidding active across platform).');
  };

  const handleToggleJobPostingFee = () => {
    const nextState = !config.jobPostingFeeEnabled;
    updateConfig({ jobPostingFeeEnabled: nextState });
    toast(nextState ? 'Job posting fee enabled (₹500/post).' : 'Job posting fee WAIVED (100% Free Job Posting active across platform).');
  };

  const handleTogglePaymentCards = () => {
    const nextState = !config.requirePaymentCards;
    updateConfig({ requirePaymentCards: nextState });
    toast(nextState ? 'Payment cards required for billing operations.' : 'Login & platform payment cards REMOVED (Zero-friction free mode).');
  };

  const handleOpenEdit = (fee: CommercialFeeRule) => {
    setSelectedFee(fee);
    setFeeForm({ ...fee });
    setIsEditModalOpen(true);
  };

  const handleSaveFee = (e: React.FormEvent, isNew: boolean) => {
    e.preventDefault();
    setModalConfig({
      isOpen: true,
      title: isNew ? 'Create New Commercial Fee Schedule' : 'Update Commercial Fee Schedule',
      actionType: isNew ? 'COMMERCIAL_FEE_CREATED' : 'COMMERCIAL_FEE_UPDATED',
      targetLabel: feeForm.name || 'Fee Rule',
      targetId: feeForm.code || 'FEE-CUSTOM',
      onConfirm: () => {
        if (isNew) {
          const created: CommercialFeeRule = {
            id: `FEE-00${feeRules.length + 1}`,
            name: feeForm.name || 'Custom Platform Fee',
            code: feeForm.code || 'FEE_CUSTOM',
            category: feeForm.category || 'Auction',
            amount: Number(feeForm.amount) || 0,
            currency: feeForm.currency || 'INR',
            chargeModel: feeForm.chargeModel || 'fixed',
            goldDiscountPercent: Number(feeForm.goldDiscountPercent) || 0,
            status: feeForm.status || 'active',
            description: feeForm.description || '',
          };
          setFeeRules([...feeRules, created]);
        } else if (selectedFee) {
          setFeeRules(
            feeRules.map((f) => (f.id === selectedFee.id ? ({ ...f, ...feeForm } as CommercialFeeRule) : f))
          );
        }
        setIsEditModalOpen(false);
        setIsCreateModalOpen(false);
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
            <span className="gf-badge gf-badge-green text-[11px] font-bold">COMMERCE & INCENTIVES</span>
            <span className="gf-badge gf-badge-gold text-[11px] font-bold">Godfather Master Fee Controls</span>
          </div>
          <h1 className="gf-page-title">Commercial Fee Schedules, Payment Controls & Waivers</h1>
          <p className="gf-page-subtitle">
            Configure dynamic platform fee schedules, reverse auction charges, job posting costs, and grant free bidding waivers.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setFeeForm({
              name: 'Brokerage Slot Escrow Fee',
              code: 'FEE_ESCROW_SLOT',
              category: 'Auction',
              amount: 500,
              currency: 'INR',
              chargeModel: 'fixed',
              goldDiscountPercent: 50,
              status: 'active',
              description: 'Fee levied on successful slot allocation.',
            });
            setIsCreateModalOpen(true);
          }}
          className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold"
        >
          <Plus className="lucide w-4 h-4" />
          <span>Add Custom Fee Schedule</span>
        </button>
      </div>

      {/* Live Master Switchboard */}
      <div className="gf-card p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl border border-slate-700 shadow-md">
        <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-slate-700">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span>Godfather Live Sovereign Fee &amp; Payment Controls</span>
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Instantly toggle transaction fees and payment walls across user feeds and tenders in real-time.
            </p>
          </div>
          <span className="gf-badge bg-emerald-500 text-slate-950 font-bold text-xs uppercase px-2.5 py-1">
            HOT-SYNC ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
          {/* Switch 1: Payment Cards Requirement */}
          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-sky-400" /> Login Payment Cards
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    config.requirePaymentCards ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'
                  }`}
                >
                  {config.requirePaymentCards ? 'REQUIRED' : 'REMOVED / FREE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                When removed, users register and login without entering credit card details or payment walls.
              </p>
            </div>
            <button
              onClick={handleTogglePaymentCards}
              className={`w-full py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                config.requirePaymentCards
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {config.requirePaymentCards ? 'Click to Remove Cards Requirement' : 'Payment Cards Removed (Active)'}
            </button>
          </div>

          {/* Switch 2: Job Posting Cost */}
          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-amber-400" /> Job Posting Cost
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    config.jobPostingFeeEnabled ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'
                  }`}
                >
                  {config.jobPostingFeeEnabled ? '₹500 / POST' : '100% FREE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                When removed, recruiters and freight companies post job vacancies at ₹0 with zero card requirement.
              </p>
            </div>
            <button
              onClick={handleToggleJobPostingFee}
              className={`w-full py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                config.jobPostingFeeEnabled
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {config.jobPostingFeeEnabled ? 'Click to Make Job Posts 100% Free' : 'Free Job Posting Active'}
            </button>
          </div>

          {/* Switch 3: Reverse Auction Bidding Cost */}
          <div className="p-4 rounded-lg bg-slate-800/80 border border-slate-700 flex flex-col justify-between gap-3">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Gavel className="w-4 h-4 text-emerald-400" /> Auction Bidding Cost
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    config.biddingFeeEnabled ? 'bg-amber-400 text-slate-950' : 'bg-emerald-400 text-slate-950'
                  }`}
                >
                  {config.biddingFeeEnabled ? '₹300 / BID' : '100% FREE'}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-2">
                When removed, freight forwarders submit spot container bids without paying ₹300 per bid.
              </p>
            </div>
            <button
              onClick={handleToggleBiddingFee}
              className={`w-full py-2 px-3 rounded text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                config.biddingFeeEnabled
                  ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                  : 'bg-emerald-600 text-white hover:bg-emerald-500'
              }`}
            >
              {config.biddingFeeEnabled ? 'Click to Make Bidding 100% Free' : 'Free Bidding Active'}
            </button>
          </div>
        </div>
      </div>

      {/* Commercial Fee Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {feeRules.map((fee) => (
          <div key={fee.id} className="gf-card p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Percent className="lucide w-4 h-4 text-sky-600" />
                  <h3 className="font-bold text-slate-900 text-sm">{fee.name}</h3>
                </div>
                <span
                  className={`gf-badge ${
                    fee.status === 'active' ? 'gf-badge-green' : 'gf-badge-gray'
                  } text-[10px] uppercase font-bold`}
                >
                  {fee.status}
                </span>
              </div>

              <div className="font-mono">
                <span className="text-3xl font-black text-slate-900">
                  {fee.currency === 'INR' ? '₹' : ''}
                  {fee.amount}
                  {fee.currency === '%' ? '%' : ''}
                </span>
                <span className="text-xs text-slate-500 font-sans font-medium">
                  {' '}
                  / {fee.chargeModel === 'percentage' ? 'GMV' : 'transaction'}
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 space-y-1">
                <strong className="block font-bold text-slate-800">Commercial Purpose:</strong>
                <p className="text-[11px] leading-relaxed">{fee.description}</p>
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pt-1">
                <span>Gold VIP Discount:</span>
                <span className="font-mono font-bold text-emerald-700">{fee.goldDiscountPercent}% Off</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono font-bold">{fee.code}</span>
              <button
                type="button"
                onClick={() => handleOpenEdit(fee)}
                className="gf-btn gf-btn-secondary text-xs py-1 px-2.5 font-bold flex items-center gap-1 text-sky-700 hover:bg-sky-50"
              >
                <Edit2 className="lucide w-3 h-3 text-sky-600" />
                <span>Edit Schedule</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT / CREATE FEE MODAL */}
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
                <Percent className="lucide w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="gf-modal-title">
                    {isCreateModalOpen ? 'Add Custom Commercial Fee Schedule' : `Edit Fee: ${feeForm.name}`}
                  </h3>
                  <p className="gf-modal-subtitle font-mono">
                    Commercial Tariff Rules & Sovereign Waiver Management
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

            <form onSubmit={(e) => handleSaveFee(e, isCreateModalOpen)}>
              <div className="gf-modal-body space-y-3.5 max-h-[72vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Fee Schedule Name *</label>
                    <input
                      type="text"
                      required
                      value={feeForm.name}
                      onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
                      className="gf-input font-bold"
                      placeholder="e.g. Reverse Auction Bid Submission Fee"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Fee Code Identifier *</label>
                    <input
                      type="text"
                      required
                      value={feeForm.code}
                      onChange={(e) => setFeeForm({ ...feeForm, code: e.target.value.toUpperCase() })}
                      className="gf-input font-mono uppercase"
                      placeholder="FEE_AUCTION_BID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="gf-form-label">Charge Amount / Rate *</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={feeForm.amount}
                      onChange={(e) => setFeeForm({ ...feeForm, amount: Number(e.target.value) })}
                      className="gf-input font-mono font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Currency / Unit *</label>
                    <select
                      value={feeForm.currency}
                      onChange={(e) => setFeeForm({ ...feeForm, currency: e.target.value })}
                      className="gf-select"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="%">% Percentage</option>
                    </select>
                  </div>
                  <div>
                    <label className="gf-form-label">Charging Model *</label>
                    <select
                      value={feeForm.chargeModel}
                      onChange={(e) =>
                        setFeeForm({ ...feeForm, chargeModel: e.target.value as 'fixed' | 'percentage' })
                      }
                      className="gf-select"
                    >
                      <option value="fixed">Fixed Flat Amount</option>
                      <option value="percentage">Percentage of GMV</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Gold Member Discount %</label>
                    <input
                      type="number"
                      value={feeForm.goldDiscountPercent}
                      onChange={(e) => setFeeForm({ ...feeForm, goldDiscountPercent: Number(e.target.value) })}
                      className="gf-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Fee Status</label>
                    <select
                      value={feeForm.status}
                      onChange={(e) =>
                        setFeeForm({ ...feeForm, status: e.target.value as 'active' | 'waived' })
                      }
                      className="gf-select"
                    >
                      <option value="active">Active (Enforced)</option>
                      <option value="waived">Waived (100% Free)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="gf-form-label">Fee Purpose & Description *</label>
                  <textarea
                    rows={3}
                    required
                    value={feeForm.description}
                    onChange={(e) => setFeeForm({ ...feeForm, description: e.target.value })}
                    className="gf-textarea"
                    placeholder="Specify the platform integrity reason and commercial utility for this fee..."
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
                  {isCreateModalOpen ? 'Create Fee Schedule' : 'Save Schedule Changes'}
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
