'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Ship,
  Anchor,
  Clock,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Share2,
  ArrowRight,
  ExternalLink,
  MessageSquare,
  Building2,
  MapPin,
  Check,
  Info,
  DollarSign,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useData } from '@/lib/context/DataContext';

export default function SmartRatePublicPage() {
  const params = useParams();
  const rateId = String(params.id || 'RT-0001');

  const { rates, myRates } = useData();
  const allRates = [...rates, ...myRates];

  const matchedRate = allRates.find((r) => r.id.toLowerCase() === rateId.toLowerCase()) || {
    id: rateId.toUpperCase(),
    sp: 'Atlas Logistics Pvt. Ltd.',
    carrier: 'Maersk Line',
    por: 'Nhava Sheva (INNSA)',
    pol: 'Nhava Sheva (INNSA)',
    pod: 'Rotterdam (NLRTM)',
    fpod: 'Rotterdam (NLRTM)',
    d20: 1450,
    d20Type: '20DV Dry Standard',
    h40: 2280,
    h40Type: '40HC High Cube',
    ft: '14 Days Combined at Dest.',
    tt: '26 Days Port to Port',
    valid: '2026-09-30',
    route: 'Direct Suez Express',
    rateType: 'Fixed Spot Contract',
    remark: 'Space allocation confirmed. Tier-1 liner guaranteed loading.',
    isSelfPosted: true,
  };

  const [copied, setCopied] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingShipperName, setBookingShipperName] = useState('');
  const [bookingShipperEmail, setBookingShipperEmail] = useState('');
  const [bookingShipperPhone, setBookingShipperPhone] = useState('');
  const [bookingContainerCount, setBookingContainerCount] = useState('2x 40HC');
  const [bookingSubmitted, setBookingSubmitted] = useState(false);

  // Expiry calculation
  const validDateObj = new Date(matchedRate.valid || '2026-09-30');
  const daysRemaining = Math.max(0, Math.ceil((validDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isExpired = daysRemaining <= 0;

  const currentUrl = typeof window !== 'undefined' ? window.location.href : `https://con.fr8x.in/r/${matchedRate.id}`;

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSubmitBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingShipperName || !bookingShipperEmail) return;
    setBookingSubmitted(true);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #070d18 0%, #0b1526 100%)',
        color: '#f8fafc',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        padding: '30px 16px 60px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {/* Top Bar / Branding */}
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
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
          <span style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '0.4px' }}>
            FR8X <span style={{ color: '#38bdf8' }}>SMART i-RATE</span>
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={handleCopyLink}
            style={{
              background: copied ? '#10b981' : 'rgba(56, 189, 248, 0.12)',
              border: '1px solid ' + (copied ? '#10b981' : 'rgba(56, 189, 248, 0.25)'),
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {copied ? <CheckCircle2 size={13} /> : <Share2 size={13} />}
            {copied ? 'Link Copied!' : 'Share Rate'}
          </button>

          <Link
            href="/login"
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              color: '#f8fafc',
              fontSize: '12px',
              fontWeight: 600,
              textDecoration: 'none',
              padding: '6px 14px',
              borderRadius: '6px',
            }}
          >
            Sign In
          </Link>
        </div>
      </div>

      {/* Main Rate Capsule Card */}
      <div
        style={{
          width: '100%',
          maxWidth: '820px',
          background: '#0f1c30',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.6)',
        }}
      >
        {/* Card Header Strip with Live Status & Validity */}
        <div
          style={{
            background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.25) 0%, rgba(14, 165, 233, 0.1) 100%)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.2)',
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '12px',
                fontWeight: 800,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.15)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                padding: '3px 8px',
                borderRadius: '4px',
              }}
            >
              {matchedRate.id}
            </span>
            <span style={{ fontSize: '12px', color: '#94a3b8' }}>
              Carrier Contract: <b style={{ color: '#f8fafc' }}>{matchedRate.carrier}</b>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                background: isExpired ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                border: '1px solid ' + (isExpired ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.4)'),
                color: isExpired ? '#f87171' : '#34d399',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <Clock size={11} /> {isExpired ? 'Expired' : `Valid till ${matchedRate.valid} (${daysRemaining}d left)`}
            </span>
            <span
              style={{
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
              }}
            >
              {matchedRate.rateType || 'Fixed Spot Contract'}
            </span>
          </div>
        </div>

        {/* Corridor Route Visualizer */}
        <div style={{ padding: '24px 24px 16px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            {/* Origin Port */}
            <div style={{ minWidth: '180px' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                Port of Loading (POL)
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '2px 0 0', color: '#f8fafc' }}>
                {matchedRate.pol}
              </h2>
              <small style={{ color: '#64748b', fontSize: '11.5px' }}>Receipt: {matchedRate.por || matchedRate.pol}</small>
            </div>

            {/* Route Arrow with Transit Time */}
            <div style={{ textAlign: 'center', flex: 1, minWidth: '160px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#38bdf8', marginBottom: '2px' }}>
                {matchedRate.tt || '26 Days Port to Port'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                <div style={{ height: '2px', background: 'linear-gradient(90deg, #0284c7, #38bdf8)', flex: 1 }}></div>
                <Ship size={18} color="#38bdf8" />
                <div style={{ height: '2px', background: 'linear-gradient(90deg, #38bdf8, #0284c7)', flex: 1 }}></div>
              </div>
              <small style={{ color: '#94a3b8', fontSize: '11px' }}>{matchedRate.route || 'Direct Ocean Corridor'}</small>
            </div>

            {/* Destination Port */}
            <div style={{ minWidth: '180px', textAlign: 'right' }}>
              <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.4px', fontWeight: 600 }}>
                Port of Discharge (POD)
              </span>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '2px 0 0', color: '#f8fafc' }}>
                {matchedRate.pod}
              </h2>
              <small style={{ color: '#64748b', fontSize: '11.5px' }}>Delivery: {matchedRate.fpod || matchedRate.pod}</small>
            </div>
          </div>
        </div>

        {/* Ocean Freight Charges Grid */}
        <div style={{ padding: '24px' }}>
          <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 700, display: 'block', marginBottom: '12px' }}>
            Ocean Container Rates (All-In Base Freight)
          </span>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '14px',
            }}
          >
            {/* 20DV Card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1.5px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '12px',
                padding: '18px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>20&apos; Standard Dry (20DV)</span>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#f8fafc', marginTop: '4px' }}>
                    ${matchedRate.d20.toLocaleString()} <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>USD</span>
                  </div>
                </div>
                <span
                  style={{
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                  }}
                >
                  PER CONTAINER
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '11.5px', margin: '10px 0 0' }}>
                Max Payload: 28,000 KG · Heavy Duty Dry Cargo
              </p>
            </div>

            {/* 40HC Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.15) 0%, rgba(14, 165, 233, 0.05) 100%)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '12px',
                padding: '18px',
                position: 'relative',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#38bdf8', fontWeight: 700 }}>40&apos; High Cube (40HC)</span>
                  <div style={{ fontSize: '28px', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>
                    ${matchedRate.h40.toLocaleString()} <span style={{ fontSize: '13px', color: '#94a3b8', fontWeight: 600 }}>USD</span>
                  </div>
                </div>
                <span
                  style={{
                    background: '#0284c7',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '3px 8px',
                    borderRadius: '4px',
                  }}
                >
                  BEST VALUE
                </span>
              </div>
              <p style={{ color: '#94a3b8', fontSize: '11.5px', margin: '10px 0 0' }}>
                Volume: 76.4 CBM · High Volume General Cargo
              </p>
            </div>
          </div>

          {/* Surcharges, Free Time & Conditions */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '12px',
              marginTop: '16px',
            }}
          >
            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '12px' }}>
              <small style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px', fontWeight: 700 }}>Free Time Allowance</small>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '2px 0 0', color: '#f8fafc' }}>
                {matchedRate.ft || '14 Days Combined Free Time'}
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '12px' }}>
              <small style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px', fontWeight: 700 }}>Liner Inclusions</small>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '2px 0 0', color: '#f8fafc' }}>
                BAS + BAF + LSS + ISPS
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.06)', borderRadius: '8px', padding: '12px' }}>
              <small style={{ color: '#94a3b8', textTransform: 'uppercase', fontSize: '10px', fontWeight: 700 }}>Service Provider Desk</small>
              <p style={{ fontSize: '13px', fontWeight: 700, margin: '2px 0 0', color: '#f8fafc' }}>
                {matchedRate.sp}
              </p>
            </div>
          </div>

          {/* Operational Notes */}
          <div style={{ marginTop: '16px', background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.15)', borderRadius: '8px', padding: '12px 14px', fontSize: '12px' }}>
            <span style={{ fontWeight: 700, color: '#38bdf8' }}>Operational Remarks: </span>
            <span style={{ color: '#cbd5e1' }}>{matchedRate.remark || 'Subject to standard vessel space allocation and cargo acceptance.'}</span>
          </div>

          {/* Booking / Reserve Action Bar */}
          <div
            style={{
              marginTop: '24px',
              paddingTop: '20px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px' }}>
              <ShieldCheck size={16} color="#10b981" />
              Verified &amp; Sealed by FR8X Maritime Network
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleCopyLink}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  color: '#f8fafc',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Copy size={13} /> {copied ? 'Copied' : 'Copy Quote Link'}
              </button>

              <button
                type="button"
                onClick={() => setShowBookingModal(true)}
                disabled={isExpired}
                style={{
                  background: isExpired ? '#475569' : 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '10px 22px',
                  borderRadius: '8px',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: isExpired ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: isExpired ? 'none' : '0 4px 14px rgba(14, 165, 233, 0.35)',
                }}
              >
                <Sparkles size={14} /> Lock Rate &amp; Request Booking <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              background: '#0f1c30',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              borderRadius: '16px',
              padding: '28px',
              width: '100%',
              maxWidth: '520px',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.7)',
            }}
          >
            {bookingSubmitted ? (
              <div style={{ textAlign: 'center', padding: '16px 0' }}>
                <CheckCircle2 size={48} color="#10b981" style={{ margin: '0 auto 14px' }} />
                <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: '#f8fafc' }}>
                  Rate Lock Request Received!
                </h3>
                <p style={{ color: '#94a3b8', fontSize: '13px', lineHeight: 1.6, margin: '0 0 20px' }}>
                  Your cargo booking request under <b>{matchedRate.id}</b> has been transmitted directly to{' '}
                  <b>{matchedRate.sp}</b>. The commercial desk will respond to <b>{bookingShipperEmail}</b> with
                  vessel booking confirmation and container gate-in instructions.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowBookingModal(false);
                    setBookingSubmitted(false);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                    color: '#ffffff',
                    border: 'none',
                    padding: '10px 24px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitBooking} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#f8fafc' }}>
                    Lock Rate &amp; Reserve Container Space
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '18px', cursor: 'pointer' }}
                  >
                    ✕
                  </button>
                </div>

                <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.2)', padding: '10px 12px', borderRadius: '8px', fontSize: '12px', color: '#cbd5e1' }}>
                  Rate Reference: <b>{matchedRate.id}</b> · <b>{matchedRate.carrier}</b> ({matchedRate.pol} → {matchedRate.pod})
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Company / Shipper Name <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="e.g. Apex Global Trading Ltd."
                    value={bookingShipperName}
                    onChange={(e) => setBookingShipperName(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    Corporate Email Address <span style={{ color: '#f87171' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      borderRadius: '6px',
                      color: '#f8fafc',
                      fontSize: '13px',
                      boxSizing: 'border-box',
                    }}
                    placeholder="commercial@apex.com"
                    value={bookingShipperEmail}
                    onChange={(e) => setBookingShipperEmail(e.target.value)}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Contact Phone / WhatsApp
                    </label>
                    <input
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="+91 98200 12345"
                      value={bookingShipperPhone}
                      onChange={(e) => setBookingShipperPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      Required Equipment / Qty
                    </label>
                    <input
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        borderRadius: '6px',
                        color: '#f8fafc',
                        fontSize: '13px',
                        boxSizing: 'border-box',
                      }}
                      placeholder="e.g. 2x 40HC"
                      value={bookingContainerCount}
                      onChange={(e) => setBookingContainerCount(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setShowBookingModal(false)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.08)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#f8fafc',
                      padding: '8px 16px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                      color: '#ffffff',
                      border: 'none',
                      padding: '8px 20px',
                      borderRadius: '6px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Confirm Booking Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
