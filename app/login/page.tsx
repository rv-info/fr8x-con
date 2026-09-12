'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { isCorporateEmail } from '@/lib/utils';
import { Lock, ArrowRight, AlertCircle, Wifi, WifiOff, KeyRound, X, ShieldAlert, Clock, Info, ShieldCheck, Mail, CheckCircle2, Smartphone, Download, Zap, Sparkles, Eye, EyeOff, Calendar, Shield } from 'lucide-react';

// --- Password Strength Scorer (reused in reset modal) ---
type StrengthLevel = 'empty' | 'too_weak' | 'weak' | 'fair' | 'strong' | 'very_strong';
function calcPasswordStrength(pwd: string): { level: StrengthLevel; score: number; label: string; color: string } {
  if (!pwd) return { level: 'empty', score: 0, label: '', color: '#94a3b8' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[a-z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { level: 'too_weak', score: 1, label: 'Too Weak', color: '#ef4444' };
  if (score === 2) return { level: 'weak', score: 2, label: 'Weak', color: '#f97316' };
  if (score === 3) return { level: 'fair', score: 3, label: 'Fair', color: '#eab308' };
  if (score === 4 || score === 5) return { level: 'strong', score: 4, label: 'Strong', color: '#22c55e' };
  return { level: 'very_strong', score: 5, label: 'Very Strong', color: '#16a34a' };
}

// --- Shared Live Clock Panel ---
function LiveClockPanel() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const mm = String(now.getMinutes()).padStart(2,'0');
  const ss = String(now.getSeconds()).padStart(2,'0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  const h12 = now.getHours() % 12 || 12;
  const daysInMonth = new Date(now.getFullYear(), now.getMonth()+1, 0).getDate();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  const calDays: (number|null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) calDays.push(null);
  for (let d = 1; d <= daysInMonth; d++) calDays.push(d);
  while (calDays.length % 7 !== 0) calDays.push(null);
  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(160deg, #0f172a 0%, #1e293b 60%, #0c1a2e 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '40px 24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div style={{ fontSize: '30px', fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.04em' }}>
          fr<span style={{ color: '#0ea5e9' }}>8</span>x
        </div>
        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.14em', color: '#64748b', marginTop: '3px' }}>Enterprise Workspace</div>
      </div>
      <div style={{ background: 'rgba(14,165,233,0.08)', border: '1px solid rgba(14,165,233,0.2)', borderRadius: '16px', padding: '18px 28px', textAlign: 'center', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '4px' }}>
          <span style={{ fontSize: '48px', fontWeight: 900, color: '#f1f5f9', fontFamily: 'monospace', letterSpacing: '-0.02em', lineHeight: 1 }}>
            {String(h12).padStart(2,'0')}:{mm}
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#0ea5e9', fontFamily: 'monospace' }}>{ampm}</span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', fontFamily: 'monospace' }}>{ss}s</span>
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px' }}>
          {days[now.getDay()]} · {months[now.getMonth()]} {now.getDate()}, {now.getFullYear()}
        </div>
      </div>
      <div style={{ background: 'rgba(15,23,42,0.7)', border: '1px solid #1e293b', borderRadius: '14px', padding: '14px', width: '100%', maxWidth: '240px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: '10px' }}>
          <Calendar size={13} color="#0ea5e9" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{months[now.getMonth()]} {now.getFullYear()}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', textAlign: 'center' }}>
          {['S','M','T','W','T','F','S'].map((d,i) => <div key={i} style={{ fontSize: '9px', fontWeight: 700, color: '#475569', padding: '2px 0' }}>{d}</div>)}
          {calDays.map((d, i) => (
            <div key={i} style={{ fontSize: '10px', fontWeight: d === now.getDate() ? 800 : 500, color: d === now.getDate() ? '#fff' : d ? '#94a3b8' : 'transparent', background: d === now.getDate() ? '#0ea5e9' : 'transparent', borderRadius: '4px', padding: '2px 0', transition: 'all 0.2s' }}>{d || ''}</div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <p style={{ fontSize: '11px', color: '#475569', lineHeight: 1.6, margin: '0 0 16px', fontStyle: 'italic', maxWidth: '200px' }}>
          Secure enterprise freight workspace. Sign in to access live freight markets.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
          <Shield size={11} color="#22c55e" />
          <span style={{ fontSize: '9px', color: '#22c55e', fontWeight: 700, letterSpacing: '0.08em' }}>256-BIT TLS ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const auth = useAuth();
  const { login, loadRememberedEmail, userStatus, resetPasswordWithOtp } = auth;
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState(''); // uid or email
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [sessionNotice, setSessionNotice] = useState<string | null>(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);

  // Forgot password modal state
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [resetStep, setResetStep] = useState<'request' | 'otp'>('request');
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');
  const [showResetNewPassword, setShowResetNewPassword] = useState(false);
  const [showResetConfirmPassword, setShowResetConfirmPassword] = useState(false);
  const [resetError, setResetError] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);
  const [resetResendCooldown, setResetResendCooldown] = useState(0);

  // First-login OTP verification state
  const [firstLoginModalOpen, setFirstLoginModalOpen] = useState(false);
  const [firstLoginChallengeToken, setFirstLoginChallengeToken] = useState('');
  const [firstLoginOtp, setFirstLoginOtp] = useState('');
  const [firstLoginError, setFirstLoginError] = useState('');
  const [firstLoginTimer, setFirstLoginTimer] = useState(15);
  const [firstLoginSubmitting, setFirstLoginSubmitting] = useState(false);
  const [firstLoginResending, setFirstLoginResending] = useState(false);
  const [firstLoginResendCooldown, setFirstLoginResendCooldown] = useState(60);

  // Countdown timer for first-login OTP (15 seconds strict) and 60-second resend cooldown
  useEffect(() => {
    if (!firstLoginModalOpen) return;
    const interval = setInterval(() => {
      setFirstLoginTimer((prev) => (prev > 0 ? prev - 1 : 0));
      setFirstLoginResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [firstLoginModalOpen]);

  // Countdown timer for password reset OTP 60-second resend cooldown
  useEffect(() => {
    if (resetResendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResetResendCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resetResendCooldown]);

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

  // Restore remembered email on mount (password is never stored)
  useEffect(() => {
    try {
      const getSaved = loadRememberedEmail || (auth as any)?.loadRemembered;
      if (typeof getSaved === 'function') {
        const savedEmail = getSaved();
        if (savedEmail) {
          setIdentifier(savedEmail);
          setRemember(true);
        }
      }
    } catch {
      // Safe fallback if localStorage is blocked or unavailable
    }
  }, [loadRememberedEmail, auth]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setIsBlocked(false);

    const id = identifier.trim();
    if (!id || !password) {
      setErrorMessage('Please enter your User ID (or corporate email) and password.');
      return;
    }

    // If looks like email, validate format
    if (id.includes('@') && !isCorporateEmail(id)) {
      setErrorMessage('Please provide a valid email address.');
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
        if (json.firstLoginRequired) {
          // Intercept first-time login: show OTP challenge
          setFirstLoginChallengeToken(json.challengeToken);
          setFirstLoginTimer(json.expiresIn || 300);
          setFirstLoginOtp('');
          setFirstLoginError('');
          setFirstLoginModalOpen(true);
          toast(json.message || 'First-login verification code sent to your registered email.');
          return;
        }

        // Server authenticated — hand off verified profile to client session
        const loggedIn = login(id, remember, json);
        if (loggedIn) {
          toast(`Logged in successfully to FR8X Workspace as ${json.displayName || id}.`);
          router.push('/feeds');
        } else {
          setErrorMessage('Session initialization failed. Please try again.');
        }
      } else {
        if (json.isPendingVerification) {
          setPendingVerificationEmail(json.email || (id.includes('@') ? id : null));
          setErrorMessage(json.error || 'Your account is pending email verification. Please check your email for your 15-minute verification link.');
          return;
        }

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
          const remainingMsg =
            typeof json.attemptsRemaining === 'number'
              ? ` (${json.attemptsRemaining} attempt${json.attemptsRemaining === 1 ? '' : 's'} remaining)`
              : '';
          setErrorMessage((json.error || 'Invalid credentials.') + remainingMsg);
        }
      }
    } catch {
      setIsLoading(false);
      setErrorMessage('Unable to reach authentication server. Please check your connection and try again.');
    }
  };

  const handleFirstLoginVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstLoginOtp.trim() || firstLoginOtp.trim().length !== 6) {
      setFirstLoginError('Please enter a valid 6-digit verification code.');
      return;
    }
    if (firstLoginTimer <= 0) {
      setFirstLoginError('Code expired.');
      return;
    }

    setFirstLoginSubmitting(true);
    setFirstLoginError('');

    try {
      const res = await fetch('/api/auth/verify-first-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: firstLoginChallengeToken,
          otp: firstLoginOtp.trim(),
        }),
      });

      const json = await res.json();
      setFirstLoginSubmitting(false);

      if (res.ok && json.success) {
        setFirstLoginModalOpen(false);
        const loggedIn = login(identifier.trim(), remember, json);
        if (loggedIn) {
          toast(`First-login verified! Logged in as ${json.displayName || identifier.trim()}.`);
          router.push('/feeds');
        } else {
          setFirstLoginError('Session initialization failed. Please try again.');
        }
      } else {
        setFirstLoginError(json.error || 'Verification failed. Please check the code and try again.');
      }
    } catch {
      setFirstLoginSubmitting(false);
      setFirstLoginError('Unable to connect to verification server. Please try again.');
    }
  };

  const handleFirstLoginResend = async () => {
    if (firstLoginResending) return;
    setFirstLoginResending(true);
    setFirstLoginError('');

    try {
      const res = await fetch('/api/auth/resend-first-login-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          challengeToken: firstLoginChallengeToken,
        }),
      });

      const json = await res.json();
      setFirstLoginResending(false);

      if (res.ok && json.success) {
        setFirstLoginChallengeToken(json.challengeToken);
        setFirstLoginTimer(json.expiresIn || 300);
        setFirstLoginResendCooldown(60);
        setFirstLoginOtp('');
        toast('New verification code sent.');
      } else {
        setFirstLoginError(json.error || 'Failed to resend verification code. Please try again.');
      }
    } catch {
      setFirstLoginResending(false);
      setFirstLoginError('Unable to contact server to resend code.');
    }
  };

  const openForgotModal = () => {
    if (!resetEmail && identifier.trim() && identifier.includes('@')) {
      setResetEmail(identifier.trim());
    }
    setResetError('');
    setResetStep('request');
    setIsForgotModalOpen(true);
  };

  const handleRequestResetOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Please enter your corporate email address.');
      return;
    }

    setResetError('');
    setIsResetSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), action: 'request' }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.success) {
        setResetError(json.error || 'Failed to dispatch verification code. Please try again.');
        setIsResetSubmitting(false);
        return;
      }

      toast(json.message || 'If an account matches this email, password reset instructions have been dispatched.');
      setResetStep('otp');
      setResetResendCooldown(60);
    } catch (err: any) {
      setResetError(err.message || 'Unable to contact authentication server. Please check your connection.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const handleResendResetOtp = async () => {
    if (resetResendCooldown > 0 || isResetSubmitting || !resetEmail.trim()) return;
    await handleRequestResetOtp();
  };

  const handleVerifyOtpAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');

    if (!resetOtp.trim() || resetOtp.trim().length !== 6) {
      setResetError('Please enter a valid 6-digit verification code.');
      return;
    }
    if (!resetNewPassword || resetNewPassword.length < 8) {
      setResetError('New password must be at least 8 characters long.');
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
      setResetResendCooldown(0);
    } catch (err: any) {
      setResetError(err.message || 'Password reset failed.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'row', background: '#0f172a' }}>
      {/* LEFT PANEL — Live Clock/Calendar */}
      <div style={{ width: '280px', minWidth: '280px', position: 'sticky', top: 0, height: '100vh', flexShrink: 0, display: 'none' }} className="login-left-panel">
        <LiveClockPanel />
      </div>

      {/* RIGHT PANEL — Login Form */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
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

          {pendingVerificationEmail && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                color: '#1e40af',
                fontSize: '12px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={15} style={{ color: '#0284c7', flexShrink: 0 }} />
                <span>Need a fresh 15-minute verification link?</span>
              </div>
              <Link
                href={`/verify-email?email=${encodeURIComponent(pendingVerificationEmail)}`}
                style={{
                  fontWeight: 700,
                  color: '#0284c7',
                  textDecoration: 'underline',
                  whiteSpace: 'nowrap',
                  fontSize: '12px',
                }}
              >
                Resend Verification Link →
              </Link>
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
                    openForgotModal();
                  }}
                  style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 600, padding: '2px 4px' }}
                >
                  Forgot password?
                </a>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  autoCapitalize="none"
                  required
                  style={{ paddingRight: '40px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#64748b',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px',
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
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
        <div className="gf-modal-overlay gf-modal-backdrop">
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
                onClick={() => {
                  setIsForgotModalOpen(false);
                  setResetError('');
                  setResetStep('request');
                }}
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
                    onClick={() => {
                      setIsForgotModalOpen(false);
                      setResetError('');
                    }}
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
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showResetNewPassword ? 'text' : 'password'}
                      required
                      placeholder="At least 8 characters"
                      value={resetNewPassword}
                      onChange={(e) => setResetNewPassword(e.target.value)}
                      className="input"
                      style={{ width: '100%', height: '34px', fontSize: '12px', paddingRight: '36px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetNewPassword(!showResetNewPassword)}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        padding: '2px',
                      }}
                      aria-label={showResetNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showResetNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {/* Password strength bar */}
                  {resetNewPassword.length > 0 && (
                    <div style={{ marginTop: '5px' }}>
                      <div style={{ height: '4px', borderRadius: '2px', background: '#e2e8f0', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${(calcPasswordStrength(resetNewPassword).score / 5) * 100}%`,
                          background: calcPasswordStrength(resetNewPassword).color,
                          borderRadius: '2px', transition: 'width 0.3s, background 0.3s',
                        }} />
                      </div>
                      <span style={{ fontSize: '10px', fontWeight: 700, color: calcPasswordStrength(resetNewPassword).color }}>
                        {calcPasswordStrength(resetNewPassword).label}
                      </span>
                    </div>
                  )}
                </div>

                <div className="field">
                  <label style={{ fontSize: '11px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                    Confirm New Password <span className="req">*</span>
                  </label>
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <input
                      type={showResetConfirmPassword ? 'text' : 'password'}
                      required
                      placeholder="Re-enter new password"
                      value={resetConfirmPassword}
                      onChange={(e) => setResetConfirmPassword(e.target.value)}
                      className="input"
                      style={{ width: '100%', height: '34px', fontSize: '12px', paddingRight: '36px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassword(!showResetConfirmPassword)}
                      style={{
                        position: 'absolute',
                        right: '6px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748b',
                        padding: '2px',
                      }}
                      aria-label={showResetConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showResetConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setResetStep('request');
                        setResetError('');
                      }}
                      style={{ background: 'none', border: 'none', color: 'var(--brand)', fontSize: '11px', cursor: 'pointer', padding: 0 }}
                    >
                      Change Email
                    </button>
                    <button
                      type="button"
                      onClick={handleResendResetOtp}
                      disabled={resetResendCooldown > 0 || isResetSubmitting}
                      className="btn secondary sm"
                      style={{ fontSize: '11px', padding: '3px 8px', height: '26px' }}
                    >
                      {resetResendCooldown > 0 ? `Resend in ${resetResendCooldown}s` : 'Resend Code'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotModalOpen(false);
                        setResetError('');
                        setResetStep('request');
                      }}
                      className="btn secondary sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={
                        isResetSubmitting ||
                        resetOtp.length !== 6 ||
                        resetNewPassword.length < 8 ||
                        !resetConfirmPassword ||
                        resetNewPassword !== resetConfirmPassword
                      }
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

      {/* First-Login Security Verification Modal */}
      {firstLoginModalOpen && (
        <div className="gf-modal-overlay gf-modal-backdrop">
          <div className="gf-modal-card" style={{ width: '92vw', maxWidth: '440px' }}>
            <div className="gf-modal-header">
              <div className="gf-modal-title flex items-center gap-2">
                <ShieldCheck className="lucide w-4 h-4 text-emerald-600" />
                <span>First-Login Security Verification</span>
              </div>
              <button
                type="button"
                onClick={() => setFirstLoginModalOpen(false)}
                className="gf-modal-close-btn"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFirstLoginVerify} style={{ padding: '18px 20px' }} className="space-y-4">
              <p style={{ fontSize: '12px', color: 'var(--mut)', margin: 0, lineHeight: 1.5 }}>
                Enter the verification code dispatched to your registered email to complete your first-time authentication.
              </p>

              {/* Countdown Timer Display */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 14px',
                  borderRadius: '6px',
                  background: firstLoginTimer > 0 ? '#f0fdf4' : '#fff1f2',
                  border: `1px solid ${firstLoginTimer > 0 ? '#bbf7d0' : '#fecdd3'}`,
                  color: firstLoginTimer > 0 ? '#166534' : '#9f1239',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Clock size={16} />
                  <span>
                    TIME LEFT: {String(Math.floor(firstLoginTimer / 60)).padStart(2, '0')}:
                    {String(firstLoginTimer % 60).padStart(2, '0')}
                  </span>
                </div>
                {firstLoginTimer === 0 && (
                  <span style={{ fontSize: '11.5px', fontWeight: 600, color: '#e11d48' }}>Code expired.</span>
                )}
              </div>

              {firstLoginError && (
                <div
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: '#fff0f1',
                    border: '1px solid #f0c8ce',
                    color: 'var(--red)',
                    fontSize: '11.5px',
                    fontWeight: 600,
                  }}
                >
                  {firstLoginError}
                </div>
              )}

              <div className="field">
                <label style={{ fontSize: '11.5px', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  Enter Verification Code <span className="req">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="------"
                  value={firstLoginOtp}
                  onChange={(e) => setFirstLoginOtp(e.target.value.replace(/\D/g, ''))}
                  className="input"
                  style={{
                    width: '100%',
                    height: '42px',
                    fontSize: '18px',
                    fontWeight: 800,
                    letterSpacing: '6px',
                    textAlign: 'center',
                  }}
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '6px' }}>
                <button
                  type="button"
                  onClick={handleFirstLoginResend}
                  disabled={firstLoginResending || firstLoginResendCooldown > 0}
                  className="btn secondary sm"
                  style={{ fontSize: '11.5px' }}
                >
                  {firstLoginResending
                    ? 'Resending…'
                    : firstLoginResendCooldown > 0
                    ? `Resend in ${firstLoginResendCooldown}s`
                    : 'Resend Code'}
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setFirstLoginModalOpen(false)}
                    className="btn secondary sm"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={firstLoginSubmitting || firstLoginOtp.trim().length !== 6 || firstLoginTimer <= 0}
                    className="btn primary sm"
                  >
                    {firstLoginSubmitting ? 'Verifying…' : 'Verify & Continue'}
                  </button>
                </div>
              </div>
            </form>
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
      </div>{/* end right panel */}
      <style>{`
        @media (min-width: 860px) {
          .login-left-panel { display: flex !important; }
        }
      `}</style>
    </div>
  );
}
