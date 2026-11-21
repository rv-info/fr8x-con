'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationIcon, NavIconName } from '@/components/ui/NavigationIcon';
import { useAuth } from '@/lib/context/AuthContext';
import { useData } from '@/lib/context/DataContext';

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { notifications } = useData();
  const [showMoreSheet, setShowMoreSheet] = useState(false);

  // Close sheet on route change
  useEffect(() => {
    setShowMoreSheet(false);
  }, [pathname]);

  // Nexus unread notifications count
  const nexusUnreadCount = (notifications || []).filter(
    (n) => !n.read && (n.category === 'nexus' || n.targetUrl?.startsWith('/nexus'))
  ).length;

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
    if (href === '/auctions') return pathname === '/auctions' || pathname.startsWith('/auctions/');
    if (href === '/rates') return pathname === '/rates' || pathname.startsWith('/rates/');
    if (href === '/feeds') return pathname === '/feeds' || pathname.startsWith('/feeds/');
    if (href === '/jobs') return pathname === '/jobs' || pathname.startsWith('/jobs/');
    if (href === '/profile') return pathname === '/profile' || pathname.startsWith('/profile/');
    if (href === '/nexus') return pathname === '/nexus' || pathname.startsWith('/nexus/');
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

  // Determine dynamic state for 6th item (More vs active sub-route)
  const isProfileActive = isActive('/profile');
  const isJobsActive = isActive('/jobs');
  const isNexusActive = isActive('/nexus');

  let moreTabConfig: { id: NavIconName; label: string; href?: string; isRoute: boolean; active: boolean } = {
    id: 'resize',
    label: 'More',
    isRoute: false,
    active: showMoreSheet,
  };

  if (isProfileActive) {
    moreTabConfig = { id: 'profile', label: 'Profile', href: '/profile', isRoute: true, active: true };
  } else if (isJobsActive) {
    moreTabConfig = { id: 'jobs', label: 'Jobs', href: '/jobs', isRoute: true, active: true };
  } else if (isNexusActive) {
    moreTabConfig = { id: 'nexus', label: 'Nexus', href: '/nexus', isRoute: true, active: true };
  }

  const primaryNavItems: { id: NavIconName; href: string; label: string }[] = [
    { id: 'dashboard', href: '/dashboard', label: 'Home' },
    { id: 'feeds', href: '/feeds', label: 'Feeds' },
    { id: 'rates', href: '/rates', label: 'Rates' },
    { id: 'auctions', href: '/auctions', label: 'Auctions' },
    { id: 'network', href: '/network', label: 'Network' },
  ];

  return (
    <>
      {/* Mobile More Drawer / Sheet */}
      {showMoreSheet && (
        <div
          className="mobile-sheet-overlay"
          onClick={() => setShowMoreSheet(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 95,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div
            className="mobile-sheet-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '16px 16px calc(70px + env(safe-area-inset-bottom, 0px))',
              boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.15)',
              maxHeight: '75vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#1B2B4B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Additional Modules
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreSheet(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B',
                  fontWeight: 'bold',
                }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {/* Profile Card */}
              <Link
                href="/profile"
                onClick={() => setShowMoreSheet(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: isProfileActive ? '1.5px solid #1B2B4B' : '1px solid #E2E8F0',
                  backgroundColor: isProfileActive ? '#EEF2F7' : '#F8FAFC',
                  textDecoration: 'none',
                  color: '#1B2B4B',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <NavigationIcon name="profile" filled={isProfileActive} size={20} style={{ color: '#1B2B4B' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Profile & Passport</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>Statutory KYC, GSTN & profile</span>
              </Link>

              {/* Nexus Card */}
              <Link
                href="/nexus"
                onClick={() => setShowMoreSheet(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: isNexusActive ? '1.5px solid #1B2B4B' : '1px solid #E2E8F0',
                  backgroundColor: isNexusActive ? '#EEF2F7' : '#F8FAFC',
                  textDecoration: 'none',
                  color: '#1B2B4B',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <NavigationIcon name="nexus" filled={isNexusActive} size={20} style={{ color: '#1B2B4B' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Nexus Compliance</span>
                  {nexusUnreadCount > 0 && (
                    <span style={{ backgroundColor: '#EF4444', color: '#FFF', fontSize: '9px', fontWeight: 800, padding: '1px 5px', borderRadius: '10px', marginLeft: 'auto' }}>
                      {nexusUnreadCount}
                    </span>
                  )}
                </div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>Fraud & credit risk protection</span>
              </Link>

              {/* Jobs Card */}
              <Link
                href="/jobs"
                onClick={() => setShowMoreSheet(false)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: isJobsActive ? '1.5px solid #1B2B4B' : '1px solid #E2E8F0',
                  backgroundColor: isJobsActive ? '#EEF2F7' : '#F8FAFC',
                  textDecoration: 'none',
                  color: '#1B2B4B',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <NavigationIcon name="jobs" filled={isJobsActive} size={20} style={{ color: '#1B2B4B' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Jobs & Careers</span>
                </div>
                <span style={{ fontSize: '10px', color: '#64748B' }}>Freight industry hiring</span>
              </Link>

              {/* Sign Out Card */}
              <Link
                href="/login"
                onClick={() => {
                  setShowMoreSheet(false);
                  logout();
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  backgroundColor: '#FFF5F5',
                  textDecoration: 'none',
                  color: '#DC2626',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <NavigationIcon name="signout" filled={false} size={20} style={{ color: '#DC2626' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700 }}>Sign Out</span>
                </div>
                <span style={{ fontSize: '10px', color: '#991B1B' }}>End current session</span>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar */}
      <nav
        className="mobile-bottom-nav"
        role="navigation"
        aria-label="Mobile Bottom Navigation"
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          height: 'calc(54px + env(safe-area-inset-bottom, 0px))',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #E2E8F0',
          zIndex: 90,
          boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div
          className="mobile-bottom-nav-inner"
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-around',
            height: '54px',
            maxWidth: '600px',
            margin: '0 auto',
            padding: '0 4px',
          }}
        >
          {/* Primary Nav Items */}
          {primaryNavItems.map((item) => {
            const active = isActive(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`mobile-nav-item ${active ? 'active' : ''}`}
                aria-current={active ? 'page' : undefined}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 1,
                  minWidth: '46px',
                  height: '46px',
                  textDecoration: 'none',
                  borderRadius: '6px',
                  padding: '2px 1px',
                  backgroundColor: active ? '#EEF2F7' : 'transparent',
                  border: active ? '1px solid #1B2B4B' : '1px solid transparent',
                  color: active ? '#1B2B4B' : '#4A5568',
                  transition: 'all 0.15s ease',
                  userSelect: 'none',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '22px' }}>
                  <NavigationIcon
                    name={item.id}
                    filled={active}
                    size={18}
                    style={{ color: active ? '#1B2B4B' : '#4A5568' }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'Calibri, Arial, sans-serif',
                    fontWeight: active ? 700 : 500,
                    marginTop: '2px',
                    lineHeight: 1,
                    letterSpacing: '-0.01em',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* 6th Tab: More / Contextual Active Item */}
          {moreTabConfig.isRoute && moreTabConfig.href ? (
            <Link
              href={moreTabConfig.href}
              className="mobile-nav-item active"
              aria-current="page"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                minWidth: '46px',
                height: '46px',
                textDecoration: 'none',
                borderRadius: '6px',
                padding: '2px 1px',
                backgroundColor: '#EEF2F7',
                border: '1px solid #1B2B4B',
                color: '#1B2B4B',
                transition: 'all 0.15s ease',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '22px' }}>
                <NavigationIcon
                  name={moreTabConfig.id}
                  filled={true}
                  size={18}
                  style={{ color: '#1B2B4B' }}
                />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'Calibri, Arial, sans-serif',
                  fontWeight: 700,
                  marginTop: '2px',
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                {moreTabConfig.label}
              </span>
            </Link>
          ) : (
            <button
              type="button"
              onClick={() => setShowMoreSheet(!showMoreSheet)}
              className={`mobile-nav-item ${moreTabConfig.active ? 'active' : ''}`}
              aria-label="More navigation modules"
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                minWidth: '46px',
                height: '46px',
                background: moreTabConfig.active ? '#EEF2F7' : 'transparent',
                border: moreTabConfig.active ? '1px solid #1B2B4B' : '1px solid transparent',
                borderRadius: '6px',
                padding: '2px 1px',
                cursor: 'pointer',
                color: moreTabConfig.active ? '#1B2B4B' : '#4A5568',
                transition: 'all 0.15s ease',
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '22px' }}>
                <NavigationIcon
                  name={moreTabConfig.id}
                  filled={moreTabConfig.active}
                  size={18}
                  style={{ color: moreTabConfig.active ? '#1B2B4B' : '#4A5568' }}
                />
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontFamily: 'Calibri, Arial, sans-serif',
                  fontWeight: moreTabConfig.active ? 700 : 500,
                  marginTop: '2px',
                  lineHeight: 1,
                  letterSpacing: '-0.01em',
                }}
              >
                {moreTabConfig.label}
              </span>
            </button>
          )}
        </div>
      </nav>
    </>
  );
}

export default MobileNav;
