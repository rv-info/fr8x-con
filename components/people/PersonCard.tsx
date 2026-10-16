'use client';

/**
 * PersonCard — reusable professional profile card for search results.
 * Displays public-only fields; no email/phone/PII.
 * Includes: avatar, name, designation, company, location, verification,
 * mutual connections, and a context-aware ConnectionButton.
 */

import React from 'react';
import Link from 'next/link';
import { MapPin, Building2, Award, Users } from 'lucide-react';
import { ConnectionButton, ConnectionStatus } from './ConnectionButton';
import { UserAvatar } from '@/components/ui/UserAvatar';

export interface PersonCardData {
  id:               string;
  display_name:     string | null;
  first_name:       string | null;
  last_name:        string | null;
  designation:      string | null;
  position:         string | null;
  company_name:     string | null;
  city:             string | null;
  country:          string | null;
  avatar_url:       string | null;
  is_verified:      boolean | null;
  has_golden_tick:  boolean | null;
  skills:           string[] | null;
  connection_status: ConnectionStatus;
  mutual_count:     number;
  request_id?:      string;
}

interface PersonCardProps {
  person:    PersonCardData;
  view?:     'card' | 'list';
  className?: string;
}

function getDisplayName(p: PersonCardData) {
  if (p.display_name?.trim()) return p.display_name.trim();
  const full = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
  return full || 'FR8X Member';
}

function getHeadline(p: PersonCardData) {
  const parts: string[] = [];
  if (p.designation || p.position) parts.push((p.designation || p.position)!);
  if (p.company_name) parts.push(p.company_name);
  return parts.join(' · ');
}

function getLocation(p: PersonCardData) {
  const parts: string[] = [];
  if (p.city)    parts.push(p.city);
  if (p.country) parts.push(p.country);
  return parts.join(', ');
}

export function PersonCard({ person, view = 'card', className = '' }: PersonCardProps) {
  const name     = getDisplayName(person);
  const headline = getHeadline(person);
  const location = getLocation(person);

  if (view === 'list') {
    return (
      <div className={`person-card person-card-list ${className}`} tabIndex={0} role="article" aria-label={`${name} profile card`}>
        <UserAvatar
          name={name}
          avatarUrl={person.avatar_url ?? undefined}
          size={40}
        />

        <div className="person-card-body">
          <div className="person-card-header">
            <Link href={`/people/${person.id}`} className="person-name-link" tabIndex={0}>
              {name}
              {person.has_golden_tick && (
                <span className="golden-tick-badge" title="Golden Tick — Verified Premium Member" aria-label="Verified premium member">★</span>
              )}
              {person.is_verified && !person.has_golden_tick && (
                <span className="verified-badge" title="Verified Business Member" aria-label="Verified business member">✓</span>
              )}
            </Link>
          </div>

          {headline && (
            <p className="person-headline">{headline}</p>
          )}

          <div className="person-meta">
            {location && (
              <span className="person-meta-item">
                <MapPin size={11} aria-hidden="true" /> {location}
              </span>
            )}
            {person.mutual_count > 0 && (
              <span className="person-meta-item mutual">
                <Users size={11} aria-hidden="true" />
                {person.mutual_count} mutual
              </span>
            )}
          </div>
        </div>

        <div className="person-card-actions">
          <Link
            href={`/people/${person.id}`}
            className="person-view-btn"
            aria-label={`View ${name}'s profile`}
          >
            View
          </Link>
          <ConnectionButton
            targetId={person.id}
            initialStatus={person.connection_status}
            requestId={person.request_id}
            size="sm"
          />
        </div>
      </div>
    );
  }

  // Card view
  return (
    <article
      className={`person-card person-card-grid ${className}`}
      tabIndex={0}
      aria-label={`${name} profile card`}
    >
      {/* Avatar */}
      <div className="person-card-avatar-wrap">
        <UserAvatar
          name={name}
          avatarUrl={person.avatar_url ?? undefined}
          size={64}
        />
        {person.is_verified && (
          <span
            className={`person-verified-dot ${person.has_golden_tick ? 'golden' : ''}`}
            title={person.has_golden_tick ? 'Golden Tick — Verified Premium Member' : 'Verified Business Member'}
            aria-label={person.has_golden_tick ? 'Verified premium' : 'Verified'}
          >
            {person.has_golden_tick ? '★' : '✓'}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="person-card-info">
        <Link
          href={`/people/${person.id}`}
          className="person-name-link"
          tabIndex={0}
        >
          {name}
        </Link>

        {(person.designation || person.position) && (
          <p className="person-designation">
            <Award size={11} aria-hidden="true" />
            {person.designation || person.position}
          </p>
        )}

        {person.company_name && (
          <p className="person-company">
            <Building2 size={11} aria-hidden="true" />
            {person.company_name}
          </p>
        )}

        {location && (
          <p className="person-location">
            <MapPin size={11} aria-hidden="true" />
            {location}
          </p>
        )}
      </div>

      {/* Skills chips (top 3) */}
      {person.skills && person.skills.length > 0 && (
        <div className="person-skills" aria-label="Skills">
          {person.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="person-skill-chip">{skill}</span>
          ))}
          {person.skills.length > 3 && (
            <span className="person-skill-chip more">+{person.skills.length - 3}</span>
          )}
        </div>
      )}

      {/* Mutual connections */}
      {person.mutual_count > 0 && (
        <p className="person-mutual">
          <Users size={12} aria-hidden="true" />
          {person.mutual_count} mutual connection{person.mutual_count !== 1 ? 's' : ''}
        </p>
      )}

      {/* Actions */}
      <div className="person-card-footer">
        <Link
          href={`/people/${person.id}`}
          className="person-view-btn full"
          aria-label={`View ${name}'s profile`}
        >
          View Profile
        </Link>
        <ConnectionButton
          targetId={person.id}
          initialStatus={person.connection_status}
          requestId={person.request_id}
          size="sm"
        />
      </div>
    </article>
  );
}

/** Skeleton placeholder shown during loading */
export function PersonCardSkeleton({ view = 'card' }: { view?: 'card' | 'list' }) {
  if (view === 'list') {
    return (
      <div className="person-card person-card-list skeleton" aria-hidden="true">
        <div className="skeleton-circle" style={{ width: 40, height: 40 }} />
        <div className="person-card-body">
          <div className="skeleton-bar" style={{ width: '40%', height: 14 }} />
          <div className="skeleton-bar" style={{ width: '60%', height: 12, marginTop: 6 }} />
          <div className="skeleton-bar" style={{ width: '30%', height: 11, marginTop: 6 }} />
        </div>
        <div className="skeleton-bar" style={{ width: 80, height: 30 }} />
      </div>
    );
  }
  return (
    <div className="person-card person-card-grid skeleton" aria-hidden="true">
      <div className="skeleton-circle" style={{ width: 64, height: 64, margin: '0 auto' }} />
      <div className="skeleton-bar" style={{ width: '60%', height: 16, margin: '8px auto' }} />
      <div className="skeleton-bar" style={{ width: '80%', height: 12, margin: '4px auto' }} />
      <div className="skeleton-bar" style={{ width: '50%', height: 11, margin: '4px auto' }} />
    </div>
  );
}
