'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Users, Building, Gavel, DollarSign, Briefcase, Database,
  Filter, BadgeCheck, Shield, MessageSquare, FileCheck,
  CreditCard, Receipt, Percent, Scale, Bell, Mail, FileText,
  Key, Sliders, ChevronDown, ChevronRight, ShieldCheck,
  AlertOctagon, LayoutDashboard, Search, Lock, UserX,
  KeyRound, Smartphone, ShieldAlert, History, Sparkles,
} from 'lucide-react';
import { useGodfatherAuth, PlatformEnvironment } from '@/lib/godfather/context/GodfatherAuthContext';

interface NavSection {
  title: string;
  items: {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
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
      { label: 'Promotional Settings', href: '/godfather/commerce/promotions', icon: Sparkles },
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
      { label: 'Zoho Email & Setup Guide', href: '/godfather/platform/email', icon: Mail },
      { label: 'Data & Audit Logs', href: '/godfather/platform/audit', icon: FileText },
      { label: 'Access Control & Roles', href: '/godfather/platform/access', icon: Key },
      { label: 'Feature Flags & Config', href: '/godfather/platform/config', icon: Sliders },
    ],
  },
];

export function GodfatherSidebar() {
  const pathname = usePathname();
  const { operator, operatorsList, switchOperator, environment, setEnvironment } = useGodfatherAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: prev[title] === false }));
  };

  // Keep navigation calm: expand only the section containing the current page.
  useEffect(() => {
    const activeSection = NAV_SECTIONS.find((section) => section.items.some((item) => pathname === item.href || pathname.startsWith(`${item.href}/`)));
    if (activeSection) setOpenSections((prev) => ({ ...prev, [activeSection.title]: true }));
  }, [pathname]);

  return (
    <aside className="gf-sidebar" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Brand Header */}
      <div className="gf-sidebar-header" style={{ padding: '10px 12px', borderBottom: '1px solid #e2e8f0', background: '#ffffff' }}>
        <Link href="/godfather" className="gf-brand-wrap" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '7px',
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px solid #334155',
              flexShrink: 0,
            }}
          >
            <ShieldCheck style={{ width: '16px', height: '16px', color: '#38bdf8' }} />
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span>GODFATHER</span>
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: 800,
                  fontFamily: 'Consolas, monospace',
                  background: '#fef9c3',
                  color: '#854d0e',
                  border: '1px solid #fde047',
                  padding: '1px 4px',
                  borderRadius: '3px',
                }}
              >
                SOVEREIGN
              </span>
            </div>
            <div style={{ fontSize: '9.5px', fontWeight: 700, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              FR8X SUPER ADMIN
            </div>
          </div>
        </Link>

        {/* Env Switcher */}
        <div
          style={{
            marginTop: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '4px 8px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '6px',
          }}
        >
          <span
            style={{
              fontSize: '10px',
              fontWeight: 800,
              fontFamily: 'Consolas, monospace',
              color: environment === 'Production' ? '#15803d' : '#b45309',
              background: environment === 'Production' ? '#dcfce7' : '#fef3c7',
              border: `1px solid ${environment === 'Production' ? '#86efac' : '#fcd34d'}`,
              padding: '1px 5px',
              borderRadius: '3px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: 'currentColor' }} />
            {environment === 'Production' ? 'PROD' : environment === 'Staging' ? 'STAGING' : 'LOCAL'}
          </span>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as PlatformEnvironment)}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '4px',
              padding: '2px 4px',
              fontSize: '10.5px',
              fontWeight: 700,
              color: '#0f172a',
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            <option value="Production">Prod Node</option>
            <option value="Staging">Staging</option>
            <option value="Local Emulator">Emulator</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <nav className="gf-sidebar-nav custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingBottom: '6px', borderBottom: '1px solid #f1f5f9' }}>
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
            <div key={section.title} style={{ marginTop: '10px' }}>
              <button
                type="button"
                onClick={() => toggleSection(section.title)}
                className="gf-nav-section-header"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '4px 8px',
                  fontSize: '10px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: '#64748b',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  borderRadius: '4px',
                  height: '24px',
                }}
              >
                <span>{section.title}</span>
                {isOpen ? (
                  <ChevronDown style={{ width: '13px', height: '13px' }} />
                ) : (
                  <ChevronRight style={{ width: '13px', height: '13px' }} />
                )}
              </button>
              {isOpen && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', marginTop: '2px' }}>
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
      <div className="gf-sidebar-footer" style={{ padding: '8px 10px', borderTop: '1px solid #e2e8f0', background: '#ffffff' }}>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 8px',
              borderRadius: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              cursor: 'pointer',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '6px',
                  background: '#0f172a',
                  color: '#ffffff',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '11px',
                  flexShrink: 0,
                }}
              >
                {operator.displayName.charAt(0)}
              </div>
              <div style={{ minWidth: 0, overflow: 'hidden' }}>
                <div style={{ fontSize: '11.5px', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {operator.displayName}
                </div>
                <div style={{ fontSize: '9.5px', color: '#0284c7', fontFamily: 'Consolas, monospace', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {operator.roleTitle}
                </div>
              </div>
            </div>
            <ChevronDown style={{ width: '13px', height: '13px', color: '#94a3b8', flexShrink: 0 }} />
          </button>

          {isRoleDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                bottom: 'calc(100% + 4px)',
                left: 0,
                width: '100%',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                padding: '6px',
                zIndex: 50,
                maxHeight: '220px',
                overflowY: 'auto',
                fontSize: '11px',
              }}
            >
              <div style={{ padding: '4px 6px', fontSize: '9.5px', fontFamily: 'Consolas, monospace', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase' }}>
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
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderRadius: '5px',
                    fontSize: '11px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: 'none',
                    cursor: 'pointer',
                    background: op.uid === operator.uid ? '#f0f9ff' : 'transparent',
                    color: op.uid === operator.uid ? '#0369a1' : '#334155',
                    fontWeight: op.uid === operator.uid ? 800 : 500,
                  }}
                >
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{op.displayName}</div>
                    <div style={{ fontSize: '9.5px', color: '#94a3b8', fontFamily: 'Consolas, monospace' }}>{op.roleTitle}</div>
                  </div>
                  {op.uid === operator.uid && (
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0284c7', flexShrink: 0 }} />
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
