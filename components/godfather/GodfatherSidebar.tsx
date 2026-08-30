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
    ],
  },
  {
    title: 'Trust & Safety',
    items: [
      { label: 'Content Moderation', href: '/godfather/trust-safety/moderation', icon: AlertOctagon },
      { label: 'Nexus Reviews', href: '/godfather/trust-safety/nexus', icon: MessageSquare },
      { label: 'Blacklist & Blocks', href: '/godfather/trust-safety/blacklist', icon: Shield },
      { label: 'Reports & Appeals', href: '/godfather/trust-safety/reports', icon: FileCheck },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Plans & Subscriptions', href: '/godfather/commerce/plans', icon: DollarSign },
      { label: 'Payment Configuration', href: '/godfather/commerce/payments', icon: CreditCard },
      { label: 'Invoices, GST & Taxes', href: '/godfather/commerce/invoices', icon: Receipt },
      { label: 'Fees, Discounts & Credits', href: '/godfather/commerce/fees', icon: Percent },
    ],
  },
  {
    title: 'Platform',
    items: [
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
    <aside className="gf-sidebar">
      {/* Brand Header */}
      <div className="gf-sidebar-header">
        <Link href="/godfather" className="gf-brand-wrap flex items-center gap-2.5">
          <div className="gf-brand-logo-badge">
            <ShieldCheck className="lucide w-5 h-5 text-white" />
          </div>
          <div>
            <div className="gf-brand-title font-mono font-bold tracking-wider text-sm text-slate-100 flex items-center gap-1.5">
              GODFATHER
              <span className="text-[10px] text-teal-400 font-sans font-bold bg-teal-950 px-1 py-0.5 rounded border border-teal-800">
                PRO
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium">FR8X CONTROL · CON.FR8X.IN</div>
          </div>
        </Link>

        {/* Environment Badge & Switcher */}
        <div className="gf-env-select-wrap mt-2 flex items-center justify-between">
          <span className={`gf-badge ${getEnvBadgeClass(environment)} text-[10px] uppercase font-bold flex items-center gap-1`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current inline-block animate-pulse" />
            {environment}
          </span>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as PlatformEnvironment)}
            className="gf-env-dropdown text-[10px] bg-slate-900 text-slate-300 border border-slate-700 rounded px-1.5 py-0.5"
          >
            <option value="Production">Prod</option>
            <option value="Staging">Staging</option>
            <option value="Local Emulator">Emulator</option>
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
            <div key={section.title} className="gf-nav-section mt-3">
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="gf-nav-section-header"
              >
                <span>{section.title}</span>
                {isOpen ? (
                  <ChevronDown className="lucide w-3.5 h-3.5 text-slate-500" />
                ) : (
                  <ChevronRight className="lucide w-3.5 h-3.5 text-slate-500" />
                )}
              </button>

              {isOpen && (
                <div className="gf-nav-items-list space-y-0.5 mt-0.5">
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
            className="gf-operator-pill w-full flex items-center justify-between p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-colors text-left"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded bg-teal-900 border border-teal-700 text-teal-300 font-bold flex items-center justify-center text-xs flex-shrink-0">
                {operator.displayName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-200 truncate">{operator.displayName}</div>
                <div className="text-[10px] text-teal-400 font-mono truncate">{operator.roleTitle}</div>
              </div>
            </div>
            <ChevronDown className="lucide w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          </button>

          {/* Role Switcher Menu for Testing & Least Privilege Verification */}
          {isRoleDropdownOpen && (
            <div className="gf-role-dropdown-menu absolute bottom-full left-0 w-full mb-1 bg-slate-950 border border-slate-700 rounded shadow-xl p-1 z-50">
              <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
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
                  className={`w-full text-left p-2 rounded text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    operator.uid === op.uid ? 'bg-slate-900 text-teal-300 font-bold' : 'text-slate-300'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="truncate">{op.displayName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{op.role}</div>
                  </div>
                  {operator.uid === op.uid && <Zap className="lucide w-3 h-3 text-teal-400 flex-shrink-0" />}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-800 text-[10px] text-slate-500">
          <span className="font-mono">MFA: ENFORCED</span>
          <button
            type="button"
            onClick={logoutOperator}
            className="text-slate-400 hover:text-red-400 flex items-center gap-1 font-semibold transition-colors"
          >
            <LogOut className="lucide w-3 h-3" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
