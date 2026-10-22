'use client';

import React, { useState, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ToastProvider } from '@/lib/context/ToastContext';
import { CurrencyProvider } from '@/lib/context/CurrencyContext';
import { DataProvider } from '@/lib/context/DataContext';
import { ChatProvider } from '@/lib/context/ChatContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import dynamic from 'next/dynamic';
import { Menu } from 'lucide-react';

const NexusChat = dynamic(
  () => import('@/components/chat/TradeChat').then((mod) => mod.TradeChat),
  { ssr: false }
);

const PlanExpiredModal = dynamic(
  () => import('@/components/ui/PlanExpiredModal').then((mod) => mod.PlanExpiredModal),
  { ssr: false }
);

import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';

interface AppShellProps {
  children: ReactNode;
}

function ShellLayout({ children }: { children: ReactNode }) {
  const rawPathname = usePathname();
  const pathname = rawPathname || '/';
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  // Start signed-in workspaces in compact mode; users can expand it whenever needed.
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isPublicPage =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/register' ||
    pathname === '/forgot-password' ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/reset-password') ||
    pathname === '/download' ||
    pathname === '/privacy' ||
    pathname === '/terms' ||
    pathname.startsWith('/r/') ||
    pathname.startsWith('/ref/');
  const isGodfather = pathname.toLowerCase().startsWith('/godfather') || pathname.toLowerCase().startsWith('/godfatheron');

  // Protect app routes if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicPage && !isGodfather) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, isPublicPage, isGodfather, router]);

  // Fallback watchdog: if stuck on loading/unauthenticated for > 25 seconds on a protected route, force redirect to /login
  React.useEffect(() => {
    if (isGodfather || isPublicPage) return;
    if (isLoading || !isAuthenticated) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }, 25000);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, isPublicPage, isGodfather]);

  // Auto-close mobile sidebar when route changes
  React.useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [pathname]);

  // Close mobile sidebar on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileSidebarOpen) {
        setIsMobileSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileSidebarOpen]);

  if (isGodfather || isPublicPage) {
    return (
      <main
        suppressHydrationWarning
        style={{ minWidth: '100%', minHeight: '100vh', margin: 0, padding: 0 }}
      >
        {children}
      </main>
    );
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#ffffff',
          color: 'var(--fr8x-text, #1e293b)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
          <img
            src="/logo.png"
            alt="FR8X"
            style={{ width: '32px', height: '32px', objectFit: 'contain', display: 'block', margin: '0 auto' }}
          />
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#002b66', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
            FR8X
          </div>
          <div
            style={{
              marginTop: '8px',
              width: '24px',
              height: '24px',
              border: '2px solid #cbd5e1',
              borderTopColor: '#002b66',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--fr8x-muted, #475569)', letterSpacing: '0.02em', marginTop: '4px' }}>
            Verifying <span style={{ fontWeight: 'bold', color: '#002b66', textTransform: 'uppercase' }}>FR8X</span> session…
          </span>
          <a
            href="/login"
            style={{
              marginTop: '6px',
              fontSize: '11px',
              color: '#002b66',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Taking too long? Click here to sign in
          </a>
        </div>
      </div>
    );
  }

  // Get active page title for header breadcrumb
  let activeTitle = 'Dashboard';
  if (pathname === '/feeds') activeTitle = 'Feeds';
  else if (pathname === '/nexus') activeTitle = 'Nexus';
  else if (pathname === '/rates') activeTitle = 'Rates';
  else if (pathname === '/profile') activeTitle = 'Profile';
  else if (pathname === '/jobs') activeTitle = 'Jobs';
  else if (pathname.startsWith('/auctions/create')) activeTitle = 'Create Auction';
  else if (pathname.startsWith('/auctions/')) activeTitle = 'Live Bid Room';
  else if (pathname === '/auctions') activeTitle = 'Auctions';
  else if (pathname.startsWith('/people') || pathname.startsWith('/connections') || pathname.startsWith('/contacts')) activeTitle = 'People';

  return (
    <div className={`app ${isSidebarCollapsed ? 'collapsed-sidebar' : ''}`}>
      {/* WCAG 2.4.1 Accessible Skip Link */}
      <a href="#main-content" className="skip-to-content-link">
        Skip to main content
      </a>

      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
          aria-label="Close menu overlay"
        />
      )}

      {/* Sidebar with mobile class */}
      <div className={`sidebar-wrapper ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          isMobileDrawer={isMobileSidebarOpen}
        />
      </div>

      <main id="main-content" tabIndex={-1} style={{ minWidth: 0, outline: 'none' }}>
        <TopBar
          activePageTitle={activeTitle}
          onMobileMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <div className="view">{children}</div>
      </main>
      <MobileNav />
      <NexusChat />
      <PlanExpiredModal />
    </div>
  );
}

import { NetworkProvider } from '@/lib/context/NetworkContext';

export function AppShell({ children }: AppShellProps) {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Actively purge any legacy v1/v2/hyperspeed caches to liberate users from stale HTML
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key !== 'fr8x-cache-v4.0.0') {
              caches.delete(key).catch(() => {});
            }
          });
        }).catch(() => {});
      }

      if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
          navigator.serviceWorker.register('/sw.js').then((reg) => {
            reg.update().catch(() => {});
          }).catch((err) => {
            console.warn('[HyperSpeed PWA] Service worker registration deferred:', err);
          });
        });
      }
    }
  }, []);

  return (
    <ToastProvider>
      <NetworkProvider>
        <AuthProvider>
          <CurrencyProvider>
            <DataProvider>
              <ChatProvider>
                <ShellLayout>{children}</ShellLayout>
              </ChatProvider>
            </DataProvider>
          </CurrencyProvider>
        </AuthProvider>
      </NetworkProvider>
    </ToastProvider>
  );
}
