'use client';

import React from 'react';
import Link from 'next/link';
import {
  Building,
  AlertOctagon,
  Gavel,
  Clock,
  ShieldAlert,
  CreditCard,
  Calendar,
  FileSpreadsheet,
  FolderLock,
  Activity,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Users,
  Zap,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

export default function GodfatherDashboardPage() {
  const {
    companies,
    auctions,
    blocks,
    blacklist,
    rateImports,
    cases,
    invoices,
    auditLogs,
  } = useGodfatherData();
  const { operator, environment } = useGodfatherAuth();

  // Computed actionable metric tallies
  const pendingKYC = companies.filter((c) => c.status === 'pending' || c.status === 'additional_info_required').length;
  const liveAuctions = auctions.filter((a) => a.status === 'Live').length;
  const auctionsEndingSoon = auctions.filter((a) => a.status === 'Live' && a.timeLeft?.includes('m')).length;
  const activeBlocks = blocks.filter((b) => b.status === 'active').length + blacklist.filter((b) => b.status === 'active').length;
  const importsNeedingReview = rateImports.filter((i) => i.status === 'Needs Review' || i.status === 'Validating').length;
  const openCases = cases.filter((c) => c.status === 'open' || c.status === 'investigating').length;
  const recentAuditCount = auditLogs.length;

  const OPERATIONAL_WIDGETS = [
    {
      title: 'Pending Company Verifications',
      value: pendingKYC,
      subtitle: `${companies.filter((c) => c.status === 'pending').length} new KYC documents awaiting officer review`,
      href: '/godfather/operations/companies',
      badge: 'Action Required',
      badgeVariant: pendingKYC > 0 ? 'amber' : 'green',
      icon: Building,
    },
    {
      title: 'Live Freight Auctions',
      value: liveAuctions,
      subtitle: `${auctionsEndingSoon} closing within active 2-hour window`,
      href: '/godfather/operations/auctions',
      badge: 'Live Operations',
      badgeVariant: 'green',
      icon: Gavel,
    },
    {
      title: 'Active Blocks & Blacklists',
      value: activeBlocks,
      subtitle: `${blocks.length} member restrictions · ${blacklist.length} public blacklist cases`,
      href: '/godfather/trust-safety/blacklist',
      badge: 'Trust & Safety',
      badgeVariant: activeBlocks > 0 ? 'red' : 'gray',
      icon: ShieldAlert,
    },
    {
      title: 'Rate Imports Needing Review',
      value: importsNeedingReview,
      subtitle: 'Batch Excel/CSV tariff files with invalid row flags',
      href: '/godfather/operations/rates',
      badge: 'Tariff Integrity',
      badgeVariant: importsNeedingReview > 0 ? 'amber' : 'blue',
      icon: FileSpreadsheet,
    },
    {
      title: 'Active Compliance & Support Cases',
      value: openCases,
      subtitle: `${cases.filter((c) => c.severity === 'critical' || c.severity === 'high').length} high/critical dispute investigations`,
      href: '/godfather/support/cases',
      badge: 'Case Queue',
      badgeVariant: openCases > 0 ? 'red' : 'gray',
      icon: FolderLock,
    },
    {
      title: 'System Health & Engine Services',
      value: '100% OK',
      subtitle: 'Firestore Rules · Cloud Functions · TOTP Gateway Active',
      href: '/godfather/platform/config',
      badge: environment,
      badgeVariant: 'green',
      icon: Activity,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Platform Banner */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-mono font-bold">GODFATHER / CONTROL</span>
            <span className="gf-badge gf-badge-green text-[11px] font-bold">SOVEREIGN PRIVILEGE ACTIVE</span>
          </div>
          <h1 className="gf-page-title">Executive Operations & Governance Overview</h1>
          <p className="gf-page-subtitle">
            Authenticated as <strong className="text-slate-200">{operator.displayName}</strong> ({operator.roleTitle}) · Session secured via Con.FR8X.IN VPN
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/godfather/search" className="gf-btn gf-btn-secondary text-xs">
            Global Search
          </Link>
          <Link href="/godfather/platform/audit" className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold">
            <FileText className="lucide w-3.5 h-3.5" />
            Audit Ledger ({recentAuditCount})
          </Link>
        </div>
      </div>

      {/* Actionable Dense Operational Widgets */}
      <div className="gf-metric-grid">
        {OPERATIONAL_WIDGETS.map((widget, idx) => {
          const Icon = widget.icon;
          return (
            <Link key={idx} href={widget.href} className="gf-metric-card">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="gf-metric-title">{widget.title}</span>
                  <div className="p-1.5 rounded bg-slate-800 text-sky-400">
                    <Icon className="lucide w-4 h-4" />
                  </div>
                </div>
                <div className="gf-metric-value">{widget.value}</div>
                <p className="text-xs text-mut mt-1 leading-snug">{widget.subtitle}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className={`gf-badge gf-badge-${widget.badgeVariant} text-[10px]`}>
                  {widget.badge}
                </span>
                <div className="gf-metric-foot text-xs">
                  Inspect <ArrowRight className="lucide w-3 h-3" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Two Column Operational Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Pending KYC & Compliance Queue */}
        <div className="gf-card">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building className="lucide w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-slate-100">Pending Corporate KYC Queue</h3>
            </div>
            <Link href="/godfather/operations/companies" className="text-xs text-sky-400 hover:underline">
              View All ({companies.length}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {companies.slice(0, 3).map((comp) => (
              <div key={comp.companyId} className="p-3.5 flex items-center justify-between hover:bg-slate-850 transition-colors text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-200">{comp.legalName}</span>
                    <span className={`gf-badge gf-badge-${comp.status === 'verified' ? 'green' : comp.status === 'pending' ? 'amber' : 'red'} text-[10px]`}>
                      {comp.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-mut text-[11px] mt-0.5">
                    GST: <span className="font-mono text-slate-300">{comp.gstn || 'N/A'}</span> · City: {comp.city}, {comp.country}
                  </div>
                </div>

                <Link
                  href={`/godfather/operations/companies?id=${comp.companyId}`}
                  className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5"
                >
                  Review KYC
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Immutable Audit Trail */}
        <div className="gf-card">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="lucide w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-100">Live Immutable Audit Feed</h3>
            </div>
            <Link href="/godfather/platform/audit" className="text-xs text-emerald-400 hover:underline">
              Full Ledger ({auditLogs.length}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-800">
            {auditLogs.slice(0, 3).map((log) => (
              <div key={log.actionId} className="p-3.5 flex items-start justify-between hover:bg-slate-850 transition-colors text-xs">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] text-sky-400 font-bold bg-sky-950 px-1 py-0.5 rounded border border-sky-900">
                      {log.actionType}
                    </span>
                    <span className="text-[10px] text-mut font-mono">{log.correlationId}</span>
                  </div>
                  <div className="font-semibold text-slate-200 truncate">{log.targetLabel || log.targetId}</div>
                  <p className="text-[11px] text-mut truncate mt-0.5">{log.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] text-faint block">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  <span className="text-[10px] text-slate-400 font-mono">{log.actorRole.replace('godfather_', '')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
