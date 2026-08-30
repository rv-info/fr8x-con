'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  LayoutDashboard,
  Globe2,
  Gavel,
  BarChart3,
  UserCheck,
  Briefcase,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
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
    { href: '/feeds', label: 'Feeds', icon: LayoutDashboard },
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
    <aside className="side" style={{ width: isCollapsed ? '68px' : '230px' }}>
      {/* Brand */}
      <div className="brand" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
        <span className="mark">f8</span>
        {!isCollapsed && (
          <span>
            fr<b>8</b>x
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
        <div className="user" style={{ justifyContent: isCollapsed ? 'center' : 'flex-start' }}>
          <div className="avatar">{initials}</div>
          {!isCollapsed && (
            <div style={{ overflow: 'hidden' }}>
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
        </div>

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
