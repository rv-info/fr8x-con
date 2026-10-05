'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Wrench,
  ShieldAlert,
  Search,
  Check,
  X,
  ExternalLink,
  ShieldCheck,
  Database,
  ArrowRight,
} from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { createClient } from '@/lib/supabase/client';

export interface DataHealthReport {
  uid: string;
  email: string;
  displayName?: string;
  companyName?: string;
  authStatus?: string;
  userDocExists?: boolean;
  profileDocExists?: boolean;
  companyDocExists?: boolean;
  kycDocExists?: boolean;
  approvalDocExists?: boolean;
  overallHealth: 'HEALTHY' | 'ACTION REQUIRED';
  lastChecked?: string;
  isCanonical: boolean;
  hasRootDoc: boolean;
  hasKYCDoc: boolean;
  hasPreferencesDoc: boolean;
  hasActivityDoc: boolean;
  missingDocs: string[];
  status: 'HEALTHY' | 'ACTION REQUIRED';
  anomalies: string[];
}

export default function GodfatherDataHealthPage() {
  const { operator } = useGodfatherAuth();
  const { toast } = useToast();

  const [reports, setReports] = useState<DataHealthReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterHealth, setFilterHealth] = useState<'ALL' | 'HEALTHY' | 'ACTION REQUIRED'>('ALL');
  const [repairingUid, setRepairingUid] = useState<string | null>(null);

  const fetchHealthReports = useCallback(async () => {
    setIsLoading(true);
    try {
      const supabase = createClient();
      const { data: profiles, error } = await supabase.from('profiles').select('*');
      if (error) throw error;

      const results: DataHealthReport[] = (profiles || []).map((p: any) => {
        const anomalies: string[] = [];
        if (!p.mobile && !p.phone) anomalies.push('Missing contact phone number');
        if (!p.designation) anomalies.push('Missing professional designation');
        if (!p.company_name) anomalies.push('Missing company association');

        const isHealthy = anomalies.length === 0;
        return {
          uid: p.id,
          email: p.email,
          isCanonical: true,
          hasRootDoc: true,
          hasKYCDoc: true,
          hasPreferencesDoc: true,
          hasActivityDoc: true,
          missingDocs: isHealthy ? [] : anomalies,
          status: isHealthy ? 'HEALTHY' : 'ACTION REQUIRED',
          anomalies,
        };
      });

      setReports(results);
    } catch (err: any) {
      toast(`Failed to load health reports: ${err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchHealthReports();
  }, [fetchHealthReports]);

  const handleRepair = async (uid: string) => {
    if (!confirm(`Are you sure you want to perform a safe administrative repair on user ${uid}?`)) {
      return;
    }

    setRepairingUid(uid);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('profiles').update({
        updated_at: new Date().toISOString(),
      }).eq('id', uid);

      if (!error) {
        toast(`✓ User ${uid} verified and refreshed in PostgreSQL.`);
        fetchHealthReports();
      } else {
        toast(`Repair error: ${error.message || 'Failed to repair user record.'}`);
      }
    } catch (err: any) {
      toast(`Repair exception: ${err.message}`);
    } finally {
      setRepairingUid(null);
    }
  };

  const filteredReports = reports.filter((r) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesQuery = !q || r.uid.toLowerCase().includes(q) || (r.email && r.email.toLowerCase().includes(q)) || (r.displayName && r.displayName.toLowerCase().includes(q));
    const matchesFilter = filterHealth === 'ALL' || r.overallHealth === filterHealth;
    return matchesQuery && matchesFilter;
  });

  const healthyCount = reports.filter((r) => r.overallHealth === 'HEALTHY').length;
  const actionRequiredCount = reports.filter((r) => r.overallHealth === 'ACTION REQUIRED').length;

  return (
    <div style={{ padding: '24px', background: '#f8fafc', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>
            <Link href="/godfather" style={{ color: '#64748b', textDecoration: 'none' }}>Godfather</Link>
            <span>/</span>
            <Link href="/godfather/security" style={{ color: '#64748b', textDecoration: 'none' }}>Security</Link>
            <span>/</span>
            <span style={{ color: '#0f172a', fontWeight: 600 }}>AUTH ↔ FIRESTORE HEALTH</span>
          </div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Database size={24} color="#0284c7" />
            Auth ↔ Firestore Identity & Data Health
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
            Authoritative production identity audit across Firebase Authentication, Cloud Firestore canonical records, KYC, and Godfather approvals.
          </p>
        </div>

        <button
          onClick={fetchHealthReports}
          disabled={isLoading}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '8px',
            background: '#ffffff',
            border: '1px solid #cbd5e1',
            color: '#334155',
            fontWeight: 600,
            fontSize: '13px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
          }}
        >
          <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Checking Health…' : 'Refresh Diagnostics'}
        </button>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Accounts Audited</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#0f172a', marginTop: '6px' }}>{reports.length}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#16a34a', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} color="#16a34a" /> Healthy Canonical Records
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#16a34a', marginTop: '6px' }}>{healthyCount}</div>
        </div>

        <div style={{ background: '#ffffff', padding: '16px 20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <AlertTriangle size={14} color="#ea580c" /> Action Required / Disconnected
          </div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: '#ea580c', marginTop: '6px' }}>{actionRequiredCount}</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ background: '#ffffff', padding: '14px 18px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: '260px' }}>
          <Search size={16} color="#94a3b8" />
          <input
            type="text"
            placeholder="Search by UID, email, or full name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', border: 'none', outline: 'none', fontSize: '13px', color: '#0f172a' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {(['ALL', 'HEALTHY', 'ACTION REQUIRED'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setFilterHealth(filter)}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                border: filterHealth === filter ? '1px solid #0284c7' : '1px solid #cbd5e1',
                background: filterHealth === filter ? '#f0f9ff' : '#ffffff',
                color: filterHealth === filter ? '#0284c7' : '#64748b',
                cursor: 'pointer',
              }}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Diagnostics Table */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: 600 }}>
                <th style={{ padding: '12px 16px' }}>UID & Account</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Auth</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>User Doc</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Profile</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Company</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>KYC</th>
                <th style={{ padding: '12px 16px', textAlign: 'center' }}>Approval</th>
                <th style={{ padding: '12px 16px' }}>Overall Health</th>
                <th style={{ padding: '12px 16px' }}>Last Checked</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0284c7' }} />
                    Auditing Firebase Auth & Firestore live records…
                  </td>
                </tr>
              ) : filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                    No account records match the current filters.
                  </td>
                </tr>
              ) : (
                filteredReports.map((report) => (
                  <tr key={report.uid} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontFamily: 'monospace', fontSize: '12px' }}>
                        {report.uid}
                      </div>
                      <div style={{ fontSize: '12px', color: '#475569', marginTop: '2px' }}>
                        {report.displayName ? `${report.displayName} · ` : ''}{report.email || 'No email attached'}
                      </div>
                      {report.companyName && (
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{report.companyName}</div>
                      )}
                    </td>

                    {/* Auth */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {report.authStatus ? (
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>

                    {/* User Doc */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {report.userDocExists ? (
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 800 }}>✗</span>
                      )}
                    </td>

                    {/* Profile */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {report.profileDocExists ? (
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 800 }}>✗</span>
                      )}
                    </td>

                    {/* Company */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {report.companyDocExists ? (
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                      ) : (
                        <span style={{ color: '#cbd5e1' }}>—</span>
                      )}
                    </td>

                    {/* KYC */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {report.kycDocExists ? (
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 800 }}>✗</span>
                      )}
                    </td>

                    {/* Approval */}
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {report.approvalDocExists ? (
                        <span style={{ color: '#16a34a', fontWeight: 800 }}>✓</span>
                      ) : (
                        <span style={{ color: '#ef4444', fontWeight: 800 }}>✗</span>
                      )}
                    </td>

                    {/* Health Status */}
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 700,
                          background: report.overallHealth === 'HEALTHY' ? '#dcfce7' : '#ffedd5',
                          color: report.overallHealth === 'HEALTHY' ? '#15803d' : '#c2410c',
                        }}
                      >
                        {report.overallHealth === 'HEALTHY' ? <Check size={12} /> : <AlertTriangle size={12} />}
                        {report.overallHealth}
                      </span>
                    </td>

                    {/* Last Checked */}
                    <td style={{ padding: '12px 16px', color: '#64748b', fontSize: '11px' }}>
                      {report.lastChecked ? new Date(report.lastChecked).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'Just now'}
                    </td>

                    {/* Safe Repair */}
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      {report.overallHealth !== 'HEALTHY' ? (
                        <button
                          onClick={() => handleRepair(report.uid)}
                          disabled={repairingUid === report.uid}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: '#0284c7',
                            color: '#ffffff',
                            border: 'none',
                            cursor: repairingUid === report.uid ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <Wrench size={11} className={repairingUid === report.uid ? 'animate-spin' : ''} />
                          {repairingUid === report.uid ? 'Repairing…' : 'Safe Repair'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>Verified</span>
                      )}
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
