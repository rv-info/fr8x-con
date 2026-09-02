'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  Lock,
  UserX,
  KeyRound,
  Smartphone,
  History,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Eye,
  Unlock,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { useToast } from '@/lib/context/ToastContext';

export default function AuthenticationSecurityPage() {
  const { hasPermission } = useGodfatherAuth();
  const { toast } = useToast();

  const [stats, setStats] = useState({
    blockedAccountsCount: 0,
    securityEventsCount: 0,
    passwordResetsCount: 0,
    criticalEventsCount: 0,
  });
  const [blockedAccounts, setBlockedAccounts] = useState<any[]>([]);
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Unblock modal state
  const [selectedBlockedUser, setSelectedBlockedUser] = useState<any | null>(null);
  const [unblockReason, setUnblockReason] = useState('');
  const [isSubmittingUnblock, setIsSubmittingUnblock] = useState(false);

  const fetchSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/godfather/security');
      if (res.ok) {
        const json = await res.json();
        setStats(json.summary || {
          blockedAccountsCount: 0,
          securityEventsCount: 0,
          passwordResetsCount: 0,
          criticalEventsCount: 0,
        });
        setBlockedAccounts(json.blockedAccounts || []);
        setRecentEvents(json.recentEvents || []);
      }
    } catch {
      // Offline fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const handleUnblockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBlockedUser || !unblockReason.trim()) {
      toast('Mandatory unblock reason is required.');
      return;
    }

    setIsSubmittingUnblock(true);
    try {
      const res = await fetch('/api/godfather/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNBLOCK_ACCOUNT',
          uid: selectedBlockedUser.uid,
          unblockReason: unblockReason.trim(),
        }),
      });

      if (res.ok) {
        toast(`Account ${selectedBlockedUser.email} has been unblocked.`);
        setSelectedBlockedUser(null);
        setUnblockReason('');
        fetchSecurityData();
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to unblock account.');
      }
    } catch {
      toast('Failed to reach security server.');
    } finally {
      setIsSubmittingUnblock(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Page Header */}
      <div className="gf-page-header">
        <div>
          <h1 className="gf-page-title flex items-center gap-2">
            <Lock className="lucide w-4 h-4 text-sky-600" />
            <span>Authentication Security & Platform Access Control</span>
          </h1>
          <p className="gf-page-subtitle">
            Real-time multi-tenant access monitoring, brute-force mitigation (3 max attempts), and rate-limited OTP controls.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchSecurityData}
            className="gf-btn gf-btn-secondary"
            title="Refresh Security State"
          >
            <RefreshCw className={`lucide w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh State</span>
          </button>
        </div>
      </div>

      {/* Security Summary Cards */}
      <div className="gf-metric-grid">
        <Link href="/godfather/security/blocked-accounts" className="gf-metric-card">
          <div>
            <div className="gf-metric-title">Blocked Accounts</div>
            <div className="gf-metric-value text-rose-600">
              {blockedAccounts.length}
            </div>
          </div>
          <div className="gf-metric-foot text-rose-600">
            <UserX className="lucide w-3 h-3" />
            <span>{blockedAccounts.length > 0 ? 'Action Required' : '0 Locked Users'}</span>
          </div>
        </Link>

        <Link href="/godfather/security/events" className="gf-metric-card">
          <div>
            <div className="gf-metric-title">Security Events (24h)</div>
            <div className="gf-metric-value text-sky-700">
              {stats.securityEventsCount}
            </div>
          </div>
          <div className="gf-metric-foot text-sky-600">
            <ShieldAlert className="lucide w-3 h-3" />
            <span>{stats.criticalEventsCount} Critical</span>
          </div>
        </Link>

        <Link href="/godfather/security/password-resets" className="gf-metric-card">
          <div>
            <div className="gf-metric-title">Password Reset Queue</div>
            <div className="gf-metric-value text-slate-800">
              {stats.passwordResetsCount}
            </div>
          </div>
          <div className="gf-metric-foot text-slate-600">
            <KeyRound className="lucide w-3 h-3" />
            <span>Non-leaking Tokens</span>
          </div>
        </Link>

        <Link href="/godfather/security/otp-activity" className="gf-metric-card">
          <div>
            <div className="gf-metric-title">Daily OTP Policy</div>
            <div className="gf-metric-value text-emerald-700">3/3 Max</div>
          </div>
          <div className="gf-metric-foot text-emerald-600">
            <Smartphone className="lucide w-3 h-3" />
            <span>Enforced Server-Side</span>
          </div>
        </Link>
      </div>

      {/* Main Grid: Blocked Accounts Table & Recent Security Incidents */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left 7 Cols: Blocked Accounts */}
        <div className="lg:col-span-7 space-y-3">
          <div className="gf-card">
            <div className="gf-card-header">
              <div className="gf-card-title text-rose-700">
                <UserX className="lucide w-3.5 h-3.5" />
                <span>Currently Blocked Accounts ({blockedAccounts.length})</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                3-ATTEMPT POLICY ENFORCED
              </span>
            </div>

            <div className="gf-table-container">
              <table className="gf-table">
                <thead>
                  <tr>
                    <th>USER / EMAIL</th>
                    <th>COMPANY</th>
                    <th>FAILED TRIES</th>
                    <th>BLOCKED AT</th>
                    <th>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {blockedAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-slate-400">
                        <CheckCircle2 className="lucide w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-60" />
                        <div className="font-bold text-slate-600">No Blocked Accounts</div>
                        <div className="text-[9px]">All user accounts are in good standing with zero locked credentials.</div>
                      </td>
                    </tr>
                  ) : (
                    blockedAccounts.map((b) => (
                      <tr key={b.id || b.uid}>
                        <td>
                          <div className="font-bold text-slate-900">{b.displayName || b.email}</div>
                          <div className="font-mono text-[9px] text-slate-500">{b.email}</div>
                        </td>
                        <td>
                          <span className="text-slate-700">{b.company || '—'}</span>
                        </td>
                        <td>
                          <span className="gf-badge gf-badge-red font-mono font-bold">
                            {b.failedAttempts}/3
                          </span>
                        </td>
                        <td>
                          <span className="font-mono text-[9px] text-slate-500">
                            {new Date(b.blockedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => setSelectedBlockedUser(b)}
                            className="gf-btn gf-btn-success"
                            title="Unblock this user"
                          >
                            <Unlock className="lucide w-3 h-3" />
                            <span>Unblock</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 5 Cols: Live Security Events */}
        <div className="lg:col-span-5 space-y-3">
          <div className="gf-card">
            <div className="gf-card-header">
              <div className="gf-card-title">
                <ShieldAlert className="lucide w-3.5 h-3.5 text-sky-600" />
                <span>Security Events Audit Stream</span>
              </div>
              <Link href="/godfather/security/events" className="text-[9px] font-bold text-sky-600 hover:underline">
                View All →
              </Link>
            </div>

            <div className="divide-y divide-slate-100 max-h-[360px] overflow-y-auto">
              {recentEvents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <ShieldAlert className="lucide w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <div>No security incidents recorded.</div>
                </div>
              ) : (
                recentEvents.slice(0, 10).map((evt) => (
                  <div key={evt.id} className="p-2.5 hover:bg-slate-50 text-[10px] space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span
                        className={`gf-badge ${
                          evt.severity === 'CRITICAL'
                            ? 'gf-badge-red'
                            : evt.severity === 'HIGH'
                            ? 'gf-badge-amber'
                            : 'gf-badge-blue'
                        }`}
                      >
                        {evt.type}
                      </span>
                      <span className="font-mono text-[9px] text-slate-400">
                        {new Date(evt.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-800 font-medium">{evt.details}</div>
                    <div className="text-slate-500 font-mono text-[9px]">Target: {evt.userEmail}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Unblock Confirmation Modal */}
      {selectedBlockedUser && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header bg-rose-50 border-b border-rose-200">
              <div className="gf-modal-title text-rose-900 flex items-center gap-2">
                <Unlock className="lucide w-4 h-4 text-rose-600" />
                <span>Authorize Account Unblock</span>
              </div>
            </div>

            <form onSubmit={handleUnblockSubmit} className="p-4 space-y-3">
              <div className="text-xs text-slate-700">
                You are performing a privileged unblock for user{' '}
                <strong className="text-slate-900">{selectedBlockedUser.email}</strong> (
                {selectedBlockedUser.company}).
              </div>

              <div className="gf-callout gf-callout-amber">
                <strong>Mandatory Requirement:</strong> Provide a legitimate operational or security justification. This action and reason will be permanently recorded in the immutable platform audit ledger.
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label">
                  Mandatory Unblock Justification <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={unblockReason}
                  onChange={(e) => setUnblockReason(e.target.value)}
                  placeholder="e.g. Identity verified via registered corporate phone number. User reset corporate MFA."
                  className="gf-textarea w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedBlockedUser(null)}
                  className="gf-btn gf-btn-secondary"
                  disabled={isSubmittingUnblock}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingUnblock || !unblockReason.trim()}
                  className="gf-btn gf-btn-success"
                >
                  {isSubmittingUnblock ? 'Unblocking...' : 'Confirm & Unblock Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
