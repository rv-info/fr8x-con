'use client';

/**
 * /network/[id] — Full-Width Comprehensive Professional Profile View
 *
 * Full member profile workspace with privacy-shielded contact details,
 * verified Golden Tick credentials, trade corridor specializations,
 * operating history, corporate capabilities, and contextual ConnectionButton.
 *
 * Enforces Absolute Three-Colour System:
 * - BLACK (#000000): Typography, headings, icons, outlines
 * - WHITE (#FFFFFF): Page canvas, panels, containers, cards
 * - LIGHT GREY (#E6E6E6): Buttons, borders, minimal dividers
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  GraduationCap,
  FileCheck2,
  Clock,
  Compass,
  MessageSquare,
  Lock,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ConnectionButton, ConnectionStatus } from '@/components/people/ConnectionButton';
import { GoldenTick } from '@/components/ui/GoldenTick';

interface PublicProfile {
  id: string;
  uid?: string | null;
  display_name: string | null;
  full_name?: string | null;
  first_name: string | null;
  last_name: string | null;
  headline?: string | null;
  designation: string | null;
  position: string | null;
  company?: string | null;
  company_name: string | null;
  department?: string | null;
  location?: string | null;
  city: string | null;
  state?: string | null;
  country: string | null;
  postal_code?: string | null;
  formatted_address?: string | null;
  timezone?: string | null;
  avatar_url: string | null;
  company_logo_url?: string | null;
  bio: string | null;
  summary: string | null;
  email?: string | null;
  phone?: string | null;
  mobile?: string | null;
  skills: string[] | null;
  specializations: string[] | null;
  key_trade_lanes: string[] | null;
  languages: string[] | null;
  experiences: Array<{ title?: string; company?: string; from?: string; to?: string; current?: boolean; description?: string }> | null;
  educations?: Array<{ institution?: string; degree?: string; field?: string; year?: string }> | null;
  certifications?: Array<{ name?: string; issuer?: string; year?: string }> | null;
  is_verified: boolean | null;
  has_golden_tick: boolean | null;
  plan?: string | null;
  connection_status: ConnectionStatus;
  mutual_count: number;
  request_id?: string;
  iata_code?: string | null;
  fiata_reg?: string | null;
  fmc_number?: string | null;
  mto?: string | null;
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
  if (p.state) parts.push(p.state);
  if (p.country) parts.push(p.country);
  return parts.join(', ');
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section
      style={{
        borderBottom: '1px solid #E6E6E6',
        paddingBottom: '24px',
        marginBottom: '24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
        {icon}
        <h2
          style={{
            fontSize: '13px',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: '#000000',
            margin: 0,
          }}
        >
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export default function NetworkPersonProfilePage({ params }: { params: { id: string } }) {
  const router = useRouter();
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
          setError(data.error?.message || data.error || 'Failed to load profile.');
          return;
        }
        setProfile(data.profile as PublicProfile);
      })
      .catch(() => setError('Failed to load profile. Please try again.'))
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: '80px 24px',
          textAlign: 'center',
          background: '#FFFFFF',
          boxSizing: 'border-box',
        }}
      >
        <Loader2 size={32} className="spin" style={{ margin: '0 auto 16px', color: '#000000' }} />
        <p style={{ fontSize: '13px', fontWeight: 600, color: '#000000' }}>Loading Complete Professional Profile…</p>
      </div>
    );
  }

  if (notFound) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: '60px 24px',
          background: '#FFFFFF',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            padding: '36px',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #E6E6E6',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 10px', color: '#000000' }}>Profile Not Found</h1>
          <p style={{ fontSize: '13px', color: '#000000', margin: '0 0 24px' }}>
            This member may have removed their profile, altered privacy visibility, or the account is restricted.
          </p>
          <Link
            href="/network"
            style={{
              display: 'inline-flex',
              padding: '8px 18px',
              borderRadius: '4px',
              background: '#E6E6E6',
              color: '#000000',
              border: '1px solid #E6E6E6',
              fontSize: '12.5px',
              fontWeight: 700,
              textDecoration: 'none',
            }}
          >
            ← Back to Network Workspace
          </Link>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div
        style={{
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          padding: '60px 24px',
          background: '#FFFFFF',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            maxWidth: '640px',
            margin: '0 auto',
            padding: '36px',
            textAlign: 'center',
            background: '#FFFFFF',
            borderRadius: '6px',
            border: '1px solid #E6E6E6',
          }}
        >
          <AlertTriangle size={28} style={{ color: '#000000', margin: '0 auto 14px' }} />
          <p style={{ fontSize: '13px', color: '#000000', margin: '0 0 24px', fontWeight: 600 }}>
            {error || 'Unable to load member profile.'}
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '8px 18px',
                borderRadius: '4px',
                background: '#E6E6E6',
                color: '#000000',
                fontSize: '12.5px',
                fontWeight: 700,
                border: '1px solid #E6E6E6',
                cursor: 'pointer',
              }}
            >
              Retry
            </button>
            <Link
              href="/network"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '8px 18px',
                borderRadius: '4px',
                background: '#E6E6E6',
                color: '#000000',
                border: '1px solid #E6E6E6',
                fontSize: '12.5px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              Back to Network
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const name = getDisplayName(profile);
  const headline = getHeadline(profile);
  const location = getLocation(profile);

  return (
    <div
      className="full-width-profile-workspace"
      style={{
        width: '100%',
        maxWidth: '100%',
        margin: 0,
        padding: '20px 24px 80px',
        boxSizing: 'border-box',
        background: '#FFFFFF',
      }}
    >
      {/* ── 1. Top Navigation Bar ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #E6E6E6',
        }}
      >
        <button
          onClick={() => {
            if (window.history.length > 1) {
              router.back();
            } else {
              router.push('/network');
            }
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12.5px',
            fontWeight: 700,
            color: '#000000',
            textDecoration: 'none',
            padding: '6px 14px',
            background: '#E6E6E6',
            borderRadius: '4px',
            border: '1px solid #E6E6E6',
            cursor: 'pointer',
          }}
        >
          <ArrowLeft size={15} style={{ color: '#000000' }} />
          <span>Back to Network</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '12px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em',
              color: '#000000',
            }}
          >
            Authoritative Logistics Member Dossier
          </span>
        </div>
      </div>

      {/* ── 2. Full-Width Hero Profile Card ──────────────────────────────────── */}
      <div
        style={{
          width: '100%',
          padding: '28px',
          borderRadius: '6px',
          background: '#FFFFFF',
          border: '1px solid #E6E6E6',
          display: 'flex',
          gap: '24px',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          marginBottom: '24px',
          boxSizing: 'border-box',
        }}
      >
        <UserAvatar name={name} avatarUrl={profile.avatar_url ?? undefined} size={92} />

        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: 700, margin: 0, color: '#000000', letterSpacing: '-0.02em', lineHeight: 1.25 }}>
              {name}
            </h1>
            {profile.has_golden_tick && <GoldenTick size={20} />}
            {profile.is_verified && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: '#FFFFFF',
                  color: '#000000',
                  border: '1px solid #E6E6E6',
                  fontWeight: 700,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Verified Entity
              </span>
            )}
            {profile.plan && (
              <span
                style={{
                  padding: '2px 8px',
                  borderRadius: '4px',
                  background: '#E6E6E6',
                  color: '#000000',
                  border: '1px solid #E6E6E6',
                  fontWeight: 700,
                  fontSize: '11px',
                  textTransform: 'uppercase',
                }}
              >
                {profile.plan} Tier
              </span>
            )}
          </div>

          {headline && (
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#000000', margin: '4px 0 10px', lineHeight: 1.4 }}>
              {headline}
            </p>
          )}

          <div
            style={{
              display: 'flex',
              gap: '16px',
              alignItems: 'center',
              flexWrap: 'wrap',
              fontSize: '12.5px',
              color: '#000000',
              marginBottom: '18px',
            }}
          >
            {location && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                <MapPin size={14} style={{ color: '#000000' }} /> {location}
              </span>
            )}
            {profile.department && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                <Building2 size={14} style={{ color: '#000000' }} /> {profile.department}
              </span>
            )}
            {profile.mutual_count > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 600 }}>
                <Users size={14} style={{ color: '#000000' }} /> {profile.mutual_count} mutual connection{profile.mutual_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Action Row */}
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
                padding: '8px 16px',
                borderRadius: '4px',
                background: '#E6E6E6',
                color: '#000000',
                border: '1px solid #E6E6E6',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Ban size={13} style={{ color: '#000000' }} />
              <span>{profile.connection_status === 'blocked' ? 'Unblock Member' : 'Block Member'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── 3. Full-Width Responsive Two-Column Details Grid ─────────────────── */}
      <div
        style={{
          width: '100%',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: '24px',
          boxSizing: 'border-box',
        }}
      >
        {/* ── LEFT COLUMN: Core Logistics & Experience Profile ───────────────── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Professional Overview & Bio */}
          <div
            style={{
              padding: '24px',
              borderRadius: '6px',
              background: '#FFFFFF',
              border: '1px solid #E6E6E6',
            }}
          >
            <Section title="Professional Overview &amp; Biography" icon={<Award size={15} style={{ color: '#000000' }} />}>
              <p style={{ fontSize: '13px', lineHeight: 1.7, color: '#000000', margin: 0 }}>
                {profile.bio || profile.summary || 'No professional bio provided by member.'}
              </p>
            </Section>

            {/* Primary Trade Corridors */}
            <Section title="Primary Trade Corridors &amp; Port Lanes" icon={<Globe size={15} style={{ color: '#000000' }} />}>
              {profile.key_trade_lanes && profile.key_trade_lanes.length > 0 ? (
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.key_trade_lanes.map((lane) => (
                    <span
                      key={lane}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        background: '#FFFFFF',
                        color: '#000000',
                        border: '1px solid #E6E6E6',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      <Compass size={12} style={{ color: '#000000' }} /> {lane}
                    </span>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12.5px', color: '#000000', margin: 0 }}>
                  Global freight forwarding and multimodal transportation corridor operations.
                </p>
              )}
            </Section>

            {/* Freight Services & Capabilities */}
            {profile.specializations && profile.specializations.length > 0 && (
              <Section title="Freight &amp; Logistics Specializations" icon={<Briefcase size={15} style={{ color: '#000000' }} />}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.specializations.map((spec) => (
                    <span
                      key={spec}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        background: '#FFFFFF',
                        color: '#000000',
                        border: '1px solid #E6E6E6',
                        fontSize: '12px',
                        fontWeight: 700,
                      }}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Core Logistics Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Section title="Operational Competencies &amp; Skills" icon={<FileCheck2 size={15} style={{ color: '#000000' }} />}>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.skills.map((skill) => (
                    <span
                      key={skill}
                      style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        background: '#E6E6E6',
                        color: '#000000',
                        border: '1px solid #E6E6E6',
                        fontSize: '11.5px',
                        fontWeight: 700,
                      }}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </Section>
            )}

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <Section title="Working Languages">
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {profile.languages.map((lang) => (
                    <span
                      key={lang}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '4px',
                        background: '#FFFFFF',
                        color: '#000000',
                        border: '1px solid #E6E6E6',
                        fontSize: '12px',
                        fontWeight: 600,
                      }}
                    >
                      {lang}
                    </span>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Operational Experience History */}
          <div
            style={{
              padding: '24px',
              borderRadius: '6px',
              background: '#FFFFFF',
              border: '1px solid #E6E6E6',
            }}
          >
            <Section title="Experience &amp; Operational History" icon={<Clock size={15} style={{ color: '#000000' }} />}>
              {profile.experiences && profile.experiences.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {profile.experiences.map((exp, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'flex-start',
                        paddingBottom: i !== profile.experiences!.length - 1 ? '16px' : '0',
                        borderBottom: i !== profile.experiences!.length - 1 ? '1px solid #E6E6E6' : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '4px',
                          background: '#E6E6E6',
                          border: '1px solid #E6E6E6',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <Briefcase size={16} style={{ color: '#000000' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#000000' }}>
                          {exp.title ?? 'Logistics Specialist'}
                        </div>
                        {exp.company && (
                          <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#000000', marginTop: '2px' }}>
                            {exp.company}
                          </div>
                        )}
                        {(exp.from || exp.to || exp.current) && (
                          <div style={{ fontSize: '11px', color: '#000000', marginTop: '2px', fontWeight: 600 }}>
                            {exp.from ?? 'Start'} – {exp.current ? 'Present' : exp.to ?? 'End'}
                          </div>
                        )}
                        {exp.description && (
                          <p style={{ fontSize: '12px', lineHeight: 1.5, color: '#000000', margin: '6px 0 0' }}>
                            {exp.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: '12.5px', color: '#000000', margin: 0 }}>
                  No previous operational employment history recorded.
                </p>
              )}
            </Section>

            {/* Education & Qualifications */}
            {profile.educations && profile.educations.length > 0 && (
              <Section title="Education &amp; Professional Qualifications" icon={<GraduationCap size={15} style={{ color: '#000000' }} />}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {profile.educations.map((edu, i) => (
                    <div key={i} style={{ fontSize: '12.5px', color: '#000000' }}>
                      <div style={{ fontWeight: 700 }}>{edu.degree || 'Degree'} {edu.field ? `in ${edu.field}` : ''}</div>
                      <div style={{ fontWeight: 500 }}>{edu.institution || 'University / Institute'} {edu.year ? `(${edu.year})` : ''}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <Section title="Accreditations &amp; Professional Certifications">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {profile.certifications.map((cert, i) => (
                    <div key={i} style={{ fontSize: '12.5px', color: '#000000' }}>
                      <div style={{ fontWeight: 700 }}>{cert.name}</div>
                      <div style={{ fontWeight: 500 }}>{cert.issuer} {cert.year ? `· ${cert.year}` : ''}</div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Corporate Entity, Accreditations & Shielded Contact ─ */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
          }}
        >
          {/* Corporate Entity Details */}
          <div
            style={{
              padding: '24px',
              borderRadius: '6px',
              background: '#FFFFFF',
              border: '1px solid #E6E6E6',
            }}
          >
            <Section title="Corporate Freight Entity" icon={<Building2 size={15} style={{ color: '#000000' }} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '12.5px' }}>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>
                    Entity Legal Name
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 800, color: '#000000', marginTop: '2px' }}>
                    {profile.company_name || profile.company || 'Enterprise Freight Entity'}
                  </div>
                </div>

                {profile.department && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>
                      Department / Division
                    </div>
                    <div style={{ fontWeight: 600, color: '#000000', marginTop: '2px' }}>
                      {profile.department}
                    </div>
                  </div>
                )}

                {location && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>
                      Operational Jurisdiction
                    </div>
                    <div style={{ fontWeight: 600, color: '#000000', marginTop: '2px' }}>
                      {location}
                    </div>
                  </div>
                )}

                {profile.timezone && (
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>
                      Operating Timezone
                    </div>
                    <div style={{ fontWeight: 600, color: '#000000', marginTop: '2px' }}>
                      {profile.timezone}
                    </div>
                  </div>
                )}
              </div>
            </Section>

            {/* Statutory & Industry Accreditations */}
            <Section title="Statutory Accreditations" icon={<ShieldCheck size={15} style={{ color: '#000000' }} />}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E6E6E6', paddingBottom: '6px' }}>
                  <span style={{ fontWeight: 700, color: '#000000' }}>KYC Verification:</span>
                  <span style={{ fontWeight: 700, color: '#000000' }}>{profile.is_verified ? 'VERIFIED' : 'PENDING'}</span>
                </div>
                {profile.iata_code && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E6E6E6', paddingBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#000000' }}>IATA Code:</span>
                    <span style={{ fontWeight: 700, color: '#000000' }}>{profile.iata_code}</span>
                  </div>
                )}
                {profile.fiata_reg && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E6E6E6', paddingBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#000000' }}>FIATA Reg:</span>
                    <span style={{ fontWeight: 700, color: '#000000' }}>{profile.fiata_reg}</span>
                  </div>
                )}
                {profile.fmc_number && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E6E6E6', paddingBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#000000' }}>FMC OTI/NVOCC:</span>
                    <span style={{ fontWeight: 700, color: '#000000' }}>{profile.fmc_number}</span>
                  </div>
                )}
                {profile.mto && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E6E6E6', paddingBottom: '6px' }}>
                    <span style={{ fontWeight: 700, color: '#000000' }}>MTO License:</span>
                    <span style={{ fontWeight: 700, color: '#000000' }}>{profile.mto}</span>
                  </div>
                )}
              </div>
            </Section>

            {/* Corporate Contact Information (Relationship-Governed) */}
            <Section title="Corporate Contact Details" icon={<Mail size={15} style={{ color: '#000000' }} />}>
              {profile.email || profile.phone || profile.mobile ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {profile.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <Mail size={14} style={{ color: '#000000' }} />
                      <a href={`mailto:${profile.email}`} style={{ color: '#000000', fontWeight: 700, textDecoration: 'none' }}>
                        {profile.email}
                      </a>
                    </div>
                  )}
                  {(profile.phone || profile.mobile) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                      <Phone size={14} style={{ color: '#000000' }} />
                      <a href={`tel:${profile.phone || profile.mobile}`} style={{ color: '#000000', fontWeight: 700, textDecoration: 'none' }}>
                        {profile.phone || profile.mobile}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  style={{
                    padding: '14px',
                    borderRadius: '4px',
                    background: '#FFFFFF',
                    border: '1px solid #E6E6E6',
                    fontSize: '12px',
                    lineHeight: 1.5,
                    color: '#000000',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 800, marginBottom: '4px' }}>
                    <Lock size={13} style={{ color: '#000000' }} />
                    <span>CONTACT DETAILS SHIELDED</span>
                  </div>
                  Direct telephone, email, and statutory tax filings are shielded by member privacy settings. Send a connection request to request authorized bilateral access.
                </div>
              )}
            </Section>

            {/* Network Relationship State */}
            <div
              style={{
                padding: '14px',
                borderRadius: '4px',
                background: '#FFFFFF',
                border: '1px solid #E6E6E6',
                fontSize: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>Relationship:</span>
              <span style={{ fontWeight: 800, textTransform: 'uppercase', color: '#000000' }}>
                {profile.connection_status === 'connected'
                  ? 'Connected Partner'
                  : profile.connection_status === 'pending_sent'
                  ? 'Request Sent'
                  : profile.connection_status === 'pending_received'
                  ? 'Request Received'
                  : profile.connection_status === 'blocked'
                  ? 'Blocked'
                  : 'Not Connected'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
