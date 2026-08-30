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
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { PaymentConfig } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function PaymentConfigurationPage() {
  const { paymentConfigs, requestPaymentConfigChange } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [selectedConfig, setSelectedConfig] = useState<PaymentConfig | null>(paymentConfigs[0]);
  const [isChangeModalOpen, setIsChangeModalOpen] = useState(false);
  const [changeDetails, setChangeDetails] = useState('');

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

  const handleOpenChangeRequest = (cfg: PaymentConfig) => {
    setSelectedConfig(cfg);
    setChangeDetails(`Update webhook endpoint URL and rotation of sandbox credentials for ${cfg.provider}`);
    setIsChangeModalOpen(true);
  };

  const handleSaveChangeRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedConfig || !changeDetails.trim()) return;

    // High risk action: requires Step-up verification
    const verified = await requestStepUpVerification(`Submit Payment Gateway Configuration Change Request for ${selectedConfig.provider}`);
    if (!verified) return;

    setModalConfig({
      isOpen: true,
      title: 'Submit Gateway Configuration Change Request (Two-Person Protocol)',
      actionType: 'PAYMENT_CONFIG_CHANGE_REQUESTED',
      targetLabel: selectedConfig.provider,
      targetId: selectedConfig.configId,
      onConfirm: async (reason) => {
        await requestPaymentConfigChange(selectedConfig.configId, changeDetails.trim(), reason);
        setIsChangeModalOpen(false);
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
            <span className="gf-badge gf-badge-amber text-[11px]">2-Person Security Approval Enforced</span>
          </div>
          <h1 className="gf-page-title">Payment Gateways & Provider Configurations</h1>
          <p className="gf-page-subtitle">
            Manage Razorpay, Cashfree, and Stripe integrations, webhook endpoints, and dual-control change requests
          </p>
        </div>
      </div>

      {/* Security Architecture Callout */}
      <div className="gf-card p-4 bg-slate-900 border-slate-800 text-xs text-slate-300 flex items-start gap-3">
        <Lock className="lucide w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-100 block mb-1">Zero-Trust Gateway Key Storage</strong>
          Secret API keys, webhook signing secrets, and private merchant tokens are never exposed in browser JavaScript. They reside exclusively in Google Cloud KMS / Secret Manager. All modifications require Step-Up MFA and dual operator authorization.
        </div>
      </div>

      {/* Provider Config Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {paymentConfigs.map((cfg) => (
          <div key={cfg.configId} className="gf-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="lucide w-4 h-4 text-sky-400" />
                <h3 className="font-bold text-slate-100 text-sm">{cfg.provider.replace('_', ' ')}</h3>
              </div>
              <span className={`gf-badge ${cfg.enabled ? 'gf-badge-green' : 'gf-badge-gray'} text-[10px] uppercase font-bold`}>
                {cfg.enabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-mut block text-[10px] uppercase font-bold">Environment / Scope:</span>
                <span className="font-mono text-slate-200">{cfg.environment.toUpperCase()} · {cfg.countryScope}</span>
              </div>
              <div>
                <span className="text-mut block text-[10px] uppercase font-bold">Public Key Identifier:</span>
                <span className="font-mono text-sky-400 font-semibold">{cfg.publicConfigRef}</span>
              </div>
              <div>
                <span className="text-mut block text-[10px] uppercase font-bold">Secret Key Reference:</span>
                <span className="font-mono text-slate-400 text-[11px]">{cfg.secretRefOnly}</span>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-mut text-[10px] uppercase font-bold">Webhook Health:</span>
                <span className="gf-badge gf-badge-green text-[10px] flex items-center gap-1 font-mono">
                  <Activity className="lucide w-3 h-3" />
                  {cfg.webhookStatus.toUpperCase()}
                </span>
              </div>
            </div>

            {/* Pending Change Request Banner if any */}
            {cfg.pendingChangeRequest && (
              <div className="p-2.5 rounded bg-amber-950/60 border border-amber-800 text-amber-300 text-xs">
                <span className="font-bold block">Approval Pending (Second Officer Required)</span>
                <p className="text-[11px] text-amber-200/80 mt-0.5">{cfg.pendingChangeRequest.changeDetails}</p>
              </div>
            )}

            <div className="pt-2">
              <button
                type="button"
                onClick={() => handleOpenChangeRequest(cfg)}
                className="gf-btn gf-btn-secondary w-full text-xs"
              >
                Request Config Modification
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Change Request Modal */}
      {isChangeModalOpen && selectedConfig && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title">Payment Config Change Request</h3>
                <p className="gf-modal-subtitle">Provider: {selectedConfig.provider} ({selectedConfig.configId})</p>
              </div>
              <button onClick={() => setIsChangeModalOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveChangeRequest} className="gf-modal-body space-y-4">
              <div className="gf-callout gf-callout-amber text-xs">
                In compliance with dual-control governance, this change request will be submitted to the second-approver queue and validated against Cloud Secret Manager.
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label font-bold">Proposed Configuration Changes</label>
                <textarea
                  required
                  rows={4}
                  value={changeDetails}
                  onChange={(e) => setChangeDetails(e.target.value)}
                  className="gf-textarea w-full text-xs font-mono"
                />
              </div>

              <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                <button type="button" onClick={() => setIsChangeModalOpen(false)} className="gf-btn gf-btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary font-bold">
                  Authorize & Submit Request
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
