'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, CheckCircle2, AlertCircle, Loader2, ArrowRight } from 'lucide-react';

export default function TokenVerifyEmailPage() {
  const params = useParams();
  const router = useRouter();
  const token = typeof params?.token === 'string' ? params.token : '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
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
          setMessage(data.error || 'Verification token is invalid or has expired.');
        }
      } catch {
        setStatus('error');
        setMessage('Network connection error while verifying your email. Please try again.');
      }
    }

    verify();
  }, [token]);

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
            Sovereign Enterprise Identity &amp; Governance
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
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#fef2f2',
                color: '#dc2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <AlertCircle size={32} />
            </div>
            <h2 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Verification Link Invalid
            </h2>
            <p style={{ fontSize: '13px', color: '#475569', lineHeight: 1.5, margin: '0 0 24px' }}>
              {message}
            </p>
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
