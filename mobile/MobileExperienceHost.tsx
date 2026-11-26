'use client';

import React, { ReactNode, useEffect, useState } from 'react';
import './styles/tokens.css';
import './styles/mobile.css';
import { MobileTopBar } from './components/MobileTopBar';
import { MobileDrawer } from './components/MobileDrawer';
import { MobileBottomNav } from './components/MobileBottomNav';

interface MobileExperienceHostProps {
  children: ReactNode;
  activePageTitle?: string;
  withShellChrome?: boolean;
}

export function MobileExperienceHost({
  children,
  activePageTitle = 'Dashboard',
  withShellChrome = false,
}: MobileExperienceHostProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia('(max-width: 900px)');
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      data-fr8x-mobile-root="true"
      data-fr8x-mobile-shell={withShellChrome ? 'true' : undefined}
    >
      {withShellChrome && (
        <MobileTopBar
          activePageTitle={activePageTitle}
          onOpenDrawer={() => setDrawerOpen(true)}
        />
      )}

      {children}

      {withShellChrome && (
        <>
          <MobileBottomNav />
          <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
        </>
      )}
    </div>
  );
}
