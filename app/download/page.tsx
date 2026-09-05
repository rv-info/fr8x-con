'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, Download, CheckCircle2, ShieldCheck, Zap, MessageSquare, ArrowLeft } from 'lucide-react';

export default function DownloadPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #070d18 0%, #0e1726 100%)',
        color: '#f8fafc',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
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
            color: '#94a3b8',
            fontSize: '13px',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={16} /> Back to FR8X Workspace
        </Link>
      </div>

      {/* Hero Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '640px',
          background: '#0f1c30',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '20px',
          padding: '32px 28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          textAlign: 'center',
        }}
      >
        {/* App Icon */}
        <div
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '20px',
            margin: '0 auto 18px',
            background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(14, 165, 233, 0.4)',
            border: '2px solid rgba(255, 255, 255, 0.2)',
            overflow: 'hidden',
          }}
        >
          <img
            src="/mobile-app-icon.png"
            alt="FR8X Mobile Icon"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              (e.target as HTMLElement).style.display = 'none';
            }}
          />
        </div>

        <h1 style={{ fontSize: '26px', fontWeight: 900, color: '#ffffff', letterSpacing: '0.5px' }}>
          FR8X Mobile Enterprise
        </h1>
        <p style={{ fontSize: '14px', color: '#94a3b8', marginTop: '6px', lineHeight: 1.5 }}>
          Official Native Android Mobile Application for Global Container Freight & Reverse Auctions
        </p>

        {/* Version Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(16, 185, 129, 0.15)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            borderRadius: '50px',
            padding: '5px 16px',
            color: '#34d399',
            fontSize: '12px',
            fontWeight: 700,
            marginTop: '14px',
            marginBottom: '26px',
          }}
        >
          <CheckCircle2 size={14} /> v2.4.0 Standalone • Verified & Signed • 182 KB
        </div>

        {/* Primary Download Button */}
        <div>
          <a
            href="/fr8x-enterprise-mobile-v2.4.apk"
            download="fr8x-enterprise-mobile-v2.4.apk"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              width: '100%',
              maxWidth: '380px',
              height: '54px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              color: '#ffffff',
              fontSize: '16px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 8px 25px rgba(14, 165, 233, 0.45)',
              transition: 'all 0.15s ease',
              cursor: 'pointer',
            }}
          >
            <Download size={20} />
            DOWNLOAD ANDROID APK
          </a>
        </div>

        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '10px' }}>
          Direct download • No Google Play account required • Compatible with Android 5.0+ to 14+
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
              background: '#142136',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: 800, fontSize: '13px' }}>
              <Zap size={16} /> 100% Standalone
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
              Completely self-contained. Runs directly on your device with zero external browser frames.
            </p>
          </div>

          <div
            style={{
              background: '#142136',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f59e0b', fontWeight: 800, fontSize: '13px' }}>
              <Smartphone size={16} /> Reverse Auctions
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
              Real-time countdown clocks and instant bottom-sheet bid placement for container tenders.
            </p>
          </div>

          <div
            style={{
              background: '#142136',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#34d399', fontWeight: 800, fontSize: '13px' }}>
              <MessageSquare size={16} /> B2B Trade Chat
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
              Direct messaging with Maersk, Hapag-Lloyd, Port CFS, and Customs Brokers with quick trade pills.
            </p>
          </div>

          <div
            style={{
              background: '#142136',
              border: '1px solid rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              padding: '14px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ec4899', fontWeight: 800, fontSize: '13px' }}>
              <ShieldCheck size={16} /> Verified KYC
            </div>
            <p style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '4px' }}>
              Instant verification of GSTIN, DGFT IEC codes, MTO licenses, and Federal Maritime Commission bonds.
            </p>
          </div>
        </div>

        {/* 3-Step Installation Guide */}
        <div
          style={{
            marginTop: '28px',
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '14px',
            padding: '18px 20px',
            textAlign: 'left',
          }}
        >
          <h3 style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginBottom: '10px' }}>
            Quick Installation Guide:
          </h3>
          <ol style={{ fontSize: '12.5px', color: '#94a3b8', paddingLeft: '18px', lineHeight: 1.8 }}>
            <li>Tap the <strong>DOWNLOAD ANDROID APK</strong> button above on your Android phone.</li>
            <li>In your phone&apos;s Downloads or Files app, tap <code style={{ color: '#38bdf8' }}>fr8x-enterprise-mobile-v2.4.apk</code>.</li>
            <li>If prompted with <em>&quot;Install unknown apps&quot;</em>, go to <strong>Settings</strong> &gt; enable <strong>&quot;Allow from this source&quot;</strong>, then tap <strong>Install</strong>.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
