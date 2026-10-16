'use client';

/**
 * /people/[id] — Public Professional Profile View
 * Fetches profile via API and renders a full read-only profile page.
 * Includes the ConnectionButton for the viewing user to connect.
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  MapPin, Building2, Award, Briefcase, Globe,
  ArrowLeft, Loader2, AlertTriangle, Users, Ban,
  Mail, Phone, ShieldCheck,
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
  if (p.city)    parts.push(p.city);
  if (p.country) parts.push(p.country);
  return parts.join(', ');
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="profile-section">
      <h2 className="profile-section-title">{title}</h2>
      {children}
    </section>
  );
}

export default function PersonProfilePage({ params }: { params: { id: string } }) {
  const [profile, setProfile]   = useState<PublicProfile | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState<string | null>(null);
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
        setProfile((prev) => prev ? {
          ...prev,
          connection_status: isCurrentlyBlocked ? 'none' : 'blocked',
        } : null);
      }
    } catch {
      // silently fail
    } finally {
      setBlocking(false);
    }
  };

  useEffect(() => {
    if (!params.id) return;

    // Validate ID length/format
    const cleanId = params.id.trim();
    if (!cleanId || cleanId.length > 128) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    fetch(`/api/people/profile/${encodeURIComponent(cleanId)}`)
      .then(async (res) => {
        if (res.status === 404) { setNotFound(true); return; }
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
      <div className="profile-page">
        <div className="profile-loading" aria-label="Loading profile" aria-busy="true">
          <Loader2 size={28} className="spin" aria-hidden="true" />
          <p>Loading profile…</p>
        </div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="profile-page">
        <div className="profile-not-found" role="main">
          <div className="profile-not-found-icon" aria-hidden="true">👤</div>
          <h1>Profile not found</h1>
          <p>This member may have removed their profile or changed their privacy settings.</p>
          <Link href="/people" className="btn-primary" aria-label="Back to people search">
            ← Back to People Search
          </Link>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-page">
        <div className="profile-error" role="alert">
          <AlertTriangle size={24} aria-hidden="true" />
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">Retry</button>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  const name = getDisplayName(profile);
  const headline = [profile.designation || profile.position, profile.company_name]
    .filter(Boolean).join(' · ');
  const location = [profile.city, profile.country].filter(Boolean).join(', ');

  return (
    <div className="profile-page" role="main">
      {/* Back nav */}
      <Link href="/people" className="profile-back-link" aria-label="Back to people search">
        <ArrowLeft size={16} aria-hidden="true" /> People
      </Link>

      {/* Hero card */}
      <div className="profile-hero">
        <div className="profile-hero-avatar">
          <UserAvatar name={name} avatarUrl={profile.avatar_url ?? undefined} size={88} />
          {profile.is_verified && (
            <span
              className={`profile-verified-badge ${profile.has_golden_tick ? 'golden' : ''}`}
              title={profile.has_golden_tick ? 'Golden Tick — Verified Premium Member' : 'Verified Business Member'}
              aria-label={profile.has_golden_tick ? 'Verified premium member' : 'Verified business member'}
            >
              {profile.has_golden_tick ? '★' : '✓'}
            </span>
          )}
        </div>

        <div className="profile-hero-info">
          <div className="profile-hero-name-row">
            <h1 className="profile-hero-name">
              {name}
              {profile.has_golden_tick && (
                <span className="ml-2" aria-hidden="true">
                  <GoldenTick size={18} />
                </span>
              )}
            </h1>
          </div>

          {headline && <p className="profile-hero-headline">{headline}</p>}

          <div className="profile-hero-meta">
            {location && (
              <span className="profile-meta-chip">
                <MapPin size={12} aria-hidden="true" /> {location}
              </span>
            )}
            {profile.mutual_count > 0 && (
              <span className="profile-meta-chip">
                <Users size={12} aria-hidden="true" />
                {profile.mutual_count} mutual connection{profile.mutual_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          <div className="profile-hero-actions">
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
              className="connection-btn connection-btn-ghost connection-btn-md"
              style={{ color: 'var(--color-danger, #ef4444)', borderColor: 'rgba(239, 68, 68, 0.3)' }}
              title={profile.connection_status === 'blocked' ? 'Unblock member' : 'Block member'}
              aria-label={profile.connection_status === 'blocked' ? 'Unblock member' : 'Block member'}
            >
              <Ban size={14} aria-hidden="true" />
              <span>{profile.connection_status === 'blocked' ? 'Unblock' : 'Block'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="profile-body">
        {/* About */}
        {(profile.bio || profile.summary) && (
          <Section title="About">
            <p className="profile-about">{profile.summary || profile.bio}</p>
          </Section>
        )}

        {/* Contact Information (connection-governed) */}
        {(profile.email || profile.phone) ? (
          <Section title="Contact Information">
            <div className="profile-contact-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {profile.email && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <Mail size={14} aria-hidden="true" />
                  <a href={`mailto:${profile.email}`} style={{ color: 'var(--color-primary, #2563eb)', textDecoration: 'none' }}>{profile.email}</a>
                </div>
              )}
              {profile.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
                  <Phone size={14} aria-hidden="true" />
                  <a href={`tel:${profile.phone}`} style={{ color: 'var(--color-primary, #2563eb)', textDecoration: 'none' }}>{profile.phone}</a>
                </div>
              )}
            </div>
          </Section>
        ) : (
          <Section title="Contact Information">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#64748b' }}>
              <ShieldCheck size={14} aria-hidden="true" />
              <span>Direct contact details are protected by member privacy settings. Connect to request access.</span>
            </div>
          </Section>
        )}

        {/* Skills */}
        {profile.skills && profile.skills.length > 0 && (
          <Section title="Skills & Expertise">
            <div className="profile-tags" aria-label="Skills">
              {profile.skills.map((skill) => (
                <span key={skill} className="profile-tag">{skill}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Specializations */}
        {profile.specializations && profile.specializations.length > 0 && (
          <Section title="Specializations">
            <div className="profile-tags" aria-label="Specializations">
              {profile.specializations.map((spec) => (
                <span key={spec} className="profile-tag spec">{spec}</span>
              ))}
            </div>
          </Section>
        )}

        {/* Trade lanes */}
        {profile.key_trade_lanes && profile.key_trade_lanes.length > 0 && (
          <Section title="Key Trade Lanes">
            <div className="profile-tags" aria-label="Trade lanes">
              {profile.key_trade_lanes.map((lane) => (
                <span key={lane} className="profile-tag lane">
                  <Globe size={11} aria-hidden="true" /> {lane}
                </span>
              ))}
            </div>
          </Section>
        )}

        {/* Experience */}
        {profile.experiences && profile.experiences.length > 0 && (
          <Section title="Experience">
            <div className="profile-experiences">
              {profile.experiences.map((exp, i) => (
                <div key={i} className="profile-experience-item">
                  <div className="profile-exp-icon" aria-hidden="true">
                    <Briefcase size={14} />
                  </div>
                  <div className="profile-exp-body">
                    <p className="profile-exp-title">{exp.title ?? '—'}</p>
                    {exp.company && (
                      <p className="profile-exp-company">
                        <Building2 size={11} aria-hidden="true" /> {exp.company}
                      </p>
                    )}
                    {(exp.from || exp.to || exp.current) && (
                      <p className="profile-exp-dates">
                        {exp.from ?? '?'} – {exp.current ? 'Present' : (exp.to ?? '?')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* Languages */}
        {profile.languages && profile.languages.length > 0 && (
          <Section title="Languages">
            <div className="profile-tags" aria-label="Languages">
              {profile.languages.map((lang) => (
                <span key={lang} className="profile-tag lang">{lang}</span>
              ))}
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}
