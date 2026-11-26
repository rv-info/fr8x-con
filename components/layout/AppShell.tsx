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
import { MobileExperienceHost } from '@/mobile/MobileExperienceHost';
import { OrbLoader, RouteTransitionBar } from '@/components/ui/LoadingSystem';
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

  // Fallback watchdog: if stuck on loading/unauthenticated for > 5 seconds on a protected route, force redirect to /login
  React.useEffect(() => {
    if (isGodfather || isPublicPage) return;
    if (isLoading || !isAuthenticated) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          // If cached profile exists, attempt fast fallback before redirecting
          const cached = localStorage.getItem('fr8x_cached_user_profile');
          if (!cached) {
            window.location.href = '/login';
          }
        }
      }, 5000);
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
      <MobileExperienceHost withShellChrome={false}>
        <main
          suppressHydrationWarning
          style={{ minWidth: '100%', minHeight: '100vh', margin: 0, padding: 0 }}
        >
          {children}
        </main>
      </MobileExperienceHost>
    );
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--app-bg, #FFFFFF)',
          color: 'var(--text-primary, #1F2937)',
          padding: '24px 16px',
        }}
      >
        <OrbLoader
          variant="page"
          message="Connecting to your workspace…"
          stage="Verifying FR8X session…"
          delayMs={0}
        />
        <a
          href="/login"
          style={{
            marginTop: '4px',
            fontSize: '12.5px',
            color: 'var(--accent-primary, #006B68)',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Taking too long? Click here to sign in
        </a>
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
  else if (pathname.startsWith('/network') || pathname.startsWith('/people') || pathname.startsWith('/connections') || pathname.startsWith('/contacts')) activeTitle = 'Network';

  return (
    <MobileExperienceHost withShellChrome={true} activePageTitle={activeTitle}>
      <RouteTransitionBar />
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
    </MobileExperienceHost>
  );
}

import { NetworkProvider } from '@/lib/context/NetworkContext';

export function AppShell({ children }: AppShellProps) {
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Actively purge any legacy caches to liberate users from stale HTML
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key !== 'fr8x-cache-v6.0.0') {
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
