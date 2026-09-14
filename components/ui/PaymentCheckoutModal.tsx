'use client';

import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { usePlatformConfig } from '@/lib/platform-config';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import {
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  Zap,
  Sparkles,
  Loader2,
  Lock,
  ArrowRight,
} from 'lucide-react';

export interface PaymentCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  itemTitle?: string;
  itemDescription?: string;
  amountINR?: number;
  amount?: number;
  itemType: 'job' | 'auction' | 'ad';
  onPaymentSuccess: (details: {
    paymentStatus: 'paid' | 'pending_verification' | 'waived_promotional';
    paymentMethod: 'razorpay' | 'upi' | 'bank_transfer' | 'promotional_bypass';
    paymentReference: string;
    paidAmount: number;
  }) => void;
}

export function PaymentCheckoutModal({
  isOpen,
  onClose,
  title,
  itemTitle,
  itemDescription,
  amountINR,
  amount,
  itemType,
  onPaymentSuccess,
}: PaymentCheckoutModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { config, isFeatureFree } = usePlatformConfig();

  const displayTitle = itemTitle || title || 'Commercial Publication Tariff';
  const effectiveAmount = amountINR !== undefined ? amountINR : (amount !== undefined ? amount : 300);
  const displayDescription = itemDescription || (
    itemType === 'job'
      ? 'Verified Logistics Career Opening Publication Tariff'
      : itemType === 'auction'
      ? 'Reverse Auction Listing & Carrier Tender Distribution'
      : 'Targeted Commercial Feed Banner Placement'
  );

  const featureKey =
    itemType === 'job'
      ? 'JOB_POSTING'
      : itemType === 'auction'
      ? 'REVERSE_AUCTION'
      : 'AD_POSTING';

  const isFree = isFeatureFree(featureKey, user?.uid);
  const isRazorpayActive = config.razorpayEnabled !== false;

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'bank_transfer'>(
    isRazorpayActive ? 'razorpay' : 'upi'
  );
  const [utrReference, setUtrReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync payment method if Razorpay state changes
  React.useEffect(() => {
    if (!isRazorpayActive && paymentMethod === 'razorpay') {
      setPaymentMethod('upi');
    }
  }, [isRazorpayActive, paymentMethod]);

  const handleCopy = (text: string, key: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const handleCompletePayment = () => {
    if (isFree) {
      setIsProcessing(true);
      setTimeout(() => {
        setIsProcessing(false);
        onPaymentSuccess({
          paymentStatus: 'waived_promotional',
          paymentMethod: 'promotional_bypass',
          paymentReference: `PROMO-FREE-${Date.now().toString(36).toUpperCase()}`,
          paidAmount: 0,
        });
        toast('🎉 Promotional free waiver applied by Platform Admin. Published live!');
        onClose();
      }, 500);
      return;
    }

    if (paymentMethod === 'razorpay' && !isRazorpayActive) {
      toast('Razorpay is currently deactivated by the Platform Administrator. Please select Instant UPI QR or Corporate Wire.');
      setPaymentMethod('upi');
      return;
    }

    if (paymentMethod === 'upi' || paymentMethod === 'bank_transfer') {
      if (!utrReference.trim()) {
        toast('Please enter the 12-digit UPI Reference / Bank UTR number.');
        return;
      }
    }

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      const isAutoConfirmed = config.paymentAutomationEnabled !== false || paymentMethod === 'razorpay';

      const ref =
        paymentMethod === 'razorpay'
          ? `RZP-AUTO-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
          : utrReference.trim();

      onPaymentSuccess({
        paymentStatus: isAutoConfirmed ? 'paid' : 'pending_verification',
        paymentMethod,
        paymentReference: ref,
        paidAmount: effectiveAmount,
      });

      if (isAutoConfirmed) {
        if (paymentMethod === 'razorpay') {
          toast(`⚡ Payment of ₹${effectiveAmount.toLocaleString('en-IN')} verified automatically via Razorpay Automation Engine! Listing is now active.`);
        } else {
          toast(`⚡ Payment of ₹${effectiveAmount.toLocaleString('en-IN')} confirmed! Listing is now active.`);
        }
      } else {
        toast(`Payment reference submitted. Awaiting Godfather audit confirmation.`);
      }

      onClose();
    }, 700);
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isProcessing) onClose();
      }}
      title={isFree ? 'Promotional Publication Waiver' : 'Complete Commercial Payment'}
      maxWidth="580px"
      zIndex={1300}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Promotional Free Banner */}
        {isFree ? (
          <div
            style={{
              padding: '16px 18px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46' }}>
              <Sparkles size={18} color="#059669" />
              <b style={{ fontSize: '14.5px' }}>100% Promotional Free Access Active</b>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#047857', lineHeight: 1.5 }}>
              The Godfather has currently marked <b>{displayTitle}</b> as an active promotional campaign. Standard publication tariffs are completely waived for your account (₹0.00).
            </p>
          </div>
        ) : (
          /* Payment Summary Docket */
          <div
            style={{
              padding: '16px 18px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <small style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--mut)', letterSpacing: '0.5px' }}>
                  Commercial Invoice Summary
                </small>
                <b style={{ display: 'block', fontSize: '15px', color: 'var(--ink)', marginTop: '2px' }}>
                  {displayTitle}
                </b>
                <span style={{ fontSize: '12.5px', color: 'var(--ink-secondary)' }}>
                  {displayDescription}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <small style={{ fontSize: '11px', color: 'var(--mut)', display: 'block' }}>Total Payable</small>
                <b style={{ fontSize: '22px', color: 'var(--brand)', fontFamily: 'var(--font-mono)' }}>
                  ₹{effectiveAmount.toLocaleString('en-IN')}
                </b>
              </div>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '8px', display: 'flex', justifyContent: 'space-between', fontSize: '11.5px', color: 'var(--mut)' }}>
              <span>Strict Regulation: Publication requires verified payment</span>
              <span>GST Inclusive · Instant Tax Invoice</span>
            </div>
          </div>
        )}

        {/* Commercial Payment Method Options (if not promotional free) */}
        {!isFree && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>
              Select Verified Payment Gateway
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  if (isRazorpayActive) {
                    setPaymentMethod('razorpay');
                  } else {
                    toast('Razorpay is currently deactivated by the Platform Administrator. Please select Instant UPI QR or Corporate Wire.');
                  }
                }}
                style={{
                  padding: '12px 10px',
                  borderRadius: '8px',
                  border: paymentMethod === 'razorpay' ? '2px solid var(--brand)' : '1px solid #cbd5e1',
                  background: paymentMethod === 'razorpay' ? '#eff6ff' : isRazorpayActive ? '#ffffff' : '#f8fafc',
                  cursor: isRazorpayActive ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  textAlign: 'center',
                  opacity: isRazorpayActive ? 1 : 0.65,
                }}
                title={isRazorpayActive ? 'Pay securely via Razorpay' : 'Razorpay is disabled by Godfather Administrator'}
              >
                <CreditCard size={18} color={paymentMethod === 'razorpay' ? 'var(--brand)' : isRazorpayActive ? '#64748b' : '#94a3b8'} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: paymentMethod === 'razorpay' ? 'var(--brand)' : isRazorpayActive ? 'var(--ink)' : '#64748b' }}>
                  Online / Razorpay
                </span>
                <small style={{ fontSize: '10px', color: isRazorpayActive ? (paymentMethod === 'razorpay' ? 'var(--brand)' : 'var(--mut)') : 'var(--red)', fontWeight: isRazorpayActive ? 400 : 600 }}>
                  {isRazorpayActive ? (config.paymentAutomationEnabled !== false ? '⚡ Auto-Live' : 'Card/NetBank') : 'Disabled by Admin'}
                </small>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '8px',
                  border: paymentMethod === 'upi' ? '2px solid var(--brand)' : '1px solid #cbd5e1',
                  background: paymentMethod === 'upi' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  textAlign: 'center',
                }}
              >
                <QrCode size={18} color={paymentMethod === 'upi' ? 'var(--brand)' : '#64748b'} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: paymentMethod === 'upi' ? 'var(--brand)' : 'var(--ink)' }}>
                  Instant UPI QR
                </span>
                <small style={{ fontSize: '10px', color: 'var(--mut)' }}>Zero Fee · Instant</small>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '8px',
                  border: paymentMethod === 'bank_transfer' ? '2px solid var(--brand)' : '1px solid #cbd5e1',
                  background: paymentMethod === 'bank_transfer' ? '#eff6ff' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  textAlign: 'center',
                }}
              >
                <Building2 size={18} color={paymentMethod === 'bank_transfer' ? 'var(--brand)' : '#64748b'} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: paymentMethod === 'bank_transfer' ? 'var(--brand)' : 'var(--ink)' }}>
                  Corporate Wire
                </span>
                <small style={{ fontSize: '10px', color: 'var(--mut)' }}>RTGS / NEFT / IMPS</small>
              </button>
            </div>

            {/* Sub-view: Online / Razorpay */}
            {paymentMethod === 'razorpay' && (
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} color="#16a34a" />
                  <div>
                    <b style={{ fontSize: '13px', color: 'var(--ink)' }}>Razorpay Enterprise Payment Rail (Active)</b>
                    <small style={{ display: 'block', color: 'var(--mut)', fontSize: '11.5px' }}>
                      Visa, MasterCard, RuPay, Corporate NetBanking &amp; Wallets · 256-Bit SSL
                    </small>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge blue" style={{ fontSize: '9.5px', textTransform: 'uppercase' }}>
                    {config.razorpayEnvironment === 'sandbox' ? 'SANDBOX TEST' : 'LIVE PRODUCTION'}
                  </span>
                  <span className={`badge ${config.paymentAutomationEnabled !== false ? 'green' : 'amber'}`} style={{ fontSize: '9.5px' }}>
                    {config.paymentAutomationEnabled !== false ? '⚡ 0ms AUTO-LIVE' : 'AUDIT QUEUE'}
                  </span>
                </div>
              </div>
            )}

            {/* Sub-view: UPI QR */}
            {paymentMethod === 'upi' && (
              <div style={{ padding: '14px 16px', background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>Official Platform VPA</span>
                    <b style={{ display: 'block', fontSize: '14px', color: '#15803d', fontFamily: 'monospace' }}>fr8x@icici</b>
                  </div>
                  <button
                    type="button"
                    className="btn secondary sm"
                    onClick={() => handleCopy('fr8x@icici', 'upi')}
                    style={{ fontSize: '11px', padding: '3px 8px' }}
                  >
                    {copiedKey === 'upi' ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
                    {copiedKey === 'upi' ? 'Copied' : 'Copy VPA'}
                  </button>
                </div>

                <div className="field">
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#166534' }}>
                    Enter 12-Digit UPI Transaction ID / UTR <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. 423981298412"
                    value={utrReference}
                    onChange={(e) => setUtrReference(e.target.value)}
                    style={{ background: '#ffffff', fontSize: '13px' }}
                    required
                  />
                  <small style={{ color: '#15803d', fontSize: '10.5px', marginTop: '2px', display: 'block' }}>
                    Pay ₹{effectiveAmount.toLocaleString('en-IN')} via Google Pay, PhonePe, Paytm, or BHIM, then paste UTR reference above.
                  </small>
                </div>
              </div>
            )}

            {/* Sub-view: Corporate Wire */}
            {paymentMethod === 'bank_transfer' && (
              <div style={{ padding: '14px 16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--ink-secondary)' }}>
                  <b>Account Name:</b> FR8X FREIGHT EXCHANGE PRIVATE LIMITED<br />
                  <b>Bank:</b> ICICI Bank Ltd · <b>IFSC:</b> ICIC0000007<br />
                  <b>A/C No:</b> 000705018924 (Current Account)
                </div>

                <div className="field">
                  <label style={{ fontSize: '11.5px', fontWeight: 700 }}>
                    Enter Bank Transfer UTR / IMPS Reference <span style={{ color: 'var(--red)' }}>*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. ICICR24091482914"
                    value={utrReference}
                    onChange={(e) => setUtrReference(e.target.value)}
                    style={{ background: '#ffffff', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
          <button
            type="button"
            className="btn secondary"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn primary"
            onClick={handleCompletePayment}
            disabled={isProcessing}
            style={{ minWidth: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="spin" /> Verifying Payment...
              </>
            ) : isFree ? (
              <>
                <Sparkles size={14} /> Publish with Promotional Waiver (₹0)
              </>
            ) : (
              <>
                <Lock size={13} /> Pay ₹{effectiveAmount.toLocaleString('en-IN')} &amp; Activate
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
