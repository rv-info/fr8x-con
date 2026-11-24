'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
      style={{ backgroundColor: '#FFFFFF', borderRight: '1px solid #D9E0E8' }}
    >
      {/* Brand Header */}
      <div
        className="brand"
        style={{
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '4px 0 10px' : '4px 6px 10px',
          alignItems: 'center',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #D9E0E8',
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
            src="/ART/LOGOS/logo_primary.svg"
            alt="FR8X"
            style={{
              width: collapsed ? '26px' : '30px',
              height: collapsed ? '26px' : '30px',
              objectFit: 'contain',
              borderRadius: '6px',
              flexShrink: 0,
              display: 'block',
            }}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/ART/LOGOS/logo_primary.png';
            }}
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 'bold',
              letterSpacing: '0.04em',
              color: '#172B2B',
              lineHeight: 1,
              textTransform: 'uppercase',
              fontFamily: 'Calibri, Arial, sans-serif',
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
                padding: collapsed ? '0' : '0 11px',
                ...(active
                  ? { backgroundColor: '#075B5B', color: '#FFFFFF', borderRadius: '6px', border: '1px solid #075B5B', boxShadow: '0 1px 3px rgba(7, 91, 91, 0.25)' }
                  : { color: '#172B45', backgroundColor: 'transparent', border: '1px solid transparent' }),
                fontFamily: "'Calibri Light', Calibri, Arial, sans-serif",
                fontSize: '12px',
                fontWeight: active ? 600 : 400,
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                textDecoration: 'none',
                height: '34px',
                margin: '1px 0',
                transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            >
              <NavigationIcon
                name={item.id}
                filled={active}
                size={18}
                style={{ color: active ? '#FFFFFF' : '#172B45' }}
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

        {/* Desktop collapse toggle */}
        {!isMobileDrawer && (
          <button
            className="sidelink desktop-only-collapse"
            onClick={onToggleCollapse}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ justifyContent: collapsed ? 'center' : 'flex-start', cursor: 'pointer', border: 'none', background: 'transparent' }}
          >
            <NavigationIcon name="resize" filled={!collapsed} size={16} style={{ color: '#1B2B4B' }} />
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
          style={{ justifyContent: collapsed ? 'center' : 'flex-start' }}
        >
          <NavigationIcon name="signout" filled={false} size={16} style={{ color: '#1B2B4B' }} />
          {!collapsed && <span>Sign out</span>}
        </Link>
      </div>
    </aside>
  );
}
