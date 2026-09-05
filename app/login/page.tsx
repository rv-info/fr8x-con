'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { isCorporateEmail } from '@/lib/utils';
import { Lock, ArrowRight, AlertCircle, Wifi, WifiOff, KeyRound, X, ShieldAlert, Clock, Info, ShieldCheck, Mail, CheckCircle2, Smartphone, Download, Zap, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, loadRemembered, userStatus, resetPasswordWithOtp } = useAuth();
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState(''); // uid or email
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'otp'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');
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
        // Successful server authentication
        const loggedIn = login(id, password, remember, json);
        if (loggedIn) {
          toast(`Logged in successfully to FR8X Workspace as ${json.displayName || id}.`);
          router.push('/feeds');
        } else {
          setErrorMessage('Session initialization failed. Please try again.');
        }
      } else {
        if (json.isBlocked || res.status === 403) {
          setIsBlocked(true);
          if (json.passwordResetRequired) {
            const userTargetEmail = json.email || (id.includes('@') ? id : '');
            setErrorMessage(
              json.error ||
                'Security Lock: 3 invalid attempts detected. A password reset OTP has been dispatched from the server to your registered email.'
            );
            setResetEmail(userTargetEmail);
            setResetStep('otp');
            setResetError('');
            setIsForgotModalOpen(true);
            toast('Password reset OTP dispatched from server. Please check your email.');
          } else {
            setErrorMessage(json.error || 'ACCOUNT BLOCKED. CONTACT PLATFORM ADMINISTRATOR.');
          }
        } else {
          // Check client-side registered accounts fallback (e.g. newly registered organizations)
          const localSuccess = login(id, password, remember);
          if (localSuccess) {
            toast('Logged in successfully to FR8X Workspace.');
            router.push('/feeds');
            return;
          }
          const remainingMsg =
            typeof json.attemptsRemaining === 'number'
              ? ` (${json.attemptsRemaining} attempt${json.attemptsRemaining === 1 ? '' : 's'} remaining)`
              : '';
          setErrorMessage((json.error || 'Invalid credentials.') + remainingMsg);
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

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;

    setResetError('');
    setIsResetSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });

      const json = await res.json();
      toast(json.message || 'If an account matches this email, password reset instructions have been dispatched.');
      setResetStep('otp');
    } catch {
      toast('Verification code dispatched. Please check your registered email.');
      setResetStep('otp');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      setResetError('Please enter a valid 6-digit verification code.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 6) {
      setResetError('New password must be at least 6 characters long.');
      return;
    }
    if (resetNewPassword !== resetConfirmPassword) {
      setResetError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsResetSubmitting(true);
    try {
      const result = await resetPasswordWithOtp(
        resetEmail.trim(),
        resetOtp.trim(),
        resetNewPassword.trim()
      );

      if (!result.success) {
        setResetError(result.error || 'Invalid or expired OTP code.');
        setIsResetSubmitting(false);
        return;
      }

      toast('Password reset successfully! You can now sign in.');
      setIsForgotModalOpen(false);
      setIsBlocked(false);
      setIdentifier(resetEmail.trim());
      setPassword('');
      setErrorMessage('');
      setSessionNotice('Password successfully reset! Please sign in with your new password.');
      setResetOtp('');
      setResetNewPassword('');
      setResetConfirmPassword('');
      setResetStep('request');
    } catch (err: any) {
      setResetError(err.message || 'Password reset failed.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div className="login-viewport">
      <div className="login-card">
        {/* Top Brand Stripe */}
        <div style={{ height: '4px', background: 'var(--fr8x-outline)' }} />

        {/* Header */}
        <div
          className="login-card-header"
          style={{
            padding: '24px 24px 18px',
            background: 'var(--fr8x-background)',
            borderBottom: '1px solid var(--fr8x-outline)',
            textAlign: 'center',
          }}
        >
          <img
            src="/logo.png"
            alt="FR8X"
            style={{
              width: '44px',
              height: '44px',
              margin: '0 auto 10px',
              objectFit: 'contain',
              display: 'block',
            }}
          />
          <h1 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--fr8x-text)' }}>
            fr<b style={{ color: 'var(--fr8x-outline)' }}>8</b>x Workspace
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--fr8x-muted)', margin: '4px 0 0' }}>
            Enterprise Freight Forwarding &amp; Reverse Auctions Platform
          </p>
        </div>

        {/* Body */}
        <div className="login-card-body" style={{ padding: '24px' }}>
          {sessionNotice && !errorMessage && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'var(--fr8x-input)',
                border: '1px solid var(--fr8x-outline)',
                color: 'var(--fr8x-text)',
                fontSize: '11.5px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 600,
                lineHeight: 1.4,
              }}
            >
              <Clock size={15} style={{ flexShrink: 0, color: 'var(--fr8x-outline)' }} />
              <span>{sessionNotice}</span>
            </div>
          )}

          {errorMessage && (
            <div
              style={{
                padding: '10px 12px',
                borderRadius: '6px',
                background: 'var(--fr8x-input)',
                border: '1px solid var(--fr8x-outline)',
                color: 'var(--fr8x-text)',
                fontSize: '11.5px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: 700,
              }}
            >
              {isBlocked ? (
                <ShieldAlert size={16} style={{ flexShrink: 0, color: 'var(--fr8x-outline)' }} />
              ) : (
                <AlertCircle size={15} style={{ flexShrink: 0, color: 'var(--fr8x-outline)' }} />
              )}
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* User ID / Email */}
            <div className="field" style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '11.5px', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                User ID or Corporate Email
              </label>
              <input
                type="text"
                className="input"
                placeholder="u-arjun  or  name@company.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                spellCheck={false}
                required
              />
            </div>

            {/* Password */}
            <div className="field" style={{ marginBottom: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Password</label>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsForgotModalOpen(true);
                  }}
                  style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 600, padding: '2px 4px' }}
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
                autoCapitalize="none"
                required
              />
            </div>

            {/* Remember Me */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px', padding: '2px 0' }}>
              <input
                id="remember-device"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
              />
              <label htmlFor="remember-device" style={{ fontSize: '11.5px', color: 'var(--mut)', cursor: 'pointer', margin: 0, userSelect: 'none' }}>
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
              className="btn primary login-submit-btn"
              style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
              disabled={isLoading}
            >
              {isLoading ? 'Authenticating…' : <><span>Sign in to Workspace</span> <ArrowRight size={15} /></>}
            </button>
          </form>
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
          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: 'var(--mut)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
            }}
          >
            <ShieldCheck size={13} style={{ color: '#16a34a' }} />
            <span>256-Bit TLS Bank-Grade Encrypted</span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal with OTP Workflow */}
      {isForgotModalOpen && (
        <div className="gf-modal-backdrop">
          <div className="gf-modal-card" style={{ width: '92vw', maxWidth: '440px' }}>
            <div className="gf-modal-header">
              <div className="gf-modal-title flex items-center gap-2">
                <KeyRound className="lucide w-4 h-4 text-sky-600" />
                <span>
                  {resetStep === 'otp'
                    ? 'Verify OTP & Reset Password'
                    : 'Reset Account Password'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsForgotModalOpen(false)}
                className="gf-modal-close-btn"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            {resetStep === 'request' ? (
              <form onSubmit={handleRequestResetOtp} style={{ padding: '16px' }} className="space-y-3">
                <p style={{ fontSize: '11.5px', color: 'var(--mut)', margin: 0, lineHeight: 1.4 }}>
                  Enter your registered corporate email. A secure 6-digit password reset OTP will be dispatched from the server.
                </p>

                {resetError && (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: '#fff0f1',
                      border: '1px solid #f0c8ce',
                      color: 'var(--red)',
                      fontSize: '11px',
                    }}
                  >
                    {resetError}
                  </div>
                )}

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
                    {isResetSubmitting ? 'Dispatching…' : 'Send Reset Code'}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtpAndReset} style={{ padding: '16px' }} className="space-y-3">
                <div
                  style={{
                    padding: '8px 12px',
                    background: '#f0f9ff',
                    border: '1px solid #bae6fd',
                    borderRadius: '6px',
                    fontSize: '11.5px',
                    color: '#0369a1',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    lineHeight: 1.4,
                  }}
                >
                  <Mail size={15} style={{ flexShrink: 0, color: '#0284c7' }} />
                  <span>
                    A 6-digit OTP was dispatched from the server to <strong>{resetEmail || 'your email'}</strong>. Enter it below to unlock your account.
                  </span>
                </div>

                {resetError && (
                  <div
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      background: '#fff0f1',
                      border: '1px solid #f0c8ce',
                      color: 'var(--red)',
                      fontSize: '11px',
                    }}
                  >
                    {resetError}
                  </div>
                )}

                <div className="field">
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    6-Digit Verification OTP Code <span className="req">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    placeholder="Enter 6-digit code"
                    value={resetOtp}
                    onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                    className="input"
                    style={{
                      width: '100%',
                      height: '36px',
                      fontSize: '14px',
                      fontWeight: 700,
                      letterSpacing: '3px',
                      textAlign: 'center',
                    }}
                    autoFocus
                  />
                </div>

                <div className="field">
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    New Password <span className="req">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="At least 6 characters"
                    value={resetNewPassword}
                    onChange={(e) => setResetNewPassword(e.target.value)}
                    className="input"
                    style={{ width: '100%', height: '34px', fontSize: '12px' }}
                  />
                </div>

                <div className="field">
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Confirm New Password <span className="req">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    className="input"
                    style={{ width: '100%', height: '34px', fontSize: '12px' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setResetStep('request')}
                    style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                  >
                    Change Email / Resend
                  </button>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => setIsForgotModalOpen(false)}
                      className="btn secondary sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isResetSubmitting || resetOtp.length !== 6 || !resetNewPassword}
                      className="btn primary sm"
                    >
                      {isResetSubmitting ? 'Verifying…' : 'Verify & Reset Password'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Floating APK Download Pill on Bottom Right */}
      <a
        href="/fr8x-enterprise-mobile-v2.4.apk"
        download
        title="Download FR8X Android Mobile App (.apk)"
        style={{
          position: 'fixed',
          bottom: '22px',
          right: '22px',
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '9px 15px',
          background: '#ffffff',
          border: '1.5px solid #cbd5e1',
          borderRadius: '50px',
          boxShadow: '0 4px 16px rgba(15, 23, 42, 0.12)',
          textDecoration: 'none',
          color: '#0f172a',
          fontWeight: 700,
          fontSize: '12px',
          transition: 'all 0.15s ease',
          cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = '#0ea5e9';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.25)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = '#cbd5e1';
          e.currentTarget.style.boxShadow = '0 4px 16px rgba(15, 23, 42, 0.12)';
          e.currentTarget.style.transform = 'translateY(0)';
        }}
      >
        <div
          style={{
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Smartphone size={15} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left', lineHeight: 1.2 }}>
          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>Download Android App</span>
          <span style={{ fontSize: '9.5px', color: '#0ea5e9', fontWeight: 700 }}>v2.4.0 Native Standalone (.apk)</span>
        </div>
        <div
          style={{
            width: '24px',
            height: '24px',
            borderRadius: '50%',
            background: '#f0fdf4',
            border: '1px solid #bbf7d0',
            color: '#16a34a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: '4px',
          }}
        >
          <Download size={13} />
        </div>
      </a>
    </div>
  );
}
