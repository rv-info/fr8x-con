'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, Building, Gavel, DollarSign, Briefcase, Database,
  Filter, BadgeCheck, Shield, MessageSquare, FileCheck,
  CreditCard, Receipt, Percent, Scale, Bell, Mail, FileText,
  Key, Sliders, ChevronDown, ChevronRight, ShieldCheck,
  AlertOctagon, LayoutDashboard, Search, Lock, UserX,
  KeyRound, Smartphone, ShieldAlert, History,
} from 'lucide-react';
import { useGodfatherAuth, PlatformEnvironment } from '@/lib/godfather/context/GodfatherAuthContext';

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { label: 'Users & Profiles', href: '/godfather/operations/users', icon: Users },
      { label: 'Companies & KYC', href: '/godfather/operations/companies', icon: Building },
      { label: 'Auctions & Bids', href: '/godfather/operations/auctions', icon: Gavel },
      { label: 'Rates & Imports', href: '/godfather/operations/rates', icon: DollarSign },
      { label: 'Jobs & Advertisements', href: '/godfather/operations/jobs', icon: Briefcase },
      { label: 'Master Data Management', href: '/godfather/operations/master-data', icon: Database },
    ],
  },
  {
    title: 'Trust & Safety',
    items: [
      { label: 'Content Moderation', href: '/godfather/trust-safety/moderation', icon: AlertOctagon },
      { label: 'Sensitive Words Filter', href: '/godfather/trust-safety/sensitive-words', icon: Filter },
      { label: 'Compliance & Regulations', href: '/godfather/trust-safety/compliance', icon: BadgeCheck },
      { label: 'Blacklists & Blocks', href: '/godfather/trust-safety/blacklist', icon: Shield },
      { label: 'Nexus Reviews', href: '/godfather/trust-safety/nexus', icon: MessageSquare },
      { label: 'Reports & Appeals', href: '/godfather/trust-safety/reports', icon: FileCheck },
    ],
  },
  {
    title: 'Security & Auth',
    items: [
      { label: 'Authentication Security', href: '/godfather/security', icon: Lock },
      { label: 'Blocked Accounts', href: '/godfather/security/blocked-accounts', icon: UserX },
      { label: 'Password Reset Requests', href: '/godfather/security/password-resets', icon: KeyRound },
      { label: 'OTP Activity & Limits', href: '/godfather/security/otp-activity', icon: Smartphone },
      { label: 'Security Incident Stream', href: '/godfather/security/events', icon: ShieldAlert },
      { label: 'Cryptographic Audit Trail', href: '/godfather/security/audit', icon: History },
    ],
  },
  {
    title: 'Commerce & Accounting',
    items: [
      { label: 'Plans & Pricing', href: '/godfather/commerce/plans', icon: DollarSign },
      { label: 'Payment Gateways', href: '/godfather/commerce/payments', icon: CreditCard },
      { label: 'Accounting & GST Taxes', href: '/godfather/commerce/invoices', icon: Receipt },
      { label: 'Commercial Fees & Benefits', href: '/godfather/commerce/fees', icon: Percent },
    ],
  },
  {
    title: 'Platform & Governance',
    items: [
      { label: 'Terms & Safety Agreements', href: '/godfather/platform/terms', icon: Scale },
      { label: 'Notification Templates', href: '/godfather/platform/templates', icon: Bell },
      { label: 'Zoho Email Service', href: '/godfather/platform/email', icon: Mail },
      { label: 'Data & Audit Logs', href: '/godfather/platform/audit', icon: FileText },
      { label: 'Access Control & Roles', href: '/godfather/platform/access', icon: Key },
      { label: 'Feature Flags & Config', href: '/godfather/platform/config', icon: Sliders },
    ],
  },
];

export function GodfatherSidebar() {
  const pathname = usePathname();
  const { operator, operatorsList, switchOperator, environment, setEnvironment } = useGodfatherAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Operations: true,
    'Trust & Safety': true,
    'Security & Auth': true,
    'Commerce & Accounting': true,
    'Platform & Governance': true,
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: prev[title] === false }));
  };

  const getEnvBadgeClass = (env: PlatformEnvironment) => {
    if (env === 'Production') return 'gf-badge-green';
    if (env === 'Staging') return 'gf-badge-amber';
    return 'gf-badge-blue';
  };

  return (
    <aside className="gf-sidebar">
      {/* Brand Header */}
      <div className="gf-sidebar-header">
        <Link href="/godfather" className="gf-brand-wrap">
          <div className="gf-brand-logo-badge">
            <ShieldCheck className="lucide w-4 h-4 text-sky-400" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="gf-brand-title">
              <span>GODFATHER</span>
              <span className="gf-badge gf-badge-gold text-[9px] uppercase font-mono py-0 px-1.5">
                SOVEREIGN
              </span>
            </div>
            <div className="gf-brand-subtitle">FR8X SUPER ADMIN</div>
          </div>
        </Link>

        {/* Env Switcher */}
        <div className="gf-env-select-wrap">
          <span className={`gf-badge ${getEnvBadgeClass(environment)} text-[10px] uppercase font-bold flex items-center gap-1`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
            {environment === 'Production' ? 'PROD' : environment === 'Staging' ? 'STAGING' : 'LOCAL'}
          </span>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as PlatformEnvironment)}
            className="gf-env-dropdown"
          >
            <option value="Production">Prod Node</option>
            <option value="Staging">Staging</option>
            <option value="Local Emulator">Emulator</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <nav className="gf-sidebar-nav custom-scrollbar">
        <div className="gf-nav-group-root">
          <Link href="/godfather" className={`gf-nav-link ${pathname === '/godfather' ? 'active' : ''}`}>
            <LayoutDashboard className="lucide" />
            <span>Overview Dashboard</span>
          </Link>
          <Link href="/godfather/search" className={`gf-nav-link ${pathname === '/godfather/search' ? 'active' : ''}`}>
            <Search className="lucide" />
            <span>Global Deep Search</span>
          </Link>
        </div>

        {NAV_SECTIONS.map((section) => {
          const isOpen = openSections[section.title] ?? true;
          return (
            <div key={section.title} className="gf-nav-section">
              <button type="button" onClick={() => toggleSection(section.title)} className="gf-nav-section-header">
                <span>{section.title}</span>
                {isOpen ? (
                  <ChevronDown className="lucide w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="lucide w-3.5 h-3.5" />
                )}
              </button>
              {isOpen && (
                <div className="flex flex-col gap-0.5 mt-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/godfather' && pathname.startsWith(item.href));
                    return (
                      <Link key={item.href} href={item.href} className={`gf-nav-link ${isActive ? 'active' : ''}`}>
                        <Icon className="lucide" />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Operator Footer */}
      <div className="gf-sidebar-footer">
        <div className="relative">
          <button type="button" onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)} className="gf-operator-pill">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold flex items-center justify-center text-xs flex-shrink-0">
                {operator.displayName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{operator.displayName}</div>
                <div className="text-[10px] text-sky-700 font-mono font-semibold truncate">{operator.roleTitle}</div>
              </div>
            </div>
            <ChevronDown className="lucide w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>

          {isRoleDropdownOpen && (
            <div className="gf-role-dropdown-menu">
              <div className="px-2 py-1 text-[9.5px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Switch Authorized Persona
              </div>
              {operatorsList.map((op) => (
                <button
                  key={op.uid}
                  type="button"
                  onClick={() => {
                    switchOperator(op.uid);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between transition-colors ${
                    op.uid === operator.uid
                      ? 'bg-sky-50 text-sky-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="truncate">
                    <div>{op.displayName}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{op.roleTitle}</div>
                  </div>
                  {op.uid === operator.uid && (
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-600 flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
