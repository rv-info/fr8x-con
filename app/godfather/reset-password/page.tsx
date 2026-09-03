'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  KeyRound,
  RotateCcw,
} from 'lucide-react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResetDone, setIsResetDone] = useState(false);

  useEffect(() => {
    const qEmail = searchParams.get('email');
    const qOtp = searchParams.get('otp') || searchParams.get('token');
    if (qEmail) setEmail(qEmail);
    if (qOtp) setOtp(qOtp.replace(/\D/g, '').slice(0, 6));
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!email.trim() || !otp.trim() || !newPassword || !confirmPassword) {
      setErrorMessage('All fields are required.');
      return;
    }

    if (otp.trim().length !== 6) {
      setErrorMessage('Please provide a valid 6-digit recovery OTP code.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirmation password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/godfather/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          otp: otp.trim(),
          newPassword,
          confirmPassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Password reset failed. Please check your verification code.');
        setIsSubmitting(false);
        return;
      }

      setIsResetDone(true);
      setSuccessMessage(data.message || 'Password successfully updated.');
    } catch {
      setErrorMessage('Network connection error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="gfl-clean-root">
      <header className="gfl-clean-topbar">
        <div className="gfl-topbar-brand">
          <span className="gfl-status-pill">
            <span className="gfl-status-indicator" />
            SECURED OPERATOR RECOVERY
          </span>
          <span className="gfl-topbar-divider">·</span>
          <span className="gfl-topbar-node">NODE: MUM-SEC-01</span>
        </div>
      </header>

      <main className="gfl-clean-wrapper">
        <div className="gfl-clean-card" style={{ maxWidth: '440px' }}>
          <div className="gfl-clean-card-stripe" />

          <div className="gfl-clean-brand-header">
            <div className="gfl-clean-logo-badge">
              <KeyRound className="w-8 h-8 text-blue-600" strokeWidth={1.75} />
            </div>
            <h1 className="gfl-clean-title">RESET PASSPHRASE</h1>
            <p className="gfl-clean-subtitle">FR8X GODFATHER CONSOLE</p>
          </div>

          {errorMessage && (
            <div className="gfl-clean-alert">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {isResetDone ? (
            <div className="gfl-clean-form">
              <div className="gfl-recovery-success">
                <div className="gfl-recovery-success-icon">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="gfl-recovery-title">Passphrase Reset Complete</h3>
                <p className="gfl-recovery-desc">
                  Your operator credentials have been updated successfully. A confirmation notice has been dispatched via email.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/godfather/login')}
                  className="gfl-clean-btn gfl-clean-btn-primary"
                >
                  Proceed to Sign In
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="gfl-clean-form">
              <div className="gfl-clean-field">
                <label className="gfl-clean-label">Registered Mailbox</label>
                <div className="gfl-clean-input-box">
                  <Mail className="gfl-clean-input-icon" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tech@fr8x.in"
                    className="gfl-clean-input"
                  />
                </div>
              </div>

              <div className="gfl-clean-field">
                <label className="gfl-clean-label">6-Digit Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="______"
                  className="gfl-clean-input gfl-clean-otp-input"
                  autoFocus
                />
              </div>

              <div className="gfl-clean-field">
                <label className="gfl-clean-label">New Passphrase</label>
                <div className="gfl-clean-input-box">
                  <Lock className="gfl-clean-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="gfl-clean-input gfl-clean-input-pr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="gfl-clean-eye-btn"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="gfl-clean-field">
                <label className="gfl-clean-label">Confirm New Passphrase</label>
                <div className="gfl-clean-input-box">
                  <Lock className="gfl-clean-input-icon" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter new passphrase"
                    className="gfl-clean-input gfl-clean-input-pr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="gfl-clean-eye-btn"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="gfl-clean-btn gfl-clean-btn-primary"
                style={{ marginTop: '12px' }}
              >
                {isSubmitting ? (
                  <>
                    <span className="gfl-clean-spinner" />
                    <span>Resetting Passphrase…</span>
                  </>
                ) : (
                  <>
                    <span>Reset Passphrase</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => router.push('/godfather/login')}
                className="gfl-clean-btn gfl-clean-btn-outline"
              >
                ← Return to Sign In
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default function GodfatherResetPasswordPage() {
  return (
    <Suspense fallback={<div className="gfl-clean-root"><div className="gfl-clean-wrapper"><span className="gfl-clean-spinner" /></div></div>}>
      <ResetPasswordForm />
    </Suspense>
  );
}
