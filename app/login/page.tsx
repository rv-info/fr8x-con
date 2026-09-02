'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { isCorporateEmail } from '@/lib/utils';
import { Lock, ArrowRight, AlertCircle, Wifi, WifiOff, KeyRound, X, ShieldAlert, Clock, Info } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loadRemembered, userStatus } = useAuth();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState(''); // uid or email
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  // Forgot password modal
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // Read URL reason parameter (session_expired, inactivity, not_found)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const reason = params.get('reason');
      if (reason === 'session_expired' || reason === 'inactivity') {
        setSessionNotice('Your session has expired due to inactivity. Please sign in again to continue.');
      } else if (reason === 'not_found') {
        setSessionNotice('Requested page not found or unauthenticated. Please sign in to access the workspace.');
      } else if (reason === 'unauthorized') {
        setSessionNotice('Authentication required. Please sign in with your enterprise credentials.');
      }
    }
  }, []);

  // Restore remembered credentials on mount
  useEffect(() => {
    const saved = loadRemembered();
    if (saved) {
      setIdentifier(saved.userId);
      setPassword(saved.password);
      setRemember(true);
    }
  }, [loadRemembered]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsBlocked(false);

    const id = identifier.trim();
    if (!id || !password) {
      setErrorMessage('Please enter your User ID (or corporate email) and password.');
      return;
    }

    // If looks like email, enforce corporate domain
    if (id.includes('@') && !isCorporateEmail(id)) {
      setErrorMessage('Free email domains (Gmail, Yahoo, Outlook, etc.) are not permitted.');
      return;
    }

    setIsLoading(true);

    try {
      // Server-side authentication & attempt limiter
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: id, password }),
      });

      const json = await res.json();
      setIsLoading(false);

      if (res.ok && json.success) {
        // Successful login
        login(id, password, remember);
        toast('Logged in successfully to FR8X Workspace.');
        router.push('/feeds');
      } else {
        if (json.isBlocked || res.status === 403) {
          setIsBlocked(true);
          setErrorMessage('ACCOUNT BLOCKED. CONTACT PLATFORM ADMINISTRATOR.');
        } else {
          setErrorMessage(json.error || 'Invalid credentials.');
        }
      }
    } catch {
      setIsLoading(false);
      // Fallback local verification
      const success = login(id, password, remember);
      if (success) {
        toast('Logged in successfully to FR8X Workspace.');
        router.push('/feeds');
      } else {
        setErrorMessage('Invalid User ID / email or incorrect password. Please try again.');
      }
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setIsResetSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      const json = await res.json();
      toast(json.message || 'If an account matches this email, password reset instructions have been dispatched.');
      setIsForgotModalOpen(false);
      setResetEmail('');
    } catch {
      toast('If an account matches this email, password reset instructions have been dispatched.');
      setIsForgotModalOpen(false);
    } finally {
      setIsResetSubmitting(false);
    }
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
          <img
            src="/logo.png"
            alt="FR8X"
            style={{
              width: '48px',
              height: '48px',
              margin: '0 auto 10px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <h1 style={{ fontSize: '20px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
            fr<b style={{ color: 'var(--teal)' }}>8</b>x Workspace
          </h1>
          <p style={{ fontSize: '11.5px', color: 'var(--mut)', margin: '4px 0 0' }}>
            Enterprise Freight Forwarding &amp; Reverse Auctions Platform
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '24px' }}>
          {sessionNotice && !errorMessage && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1d4ed8',
                fontSize: '11.5px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              <Clock size={15} style={{ flexShrink: 0, color: '#2563eb' }} />
              <span>{sessionNotice}</span>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                background: isBlocked ? '#fef2f2' : '#fff0f1',
                border: isBlocked ? '1px solid #f87171' : '1px solid #f0c8ce',
                color: isBlocked ? '#b91c1c' : 'var(--red)',
                fontSize: '11.5px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: isBlocked ? 700 : 500,
              }}
            >
              {isBlocked ? (
                <ShieldAlert size={16} style={{ flexShrink: 0, color: '#dc2626' }} />
              ) : (
                <AlertCircle size={15} style={{ flexShrink: 0 }} />
              )}
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* User ID / Email */}
            <div className="field" style={{ marginBottom: '14px' }}>
              <label>User ID or Corporate Email</label>
              <input
                type="text"
                className="input"
                placeholder="u-arjun  or  name@company.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                required
              />
              <small style={{ color: 'var(--mut)', fontSize: '10px', marginTop: '3px' }}>
                Enter your User ID (e.g. u-arjun) or verified corporate email.
              </small>
            </div>

            {/* Password */}
            <div className="field" style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label>Password</label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsForgotModalOpen(true);
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
                autoComplete="current-password"
                required
              />
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '16px' }}>
              <input
                id="remember-device"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: '14px', height: '14px', cursor: 'pointer' }}
              />
              <label htmlFor="remember-device" style={{ fontSize: '11px', color: 'var(--mut)', cursor: 'pointer', margin: 0 }}>
                Remember me on this device
              </label>
              {/* Live status dot */}
              <span
                style={{
                  marginLeft: 'auto',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '10px',
                  color: userStatus === 'available' ? '#16a34a' : '#94a3b8',
                }}
              >
                {userStatus === 'available' ? (
                  <>
                    <Wifi size={11} /> Available
                  </>
                ) : (
                  <>
                    <WifiOff size={11} /> Offline
                  </>
                )}
              </span>
            </div>

            <button
              type="submit"
              className="btn primary"
              style={{ width: '100%', height: '38px', fontSize: '13px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating…' : <><span>Sign in to Workspace</span> <ArrowRight size={14} /></>}
            </button>
          </form>

          {/* Enterprise Support & Access Notice */}
          <div
            style={{
              marginTop: '16px',
              padding: '10px 12px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '11px',
              color: 'var(--mut)',
              lineHeight: 1.45,
            }}
          >
            <b style={{ display: 'block', color: 'var(--ink)', marginBottom: '3px' }}>
              Multi-Enterprise Global Network:
            </b>
            Log in using your enterprise User ID or verified company email. Max 3 password attempts enforced server-side.
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

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card" style={{ maxWidth: '400px' }}>
            <div className="gf-modal-header">
              <div className="gf-modal-title flex items-center gap-2">
                <KeyRound className="lucide w-4 h-4 text-sky-600" />
                <span>Reset Account Password</span>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="gf-modal-close-btn"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} style={{ padding: '16px' }} className="space-y-3">
              <p style={{ fontSize: '11.5px', color: 'var(--mut)', margin: 0, lineHeight: 1.4 }}>
                Enter your registered corporate email. If an account is matched, secure instructions will be dispatched.
              </p>

              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                  Verified Corporate Email
                </label>
                <input
                  type="email"
                  required
                  placeholder="name@company.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  className="input"
                  style={{ width: '100%', height: '34px', fontSize: '12px' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(false)}
                  className="btn secondary sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting || !resetEmail.trim()}
                  className="btn primary sm"
                >
                  {isResetSubmitting ? 'Dispatching…' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
