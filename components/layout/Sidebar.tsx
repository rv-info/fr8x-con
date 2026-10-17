'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { useData } from '@/lib/context/DataContext';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  LayoutDashboard,
  Rss,
  Globe2,
  Gavel,
  BarChart3,
  Users,
  Network,
  Briefcase,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  LogOut,
  Smartphone,
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCloseMobile?: () => void;
  isMobileDrawer?: boolean;
}

export function Sidebar({ isCollapsed, onToggleCollapse, onCloseMobile, isMobileDrawer = false }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { notifications } = useData();

  // If this is rendered inside mobile drawer, force collapsed to false so full labels are shown
  const collapsed = isMobileDrawer ? false : isCollapsed;

  // Compute actual unread Nexus notifications count
  const nexusUnreadCount = (notifications || []).filter(
    (n) => !n.read && (n.category === 'nexus' || n.targetUrl?.startsWith('/nexus'))
  ).length;

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/feeds', label: 'Feeds', icon: Rss },
    {
      href: '/nexus',
      label: 'Nexus',
      icon: Globe2,
      badge: nexusUnreadCount > 0 ? String(nexusUnreadCount) : undefined,
    },
    { href: '/auctions', label: 'Auctions', icon: Gavel },
    { href: '/rates', label: 'Rates', icon: BarChart3 },
    { href: '/people', label: 'People', icon: Users },
    { href: '/connections', label: 'Connections', icon: Network },
    { href: '/jobs', label: 'Jobs', icon: Briefcase },
    { href: '/profile', label: 'Profile', icon: User },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    if (href === '/auctions')  return pathname === '/auctions'  || pathname.startsWith('/auctions/');
    if (href === '/people')    return pathname === '/people'    || pathname.startsWith('/people/');
    if (href === '/connections') return pathname === '/connections' || pathname.startsWith('/connections/');
    return pathname === href;
  };

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside className={`side ${collapsed ? 'is-collapsed' : ''} ${isMobileDrawer ? 'mobile-drawer-side' : ''}`}>
      {/* Brand Header */}
      <div
        className="brand"
        style={{
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '4px 0 10px' : '4px 6px 10px',
          alignItems: 'center',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            gap: '3px',
            textDecoration: 'none',
          }}
          title="FR8X Home"
        >
          <img
            src="/FR8X ICON.png"
            alt="FR8X"
            style={{
              width: collapsed ? '24px' : '28px',
              height: collapsed ? '24px' : '28px',
              objectFit: 'contain',
              borderRadius: '6px',
              flexShrink: 0,
              display: 'block',
            }}
          />
          <span
            style={{
              fontSize: collapsed ? '9px' : '12px',
              fontWeight: 'bold',
              letterSpacing: '0.04em',
              color: '#002b66',
              lineHeight: 1,
              textTransform: 'uppercase',
            }}
          >
            FR8X
          </span>
        </Link>
      </div>

      {/* Workspace Box */}
      {!collapsed && (
        <div className="workspace">
          <small>Workspace</small>
          <strong>
            {(() => {
              const raw = (user.company || '').trim();
              if (!raw || /^CMP-\d+$/i.test(raw)) {
                return (user.companyName && !/^CMP-\d+$/i.test(user.companyName))
                  ? user.companyName
                  : 'SYB INTERNATIONAL';
              }
              return raw;
            })()}
          </strong>
        </div>
      )}

      {/* Navigation Label */}
      {!collapsed && <div className="navlabel">Navigation</div>}

      {/* Nav List */}
      <nav className="nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={active ? 'on' : ''}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              style={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '0' : '0 11px',
              }}
            >
              <Icon size={16} />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && <em>{item.badge}</em>}
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
            padding: collapsed ? '8px 0' : '7px 10px',
            marginBottom: '10px',
            background: 'var(--color-secondary-accent, #E5F3FC)',
            border: '1px solid var(--color-border, #DFE7F0)',
            borderRadius: '6px',
            color: 'var(--color-nav-active-text, #075985)',
            fontWeight: 600,
            fontSize: '11px',
            textDecoration: 'none',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'all 0.15s ease',
          }}
        >
          <Smartphone size={15} style={{ flexShrink: 0, color: 'var(--color-primary, #147DAB)' }} />
          {!collapsed && (
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span style={{ color: 'var(--color-nav-active-text, #075985)', fontWeight: 600 }}>Android App</span>
              <span style={{ fontSize: '9px', color: 'var(--color-text-secondary, #52657D)', fontWeight: 500 }}>v2.4 · Direct APK</span>
            </div>
          )}
        </a>

        <Link
          href="/profile"
          onClick={handleLinkClick}
          className="user"
          title="View profile"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', textDecoration: 'none' }}
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
          {!collapsed && (
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

        {/* Only show desktop collapse toggle on screens that use the desktop fixed sidebar */}
        {!isMobileDrawer && (
          <button
            className="sidelink desktop-only-collapse"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
          >
            {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            {!collapsed && <span>Collapse sidebar</span>}
          </button>
        )}

        <Link
          href="/login"
          className="sidelink"
          onClick={() => {
            handleLinkClick();
            logout();
          }}
          title="Sign out"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <LogOut size={16} />
          {!collapsed && <span>Sign out</span>}
        </Link>
      </div>
    </aside>
  );
}
