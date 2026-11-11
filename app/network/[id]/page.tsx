'use client';

/**
 * /network/[id] — Public & Connected Professional Profile View
 *
 * Full member profile view with privacy-shielded contact details,
 * verified Golden Tick credentials, trade corridor specializations,
 * operating history, and contextual ConnectionButton.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Building2,
  Award,
  Briefcase,
  Globe,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Users,
  Ban,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ConnectionButton, ConnectionStatus } from '@/components/people/ConnectionButton';
import { GoldenTick } from '@/components/ui/GoldenTick';

interface PublicProfile {
  id: string;
  display_name: string | null;
  full_name?: string | null;
  first_name: string | null;
  last_name: string | null;
  headline?: string | null;
  designation: string | null;
  position: string | null;
  company?: string | null;
  company_name: string | null;
  location?: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  bio: string | null;
  summary: string | null;
  email?: string | null;
  phone?: string | null;
  skills: string[] | null;
  specializations: string[] | null;
  key_trade_lanes: string[] | null;
  languages: string[] | null;
  experiences: Array<{ title?: string; company?: string; from?: string; to?: string; current?: boolean }> | null;
  is_verified: boolean | null;
  has_golden_tick: boolean | null;
  connection_status: ConnectionStatus;
  mutual_count: number;
  request_id?: string;
}

function getDisplayName(p: PublicProfile) {
  if (p.full_name?.trim()) return p.full_name.trim();
  if (p.display_name?.trim()) return p.display_name.trim();
  const full = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
  return full || 'FR8X Member';
}

function getHeadline(p: PublicProfile) {
  if (p.headline?.trim()) return p.headline.trim();
  const parts: string[] = [];
  if (p.designation || p.position) parts.push((p.designation || p.position)!);
  const comp = p.company || p.company_name;
  if (comp) parts.push(comp);
  return parts.join(' · ');
}

function getLocation(p: PublicProfile) {
  if (p.location?.trim()) return p.location.trim();
  const parts: string[] = [];
  if (p.city) parts.push(p.city);
  if (p.country) parts.push(p.country);
  return parts.join(', ');
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="profile-section" style={{ borderBottom: '1px solid #E5E7EB', paddingBottom: '20px', marginBottom: '20px' }}>
      <h2 className="profile-section-title" style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#4B5563', marginBottom: '12px' }}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function NetworkPersonProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const handleBlockToggle = async () => {
    if (!profile) return;
    const isCurrentlyBlocked = profile.connection_status === 'blocked';
    const action = isCurrentlyBlocked ? 'unblock' : 'block';
    if (!isCurrentlyBlocked && !confirm(`Block ${getDisplayName(profile)}? They will not be able to message or connect with you.`)) {
      return;
    }
    setBlocking(true);
    try {
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, target_id: profile.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setProfile((prev) =>
          prev
            ? {
                ...prev,
                connection_status: isCurrentlyBlocked ? 'none' : 'blocked',
              }
            : null
        );
      }
    } catch {
    } finally {
      setBlocking(false);
    }
  };

  useEffect(() => {
    if (!params.id) return;
    const cleanId = params.id.trim();
    if (!cleanId || cleanId.length > 128) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    fetch(`/api/people/profile/${encodeURIComponent(cleanId)}`)
      .then(async (res) => {
        if (res.status === 404) {
          setNotFound(true);
          return;
        }
        const data = await res.json();
        if (!res.ok || !data.success) {
          setError(data.error ?? 'Failed to load profile.');
          return;
        }
        setProfile(data.profile as PublicProfile);
      })
      .catch(() => setError('Failed to load profile. Please try again.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div style={{ maxWidth: '960px', margin: '0 auto', padding: '40px 20px', textAlign: 'center' }}>
        <Loader2 size={28} className="spin" style={{ margin: '0 auto 12px', color: '#000000' }} />
        <p style={{ fontSize: '13px', color: '#6B7280' }}>Loading profile…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '30px', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 10px', color: '#000000' }}>Profile Not Found</h1>
        <p style={{ fontSize: '13px', color: '#6B7280', margin: '0 0 20px' }}>
          This member may have removed their profile or changed their privacy settings.
        </p>
        <Link
          href="/network"
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            background: '#000000',
            color: '#FFFFFF',
            fontSize: '12.5px',
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          ← Back to Network
        </Link>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '30px', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
        <AlertTriangle size={24} style={{ color: '#DC2626', margin: '0 auto 12px' }} />
        <p style={{ fontSize: '13px', color: '#4B5563', margin: '0 0 20px' }}>{error || 'Unable to load member profile.'}</p>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '8px 18px',
            borderRadius: '6px',
            background: '#000000',
            color: '#FFFFFF',
            fontSize: '12.5px',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const name = getDisplayName(profile);
  const headline = [profile.designation || profile.position, profile.company_name].filter(Boolean).join(' · ');
  const location = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <div style={{ maxWidth: '960px', margin: '0 auto', padding: '20px 20px 80px' }}>
      {/* Back to Network */}
      <Link
        href="/network"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          fontSize: '12.5px',
          fontWeight: 600,
          color: '#4B5563',
          textDecoration: 'none',
          marginBottom: '20px',
        }}
      >
        <ArrowLeft size={15} />
        <span>Back to Network</span>
      </Link>

      {/* Hero Profile Card */}
      <div
        style={{
          padding: '24px',
          borderRadius: '8px',
          background: '#FFFFFF',
          border: '1px solid #E5E7EB',
          display: 'flex',
          gap: '20px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: '24px',
        }}
      >
        <UserAvatar name={name} avatarUrl={profile.avatar_url ?? undefined} size={84} />

        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: '#000000' }}>{name}</h1>
            {profile.has_golden_tick && <GoldenTick size={18} />}
          </div>

          {headline && <p style={{ fontSize: '13.5px', color: '#4B5563', margin: '0 0 10px' }}>{headline}</p>}

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', fontSize: '12px', color: '#6B7280', marginBottom: '16px' }}>
            {location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <MapPin size={13} /> {location}
              </span>
            )}
            {profile.mutual_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Users size={13} /> {profile.mutual_count} mutual connection{profile.mutual_count !== 1 ? 's' : ''}
              </span>
            )}
            <span
              style={{
                padding: '2px 8px',
                borderRadius: '4px',
                background: profile.is_verified ? '#F3F4F6' : '#F9FAFB',
                color: '#111827',
                border: '1px solid #E5E7EB',
                fontWeight: 600,
                fontSize: '11px',
              }}
            >
              {profile.is_verified ? 'Verified Entity' : 'Member'}
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <ConnectionButton
              targetId={profile.id}
              initialStatus={profile.connection_status}
              requestId={profile.request_id}
              size="md"
            />

            <button
              type="button"
              onClick={handleBlockToggle}
              disabled={blocking}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '6px',
                background: '#FFFFFF',
                color: '#DC2626',
                border: '1px solid #FECACA',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              <Ban size={13} />
              <span>{profile.connection_status === 'blocked' ? 'Unblock' : 'Block Member'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Profile Details Sections */}
      <div style={{ padding: '24px', borderRadius: '8px', background: '#FFFFFF', border: '1px solid #E5E7EB' }}>
        {/* About */}
        {(profile.bio || profile.summary) && (
          <Section title="About">
            <p style={{ fontSize: '13px', lineHeight: 1.6, color: '#374151', margin: 0 }}>
              {profile.summary || profile.bio}
            </p>
          </Section>
        )}

        {/* Contact Information (connection-governed) */}
        <Section title="Contact Information">
          {profile.email || profile.phone ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {profile.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#111827' }}>
                  <Mail size={14} style={{ color: '#6B7280' }} />
                  <a href={`mailto:${profile.email}`} style={{ color: '#000000', fontWeight: 600, textDecoration: 'none' }}>
                    {profile.email}
                  </a>
                </div>
              )}
              {profile.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#111827' }}>
                  <Phone size={14} style={{ color: '#6B7280' }} />
                  <a href={`tel:${profile.phone}`} style={{ color: '#000000', fontWeight: 600, textDecoration: 'none' }}>
                    {profile.phone}
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', color: '#6B7280' }}>
              <ShieldCheck size={16} style={{ color: '#16A34A' }} />
              <span>Direct corporate contact details are shielded. Connect with this member to request access.</span>
            </div>
          )}
        </Section>

        {/* Key Trade Lanes */}
        {profile.key_trade_lanes && profile.key_trade_lanes.length > 0 && (
          <Section title="Primary Trade Corridors">
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {profile.key_trade_lanes.map((lane) => (
                <span
                  key={lane}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: '#F3F4F6',
                    color: '#111827',
                    border: '1px solid #E5E7EB',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                >
                  <Globe size={12} /> {lane}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Experience */}
        {profile.experiences && profile.experiences.length > 0 && (
          <Section title="Experience &amp; Operational Background">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {profile.experiences.map((exp, i) => (
                <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '6px',
                      background: '#F3F4F6',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Briefcase size={14} style={{ color: '#4B5563' }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '13px', color: '#000000' }}>{exp.title ?? '—'}</div>
                    {exp.company && (
                      <div style={{ fontSize: '12px', color: '#4B5563', marginTop: '2px' }}>{exp.company}</div>
                    )}
                    {(exp.from || exp.to || exp.current) && (
                      <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                        {exp.from ?? '?'} – {exp.current ? 'Present' : exp.to ?? '?'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
