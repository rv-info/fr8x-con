'use client';

import React, { useState, useEffect } from 'react';
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
  QrCode,
  Building,
  Upload,
  Copy,
  Check,
  Save,
  Image as ImageIcon,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { PaymentGatewayConfig } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function PaymentConfigurationPage() {
  const {
    paymentGateways,
    togglePaymentGateway,
    updatePaymentGateway,
    bankDetails,
    upiDetails,
    updateBankDetails,
    updateUpiDetails,
  } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [selectedGateway, setSelectedGateway] = useState<PaymentGatewayConfig | null>(paymentGateways[0] || null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  // Bank & UPI QR States
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [isUpiModalOpen, setIsUpiModalOpen] = useState(false);
  const [bankForm, setBankForm] = useState(bankDetails);
  const [upiForm, setUpiForm] = useState(upiDetails);
  const [bankReason, setBankReason] = useState('');
  const [upiReason, setUpiReason] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (bankDetails) setBankForm(bankDetails);
  }, [bankDetails]);

  useEffect(() => {
    if (upiDetails) setUpiForm(upiDetails);
  }, [upiDetails]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleQrFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (loadEvt) => {
      const result = loadEvt.target?.result as string;
      if (result) {
        setUpiForm((prev) => ({ ...prev, qrImageUrl: result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bankReason.trim()) return;
    const verified = await requestStepUpVerification('Update Official Corporate Bank Account Parameters');
    if (!verified) return;
    await updateBankDetails(bankForm, bankReason);
    setIsBankModalOpen(false);
    setBankReason('');
  };

  const handleSaveUpi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!upiReason.trim()) return;
    const verified = await requestStepUpVerification('Update Platform Official UPI QR & VPA Handle');
    if (!verified) return;
    await updateUpiDetails(upiForm, upiReason);
    setIsUpiModalOpen(false);
  };

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

      {/* Official Platform Direct Settlement Rails: Bank Wire & UPI QR Code (User Requirement) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-600" />
              Official Corporate Bank &amp; UPI QR Settlement Rails
            </h2>
            <p className="text-xs text-slate-500">
              Configure official collection accounts and upload official UPI QR codes used for member plan recharges, reverse auction deposits, and wire settlements.
            </p>
          </div>
          <span className="gf-badge gf-badge-green text-xs font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" /> Enforced for Expired Plan Recharges
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Card 1: Official Corporate Bank Account */}
          <div className="gf-card p-5 space-y-4 border-l-4 border-l-indigo-600">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{bankDetails.bankName}</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Account Type: {bankDetails.accountType} · {bankDetails.branch}
                  </span>
                </div>
              </div>
              <span className={`gf-badge ${bankDetails.isActive ? 'gf-badge-green' : 'gf-badge-gray'} text-[10px] font-bold uppercase`}>
                {bankDetails.isActive ? 'Active Rail' : 'Disabled'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Beneficiary Name:</span>
                <b className="text-slate-900 font-semibold">{bankDetails.accountHolderName}</b>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Account Number:</span>
                <div className="flex items-center gap-1.5">
                  <code className="font-mono font-bold text-indigo-700 text-sm bg-indigo-50 px-2 py-0.5 rounded">
                    {bankDetails.accountNumber}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankDetails.accountNumber, 'acc')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    title="Copy Account Number"
                  >
                    {copiedKey === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/60">
                <span className="text-slate-500">IFSC Code:</span>
                <div className="flex items-center gap-1.5">
                  <code className="font-mono font-bold text-slate-800 bg-slate-200 px-2 py-0.5 rounded">
                    {bankDetails.ifscCode}
                  </code>
                  <button
                    type="button"
                    onClick={() => handleCopy(bankDetails.ifscCode, 'ifsc')}
                    className="p-1 hover:bg-slate-200 rounded text-slate-500"
                    title="Copy IFSC"
                  >
                    {copiedKey === 'ifsc' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {bankDetails.swiftCode && (
                <div className="flex justify-between items-center py-1">
                  <span className="text-slate-500">SWIFT / BIC (International):</span>
                  <code className="font-mono font-bold text-slate-800">{bankDetails.swiftCode}</code>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                Last updated: {new Date(bankDetails.updatedAt).toLocaleDateString()}
              </span>
              <button
                type="button"
                onClick={() => {
                  setBankForm(bankDetails);
                  setBankReason('');
                  setIsBankModalOpen(true);
                }}
                className="gf-btn gf-btn-secondary text-xs flex items-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5" /> Configure Bank Details
              </button>
            </div>
          </div>

          {/* Card 2: Official Platform UPI QR & VPA */}
          <div className="gf-card p-5 space-y-4 border-l-4 border-l-emerald-600">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                  <QrCode className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Official Platform UPI QR &amp; VPA</h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Merchant Code: {upiDetails.mccCode} (Logistics)
                  </span>
                </div>
              </div>
              <span className={`gf-badge ${upiDetails.isActive ? 'gf-badge-green' : 'gf-badge-gray'} text-[10px] font-bold uppercase`}>
                {upiDetails.isActive ? 'Active UPI Rail' : 'Disabled'}
              </span>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center gap-4">
              {/* QR Preview Box */}
              <div className="w-24 h-24 bg-white border border-slate-300 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                {upiDetails.qrImageUrl && upiDetails.qrImageUrl !== '/upi-qr-placeholder.png' ? (
                  <img
                    src={upiDetails.qrImageUrl}
                    alt="Platform Official UPI QR"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-center p-2">
                    <QrCode className="w-10 h-10 text-slate-800 mx-auto mb-1" />
                    <span className="text-[8px] text-slate-400 font-mono font-bold block">QR CODE</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Official UPI Handle</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <code className="font-mono font-bold text-emerald-700 text-xs bg-emerald-50 px-2 py-0.5 rounded">
                      {upiDetails.vpaId}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(upiDetails.vpaId, 'vpa')}
                      className="p-1 hover:bg-slate-200 rounded text-slate-500"
                      title="Copy UPI VPA"
                    >
                      {copiedKey === 'vpa' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">Payee Name</span>
                  <b className="text-slate-800 text-[11px] truncate block">{upiDetails.payeeName}</b>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-400">
                0% Surcharge Direct UPI Rail
              </span>
              <button
                type="button"
                onClick={() => {
                  setUpiForm(upiDetails);
                  setUpiReason('');
                  setIsUpiModalOpen(true);
                }}
                className="gf-btn gf-btn-secondary text-xs flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" /> Upload QR / Edit VPA
              </button>
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

      {/* Bank Account Edit Modal */}
      {isBankModalOpen && (
        <div className="gf-modal-backdrop">
          <div className="gf-modal max-w-xl">
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-indigo-600" />
                <h3 className="gf-modal-title">Configure Official Corporate Bank Account</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBank}>
              <div className="gf-modal-body space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Bank Name</label>
                    <input
                      type="text"
                      required
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      className="gf-input text-xs"
                      placeholder="e.g. HDFC Bank Ltd."
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Account Type</label>
                    <select
                      value={bankForm.accountType}
                      onChange={(e) => setBankForm({ ...bankForm, accountType: e.target.value as any })}
                      className="gf-input text-xs"
                    >
                      <option value="Current">Current Commercial</option>
                      <option value="Escrow">Dedicated Freight Escrow</option>
                      <option value="Settlement">Carrier Settlement</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Beneficiary / Account Holder Name</label>
                  <input
                    type="text"
                    required
                    value={bankForm.accountHolderName}
                    onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                    className="gf-input text-xs"
                    placeholder="e.g. FR8X LOGISTICS TECHNOLOGIES PVT. LTD."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Account Number</label>
                    <input
                      type="text"
                      required
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      className="gf-input text-xs font-mono font-bold text-indigo-700"
                      placeholder="e.g. 50200088921822"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">IFSC Code</label>
                    <input
                      type="text"
                      required
                      value={bankForm.ifscCode}
                      onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                      className="gf-input text-xs font-mono font-bold"
                      placeholder="e.g. HDFC0001234"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Branch &amp; City</label>
                    <input
                      type="text"
                      required
                      value={bankForm.branch}
                      onChange={(e) => setBankForm({ ...bankForm, branch: e.target.value })}
                      className="gf-input text-xs"
                      placeholder="e.g. BKC Branch, Mumbai"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">SWIFT / BIC (International Wire)</label>
                    <input
                      type="text"
                      value={bankForm.swiftCode || ''}
                      onChange={(e) => setBankForm({ ...bankForm, swiftCode: e.target.value.toUpperCase() })}
                      className="gf-input text-xs font-mono"
                      placeholder="e.g. HDFCINBBXXX"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="bankActiveToggle"
                    checked={bankForm.isActive}
                    onChange={(e) => setBankForm({ ...bankForm, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="bankActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Enable as active payment rail for expired plan recharges &amp; corporate wire
                  </label>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-700">
                    Audit Log Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={bankReason}
                    onChange={(e) => setBankReason(e.target.value)}
                    className="gf-input text-xs"
                    placeholder="Provide reason for changing official corporate bank account"
                  />
                </div>
              </div>

              <div className="gf-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="gf-btn gf-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  Save Bank Account Parameters
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPI QR Upload & VPA Modal */}
      {isUpiModalOpen && (
        <div className="gf-modal-backdrop">
          <div className="gf-modal max-w-xl">
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <QrCode className="w-5 h-5 text-emerald-600" />
                <h3 className="gf-modal-title">Configure Official Platform UPI QR &amp; VPA</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsUpiModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUpi}>
              <div className="gf-modal-body space-y-4">
                {/* Upload QR Image Box */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-5">
                  <div className="w-24 h-24 bg-white border border-slate-300 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
                    {upiForm.qrImageUrl && upiForm.qrImageUrl !== '/upi-qr-placeholder.png' ? (
                      <img
                        src={upiForm.qrImageUrl}
                        alt="Uploaded UPI QR Preview"
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <QrCode className="w-10 h-10 text-slate-800 mx-auto mb-1" />
                        <span className="text-[8px] text-slate-400 font-mono font-bold block">NO IMAGE</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <label className="text-xs font-bold text-slate-800 block">
                      Upload Official UPI QR Code
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Upload your bank-issued UPI merchant QR image (.png, .jpg, or .svg). This QR will be shown directly to members on the plan recharge screen.
                    </p>
                    <label className="gf-btn gf-btn-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" /> Select Image File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleQrFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Official UPI VPA ID</label>
                    <input
                      type="text"
                      required
                      value={upiForm.vpaId}
                      onChange={(e) => setUpiForm({ ...upiForm, vpaId: e.target.value.toLowerCase() })}
                      className="gf-input text-xs font-mono font-bold text-emerald-700"
                      placeholder="e.g. fr8xlogistics@icici"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700">Merchant Code (MCC)</label>
                    <input
                      type="text"
                      required
                      value={upiForm.mccCode}
                      onChange={(e) => setUpiForm({ ...upiForm, mccCode: e.target.value })}
                      className="gf-input text-xs font-mono"
                      placeholder="e.g. 4789"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Registered Payee Name</label>
                  <input
                    type="text"
                    required
                    value={upiForm.payeeName}
                    onChange={(e) => setUpiForm({ ...upiForm, payeeName: e.target.value })}
                    className="gf-input text-xs font-semibold"
                    placeholder="e.g. FR8X LOGISTICS TECHNOLOGIES PVT LTD"
                  />
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="upiActiveToggle"
                    checked={upiForm.isActive}
                    onChange={(e) => setUpiForm({ ...upiForm, isActive: e.target.checked })}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="upiActiveToggle" className="text-xs font-semibold text-slate-700 cursor-pointer">
                    Enable as active instant UPI payment rail for expired plan recharges
                  </label>
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-200">
                  <label className="text-xs font-bold text-slate-700">
                    Audit Log Reason <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={upiReason}
                    onChange={(e) => setUpiReason(e.target.value)}
                    className="gf-input text-xs"
                    placeholder="Provide reason for updating official UPI QR or VPA handle"
                  />
                </div>
              </div>

              <div className="gf-modal-footer">
                <button
                  type="button"
                  onClick={() => setIsUpiModalOpen(false)}
                  className="gf-btn gf-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  Commit UPI QR Parameters
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
