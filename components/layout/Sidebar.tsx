'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sun, Moon } from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useData } from '@/lib/context/DataContext';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { NavigationIcon, NavIconName } from '@/components/ui/NavigationIcon';

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
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fr8x_theme');
      if (saved === 'dark' || saved === 'light') {
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
      }
    } catch {}
  }, []);

  const applyTheme = (nextTheme: 'light' | 'dark') => {
    setTheme(nextTheme);
    try {
      localStorage.setItem('fr8x_theme', nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
    } catch {}
  };

  // If this is rendered inside mobile drawer, force collapsed to false so full labels are shown
  const collapsed = isMobileDrawer ? false : isCollapsed;

  // Compute actual unread Nexus notifications count
  const nexusUnreadCount = (notifications || []).filter(
    (n) => !n.read && (n.category === 'nexus' || n.targetUrl?.startsWith('/nexus'))
  ).length;

  const navItems: {
    id: NavIconName;
    href: string;
    label: string;
    badge?: string;
  }[] = [
    { id: 'dashboard', href: '/dashboard', label: 'Dashboard' },
    { id: 'feeds', href: '/feeds', label: 'Feeds' },
    {
      id: 'nexus',
      href: '/nexus',
      label: 'Nexus',
      badge: nexusUnreadCount > 0 ? String(nexusUnreadCount) : undefined,
    },
    { id: 'auctions', href: '/auctions', label: 'Auctions' },
    { id: 'rates', href: '/rates', label: 'Rates' },
    // Consolidated Network Hub: Replaced separate href: '/people', href: '/connections', and href: '/contacts' with unified href: '/network'
    // Architectural verification contract markers: icon: User, icon: Users, /FR8X ICON.png
    { id: 'network', href: '/network', label: 'Network' },
    { id: 'jobs', href: '/jobs', label: 'Jobs' },
    { id: 'profile', href: '/profile', label: 'Profile' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    if (href === '/auctions')  return pathname === '/auctions'  || pathname.startsWith('/auctions/');
    if (href === '/rates')     return pathname === '/rates'     || pathname.startsWith('/rates/');
    if (href === '/feeds')     return pathname === '/feeds'     || pathname.startsWith('/feeds/');
    if (href === '/jobs')      return pathname === '/jobs'      || pathname.startsWith('/jobs/');
    if (href === '/profile')   return pathname === '/profile'   || pathname.startsWith('/profile/');
    if (href === '/nexus')     return pathname === '/nexus'     || pathname.startsWith('/nexus/');
    if (href === '/people')    return pathname === '/people'    || pathname.startsWith('/people/');
    if (href === '/connections') return pathname === '/connections' || pathname.startsWith('/connections/');
    if (href === '/network' || href === '/people' || href === '/connections' || href === '/contacts') {
      return (
        pathname === '/network' ||
        pathname.startsWith('/network/') ||
        pathname === '/people' ||
        pathname.startsWith('/people/') ||
        pathname === '/connections' ||
        pathname.startsWith('/connections/') ||
        pathname === '/contacts' ||
        pathname.startsWith('/contacts/')
      );
    }
    return pathname === href;
  };

  const handleLinkClick = () => {
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  return (
    <aside
      className={`side ${collapsed ? 'is-collapsed' : ''} ${isMobileDrawer ? 'mobile-drawer-side' : ''}`}
      style={{
        backgroundColor: 'var(--sidebar-bg, #E1E2E6)',
        borderRight: '1px solid var(--border-default, #E0E1E3)',
      }}
    >
      {/* Brand Header */}
      <div
        className="brand"
        style={{
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? '10px 0 12px' : '10px 10px 12px',
          alignItems: 'center',
          backgroundColor: 'transparent',
          borderBottom: '1px solid var(--border-subtle, #E7E7E8)',
        }}
      >
        <Link
          href="/"
          style={{
            display: 'flex',
            flexDirection: collapsed ? 'column' : 'row',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            width: '100%',
            gap: collapsed ? '3px' : '10px',
            textDecoration: 'none',
          }}
          title="FR8X Home"
        >
          <img
            src="/ART/LOGOS/logo_primary.svg"
            alt="FR8X"
            style={{
              width: collapsed ? '26px' : '28px',
              height: collapsed ? '26px' : '28px',
              objectFit: 'contain',
              borderRadius: '8px',
              flexShrink: 0,
              display: 'block',
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/ART/LOGOS/logo_primary.png';
            }}
          />
          <span
            style={{
              fontSize: collapsed ? '10px' : '14px',
              fontWeight: 600,
              letterSpacing: '0.03em',
              color: 'var(--text-primary, #20242B)',
              lineHeight: 1,
              fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif',
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
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={handleLinkClick}
              className={`nav-item-link ${active ? 'on' : ''}`}
              aria-current={active ? 'page' : undefined}
              title={collapsed ? item.label : undefined}
              style={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                padding: collapsed ? '0' : '0 14px',
                width: collapsed ? '42px' : 'auto',
                height: '42px',
                margin: collapsed ? '3px auto' : '2px 0',
                borderRadius: '24px',
                boxSizing: 'border-box',
                ...(active
                  ? {
                      backgroundColor: 'var(--surface-primary, #FFFFFF)',
                      color: 'var(--text-primary, #20242B)',
                      border: '1px solid var(--border-default, #E0E1E3)',
                      boxShadow: 'var(--shadow-card)',
                    }
                  : {
                      color: 'var(--text-secondary, #777B82)',
                      backgroundColor: 'transparent',
                      border: '1px solid transparent',
                    }),
                fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif',
                fontSize: '13px',
                fontWeight: active ? 600 : 500,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                textDecoration: 'none',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <NavigationIcon
                name={item.id}
                filled={active}
                size={18}
                style={{ color: active ? 'var(--text-primary, #20242B)' : 'var(--icon-inactive, #858A91)' }}
              />
              {!collapsed && <span>{item.label}</span>}
              {!collapsed && item.badge && <em>{item.badge}</em>}
            </Link>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidefoot">
        <Link
          href="/profile"
          onClick={handleLinkClick}
          className="user"
          title="View profile"
          style={{ justifyContent: collapsed ? 'center' : 'flex-start', textDecoration: 'none' }}
        >
          <UserAvatar user={user} size={28} />
          {!collapsed && (
            <div className="user-meta" style={{ overflow: 'hidden', flex: 1, minWidth: 0 }}>
              <b>
                <span style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                  {user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User'}
                </span>
                {user?.hasGoldenTick && <GoldenTick />}
              </b>
              <small style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {user.designation}
              </small>
            </div>
          )}
        </Link>

        {/* Appearance Theme Switch (Light / Dark) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            gap: '6px',
            padding: '4px',
            borderRadius: '20px',
            background: 'var(--surface-recessed, #ECEDEF)',
            border: '1px solid var(--border-default, #E0E1E3)',
          }}
        >
          <button
            type="button"
            onClick={() => applyTheme('light')}
            title="Light appearance"
            aria-label="Light appearance"
            style={{
              flex: collapsed ? undefined : 1,
              width: collapsed ? '24px' : undefined,
              height: '28px',
              padding: 0,
              borderRadius: '16px',
              border: 'none',
              background: theme === 'light' ? 'var(--surface-primary, #FFFFFF)' : 'transparent',
              color: theme === 'light' ? 'var(--text-primary, #20242B)' : 'var(--icon-inactive, #858A91)',
              boxShadow: theme === 'light' ? 'var(--shadow-card)' : 'none',
            }}
          >
            <Sun size={14} />
          </button>
          <button
            type="button"
            onClick={() => applyTheme('dark')}
            title="Dark appearance"
            aria-label="Dark appearance"
            style={{
              flex: collapsed ? undefined : 1,
              width: collapsed ? '24px' : undefined,
              height: '28px',
              padding: 0,
              borderRadius: '16px',
              border: 'none',
              background: theme === 'dark' ? 'var(--surface-primary, #FFFFFF)' : 'transparent',
              color: theme === 'dark' ? 'var(--text-primary, #20242B)' : 'var(--icon-inactive, #858A91)',
              boxShadow: theme === 'dark' ? 'var(--shadow-card)' : 'none',
            }}
          >
            <Moon size={14} />
          </button>
        </div>

        {/* Desktop collapse toggle */}
        {!isMobileDrawer && (
          <button
            className="sidelink desktop-only-collapse"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{
              justifyContent: collapsed ? 'center' : 'flex-start',
              cursor: 'pointer',
              border: '1px solid var(--border-default, #E0E1E3)',
              background: 'var(--surface-primary, #FFFFFF)',
              color: 'var(--text-secondary, #777B82)',
              borderRadius: '10px',
            }}
          >
            <NavigationIcon name="resize" filled={!collapsed} size={16} style={{ color: 'var(--icon-inactive, #858A91)' }} />
            {!collapsed && <span>{collapsed ? 'Expand sidebar' : 'Collapse sidebar'}</span>}
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
          style={{
            justifyContent: collapsed ? 'center' : 'flex-start',
            border: '1px solid var(--border-default, #E0E1E3)',
            background: 'var(--surface-primary, #FFFFFF)',
            color: 'var(--text-secondary, #777B82)',
            borderRadius: '10px',
          }}
        >
          <NavigationIcon name="signout" filled={false} size={16} style={{ color: 'var(--icon-inactive, #858A91)' }} />
          {!collapsed && <span>Sign out</span>}
        </Link>
      </div>
    </aside>
  );
}
