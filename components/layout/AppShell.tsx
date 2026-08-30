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
import { TradeChat } from '@/components/chat/TradeChat';
import { Menu } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
}

function ShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';
  const isGodfather = pathname.startsWith('/godfather');

  if (isGodfather || isAuthPage) {
    return <main style={{ minWidth: '100%', minHeight: '100vh', margin: 0, padding: 0 }}>{children}</main>;
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
      <TradeChat />
    </div>
  );
}

export function AppShell({ children }: AppShellProps) {
  return (
    <ToastProvider>
      <AuthProvider>
        <CurrencyProvider>
          <DataProvider>
            <ChatProvider>
              <ShellLayout>{children}</ShellLayout>
            </ChatProvider>
          </DataProvider>
        </CurrencyProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
