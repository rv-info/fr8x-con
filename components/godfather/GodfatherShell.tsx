'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { GodfatherSidebar } from './GodfatherSidebar';
import { GodfatherTopBar } from './GodfatherTopBar';
import { StepUpModal } from './StepUpModal';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

interface GodfatherShellProps {
  children: ReactNode;
}

export function GodfatherShell({ children }: GodfatherShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, authLoading, logoutOperator } = useGodfatherAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isClientReady, setIsClientReady] = useState(false);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  const isLoginPage =
    pathname.toLowerCase().startsWith('/godfatheron') ||
    pathname.toLowerCase().startsWith('/godfather/login');

  // ── Redirect unauthenticated users to login only AFTER session check completes ──
  useEffect(() => {
    if (!isClientReady || authLoading) return;
    if (isLoginPage) return;

    if (!isAuthenticated) {
      router.replace('/godfather/login');
    }
  }, [isAuthenticated, authLoading, isLoginPage, isClientReady, router]);

  // ── Login page: render children standalone (fully self-contained) ─────────
  if (isLoginPage) {
    return <>{children}</>;
  }

  if (!isClientReady || authLoading || !isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #090d16 0%, #111827 100%)',
          color: '#94a3b8',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              border: '2px solid #334155',
              borderTopColor: '#38bdf8',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: '12px', fontFamily: 'monospace', color: '#94a3b8', letterSpacing: '0.05em' }}>
            Verifying Godfather Session…
          </span>
        </div>
        <style jsx>{`
          @keyframes spin {
            to {
              transform: rotate(360deg);
            }
          }
        `}</style>
      </div>
    );
  }

  // Get active title based on route
  let activeTitle = 'Overview Dashboard';
  if (pathname === '/godfather/search') activeTitle = 'Global Deep Search';
  else if (pathname.startsWith('/godfather/operations/users')) activeTitle = 'Users & Profiles Governance';
  else if (pathname.startsWith('/godfather/operations/companies')) activeTitle = 'Companies & KYC Verification';
  else if (pathname.startsWith('/godfather/operations/auctions')) activeTitle = 'Auctions & Bids Administration';
  else if (pathname.startsWith('/godfather/operations/rates')) activeTitle = 'Rates & Bulk Import Batches';
  else if (pathname.startsWith('/godfather/operations/jobs')) activeTitle = 'Jobs & Advertisements Moderation';
  else if (pathname.startsWith('/godfather/trust-safety/sensitive-words')) activeTitle = 'Sensitive Words & Moderation Filter';
  else if (pathname.startsWith('/godfather/trust-safety/compliance')) activeTitle = 'Compliance, GSTIN & Sanctions Governance';
  else if (pathname.startsWith('/godfather/trust-safety/moderation')) activeTitle = 'Content Moderation Workspace';
  else if (pathname.startsWith('/godfather/trust-safety/nexus')) activeTitle = 'Nexus & Company Reviews';
  else if (pathname.startsWith('/godfather/trust-safety/blacklist')) activeTitle = 'Blacklist & Member Blocks';
  else if (pathname.startsWith('/godfather/trust-safety/reports')) activeTitle = 'Platform Reports & Appeals';
  else if (pathname.startsWith('/godfather/commerce/plans')) activeTitle = 'Plans & Versioned Pricing';
  else if (pathname.startsWith('/godfather/commerce/payments')) activeTitle = 'Payment Gateways & Transaction Methods';
  else if (pathname.startsWith('/godfather/commerce/invoices')) activeTitle = 'Accounting, GST & Monthly Revenue Records';
  else if (pathname.startsWith('/godfather/commerce/fees')) activeTitle = 'Commercial Fees & Benefit Schedules';
  else if (pathname.startsWith('/godfather/platform/terms')) activeTitle = 'Terms & Safety Agreements Governance';
  else if (pathname.startsWith('/godfather/platform/templates')) activeTitle = 'System Notifications & Message Templates';
  else if (pathname.startsWith('/godfather/platform/email')) activeTitle = 'Zoho Email Service & Delivery Logs';
  else if (pathname.startsWith('/godfather/platform/audit')) activeTitle = 'Immutable Platform Audit Ledger';
  else if (pathname.startsWith('/godfather/platform/access')) activeTitle = 'Access Control & Operator Subroles';
  else if (pathname.startsWith('/godfather/platform/config')) activeTitle = 'Feature Flags & System Configuration';
  else if (pathname.startsWith('/godfather/support/lookup')) activeTitle = '360° Customer Dossier Lookup';
  else if (pathname.startsWith('/godfather/support/cases')) activeTitle = 'Support Case Management & Remediation';

  return (
    <div className="gf-app-layout">
      {/* Mobile Backdrop */}
      {isMobileSidebarOpen && (
        <div
          className="gf-mobile-backdrop"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <div className={`gf-sidebar-container ${isMobileSidebarOpen ? 'mobile-visible' : ''}`}>
        <GodfatherSidebar />
      </div>

      {/* Main Workspace View */}
      <div className="gf-main-container">
        <GodfatherTopBar
          activeTitle={activeTitle}
          onMobileMenuClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />
        <main className="gf-content-viewport">{children}</main>
      </div>

      {/* Step-Up Verification Modal */}
      <StepUpModal />
    </div>
  );
}
