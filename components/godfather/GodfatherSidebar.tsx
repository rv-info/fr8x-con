'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users,
  Building,
  Gavel,
  DollarSign,
  Briefcase,
  Database,
  Filter,
  BadgeCheck,
  Shield,
  MessageSquare,
  FileCheck,
  CreditCard,
  Receipt,
  Percent,
  Scale,
  Bell,
  Mail,
  FileText,
  Key,
  Sliders,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
  AlertOctagon,
  LayoutDashboard,
  Search,
  Lock,
  UserX,
  KeyRound,
  Smartphone,
  ShieldAlert,
  History,
} from 'lucide-react';
import { useGodfatherAuth, PlatformEnvironment } from '@/lib/godfather/context/GodfatherAuthContext';

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    requiredPermission?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Operations',
    items: [
      { label: 'Users & Profiles', href: '/godfather/operations/users', icon: Users },
      { label: 'Companies & Verification', href: '/godfather/operations/companies', icon: Building },
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
    title: 'Security',
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
      { label: 'Plans & Subscriptions', href: '/godfather/commerce/plans', icon: DollarSign },
      { label: 'Payment Gateways & Methods', href: '/godfather/commerce/payments', icon: CreditCard },
      { label: 'Accounting & Monthly Taxes', href: '/godfather/commerce/invoices', icon: Receipt },
      { label: 'Fees & Commercial Benefits', href: '/godfather/commerce/fees', icon: Percent },
    ],
  },
  {
    title: 'Platform & Governance',
    items: [
      { label: 'Terms & Safety Agreements', href: '/godfather/platform/terms', icon: Scale },
      { label: 'Notifications & Templates', href: '/godfather/platform/templates', icon: Bell },
      { label: 'Email Service', href: '/godfather/platform/email', icon: Mail },
      { label: 'Data & Audit Logs', href: '/godfather/platform/audit', icon: FileText },
      { label: 'Access Control & Roles', href: '/godfather/platform/access', icon: Key },
      { label: 'Feature Flags & Config', href: '/godfather/platform/config', icon: Sliders },
    ],
  },
];

export function GodfatherSidebar() {
  const pathname = usePathname();
  const { operator, operatorsList, switchOperator, environment, setEnvironment, logoutOperator } = useGodfatherAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Operations: true,
    'Trust & Safety': true,
    Security: true,
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
            <ShieldCheck className="lucide w-5 h-5 text-sky-400" />
          </div>
          <div>
            <div className="gf-brand-title">
              <span>GODFATHER</span>
              <span className="gf-badge gf-badge-gold text-[9px] uppercase font-mono py-0 px-1.5">
                SOVEREIGN
              </span>
            </div>
            <div className="gf-brand-subtitle">
              FR8X PLATFORM SUPER ADMIN
            </div>
          </div>
        </Link>

        {/* Dedicated OTP ON / Secure Access Quick Link */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-1">
          <Link
            href="/GODFATHERON"
            className="w-full flex items-center justify-center gap-2 py-1.5 px-2.5 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider transition-colors shadow-xs"
            title="Open Dedicated Godfather Access Portal & OTP Challenge"
          >
            <KeyRound className="lucide w-3.5 h-3.5" />
            <span>GODFATHER ON (OTP)</span>
          </Link>
        </div>

        {/* Environment Badge & Switcher */}
        <div className="gf-env-select-wrap">
          <span className={`gf-badge ${getEnvBadgeClass(environment)} text-[10px] uppercase font-bold flex items-center gap-1.5`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
            {environment}
          </span>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as PlatformEnvironment)}
            className="gf-env-dropdown"
          >
            <option value="Production">Prod Node</option>
            <option value="Staging">Staging Node</option>
            <option value="Local Emulator">Emulator Node</option>
          </select>
        </div>
      </div>

      {/* Navigation Tree */}
      <nav className="gf-sidebar-nav custom-scrollbar">
        {/* Core items */}
        <div className="gf-nav-group-root">
          <Link
            href="/godfather"
            className={`gf-nav-link ${pathname === '/godfather' ? 'active' : ''}`}
          >
            <LayoutDashboard className="lucide w-4 h-4" />
            <span>Overview Dashboard</span>
          </Link>
          <Link
            href="/godfather/search"
            className={`gf-nav-link ${pathname === '/godfather/search' ? 'active' : ''}`}
          >
            <Search className="lucide w-4 h-4" />
            <span>Global Deep Search</span>
          </Link>
        </div>

        {/* Sections */}
        {NAV_SECTIONS.map((section) => {
          const isOpen = openSections[section.title] ?? true;
          return (
            <div key={section.title} className="gf-nav-section">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="gf-nav-section-header"
              >
                <span>{section.title}</span>
                {isOpen ? (
                  <ChevronDown className="lucide w-3.5 h-3.5 text-slate-400" />
                ) : (
                  <ChevronRight className="lucide w-3.5 h-3.5 text-slate-400" />
                )}
              </button>

              {isOpen && (
                <div className="gf-nav-items-list space-y-0.5 mt-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || (item.href !== '/godfather' && pathname.startsWith(item.href));
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`gf-nav-link ${isActive ? 'active' : ''}`}
                      >
                        <Icon className="lucide w-4 h-4 text-slate-500" />
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

      {/* Operator Account Footer with Fast Role Switcher */}
      <div className="gf-sidebar-footer">
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            className="gf-operator-pill"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-800 border border-sky-200 font-bold flex items-center justify-center text-xs flex-shrink-0">
                {operator.displayName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-900 truncate">{operator.displayName}</div>
                <div className="text-[10.5px] text-sky-700 font-mono font-semibold truncate">{operator.roleTitle}</div>
              </div>
            </div>
            <ChevronDown className="lucide w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>

          {/* Quick Operator Switcher Popover */}
          {isRoleDropdownOpen && (
            <div className="gf-role-dropdown-menu">
              <div className="px-2 py-1 text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
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
