'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle, Send, KeyRound, ShieldAlert } from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';

export default function OTPActivityPage() {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Live Test OTP Console state
  const [testEmail, setTestEmail] = useState('arjun@atlaslogistics.com');
  const [testType, setTestType] = useState('login');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const fetchOTPData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/godfather/security?type=events');
      if (res.ok) {
        const json = await res.json();
        const otpEvts = (json.data || []).filter(
          (e: any) => e.type === 'OTP_LIMIT_WARNING' || e.type === 'OTP_LIMIT_REACHED' || e.type.includes('OTP')
        );
        setEvents(otpEvts);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOTPData();
  }, []);

  const handleSimulateOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/auth/otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail.trim(), type: testType }),
      });

      const json = await res.json();
      setTestResult(json);
      fetchOTPData();
      if (res.ok) {
        toast(`OTP simulated successfully. Remaining attempts today: ${json.remainingAttemptsToday}`);
      } else {
        toast(`OTP limit reached or rejected: ${json.error}`);
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue font-bold">SECURITY & VERIFICATION</span>
            <span className="gf-badge gf-badge-green font-mono">RATE LIMIT: 3 OTPs / USER / DATE</span>
          </div>
          <h1 className="gf-page-title flex items-center gap-2">
            <Smartphone className="lucide w-4 h-4 text-emerald-600" />
            <span>OTP Rate Limiting, Live Dispatch & Activity Stream</span>
          </h1>
          <p className="gf-page-subtitle">
            Monitors daily SMS and Email OTP dispatch. Enforces strict limit of maximum 3 OTP attempts/requests per user per calendar date.
          </p>
        </div>

        <button type="button" onClick={fetchOTPData} className="gf-btn gf-btn-secondary">
          <RefreshCw className={`lucide w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feed</span>
        </button>
      </div>

      {/* Grid: Policy Box + Live Simulator Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Policy Box (5 cols) */}
        <div className="lg:col-span-5 gf-card">
          <div className="gf-card-header">
            <div className="gf-card-title text-slate-900">
              <ShieldCheck className="lucide w-3.5 h-3.5 text-emerald-600" />
              <span>Server-Side Enforced Policy</span>
            </div>
            <span className="gf-badge gf-badge-green font-mono font-bold">ACTIVE</span>
          </div>
          <div className="gf-card-body space-y-2.5 text-[10.5px] leading-relaxed">
            <p>
              Every registered corporate user is granted a maximum of <strong>3 OTP requests per calendar date</strong>.
            </p>
            <div className="p-2.5 rounded bg-sky-50 border border-sky-200 text-sky-900 space-y-1">
              <div className="font-bold flex items-center gap-1">
                <AlertCircle className="lucide w-3 h-3 text-sky-600" />
                <span>Threshold Progression:</span>
              </div>
              <ul className="list-disc pl-4 space-y-0.5 text-[10px]">
                <li><strong>Attempt 1:</strong> Dispatched. 2 requests remaining today.</li>
                <li><strong>Attempt 2:</strong> Dispatched. 1 request remaining today.</li>
                <li><strong>Attempt 3:</strong> Dispatched. 0 requests remaining today.</li>
                <li><strong>Attempt 4+:</strong> <strong>Hard blocked.</strong> Automatically releases at 00:00 UTC.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Live Simulator Box (7 cols) */}
        <div className="lg:col-span-7 gf-card">
          <div className="gf-card-header">
            <div className="gf-card-title text-slate-900">
              <Send className="lucide w-3.5 h-3.5 text-sky-600" />
              <span>Test & Inspect User OTP Quota (Live Simulation)</span>
            </div>
            <span className="gf-badge gf-badge-blue font-mono">DIAGNOSTIC TOOL</span>
          </div>
          <div className="gf-card-body">
            <form onSubmit={handleSimulateOTP} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
                <div className="sm:col-span-8 gf-form-group mb-0">
                  <label className="gf-form-label">User Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    placeholder="user@company.com"
                    className="gf-input w-full"
                  />
                </div>
                <div className="sm:col-span-4 gf-form-group mb-0">
                  <label className="gf-form-label">Verification Type</label>
                  <select
                    value={testType}
                    onChange={(e) => setTestType(e.target.value)}
                    className="gf-select w-full"
                  >
                    <option value="login">Login Verification</option>
                    <option value="step_up">Step-Up MFA</option>
                    <option value="password_reset">Password Reset</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[9.5px] text-slate-500 font-mono">
                  Test dispatch will consume a real quota token for this email.
                </span>
                <button
                  type="submit"
                  disabled={isTesting || !testEmail.trim()}
                  className="gf-btn gf-btn-primary"
                >
                  <Send className="lucide w-3 h-3" />
                  <span>{isTesting ? 'Sending…' : 'Simulate OTP Dispatch'}</span>
                </button>
              </div>
            </form>

            {testResult && (
              <div className={`mt-3 p-2.5 rounded border text-[10px] ${
                testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  {testResult.success ? (
                    <CheckCircle2 className="lucide w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="lucide w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>Response: {testResult.message || testResult.error}</span>
                </div>
                {testResult.remainingAttemptsToday !== undefined && (
                  <div className="mt-1 font-mono text-[9.5px]">
                    Remaining Attempts For Today: <strong>{testResult.remainingAttemptsToday} / 3</strong>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Table Container */}
      <div className="gf-card">
        <div className="gf-card-header">
          <div className="gf-card-title text-slate-900">
            <Smartphone className="lucide w-3.5 h-3.5 text-slate-600" />
            <span>Today&apos;s OTP Verification Log & Rate-Limit Stream</span>
          </div>
          <span className="text-[10px] text-slate-500 font-mono font-bold">
            Total Logged Events: {events.length}
          </span>
        </div>

        <div className="gf-table-container border-0 rounded-none">
          <table className="gf-table">
            <thead>
              <tr>
                <th>EVENT ID</th>
                <th>TARGET USER</th>
                <th>EVENT TYPE</th>
                <th>SEVERITY</th>
                <th>DETAILS</th>
                <th>TIMESTAMP</th>
              </tr>
            </thead>
            <tbody>
              {events.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <CheckCircle2 className="lucide w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-60" />
                    <div className="font-bold text-slate-600">No OTP Rate-Limit Violations Today</div>
                    <div className="text-[9.5px]">All corporate members are operating within normal daily verification thresholds.</div>
                  </td>
                </tr>
              ) : (
                events.map((evt) => (
                  <tr key={evt.id}>
                    <td className="font-mono text-[9px] text-slate-500">{evt.id}</td>
                    <td className="font-bold text-slate-900">{evt.userEmail}</td>
                    <td>
                      <span
                        className={`gf-badge ${
                          evt.type === 'OTP_LIMIT_REACHED' ? 'gf-badge-red' : 'gf-badge-amber'
                        }`}
                      >
                        {evt.type}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`gf-badge ${
                          evt.severity === 'HIGH' ? 'gf-badge-red' : 'gf-badge-blue'
                        }`}
                      >
                        {evt.severity}
                      </span>
                    </td>
                    <td className="text-slate-800 text-[10px]">{evt.details}</td>
                    <td className="font-mono text-[9px] text-slate-600">
                      {new Date(evt.timestamp).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
