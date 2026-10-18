'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, Download, CheckCircle2, ShieldCheck, Zap, MessageSquare, ArrowLeft } from 'lucide-react';

export default function DownloadPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '36px 20px 60px',
      }}
    >
      {/* Top Nav Back */}
      <div style={{ width: '100%', maxWidth: '640px', marginBottom: '24px' }}>
        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            color: '#475569',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Back to <span style={{ fontWeight: 'bold', color: '#002b66', textTransform: 'uppercase' }}>FR8X</span> Workspace
        </Link>
      </div>

      {/* Hero Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.06)',
          textAlign: 'center',
        }}
      >
        {/* Official FR8X Infinity App Icon */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', marginBottom: '16px' }}>
          <img
            src="/mobile-app-icon.png"
            alt="FR8X Infinity App Icon"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '14px',
              objectFit: 'cover',
              display: 'block',
              margin: '0 auto',
              boxShadow: '0 4px 14px rgba(0, 43, 102, 0.15)',
            }}
          />
          <div style={{ fontSize: '20px', fontWeight: 'bold', color: '#002b66', letterSpacing: '0.04em', textTransform: 'uppercase', lineHeight: 1 }}>
            FR8X
          </div>
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 900, color: '#0f172a', letterSpacing: '0.5px' }}>
          <span style={{ fontWeight: 'bold', color: '#002b66', textTransform: 'uppercase' }}>FR8X</span> Mobile Enterprise
        </h1>
        <p style={{ fontSize: '13.5px', color: '#64748b', marginTop: '6px', lineHeight: 1.5 }}>
          Official Native Android Mobile Application for Global Container Freight &amp; Reverse Auctions
        </p>

        {/* Version Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '50px',
            padding: '5px 16px',
            color: '#059669',
            fontSize: '12px',
            fontWeight: 700,
            marginTop: '14px',
            marginBottom: '26px',
          }}
        >
          <CheckCircle2 size={14} /> v2.4.0 Universal • Verified &amp; Signed • 14.0 MB
        </div>

        {/* Primary Download Button */}
        <div>
          <a
            href="/FR8X-Android-Universal-Release.apk"
            download="FR8X-Android-Universal-Release.apk"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              maxWidth: '380px',
              height: '52px',
              borderRadius: '12px',
              background: '#002b66',
              color: '#ffffff',
              fontSize: '15px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(0, 43, 102, 0.25)',
              transition: 'all 0.15s ease',
              cursor: 'pointer',
            }}
          >
            <Download size={20} />
            DOWNLOAD UNIVERSAL APK
          </a>
        </div>

        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
          Direct download • No Google Play account required • Compatible with Android 5.0+ to 14+ / 15
        </p>


        {/* Feature Highlights Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginTop: '28px',
            textAlign: 'left',
          }}
        >
          <div
            style={{
              background: '#ffffff',
              border: '0.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#002b66', fontWeight: 800, fontSize: '13px' }}>
              <Zap size={16} /> 100% Standalone
            </div>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Completely self-contained. Runs directly on your device with zero external browser frames.
            </p>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '0.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', fontWeight: 800, fontSize: '13px' }}>
              <Smartphone size={16} /> Reverse Auctions
            </div>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Real-time countdown clocks and instant bottom-sheet bid placement for container tenders.
            </p>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '0.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#059669', fontWeight: 800, fontSize: '13px' }}>
              <MessageSquare size={16} /> B2B Trade Chat
            </div>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Direct messaging with Maersk, Hapag-Lloyd, Port CFS, and Customs Brokers with quick trade pills.
            </p>
          </div>

          <div
            style={{
              background: '#ffffff',
              border: '0.5px solid #cbd5e1',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#db2777', fontWeight: 800, fontSize: '13px' }}>
              <ShieldCheck size={16} /> Verified KYC
            </div>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Instant verification of GSTIN, DGFT IEC codes, MTO licenses, and Federal Maritime Commission bonds.
            </p>
          </div>
        </div>

        {/* 3-Step Installation Guide */}
        <div
          style={{
            marginTop: '28px',
            background: '#ffffff',
            border: '0.5px solid #cbd5e1',
            borderRadius: '14px',
            padding: '18px 20px',
            textAlign: 'left',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', marginBottom: '10px' }}>
            Quick Installation Guide:
          </h3>
          <ol style={{ fontSize: '12.5px', color: '#475569', paddingLeft: '18px', lineHeight: 1.8 }}>
            <li>Tap the <strong>DOWNLOAD UNIVERSAL APK</strong> button above on your Android phone.</li>
            <li>In your phone&apos;s Downloads or Files app, tap <code style={{ color: '#002b66', fontWeight: 'bold' }}>FR8X-Android-Universal-Release.apk</code>.</li>
            <li>If prompted with <em>&quot;Install unknown apps&quot;</em>, go to <strong>Settings</strong> &gt; enable <strong>&quot;Allow from this source&quot;</strong>, then tap <strong>Install</strong>.</li>

          </ol>
        </div>
      </div>
    </div>
  );
}
