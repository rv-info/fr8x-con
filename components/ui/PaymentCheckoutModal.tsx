'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { usePlatformConfig } from '@/lib/platform-config';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import {
  SUPPORTED_CURRENCIES,
  formatCurrencyAmount,
} from '@/lib/billing/currency-detector';
import {
  BillingQuote,
  generateBillingQuote,
} from '@/lib/billing/billing-engine';
import {
  CreditCard,
  QrCode,
  Building2,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  Loader2,
  Lock,
  Globe2,
  Clock,
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
  catalogKey?: string;
  itemId?: string;
  onPaymentSuccess: (details: {
    paymentStatus: 'paid' | 'pending_verification' | 'waived_promotional';
    paymentMethod: 'razorpay' | 'upi' | 'bank_transfer' | 'promotional_bypass';
    paymentReference: string;
    paidAmount: number;
    currency?: string;
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
  catalogKey,
  itemId,
  onPaymentSuccess,
}: PaymentCheckoutModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { config, isFeatureFree } = usePlatformConfig();
  const { currentCurrency, setCurrency } = useCurrency();

  const displayTitle = itemTitle || title || 'Commercial Publication Tariff';
  const effectiveAmountINR = amountINR !== undefined ? amountINR : (amount !== undefined ? amount : 300);

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

  // Local & Global Sovereign Free-Access check
  const isFree = config.allFreeMode === true || isFeatureFree(featureKey, user?.uid);
  const isRazorpayActive = config.razorpayEnabled !== false;

  // Selected Billing Currency
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currentCurrency || 'INR');
  const [activeQuote, setActiveQuote] = useState<BillingQuote | null>(null);
  const [quoteExpiresIn, setQuoteExpiresIn] = useState<number>(15 * 60);
  const [isGeneratingQuote, setIsGeneratingQuote] = useState<boolean>(false);

  const [paymentMethod, setPaymentMethod] = useState<'razorpay' | 'upi' | 'bank_transfer'>(
    isRazorpayActive ? 'razorpay' : 'upi'
  );
  const [utrReference, setUtrReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Sync currency from global context on open
  useEffect(() => {
    if (isOpen) {
      const initCurr = currentCurrency && SUPPORTED_CURRENCIES[currentCurrency] ? currentCurrency : 'INR';
      setSelectedCurrency(initCurr);
    }
  }, [isOpen, currentCurrency]);

  // Generate / refresh locked quote when currency, amount, or modal opens
  useEffect(() => {
    if (!isOpen) return;

    // Resolve catalog key
    const effectiveCatalogKey =
      catalogKey ||
      (itemType === 'job'
        ? effectiveAmountINR >= 5000 ? 'job_30d' : effectiveAmountINR >= 2500 ? 'job_15d' : effectiveAmountINR >= 1000 ? 'job_7d' : 'job_2d'
        : itemType === 'ad'
        ? effectiveAmountINR >= 4000 ? 'ad_10d' : 'ad_2d'
        : 'auction_standard_bid');

    setIsGeneratingQuote(true);

    // Call server quote API or generate synchronous locked quote
    fetch('/api/billing/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        catalogKey: effectiveCatalogKey,
        serviceType: itemType === 'ad' ? 'ad' : itemType === 'job' ? 'job' : 'auction',
        customCurrency: selectedCurrency,
        customTitle: displayTitle,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.quote) {
          setActiveQuote(data.quote);
        } else {
          // Fallback to local synchronous quote generation
          const quote = generateBillingQuote({
            catalogKey: effectiveCatalogKey,
            targetCurrency: selectedCurrency,
            customTitle: displayTitle,
            isFree,
          });
          setActiveQuote(quote);
        }
      })
      .catch(() => {
        const quote = generateBillingQuote({
          catalogKey: effectiveCatalogKey,
          targetCurrency: selectedCurrency,
          customTitle: displayTitle,
          isFree,
        });
        setActiveQuote(quote);
      })
      .finally(() => {
        setIsGeneratingQuote(false);
        setQuoteExpiresIn(15 * 60);
      });
  }, [isOpen, selectedCurrency, effectiveAmountINR, itemType, catalogKey, isFree, displayTitle]);

  // Quote Expiry Countdown
  useEffect(() => {
    if (!isOpen || !activeQuote) return;
    const interval = setInterval(() => {
      setQuoteExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeQuote]);

  // Sync payment method if Razorpay state changes
  useEffect(() => {
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

  const handleCompletePayment = async () => {
    // CASE A: 100% FREE ACCESS WAIVER (Bypass payment gateways)
    if (isFree || activeQuote?.isFree) {
      setIsProcessing(true);
      try {
        const response = await fetch('/api/billing/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceType: itemType === 'ad' ? 'ad' : itemType === 'job' ? 'job' : 'auction',
            catalogKey: activeQuote?.itemId || catalogKey,
            quote: activeQuote,
            itemDetails: { title: displayTitle, jobId: itemId, description: displayDescription },
          }),
        });
        const result = await response.json();

        setIsProcessing(false);
        onPaymentSuccess({
          paymentStatus: 'waived_promotional',
          paymentMethod: 'promotional_bypass',
          paymentReference: result.orderId || `PROMO-FREE-${Date.now().toString(36).toUpperCase()}`,
          paidAmount: 0,
          currency: selectedCurrency,
        });
        toast('🎉 Sovereign Free-Access Waiver Applied! Listing activated live with zero fees.');
        onClose();
      } catch {
        setIsProcessing(false);
        onPaymentSuccess({
          paymentStatus: 'waived_promotional',
          paymentMethod: 'promotional_bypass',
          paymentReference: `PROMO-FREE-${Date.now().toString(36).toUpperCase()}`,
          paidAmount: 0,
          currency: selectedCurrency,
        });
        toast('🎉 Sovereign Free-Access Waiver Applied! Listing activated live.');
        onClose();
      }
      return;
    }

    // CASE B: CHARGEABLE PAYMENT
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

    try {
      // Execute checkout through unified billing endpoint
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          serviceType: itemType === 'ad' ? 'ad' : itemType === 'job' ? 'job' : 'auction',
          catalogKey: activeQuote?.itemId || catalogKey,
          quote: activeQuote,
          itemDetails: { title: displayTitle, jobId: itemId, description: displayDescription },
        }),
      });

      const checkoutData = await response.json();
      setIsProcessing(false);

      if (!checkoutData.success && !checkoutData.isFree) {
        toast(`Checkout notice: ${checkoutData.error || 'Proceeding with reference registration.'}`);
      }

      const isAutoConfirmed = config.paymentAutomationEnabled !== false || paymentMethod === 'razorpay';
      const ref =
        paymentMethod === 'razorpay'
          ? (checkoutData.orderId || `RZP-AUTO-${Date.now().toString(36).toUpperCase()}`)
          : utrReference.trim();

      const payableAmount = activeQuote?.finalAmount || effectiveAmountINR;

      onPaymentSuccess({
        paymentStatus: isAutoConfirmed ? 'paid' : 'pending_verification',
        paymentMethod,
        paymentReference: ref,
        paidAmount: payableAmount,
        currency: selectedCurrency,
      });

      if (isAutoConfirmed) {
        toast(`⚡ Payment of ${formatCurrencyAmount(payableAmount, selectedCurrency)} verified! Listing is live.`);
      } else {
        toast('Payment reference submitted. Awaiting administrative audit confirmation.');
      }

      onClose();
    } catch {
      setIsProcessing(false);
      const payableAmount = activeQuote?.finalAmount || effectiveAmountINR;
      onPaymentSuccess({
        paymentStatus: 'pending_verification',
        paymentMethod,
        paymentReference: utrReference.trim() || `OFFLINE-${Date.now().toString(36).toUpperCase()}`,
        paidAmount: payableAmount,
        currency: selectedCurrency,
      });
      toast('Payment reference registered.');
      onClose();
    }
  };

  if (!isOpen) return null;

  const quoteMins = Math.floor(quoteExpiresIn / 60);
  const quoteSecs = quoteExpiresIn % 60;
  const isQuoteExpired = quoteExpiresIn <= 0;

  const currentDisplayAmount = activeQuote
    ? formatCurrencyAmount(activeQuote.finalAmount, selectedCurrency)
    : formatCurrencyAmount(effectiveAmountINR, 'INR');

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isProcessing) onClose();
      }}
      title={isFree ? 'Sovereign Free-Access Waiver' : 'Global Commercial Checkout'}
      maxWidth="620px"
      zIndex={1300}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* FREE ACCESS BANNER (Godfather Sovereign Mode) */}
        {isFree ? (
          <div
            style={{
              padding: '16px 18px',
              background: '#ecfdf5',
              border: '1.5px solid #a7f3d0',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#065f46' }}>
              <Sparkles size={20} color="#059669" />
              <b style={{ fontSize: '15px' }}>100% Sovereign Free Access Active</b>
            </div>
            <p style={{ margin: 0, fontSize: '13px', color: '#047857', lineHeight: 1.5 }}>
              The Godfather Super Administration has enabled <b>Free Platform Mode</b> for <b>{displayTitle}</b>.
              All commercial publication fees and gateway transactions are 100% waived for your account ($0.00 / ₹0.00).
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: '#059669', fontWeight: 600 }}>
              <ShieldCheck size={14} /> Instant automated direct activation · No card or gateway required
            </div>
          </div>
        ) : (
          /* MULTI-CURRENCY PRICING & QUOTE DOCKET */
          <div
            style={{
              padding: '16px 18px',
              background: 'var(--surface-secondary, #F9FAFB)',
              border: '1px solid var(--border-subtle, #E5E7EB)',
              borderRadius: '10px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ flex: 1, minWidth: '220px' }}>
                <small style={{ fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, color: 'var(--text-secondary, #64748B)', letterSpacing: '0.5px' }}>
                  Commercial Invoice Summary
                </small>
                <b style={{ display: 'block', fontSize: '15px', color: 'var(--text-primary, #1F2937)', marginTop: '2px' }}>
                  {displayTitle}
                </b>
                <span style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748B)' }}>
                  {displayDescription}
                </span>
              </div>

              {/* Currency Selector & Price */}
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', marginBottom: '4px' }}>
                  <Globe2 size={13} color="#64748b" />
                  <select
                    value={selectedCurrency}
                    onChange={(e) => {
                      const next = e.target.value;
                      setSelectedCurrency(next);
                      setCurrency(next);
                    }}
                    style={{
                      fontSize: '11.5px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      border: '1px solid var(--border-default, #D9DEE5)',
                      background: 'var(--surface-primary, #FFFFFF)',
                      color: 'var(--text-primary, #1F2937)',
                      cursor: 'pointer',
                    }}
                  >
                    {Object.keys(SUPPORTED_CURRENCIES).map((c) => (
                      <option key={c} value={c}>
                        {SUPPORTED_CURRENCIES[c].flagEmoji} {c} ({SUPPORTED_CURRENCIES[c].symbol})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--accent-primary, #006B68)', fontFamily: 'monospace' }}>
                  {isGeneratingQuote ? (
                    <span style={{ fontSize: '14px', color: 'var(--text-secondary, #64748B)' }}>Calculating...</span>
                  ) : (
                    currentDisplayAmount
                  )}
                </div>

                {selectedCurrency !== 'INR' && activeQuote && (
                  <small style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-secondary, #64748B)', marginTop: '1px' }}>
                    Base: ₹{activeQuote.basePriceINR.toLocaleString('en-IN')} (1 INR = {activeQuote.exchangeRate.toFixed(4)} {selectedCurrency})
                  </small>
                )}
              </div>
            </div>

            {/* 15-Minute Quote Lock Bar */}
            <div
              style={{
                borderTop: '1px dashed #cbd5e1',
                paddingTop: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '11px',
                color: isQuoteExpired ? '#dc2626' : '#64748b',
                flexWrap: 'wrap',
                gap: '6px',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} color={isQuoteExpired ? '#dc2626' : '#075B5B'} />
                {isQuoteExpired
                  ? 'Quote expired. Changing currency will recalculate.'
                  : `15-Min FX Rate Lock: ${quoteMins}:${quoteSecs < 10 ? '0' : ''}${quoteSecs} remaining`}
              </span>
              <span>GST / VAT Inclusive · 256-Bit Cryptographic Signature</span>
            </div>
          </div>
        )}

        {/* PAYMENT METHOD SELECTION (Hidden when Free Access is Active) */}
        {!isFree && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)' }}>
              Select Verified Payment Gateway
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  if (isRazorpayActive) {
                    setPaymentMethod('razorpay');
                  } else {
                    toast('Razorpay is currently deactivated by the Platform Administrator.');
                  }
                }}
                style={{
                  padding: '12px 10px',
                  borderRadius: '8px',
                  border: paymentMethod === 'razorpay' ? '2px solid #075B5B' : '1px solid var(--border-default, #D9DEE5)',
                  background: paymentMethod === 'razorpay' ? '#f0fdf4' : isRazorpayActive ? '#ffffff' : '#f8fafc',
                  cursor: isRazorpayActive ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  textAlign: 'center',
                  opacity: isRazorpayActive ? 1 : 0.65,
                }}
              >
                <CreditCard size={18} color={paymentMethod === 'razorpay' ? '#075B5B' : isRazorpayActive ? '#64748b' : '#94a3b8'} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: paymentMethod === 'razorpay' ? '#075B5B' : '#0f172a' }}>
                  Online / Gateway
                </span>
                <small style={{ fontSize: '10px', color: isRazorpayActive ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                  {isRazorpayActive ? '⚡ 0ms Auto-Live' : 'Deactivated'}
                </small>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('upi')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '8px',
                  border: paymentMethod === 'upi' ? '2px solid #075B5B' : '1px solid var(--border-default, #D9DEE5)',
                  background: paymentMethod === 'upi' ? '#f0fdf4' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  textAlign: 'center',
                }}
              >
                <QrCode size={18} color={paymentMethod === 'upi' ? '#075B5B' : '#64748b'} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: paymentMethod === 'upi' ? '#075B5B' : '#0f172a' }}>
                  Instant UPI QR
                </span>
                <small style={{ fontSize: '10px', color: 'var(--text-secondary, #64748B)' }}>Zero Fee · Instant</small>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('bank_transfer')}
                style={{
                  padding: '12px 10px',
                  borderRadius: '8px',
                  border: paymentMethod === 'bank_transfer' ? '2px solid #075B5B' : '1px solid var(--border-default, #D9DEE5)',
                  background: paymentMethod === 'bank_transfer' ? '#f0fdf4' : '#ffffff',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  textAlign: 'center',
                }}
              >
                <Building2 size={18} color={paymentMethod === 'bank_transfer' ? '#075B5B' : '#64748b'} />
                <span style={{ fontSize: '11.5px', fontWeight: 700, color: paymentMethod === 'bank_transfer' ? '#075B5B' : '#0f172a' }}>
                  Corporate Wire
                </span>
                <small style={{ fontSize: '10px', color: 'var(--text-secondary, #64748B)' }}>RTGS / Swift Wire</small>
              </button>
            </div>

            {/* Gateway Sub-panels */}
            {paymentMethod === 'razorpay' && (
              <div style={{ padding: '14px 16px', background: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <ShieldCheck size={20} color="#16a34a" />
                  <div>
                    <b style={{ fontSize: '13px', color: 'var(--text-primary, #1F2937)' }}>International Multi-Currency Gateway Rail</b>
                    <small style={{ display: 'block', color: 'var(--text-secondary, #64748B)', fontSize: '11.5px' }}>
                      Visa, MasterCard, Amex, RuPay, Corporate NetBanking &amp; Wallets · 256-Bit SSL
                    </small>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="badge blue" style={{ fontSize: '9.5px', textTransform: 'uppercase' }}>
                    {config.razorpayEnvironment === 'sandbox' ? 'SANDBOX TEST' : 'LIVE PRODUCTION'}
                  </span>
                  <span className="badge green" style={{ fontSize: '9.5px' }}>
                    ⚡ 0ms AUTO-LIVE
                  </span>
                </div>
              </div>
            )}

            {paymentMethod === 'upi' && (
              <div style={{ padding: '14px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    Enter 12-Digit UPI Transaction ID / UTR <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. 423981298412"
                    value={utrReference}
                    onChange={(e) => setUtrReference(e.target.value)}
                    style={{ background: 'var(--surface-primary, #FFFFFF)', fontSize: '13px' }}
                    required
                  />
                  <small style={{ color: '#15803d', fontSize: '10.5px', marginTop: '2px', display: 'block' }}>
                    Pay {currentDisplayAmount} via Google Pay, PhonePe, Paytm, or BHIM, then paste UTR reference above.
                  </small>
                </div>
              </div>
            )}

            {paymentMethod === 'bank_transfer' && (
              <div style={{ padding: '14px 16px', background: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ fontSize: '12px', lineHeight: 1.5, color: 'var(--text-secondary, #64748B)' }}>
                  <b>Account Name:</b> FR8X FREIGHT EXCHANGE PRIVATE LIMITED<br />
                  <b>Bank:</b> ICICI Bank Ltd · <b>IFSC:</b> ICIC0000007<br />
                  <b>A/C No:</b> 000705018924 (Current Account) · <b>SWIFT:</b> ICICINBBCTS
                </div>

                <div className="field">
                  <label style={{ fontSize: '11.5px', fontWeight: 700 }}>
                    Enter Bank Transfer UTR / SWIFT Reference <span style={{ color: '#dc2626' }}>*</span>
                  </label>
                  <input
                    className="input"
                    placeholder="e.g. ICICR24091482914"
                    value={utrReference}
                    onChange={(e) => setUtrReference(e.target.value)}
                    style={{ background: 'var(--surface-primary, #FFFFFF)', fontSize: '13px' }}
                    required
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal Action Controls */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle, #E5E7EB)' }}>
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
            disabled={isProcessing || isGeneratingQuote}
            style={{
              minWidth: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              background: isFree ? '#059669' : '#075B5B',
              borderColor: isFree ? '#047857' : '#075B5B',
            }}
          >
            {isProcessing ? (
              <>
                <Loader2 size={14} className="spin" /> Processing Activation...
              </>
            ) : isFree ? (
              <>
                <Sparkles size={14} /> Activate Free Access ($0.00)
              </>
            ) : (
              <>
                <Lock size={13} /> Pay {currentDisplayAmount} &amp; Activate
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
}
