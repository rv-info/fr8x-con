import React from 'react';
import Link from 'next/link';

export function Footer() {
  return (
    <footer
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E2E8F0',
        padding: '32px 24px 24px',
        color: '#4A5568',
        fontFamily: 'Calibri, Arial, sans-serif',
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
            <span style={{ fontSize: '12px', fontWeight: 800, color: '#1B2B4B', letterSpacing: '0.04em' }}>
              FR8X CONNECT
            </span>
          </div>
          <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#718096', lineHeight: 1.5 }}>
            Enterprise B2B Freight Logistics &amp; Digital Tender Platform. Connecting global freight forwarders, cargo
            owners, and carriers with operational accuracy.
          </p>
          <div style={{ fontSize: '11px', color: '#718096' }}>
            FR8X Technology Private Limited · Mumbai, India
          </div>
        </div>

        {/* Platform Modules */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B2B4B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Platform Modules
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>
              <Link href="/dashboard" style={{ color: '#4A5568', textDecoration: 'none' }}>
                Dashboard Overview
              </Link>
            </li>
            <li>
              <Link href="/network" style={{ color: '#4A5568', textDecoration: 'none' }}>
                People &amp; Freight Network
              </Link>
            </li>
            <li>
              <Link href="/auctions" style={{ color: '#4A5568', textDecoration: 'none' }}>
                Reverse Freight Auctions
              </Link>
            </li>
            <li>
              <Link href="/rates" style={{ color: '#4A5568', textDecoration: 'none' }}>
                Spot Container Rates
              </Link>
            </li>
            <li>
              <Link href="/feeds" style={{ color: '#4A5568', textDecoration: 'none' }}>
                Logistics Feeds &amp; Updates
              </Link>
            </li>
            <li>
              <Link href="/jobs" style={{ color: '#4A5568', textDecoration: 'none' }}>
                Maritime &amp; Freight Jobs
              </Link>
            </li>
          </ul>
        </div>

        {/* Corporate & Legal */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B2B4B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Legal &amp; Governance
          </div>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <li>
              <Link href="/terms" style={{ color: '#4A5568', textDecoration: 'none' }}>
                Terms &amp; Conditions (v4.0)
              </Link>
            </li>
            <li>
              <Link href="/privacy" style={{ color: '#4A5568', textDecoration: 'none' }}>
                Privacy &amp; Data Protection
              </Link>
            </li>
            <li>
              <Link href="/sitemap" style={{ color: '#1B2B4B', fontWeight: 600, textDecoration: 'none' }}>
                Website Sitemap
              </Link>
            </li>
            <li>
              <Link href="/download" style={{ color: '#4A5568', textDecoration: 'none' }}>
                Mobile Access &amp; PWA
              </Link>
            </li>
          </ul>
        </div>

        {/* Security & Verification */}
        <div>
          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1B2B4B', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Security &amp; Standards
          </div>
          <p style={{ margin: '0 0 6px', fontSize: '12px', color: '#718096', lineHeight: 1.5 }}>
            Enterprise Zero-Trust data governance, DPDPA 2023 compliance architecture, and verified digital identity.
          </p>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', backgroundColor: '#EEF1F7', color: '#1B2B4B', border: '1px solid #CBD5E0', borderRadius: '4px', fontSize: '11px', fontWeight: 700 }}>
            <span>🔒 256-Bit SSL Encrypted</span>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div
        style={{
          maxWidth: '1200px',
          margin: '0 auto',
          borderTop: '1px solid #EDF2F7',
          paddingTop: '16px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          fontSize: '11px',
          color: '#718096',
        }}
      >
        <div>
          &copy; {new Date().getFullYear()} FR8X Technology Private Limited. All rights reserved.
        </div>
        <div style={{ display: 'flex', gap: '16px' }}>
          <Link href="/terms" style={{ color: '#718096', textDecoration: 'none' }}>
            Terms
          </Link>
          <Link href="/privacy" style={{ color: '#718096', textDecoration: 'none' }}>
            Privacy
          </Link>
          <Link href="/sitemap" style={{ color: '#1B2B4B', fontWeight: 600, textDecoration: 'none' }}>
            Sitemap
          </Link>
        </div>
      </div>
    </footer>
  );
}
