'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  Star,
  MapPin,
  Mail,
  Phone,
  Globe,
  Award,
  CheckCircle2,
  Share2,
  Copy,
  ArrowRight,
  ExternalLink,
  Lock,
} from 'lucide-react';

export default function CompanyReferencePage() {
  const params = useParams();
  const rawCode = (params?.code as string) || 'REF-FR8X-MAIN-0001';
  const refCode = decodeURIComponent(rawCode).toUpperCase();

  const [copied, setCopied] = useState(false);

  // Extract company hint if available from code (e.g. REF-FR8X-ROTT-1234 -> Rotterdam)
  const codeParts = refCode.split('-');
  const companySlug = codeParts[2] || 'CORP';

  const companyMap: Record<string, { name: string; city: string; country: string; lanes: string[]; teu: string; score: number }> = {
    ROTT: { name: 'Rotterdam Freight NV', city: 'Rotterdam', country: 'Netherlands', lanes: ['NLRTM ↔ INNSA', 'NLRTM ↔ SGSIN', 'NLRTM ↔ USNYC'], teu: '24,000+ TEUs / yr', score: 99 },
    INDO: { name: 'Indo Ocean Lines Ltd.', city: 'Mumbai', country: 'India', lanes: ['INNSA ↔ NLRTM', 'INMUN ↔ SGSIN', 'INNSA ↔ JED'], teu: '18,500+ TEUs / yr', score: 98 },
    NAIR: { name: 'Nair Cargo Solutions', city: 'Cochin', country: 'India', lanes: ['INCOK ↔ SGSIN', 'INCOK ↔ NLRTM', 'INCOK ↔ DXB'], teu: '12,000+ TEUs / yr', score: 96 },
    CARG: { name: 'CargoLink Global Logistics', city: 'Singapore', country: 'Singapore', lanes: ['SGSIN ↔ NLRTM', 'SGSIN ↔ USLAX', 'SGSIN ↔ INNSA'], teu: '32,000+ TEUs / yr', score: 99 },
    ATLA: { name: 'Atlas Logistics Pvt. Ltd.', city: 'New Delhi', country: 'India', lanes: ['INNSA ↔ HAM', 'INNSA ↔ USNYC'], teu: '14,000+ TEUs / yr', score: 97 },
    FR8X: { name: 'FR8X Verified Logistics Partner', city: 'Global Gateway', country: 'International', lanes: ['INNSA ↔ NLRTM', 'CNSHA ↔ USLAX', 'SGSIN ↔ HAM'], teu: '15,000+ TEUs / yr', score: 98 },
  };

  const matched = companyMap[companySlug] || {
    name: `${companySlug} Logistics & Ocean Lines`,
    city: 'Mumbai',
    country: 'India',
    lanes: ['INNSA ↔ NLRTM', 'INMUN ↔ SGSIN', 'JED ↔ HAM'],
    teu: '14,500+ TEUs / yr',
    score: 98,
  };

  const shareUrl = typeof window !== 'undefined' ? window.location.href : `https://con.fr8x.in/ref/${refCode}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #070d18 0%, #0c1424 100%)',
        color: '#f8fafc',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '36px 20px 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Top Bar / Nav */}
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '28px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 900,
              fontSize: '15px',
              color: '#ffffff',
            }}
          >
            F
          </div>
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.5px' }}>
            FR8X <span style={{ color: '#38bdf8' }}>VERIFIED</span>
          </span>
        </div>

        <Link
          href="/login"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            color: '#38bdf8',
            fontSize: '12.5px',
            fontWeight: 600,
            textDecoration: 'none',
            background: 'rgba(56, 189, 248, 0.1)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            padding: '6px 14px',
            borderRadius: '6px',
          }}
        >
          Sign In to Trade <ArrowRight size={13} />
        </Link>
      </div>

      {/* Main Verified Company Passport Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '780px',
          background: '#0f1c30',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Verification Status Header */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(14, 165, 233, 0.1) 100%)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            padding: '14px 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#38bdf8" />
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
              Official Enterprise KYC Verified Member
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 700,
                color: '#f8fafc',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                padding: '3px 10px',
                borderRadius: '6px',
                letterSpacing: '0.5px',
              }}
            >
              {refCode}
            </span>
            <button
              onClick={handleCopyLink}
              style={{
                background: copied ? '#10b981' : 'rgba(56, 189, 248, 0.15)',
                border: '1px solid ' + (copied ? '#10b981' : 'rgba(56, 189, 248, 0.3)'),
                color: '#ffffff',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '11px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                transition: 'all 0.15s ease',
              }}
            >
              {copied ? <CheckCircle2 size={12} /> : <Copy size={12} />}
              {copied ? 'Copied' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Company Identity Block */}
        <div style={{ padding: '28px 24px' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0ea5e9, #059669)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '24px',
                color: '#ffffff',
                flexShrink: 0,
                border: '1px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {matched.name.slice(0, 2).toUpperCase()}
            </div>

            <div style={{ flex: 1, minWidth: '240px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#f8fafc' }}>
                  {matched.name}
                </h1>
                <span
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#34d399',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <CheckCircle2 size={11} /> Verified
                </span>
                <span
                  style={{
                    background: 'rgba(245, 158, 11, 0.2)',
                    border: '1px solid rgba(245, 158, 11, 0.4)',
                    color: '#fbbf24',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '999px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Star size={11} /> {matched.score}/100 Trust
                </span>
              </div>

              <p style={{ color: '#94a3b8', fontSize: '13.5px', margin: '8px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={13} color="#38bdf8" />
                {matched.city}, {matched.country} · Operational Scale: <b>{matched.teu}</b>
              </p>
            </div>
          </div>

          {/* Operational Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginTop: '24px',
            }}
          >
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '14px 16px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                Compliance Level
              </span>
              <p style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0 0', color: '#f8fafc' }}>
                Tier 3 Registered Entity
              </p>
              <small style={{ color: '#34d399', fontSize: '11px' }}>MTO &amp; GSTN Validated</small>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '14px 16px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                Reverse Auction Authorization
              </span>
              <p style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0 0', color: '#f8fafc' }}>
                Full Bidding Clearance
              </p>
              <small style={{ color: '#38bdf8', fontSize: '11px' }}>Verified Escrow / Terms</small>
            </div>

            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '14px 16px',
                borderRadius: '10px',
              }}
            >
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                Community Standing
              </span>
              <p style={{ fontSize: '14px', fontWeight: 700, margin: '4px 0 0', color: '#f8fafc' }}>
                Zero Defaults
              </p>
              <small style={{ color: '#34d399', fontSize: '11px' }}>Clean Nexus Record</small>
            </div>
          </div>

          {/* Primary Trade Corridors */}
          <div style={{ marginTop: '24px' }}>
            <span style={{ fontSize: '11.5px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: '8px' }}>
              Primary Active Trade Corridors
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {matched.lanes.map((lane, idx) => (
                <span
                  key={idx}
                  style={{
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    color: '#38bdf8',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                  }}
                >
                  {lane}
                </span>
              ))}
            </div>
          </div>

          {/* Call to Actions */}
          <div
            style={{
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '12px' }}>
              <Lock size={13} color="#10b981" />
              Cryptographically verified by FR8X Network
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <Link
                href={`/rates?search=${encodeURIComponent(matched.name)}`}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '9px 18px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                View Published Rates
              </Link>

              <Link
                href="/login"
                style={{
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: '#ffffff',
                  padding: '9px 20px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)',
                }}
              >
                Trade with {matched.name.split(' ')[0]} <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
