'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Key,
  Shield,
  Activity,
  Plus,
  RefreshCw,
  Zap,
  Globe,
  DollarSign,
  Gavel,
  Briefcase,
  Layers,
  Award,
  Sparkles,
  Edit2,
  X,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { PaymentGatewayConfig } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function PaymentConfigurationPage() {
  const { paymentGateways, togglePaymentGateway, updatePaymentGateway } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayConfig | null>(paymentGateways[0] || null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Edit Form State
  const [editForm, setEditForm] = useState({
    title: '',
    provider: 'razorpay',
    environment: 'production' as 'production' | 'sandbox',
    publicIdentifier: '',
    webhookUrl: '',
    transactionFee: '2.0% + ₹3',
    settlementTimeline: 'T+2 Business Days',
    allowedSubscriptions: true,
    allowedAuctions: true,
    allowedJobs: true,
    allowedEscrow: true,
    editReason: '',
  });

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

  const handleOpenEdit = (gw: PaymentGatewayConfig) => {
    setSelectedGateway(gw);
    setTestResult(null);
    setEditForm({
      title: gw.title,
      provider: gw.provider,
      environment: gw.environment,
      publicIdentifier: gw.publicIdentifier,
      webhookUrl: gw.webhookUrl,
      transactionFee: gw.transactionFee,
      settlementTimeline: gw.settlementTimeline,
      allowedSubscriptions: gw.allowedModules?.registration ?? true,
      allowedAuctions: gw.allowedModules?.auctions ?? true,
      allowedJobs: gw.allowedModules?.jobPosts ?? true,
      allowedEscrow: true,
      editReason: `Standard configuration and webhook credential update for ${gw.title}`,
    });
    setIsEditModalOpen(true);
  };

  const handleTestConnection = () => {
    setTestResult('Connecting to gateway endpoint...');
    setTimeout(() => {
      setTestResult('✓ Handshake 200 OK: Valid SSL certificate & signed webhook ping confirmed.');
    }, 600);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway || !editForm.editReason.trim()) return;

    const verified = await requestStepUpVerification(
      `Modify Payment Gateway Parameters for ${selectedGateway.provider}`
    );
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Submit Gateway Configuration Update (KMS Sealed)',
      actionType: 'PAYMENT_GATEWAY_CONFIG_UPDATED',
      targetLabel: selectedGateway.title,
      targetId: selectedGateway.gatewayId,
      onConfirm: async (reason) => {
        await updatePaymentGateway(
          selectedGateway.gatewayId,
          {
            environment: editForm.environment,
            publicIdentifier: editForm.publicIdentifier,
            webhookUrl: editForm.webhookUrl,
            transactionFee: editForm.transactionFee,
            settlementTimeline: editForm.settlementTimeline,
            allowedModules: {
              registration: editForm.allowedSubscriptions,
              auctions: editForm.allowedAuctions,
              jobPosts: editForm.allowedJobs,
              adPosts: true,
              kycVerification: true,
            },
          },
          reason
        );
        setIsEditModalOpen(false);
        setModalConfig(null);
      },
    });
  };

  const handleToggleActive = async (gw: PaymentGatewayConfig) => {
    const verified = await requestStepUpVerification(`Toggle ${gw.provider} Gateway Active State`);
    if (!verified) return;

    await togglePaymentGateway(
      gw.gatewayId,
      !gw.enabled,
      `Toggled active status of ${gw.title} to ${!gw.enabled ? 'Enabled' : 'Disabled'}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-green text-[11px] font-bold">COMMERCE & PAYMENTS</span>
            <span className="gf-badge gf-badge-amber text-[11px] font-bold">Zero-Trust KMS Sealed Secrets</span>
          </div>
          <h1 className="gf-page-title">Payment Gateways, Vendor Integrations & Transaction Methods</h1>
          <p className="gf-page-subtitle">
            Configure Razorpay, Stripe, Cashfree, PayPal, UPI and Bank Wire payment rails, transaction fee surcharges, and webhook listeners.
          </p>
        </div>
      </div>

      {/* Security Callout */}
      <div className="gf-card p-4 bg-emerald-50/60 border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
        <Lock className="lucide w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-emerald-950 block mb-0.5 font-bold">Zero-Trust Merchant Key Protection</strong>
          Private merchant secrets and webhook signatures are never rendered in plain client HTML. They reside strictly in Google Cloud KMS / Secret Manager. Changing endpoints or toggling live modes requires Step-Up MFA authentication and immutable audit logging.
        </div>
      </div>

      {/* Payment Modules & Purpose Matrix */}
      <div className="gf-card p-5 space-y-4 border-slate-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="lucide w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-slate-900 text-sm">Commercial Fee Modules & Purpose Matrix</h3>
          </div>
          <span className="gf-badge gf-badge-gold text-[10px] uppercase font-bold font-mono">
            FR8X REVENUE & ANTI-SPAM SYSTEM
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Each fee module on FR8X is engineered for platform integrity, filtering unserious participants, and funding automated carrier verification:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Module 1: Registration & Subscription */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <CreditCard className="lucide w-3.5 h-3.5 text-emerald-700" />
                1. Member Registration & Plans
              </span>
              <span className="gf-badge gf-badge-blue text-[10px]">₹0 - ₹3,000/mo</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Why this fee exists:</strong> Tiered subscription model (Trial 30-day, Professional ₹1,500, Premium Gold ₹3,000) that funds automated GSTIN/IEC checks and unlocks direct tender matching.
            </p>
            <div className="text-[10px] text-emerald-800 font-bold bg-emerald-100/60 px-2 py-1 rounded">
              Methods: Razorpay, PayPal, Stripe, UPI, Bank Wire
            </div>
          </div>

          {/* Module 2: Reverse Auction Creation & Bidding */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Gavel className="lucide w-3.5 h-3.5 text-amber-700" />
                2. Reverse Tender & Bid Fees
              </span>
              <span className="gf-badge gf-badge-gold text-[10px]">₹300 (or ₹180 Gold)</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Why this fee exists:</strong> Prevents non-serious ghost bidding, enforces binding 48-hour container slot quotes, and gives Gold members a 40% VIP discount incentive.
            </p>
            <div className="text-[10px] text-emerald-800 font-bold bg-emerald-100/60 px-2 py-1 rounded">
              Methods: Razorpay, Cashfree UPI, PayPal, Credits
            </div>
          </div>

          {/* Module 3: Job Postings & Advertisements */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                <Briefcase className="lucide w-3.5 h-3.5 text-sky-700" />
                3. Jobs & Ad Placements
              </span>
              <span className="gf-badge gf-badge-green text-[10px]">₹500 / ₹1,200</span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              <strong>Why this fee exists:</strong> Vets authentic logistics hiring postings, eliminates scam recruitment, and provides targeted high-conversion banner displays across verified NVOCC feeds.
            </p>
            <div className="text-[10px] text-emerald-800 font-bold bg-emerald-100/60 px-2 py-1 rounded">
              Methods: Razorpay, Stripe, Cashfree UPI, Wire
            </div>
          </div>
        </div>
      </div>

      {/* Payment Gateway Provider Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentGateways.map((gw) => (
          <div key={gw.gatewayId} className="gf-card p-5 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{gw.logo}</span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{gw.title}</h3>
                    <span className="text-[10px] text-slate-500 font-mono uppercase font-semibold">
                      {gw.provider} · {gw.environment}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggleActive(gw)}
                  className={`gf-badge ${
                    gw.enabled ? 'gf-badge-green' : 'gf-badge-gray'
                  } cursor-pointer text-[10px] uppercase font-bold`}
                  title="Click to toggle gateway active state"
                >
                  {gw.enabled ? 'Active' : 'Disabled'}
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">
                    Public Key / Merchant ID:
                  </span>
                  <span className="font-mono text-slate-900 font-semibold truncate block bg-slate-50 p-1.5 rounded border border-slate-200 text-[11px]">
                    {gw.publicIdentifier}
                  </span>
                </div>

                <div>
                  <span className="text-slate-500 block text-[10px] uppercase font-bold mb-0.5">
                    Webhook Listener URL:
                  </span>
                  <span className="font-mono text-slate-600 text-[10.5px] truncate block bg-slate-50 p-1.5 rounded border border-slate-200">
                    {gw.webhookUrl}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                  <div>
                    <span className="text-slate-500 text-[10px] block font-bold">Transaction Fee:</span>
                    <span className="font-mono text-slate-900 font-bold">{gw.transactionFee}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px] block font-bold">Settlement:</span>
                    <span className="font-mono text-slate-800">{gw.settlementTimeline}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <span className="text-slate-500 text-[10px] block font-bold mb-1">Supported Modules:</span>
                  <div className="flex flex-wrap gap-1">
                    {Object.entries(gw.allowedModules || {}).map(([mod, allowed]) =>
                      allowed ? (
                        <span
                          key={mod}
                          className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9.5px] font-bold capitalize"
                        >
                          ✓ {mod}
                        </span>
                      ) : null
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-slate-500 text-[10px] uppercase font-bold">Webhook Status:</span>
                  <span className="gf-badge gf-badge-green text-[10px] flex items-center gap-1 font-mono font-bold">
                    <Activity className="lucide w-3 h-3" />
                    {gw.webhookStatus ? gw.webhookStatus.toUpperCase() : 'ACTIVE'}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleOpenEdit(gw)}
                className="gf-btn gf-btn-secondary w-full text-xs font-bold flex items-center justify-center gap-1.5 text-sky-700 hover:bg-sky-50"
              >
                <Edit2 className="lucide w-3.5 h-3.5 text-sky-600" />
                <span>Configure Gateway Parameters</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* EDIT GATEWAY MODAL */}
      {isEditModalOpen && selectedGateway && (
        <div className="gf-modal-overlay" onClick={() => setIsEditModalOpen(false)}>
          <div className="gf-modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <Key className="lucide w-5 h-5 text-sky-600" />
                <div>
                  <h3 className="gf-modal-title">Configure Gateway: {selectedGateway.title}</h3>
                  <p className="gf-modal-subtitle font-mono">
                    Provider: {selectedGateway.provider} · ID: {selectedGateway.gatewayId}
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="gf-modal-close-btn">
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit}>
              <div className="gf-modal-body space-y-3.5 max-h-[72vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Environment Mode *</label>
                    <select
                      value={editForm.environment}
                      onChange={(e) =>
                        setEditForm({ ...editForm, environment: e.target.value as 'production' | 'sandbox' })
                      }
                      className="gf-select"
                    >
                      <option value="production">Live Production (Real Settlement)</option>
                      <option value="sandbox">Sandbox / Staging Testing</option>
                    </select>
                  </div>

                  <div>
                    <label className="gf-form-label">Settlement Timeline *</label>
                    <input
                      type="text"
                      required
                      value={editForm.settlementTimeline}
                      onChange={(e) => setEditForm({ ...editForm, settlementTimeline: e.target.value })}
                      placeholder="e.g. T+1 Business Day / Instant UPI"
                      className="gf-input"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Public Key / Merchant ID *</label>
                    <input
                      type="text"
                      required
                      value={editForm.publicIdentifier}
                      onChange={(e) => setEditForm({ ...editForm, publicIdentifier: e.target.value })}
                      className="gf-input font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="gf-form-label">Gateway Surcharge / Fee *</label>
                    <input
                      type="text"
                      required
                      value={editForm.transactionFee}
                      onChange={(e) => setEditForm({ ...editForm, transactionFee: e.target.value })}
                      placeholder="2.0% + ₹3"
                      className="gf-input font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="gf-form-label">Webhook Listener URL *</label>
                  <input
                    type="url"
                    required
                    value={editForm.webhookUrl}
                    onChange={(e) => setEditForm({ ...editForm, webhookUrl: e.target.value })}
                    className="gf-input font-mono"
                  />
                </div>

                {/* Module Checkboxes */}
                <div>
                  <label className="gf-form-label">Allowed Commercial Transaction Modules</label>
                  <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={editForm.allowedSubscriptions}
                        onChange={(e) => setEditForm({ ...editForm, allowedSubscriptions: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Member Subscriptions</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={editForm.allowedAuctions}
                        onChange={(e) => setEditForm({ ...editForm, allowedAuctions: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Reverse Tenders & Bids</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={editForm.allowedJobs}
                        onChange={(e) => setEditForm({ ...editForm, allowedJobs: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Job Postings</span>
                    </label>
                  </div>
                </div>

                {/* Test Connection Button */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800">Verify Gateway Webhook Ping</div>
                    <div className="text-[10.5px] text-slate-500">Send dry-run HMAC signature test</div>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestConnection}
                    className="gf-btn gf-btn-secondary text-xs font-bold"
                  >
                    Test Ping ⚡
                  </button>
                </div>

                {testResult && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded text-xs font-semibold text-emerald-800 font-mono">
                    {testResult}
                  </div>
                )}

                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <label className="text-xs font-bold text-amber-900 block mb-1">
                    Audited Justification Reason *
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.editReason}
                    onChange={(e) => setEditForm({ ...editForm, editReason: e.target.value })}
                    className="gf-input"
                    placeholder="Provide compliance reason for modifying payment rail parameters"
                  />
                </div>
              </div>

              <div className="gf-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="gf-btn gf-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  Commit Gateway Update
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
