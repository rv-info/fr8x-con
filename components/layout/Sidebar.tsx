'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  LayoutDashboard,
  Rss,
  Globe2,
  Gavel,
  BarChart3,
  UserCheck,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Smartphone,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/feeds', label: 'Feeds', icon: Rss },
    { href: '/nexus', label: 'Nexus', icon: Globe2, badge: '12' },
    { href: '/auctions', label: 'Auctions', icon: Gavel },
    { href: '/rates', label: 'Rates', icon: BarChart3 },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/profile', label: 'Profile', icon: UserCheck },
  ];

  const initials = user.displayName
    .split(' ')
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    if (href === '/auctions') return pathname === '/auctions' || pathname.startsWith('/auctions/');
    return pathname === href;
  };

  return (
    <aside className={`side ${isCollapsed ? 'is-collapsed' : ''}`}>
      {/* Brand */}
      <div className="brand" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', padding: isCollapsed ? '4px 0 10px' : '4px 6px 10px' }}>
        <img
          src="/logo.png"
          alt="FR8X"
          style={{
            width: '26px',
            height: '26px',
            objectFit: 'contain',
            flexShrink: 0,
            display: 'block',
          }}
        />
        {!isCollapsed && (
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            fr<b style={{ color: 'var(--brand)' }}>8</b>x
          </span>
        )}
      </div>

      {/* Workspace Box */}
      {!isCollapsed && (
        <div className="workspace">
          <small>Workspace</small>
          <strong>{user.company}</strong>
        </div>
      )}

      {/* Navigation Label */}
      {!isCollapsed && <div className="navlabel">Navigation</div>}

      {/* Nav List */}
      <nav className="nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={active ? 'on' : ''}
              title={isCollapsed ? item.label : undefined}
              style={{
                justifyContent: isCollapsed ? 'center' : 'flex-start',
                padding: isCollapsed ? '0' : '0 11px',
              }}
            >
              <Icon size={16} />
              {!isCollapsed && <span>{item.label}</span>}
              {!isCollapsed && item.badge && <em>{item.badge}</em>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidefoot">
        <a
          href="/fr8x-enterprise-mobile-v2.4.apk"
          download
          className="sidelink"
          title="Download FR8X Android Mobile App (.apk)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: isCollapsed ? '8px 0' : '7px 10px',
            marginBottom: '10px',
            background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(2, 132, 199, 0.18))',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '6px',
            color: '#38bdf8',
            fontWeight: 700,
            fontSize: '11px',
            textDecoration: 'none',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
            transition: 'all 0.15s ease',
          }}
        >
          <Smartphone size={15} style={{ flexShrink: 0, color: '#38bdf8' }} />
          {!isCollapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ color: '#ffffff', fontWeight: 800, fontSize: '11px' }}>Android App (.apk)</span>
              <span style={{ fontSize: '9px', color: '#94a3b8' }}>v2.4 Standalone • 182 KB</span>
            </div>
          )}
        </a>

        <Link
          href="/profile"
          className="user"
          title="View profile"
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start', textDecoration: 'none' }}
        >
          <div
            className="avatar borderless"
            style={{
              width: '28px',
              height: '28px',
              minWidth: '28px',
              minHeight: '28px',
              maxWidth: '28px',
              maxHeight: '28px',
              flex: '0 0 28px',
              aspectRatio: '1 / 1',
              padding: 0,
              overflow: 'hidden',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
            }}
          >
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="profile-img-avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #1168d7, #099889)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '11px',
                }}
              >
                {user.displayName.split(' ').map((p) => p[0]).filter(Boolean).join('').substring(0, 2).toUpperCase() || 'U'}
              </div>
            )}
          </div>
          {!isCollapsed && (
            <div className="user-meta" style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <b>
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user.displayName}
                </span>
                {user.hasGoldenTick && <GoldenTick />}
              </b>
              <small style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.designation}
              </small>
            </div>
          )}
        </Link>

        <button
          className="sidelink"
          onClick={onToggleCollapse}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        >
          {isCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          {!isCollapsed && <span>Collapse sidebar</span>}
        </button>

        <Link
          href="/login"
          className="sidelink"
          onClick={() => logout()}
          title="Sign out"
          style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}
        >
          <LogOut size={16} />
          {!isCollapsed && <span>Sign out</span>}
        </Link>
      </div>
    </aside>
  );
}
