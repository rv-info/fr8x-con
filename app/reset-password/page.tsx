'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  Mail,
  Loader2,
} from 'lucide-react';

function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // OTP Workflow State
  const [otpStage, setOtpStage] = useState<'request' | 'verify'>('request');
  const [resendCooldown, setResendCooldown] = useState(0);

  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    const qToken = searchParams.get('token');
    const qEmail = searchParams.get('email');
    const qOtp = searchParams.get('otp');

    if (qToken) setToken(qToken.trim());
    if (qEmail) setEmail(qEmail.trim());
    if (qOtp) {
      setOtp(qOtp.replace(/\D/g, '').slice(0, 6));
      setOtpStage('verify');
    }
  }, [searchParams]);

  // Handle Resend Cooldown Timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // 1. Request OTP Code to Email
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    const targetEmail = email.toLowerCase().trim();
    if (!targetEmail || !targetEmail.includes('@')) {
      setErrorMessage('Please enter a valid corporate email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail, action: 'request' }),
      });
      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to dispatch OTP. Please verify email and try again.');
        return;
      }

      setOtpStage('verify');
      setResendCooldown(60);
      setSuccessMessage(data.message || `A 6-digit recovery OTP has been dispatched to ${targetEmail}.`);
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Network connection error. Please try again.');
    }
  };

  // 2. Verify OTP and Set New Password
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please enter both new password and confirmation password.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('New password and confirm password do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters in length.');
      return;
    }

    if (!token && (!email || !otp)) {
      setErrorMessage('A valid reset token or corporate email and 6-digit OTP are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: Record<string, string> = {
        newPassword,
        confirmPassword,
      };

      if (token) {
        payload.token = token;
      } else {
        payload.email = email.toLowerCase().trim();
        payload.otp = otp.trim();
        payload.action = 'verify_and_reset';
      }

      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Password reset failed. Please request a new OTP code.');
        return;
      }

      setIsCompleted(true);
      setSuccessMessage(data.message || 'Password successfully updated.');
    } catch {
      setIsSubmitting(false);
      setErrorMessage('Network connection error. Please try again.');
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--fr8x-background, #0f172a)',
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
          maxWidth: '440px',
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
          padding: '36px 28px',
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
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
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
            }}
          >
            <KeyRound size={24} />
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
            RESET PASSWORD
          </h1>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '4px 0 0' }}>
            FR8X Sovereign Authentication Engine
          </p>
        </div>

        {errorMessage && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              color: '#dc2626',
              fontSize: '13px',
            }}
          >
            <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {isCompleted ? (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: '#dcfce7',
                color: '#16a34a',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <CheckCircle2 size={32} />
            </div>
            <h3 style={{ fontSize: '17px', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
              Password Reset Complete
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.5, margin: '0 0 24px' }}>
              {successMessage || 'Your credentials have been securely updated. A confirmation email has been dispatched from password@fr8x.in.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/login')}
              style={{
                width: '100%',
                height: '42px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              Proceed to Sign In <ArrowRight size={16} />
            </button>
          </div>
        ) : !token && otpStage === 'request' ? (
          /* STEP 1: REQUEST OTP */
          <form onSubmit={handleRequestOtp}>
            <div
              style={{
                padding: '12px 14px',
                background: '#f0f9ff',
                border: '1px solid #bae6fd',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '12px',
                color: '#0369a1',
                lineHeight: 1.45,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
              }}
            >
              <Mail size={18} style={{ color: '#0284c7', flexShrink: 0 }} />
              <span>
                Enter your registered corporate email address. A secure 6-digit one-time password (OTP) will be dispatched to your inbox.
              </span>
            </div>

            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Corporate Email Address <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  style={{
                    width: '100%',
                    height: '40px',
                    paddingLeft: '36px',
                    paddingRight: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email.trim()}
              style={{
                width: '100%',
                height: '42px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isSubmitting || !email.trim() ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || !email.trim() ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background 0.15s ease',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Dispatching Recovery OTP...
                </>
              ) : (
                <>
                  <span>Send Recovery OTP Code</span> <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: VERIFY OTP AND SET PASSWORD */
          <form onSubmit={handleSubmit}>
            {!token && (
              <>
                <div
                  style={{
                    padding: '10px 12px',
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    marginBottom: '14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '12px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                    <Mail size={14} style={{ color: '#0284c7', flexShrink: 0 }} />
                    <span style={{ color: '#0f172a', fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      {email}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStage('request');
                      setErrorMessage('');
                      setSuccessMessage('');
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontSize: '11.5px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '2px 4px',
                    }}
                  >
                    Change Email
                  </button>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#334155' }}>
                      6-Digit Recovery OTP <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <button
                      type="button"
                      disabled={resendCooldown > 0 || isSubmitting}
                      onClick={handleRequestOtp}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? '#94a3b8' : '#0284c7',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: resendCooldown > 0 ? 'default' : 'pointer',
                        padding: 0,
                      }}
                    >
                      {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend OTP Code'}
                    </button>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••••"
                    required
                    style={{
                      width: '100%',
                      height: '42px',
                      fontSize: '18px',
                      letterSpacing: '6px',
                      textAlign: 'center',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      boxSizing: 'border-box',
                    }}
                    autoFocus
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '14px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                New Password (minimum 8 characters) <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new strong password"
                  required
                  style={{
                    width: '100%',
                    height: '40px',
                    paddingLeft: '36px',
                    paddingRight: '36px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#334155', marginBottom: '6px' }}>
                Confirm New Password <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '13px', color: '#94a3b8' }} />
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  required
                  style={{
                    width: '100%',
                    height: '40px',
                    paddingLeft: '36px',
                    paddingRight: '36px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    fontSize: '13px',
                    boxSizing: 'border-box',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  style={{ position: 'absolute', right: '10px', top: '10px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || (!token && otp.length !== 6) || !newPassword}
              style={{
                width: '100%',
                height: '42px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '14px',
                cursor: isSubmitting || (!token && otp.length !== 6) || !newPassword ? 'not-allowed' : 'pointer',
                opacity: isSubmitting || (!token && otp.length !== 6) || !newPassword ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Updating Credentials...
                </>
              ) : (
                'Save New Password & Unlock'
              )}
            </button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '20px', fontSize: '12px', color: '#64748b' }}>
          Remember your password?{' '}
          <Link href="/login" style={{ color: '#0284c7', fontWeight: 600 }}>
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Loader2 size={32} className="animate-spin" color="#0284c7" />
        </div>
      }
    >
      <ResetPasswordInner />
    </Suspense>
  );
}
