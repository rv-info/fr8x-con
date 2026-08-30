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

interface AppShellProps {
  children: ReactNode;
}

function ShellLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // If on login/register page, show clean standalone view without full workspace shell
  const isAuthPage = pathname === '/login' || pathname === '/register' || pathname === '/forgot-password';

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  // Get active page title for header breadcrumb
  let activeTitle = 'Auctions';
  if (pathname === '/feeds') activeTitle = 'Feeds';
  else if (pathname === '/nexus') activeTitle = 'Nexus';
  else if (pathname === '/rates') activeTitle = 'Rates';
  else if (pathname === '/profile') activeTitle = 'Profile';
  else if (pathname.startsWith('/auctions/create')) activeTitle = 'Create Reverse Auction';
  else if (pathname.startsWith('/auctions/')) activeTitle = 'Live Bid Room';

  return (
    <div className={`app ${isSidebarCollapsed ? 'collapsed-sidebar' : ''}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />
      <main style={{ minWidth: 0 }}>
        <TopBar activePageTitle={activeTitle} />
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
