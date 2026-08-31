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
  Scale,
  Filter,
  BadgeCheck,
  Receipt,
  Gift,
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
    sensitiveWords,
    termsAgreements,
    complianceRecords,
    paymentGateways,
  } = useGodfatherData();
  const { operator, environment } = useGodfatherAuth();

  // Computed actionable metric tallies
  const pendingKYC = companies.filter((c) => c.status === 'pending' || c.status === 'additional_info_required').length;
  const liveAuctions = auctions.filter((a) => a.status === 'Live').length;
  const activeBlocks = blocks.filter((b) => b.status === 'active').length + blacklist.filter((b) => b.status === 'active').length;
  const activeSensitiveRules = sensitiveWords.filter((r) => r.active).length;
  const pendingComplianceAudits = complianceRecords.filter((c) => c.status === 'remediation_required' || c.status === 'under_investigation').length;
  const activeGateways = paymentGateways.filter((g) => g.enabled).length;

  const OPERATIONAL_WIDGETS = [
    {
      title: 'Pending Company Verifications',
      value: pendingKYC,
      subtitle: `${companies.filter((c) => c.status === 'pending').length} KYC documents awaiting compliance review`,
      href: '/godfather/operations/companies',
      badge: 'Action Required',
      badgeVariant: pendingKYC > 0 ? 'amber' : 'green',
      icon: Building,
    },
    {
      title: 'Live Freight Auctions',
      value: liveAuctions,
      subtitle: 'Active reverse tenders with binding bid rooms',
      href: '/godfather/operations/auctions',
      badge: 'Live Operations',
      badgeVariant: 'blue',
      icon: Gavel,
    },
    {
      title: 'Active Blocks & Blacklists',
      value: activeBlocks,
      subtitle: `${blocks.length} member restrictions · ${blacklist.length} public cases`,
      href: '/godfather/trust-safety/blacklist',
      badge: 'Trust & Safety',
      badgeVariant: activeBlocks > 0 ? 'rose' : 'green',
      icon: ShieldAlert,
    },
    {
      title: 'Sensitive Words Filter',
      value: `${activeSensitiveRules} Rules`,
      subtitle: 'Automated real-time text scrubbing & anti-fraud engine',
      href: '/godfather/trust-safety/sensitive-words',
      badge: 'Regex Active',
      badgeVariant: 'green',
      icon: Filter,
    },
    {
      title: 'Compliance & Sanctions',
      value: `${pendingComplianceAudits} Flagged`,
      subtitle: 'Statutory GSTIN, PAN, AML & MTO licensing checks',
      href: '/godfather/trust-safety/compliance',
      badge: 'Regulatory',
      badgeVariant: pendingComplianceAudits > 0 ? 'amber' : 'green',
      icon: BadgeCheck,
    },
    {
      title: 'Payment Rails & Gateways',
      value: `${activeGateways} Live`,
      subtitle: 'Razorpay, PayPal, Stripe, UPI & Bank Wire',
      href: '/godfather/commerce/payments',
      badge: 'KMS Secured',
      badgeVariant: 'green',
      icon: CreditCard,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Platform Banner */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">PLATFORM SUPER ADMIN</span>
            <span className="gf-badge gf-badge-gold text-[11px] font-mono font-bold">SOVEREIGN ROOT</span>
          </div>
          <h1 className="gf-page-title">Executive Operations & Governance Console</h1>
          <p className="gf-page-subtitle">
            Authenticated as <strong className="text-slate-900 font-bold">{operator.displayName}</strong> ({operator.roleTitle}) · Node: <span className="font-mono font-semibold text-sky-700">{environment}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/godfather/operations/users" className="gf-btn gf-btn-secondary text-xs flex items-center gap-1.5 font-bold">
            <Gift className="lucide w-3.5 h-3.5 text-sky-600" />
            Grant 1-Mo Trial
          </Link>
          <Link href="/godfather/platform/terms" className="gf-btn gf-btn-secondary text-xs flex items-center gap-1.5 font-bold">
            <Scale className="lucide w-3.5 h-3.5 text-slate-600" />
            Terms & Clickwrap
          </Link>
          <Link href="/godfather/commerce/invoices" className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold">
            <Receipt className="lucide w-3.5 h-3.5" />
            Accounting Ledger
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
                  <div className="p-2 rounded-lg bg-sky-50 text-sky-700 border border-sky-200">
                    <Icon className="lucide w-4 h-4" />
                  </div>
                </div>
                <div className="gf-metric-value">{widget.value}</div>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{widget.subtitle}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className={`gf-badge gf-badge-${widget.badgeVariant} text-[10px]`}>
                  {widget.badge}
                </span>
                <div className="gf-metric-foot text-xs text-sky-700 font-bold">
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
          <div className="gf-card-header">
            <div className="gf-card-title">
              <Building className="lucide w-4 h-4 text-sky-600" />
              <span>Pending Corporate KYC Queue</span>
            </div>
            <Link href="/godfather/operations/companies" className="text-xs text-sky-700 hover:text-sky-900 font-bold">
              View All ({companies.length}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {companies.slice(0, 3).map((comp) => (
              <div key={comp.companyId} className="p-3.5 flex items-center justify-between hover:bg-slate-50 transition-colors text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{comp.legalName}</span>
                    <span className={`gf-badge gf-badge-${comp.status === 'verified' ? 'green' : comp.status === 'pending' ? 'amber' : 'red'} text-[10px]`}>
                      {comp.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    GST: <span className="font-mono text-slate-800 font-bold">{comp.gstn || 'N/A'}</span> · City: {comp.city}, {comp.country}
                  </div>
                </div>

                <Link
                  href={`/godfather/operations/companies?id=${comp.companyId}`}
                  className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 font-bold"
                >
                  Review KYC
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Recent Immutable Audit Trail */}
        <div className="gf-card">
          <div className="gf-card-header">
            <div className="gf-card-title">
              <FileText className="lucide w-4 h-4 text-sky-600" />
              <span>Live Platform Audit Feed</span>
            </div>
            <Link href="/godfather/platform/audit" className="text-xs text-sky-700 hover:text-sky-900 font-bold">
              Full Ledger ({auditLogs.length}) →
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {auditLogs.slice(0, 3).map((log) => (
              <div key={log.actionId} className="p-3.5 flex items-start justify-between hover:bg-slate-50 transition-colors text-xs">
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[10px] text-sky-800 font-bold bg-sky-100 px-1.5 py-0.5 rounded border border-sky-200">
                      {log.actionType}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">{log.correlationId}</span>
                  </div>
                  <div className="font-semibold text-slate-900 truncate">{log.targetLabel || log.targetId}</div>
                  <p className="text-[11px] text-slate-600 truncate mt-0.5">{log.reason}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="text-[10px] text-slate-500 block font-mono">{new Date(log.createdAt).toLocaleTimeString()}</span>
                  <span className="text-[10px] text-sky-700 font-mono font-bold">{log.actorRole.replace('godfather_', '')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

