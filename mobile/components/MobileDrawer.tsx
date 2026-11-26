'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  Briefcase,
  Building2,
  LogOut,
  Shield,
  ShieldCheck,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { NavigationIcon } from '@/components/ui/NavigationIcon';
import { useAuth } from '@/lib/context/AuthContext';
import { useData } from '@/lib/context/DataContext';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const { user, logout } = useAuth();
  const { notifications } = useData();

  useEffect(() => {
    if (!open) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  const unreadCount = Array.isArray(notifications)
    ? notifications.filter((n) => !n.read).length
    : 0;

  const isAdmin =
    user?.role === 'super_admin' ||
    user?.role === 'company_admin';

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const handleLogout = async () => {
    onClose();
    try {
      await logout();
    } catch {
      // Fallback redirect handled below
    }
    router.replace('/login');
  };

  return (
    <div
      className="fr8x-m-drawer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation"
      onClick={onClose}
    >
      <nav
        className="fr8x-m-drawer"
        aria-label="Primary Mobile Navigation"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fr8x-m-drawer-header">
          <div className="fr8x-m-drawer-profile">
            <div className="fr8x-m-brand-badge">
              <img src="/ART/LOGOS/logo_primary.png" alt="FR8X" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '14.5px',
                  fontWeight: 700,
                  color: 'var(--m-primary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.displayName || 'FR8X Member'}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--m-text-muted)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.company || user?.email || ''}
              </div>
            </div>
          </div>

          <button
            type="button"
            className="fr8x-m-icon-btn"
            onClick={onClose}
            aria-label="Close navigation menu"
          >
            <X size={20} />
          </button>
        </div>

        <div className="fr8x-m-drawer-body">
          <div>
            <div className="fr8x-m-drawer-group-title">Core Workspace</div>
            <div className="fr8x-m-drawer-list">
              <Link
                href="/dashboard"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/dashboard') ? 'is-active' : ''}`}
              >
                <NavigationIcon name="dashboard" filled={isActive('/dashboard')} size={18} />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/feeds"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/feeds') ? 'is-active' : ''}`}
              >
                <NavigationIcon name="feeds" filled={isActive('/feeds')} size={18} />
                <span>Feeds</span>
              </Link>
              <Link
                href="/rates"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/rates') ? 'is-active' : ''}`}
              >
                <NavigationIcon name="rates" filled={isActive('/rates')} size={18} />
                <span>Rates</span>
              </Link>
              <Link
                href="/auctions"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/auctions') ? 'is-active' : ''}`}
              >
                <NavigationIcon name="auctions" filled={isActive('/auctions')} size={18} />
                <span>Auctions</span>
              </Link>
              <Link
                href="/auctions/create"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${pathname === '/auctions/create' ? 'is-active' : ''}`}
              >
                <NavigationIcon name="auctions" filled={pathname === '/auctions/create'} size={18} />
                <span>Create Reverse Auction</span>
              </Link>
            </div>
          </div>

          <div>
            <div className="fr8x-m-drawer-group-title">Network &amp; Intelligence</div>
            <div className="fr8x-m-drawer-list">
              <Link
                href="/network"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/network') ? 'is-active' : ''}`}
              >
                <NavigationIcon name="network" filled={isActive('/network')} size={18} />
                <span>Network Hub</span>
              </Link>
              <Link
                href="/connections"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/connections') ? 'is-active' : ''}`}
              >
                <UserCheck size={18} />
                <span>Connections</span>
              </Link>
              <Link
                href="/contacts"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/contacts') ? 'is-active' : ''}`}
              >
                <Building2 size={18} />
                <span>Contacts &amp; CRM</span>
              </Link>
              <Link
                href="/people"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/people') ? 'is-active' : ''}`}
              >
                <Users size={18} />
                <span>People Directory</span>
              </Link>
              <Link
                href="/nexus"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/nexus') ? 'is-active' : ''}`}
              >
                <NavigationIcon name="nexus" filled={isActive('/nexus')} size={18} />
                <span>Nexus Intelligence</span>
              </Link>
              <Link
                href="/jobs"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/jobs') ? 'is-active' : ''}`}
              >
                <Briefcase size={18} />
                <span>Trade Careers &amp; Jobs</span>
              </Link>
            </div>
          </div>

          <div>
            <div className="fr8x-m-drawer-group-title">Account &amp; Governance</div>
            <div className="fr8x-m-drawer-list">
              <Link
                href="/profile"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/profile') ? 'is-active' : ''}`}
              >
                <NavigationIcon name="profile" filled={isActive('/profile')} size={18} />
                <span>Profile &amp; Freight Passport</span>
              </Link>
              <Link
                href="/notifications"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/notifications') ? 'is-active' : ''}`}
              >
                <Bell size={18} />
                <span>Notifications</span>
                {unreadCount > 0 && (
                  <span className="fr8x-m-drawer-link-badge">{unreadCount}</span>
                )}
              </Link>
              <Link
                href="/privacy"
                onClick={onClose}
                className={`fr8x-m-drawer-link ${isActive('/privacy') ? 'is-active' : ''}`}
              >
                <ShieldCheck size={18} />
                <span>Privacy Policy</span>
              </Link>
              {isAdmin && (
                <Link
                  href="/godfather"
                  onClick={onClose}
                  className={`fr8x-m-drawer-link ${isActive('/godfather') ? 'is-active' : ''}`}
                >
                  <Shield size={18} />
                  <span>Godfather Console</span>
                </Link>
              )}
            </div>
          </div>
        </div>

        <div className="fr8x-m-drawer-footer">
          <button
            type="button"
            onClick={handleLogout}
            className="fr8x-m-drawer-link"
            style={{ color: '#B91C1C' }}
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
