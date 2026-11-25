import React from 'react';
import Link from 'next/link';
import { Footer } from '@/components/layout/Footer';

export const metadata = {
  title: 'FR8X Application Sitemap | Corporate Directory',
  description: 'Complete public directory and navigation sitemap for FR8X B2B Freight Logistics platform.',
};

interface SitemapSection {
  title: string;
  description: string;
  links: { href: string; label: string; desc: string }[];
}

const SECTIONS: SitemapSection[] = [
  {
    title: 'Core Freight Modules',
    description: 'Central operational hubs for container freight discovery, pricing and bilateral tenders.',
    links: [
      { href: '/dashboard', label: 'Executive Dashboard', desc: 'KPI overview, market indicators, active auctions and transaction summary' },
      { href: '/network', label: 'People & Freight Network', desc: 'Verified member directory, connections manager, and forwarding partners' },
      { href: '/auctions', label: 'Reverse Auctions Hub', desc: 'Spot container tenders, reverse bidding rooms and verified awards' },
      { href: '/rates', label: 'Freight Rate Management', desc: 'Port-to-port ocean tariffs, inland drayage rates and benchmark schedules' },
      { href: '/nexus', label: 'Nexus Trade Hub', desc: 'Verified bilateral messaging, trade inquiries and cargo coordination' },
      { href: '/feeds', label: 'Industry Feeds', desc: 'Maritime updates, market advisories and logistics broadcasts' },
      { href: '/jobs', label: 'Logistics Careers Board', desc: 'Maritime forwarding jobs, freight executive postings and talent sourcing' },
    ],
  },
  {
    title: 'Authentication & Account Access',
    description: 'Secure registration, session authentication and corporate onboarding.',
    links: [
      { href: '/login', label: 'Enterprise Sign In', desc: 'Access authorized freight accounts with multi-tenant credential protection' },
      { href: '/register', label: 'Corporate Registration', desc: 'Onboard forwarding companies with GSTIN and statutory validation' },
      { href: '/reset-password', label: 'Password Recovery', desc: 'Cryptographically protected password reset and account verification' },
      { href: '/download', label: 'Mobile App & PWA', desc: 'Progressive Web App installation and cross-device freight access' },
    ],
  },
  {
    title: 'Legal, Compliance & Data Governance',
    description: 'Statutory compliance, privacy policies and contractual binding terms.',
    links: [
      { href: '/terms', label: 'Master Terms & Conditions', desc: 'Commercial agreement, reverse auction rules, and platform responsibilities (v4.0)' },
      { href: '/privacy', label: 'Comprehensive Privacy Policy', desc: 'DPDPA 2023 compliance, data retention, PII protection and user rights' },
      { href: '/sitemap', label: 'Application Sitemap', desc: 'Complete navigational hierarchy and indexed public destinations' },
    ],
  },
];

export default function SitemapPage() {
  return (
    <div
      style={{
        backgroundColor: 'var(--app-bg, #FFFFFF)',
        minHeight: '100vh',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        color: 'var(--text-primary, #1F2937)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
    >
      {/* Top Header */}
      <header
        style={{
          backgroundColor: 'var(--surface-primary, #FFFFFF)',
          borderBottom: '1px solid var(--border-subtle, #E5E7EB)',
          padding: '16px 24px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <img src="/ART/LOGOS/logo_primary.png" alt="FR8X" style={{ width: '28px', height: '28px', objectFit: 'contain' }} />
            <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-primary, #1F2937)', letterSpacing: '0.04em' }}>
              FR8X
            </span>
          </Link>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <Link
              href="/dashboard"
              style={{
                padding: '6px 14px',
                backgroundColor: 'var(--accent-primary, #006B68)',
                border: '1px solid var(--accent-primary, #006B68)',
                color: '#FFFFFF',
                borderRadius: '6px',
                textDecoration: 'none',
                fontWeight: 600,
                fontSize: '12px',
              }}
            >
              Enter Dashboard
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 24px 60px', width: '100%' }}>
        <div style={{ marginBottom: '32px' }}>
          <span
            style={{
              padding: '3px 8px',
              backgroundColor: 'var(--surface-secondary, #F8FAFC)',
              color: 'var(--text-primary, #1F2937)',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: 700,
              border: '1px solid var(--border-default, #D9DEE5)',
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            SYSTEM INDEX
          </span>
          <h1 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--text-primary, #1F2937)' }}>
            FR8X Platform Sitemap &amp; Public Destination Index
          </h1>
          <p style={{ margin: 0, color: 'var(--text-secondary, #64748B)', fontSize: '12px', maxWidth: '720px', lineHeight: 1.5 }}>
            This sitemap lists publicly indexable destinations, core logistics modules, and compliance resources across the
            FR8X enterprise freight ecosystem. Private workspaces, administrative modules, and tenant-restricted endpoints
            are strictly segregated from this public directory.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {SECTIONS.map((sec) => (
            <div
              key={sec.title}
              style={{
                backgroundColor: 'var(--surface-primary, #FFFFFF)',
                border: '1px solid var(--border-subtle, #E5E7EB)',
                borderRadius: '8px',
                padding: '24px',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)', paddingBottom: '12px', marginBottom: '16px' }}>
                <h2 style={{ margin: '0 0 4px', fontSize: '14px', fontWeight: 700, color: 'var(--text-primary, #1F2937)' }}>
                  {sec.title}
                </h2>
                <p style={{ margin: 0, color: 'var(--text-secondary, #64748B)', fontSize: '12px' }}>{sec.description}</p>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '16px',
                }}
              >
                {sec.links.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    style={{
                      display: 'block',
                      padding: '12px 14px',
                      backgroundColor: 'var(--surface-secondary, #F8FAFC)',
                      border: '1px solid var(--border-subtle, #E5E7EB)',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                  >
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', marginBottom: '4px' }}>
                      {link.label}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.4 }}>
                      {link.desc}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--accent-primary, #006B68)', fontWeight: 600, marginTop: '6px' }}>
                      {link.href} &rarr;
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
