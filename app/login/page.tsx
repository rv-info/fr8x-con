'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { isCorporateEmail } from '@/lib/utils';
import { Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState('arjun@atlaslogistics.com');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both corporate email and password.');
      return;
    }

    if (!isCorporateEmail(email)) {
      setErrorMessage(
        'Please use a registered corporate email. Free email domains (Gmail, Yahoo, Outlook, etc.) are restricted.'
      );
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const success = login(email, password);
      if (success) {
        toast('Logged in successfully to FR8X Workspace.');
        router.push('/feeds');
      } else {
        setErrorMessage('Invalid credentials or account locked.');
      }
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0d1d31 0%, #152c4a 100%)',
        padding: '20px',
      }}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '420px',
          boxShadow: 'var(--sh-lg)',
          overflow: 'hidden',
          borderRadius: '14px',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '24px 24px 20px',
            background: '#fff',
            borderBottom: '1px solid var(--line)',
            textAlign: 'center',
          }}
        >
          <div
            className="mark"
            style={{
              width: '38px',
              height: '38px',
              margin: '0 auto 10px',
              fontSize: '14px',
              borderRadius: '10px',
            }}
          >
            f8
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            fr<b style={{ color: 'var(--teal)' }}>8</b>x Workspace
          </h1>
          <p style={{ fontSize: '11.5px', color: 'var(--mut)', margin: '4px 0 0' }}>
            Enterprise Freight Forwarding & Reverse Auctions Platform
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {errorMessage && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#fff0f1',
                border: '1px solid #f0c8ce',
                color: 'var(--red)',
                fontSize: '11.5px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div className="field" style={{ marginBottom: '14px' }}>
              <label>Professional Corporate Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  type="email"
                  className="input"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <small style={{ color: 'var(--mut)', fontSize: '10px', marginTop: '3px' }}>
                Consumer email domains (Gmail/Yahoo/Outlook) are rejected.
              </small>
            </div>

            <div className="field" style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    toast('Password reset link dispatched to your verified corporate email.');
                  }}
                  style={{ fontSize: '10.5px', color: 'var(--brand)', fontWeight: 600 }}
                >
                  Forgot password?
                </a>
              </div>
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn primary"
              style={{ width: '100%', height: '38px', fontSize: '13px' }}
              disabled={isLoading}
            >
              {isLoading ? (
                'Authenticating…'
              ) : (
                <>
                  Sign in to Workspace <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          {/* Demo Account Switcher Hint */}
          <div
            style={{
              marginTop: '16px',
              padding: '10px 12px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '11px',
            }}
          >
            <b style={{ display: 'block', color: 'var(--ink)', marginBottom: '4px' }}>
              Demo Enterprise Accounts:
            </b>
            <div style={{ color: 'var(--mut)' }}>
              • <code>arjun@atlaslogistics.com</code> (Premium Verified)
              <br />• <code>sarah.lewis@rotterdamfreight.nl</code> (Professional)
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 24px',
            background: '#fafbfd',
            borderTop: '1px solid var(--line)',
            textAlign: 'center',
            fontSize: '12px',
            color: 'var(--mut)',
          }}
        >
          New freight organization?{' '}
          <Link href="/register" style={{ color: 'var(--brand)', fontWeight: 700 }}>
            Register Company
          </Link>
        </div>
      </div>
    </div>
  );
}
