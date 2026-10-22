'use client';

import React from 'react';
import Link from 'next/link';
import { Smartphone, CheckCircle2, ShieldCheck, Zap, MessageSquare, ArrowLeft, Globe, Mail } from 'lucide-react';

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
          padding: '36px 28px',
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
          Enterprise Mobile Suite for Global Container Freight &amp; Reverse Auctions
        </p>

        {/* Enterprise Status Badge */}
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(2, 132, 199, 0.08)',
            border: '1px solid rgba(2, 132, 199, 0.25)',
            borderRadius: '50px',
            padding: '6px 18px',
            color: '#0284c7',
            fontSize: '12px',
            fontWeight: 700,
            marginTop: '14px',
            marginBottom: '26px',
          }}
        >
          <CheckCircle2 size={14} /> Enterprise Managed Distribution • Verified Supply Chain
        </div>

        {/* Action Buttons: Launch Web Console or Request Access */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
          <Link
            href="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              maxWidth: '380px',
              height: '50px',
              borderRadius: '12px',
              background: '#002b66',
              color: '#ffffff',
              fontSize: '14.5px',
              fontWeight: 800,
              textDecoration: 'none',
              boxShadow: '0 6px 20px rgba(0, 43, 102, 0.22)',
              transition: 'all 0.15s ease',
            }}
          >
            <Globe size={18} />
            LAUNCH WEB CONSOLE (PWA)
          </Link>

          <a
            href="mailto:support@fr8x.in?subject=FR8X%20Mobile%20Enterprise%20Access%20Request"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              maxWidth: '380px',
              height: '46px',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px solid #cbd5e1',
              color: '#0f172a',
              fontSize: '13.5px',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            <Mail size={16} />
            REQUEST ENTERPRISE MOBILE ACCESS
          </a>
        </div>

        <p style={{ fontSize: '11px', color: '#64748b', marginTop: '12px' }}>
          Instant PWA mobile responsive access on iOS, Android, and Desktop • No local APK downloads required
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
              <Zap size={16} /> 100% Cloud-Synchronized
            </div>
            <p style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
              Runs with real-time Supabase edge sync, zero storage footprint on your device.
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
              Direct messaging with Maersk, Hapag-Lloyd, Port CFS, and Customs Brokers with trade pills.
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

        {/* Enterprise Notice */}
        <div
          style={{
            marginTop: '28px',
            background: '#f8fafc',
            border: '0.5px solid #e2e8f0',
            borderRadius: '14px',
            padding: '18px 20px',
            textAlign: 'left',
          }}
        >
          <h3 style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a', marginBottom: '6px' }}>
            Enterprise Security &amp; Managed Distribution
          </h3>
          <p style={{ fontSize: '11.5px', color: '#475569', lineHeight: 1.6 }}>
            In accordance with FR8X Bank-Grade Security Architecture, native Android client packages are provisioned exclusively to verified corporate accounts via managed enterprise MDM channels. Public server origin downloads are disabled to protect network integrity.
          </p>
        </div>
      </div>
    </div>
  );
}
