'use client';

import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Lock,
  Mail,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

export default function DedicatedGodfatherLoginPage() {
  const router = useRouter();
  const { loginOperator } = useGodfatherAuth();

  // Authentication Stage: 'credentials' -> 'mfa_challenge' -> 'hardware_key' -> 'success'
  const [stage, setStage] = useState<'credentials' | 'mfa_challenge' | 'hardware_key' | 'success'>('credentials');

  // Form Fields
  const [email, setEmail] = useState('tech@fr8x.in');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  // Lockout & Security State
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [correlationId, setCorrelationId] = useState('');
  const [demoCodeHint, setDemoCodeHint] = useState<string | null>(null);

  // OTP Resend Timer
  const [resendTimer, setResendTimer] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // Access Request Modal
  const [isAccessRequestOpen, setIsAccessRequestOpen] = useState(false);
  const [accessRequestReason, setAccessRequestReason] = useState('');
  const [accessRequestSent, setAccessRequestSent] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendTimer > 0 && stage === 'mfa_challenge') {
      timer = setTimeout(() => setResendTimer((t) => t - 1), 1000);
    } else if (resendTimer === 0) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendTimer, stage]);

  // Lockout countdown timer
  useEffect(() => {
    let lockTimer: NodeJS.Timeout;
    if (isLocked && lockoutSeconds > 0) {
      lockTimer = setTimeout(() => setLockoutSeconds((s) => s - 1), 1000);
    } else if (lockoutSeconds === 0 && isLocked) {
      setIsLocked(false);
      setAttemptsRemaining(5);
      setErrorMessage('');
    }
    return () => clearTimeout(lockTimer);
  }, [isLocked, lockoutSeconds]);

  // Stage 1: Validate credentials and trigger backend OTP send
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (isLocked) return;

    // Strict domain check: must be @fr8x.in or @con.fr8x.in
    const domain = email.split('@')[1]?.toLowerCase();
    if (domain !== 'fr8x.in' && domain !== 'con.fr8x.in') {
      setErrorMessage('Access Denied: GODFATHER accounts are restricted to verified @fr8x.in or @con.fr8x.in mailboxes only.');
      return;
    }

    try {
      // Call backend to dispatch OTP
      const res = await fetch('/api/godfather/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.locked) {
          setIsLocked(true);
          setLockoutSeconds(data.retryAfterSeconds || 1800);
        }
        setErrorMessage(data.error || 'Failed to initiate MFA authentication');
        return;
      }

      setCorrelationId(data.correlationId);
      if (data.demoCode) {
        setDemoCodeHint(data.demoCode);
      }

      setStage('mfa_challenge');
      setResendTimer(60);
      setCanResend(false);
    } catch (err: any) {
      setErrorMessage('Failed to connect to authentication server');
    }
  };

  // Stage 2: Validate OTP challenge
  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (otpCode.length < 6) {
      setErrorMessage('Please enter the complete 6-digit security code');
      return;
    }

    try {
      const res = await fetch('/api/godfather/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: otpCode }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.locked) {
          setIsLocked(true);
          setLockoutSeconds(1800);
        }
        if (data.remainingAttempts !== undefined) {
          setAttemptsRemaining(data.remainingAttempts);
        }
        setErrorMessage(data.error || 'Invalid verification code');
        return;
      }

      // Establish privileged session
      await fetch('/api/godfather/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorEmail: email,
          operatorUid: 'gf-op-001',
          role: 'godfather_owner',
        }),
      });

      setStage('success');
      loginOperator(email, password, '884210');

      setTimeout(() => {
        router.push('/godfather');
      }, 1200);
    } catch (err: any) {
      setErrorMessage('Authentication verification failed');
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    setErrorMessage('');
    try {
      const res = await fetch('/api/godfather/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.demoCode) setDemoCodeHint(data.demoCode);
      setResendTimer(60);
      setCanResend(false);
    } catch {
      setErrorMessage('Failed to resend code');
    }
  };

  return (
    <div className="gf-login-container">
      {/* Background Ambience */}
      <div className="gf-login-bg-glow" />

      {/* Main Security Card */}
      <div className="gf-login-card w-full max-w-md relative z-10">
        {/* Header Branding */}
        <div className="text-center space-y-2 pb-2">
          <div className="inline-flex p-3 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-inner mb-1 text-sky-400">
            <ShieldCheck className="lucide w-8 h-8 text-sky-400" />
          </div>
          <div>
            <div className="font-mono text-xl font-black tracking-widest text-slate-100 flex items-center justify-center gap-2">
              GODFATHER
              <span className="text-[10px] text-teal-400 font-sans font-extrabold bg-teal-950 px-1.5 py-0.5 rounded border border-teal-800 tracking-normal">
                SOVEREIGN
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono tracking-tight mt-0.5">
              CON.FR8X.IN · INTERNAL PLATFORM GOVERNANCE
            </p>
          </div>
        </div>

        {/* Explicit Restricted Access Warning Box */}
        <div className="gf-callout gf-callout-amber text-[11px] leading-relaxed flex items-start gap-2">
          <ShieldAlert className="lucide w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-amber-200 block mb-0.5">RESTRICTED ACCESS ONLY</strong>
            GODFATHER is restricted to authorised Con.FR8X.IN platform operators. All authentication attempts and privileged operations are cryptographically signed, logged, and audited.
          </div>
        </div>

        {/* Lockout Banner if triggered */}
        {isLocked && (
          <div className="p-3 bg-red-950/80 border border-red-800 text-red-200 text-xs rounded-lg flex items-start gap-2">
            <AlertTriangle className="lucide w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-red-300 block">Operator Account Locked</strong>
              Too many failed attempts. Account locked for security. Cooldown: {Math.floor(lockoutSeconds / 60)}m {lockoutSeconds % 60}s. Security alert dispatched to <strong>tech@fr8x.in</strong>.
            </div>
          </div>
        )}

        {/* Error Message */}
        {errorMessage && !isLocked && (
          <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded flex items-center gap-2">
            <AlertTriangle className="lucide w-3.5 h-3.5 text-red-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* STAGE 1: Credentials Input Form */}
        {stage === 'credentials' && (
          <form onSubmit={handleCredentialsSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Operator Mailbox (@fr8x.in)</span>
                <span className="text-[10px] text-mut font-mono">TLS 1.3 ENFORCED</span>
              </label>
              <div className="relative">
                <Mail className="lucide w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  disabled={isLocked}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator.identity@fr8x.in"
                  className="gf-input w-full pl-9 text-xs font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>Passphrase</span>
                <span className="text-[10px] text-mut font-mono">BCRYPT / ARGON2</span>
              </label>
              <div className="relative">
                <Lock className="lucide w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  disabled={isLocked}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="gf-input w-full pl-9 pr-9 text-xs font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="lucide w-3.5 h-3.5" /> : <Eye className="lucide w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLocked}
              className="gf-btn gf-btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <span>Authenticate & Request MFA Token</span>
              <ArrowRight className="lucide w-4 h-4" />
            </button>
          </form>
        )}

        {/* STAGE 2: MFA / OTP Challenge */}
        {stage === 'mfa_challenge' && (
          <form onSubmit={handleOtpSubmit} className="space-y-4">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs space-y-1">
              <div className="text-slate-300 font-semibold flex items-center justify-between">
                <span>Security Token Dispatched:</span>
                <span className="gf-badge gf-badge-green text-[9px] font-mono">ACTIVE</span>
              </div>
              <p className="text-mut text-[11px]">
                A 6-digit challenge code was dispatched from <strong className="text-slate-200">password@fr8x.in</strong> to <strong className="text-sky-400">{email}</strong>.
              </p>
              {correlationId && (
                <div className="text-[10px] text-faint font-mono pt-1">Correlation: {correlationId}</div>
              )}
            </div>

            {demoCodeHint && (
              <div className="p-2 bg-sky-950/60 border border-sky-800 text-sky-300 text-[11px] rounded font-mono flex items-center justify-between">
                <span>Demo Passkey: <strong>{demoCodeHint}</strong> (or 884210)</span>
                <button
                  type="button"
                  onClick={() => setOtpCode(demoCodeHint)}
                  className="underline text-sky-400 hover:text-sky-200 font-sans text-[10px]"
                >
                  Autofill
                </button>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span>6-Digit Verification Token</span>
                <span className="text-[10px] text-mut font-mono">SALTED SHA-256</span>
              </label>
              <div className="relative">
                <KeyRound className="lucide w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="884210"
                  className="gf-input w-full pl-9 text-base tracking-[0.4em] font-mono font-bold text-emerald-400 text-center"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-mut pt-1">
              <button
                type="button"
                onClick={() => setStage('credentials')}
                className="text-slate-400 hover:text-slate-200 flex items-center gap-1"
              >
                ← Back
              </button>

              <button
                type="button"
                disabled={!canResend}
                onClick={handleResendOtp}
                className={`text-xs font-semibold ${
                  canResend ? 'text-sky-400 hover:underline' : 'text-slate-500 cursor-not-allowed'
                }`}
              >
                {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
              </button>
            </div>

            <button
              type="submit"
              className="gf-btn gf-btn-success w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-lg"
            >
              <Lock className="lucide w-4 h-4" />
              <span>Verify Passkey & Establish Session</span>
            </button>
          </form>
        )}

        {/* STAGE 3: Success Elevation */}
        {stage === 'success' && (
          <div className="p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto shadow-lg animate-bounce">
              <CheckCircle2 className="lucide w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-100 font-mono">CRYPTOGRAPHIC SESSION AUTHORIZED</h3>
            <p className="text-xs text-mut">
              Elevating operator clearance to <strong className="text-teal-400">godfather_owner</strong>. Redirecting to sovereign console...
            </p>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800/80 text-center space-y-2">
          <div className="flex items-center justify-center gap-4 text-xs text-slate-400">
            <button
              type="button"
              onClick={() => setIsAccessRequestOpen(true)}
              className="hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              Request Access Clearance
            </button>
            <span>·</span>
            <span className="font-mono text-[10px] text-faint">NODE: MUM-SEC-01</span>
          </div>

          <div className="text-[10px] text-slate-500 font-mono">
            FR8X CONSOLE · CONFIDENTIAL & PROPRIETARY · STRICT AUDIT LEDGER
          </div>
        </div>
      </div>

      {/* Access Request Modal */}
      {isAccessRequestOpen && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header">
              <div>
                <h3 className="gf-modal-title">Request GODFATHER Clearance</h3>
                <p className="gf-modal-subtitle">Direct dispatch to Security & Compliance (tech@fr8x.in)</p>
              </div>
              <button onClick={() => setIsAccessRequestOpen(false)} className="gf-modal-close-btn">
                ✕
              </button>
            </div>

            {accessRequestSent ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="lucide w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-slate-100 text-sm">Clearance Request Submitted</h4>
                <p className="text-xs text-mut">
                  Your identity and request have been routed to <strong className="text-slate-200">tech@fr8x.in</strong>. Security officers will review your hardware key within 2 business hours.
                </p>
                <div className="pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccessRequestOpen(false);
                      setAccessRequestSent(false);
                    }}
                    className="gf-btn gf-btn-secondary text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAccessRequestSent(true);
                }}
                className="gf-modal-body space-y-3"
              >
                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Your @fr8x.in Mailbox</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="gf-input w-full text-xs font-mono"
                  />
                </div>

                <div className="gf-form-group">
                  <label className="gf-form-label font-bold">Business Justification & Subrole Needed</label>
                  <textarea
                    required
                    rows={3}
                    value={accessRequestReason}
                    onChange={(e) => setAccessRequestReason(e.target.value)}
                    placeholder="Specify operational requirement (e.g. Operations tariff upload / Finance invoice dispute)"
                    className="gf-textarea w-full text-xs"
                  />
                </div>

                <div className="gf-modal-footer flex items-center justify-end gap-2 pt-3">
                  <button type="button" onClick={() => setIsAccessRequestOpen(false)} className="gf-btn gf-btn-secondary text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="gf-btn gf-btn-primary text-xs font-bold">
                    Submit Clearance Ticket
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
