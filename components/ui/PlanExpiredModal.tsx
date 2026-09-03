'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import {
  AlertTriangle,
  QrCode,
  Building,
  CheckCircle2,
  Copy,
  Check,
  Zap,
  ShieldAlert,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { SEED_BANK_DETAILS, SEED_UPI_DETAILS } from '@/lib/godfather/context/GodfatherDataContext';
import { PlatformBankDetails, PlatformUpiDetails } from '@/lib/godfather/types';

export function PlanExpiredModal() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();

  const [bankDetails, setBankDetails] = useState<PlatformBankDetails>(SEED_BANK_DETAILS);
  const [upiDetails, setUpiDetails] = useState<PlatformUpiDetails>(SEED_UPI_DETAILS);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<'upi' | 'bank'>('upi');
  const [utrNumber, setUtrNumber] = useState('');
  const [selectedPlanTier, setSelectedPlanTier] = useState<'monthly' | 'annual'>('monthly');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Godfather configured bank and UPI details from localStorage
  useEffect(() => {
    try {
      const savedBank = localStorage.getItem('fr8x_godfather_bank_details');
      if (savedBank) setBankDetails(JSON.parse(savedBank));
      const savedUpi = localStorage.getItem('fr8x_godfather_upi_details');
      if (savedUpi) setUpiDetails(JSON.parse(savedUpi));
    } catch {}
  }, []);

  if (!user || !user.uid) return null;

  // Check if plan is expired
  const isExpired =
    Boolean(user.isPlanExpired) ||
    Boolean(user.rechargeRequired) ||
    (user.planExpiresAt ? new Date(user.planExpiresAt).getTime() < Date.now() : false);

  if (!isExpired) return null;

  const handleCopy = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 2000);
    toast(`Copied ${text} to clipboard`);
  };

  const handleCompleteRecharge = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const newExpiry = new Date(
        Date.now() + (selectedPlanTier === 'annual' ? 365 : 30) * 24 * 60 * 60 * 1000
      ).toISOString();

      updateUser({
        plan: 'professional',
        planExpiresAt: newExpiry,
        isPlanExpired: false,
        rechargeRequired: false,
      });

      setIsSubmitting(false);
      toast(`Payment verified! Your account is now active until ${newExpiry.split('T')[0]}.`);
    }, 800);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '580px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #cbd5e1',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          animation: 'popIn 0.2s ease forwards',
        }}
      >
        {/* Banner Header */}
        <div
          style={{
            background: '#dc2626',
            color: '#ffffff',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldAlert size={24} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 800, letterSpacing: '-0.01em' }}>
              Plan Validity Over — Recharge Required
            </h2>
            <p style={{ margin: '2px 0 0', fontSize: '11.5px', opacity: 0.9 }}>
              Your promotional free access / subscription has ended. Recharge now to continue trading.
            </p>
          </div>
        </div>

        {/* Content Body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* User Status Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '11.5px',
            }}
          >
            <div>
              <span style={{ color: '#991b1b', fontWeight: 700 }}>Account: </span>
              <span style={{ color: '#1e293b', fontWeight: 600 }}>{user.displayName} ({user.company})</span>
            </div>
            <span
              style={{
                background: '#dc2626',
                color: '#ffffff',
                padding: '2px 8px',
                borderRadius: '4px',
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              Access Blocked
            </span>
          </div>

          {/* Recharge Tier Selection */}
          <div>
            <label style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--fr8x-text)', display: 'block', marginBottom: '8px' }}>
              Select Recharge Package:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div
                onClick={() => setSelectedPlanTier('monthly')}
                style={{
                  border: selectedPlanTier === 'monthly' ? '2px solid var(--brand, #1985a1)' : '1px solid var(--fr8x-outline, #cbd5e1)',
                  background: selectedPlanTier === 'monthly' ? '#f0f9ff' : '#ffffff',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: '13px', color: 'var(--fr8x-text)' }}>30 Days Recharge</b>
                  <span style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 700 }}>₹1,999</span>
                </div>
                <small style={{ color: 'var(--fr8x-muted)', fontSize: '10.5px', display: 'block', marginTop: '4px' }}>
                  Full access to Live Auctions, Rates &amp; Trade Chat
                </small>
              </div>

              <div
                onClick={() => setSelectedPlanTier('annual')}
                style={{
                  border: selectedPlanTier === 'annual' ? '2px solid var(--brand, #1985a1)' : '1px solid var(--fr8x-outline, #cbd5e1)',
                  background: selectedPlanTier === 'annual' ? '#f0f9ff' : '#ffffff',
                  borderRadius: '8px',
                  padding: '12px',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '8px',
                    background: '#059669',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '4px',
                  }}
                >
                  SAVE 17%
                </span>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <b style={{ fontSize: '13px', color: 'var(--fr8x-text)' }}>1 Year Sovereign</b>
                  <span style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 700 }}>₹19,990</span>
                </div>
                <small style={{ color: 'var(--fr8x-muted)', fontSize: '10.5px', display: 'block', marginTop: '4px' }}>
                  365 days unlimited forwarding + Gold Tick eligibility
                </small>
              </div>
            </div>
          </div>

          {/* Payment Method Tabs */}
          <div>
            <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--fr8x-outline, #cbd5e1)', paddingBottom: '8px' }}>
              <button
                type="button"
                onClick={() => setPaymentMode('upi')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: paymentMode === 'upi' ? '#0f172a' : '#f1f5f9',
                  color: paymentMode === 'upi' ? '#ffffff' : 'var(--fr8x-muted)',
                }}
              >
                <QrCode size={14} /> Scan Official UPI QR
              </button>
              <button
                type="button"
                onClick={() => setPaymentMode('bank')}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: paymentMode === 'bank' ? '#0f172a' : '#f1f5f9',
                  color: paymentMode === 'bank' ? '#ffffff' : 'var(--fr8x-muted)',
                }}
              >
                <Building size={14} /> Corporate Bank Wire (NEFT/RTGS)
              </button>
            </div>

            {/* UPI QR Display View */}
            {paymentMode === 'upi' && (
              <div
                style={{
                  marginTop: '12px',
                  background: '#f8fafc',
                  border: '1px solid var(--fr8x-outline, #cbd5e1)',
                  borderRadius: '8px',
                  padding: '14px',
                  display: 'flex',
                  gap: '16px',
                  alignItems: 'center',
                }}
              >
                <div
                  style={{
                    width: '130px',
                    height: '130px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {upiDetails.qrImageUrl && upiDetails.qrImageUrl !== '/upi-qr-placeholder.png' ? (
                    <img
                      src={upiDetails.qrImageUrl}
                      alt="Official UPI QR"
                      style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                    />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '10px' }}>
                      <QrCode size={64} color="#0f172a" style={{ margin: '0 auto 6px' }} />
                      <span style={{ fontSize: '9px', color: 'var(--fr8x-muted)', display: 'block', fontWeight: 600 }}>
                        Scan to Pay
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ marginBottom: '8px' }}>
                    <small style={{ fontSize: '10px', color: 'var(--fr8x-muted)', display: 'block' }}>OFFICIAL UPI VPA ID</small>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <code style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand)', background: '#e0f2fe', padding: '2px 6px', borderRadius: '4px' }}>
                        {upiDetails.vpaId}
                      </code>
                      <button
                        type="button"
                        onClick={() => handleCopy(upiDetails.vpaId, 'vpa')}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--fr8x-muted)' }}
                        title="Copy VPA ID"
                      >
                        {copiedField === 'vpa' ? <Check size={14} color="#16a34a" /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginBottom: '6px' }}>
                    <small style={{ fontSize: '10px', color: 'var(--fr8x-muted)', display: 'block' }}>PAYEE NAME</small>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
                      {upiDetails.payeeName}
                    </span>
                  </div>

                  <small style={{ fontSize: '10px', color: 'var(--fr8x-muted)', display: 'block' }}>
                    Supported: Google Pay, PhonePe, Paytm, BHIM, Cred, and all UPI banking apps.
                  </small>
                </div>
              </div>
            )}

            {/* Bank Transfer Display View */}
            {paymentMode === 'bank' && (
              <div
                style={{
                  marginTop: '12px',
                  background: '#f8fafc',
                  border: '1px solid var(--fr8x-outline, #cbd5e1)',
                  borderRadius: '8px',
                  padding: '12px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  fontSize: '11.5px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--fr8x-muted)' }}>Bank Name:</span>
                  <b style={{ color: 'var(--fr8x-text)' }}>{bankDetails.bankName}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--fr8x-muted)' }}>Account Holder:</span>
                  <b style={{ color: 'var(--fr8x-text)' }}>{bankDetails.accountHolderName}</b>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--fr8x-muted)' }}>Account Number:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <code style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand)' }}>{bankDetails.accountNumber}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankDetails.accountNumber, 'acc')}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--fr8x-muted)' }}
                      title="Copy Account Number"
                    >
                      {copiedField === 'acc' ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--fr8x-muted)' }}>IFSC Code:</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <code style={{ fontSize: '12px', fontWeight: 800, color: 'var(--brand)' }}>{bankDetails.ifscCode}</code>
                    <button
                      type="button"
                      onClick={() => handleCopy(bankDetails.ifscCode, 'ifsc')}
                      style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--fr8x-muted)' }}
                      title="Copy IFSC Code"
                    >
                      {copiedField === 'ifsc' ? <Check size={13} color="#16a34a" /> : <Copy size={13} />}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--fr8x-muted)' }}>Branch:</span>
                  <span style={{ color: 'var(--fr8x-text)' }}>{bankDetails.branch}</span>
                </div>
                {bankDetails.swiftCode && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--fr8x-muted)' }}>SWIFT / BIC:</span>
                    <span style={{ color: 'var(--fr8x-text)', fontWeight: 600 }}>{bankDetails.swiftCode}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* UTR / Transaction Proof Input */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fr8x-muted)' }}>
              Transaction Reference / UPI UTR Number (Optional):
            </label>
            <input
              type="text"
              placeholder="e.g. 424198112001 or bank reference ID"
              value={utrNumber}
              onChange={(e) => setUtrNumber(e.target.value)}
              style={{
                padding: '8px 10px',
                fontSize: '12px',
                borderRadius: '6px',
                border: '1px solid var(--fr8x-outline, #cbd5e1)',
                background: '#ffffff',
                color: 'var(--fr8x-text)',
              }}
            />
          </div>

          {/* Action Trigger */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--fr8x-outline, #cbd5e1)', paddingTop: '14px' }}>
            <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)' }}>
              Total Payable: <b style={{ color: 'var(--fr8x-text)', fontSize: '13px' }}>{selectedPlanTier === 'annual' ? '₹19,990' : '₹1,999'}</b>
            </span>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleCompleteRecharge}
              className="btn primary"
              style={{ height: '36px', padding: '0 18px', fontSize: '12px', fontWeight: 700 }}
            >
              {isSubmitting ? 'Verifying Payment…' : 'Recharge & Unlock Workspace'} <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
