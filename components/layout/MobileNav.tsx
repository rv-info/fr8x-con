'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NavigationIcon, NavIconName } from '@/components/ui/NavigationIcon';
import { useAuth } from '@/lib/context/AuthContext';
import { useData } from '@/lib/context/DataContext';

interface SecondaryModuleItem {
  id: string;
  name: string;
  subtitle: string;
  href: string;
  icon: NavIconName;
  badge?: number | string;
  action?: () => void;
  active: boolean;
  isDestructive?: boolean;
}

export function MobileNav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { notifications } = useData();
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Synchronize client-side search query string safely without triggering hydration mismatch or router suspense
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setSearchQuery(window.location.search || '');
    }
  }, [pathname]);

  // Nexus unread notifications count
  const nexusUnreadCount = useMemo(() => {
    return (notifications || []).filter(
      (n) => !n.read && (n.category === 'nexus' || n.targetUrl?.startsWith('/nexus'))
    ).length;
  }, [notifications]);

  // Overall unread notifications count
  const totalUnreadCount = useMemo(() => {
    return (notifications || []).filter((n) => !n.read).length;
  }, [notifications]);

  // Safe handler to close the More sheet and clean up browser history state if synthetic popstate was pushed
  const closeMoreSheet = useCallback(() => {
    setShowMoreSheet(false);
    if (typeof window !== 'undefined' && window.history.state?.fr8xMoreSheetOpen) {
      window.history.back();
    }
  }, []);

  const openMoreSheet = useCallback(() => {
    setShowMoreSheet(true);
    if (typeof window !== 'undefined') {
      window.history.pushState({ fr8xMoreSheetOpen: true }, '');
    }
  }, []);

  const toggleMoreSheet = useCallback(() => {
    if (showMoreSheet) {
      closeMoreSheet();
    } else {
      openMoreSheet();
    }
  }, [showMoreSheet, closeMoreSheet, openMoreSheet]);

  // Handle Android Back button (popstate) and Escape key
  useEffect(() => {
    if (!showMoreSheet) return;

    const handlePopState = () => {
      setShowMoreSheet(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMoreSheet();
      }
    };

    window.addEventListener('popstate', handlePopState);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [showMoreSheet, closeMoreSheet]);

  // Auto-close sheet when route changes
  useEffect(() => {
    setShowMoreSheet(false);
  }, [pathname]);

  // Primary navigation item active checker
  const isPrimaryActive = useCallback(
    (href: string) => {
      if (href === '/dashboard') return pathname === '/dashboard' || pathname === '/';
      if (href === '/feeds') return pathname === '/feeds' || pathname.startsWith('/feeds/');
      if (href === '/rates') return pathname === '/rates' || pathname.startsWith('/rates/');
      if (href === '/auctions') return pathname === '/auctions' || pathname.startsWith('/auctions/');
      if (href === '/network') {
        // Active on network hub UNLESS user navigated to the CRM tab which is surfaced under More
        const isCrmTab = searchQuery.includes('tab=crm');
        return (
          (pathname === '/network' && !isCrmTab) ||
          pathname.startsWith('/network/') ||
          pathname === '/people' ||
          pathname.startsWith('/people/') ||
          pathname === '/connections' ||
          pathname.startsWith('/connections/')
        );
      }
      return pathname === href;
    },
    [pathname, searchQuery]
  );

  // Secondary module active state detection
  const isProfileActive = pathname === '/profile' && !searchQuery.includes('tab=privacy');
  const isJobsActive = pathname === '/jobs' || pathname.startsWith('/jobs/');
  const isNexusActive = pathname === '/nexus' && !searchQuery.includes('tab=blacklist');
  const isCrmActive = pathname === '/contacts' || pathname.startsWith('/contacts/') || (pathname === '/network' && searchQuery.includes('tab=crm'));
  const isComplianceActive = pathname === '/nexus' && searchQuery.includes('tab=blacklist');
  const isPrivacyActive = pathname === '/privacy' || pathname.startsWith('/privacy/') || (pathname === '/profile' && searchQuery.includes('tab=privacy'));
  const isNotifsActive = pathname === '/notifications' || pathname.startsWith('/notifications/');
  const isGodfatherActive = pathname.startsWith('/godfather');

  // MORE bottom tab is active if sheet is open OR if currently on any secondary module
  const isMoreTabActive =
    showMoreSheet ||
    isProfileActive ||
    isJobsActive ||
    isNexusActive ||
    isCrmActive ||
    isComplianceActive ||
    isPrivacyActive ||
    isNotifsActive ||
    isGodfatherActive;

  // The 5 mandatory primary mobile destinations
  const primaryNavItems: { id: NavIconName; href: string; label: string }[] = [
    { id: 'dashboard', href: '/dashboard', label: 'Home' },
    { id: 'feeds', href: '/feeds', label: 'Feeds' },
    { id: 'rates', href: '/rates', label: 'Rates' },
    { id: 'auctions', href: '/auctions', label: 'Auctions' },
    { id: 'network', href: '/network', label: 'Network' },
  ];

  // Secondary modules accessible inside MORE
  const secondaryModules: SecondaryModuleItem[] = [
    {
      id: 'profile',
      name: 'Profile & Passport',
      subtitle: 'Statutory KYC, GSTN & passport',
      href: '/profile',
      icon: 'profile',
      active: isProfileActive,
    },
    {
      id: 'jobs',
      name: 'Jobs & Careers',
      subtitle: 'Freight careers & recruitment',
      href: '/jobs',
      icon: 'jobs',
      active: isJobsActive,
    },
    {
      id: 'nexus',
      name: 'Nexus Intelligence',
      subtitle: 'Trade trust & verified desk',
      href: '/nexus',
      icon: 'nexus',
      badge: nexusUnreadCount > 0 ? nexusUnreadCount : undefined,
      active: isNexusActive,
    },
    {
      id: 'crm',
      name: 'Contacts & CRM',
      subtitle: 'Logistics CRM & trade partners',
      href: '/network?tab=crm',
      icon: 'network',
      active: isCrmActive,
    },
    {
      id: 'compliance',
      name: 'Compliance & Blacklist',
      subtitle: 'Fraud watch, defaulters & risk',
      href: '/nexus?tab=blacklist',
      icon: 'shield',
      active: isComplianceActive,
    },
    {
      id: 'privacy',
      name: 'Privacy & Governance',
      subtitle: 'Data governance & audit trail',
      href: '/profile?tab=privacy',
      icon: 'audit',
      active: isPrivacyActive,
    },
    {
      id: 'notifications',
      name: 'Notifications Hub',
      subtitle: 'Real-time alerts & updates',
      href: '/notifications',
      icon: 'notifications',
      badge: totalUnreadCount > 0 ? totalUnreadCount : undefined,
      active: isNotifsActive,
    },
  ];

  // Role-based authorization for administrative controls
  if (user?.role === 'super_admin' || user?.role === 'moderator' || (user as any)?.is_godfather) {
    secondaryModules.push({
      id: 'godfather',
      name: 'Godfather Console',
      subtitle: 'Super-admin platform controls',
      href: '/godfather',
      icon: 'shield',
      active: isGodfatherActive,
    });
  }

  // Append Sign Out as destructive final option
  secondaryModules.push({
    id: 'signout',
    name: 'Sign Out',
    subtitle: 'End current session safely',
    href: '/login',
    icon: 'signout',
    active: false,
    isDestructive: true,
    action: () => {
      logout();
    },
  });

  return (
    <>
      {/* Mobile More Drawer / Bottom Sheet */}
      {showMoreSheet && (
        <div
          className="mobile-sheet-overlay"
          onClick={closeMoreSheet}
          aria-modal="true"
          role="dialog"
          aria-label="More navigation modules"
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            WebkitBackdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
          }}
        >
          <div
            id="mobile-more-sheet"
            className="mobile-sheet-content"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'var(--surface-primary, #FFFFFF)',
              color: 'var(--text-primary, #1F2937)',
              borderTopLeftRadius: '16px',
              borderTopRightRadius: '16px',
              padding: '12px 14px calc(66px + env(safe-area-inset-bottom, 8px))',
              boxShadow: 'var(--glass-shadow-lg, 0 -8px 30px rgba(0, 0, 0, 0.16))',
              maxHeight: '76vh',
              overflowY: 'auto',
              borderTop: '1px solid var(--border-default, #D9DEE5)',
            }}
          >
            {/* Sheet Drag / Grab Handle */}
            <div
              style={{
                width: '36px',
                height: '4px',
                backgroundColor: 'var(--border-strong, #C5CBD3)',
                borderRadius: '2px',
                margin: '0 auto 10px',
              }}
            />

            {/* Header: Title and Close button */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: '1px solid var(--border-subtle, #E5E7EB)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <NavigationIcon name="resize" filled={true} size={15} style={{ color: 'var(--text-primary, #1F2937)' }} />
                <span
                  style={{
                    fontSize: '12.5px',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: 800,
                    color: 'var(--text-primary, #1F2937)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  More Modules
                </span>
              </div>
              <button
                type="button"
                onClick={closeMoreSheet}
                aria-label="Close More menu"
                style={{
                  background: 'var(--surface-elevated, #F8FAFC)',
                  border: '1px solid var(--border-subtle, #E5E7EB)',
                  borderRadius: '50%',
                  width: '26px',
                  height: '26px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-secondary, #64748B)',
                  fontWeight: 'bold',
                  fontSize: '12px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                ✕
              </button>
            </div>

            {/* Organized 2-Column Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                gap: '8px',
              }}
            >
              {secondaryModules.map((item) => {
                const isSelected = item.active;

                if (item.action) {
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        closeMoreSheet();
                        item.action?.();
                      }}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        textAlign: 'left',
                        gap: '3px',
                        padding: '10px 11px',
                        borderRadius: '8px',
                        border: item.isDestructive ? '1px solid rgba(220, 38, 38, 0.4)' : '1px solid var(--border-subtle, #E5E7EB)',
                        backgroundColor: item.isDestructive ? 'rgba(220, 38, 38, 0.08)' : 'var(--surface-elevated, #F8FAFC)',
                        color: item.isDestructive ? '#DC2626' : 'var(--text-primary, #1F2937)',
                        cursor: 'pointer',
                        fontFamily: 'var(--font-family-primary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                          <NavigationIcon
                            name={item.icon}
                            filled={false}
                            size={18}
                            style={{ color: item.isDestructive ? '#DC2626' : 'var(--text-primary, #1F2937)', flexShrink: 0 }}
                          />
                          <span
                            style={{
                              fontSize: '11.5px',
                              fontWeight: 700,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {item.name}
                          </span>
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: '9.5px',
                          color: item.isDestructive ? '#DC2626' : 'var(--text-secondary, #64748B)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          marginTop: '2px',
                        }}
                      >
                        {item.subtitle}
                      </span>
                    </button>
                  );
                }

                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setShowMoreSheet(false)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '3px',
                      padding: '10px 11px',
                      borderRadius: '8px',
                      border: isSelected ? '1px solid var(--accent-primary, #006B68)' : '1px solid var(--border-subtle, #E5E7EB)',
                      backgroundColor: isSelected ? 'var(--surface-elevated, #F8FAFC)' : 'var(--surface-primary, #FFFFFF)',
                      textDecoration: 'none',
                      color: isSelected ? 'var(--accent-primary, #006B68)' : 'var(--text-primary, #1F2937)',
                      fontFamily: 'var(--font-family-primary)',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px', minWidth: 0 }}>
                        <NavigationIcon
                          name={item.icon}
                          filled={isSelected}
                          size={18}
                          style={{ color: isSelected ? 'var(--accent-primary, #006B68)' : 'var(--text-primary, #1F2937)', flexShrink: 0 }}
                        />
                        <span
                          style={{
                            fontSize: '11.5px',
                            fontWeight: isSelected ? 800 : 700,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {item.name}
                        </span>
                      </div>
                      {item.badge !== undefined && (
                        <span
                          style={{
                            backgroundColor: '#EF4444',
                            color: '#FFF',
                            fontSize: '9px',
                            fontWeight: 800,
                            padding: '1px 5px',
                            borderRadius: '10px',
                            flexShrink: 0,
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: '9.5px',
                        color: isSelected ? 'var(--text-primary, #1F2937)' : 'var(--text-secondary, #64748B)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        marginTop: '2px',
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {item.subtitle}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Navigation Bar (5 Primary Items + 1 Unified More Button) */}
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
          backgroundColor: 'var(--surface-primary, #FFFFFF)',
          borderTop: '1px solid var(--border-subtle, #E5E7EB)',
          zIndex: 90,
          boxShadow: 'var(--shadow-card, 0 -2px 10px rgba(0, 0, 0, 0.05))',
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
          {/* Primary Nav Items (5 Constant Destinations) */}
          {primaryNavItems.map((item) => {
            const active = isPrimaryActive(item.href);

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
                  backgroundColor: active ? 'var(--accent-primary, #006B68)' : 'transparent',
                  border: active ? '1px solid var(--accent-primary, #006B68)' : '1px solid var(--border-subtle, #E5E7EB)',
                  color: active ? '#FFFFFF' : 'var(--text-secondary, #64748B)',
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
                    style={{ color: active ? '#FFFFFF' : 'var(--text-secondary, #64748B)' }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontFamily: 'var(--font-family-primary)',
                    fontWeight: active ? 600 : 400,
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

          {/* 6th Destination: MORE Button (Toggles Secondary Modules Bottom Sheet) */}
          <button
            type="button"
            onClick={toggleMoreSheet}
            className={`mobile-nav-item ${isMoreTabActive ? 'active' : ''}`}
            aria-label="More navigation modules"
            aria-expanded={showMoreSheet}
            aria-controls="mobile-more-sheet"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              minWidth: '46px',
              height: '46px',
              background: isMoreTabActive ? 'var(--accent-primary, #006B68)' : 'transparent',
              border: isMoreTabActive ? '1px solid var(--accent-primary, #006B68)' : '1px solid var(--border-subtle, #E5E7EB)',
              borderRadius: '6px',
              padding: '2px 1px',
              cursor: 'pointer',
              color: isMoreTabActive ? '#FFFFFF' : 'var(--text-secondary, #64748B)',
              transition: 'all 0.15s ease',
              userSelect: 'none',
              WebkitTapHighlightColor: 'transparent',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '22px' }}>
              <NavigationIcon
                name="resize"
                filled={isMoreTabActive}
                size={18}
                style={{ color: isMoreTabActive ? '#FFFFFF' : 'var(--text-secondary, #64748B)' }}
              />
            </div>
            <span
              style={{
                fontSize: '11px',
                fontFamily: 'var(--font-family-primary)',
                fontWeight: isMoreTabActive ? 700 : 500,
                marginTop: '2px',
                lineHeight: 1,
                letterSpacing: '-0.01em',
              }}
            >
              More
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default MobileNav;
