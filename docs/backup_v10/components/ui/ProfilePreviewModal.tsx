'use client';

import React from 'react';
import { Modal } from './Modal';
import { LocalTimeBadge } from './LocalTimeBadge';
import { GoldenTick } from './GoldenTick';
import { useChat } from '@/lib/context/ChatContext';
import { MessageSquare, MapPin, Building2, Briefcase, Mail, Phone, ShieldCheck } from 'lucide-react';

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
}

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: ProfilePreviewData | null;
}

export function ProfilePreviewModal({ isOpen, onClose, profile }: ProfilePreviewModalProps) {
  const { openChatWith } = useChat();

  if (!profile) return null;

  const handleStartChat = () => {
    onClose();
    const contactId = profile.name.toLowerCase().replace(/\s+/g, '-');
    openChatWith(contactId, {
      type: 'company',
      id: profile.company || 'Direct',
      title: `${profile.name} · ${profile.company || 'Profile'}`,
    });
  };

  const initials = profile.name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Professional Profile"
      maxWidth="680px"
      footer={
        <>
          <button className="btn secondary" onClick={onClose}>
            Close
          </button>
          <button className="btn primary" onClick={handleStartChat}>
            <MessageSquare size={14} /> Start Trade Chat
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
        <div className="avatar big">{initials}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: 'var(--ink)' }}>
              {profile.name}
            </h2>
            {profile.hasGoldenTick && <GoldenTick />}
            {profile.isVerified && (
              <span className="badge green">
                <ShieldCheck size={11} /> Verified Member
              </span>
            )}
            <LocalTimeBadge timezone={profile.timezone || 'Asia/Kolkata'} />
          </div>
          <p style={{ color: 'var(--mut)', fontSize: '12px', margin: '4px 0 0' }}>
            {profile.role || 'Freight Professional'} · {profile.company || 'Logistics Network'}
          </p>
          <p style={{ color: 'var(--mut)', fontSize: '11px', margin: '2px 0 0' }}>
            <MapPin size={11} style={{ verticalAlign: '-2px', marginRight: '3px' }} />
            {profile.location || 'Global Logistics Hub'}
          </p>
        </div>
      </div>

      <div className="grid g2" style={{ marginBottom: '14px' }}>
        <div className="card cardbody" style={{ background: '#f8fafc' }}>
          <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
            Company & Department
          </small>
          <p style={{ fontSize: '12.5px', fontWeight: 600, margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={13} color="var(--brand)" /> {profile.company || 'Atlas Logistics Pvt. Ltd.'}
          </p>
          <p style={{ fontSize: '11.5px', color: 'var(--mut)', margin: '2px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Briefcase size={13} /> {profile.role || 'Freight Procurement Specialist'}
          </p>
        </div>

        <div className="card cardbody" style={{ background: '#f8fafc' }}>
          <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
            Contact & Availability
          </small>
          <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', margin: '4px 0 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Mail size={12} /> {profile.email || `${profile.name.toLowerCase().replace(/\s+/g, '.')}@network.fr8x.in`}
          </p>
          <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '2px 0 0' }}>
            Availability: {profile.contactAvailability || '09:00 - 18:00 Local Time'}
          </p>
        </div>
      </div>

      <div className="card cardbody" style={{ marginBottom: '12px' }}>
        <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
          Professional Summary
        </small>
        <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
          {profile.bio ||
            'Experienced international freight forwarding and supply chain professional managing FCL/LCL trade lanes, multi-modal transport carrier contracts, and reverse auction bidding.'}
        </p>
      </div>

      <div>
        <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase', display: 'block', marginBottom: '6px' }}>
          Specializations & Trade Lanes
        </small>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {(profile.specializations || ['FCL Ocean', 'OOG Breakbulk', 'Asia-Europe', 'Customs Brokerage', 'Reverse Auctions']).map(
            (s, i) => (
              <span key={i} className="badge blue">
                {s}
              </span>
            )
          )}
        </div>
      </div>
    </Modal>
  );
}
