'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight, Mail, RefreshCw, Clock } from 'lucide-react';

export default function TokenVerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [resendEmail, setResendEmail] = useState('');
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

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
      setMessage('Invalid or missing email verification link.');
      return;
    }

    async function verify() {
      try {
        const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`);
        const data = await res.json();

        if (res.ok && data.success) {
          setStatus('success');
          setMessage(data.message || 'Your email address has been successfully verified.');
        } else {
          setStatus('error');
          setErrorCode(data.code || 'VERIFICATION_FAILED');
          setMessage(data.error || 'Verification token is invalid or has expired.');
        }
      } catch {
        setStatus('error');
        setErrorCode('NETWORK_ERROR');
        setMessage('Network connection error while verifying your email. Please try again.');
      }
    }

    verify();
  }, [token]);

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
        setResendError(data.error || 'Failed to resend verification email.');
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
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '460px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)',
          padding: '36px 28px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 12px',
              borderRadius: '12px',
              background: '#0284c7',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 800,
            }}
          >
            f8
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: '#0f172a' }}>
            FR8X Email Verification
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '6px 0 0' }}>
            FR8X Team · Official Account Verification
          </p>
        </div>

        {status === 'loading' && (
          <div style={{ padding: '30px 0' }}>
            <Loader2 className="animate-spin" size={36} color="#0284c7" style={{ margin: '0 auto 16px' }} />
            <p style={{ fontSize: '14px', color: '#334155' }}>
              Verifying your cryptographic security token...
            </p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#ecfdf5',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Verification Complete
            </h2>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 24px' }}>
              {message}
            </p>
            <button
              onClick={() => router.push('/feeds')}
              style={{
                width: '100%',
                height: '42px',
                borderRadius: '6px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Proceed to Workspace <ArrowRight size={16} />
            </button>
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

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                href="/login"
                style={{
                  flex: 1,
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
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
                  height: '40px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  background: '#0284c7',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                Register Again
              </Link>
            </div>
          </div>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '11px', color: '#94a3b8' }}>
          Protected by FR8X Cryptographic Authority · password@fr8x.in
        </div>
      </div>
    </div>
  );
}
