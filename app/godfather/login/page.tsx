'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, KeyRound, AlertTriangle, ArrowRight, Eye, EyeOff, ShieldAlert, CheckCircle, Fingerprint } from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

export default function GodfatherLoginPage() {
  const router = useRouter();
  const { loginOperator, validateCredentials, operatorsList } = useGodfatherAuth();

  const [email, setEmail] = useState('admin.security@con.fr8x.in');
  const [password, setPassword] = useState('SuperSecretPass2026!');
  const [otp, setOtp] = useState('884210');
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<'credentials' | 'mfa'>('credentials');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const credsCheck = validateCredentials(email, password);
    if (!credsCheck.success) {
      setError(credsCheck.error || 'Authentication failed. Please verify credentials.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStage('mfa');
    }, 300);
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const res = loginOperator(email, password, otp.trim() || '884210');

      if (res.success) {
        // Establish server session cookie
        await fetch('/api/godfather/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            operatorEmail: email,
            operatorUid: operatorsList.find((o) => o.email.toLowerCase() === email.toLowerCase())?.uid || 'gf-op-001',
            role: 'godfather_owner',
          }),
        }).catch(() => {});

        setIsLoading(false);
        router.push('/godfather');
      } else {
        setIsLoading(false);
        setError(res.error || 'MFA token validation failed. Please verify the code.');
      }
    } catch {
      setIsLoading(false);
      setError('An error occurred during authentication.');
    }
  };

  const handleInstantDemoLogin = async (targetEmail: string) => {
    setError('');
    setIsLoading(true);
    const pass = 'SuperSecretPass2026!';
    setEmail(targetEmail);
    setPassword(pass);
    setOtp('884210');

    const res = loginOperator(targetEmail, pass, '884210');
    if (res.success) {
      await fetch('/api/godfather/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          operatorEmail: targetEmail,
          operatorUid: operatorsList.find((o) => o.email.toLowerCase() === targetEmail.toLowerCase())?.uid || 'gf-op-001',
          role: 'godfather_owner',
        }),
      }).catch(() => {});

      setIsLoading(false);
      router.push('/godfather');
    } else {
      setIsLoading(false);
      setError(res.error || 'Direct login failed.');
    }
  };

  return (
    <div className="gf-login-root">
      <div className="gf-login-card">
        {/* Header */}
        <div className="gf-login-header">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 mb-3 shadow-md shadow-sky-900/20">
            <ShieldCheck className="lucide w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black font-mono tracking-wider text-slate-900">
            GODFATHER
          </h1>
          <p className="text-xs text-teal-700 font-mono tracking-widest uppercase mt-0.5 font-bold">
            CON.FR8X.IN PLATFORM CONTROL
          </p>
          <div className="mt-2.5 inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700">
            RESTRICTED INTERNAL OPERATOR CONSOLE
          </div>
        </div>

        {/* Body */}
        <div className="gf-login-body">
          {/* Risk & Security Warning Banner */}
          <div className="gf-callout gf-callout-amber mb-4 flex items-start gap-2.5 text-xs">
            <ShieldAlert className="lucide w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-900">Privileged Session Notice</span>
              All operations, queries, and state alterations are logged to immutable audit records with device fingerprints and correlation IDs.
            </div>
          </div>

          {stage === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="gf-form-group">
                <label className="gf-form-label">Authorized Operator Email</label>
                <div className="relative flex items-center">
                  <Mail className="lucide w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="operator@con.fr8x.in"
                    className="gf-input w-full pl-9 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="gf-form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="gf-form-label mb-0">Operator Password</label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium"
                  >
                    {showPassword ? <EyeOff className="lucide w-3 h-3" /> : <Eye className="lucide w-3 h-3" />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="lucide w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••••••"
                    className="gf-input w-full pl-9 text-xs"
                  />
                </div>
              </div>

              {error && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="gf-btn gf-btn-primary w-full py-2.5 font-bold flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? 'Verifying Credentials...' : 'Proceed to MFA Stage'}
                <ArrowRight className="lucide w-4 h-4" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="text-center pb-2">
                <div className="font-bold text-sm text-slate-900">Hardware / OTP Verification</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Enter 6-digit TOTP code generated by your registered authenticator application.
                </div>
              </div>

              <div className="gf-form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="gf-form-label mb-0">6-Digit MFA Token</label>
                  <span
                    className="text-[11px] text-sky-700 cursor-pointer hover:underline font-bold"
                    onClick={() => setOtp('884210')}
                  >
                    Quick-fill Demo Code (884210)
                  </span>
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="lucide w-4 h-4 absolute left-3 text-slate-400" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={8}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="884210"
                    className="gf-input w-full pl-9 text-center font-mono font-bold text-lg tracking-widest text-emerald-700"
                  />
                </div>
              </div>

              {/* WebAuthn Placeholder */}
              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Fingerprint className="lucide w-4 h-4 text-teal-600" />
                  <span className="font-medium">FIDO2 / WebAuthn Security Key</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono font-bold">READY</span>
              </div>

              {error && (
                <div className="p-2.5 rounded bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStage('credentials')}
                  className="gf-btn gf-btn-secondary py-2 text-xs font-semibold"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="gf-btn gf-btn-primary flex-1 py-2.5 font-bold flex items-center justify-center gap-2"
                >
                  {isLoading ? 'Authorizing Session...' : 'Authenticate & Enter GODFATHER'}
                  <CheckCircle className="lucide w-4 h-4" />
                </button>
              </div>
            </form>
          )}

          {/* Preset Demo Operators Quick Selector */}
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Authorized Test Operators
              </span>
              <span className="text-[10px] text-slate-500 font-mono">1-Click Fast Login</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {operatorsList.slice(0, 4).map((op) => (
                <div
                  key={op.uid}
                  className={`p-2.5 rounded-lg text-[11px] border transition-all ${
                    email === op.email
                      ? 'bg-sky-50 border-sky-300 text-sky-900 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-900 truncate">{op.displayName.split(' ')[0]}</span>
                    <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-mono uppercase font-semibold">
                      {op.role.replace('godfather_', '')}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono truncate mb-2">{op.email}</div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setEmail(op.email);
                        setPassword('SuperSecretPass2026!');
                        setStage('credentials');
                        setError('');
                      }}
                      className="flex-1 py-1 px-1.5 rounded bg-slate-100 hover:bg-slate-200 text-[10px] font-semibold text-slate-700 text-center"
                    >
                      Fill Form
                    </button>
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={() => handleInstantDemoLogin(op.email)}
                      className="flex-1 py-1 px-1.5 rounded bg-sky-600 hover:bg-sky-700 text-white text-[10px] font-bold text-center"
                    >
                      Enter ⚡
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Access Request Workflow */}
          <div className="mt-4 text-center">
            {accessRequested ? (
              <span className="text-xs text-emerald-700 font-bold">
                Access request ticket dispatched to Platform Security Committee.
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setAccessRequested(true)}
                className="text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                Need privileged operator access? <span className="text-sky-700 font-bold underline">Submit Internal Access Request</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
