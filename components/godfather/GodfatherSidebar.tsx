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
      { label: 'Jobs & Ads', href: '/godfather/operations/jobs', icon: Briefcase },
      { label: 'Master Data', href: '/godfather/operations/master-data', icon: Database },
    ],
  },
  {
    title: 'Trust & Safety',
    items: [
      { label: 'Content Moderation', href: '/godfather/trust-safety/moderation', icon: AlertOctagon },
      { label: 'Sensitive Words', href: '/godfather/trust-safety/sensitive-words', icon: Filter },
      { label: 'Compliance', href: '/godfather/trust-safety/compliance', icon: BadgeCheck },
      { label: 'Blacklists', href: '/godfather/trust-safety/blacklist', icon: Shield },
      { label: 'Nexus Reviews', href: '/godfather/trust-safety/nexus', icon: MessageSquare },
      { label: 'Reports & Appeals', href: '/godfather/trust-safety/reports', icon: FileCheck },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Auth Security', href: '/godfather/security', icon: Lock },
      { label: 'Blocked Accounts', href: '/godfather/security/blocked-accounts', icon: UserX },
      { label: 'Password Resets', href: '/godfather/security/password-resets', icon: KeyRound },
      { label: 'OTP Activity', href: '/godfather/security/otp-activity', icon: Smartphone },
      { label: 'Incident Stream', href: '/godfather/security/events', icon: ShieldAlert },
      { label: 'Audit Trail', href: '/godfather/security/audit', icon: History },
    ],
  },
  {
    title: 'Commerce',
    items: [
      { label: 'Plans & Pricing', href: '/godfather/commerce/plans', icon: DollarSign },
      { label: 'Payments', href: '/godfather/commerce/payments', icon: CreditCard },
      { label: 'Accounting', href: '/godfather/commerce/invoices', icon: Receipt },
      { label: 'Fees & Benefits', href: '/godfather/commerce/fees', icon: Percent },
    ],
  },
  {
    title: 'Platform',
    items: [
      { label: 'Terms & Agreements', href: '/godfather/platform/terms', icon: Scale },
      { label: 'Notifications', href: '/godfather/platform/templates', icon: Bell },
      { label: 'Email Service', href: '/godfather/platform/email', icon: Mail },
      { label: 'Audit Logs', href: '/godfather/platform/audit', icon: FileText },
      { label: 'Access Control', href: '/godfather/platform/access', icon: Key },
      { label: 'Feature Flags', href: '/godfather/platform/config', icon: Sliders },
    ],
  },
];

export function GodfatherSidebar() {
  const pathname = usePathname();
  const { operator, operatorsList, switchOperator, environment, setEnvironment, logoutOperator } = useGodfatherAuth();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    Operations: true, 'Trust & Safety': true, Security: true,
    Commerce: true, Platform: true,
  });
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const toggleSection = (title: string) => {
    setOpenSections((prev) => ({ ...prev, [title]: prev[title] === false }));
  };

  return (
    <aside className="gf-sidebar">
      {/* Brand Header */}
      <div className="gf-sidebar-header">
        <Link href="/godfather" className="gf-brand-wrap">
          <div className="gf-brand-logo-badge">
            <ShieldCheck className="lucide" />
          </div>
          <div>
            <div className="gf-brand-title">
              <span>GODFATHER</span>
              <span className="gf-badge gf-badge-gold" style={{fontSize:'7.5px',padding:'0 3px',lineHeight:'1.4'}}>
                SOVEREIGN
              </span>
            </div>
            <div className="gf-brand-subtitle">FR8X SUPER ADMIN</div>
          </div>
        </Link>

        {/* Env Switcher */}
        <div className="gf-env-select-wrap">
          <span className="gf-badge" style={{
            fontSize:'8px',padding:'0 4px',
            background: environment==='Production'?'#dcfce7':environment==='Staging'?'#fef3c7':'#dbeafe',
            color: environment==='Production'?'#15803d':environment==='Staging'?'#b45309':'#1d4ed8',
            border: `1px solid ${environment==='Production'?'#86efac':environment==='Staging'?'#fcd34d':'#93c5fd'}`,
          }}>
            <span style={{width:5,height:5,borderRadius:'50%',background:'currentColor',display:'inline-block',marginRight:3}} />
            {environment === 'Production' ? 'PROD' : environment === 'Staging' ? 'STAGING' : 'LOCAL'}
          </span>
          <select
            value={environment}
            onChange={(e) => setEnvironment(e.target.value as PlatformEnvironment)}
            className="gf-env-dropdown"
          >
            <option value="Production">Prod</option>
            <option value="Staging">Staging</option>
            <option value="Local Emulator">Local</option>
          </select>
        </div>
      </div>

      {/* Navigation */}
      <nav className="gf-sidebar-nav custom-scrollbar">
        <div className="gf-nav-group-root">
          <Link href="/godfather" className={`gf-nav-link ${pathname === '/godfather' ? 'active' : ''}`}>
            <LayoutDashboard className="lucide" />
            <span>Dashboard</span>
          </Link>
          <Link href="/godfather/search" className={`gf-nav-link ${pathname === '/godfather/search' ? 'active' : ''}`}>
            <Search className="lucide" />
            <span>Deep Search</span>
          </Link>
        </div>

        {NAV_SECTIONS.map((section) => {
          const isOpen = openSections[section.title] ?? true;
          return (
            <div key={section.title} className="gf-nav-section">
              <button type="button" onClick={() => toggleSection(section.title)} className="gf-nav-section-header">
                <span>{section.title}</span>
                {isOpen
                  ? <ChevronDown className="lucide" style={{width:11,height:11}} />
                  : <ChevronRight className="lucide" style={{width:11,height:11}} />
                }
              </button>
              {isOpen && (
                <div style={{display:'flex',flexDirection:'column',gap:0,marginTop:1}}>
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
            <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
              <div style={{width:20,height:20,borderRadius:4,background:'#1e293b',color:'#fff',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,flexShrink:0}}>
                {operator.displayName.charAt(0)}
              </div>
              <div style={{minWidth:0}}>
                <div style={{fontSize:10,fontWeight:700,color:'#111827',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{operator.displayName}</div>
                <div style={{fontSize:8.5,color:'#2563eb',fontFamily:'monospace',fontWeight:600,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{operator.roleTitle}</div>
              </div>
            </div>
            <ChevronDown className="lucide" style={{width:11,height:11,color:'#9ca3af',flexShrink:0}} />
          </button>

          {isRoleDropdownOpen && (
            <div className="gf-role-dropdown-menu">
              <div style={{padding:'2px 5px',fontSize:8,fontFamily:'monospace',fontWeight:800,color:'#9ca3af',textTransform:'uppercase',letterSpacing:'0.06em'}}>
                Switch Persona
              </div>
              {operatorsList.map((op) => (
                <button
                  key={op.uid} type="button"
                  onClick={() => { switchOperator(op.uid); setIsRoleDropdownOpen(false); }}
                  style={{
                    width:'100%',textAlign:'left',padding:'3px 5px',borderRadius:3,fontSize:10,display:'flex',alignItems:'center',justifyContent:'space-between',
                    transition:'background 0.1s',border:'none',cursor:'pointer',
                    background: op.uid === operator.uid ? '#dbeafe' : 'transparent',
                    color: op.uid === operator.uid ? '#1d4ed8' : '#374151',
                    fontWeight: op.uid === operator.uid ? 700 : 500,
                  }}
                >
                  <div style={{overflow:'hidden'}}>
                    <div style={{whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{op.displayName}</div>
                    <div style={{fontSize:8,color:'#9ca3af',fontFamily:'monospace'}}>{op.roleTitle}</div>
                  </div>
                  {op.uid === operator.uid && <span style={{width:5,height:5,borderRadius:'50%',background:'#2563eb',flexShrink:0}} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
