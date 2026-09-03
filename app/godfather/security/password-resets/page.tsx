'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { KeyRound, RefreshCw, CheckCircle2, ShieldCheck, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';

export default function PasswordResetsPage() {
  const [resets, setResets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchResets = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/godfather/security?type=resets');
      if (res.ok) {
        const json = await res.json();
        setResets(json.data || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchResets();
  }, [fetchResets]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <h1 className="gf-page-title flex items-center gap-2">
            <KeyRound className="lucide w-4 h-4 text-sky-600" />
            <span>Password Reset Requests Queue</span>
          </h1>
          <p className="gf-page-subtitle">
            Monitors inbound password recovery dispatches. Uses zero-knowledge non-leaking responses to prevent email enumeration.
          </p>
        </div>

        <button type="button" onClick={fetchResets} className="gf-btn gf-btn-secondary">
          <RefreshCw className={`lucide w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Table */}
      {/* Table in Excel Grid */}
      <div className="gf-card">
        <div className="gf-excel-sheet border-0">
          <table className="gf-table">
            <thead>
              <tr>
                <th className="col-index">#</th>
                <th className="text-center" style={{ width: '130px' }}>REQUEST ID</th>
                <th className="text-left">TARGET EMAIL</th>
                <th className="text-center" style={{ width: '160px' }}>REQUESTED AT</th>
                <th className="text-center" style={{ width: '120px' }}>SOURCE IP</th>
                <th className="text-center" style={{ width: '100px' }}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {resets.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-slate-400">
                    <CheckCircle2 className="lucide w-6 h-6 mx-auto mb-1 text-emerald-500 opacity-60" />
                    <div className="font-bold text-slate-600">No Pending Password Reset Requests</div>
                    <div className="text-[9px]">Zero password recovery tokens currently active in queue.</div>
                  </td>
                </tr>
              ) : (
                resets.map((r, idx) => (
                  <tr key={r.id}>
                    <td className="col-index">{idx + 1}</td>
                    <td className="text-center font-mono text-[10px] text-slate-600">{r.id}</td>
                    <td className="text-left font-bold text-slate-900">{r.email}</td>
                    <td className="text-center font-mono text-[10px] text-slate-600">
                      {new Date(r.requestedAt).toLocaleString()}
                    </td>
                    <td className="text-center font-mono text-[10px] text-slate-500">{r.ipAddress || '127.0.0.1'}</td>
                    <td className="text-center">
                      <span className={`gf-badge ${r.status === 'pending' ? 'gf-badge-amber' : 'gf-badge-green'}`}>
                        {r.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="gf-excel-status-bar">
            <span>● PASSKEY CHALLENGES</span>
            <span>Total Reset Tokens: {resets.length} | 15-Minute Expiration Enforced</span>
          </div>
        </div>
      </div>
    </div>
  );
}
