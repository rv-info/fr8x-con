'use client';

import React, { useState } from 'react';
import { ShieldAlert, KeyRound, CheckCircle, X, Lock } from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

export function StepUpModal() {
  const { stepUpPromptAction, submitStepUpOtp, cancelStepUp, operator } = useGodfatherAuth();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  if (!stepUpPromptAction) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const success = submitStepUpOtp(otp.trim());
    if (!success) {
      setError('Invalid verification code. Enter "884210" or "123456" for demo authentication.');
    } else {
      setOtp('');
    }
  };

  return (
    <div className="gf-modal-overlay">
      <div className="gf-modal-card gf-stepup-card">
        <div className="gf-modal-header gf-stepup-header">
          <div className="gf-modal-title-wrap">
            <div className="gf-icon-badge gf-icon-badge-amber">
              <ShieldAlert className="lucide w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h3 className="gf-modal-title">High-Risk Operation · Step-Up Verification</h3>
              <p className="gf-modal-subtitle">Con.FR8X.IN Super-Admin Privilege Elevation Protocol</p>
            </div>
          </div>
          <button onClick={cancelStepUp} className="gf-modal-close-btn" aria-label="Cancel">
            <X className="lucide w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="gf-modal-body">
          <div className="gf-callout gf-callout-amber">
            <div className="gf-callout-title flex items-center gap-1.5 font-bold">
              <Lock className="lucide w-4 h-4" />
              Action Request: <span className="font-mono text-ink">{stepUpPromptAction}</span>
            </div>
            <p className="text-xs text-mut mt-1">
              This operation alters financial, legal, access, or platform security configurations. You must complete hardware/MFA re-authentication before proceeding.
            </p>
          </div>

          <div className="gf-operator-pill-box mt-3 p-2.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
            <div>
              <div className="font-bold text-ink">{operator.displayName}</div>
              <div className="text-mut font-mono text-[11px]">{operator.email}</div>
            </div>
            <span className="gf-badge gf-badge-blue text-[10px] uppercase font-bold">{operator.roleTitle}</span>
          </div>

          <div className="gf-form-group mt-4">
            <label className="gf-form-label font-bold flex items-center justify-between">
              <span>Enter 6-Digit Authenticator / Hardware Token Code</span>
              <span className="text-xs text-brand cursor-pointer" onClick={() => setOtp('884210')}>
                Quick-fill (884210)
              </span>
            </label>
            <div className="gf-input-with-icon">
              <KeyRound className="lucide w-4 h-4 text-slate-400" />
              <input
                type="text"
                autoFocus
                maxLength={8}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="884210"
                className="gf-input font-mono text-center tracking-widest text-lg font-bold"
              />
            </div>
            {error && <div className="gf-form-error text-xs text-red-600 font-semibold mt-1.5">{error}</div>}
          </div>

          <div className="gf-modal-footer mt-5 flex items-center justify-end gap-2.5">
            <button type="button" onClick={cancelStepUp} className="gf-btn gf-btn-secondary">
              Cancel
            </button>
            <button type="submit" className="gf-btn gf-btn-primary flex items-center gap-1.5">
              <CheckCircle className="lucide w-4 h-4" />
              Verify & Grant Privilege
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
