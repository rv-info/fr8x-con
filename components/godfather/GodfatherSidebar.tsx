'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Search,
  Users,
  Building,
  Gavel,
  DollarSign,
  Briefcase,
  AlertOctagon,
  MessageSquare,
  Shield,
  FileCheck,
  CreditCard,
  Receipt,
  Percent,
  Bell,
  Mail,
  FileText,
  Key,
  Sliders,
  HelpCircle,
  FolderLock,
  ChevronDown,
  ChevronRight,
  LogOut,
  ShieldCheck,
  Zap,
  Filter,
  Scale,
  BadgeCheck,
  Database,
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
      { label: 'Blacklist & Blocks', href: '/godfather/trust-safety/blacklist', icon: Shield },
      { label: 'Nexus Reviews', href: '/godfather/trust-safety/nexus', icon: MessageSquare },
      { label: 'Reports & Appeals', href: '/godfather/trust-safety/reports', icon: FileCheck },
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
      { label: 'Email Service (Zoho)', href: '/godfather/platform/email', icon: Mail },
      { label: 'Data & Audit Logs', href: '/godfather/platform/audit', icon: FileText },
      { label: 'Access Control & Roles', href: '/godfather/platform/access', icon: Key },
      { label: 'Feature Flags & Config', href: '/godfather/platform/config', icon: Sliders },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Customer Lookup', href: '/godfather/support/lookup', icon: HelpCircle },
      { label: 'Case Management', href: '/godfather/support/cases', icon: FolderLock },
    ],
  },
];

export function GodfatherSidebar() {
  const pathname = usePathname();
  const { operator, operatorsList, switchOperator, environment, setEnvironment, logoutOperator } = useGodfatherAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Operations: true,
    'Trust & Safety': true,
    Commerce: true,
    Platform: true,
    Support: true,
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const getEnvBadgeClass = (env: PlatformEnvironment) => {
    if (env === 'Production') return 'gf-badge-green';
    if (env === 'Staging') return 'gf-badge-amber';
    return 'gf-badge-blue';
  };

  return (
    <aside className="gf-sidebar" style={{ fontFamily: "Calibri, 'Segoe UI', Candara, Arial, sans-serif" }}>
      {/* Brand Header */}
      <div className="gf-sidebar-header">
        <Link href="/godfather" className="gf-brand-wrap">
          <div className="gf-brand-logo-badge">
            <ShieldCheck className="lucide w-4 h-4 text-sky-400" />
          </div>
          <div>
            <div className="gf-brand-title">
              <span>GODFATHER</span>
              <span className="gf-badge gf-badge-gold text-[8.5px] uppercase font-mono py-0 px-1">
                SOVEREIGN
              </span>
            </div>
            <div className="gf-brand-subtitle">
              FR8X PLATFORM SUPER ADMIN
            </div>
          </div>
        </Link>

        {/* Environment Badge & Switcher */}
        <div className="gf-env-select-wrap">
          <span className={`gf-badge ${getEnvBadgeClass(environment)} text-[8.5px] uppercase font-bold flex items-center gap-1`}>
            <span className="w-1 h-1 rounded-full bg-current inline-block animate-pulse" />
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
                        <Icon className="lucide w-3.5 h-3.5" />
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
                <div className="text-[10px] text-sky-700 font-mono font-semibold truncate">{operator.roleTitle}</div>
              </div>
            </div>
            <ChevronDown className="lucide w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>

          {/* Role Switcher Menu for Testing & Least Privilege Verification */}
          {isRoleDropdownOpen && (
            <div className="gf-role-dropdown-menu">
              <div className="px-2.5 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                Switch Subrole Profile (Testing)
              </div>
              {operatorsList.map((op) => (
                <button
                  key={op.uid}
                  type="button"
                  onClick={() => {
                    switchOperator(op.uid);
                    setIsRoleDropdownOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-md text-xs flex items-center justify-between transition-colors ${
                    operator.uid === op.uid
                      ? 'bg-sky-50 text-sky-900 font-bold'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate">{op.displayName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{op.role}</div>
                  </div>
                  {operator.uid === op.uid && <Zap className="lucide w-3.5 h-3.5 text-sky-600 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
          <span className="font-mono font-semibold text-emerald-700">MFA: ENFORCED</span>
          <button
            type="button"
            onClick={logoutOperator}
            className="text-slate-600 hover:text-rose-600 flex items-center gap-1 font-semibold transition-colors"
          >
            <LogOut className="lucide w-3 h-3" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}

