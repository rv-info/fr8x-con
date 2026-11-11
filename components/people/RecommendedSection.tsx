'use client';

/**
 * components/people/RecommendedSection.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * "People You May Know" Recommendations Component
 * Displays explainable connection suggestions based on mutuals & trade lanes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, MapPin, Building2, Users } from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ConnectionButton, ConnectionStatus } from './ConnectionButton';

export interface RecommendedMember {
  id: string;
  full_name: string;
  display_name: string;
  headline: string;
  company: string;
  location: string;
  avatar_url: string | null;
  is_verified: boolean;
  has_golden_tick: boolean;
  mutual_count: number;
  score: number;
  primary_reason: string;
  connection_status: ConnectionStatus;
}

export function RecommendedSection() {
  const [recommendations, setRecommendations] = useState<RecommendedMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/people/recommendations?limit=4')
      .then(async (res) => {
        if (!res.ok) return [];
        const data = await res.json();
        return (data.data || []) as RecommendedMember[];
      })
      .then((recs) => setRecommendations(recs))
      .catch(() => setRecommendations([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading || recommendations.length === 0) {
    return null;
  }

  return (
    <section className="people-recommended-section" aria-label="Recommended professionals">
      <div className="people-recommended-header" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        <Sparkles size={16} style={{ color: '#000000' }} aria-hidden="true" />
        <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: '#000000' }}>People You May Know</h2>
      </div>

      <div
        className="people-recommended-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        {recommendations.map((person) => (
          <div
            key={person.id}
            className="person-card"
            style={{
              padding: '1rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              background: '#FFFFFF',
              border: '1px solid #E6E6E6',
              borderRadius: '6px',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <UserAvatar name={person.full_name} avatarUrl={person.avatar_url ?? undefined} size={44} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link
                    href={`/network/${person.id}`}
                    style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#000000', textDecoration: 'none' }}
                  >
                    {person.full_name}
                    {person.has_golden_tick && (
                      <span className="golden-tick-badge" title="Golden Tick" style={{ marginLeft: 4, color: '#000000' }}>★</span>
                    )}
                    {person.is_verified && !person.has_golden_tick && (
                      <span className="verified-badge" title="Verified" style={{ marginLeft: 4, color: '#000000' }}>✓</span>
                    )}
                  </Link>
                  {person.headline && (
                    <p style={{ fontSize: '0.8125rem', color: '#000000', margin: '0.125rem 0' }}>
                      {person.headline}
                    </p>
                  )}
                  {person.location && (
                    <p style={{ fontSize: '0.75rem', color: '#000000', margin: 0, display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                      <MapPin size={10} aria-hidden="true" style={{ color: '#000000' }} /> {person.location}
                    </p>
                  )}
                </div>
              </div>

              {/* Explainable recommendation badge */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  backgroundColor: '#FFFFFF',
                  color: '#000000',
                  border: '1px solid #E6E6E6',
                  marginBottom: '0.75rem',
                }}
              >
                <Users size={11} aria-hidden="true" style={{ color: '#000000' }} />
                <span>{person.primary_reason}</span>
              </div>
            </div>

            <ConnectionButton
              targetId={person.id}
              initialStatus={person.connection_status}
              size="sm"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
