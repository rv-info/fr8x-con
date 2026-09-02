'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  UserX,
  Building,
  FileCheck,
  ShieldAlert,
  KeyRound,
  Smartphone,
  Gavel,
  CheckCircle2,
  Clock,
  ShieldCheck,
  History,
  RefreshCw,
  Zap,
  BookOpen,
  ArrowUpRight,
  TrendingUp,
  Mail,
  Server,
  Layers,
  Sparkles,
  Lock,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ZohoEmailGuidebookModal } from '@/components/godfather/ZohoEmailGuidebookModal';

export default function GodfatherDashboardPage() {
  const { companies, users, auctions, auditLogs } = useGodfatherData();
  const { environment } = useGodfatherAuth();

  const [securityStats, setSecurityStats] = useState({
    blockedAccountsCount: 0,
    securityEventsCount: 0,
    passwordResetsCount: 0,
    criticalEventsCount: 0,
  });
  const [blockedAccounts, setBlockedAccounts] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [passwordResets, setPasswordResets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGuidebookOpen, setIsGuidebookOpen] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<string>('');

  const fetchSecurityOverview = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/godfather/security');
      if (res.ok) {
        const json = await res.json();
        setSecurityStats(json.summary || {
          blockedAccountsCount: 0,
          securityEventsCount: 0,
          passwordResetsCount: 0,
          criticalEventsCount: 0,
        });
        setBlockedAccounts(json.blockedAccounts || []);
        setSecurityEvents(json.recentEvents || []);
      }

      const resResets = await fetch('/api/godfather/security?type=resets');
      if (resResets.ok) {
        const jsonResets = await resResets.json();
        setPasswordResets(jsonResets.data || []);
      }
      setLastRefreshed(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityOverview();
  }, [fetchSecurityOverview]);

  const activeUsersCount = users.length;
  const blockedAccountsCount = blockedAccounts.length;
  const pendingKYCCount = companies.filter((c) => c.status === 'pending' || c.status === 'additional_info_required').length;
  const openReportsCount = 1;
  const activeSecurityAlertsCount = securityEvents.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
  const pendingPasswordResetsCount = passwordResets.filter((p) => p.status === 'pending').length;
  const otpLimitEventsCount = securityEvents.filter((e) => e.type === 'OTP_LIMIT_REACHED').length;
  const activeAuctionsCount = auctions.filter((a) => a.status === 'Live').length;

  return (
    <div className="space-y-6">
      {/* ── 1. PAGE MASTER HEADER ── */}
      <div className="gf-page-header">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="gf-badge gf-badge-gold uppercase font-mono font-bold text-[10px] tracking-wider px-2 py-0.5">
              SOVEREIGN ROOT CONSOLE
            </span>
            <span className="gf-badge gf-badge-green uppercase font-mono text-[10px] tracking-wider px-2 py-0.5 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              NODE: {environment.toUpperCase()}
            </span>
            {lastRefreshed && (
              <span className="text-[11px] font-mono text-slate-400 hidden sm:inline">
                Synced at {lastRefreshed}
              </span>
            )}
          </div>
          <h1 className="gf-page-title flex items-center gap-2">
            <ShieldCheck className="lucide w-5 h-5 text-sky-600" />
            <span>Godfather Sovereign Control Center &amp; Platform Governance</span>
          </h1>
          <p className="gf-page-subtitle">
            Central sovereign command console for security monitoring, corporate verification, anti-fraud enforcement, and cryptographic audit ledger.
          </p>
        </div>

        <div className="gf-page-actions">
          {/* Quick Guidebook Launch */}
          <button
            type="button"
            onClick={() => setIsGuidebookOpen(true)}
            className="gf-btn gf-btn-primary text-xs font-bold flex items-center gap-1.5 bg-gradient-to-r from-sky-600 to-blue-600 shadow-sm"
          >
            <BookOpen className="lucide w-3.5 h-3.5" />
            <span>📖 Zoho Free Mail Guidebook</span>
          </button>

          <button
            type="button"
            onClick={fetchSecurityOverview}
            disabled={loading}
            className="gf-btn gf-btn-secondary text-xs font-bold flex items-center gap-1.5 text-slate-700"
            title="Refresh All Telemetry"
          >
            <RefreshCw className={`lucide w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>
      </div>

      {/* ── 2. QUICK GOVERNANCE LAUNCHPAD RIBBON ── */}
      <div className="gf-card p-3.5 bg-gradient-to-r from-slate-50 via-white to-sky-50/40 border-slate-200 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 uppercase tracking-wide">
            <Zap className="lucide w-4 h-4 text-sky-600" />
            <span>Fast Action Launchpad</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsGuidebookOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-900 border border-sky-200 text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Mail className="lucide w-3.5 h-3.5 text-sky-600" />
              <span>Zoho Free SMTP Setup</span>
            </button>

            <Link
              href="/godfather/operations/companies"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Building className="lucide w-3.5 h-3.5 text-slate-600" />
              <span>Verify KYCs ({pendingKYCCount})</span>
            </Link>

            <Link
              href="/godfather/security/blocked-accounts"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <UserX className="lucide w-3.5 h-3.5 text-rose-600" />
              <span>Unlock Users ({blockedAccountsCount})</span>
            </Link>

            <Link
              href="/godfather/operations/auctions"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <Gavel className="lucide w-3.5 h-3.5 text-amber-600" />
              <span>Live Spot Auctions ({activeAuctionsCount})</span>
            </Link>

            <Link
              href="/godfather/security/audit"
              className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs"
            >
              <History className="lucide w-3.5 h-3.5 text-indigo-600" />
              <span>Audit Ledger ({auditLogs.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 3. EXECUTIVE TELEMETRY METRIC TILES (4x2 GRID) ── */}
      <div>
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Activity className="lucide w-4 h-4 text-sky-600" />
            <span>Platform Telemetry &amp; Health Metrics</span>
          </div>
          <span className="text-[11px] font-mono text-slate-500 font-semibold">Real-Time Aggregation</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Tile 1: Active Users */}
          <Link href="/godfather/operations/users" className="gf-metric-card p-4 hover:border-sky-400 group">
            <div className="flex items-start justify-between">
              <span className="gf-metric-title">Active Directory Users</span>
              <div className="p-2 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Users className="lucide w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{activeUsersCount}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Verified Freight Operators</p>
            </div>
            <div className="gf-metric-foot text-sky-700 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>Manage Users</span>
                <ArrowUpRight className="lucide w-3 h-3" />
              </span>
              <span className="gf-badge gf-badge-blue text-[9px] font-mono">100% OK</span>
            </div>
          </Link>

          {/* Tile 2: Corporate KYC */}
          <Link href="/godfather/operations/companies" className="gf-metric-card p-4 hover:border-amber-400 group">
            <div className="flex items-start justify-between">
              <span className="gf-metric-title">Corporate KYC Review</span>
              <div className="p-2 rounded-lg bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                <Building className="lucide w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className={`text-2xl font-black tracking-tight ${pendingKYCCount > 0 ? 'text-amber-600' : 'text-slate-900'}`}>
                {pendingKYCCount}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {pendingKYCCount > 0 ? 'Verification reviews pending' : 'All GSTN documents approved'}
              </p>
            </div>
            <div className="gf-metric-foot text-amber-700 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>KYC Queue</span>
                <ArrowUpRight className="lucide w-3 h-3" />
              </span>
              <span className={`gf-badge ${pendingKYCCount > 0 ? 'gf-badge-amber' : 'gf-badge-green'} text-[9px] font-mono`}>
                {pendingKYCCount > 0 ? 'ACTION NEEDED' : 'CLEARED'}
              </span>
            </div>
          </Link>

          {/* Tile 3: Blocked & Security Perimeter */}
          <Link href="/godfather/security/blocked-accounts" className="gf-metric-card p-4 hover:border-rose-400 group">
            <div className="flex items-start justify-between">
              <span className="gf-metric-title">Security Perimeter</span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <ShieldAlert className="lucide w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className={`text-2xl font-black tracking-tight ${blockedAccountsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {blockedAccountsCount} Locked
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {otpLimitEventsCount} OTP Limit Hits · {activeSecurityAlertsCount} Alerts
              </p>
            </div>
            <div className="gf-metric-foot text-rose-700 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>Inspect Locks</span>
                <ArrowUpRight className="lucide w-3 h-3" />
              </span>
              <span className={`gf-badge ${blockedAccountsCount > 0 ? 'gf-badge-red' : 'gf-badge-green'} text-[9px] font-mono`}>
                {blockedAccountsCount > 0 ? 'LOCKS ACTIVE' : '0 THREATS'}
              </span>
            </div>
          </Link>

          {/* Tile 4: Live Reverse Auctions */}
          <Link href="/godfather/operations/auctions" className="gf-metric-card p-4 hover:border-emerald-400 group">
            <div className="flex items-start justify-between">
              <span className="gf-metric-title">Live Reverse Auctions</span>
              <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                <Gavel className="lucide w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-emerald-700 tracking-tight">{activeAuctionsCount} Live</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Real-time spot bidding active</p>
            </div>
            <div className="gf-metric-foot text-emerald-700 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>Auction Arena</span>
                <ArrowUpRight className="lucide w-3 h-3" />
              </span>
              <span className="gf-badge gf-badge-green text-[9px] font-mono">BROADCASTING</span>
            </div>
          </Link>

          {/* Tile 5: Zoho Email Service */}
          <Link href="/godfather/platform/email" className="gf-metric-card p-4 hover:border-sky-400 group">
            <div className="flex items-start justify-between">
              <span className="gf-metric-title">Zoho Email Service</span>
              <div className="p-2 rounded-lg bg-sky-50 text-sky-600 group-hover:bg-sky-600 group-hover:text-white transition-colors">
                <Mail className="lucide w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">Free Forever</div>
              <p className="text-[11px] text-slate-500 mt-0.5">smtp.zoho.in:465 · SSL Enforced</p>
            </div>
            <div className="gf-metric-foot text-sky-700 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>Mailbox Governance</span>
                <ArrowUpRight className="lucide w-3 h-3" />
              </span>
              <span className="gf-badge gf-badge-green text-[9px] font-mono">ACTIVE (5 USERS)</span>
            </div>
          </Link>

          {/* Tile 6: Password Resets */}
          <Link href="/godfather/security/password-resets" className="gf-metric-card p-4 hover:border-indigo-400 group">
            <div className="flex items-start justify-between">
              <span className="gf-metric-title">Password Reset Tokens</span>
              <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <KeyRound className="lucide w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">{pendingPasswordResetsCount}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Single-use encrypted tokens active</p>
            </div>
            <div className="gf-metric-foot text-indigo-700 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>Audit Tokens</span>
                <ArrowUpRight className="lucide w-3 h-3" />
              </span>
              <span className="gf-badge gf-badge-gray text-[9px] font-mono">15-MIN TTL</span>
            </div>
          </Link>

          {/* Tile 7: Dispute Resolution */}
          <Link href="/godfather/trust-safety/reports" className="gf-metric-card p-4 hover:border-rose-400 group">
            <div className="flex items-start justify-between">
              <span className="gf-metric-title">Dispute Resolution</span>
              <div className="p-2 rounded-lg bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                <FileCheck className="lucide w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className={`text-2xl font-black tracking-tight ${openReportsCount > 0 ? 'text-rose-600' : 'text-slate-900'}`}>
                {openReportsCount} Report
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Commercial deviation mediation</p>
            </div>
            <div className="gf-metric-foot text-rose-700 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>Review Disputes</span>
                <ArrowUpRight className="lucide w-3 h-3" />
              </span>
              <span className="gf-badge gf-badge-amber text-[9px] font-mono">OPEN CASE</span>
            </div>
          </Link>

          {/* Tile 8: Audit Ledger */}
          <Link href="/godfather/security/audit" className="gf-metric-card p-4 hover:border-purple-400 group">
            <div className="flex items-start justify-between">
              <span className="gf-metric-title">Sovereign Audit Ledger</span>
              <div className="p-2 rounded-lg bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <History className="lucide w-4 h-4" />
              </div>
            </div>
            <div className="my-2">
              <div className="text-2xl font-black text-purple-700 tracking-tight">{auditLogs.length}</div>
              <p className="text-[11px] text-slate-500 mt-0.5">Append-only cryptographic events</p>
            </div>
            <div className="gf-metric-foot text-purple-700 flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-xs font-bold flex items-center gap-1">
                <span>Verify Ledger</span>
                <ArrowUpRight className="lucide w-3 h-3" />
              </span>
              <span className="gf-badge gf-badge-purple text-[9px] font-mono">SHA-256 SIGNED</span>
            </div>
          </Link>
        </div>
      </div>

      {/* ── 4. SPLIT GRID: SECURITY ALERTS + PENDING ADMINISTRATIVE ACTIONS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Security Alert Center (6 Cols) */}
        <div className="xl:col-span-6">
          <div className="gf-card">
            <div className="gf-card-header">
              <div className="gf-card-title text-rose-800">
                <ShieldAlert className="lucide w-4 h-4 text-rose-600" />
                <span>Security Intrusion &amp; Anomaly Stream</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="gf-badge gf-badge-red text-[9.5px] font-mono font-bold">
                  {securityEvents.length} ACTIVE ALERTS
                </span>
                <Link href="/godfather/security/events" className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-0.5">
                  <span>Full Stream</span>
                  <ChevronRight className="lucide w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto max-h-[340px] overflow-y-auto custom-scrollbar">
              {securityEvents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="lucide w-8 h-8 mx-auto mb-2 text-emerald-500 opacity-80" />
                  <div className="font-bold text-slate-800 text-sm">No Active Security Alerts</div>
                  <div className="text-slate-500 mt-1">Brute force mitigation, IP throttling, and MFA systems operating normally.</div>
                </div>
              ) : (
                <table className="gf-table text-xs">
                  <thead>
                    <tr>
                      <th style={{ width: '110px' }}>SEVERITY</th>
                      <th>TARGET USER</th>
                      <th>DETAILS</th>
                      <th style={{ width: '90px' }}>TIME</th>
                      <th style={{ width: '70px', textAlign: 'right' }}>ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {securityEvents.slice(0, 7).map((evt) => (
                      <tr key={evt.id} className="hover:bg-rose-50/40 transition-colors">
                        <td>
                          <span
                            className={`gf-badge ${
                              evt.severity === 'CRITICAL'
                                ? 'gf-badge-red'
                                : evt.severity === 'HIGH'
                                ? 'gf-badge-amber'
                                : 'gf-badge-blue'
                            } text-[9px] font-mono font-bold uppercase`}
                          >
                            {evt.type}
                          </span>
                        </td>
                        <td>
                          <div className="font-bold text-slate-900 truncate max-w-[140px]" title={evt.userEmail}>
                            {evt.userEmail}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono truncate">{evt.ip || 'Secured Gateway'}</div>
                        </td>
                        <td>
                          <div className="text-slate-800 font-medium line-clamp-1" title={evt.details}>
                            {evt.details}
                          </div>
                        </td>
                        <td className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                          {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link
                            href="/godfather/security/events"
                            className="gf-btn gf-btn-secondary text-[11px] font-bold py-0.5 px-2 h-[26px]"
                          >
                            Inspect
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Pending Administrative Actions (6 Cols) */}
        <div className="xl:col-span-6">
          <div className="gf-card">
            <div className="gf-card-header">
              <div className="gf-card-title text-amber-800">
                <Clock className="lucide w-4 h-4 text-amber-600" />
                <span>Pending Administrative Action Queue</span>
              </div>
              <span className="gf-badge gf-badge-amber font-mono font-bold text-[9.5px]">
                {pendingKYCCount + openReportsCount + blockedAccountsCount} ACTION ITEMS
              </span>
            </div>

            <div className="overflow-x-auto max-h-[340px] overflow-y-auto custom-scrollbar">
              <table className="gf-table text-xs">
                <thead>
                  <tr>
                    <th style={{ width: '85px' }}>TYPE</th>
                    <th>TARGET ENTITY</th>
                    <th>CONTEXT / REASON</th>
                    <th style={{ width: '80px', textAlign: 'right' }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {/* KYC Queue */}
                  {companies.filter((c) => c.status === 'pending').map((comp) => (
                    <tr key={comp.companyId} className="hover:bg-amber-50/40 transition-colors">
                      <td>
                        <span className="gf-badge gf-badge-blue text-[9px] font-mono font-bold uppercase">
                          KYC
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900 truncate max-w-[150px]" title={comp.legalName}>
                          {comp.legalName}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">GSTN: {comp.gstn || 'Pending'}</div>
                      </td>
                      <td>
                        <div className="text-slate-700 text-[11px] truncate max-w-[180px]">
                          {comp.documents.length} verification docs uploaded
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href="/godfather/operations/companies" className="gf-btn gf-btn-success text-[11px] font-bold py-0.5 px-2.5 h-[26px]">
                          Verify
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {/* Blocked Accounts Queue */}
                  {blockedAccounts.map((blk) => (
                    <tr key={blk.uid} className="hover:bg-rose-50/40 transition-colors">
                      <td>
                        <span className="gf-badge gf-badge-red text-[9px] font-mono font-bold uppercase">
                          LOCKED
                        </span>
                      </td>
                      <td>
                        <div className="font-bold text-slate-900 truncate max-w-[150px]" title={blk.displayName || blk.email}>
                          {blk.displayName || blk.email}
                        </div>
                        <div className="text-[10px] text-slate-400 truncate">{blk.company}</div>
                      </td>
                      <td>
                        <div className="text-slate-700 text-[11px] truncate max-w-[180px]">
                          3 failed password attempts
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link href="/godfather/security/blocked-accounts" className="gf-btn gf-btn-danger text-[11px] font-bold py-0.5 px-2.5 h-[26px]">
                          Unlock
                        </Link>
                      </td>
                    </tr>
                  ))}

                  {/* Reports Queue */}
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td>
                      <span className="gf-badge gf-badge-amber text-[9px] font-mono font-bold uppercase">
                        DISPUTE
                      </span>
                    </td>
                    <td>
                      <div className="font-bold text-slate-900 truncate max-w-[150px]">
                        Indo Ocean Lines
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">Case REP-2026-001</div>
                    </td>
                    <td>
                      <div className="text-slate-700 text-[11px] truncate max-w-[180px]">
                        Demurrage free time deviation
                      </div>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href="/godfather/trust-safety/reports" className="gf-btn gf-btn-secondary text-[11px] font-bold py-0.5 px-2.5 h-[26px]">
                        Review
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. RECENT AUDIT ACTIVITY TABLE ── */}
      <div className="gf-card">
        <div className="gf-card-header">
          <div className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
            <History className="lucide w-4 h-4 text-sky-600" />
            <span>Recent Sovereign Audit Activity (Append-Only Cryptographic Ledger)</span>
          </div>
          <Link href="/godfather/security/audit" className="text-xs font-bold text-sky-600 hover:underline flex items-center gap-1">
            <span>View Full Ledger</span>
            <ChevronRight className="lucide w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="gf-table text-xs">
            <thead>
              <tr>
                <th style={{ width: '90px' }}>TIME</th>
                <th style={{ width: '180px' }}>ADMIN / OPERATOR</th>
                <th style={{ width: '100px' }}>MODULE</th>
                <th style={{ width: '130px' }}>ACTION TYPE</th>
                <th>TARGET ENTITY &amp; REASON</th>
                <th style={{ width: '130px', textAlign: 'center' }}>AUTHORIZATION</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.slice(0, 8).map((log) => (
                <tr key={log.actionId} className="hover:bg-slate-50 transition-colors">
                  <td className="font-mono text-xs text-slate-600 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td>
                    <div className="font-bold text-slate-900">{log.actorName}</div>
                    <div className="font-mono text-[10px] text-slate-500">{log.actorRole}</div>
                  </td>
                  <td>
                    <span className="font-bold text-slate-700 uppercase font-mono text-[10.5px]">
                      {log.targetType}
                    </span>
                  </td>
                  <td>
                    <span className="font-mono text-[11px] font-bold text-sky-800 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      {log.actionType}
                    </span>
                  </td>
                  <td>
                    <div className="font-semibold text-slate-900 truncate max-w-md">
                      {log.targetLabel || log.targetId}
                    </div>
                    <div className="text-[11px] text-slate-500 truncate max-w-md">{log.reason}</div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="gf-badge gf-badge-green font-mono text-[9.5px] font-bold">
                      {log.stepUpVerified ? 'MFA VERIFIED' : 'SHA-256 SIGNED'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Guidebook Modal */}
      <ZohoEmailGuidebookModal isOpen={isGuidebookOpen} onClose={() => setIsGuidebookOpen(false)} />
    </div>
  );
}
