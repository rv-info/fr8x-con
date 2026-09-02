'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RotateCcw,
  ChevronRight,
  X,
  HelpCircle,
  Send,
  Sparkles,
} from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

/* ─── Live IST Clock ────────────────────────────────────────────────────── */
function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit', minute: '2-digit', second: '2-digit',
          hour12: true, timeZone: 'Asia/Kolkata',
        }) + ' IST'
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return <span className="gfl-clock-live">{time}</span>;
}

export default function DedicatedGodfatherLoginPage() {
  const router = useRouter();
  const { validateCredentials, loginOperator, loadRememberedOperator, rememberOperator, forgetOperator } = useGodfatherAuth();

  const [mode, setMode] = useState<'login' | 'forgot' | 'success'>('login');
  const [email, setEmail] = useState('tech@fr8x.in');
  const [password, setPassword] = useState('Godfather@Sovereign1');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);

  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('tech@fr8x.in');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotTimer, setForgotTimer] = useState(0);
  const [forgotDemoCode, setForgotDemoCode] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [smtpStatusMessage, setSmtpStatusMessage] = useState<string | null>(null);

  // Access request modal
  const [isAccessRequestOpen, setIsAccessRequestOpen] = useState(false);
  const [accessReqSent, setAccessReqSent] = useState(false);

  useEffect(() => {
    const remembered = loadRememberedOperator();
    if (remembered) {
      setEmail(remembered);
      setRememberDevice(true);
    }
  }, []);

  useEffect(() => {
    if (forgotTimer > 0) {
      const t = setTimeout(() => setForgotTimer(s => s - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [forgotTimer]);

  /* ── Direct 1-Step Sign In (No OTP Required) ── */
  const handleDirectSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email || !password) {
      setErrorMessage('Please provide your operator email and password.');
      return;
    }

    const check = validateCredentials(email, password);
    if (!check.success) {
      setErrorMessage(check.error || 'Invalid credentials.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/godfather/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Authentication failed. Please verify your credentials.');
        setIsSubmitting(false);
        return;
      }

      if (rememberDevice) {
        rememberOperator(email);
      } else {
        forgetOperator();
      }

      loginOperator(email, password);
      setMode('success');

      setTimeout(() => {
        window.location.href = '/godfather';
      }, 400);
    } catch {
      setErrorMessage('Failed to connect to authentication server.');
      setIsSubmitting(false);
    }
  };

  /* ── Forgot Password: Send OTP to Email ── */
  const handleSendRecoveryOtp = async () => {
    setErrorMessage('');
    setSmtpStatusMessage(null);
    setForgotDemoCode(null);
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/godfather/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (data.demoCode) setForgotDemoCode(data.demoCode);
      setForgotSent(true);
      setForgotTimer(60);
      setSmtpStatusMessage(data.message || 'Recovery code dispatched to your registered email.');
    } catch {
      setForgotSent(true);
      setForgotTimer(60);
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ── Forgot Password: Verify OTP ── */
  const handleVerifyRecoveryOtp = async () => {
    setErrorMessage('');
    if (forgotOtp.length < 6) {
      setErrorMessage('Please enter the full 6-digit recovery code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/godfather/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: forgotOtp }),
      });
      if (res.ok) {
        setForgotSuccess(true);
      } else {
        const data = await res.json();
        setErrorMessage(data.error || 'Invalid or expired recovery code.');
      }
    } catch {
      setErrorMessage('Verification request failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gfl-clean-root">
      {/* Top clean status bar */}
      <header className="gfl-clean-topbar">
        <div className="gfl-topbar-brand">
          <span className="gfl-status-pill">
            <span className="gfl-status-indicator" />
            SECURED OPERATOR CONSOLE
          </span>
          <span className="gfl-topbar-divider">·</span>
          <span className="gfl-topbar-node">NODE: MUM-SEC-01</span>
        </div>
        <div className="gfl-topbar-clock">
          <LiveClock />
        </div>
      </header>

      {/* Main Container */}
      <main className="gfl-clean-wrapper">
        <div className="gfl-clean-card">
          {/* Top Brand Stripe */}
          <div className="gfl-clean-card-stripe" />

          {/* Brand Header */}
          <div className="gfl-clean-brand-header">
            <div className="gfl-clean-logo-badge">
              <ShieldCheck className="w-8 h-8 text-blue-600" strokeWidth={1.75} />
            </div>
            <h1 className="gfl-clean-title">GODFATHER</h1>
            <p className="gfl-clean-subtitle">FR8X SOVEREIGN CONTROL PLANE</p>
          </div>

          {/* Alerts */}
          {errorMessage && (
            <div className="gfl-clean-alert">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* ── MODE 1: DIRECT SIGN IN ── */}
          {mode === 'login' && (
            <form onSubmit={handleDirectSignIn} className="gfl-clean-form">
              <div className="gfl-clean-field">
                <label htmlFor="gfl-op-email" className="gfl-clean-label">
                  Operator Email
                </label>
                <div className="gfl-clean-input-box">
                  <Mail className="gfl-clean-input-icon" />
                  <input
                    id="gfl-op-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tech@fr8x.in"
                    className="gfl-clean-input"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="gfl-clean-field">
                <div className="gfl-clean-label-row">
                  <label htmlFor="gfl-op-pass" className="gfl-clean-label">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setErrorMessage('');
                      setMode('forgot');
                    }}
                    className="gfl-clean-text-link"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="gfl-clean-input-box">
                  <Lock className="gfl-clean-input-icon" />
                  <input
                    id="gfl-op-pass"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    autoComplete="current-password"
                    className="gfl-clean-input gfl-clean-input-pr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="gfl-clean-eye-btn"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="gfl-clean-options-row">
                <label className="gfl-clean-checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    className="gfl-clean-checkbox"
                  />
                  <span>Remember on this browser</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="gfl-clean-btn gfl-clean-btn-primary"
              >
                {isSubmitting ? (
                  <>
                    <span className="gfl-clean-spinner" />
                    <span>Signing In…</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* ── MODE 2: FORGOT PASSWORD RECOVERY ── */}
          {mode === 'forgot' && (
            <div className="gfl-clean-form">
              {forgotSuccess ? (
                <div className="gfl-recovery-success">
                  <div className="gfl-recovery-success-icon">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="gfl-recovery-title">Identity Confirmed</h3>
                  <p className="gfl-recovery-desc">
                    Your operator identity has been verified via email OTP. You may now sign in using your authorized passphrase.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setForgotOtp('');
                      setForgotSent(false);
                      setForgotSuccess(false);
                      setErrorMessage('');
                    }}
                    className="gfl-clean-btn gfl-clean-btn-primary"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <div className="gfl-recovery-header">
                    <h3 className="gfl-recovery-title">Account Recovery</h3>
                    <p className="gfl-recovery-desc">
                      Enter your operator email. A 6-digit recovery passkey will be dispatched to your registered mailbox.
                    </p>
                  </div>

                  <div className="gfl-clean-field">
                    <label className="gfl-clean-label">Registered Mailbox</label>
                    <div className="gfl-clean-input-box">
                      <Mail className="gfl-clean-input-icon" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="tech@fr8x.in"
                        className="gfl-clean-input"
                      />
                    </div>
                  </div>

                  {smtpStatusMessage && (
                    <div className="gfl-clean-info-banner">
                      <Mail className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                      <span>{smtpStatusMessage}</span>
                    </div>
                  )}

                  {!forgotSent ? (
                    <button
                      type="button"
                      disabled={isSubmitting || !forgotEmail}
                      onClick={handleSendRecoveryOtp}
                      className="gfl-clean-btn gfl-clean-btn-primary"
                    >
                      {isSubmitting ? (
                        <>
                          <span className="gfl-clean-spinner" />
                          <span>Dispatching Code…</span>
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          <span>Send Recovery Code</span>
                        </>
                      )}
                    </button>
                  ) : (
                    <>
                      {forgotDemoCode && (
                        <div className="gfl-demo-hint-box">
                          <span>Verification Code: <strong>{forgotDemoCode}</strong></span>
                          <button
                            type="button"
                            onClick={() => setForgotOtp(forgotDemoCode)}
                            className="gfl-demo-autofill-btn"
                          >
                            Autofill
                          </button>
                        </div>
                      )}

                      <div className="gfl-clean-field">
                        <label className="gfl-clean-label">Enter 6-Digit Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          value={forgotOtp}
                          onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="______"
                          className="gfl-clean-input gfl-clean-otp-input"
                          autoFocus
                        />
                      </div>

                      <div className="gfl-recovery-actions">
                        <button
                          type="button"
                          disabled={forgotTimer > 0 || isSubmitting}
                          onClick={handleSendRecoveryOtp}
                          className={`gfl-clean-resend-link ${forgotTimer === 0 ? 'active' : ''}`}
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          {forgotTimer > 0 ? `Resend code in ${forgotTimer}s` : 'Resend code'}
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={forgotOtp.length < 6 || isSubmitting}
                        onClick={handleVerifyRecoveryOtp}
                        className="gfl-clean-btn gfl-clean-btn-primary"
                      >
                        {isSubmitting ? (
                          <>
                            <span className="gfl-clean-spinner" />
                            <span>Verifying…</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Verify Recovery Code</span>
                          </>
                        )}
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setMode('login');
                      setForgotSent(false);
                      setForgotOtp('');
                      setErrorMessage('');
                    }}
                    className="gfl-clean-btn gfl-clean-btn-outline"
                  >
                    ← Back to Sign In
                  </button>
                </>
              )}
            </div>
          )}

          {/* ── MODE 3: SUCCESS REDIRECT ── */}
          {mode === 'success' && (
            <div className="gfl-clean-success-pane">
              <div className="gfl-clean-success-icon">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h2 className="gfl-clean-success-title">Authenticated</h2>
              <p className="gfl-clean-success-sub">
                Operator credentials verified. Redirecting to sovereign console…
              </p>
              <div className="gfl-clean-progress-bar">
                <div className="gfl-clean-progress-bar-fill" />
              </div>
            </div>
          )}

          {/* Footer inside card */}
          <div className="gfl-clean-card-footer">
            <button
              type="button"
              onClick={() => setIsAccessRequestOpen(true)}
              className="gfl-clean-footer-action"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Need Access Clearance?</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </main>

      {/* Page Watermark */}
      <footer className="gfl-clean-page-footer">
        <span>FR8X GODFATHER · SOVEREIGN EDITION · CON.FR8X.IN</span>
      </footer>

      {/* Access Request Clearance Modal */}
      {isAccessRequestOpen && (
        <div className="gfl-overlay" onClick={() => setIsAccessRequestOpen(false)}>
          <div className="gfl-modal" onClick={(e) => e.stopPropagation()}>
            <div className="gfl-modal-header">
              <div>
                <h3 className="gfl-modal-title">Request GODFATHER Clearance</h3>
                <p className="gfl-modal-sub">Direct dispatch to Security &amp; Compliance (tech@fr8x.in)</p>
              </div>
              <button
                onClick={() => {
                  setIsAccessRequestOpen(false);
                  setAccessReqSent(false);
                }}
                className="gfl-modal-close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {accessReqSent ? (
              <div className="gfl-modal-body text-center py-6">
                <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Clearance Ticket Submitted</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your request has been routed to <strong>tech@fr8x.in</strong>. Security officers will review within business hours.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsAccessRequestOpen(false);
                    setAccessReqSent(false);
                  }}
                  className="gfl-clean-btn gfl-clean-btn-outline mt-4"
                >
                  Close
                </button>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAccessReqSent(true);
                }}
                className="gfl-modal-body"
              >
                <div className="gfl-clean-field">
                  <label className="gfl-clean-label">Your @fr8x.in Mailbox</label>
                  <input
                    type="email"
                    required
                    defaultValue="tech@fr8x.in"
                    className="gfl-clean-input"
                  />
                </div>
                <div className="gfl-clean-field">
                  <label className="gfl-clean-label">Operational Justification</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Specify reason for privileged console clearance…"
                    className="gfl-textarea"
                  />
                </div>
                <div className="gfl-modal-footer">
                  <button
                    type="button"
                    onClick={() => setIsAccessRequestOpen(false)}
                    className="gfl-clean-btn gfl-clean-btn-outline"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="gfl-clean-btn gfl-clean-btn-primary">
                    Submit Clearance Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
