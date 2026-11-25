import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: 'var(--surface-primary, #FFFFFF)',
        borderTop: '1px solid var(--border-subtle, #E5E7EB)',
        padding: '32px 24px 24px',
        color: 'var(--text-secondary, #64748B)',
        fontFamily: 'var(--font-family-primary)',
        fontSize: '12px',
        width: '100%',
      }}
    >
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '24px',
          marginBottom: '24px',
        }}
      >
        {/* Brand Column */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <img src="/ART/LOGOS/logo_primary.png" alt="FR8X" style={{ width: '24px', height: '24px', objectFit: 'contain' }} />
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-primary, #1F2937)', letterSpacing: '0.04em' }}>
              FR8X CONNECT
            </span>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.5 }}>
            Enterprise B2B Freight Logistics &amp; Digital Tender Platform. Connecting global freight forwarders, cargo
            owners, and carriers with operational accuracy.
          </p>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)' }}>
            FR8X Technology Private Limited · Mumbai, India
          </div>
        </div>

        {/* Platform Modules */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Platform Modules
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>
              <Link href="/dashboard" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
                Dashboard Overview
              </Link>
            </li>
            <li>
              <Link href="/network" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
                People &amp; Freight Network
              </Link>
            </li>
            <li>
              <Link href="/auctions" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
                Reverse Freight Auctions
              </Link>
            </li>
            <li>
              <Link href="/rates" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
                Spot Container Rates
              </Link>
            </li>
            <li>
              <Link href="/feeds" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
                Logistics Feeds &amp; Updates
              </Link>
            </li>
            <li>
              <Link href="/jobs" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
                Maritime &amp; Freight Jobs
              </Link>
            </li>
          </ul>
        </div>

        {/* Corporate & Legal */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Legal &amp; Governance
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>
              <Link href="/terms" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
                Terms &amp; Conditions (v4.0)
              </Link>
            </li>
            <li>
              <Link href="/privacy" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
                Privacy &amp; Data Protection
              </Link>
            </li>
            <li>
              <Link href="/sitemap" style={{ color: 'var(--text-primary, #1F2937)', fontWeight: 600, textDecoration: 'none' }}>
                Website Sitemap
              </Link>
            </li>
            <li>
              <Link href="/download" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
                Mobile Access &amp; PWA
              </Link>
            </li>
          </ul>
        </div>

        {/* Security & Verification */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Security &amp; Standards
          </div>
          <p style={{ margin: '0 0 6px', fontSize: '12px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.5 }}>
            Enterprise Zero-Trust data governance, DPDPA 2023 compliance architecture, and verified digital identity.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', backgroundColor: 'var(--surface-elevated, #F8FAFC)', color: 'var(--text-primary, #1F2937)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
            <span>🔒 256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid var(--border-subtle, #E5E7EB)',
          paddingTop: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '11px',
          color: 'var(--text-secondary, #64748B)',
        }}
      >
        <div>
          &copy; {new Date().getFullYear()} FR8X Technology Private Limited. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/terms" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
            Terms
          </Link>
          <Link href="/privacy" style={{ color: 'var(--text-secondary, #64748B)', textDecoration: 'none' }}>
            Privacy
          </Link>
          <Link href="/sitemap" style={{ color: 'var(--text-primary, #1F2937)', fontWeight: 600, textDecoration: 'none' }}>
            Sitemap
          </Link>
        </div>
      </div>
    </footer>
  );
}
