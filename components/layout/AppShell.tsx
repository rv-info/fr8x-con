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

  // Fallback watchdog: if stuck on loading/unauthenticated for > 3.5 seconds on a protected route, force redirect to /login
  React.useEffect(() => {
    if (isGodfather || isPublicPage) return;
    if (isLoading || !isAuthenticated) {
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [isLoading, isAuthenticated, isPublicPage, isGodfather]);

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
          background: 'var(--fr8x-background, #f8fafc)',
          color: 'var(--fr8x-text, #1e293b)',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid #cbd5e1',
              borderTopColor: '#1985a1',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
            }}
          />
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fr8x-muted, #475569)', letterSpacing: '0.02em' }}>
            Verifying session…
          </span>
          <a
            href="/login"
            style={{
              marginTop: '8px',
              fontSize: '11px',
              color: '#1985a1',
              textDecoration: 'none',
              fontWeight: 500,
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

  return (
    <div className={`app ${isSidebarCollapsed ? 'collapsed-sidebar' : ''}`}>
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="mobile-sidebar-overlay"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar with mobile class */}
      <div className={`sidebar-wrapper ${isMobileSidebarOpen ? 'mobile-open' : ''}`}>
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      <main style={{ minWidth: 0 }}>
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
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      // Register Service Worker for HyperSpeed offline resilience
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch((err) => {
          console.warn('[HyperSpeed PWA] Service worker registration deferred:', err);
        });
      });
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
