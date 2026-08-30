'use client';

import React, { useState, ReactNode } from 'react';
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
  const { isAuthenticated } = useGodfatherAuth();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const isLoginPage = pathname === '/godfather/login';

  // If visiting login page, render standalone high-security login shell
  if (isLoginPage) {
    return <div className="gf-login-root">{children}</div>;
  }

  // Get active title based on route
  let activeTitle = 'Overview Dashboard';
  if (pathname === '/godfather/search') activeTitle = 'Global Deep Search';
  else if (pathname.startsWith('/godfather/operations/users')) activeTitle = 'Users & Profiles Governance';
  else if (pathname.startsWith('/godfather/operations/companies')) activeTitle = 'Companies & KYC Verification';
  else if (pathname.startsWith('/godfather/operations/auctions')) activeTitle = 'Auctions & Bids Administration';
  else if (pathname.startsWith('/godfather/operations/rates')) activeTitle = 'Rates & Bulk Import Batches';
  else if (pathname.startsWith('/godfather/operations/jobs')) activeTitle = 'Jobs & Advertisements Moderation';
  else if (pathname.startsWith('/godfather/trust-safety/moderation')) activeTitle = 'Content Moderation Workspace';
  else if (pathname.startsWith('/godfather/trust-safety/nexus')) activeTitle = 'Nexus & Company Reviews';
  else if (pathname.startsWith('/godfather/trust-safety/blacklist')) activeTitle = 'Blacklist & Member Blocks';
  else if (pathname.startsWith('/godfather/trust-safety/reports')) activeTitle = 'Platform Reports & Appeals';
  else if (pathname.startsWith('/godfather/commerce/plans')) activeTitle = 'Plans & Versioned Pricing';
  else if (pathname.startsWith('/godfather/commerce/payments')) activeTitle = 'Payment Gateways & Configurations';
  else if (pathname.startsWith('/godfather/commerce/invoices')) activeTitle = 'Invoices, GST & Tax Breakdown';
  else if (pathname.startsWith('/godfather/commerce/fees')) activeTitle = 'Fees, Discounts & Commercial Credits';
  else if (pathname.startsWith('/godfather/platform/templates')) activeTitle = 'System Notifications & Message Templates';
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
