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
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { PaymentGatewayConfig } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function PaymentConfigurationPage() {
  const { paymentGateways, togglePaymentGateway, updatePaymentGateway } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayConfig | null>(paymentGateways[0]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editEnv, setEditEnv] = useState<'production' | 'sandbox'>('production');
  const [editPublicId, setEditPublicId] = useState('');
  const [editWebhook, setEditWebhook] = useState('');
  const [editReason, setEditReason] = useState('');

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
    setEditEnv(gw.environment);
    setEditPublicId(gw.publicIdentifier);
    setEditWebhook(gw.webhookUrl);
    setEditReason(`Updated payment rail keys and webhook endpoint for ${gw.title}`);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGateway || !editReason.trim()) return;

    const verified = await requestStepUpVerification(`Modify Payment Gateway Parameters for ${selectedGateway.provider}`);
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
            environment: editEnv,
            publicIdentifier: editPublicId,
            webhookUrl: editWebhook,
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
            <span className="gf-badge gf-badge-amber text-[11px]">Zero-Trust KMS Sealed Secrets</span>
          </div>
          <h1 className="gf-page-title">Payment Gateways, Vendor Integrations & Transaction Methods</h1>
          <p className="gf-page-subtitle">
            Configure Razorpay, PayPal, Stripe, Cashfree, UPI and Bank Wire payment methods, fee assignments, and commercial utility rules
          </p>
        </div>
      </div>

      {/* Security Callout */}
      <div className="gf-card p-4 bg-emerald-50/60 border-emerald-200 text-xs text-emerald-950 flex items-start gap-3">
        <Lock className="lucide w-5 h-5 text-emerald-700 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-emerald-950 block mb-0.5 font-bold">Zero-Trust Merchant Key Protection</strong>
          Private merchant secrets and webhook signatures are never rendered in client HTML. They reside strictly in Google Cloud KMS / Secret Manager. Changing endpoints or toggling live modes requires Step-Up MFA authentication and immutable audit logging.
        </div>
      </div>

      {/* Payment Modules & Purpose Matrix (The "Fun & Purpose" of each fee) */}
      <div className="gf-card p-5 space-y-4 border-emerald-300">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="lucide w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-emerald-950 text-sm">Commercial Fee Modules & Purpose Matrix</h3>
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
          <div key={gw.gatewayId} className="gf-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">{gw.logo}</span>
                <div>
                  <h3 className="font-bold text-emerald-950 text-sm">{gw.title}</h3>
                  <span className="text-[10px] text-slate-500 font-mono uppercase">{gw.provider}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleToggleActive(gw)}
                className={`gf-badge ${gw.enabled ? 'gf-badge-green' : 'gf-badge-gray'} cursor-pointer text-[10px] uppercase font-bold`}
              >
                {gw.enabled ? 'Active' : 'Disabled'}
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-mut block text-[10px] uppercase font-bold">Public Key / Merchant ID:</span>
                <span className="font-mono text-emerald-900 font-semibold truncate block bg-slate-50 p-1 rounded border border-slate-200">
                  {gw.publicIdentifier}
                </span>
              </div>

              <div>
                <span className="text-mut block text-[10px] uppercase font-bold">Secret Key Vault Ref:</span>
                <span className="font-mono text-slate-500 text-[11px] truncate block">
                  {gw.secretKeyVaultRef}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                <div>
                  <span className="text-mut text-[10px] block font-bold">Transaction Fee:</span>
                  <span className="font-mono text-slate-800 font-semibold">{gw.transactionFee}</span>
                </div>
                <div>
                  <span className="text-mut text-[10px] block font-bold">Settlement:</span>
                  <span className="font-mono text-slate-800">{gw.settlementTimeline}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-mut text-[10px] block font-bold mb-1">Supported Modules:</span>
                <div className="flex flex-wrap gap-1">
                  {Object.entries(gw.allowedModules).map(([mod, allowed]) =>
                    allowed ? (
                      <span key={mod} className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9.5px] font-bold">
                        ✓ {mod}
                      </span>
                    ) : null
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <span className="text-mut text-[10px] uppercase font-bold">Webhook Status:</span>
                <span className="gf-badge gf-badge-green text-[10px] flex items-center gap-1 font-mono font-bold">
                  <Activity className="lucide w-3 h-3" />
                  {gw.webhookStatus.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleOpenEdit(gw)}
                className="gf-btn gf-btn-secondary w-full text-xs font-bold"
              >
                Modify Keys & Endpoints
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Gateway Modal */}
      {isEditModalOpen && selectedGateway && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title flex items-center gap-1.5 text-emerald-950">
                  <Key className="lucide w-4 h-4 text-emerald-700" />
                  Configure Gateway Parameters
                </h3>
                <p className="gf-modal-subtitle">Provider: {selectedGateway.title} ({selectedGateway.gatewayId})</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="gf-modal-body space-y-4">
              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Environment Mode</label>
                <select
                  value={editEnv}
                  onChange={(e) => setEditEnv(e.target.value as any)}
                  className="gf-select w-full text-xs font-bold"
                >
                  <option value="production">Live Production (Actual Charges)</option>
                  <option value="sandbox">Sandbox / Staging Testing</option>
                </select>
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Public Key Identifier</label>
                <input
                  type="text"
                  required
                  value={editPublicId}
                  onChange={(e) => setEditPublicId(e.target.value)}
                  className="gf-input w-full text-xs font-mono font-bold"
                />
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Webhook Listener URL</label>
                <input
                  type="text"
                  required
                  value={editWebhook}
                  onChange={(e) => setEditWebhook(e.target.value)}
                  className="gf-input w-full text-xs font-mono"
                />
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Godfather Rationale (Audit Record)</label>
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
                  Authorize & Commit Gateway Update
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
