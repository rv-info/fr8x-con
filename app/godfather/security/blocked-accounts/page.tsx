'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  UserX,
  Unlock,
  Shield,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  History,
  X,
  Building,
  Mail,
  Calendar,
  KeyRound,
} from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';

export default function BlockedAccountsPage() {
  const { toast } = useToast();

  const [blockedList, setBlockedList] = useState<any[]>([]);
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<any | null>(null);

  // Unblock Modal
  const [unblockTarget, setUnblockTarget] = useState<any | null>(null);
  const [unblockReason, setUnblockReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchBlockedData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/godfather/security?type=blocked');
      if (res.ok) {
        const json = await res.json();
        setBlockedList(json.data || []);
        setHistoryList(json.history || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedData();
  }, []);

  const handleUnblock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unblockTarget || !unblockReason.trim()) {
      toast('Mandatory unblock reason is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/godfather/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'UNBLOCK_ACCOUNT',
          uid: unblockTarget.uid,
          unblockReason: unblockReason.trim(),
        }),
      });

      if (res.ok) {
        toast(`Account ${unblockTarget.email} unlocked successfully.`);
        setUnblockTarget(null);
        setUnblockReason('');
        if (selectedAccount?.uid === unblockTarget.uid) {
          setSelectedAccount(null);
        }
        fetchBlockedData();
      } else {
        const err = await res.json();
        toast(err.error || 'Failed to unblock.');
      }
    } catch {
      toast('Security server error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = blockedList.filter((b) => {
    const q = search.toLowerCase();
    return (
      b.email.toLowerCase().includes(q) ||
      (b.displayName && b.displayName.toLowerCase().includes(q)) ||
      (b.company && b.company.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <h1 className="gf-page-title flex items-center gap-2">
            <UserX className="lucide w-4 h-4 text-rose-600" />
            <span>Blocked & Restricted Accounts</span>
          </h1>
          <p className="gf-page-subtitle">
            Accounts locked automatically following 3 consecutive failed login attempts. Unblocking requires Godfather authorization and mandatory recorded reason.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchBlockedData}
            className="gf-btn gf-btn-secondary"
          >
            <RefreshCw className={`lucide w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="gf-filter-bar">
        <div className="gf-search-input-wrap">
          <Search className="lucide w-3 h-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user email, name, company..."
            className="gf-search-input"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-slate-600">
            Total Locked: <strong className="text-rose-600 font-mono">{blockedList.length}</strong>
          </span>
        </div>
      </div>

      {/* Enterprise Data Table */}
      <div className="gf-table-container">
        <table className="gf-table">
          <thead>
            <tr>
              <th>USER</th>
              <th>COMPANY</th>
              <th>FAILED ATTEMPTS</th>
              <th>LAST ATTEMPT</th>
              <th>BLOCKED AT</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-10 text-slate-400">
                  <CheckCircle2 className="lucide w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-60" />
                  <div className="font-bold text-slate-600">No Blocked Accounts Found</div>
                  <div className="text-[9px]">Zero users are currently locked out by brute-force protection.</div>
                </td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr
                  key={row.id || row.uid}
                  onClick={() => setSelectedAccount(row)}
                  className="cursor-pointer hover:bg-slate-50"
                >
                  <td>
                    <div className="font-bold text-slate-900">{row.displayName || row.email}</div>
                    <div className="font-mono text-[9px] text-slate-500">{row.email}</div>
                  </td>
                  <td>
                    <span className="text-slate-800 font-medium">{row.company || '—'}</span>
                    <div className="font-mono text-[9px] text-slate-400">{row.companyId}</div>
                  </td>
                  <td>
                    <span className="gf-badge gf-badge-red font-mono font-bold">
                      {row.failedAttempts}/3
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-[9px] text-slate-600">
                      {row.lastAttemptAt ? new Date(row.lastAttemptAt).toLocaleString() : '—'}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-[9px] text-rose-700 font-bold">
                      {row.blockedAt ? new Date(row.blockedAt).toLocaleString() : '—'}
                    </span>
                  </td>
                  <td>
                    <span className="gf-badge gf-badge-red">BLOCKED</span>
                  </td>
                  <td>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUnblockTarget(row);
                      }}
                      className="gf-btn gf-btn-success"
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

      {/* Account Detail Drawer */}
      {selectedAccount && (
        <div className="gf-drawer-overlay" onClick={() => setSelectedAccount(null)}>
          <div className="gf-drawer-panel" onClick={(e) => e.stopPropagation()}>
            <div className="gf-drawer-header bg-rose-50 border-b border-rose-200">
              <div>
                <div className="gf-drawer-title text-rose-900 flex items-center gap-2">
                  <UserX className="lucide w-4 h-4 text-rose-600" />
                  <span>Blocked Account Dossier</span>
                </div>
                <div className="gf-drawer-subtitle">{selectedAccount.email}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAccount(null)}
                className="gf-modal-close-btn"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <div className="gf-drawer-body space-y-4">
              {/* Summary Callout */}
              <div className="gf-callout gf-callout-amber">
                <strong>Brute-Force Lockout:</strong> This account was automatically locked after exceeding 3 maximum invalid password attempts. Server-side session generation is halted until unlocked.
              </div>

              {/* User Metadata */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Mail className="lucide w-3.5 h-3.5 text-sky-600" />
                  <span>Account Information</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div>
                    <span className="text-slate-400">Display Name:</span>{' '}
                    <strong className="text-slate-800">{selectedAccount.displayName || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">UID:</span>{' '}
                    <strong className="font-mono text-slate-800">{selectedAccount.uid}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Company:</span>{' '}
                    <strong className="text-slate-800">{selectedAccount.company || '—'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Company ID:</span>{' '}
                    <strong className="font-mono text-slate-800">{selectedAccount.companyId || '—'}</strong>
                  </div>
                </div>
              </div>

              {/* Incident Details */}
              <div className="gf-card p-3 space-y-2">
                <div className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <AlertTriangle className="lucide w-3.5 h-3.5 text-rose-600" />
                  <span>Lockout Incident Context</span>
                </div>
                <div className="space-y-1 text-[10px]">
                  <div>
                    <span className="text-slate-400">Failed Password Attempts:</span>{' '}
                    <span className="gf-badge gf-badge-red font-mono font-bold">
                      {selectedAccount.failedAttempts}/3
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Lockout Timestamp:</span>{' '}
                    <span className="font-mono text-slate-800">
                      {new Date(selectedAccount.blockedAt).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Last Attempt Source IP:</span>{' '}
                    <span className="font-mono text-slate-800">{selectedAccount.ipAddress || '127.0.0.1'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Automated Reason:</span>{' '}
                    <span className="text-slate-700">{selectedAccount.reason}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setUnblockTarget(selectedAccount);
                  }}
                  className="gf-btn gf-btn-success w-full justify-center py-2"
                >
                  <Unlock className="lucide w-3.5 h-3.5" />
                  <span>Authorize Account Unblock & Reset Counter</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Unblock Confirmation Modal */}
      {unblockTarget && (
        <div className="gf-modal-overlay">
          <div className="gf-modal-card">
            <div className="gf-modal-header bg-rose-50 border-b border-rose-200">
              <div className="gf-modal-title text-rose-900 flex items-center gap-2">
                <Unlock className="lucide w-4 h-4 text-rose-600" />
                <span>Confirm Account Unblock Authorization</span>
              </div>
            </div>

            <form onSubmit={handleUnblock} className="p-4 space-y-3">
              <div className="text-xs text-slate-700">
                You are unblocking access for user <strong className="text-slate-900">{unblockTarget.email}</strong>.
              </div>

              <div className="gf-callout gf-callout-amber">
                <strong>Mandatory Audit:</strong> An immutable audit ledger record will be generated recording your administrator UID, timestamp, and this justification.
              </div>

              <div className="gf-form-group">
                <label className="gf-form-label">
                  Mandatory Unblock Justification / Verification Notes <span className="text-rose-600">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={unblockReason}
                  onChange={(e) => setUnblockReason(e.target.value)}
                  placeholder="e.g. Identity verified via registered corporate contact. Password reset link issued."
                  className="gf-textarea w-full"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUnblockTarget(null)}
                  className="gf-btn gf-btn-secondary"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !unblockReason.trim()}
                  className="gf-btn gf-btn-success"
                >
                  {isSubmitting ? 'Unblocking...' : 'Authorize & Unlock Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
