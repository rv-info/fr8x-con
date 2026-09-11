'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight, Mail, RefreshCw, Clock } from 'lucide-react';

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const emailParam = searchParams.get('email') || '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);

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
      setMessage('No verification token provided. Please use the link sent to your email.');
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
          setMessage(data.message || 'Your email address has been successfully verified.');
        } else {
          setStatus('error');
          setErrorCode(data.code || 'VERIFICATION_FAILED');
          setMessage(data.error || 'This verification link is invalid or has expired.');
        }
      } catch {
        setStatus('error');
        setErrorCode('NETWORK_ERROR');
        setMessage('Network error while verifying your email. Please try again.');
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
      setResendError('Please enter a valid email address.');
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
        setResendError(data.error || 'Failed to resend verification email. Please try again.');
        if (data.retryAfterSeconds) {
          setResendCooldown(data.retryAfterSeconds);
        }
      }
    } catch {
      setIsResending(false);
      setResendError('Network error while requesting verification email.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--fr8x-background, #f8fafc)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '480px',
          background: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 12px 30px -5px rgba(0,0,0,0.08)',
          padding: '40px 32px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <Link
            href="/"
            style={{
              display: 'inline-flex',
              flexDirection: 'column',
              alignItems: 'center',
              textDecoration: 'none',
              marginBottom: '10px',
            }}
          >
            <img
              src="/logo.png"
              alt="FR8X"
              style={{
                width: '54px',
                height: '54px',
                margin: '0 auto 8px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            <div
              style={{
                fontSize: '24px',
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
                fontSize: '10.5px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                color: '#0284c7',
                marginTop: '3px',
              }}
            >
              Enterprise Logistics Platform
            </div>
          </Link>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: '6px 0 0', color: '#0f172a' }}>
            FR8X Email Verification
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            Single-Use Cryptographic Link Verification
          </p>
        </div>

        {status === 'loading' && (
          <div style={{ padding: '36px 0' }}>
            <Loader2 className="animate-spin" size={40} color="#0284c7" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', margin: '0 0 6px' }}>
              Validating Security Token...
            </p>
            <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
              Verifying token authenticity and single-use status
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Email Verified Successfully!
            </h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: '0 0 24px' }}>
              {message}
            </p>
            <button
              onClick={() => router.push('/feeds')}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '8px',
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
                boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              }}
            >
              Go to Workspace <ArrowRight size={18} />
            </button>
            <div style={{ marginTop: '16px' }}>
              <Link
                href="/login"
                style={{ fontSize: '13px', color: '#64748b', textDecoration: 'none', fontWeight: 500 }}
              >
                Sign in to another account
              </Link>
            </div>
          </div>
        )}

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
              <AlertCircle size={36} />
            </div>
            <h2 style={{ fontSize: '19px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              {errorCode === 'TOKEN_EXPIRED'
                ? 'Verification Link Expired'
                : errorCode === 'TOKEN_ALREADY_USED'
                ? 'Link Already Used'
                : 'Verification Failed'}
            </h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: 1.5, margin: '0 0 24px' }}>
              {message}
            </p>

            {/* Resend Verification Email Section */}
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
                  Resend Verification Email
                </span>
              </div>
              <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                Enter your registered email address to receive a fresh verification link valid for 15 minutes.
              </p>

              <form onSubmit={handleResend}>
                <div style={{ marginBottom: '12px' }}>
                  <input
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="you@company.com"
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

            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '44px',
                borderRadius: '8px',
                background: '#0f172a',
                color: '#ffffff',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '14px',
              }}
            >
              Back to Sign In
            </Link>
          </div>
        )}
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
