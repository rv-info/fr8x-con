'use client';

import React from 'react';
import { Modal } from './Modal';
import { LocalTimeBadge } from './LocalTimeBadge';
import { GoldenTick } from './GoldenTick';
import { useChat } from '@/lib/context/ChatContext';
import {
  MessageSquare,
  MapPin,
  Building2,
  Briefcase,
  Mail,
  ShieldCheck,
  Award,
  TrendingUp,
  CheckCircle2,
  FileText,
  Star,
  Globe2,
} from 'lucide-react';

export interface ProfilePreviewData {
  name: string;
  role?: string;
  company?: string;
  location?: string;
  email?: string;
  phone?: string;
  timezone?: string;
  hasGoldenTick?: boolean;
  isVerified?: boolean;
  bio?: string;
  specializations?: string[];
  contactAvailability?: string;
  trustScore?: number;
  kycTier?: string;
  certifications?: string[];
  keyTradeLanes?: string[];
  teuVolumeYear?: string;
}

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: ProfilePreviewData | null;
  personName?: string;
}

export function ProfilePreviewModal({
  isOpen,
  onClose,
  profile,
  personName,
}: ProfilePreviewModalProps) {
  const { openChatWith } = useChat();

  const name = profile?.name || personName || 'Freight Member';
  const isSarah = name.toLowerCase().includes('sarah');
  const isKiran = name.toLowerCase().includes('kiran');
  const isPriya = name.toLowerCase().includes('priya');
  const isRavi = name.toLowerCase().includes('ravi');

  const resolvedProfile: ProfilePreviewData = profile || {
    name,
    role: isSarah
      ? 'Ocean Freight Lead & Liner Specialist'
      : isKiran
      ? 'Trade Lane Director (Asia-Europe)'
      : isPriya
      ? 'Maritime Logistics & Procurement Manager'
      : isRavi
      ? 'Global Procurement Director & Forwarding Executive'
      : 'Freight Logistics Professional',
    company: isSarah
      ? 'Rotterdam Freight NV'
      : isKiran
      ? 'Indo Ocean Lines'
      : isPriya
      ? 'Nair Cargo Solutions'
      : isRavi
      ? 'CargoLink Global Logistics'
      : 'Global Forwarding Network',
    location: isSarah
      ? 'Rotterdam, Netherlands'
      : isRavi
      ? 'Singapore'
      : 'Mumbai, India',
    timezone: isSarah
      ? 'Europe/Amsterdam'
      : isRavi
      ? 'Asia/Singapore'
      : 'Asia/Kolkata',
    hasGoldenTick: isRavi || isSarah || name.toLowerCase().includes('arjun'),
    isVerified: true,
    trustScore: isRavi ? 99 : isSarah ? 98 : 96,
    kycTier: 'Level 3 Enterprise Verified (Statutory Filings + MTO Validated)',
    email: `${name.toLowerCase().replace(/\s+/g, '.')}@network.fr8x.in`,
    bio: 'Verified international freight forwarding executive specializing in ocean container procurement, carrier contract negotiations, customs compliance, and reverse auction execution across major global trade corridors.',
    specializations: ['FCL Ocean', 'OOG Breakbulk', 'Asia-Europe', 'Port Logistics', 'Customs Brokerage', 'Reverse Auctions'],
    keyTradeLanes: ['INNSA ↔ NLRTM', 'INMUN ↔ SGSIN', 'JED ↔ HAM', 'CNSHA ↔ USLAX'],
    certifications: ['IATA Dangerous Goods DGR Cat 6', 'FIATA Diploma in Freight Forwarding', 'Customs Brokerage Class A'],
    teuVolumeYear: '14,500+ TEUs / Year',
    contactAvailability: '08:30 – 18:30 Local Business Hours',
  };

  if (!isOpen) return null;

  const handleStartChat = () => {
    onClose();
    const contactId = resolvedProfile.name.toLowerCase().replace(/\s+/g, '-');
    openChatWith(contactId, {
      type: 'company',
      id: resolvedProfile.company || 'Direct',
      title: `${resolvedProfile.name} · ${resolvedProfile.company || 'Profile'}`,
    });
  };

  const initials = resolvedProfile.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verified Enterprise Logistics Passport"
      maxWidth="720px"
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn primary" onClick={handleStartChat}>
            <MessageSquare size={14} /> Start Direct Trade Chat
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Profile Header Block */}
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', background: '#fafcff', padding: '16px', borderRadius: '10px', border: '1px solid var(--line)' }}>
          <div className="avatar big" style={{ width: '58px', height: '58px', padding: 0, overflow: 'hidden' }}>
            <img src="/profile-avatar.png" alt={resolvedProfile.name} className="profile-img-avatar" style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                {resolvedProfile.name}
              </h2>
              {resolvedProfile.hasGoldenTick && <GoldenTick />}
              {resolvedProfile.isVerified && (
                <span className="badge green" style={{ fontSize: '10px' }}>
                  <ShieldCheck size={11} /> Verified Member
                </span>
              )}
              <span className="badge blue" style={{ fontSize: '10px' }}>
                <Star size={10} color="#f59e0b" /> Trust Score: {resolvedProfile.trustScore || 98}/100
              </span>
            </div>
            <p style={{ color: 'var(--ink-secondary)', fontSize: '12.5px', margin: '4px 0 0', fontWeight: 600 }}>
              {resolvedProfile.role} at <span style={{ color: 'var(--brand)' }}>{resolvedProfile.company}</span>
            </p>
            <p style={{ color: 'var(--mut)', fontSize: '11.5px', margin: '3px 0 0' }}>
              <MapPin size={11} style={{ verticalAlign: '-2px', marginRight: '3px' }} />
              {resolvedProfile.location}
            </p>
          </div>

          <LocalTimeBadge timezone={resolvedProfile.timezone || 'Asia/Kolkata'} boxFormat={true} />
        </div>

        {/* Corporate Trust & KYC Status Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: '#eef6ff', border: '1px solid #c8e0fe', borderRadius: '8px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--brand)" />
            <span style={{ fontSize: '11.5px', color: 'var(--ink)' }}>
              <b>KYC Status:</b> {resolvedProfile.kycTier || 'Level 3 Enterprise Verified'}
            </span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
            Annual Operational Volume: <b>{resolvedProfile.teuVolumeYear || '12,000+ TEUs'}</b>
          </span>
        </div>

        {/* Company & Contact Card */}
        <div className="grid g2">
          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
              Corporate Organization
            </small>
            <p style={{ fontSize: '12.5px', fontWeight: 600, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Building2 size={13} color="var(--brand)" /> {resolvedProfile.company}
            </p>
            <p style={{ fontSize: '11.5px', color: 'var(--mut)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Briefcase size={13} /> {resolvedProfile.role}
            </p>
          </div>

          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
              Direct B2B Communication
            </small>
            <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Mail size={12} /> {resolvedProfile.email}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '2px 0 0' }}>
              Hours: {resolvedProfile.contactAvailability || '09:00 - 18:00 Local Time'}
            </p>
          </div>
        </div>

        {/* Professional Summary */}
        <div className="card cardbody">
          <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Executive Logistics Summary
          </small>
          <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', lineHeight: 1.5, margin: 0 }}>
            {resolvedProfile.bio}
          </p>
        </div>

        {/* Trade Lanes & Certifications Grid */}
        <div className="grid g2">
          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Primary Trade Corridors
            </small>
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
              {(resolvedProfile.keyTradeLanes || ['INNSA ↔ NLRTM', 'INMUN ↔ SGSIN', 'JED ↔ HAM']).map((lane, idx) => (
                <span key={idx} className="badge blue" style={{ fontSize: '10px' }}>
                  {lane}
                </span>
              ))}
            </div>
          </div>

          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
              Accredited Credentials
            </small>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              {(resolvedProfile.certifications || ['IATA DGR Cat 6', 'FIATA Diploma']).map((cert, idx) => (
                <div key={idx} style={{ fontSize: '11px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Award size={12} color="var(--green)" /> {cert}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Specialization Tags */}
        <div>
          <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
            Commodities & Operations
          </small>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {(resolvedProfile.specializations || ['FCL Ocean', 'OOG Breakbulk', 'Asia-Europe', 'Customs Brokerage', 'Reverse Auctions']).map(
              (s, i) => (
                <span key={i} className="badge amber" style={{ fontSize: '10.5px' }}>
                  {s}
                </span>
              )
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
