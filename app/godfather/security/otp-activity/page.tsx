'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';

export default function OTPActivityPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOTPData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/godfather/security?type=events');
      if (res.ok) {
        const json = await res.json();
        const otpEvts = (json.data || []).filter(
          (e: any) => e.type === 'OTP_LIMIT_WARNING' || e.type === 'OTP_LIMIT_REACHED'
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <h1 className="gf-page-title flex items-center gap-2">
            <Smartphone className="lucide w-4 h-4 text-emerald-600" />
            <span>OTP Rate Limiting & Daily Activity Stream</span>
          </h1>
          <p className="gf-page-subtitle">
            Monitors daily SMS and Email OTP dispatch. Enforces strict limit of maximum 3 OTP attempts/requests per user per date.
          </p>
        </div>

        <button type="button" onClick={fetchOTPData} className="gf-btn gf-btn-secondary">
          <RefreshCw className={`lucide w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Policy Card */}
      <div className="gf-callout gf-callout-blue">
        <strong>Server-Side Enforced Policy:</strong> Every registered corporate user is granted a maximum of <strong>3 OTP requests per calendar date</strong>. The remaining count is communicated transparently on each attempt. When exhausted (0 remaining), dispatch is automatically suspended until 00:00 UTC.
      </div>

      {/* Activity Table */}
      <div className="gf-card">
        <div className="gf-table-container">
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
                    <div className="text-[9px]">All users are operating within normal daily verification thresholds.</div>
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
