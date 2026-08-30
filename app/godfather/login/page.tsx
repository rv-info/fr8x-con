'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Lock, Mail, KeyRound, AlertTriangle, ArrowRight, Eye, EyeOff, ShieldAlert, CheckCircle, Fingerprint } from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

export default function GodfatherLoginPage() {
  const router = useRouter();
  const { loginOperator, operatorsList } = useGodfatherAuth();

  const [email, setEmail] = useState('admin.security@con.fr8x.in');
  const [password, setPassword] = useState('SuperSecretPass2026!');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stage, setStage] = useState<'credentials' | 'mfa'>('credentials');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [accessRequested, setAccessRequested] = useState(false);

  const handleCredentialsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.toLowerCase().endsWith('@con.fr8x.in') && !email.toLowerCase().endsWith('@fr8x.in')) {
      setError('Access Restricted: Only authorized Con.FR8X.IN platform operators with custom claims may authenticate.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      // Advance to MFA Stage
      setStage('mfa');
    }, 400);
  };

  const handleMfaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const res = loginOperator(email, password, otp.trim());
      setIsLoading(false);

      if (res.success) {
        router.push('/godfather');
      } else {
        setError(res.error || 'Authentication failed. Please verify credentials.');
      }
    }, 400);
  };

  return (
    <div className="gf-login-root">
      <div className="gf-login-card">
        {/* Header */}
        <div className="gf-login-header">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-600 to-teal-500 mb-3 shadow-lg shadow-sky-900/50">
            <ShieldCheck className="lucide w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold font-mono tracking-wider text-slate-100">
            GODFATHER
          </h1>
          <p className="text-xs text-teal-400 font-mono tracking-widest uppercase mt-0.5">
            CON.FR8X.IN PLATFORM CONTROL
          </p>
          <div className="mt-2.5 inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            RESTRICTED INTERNAL OPERATOR CONSOLE
          </div>
        </div>

        {/* Body */}
        <div className="gf-login-body">
          {/* Risk & Security Warning Banner */}
          <div className="gf-callout gf-callout-amber mb-4 flex items-start gap-2.5 text-xs">
            <ShieldAlert className="lucide w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold block text-amber-300">Privileged Session Notice</span>
              All operations, queries, and state alterations are logged to immutable audit records with device fingerprints and correlation IDs.
            </div>
          </div>

          {stage === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-4">
              <div className="gf-form-group">
                <label className="gf-form-label">Authorized Operator Email</label>
                <div className="relative flex items-center">
                  <Mail className="lucide w-4 h-4 absolute left-3 text-slate-500" />
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
                    className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff className="lucide w-3 h-3" /> : <Eye className="lucide w-3 h-3" />}
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock className="lucide w-4 h-4 absolute left-3 text-slate-500" />
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
                <div className="p-2 rounded bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold">
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
                <div className="font-bold text-sm text-slate-200">Hardware / OTP Verification</div>
                <div className="text-xs text-mut mt-0.5">
                  Enter 6-digit TOTP code generated by your registered authenticator application.
                </div>
              </div>

              <div className="gf-form-group">
                <div className="flex items-center justify-between mb-1">
                  <label className="gf-form-label mb-0">6-Digit MFA Token</label>
                  <span
                    className="text-[11px] text-sky-400 cursor-pointer hover:underline"
                    onClick={() => setOtp('884210')}
                  >
                    Quick-fill Demo Code (884210)
                  </span>
                </div>
                <div className="relative flex items-center">
                  <KeyRound className="lucide w-4 h-4 absolute left-3 text-slate-500" />
                  <input
                    type="text"
                    required
                    autoFocus
                    maxLength={8}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="884210"
                    className="gf-input w-full pl-9 text-center font-mono font-bold text-lg tracking-widest text-emerald-400"
                  />
                </div>
              </div>

              {/* WebAuthn Placeholder */}
              <div className="p-2.5 rounded bg-slate-900 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Fingerprint className="lucide w-4 h-4 text-teal-400" />
                  <span>FIDO2 / WebAuthn Security Key</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">READY</span>
              </div>

              {error && (
                <div className="p-2 rounded bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold">
                  {error}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStage('credentials')}
                  className="gf-btn gf-btn-secondary py-2 text-xs"
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
          <div className="mt-6 pt-4 border-t border-slate-800">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Authorized Test Operators (Quick Switch)
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {operatorsList.slice(0, 4).map((op) => (
                <button
                  key={op.uid}
                  type="button"
                  onClick={() => {
                    setEmail(op.email);
                    setPassword('SuperSecretPass2026!');
                    setStage('credentials');
                    setError('');
                  }}
                  className={`text-left p-1.5 rounded text-[11px] border transition-colors ${
                    email === op.email
                      ? 'bg-sky-950/60 border-sky-700 text-sky-300 font-semibold'
                      : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  <div className="truncate font-semibold">{op.displayName.split(' ')[0]}</div>
                  <div className="text-[10px] text-slate-500 font-mono truncate">{op.role.replace('godfather_', '')}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Internal Access Request Workflow */}
          <div className="mt-4 text-center">
            {accessRequested ? (
              <span className="text-xs text-emerald-400 font-semibold">
                Access request ticket dispatched to Platform Security Committee.
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setAccessRequested(true)}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Need privileged operator access? <span className="text-sky-400 font-semibold underline">Submit Internal Access Request</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
