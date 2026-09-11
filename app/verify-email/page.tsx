'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  Mail,
  RefreshCw,
  Clock,
  Building2,
  Lock,
  Headphones,
} from 'lucide-react';

interface VerifiedUserData {
  uid: string;
  email: string;
  displayName: string;
  company: string;
  companyId: string;
  role: string;
  status: string;
  email_verified: boolean;
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [verifiedUser, setVerifiedUser] = useState<VerifiedUserData | null>(null);
  const [isAlreadyVerified, setIsAlreadyVerified] = useState(false);

  // Resend Verification Email state
  const [resendEmail, setResendEmail] = useState(emailParam);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorCode('TOKEN_MISSING');
      setMessage('No verification security token was provided. Please use the direct link sent to your corporate email.');
      return;
    }

    async function verify() {
      try {
        const res = await fetch(
          `/api/auth/verify-email?token=${encodeURIComponent(token!)}${emailParam ? `&email=${encodeURIComponent(emailParam)}` : ''}`
        );
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus('success');
          setIsAlreadyVerified(Boolean(data.alreadyVerified));
          setMessage(
            data.alreadyVerified
              ? 'Your corporate email address is verified and your workspace is fully active.'
              : data.message || 'Your corporate credentials have been successfully authenticated.'
          );
          if (data.user) {
            setVerifiedUser(data.user);
          }
        } else {
          // If token was already used but user is active
          if (data.code === 'TOKEN_ALREADY_USED' && data.user?.email_verified) {
            setStatus('success');
            setIsAlreadyVerified(true);
            setMessage('Your corporate account is already verified and active.');
            setVerifiedUser(data.user);
          } else {
            setStatus('error');
            setErrorCode(data.code || 'VERIFICATION_FAILED');
            setMessage(data.error || 'This verification link is invalid or has expired (links remain active for 15 minutes).');
            if (data.user) {
              setVerifiedUser(data.user);
            }
          }
        }
      } catch {
        setStatus('error');
        setErrorCode('NETWORK_ERROR');
        setMessage('Network error while validating your verification link. Please check your internet connection.');
      }
    }

    verify();
  }, [token, emailParam]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendMessage(null);
    setResendError(null);

    const targetEmail = resendEmail.trim().toLowerCase();
    if (!targetEmail || !targetEmail.includes('@')) {
      setResendError('Please enter a valid corporate email address.');
      return;
    }

    setIsResending(true);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });
      const data = await res.json();
      setIsResending(false);

      if (res.ok && data.success) {
        setResendMessage(data.message || `A new verification link valid for 15 minutes has been sent to ${targetEmail}.`);
        setResendCooldown(60);
      } else {
        setResendError(data.error || 'Failed to resend verification link. Please try again or contact support.');
        if (data.retryAfterSeconds) {
          setResendCooldown(data.retryAfterSeconds);
        }
      }
    } catch {
      setIsResending(false);
      setResendError('Network error while requesting a new verification email.');
    }
  };

  const handleProceedToWorkspace = () => {
    // Navigate directly into feeds workspace with full session activation
    window.location.href = '/feeds';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '560px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 40px -15px rgba(15, 23, 42, 0.08), 0 0 1px 1px rgba(15, 23, 42, 0.02)',
          padding: '44px 36px',
          textAlign: 'center',
        }}
      >
        {/* Brand Header */}
        <div style={{ marginBottom: '28px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              marginBottom: '12px',
            }}
          >
            <div
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#0f172a',
                letterSpacing: '-0.03em',
                lineHeight: 1,
              }}
            >
              fr<span style={{ color: '#0284c7' }}>8</span>x
            </div>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
                color: '#64748b',
                marginTop: '5px',
              }}
            >
              Enterprise Logistics Platform
            </div>
          </Link>
        </div>

        {/* LOADING STATE */}
        {status === 'loading' && (
          <div style={{ padding: '36px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#f0f9ff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 20px',
              }}
            >
              <Loader2 className="animate-spin" size={34} color="#0284c7" />
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Authenticating Security Token...
            </h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
              Validating single-use cryptographic credentials and provisioning your enterprise freight workspace.
            </p>
          </div>
        )}

        {/* SUCCESS / MATURE EXECUTIVE WELCOME STATE */}
        {status === 'success' && (
          <div style={{ textAlign: 'left' }}>
            {/* Status Pill */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 14px',
                  borderRadius: '20px',
                  backgroundColor: '#ecfdf5',
                  color: '#059669',
                  fontSize: '12px',
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase',
                  border: '1px solid #a7f3d0',
                }}
              >
                <ShieldCheck size={16} /> Certified Enterprise Partner
              </span>
            </div>

            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <h1
                style={{
                  fontSize: '23px',
                  fontWeight: 800,
                  color: '#0f172a',
                  letterSpacing: '-0.02em',
                  margin: '0 0 10px 0',
                  lineHeight: 1.3,
                }}
              >
                {isAlreadyVerified
                  ? 'Welcome Back to FR8X Enterprise'
                  : 'Email Verified · Welcome to FR8X'}
              </h1>
              <p style={{ fontSize: '14.5px', color: '#475569', lineHeight: 1.6, margin: 0 }}>
                {verifiedUser ? (
                  <>
                    Your corporate credentials for <strong>{verifiedUser.displayName}</strong> at{' '}
                    <strong>{verifiedUser.company}</strong> are authenticated. Your organization workspace is
                    active and provisioned for live freight operations.
                  </>
                ) : (
                  message
                )}
              </p>
            </div>

            {/* Enterprise Verified Credentials Dossier */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px 22px',
                marginBottom: '26px',
              }}
            >
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#64748b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Building2 size={14} color="#0284c7" /> Enterprise Organization Dossier
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 16px', fontSize: '13px' }}>
                <div>
                  <div style={{ color: '#64748b', fontSize: '11.5px', marginBottom: '2px' }}>Organization</div>
                  <div style={{ fontWeight: 600, color: '#0f172a' }}>
                    {verifiedUser?.company || 'Enterprise Partner'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '11.5px', marginBottom: '2px' }}>Corporate Email</div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {verifiedUser?.email || emailParam} <CheckCircle2 size={14} color="#16a34a" />
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '11.5px', marginBottom: '2px' }}>Workspace Access</div>
                  <div style={{ fontWeight: 600, color: '#0f172a', textTransform: 'capitalize' }}>
                    {verifiedUser?.role ? verifiedUser.role.replace('_', ' ') : 'Corporate Admin'}
                  </div>
                </div>

                <div>
                  <div style={{ color: '#64748b', fontSize: '11.5px', marginBottom: '2px' }}>Security Session</div>
                  <div
                    style={{
                      fontWeight: 600,
                      color: '#0284c7',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <Lock size={12} /> Authenticated
                  </div>
                </div>
              </div>
            </div>

            {/* Primary Action Button */}
            <button
              onClick={handleProceedToWorkspace}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '10px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.28)',
                transition: 'all 0.15s ease',
              }}
            >
              Enter Enterprise Freight Workspace <ArrowRight size={18} />
            </button>

            {/* Concierge & Relationship Desk Box */}
            <div
              style={{
                marginTop: '24px',
                padding: '16px 18px',
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: '#f0f9ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: '2px',
                }}
              >
                <Headphones size={17} color="#0284c7" />
              </div>
              <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.5 }}>
                <strong style={{ color: '#0f172a' }}>Dedicated Corporate Partner Desk:</strong> Need custom rate
                matrix integrations, carrier bidding setups, or team member invitations? Contact your dedicated
                operations manager at{' '}
                <a href="mailto:support@fr8x.in" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: 600 }}>
                  support@fr8x.in
                </a>
                .
              </div>
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <Link
                href="/login"
                style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
              >
                Sign in with another corporate account &rarr;
              </Link>
            </div>
          </div>
        )}

        {/* ERROR / EXPIRED STATE */}
        {status === 'error' && (
          <div>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertCircle size={34} />
            </div>

            <h2 style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              {errorCode === 'TOKEN_EXPIRED'
                ? 'Verification Link Expired'
                : errorCode === 'TOKEN_ALREADY_USED'
                ? 'Link Already Completed'
                : 'Verification Notice'}
            </h2>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: '0 0 24px' }}>
              {message}
            </p>

            {/* Resend Verification Form */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                textAlign: 'left',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <Mail size={16} color="#0284c7" />
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#0f172a' }}>
                  Request Fresh Verification Link
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                Enter your registered corporate email address to receive a fresh verification link valid for 15 minutes.
              </p>

              <form onSubmit={handleResend}>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      padding: '0 12px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      fontSize: '14px',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {resendError && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#b91c1c',
                      background: '#fee2e2',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      marginBottom: '12px',
                    }}
                  >
                    {resendError}
                  </div>
                )}

                {resendMessage && (
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#15803d',
                      background: '#dcfce7',
                      padding: '8px 12px',
                      borderRadius: '6px',
                      marginBottom: '12px',
                    }}
                  >
                    {resendMessage}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isResending || resendCooldown > 0}
                  style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '8px',
                    background: resendCooldown > 0 ? '#94a3b8' : '#0284c7',
                    color: '#ffffff',
                    border: 'none',
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  {isResending ? (
                    <>
                      <Loader2 className="animate-spin" size={16} /> Sending...
                    </>
                  ) : resendCooldown > 0 ? (
                    <>
                      <Clock size={16} /> Resend in {resendCooldown}s
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} /> Resend Verification Link
                    </>
                  )}
                </button>
              </form>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                href="/login"
                style={{
                  flex: 1,
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#334155',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Sign In
              </Link>
              <Link
                href="/register"
                style={{
                  flex: 1,
                  height: '42px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Register Account
              </Link>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '28px', fontSize: '11.5px', color: '#94a3b8' }}>
          Protected by FR8X Cryptographic Authority &bull; password@fr8x.in &bull; support@fr8x.in
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#f8fafc',
          }}
        >
          <Loader2 className="animate-spin" size={32} color="#0284c7" />
        </div>
      }
    >
      <VerifyEmailContent />
    </Suspense>
  );
}
