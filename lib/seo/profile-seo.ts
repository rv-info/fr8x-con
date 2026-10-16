/**
 * lib/seo/profile-seo.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FR8X Automated Member Profile SEO Engine
 *
 * Implements:
 * 1. Automatic generation of public-profile slugs, canonical URLs, page titles,
 *    and meta descriptions.
 * 2. Privacy-first search engine indexing:
 *    - Default indexing is OFF (noindex, nofollow) until the user explicitly
 *      opts in via privacy_settings.allowPublicIndexing === true.
 *    - Respects opt-out, immediately applying 'noindex, nofollow' and sitemap exclusion.
 * 3. Zero-exposure PII protection:
 *    - Strictly strips email addresses, phone/mobile numbers, tax identifiers
 *      (GSTN, PAN, CIN, IEC), internal credentials, and private company records.
 * 4. Schema.org JSON-LD structured data (ProfilePage / Person).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from 'next';
import { SITE_URL } from '@/config/site-metadata';

export interface ProfileSeoInput {
  id: string;
  uid?: string;
  displayName?: string | null;
  display_name?: string | null;
  firstName?: string | null;
  first_name?: string | null;
  lastName?: string | null;
  last_name?: string | null;
  company?: string | null;
  company_name?: string | null;
  designation?: string | null;
  position?: string | null;
  city?: string | null;
  country?: string | null;
  location?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  slug?: string | null;
  is_verified?: boolean | null;
  has_golden_tick?: boolean | null;
  privacy_settings?: Record<string, any> | null;
  privacySettings?: Record<string, any> | null;
  updated_at?: string | null;
}

/**
 * Generates an SEO-safe URL slug from the user's name and unique ID fragment.
 * e.g. "Kumar R" + "uuid-12345678" -> "kumar-r-12345678"
 */
export function generateProfileSlug(name?: string | null, id?: string | null): string {
  const cleanName = (name || 'member')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'member';

  const idSuffix = (id || '')
    .replace(/[^a-z0-9]/gi, '')
    .slice(0, 8)
    .toLowerCase();

  return idSuffix ? `${cleanName}-${idSuffix}` : cleanName;
}

/**
 * Checks if a member profile has explicitly given consent for public search engine indexing.
 * Default is FALSE (opt-in only) to protect member privacy under DPDPA / GDPR.
 */
export function isProfilePubliclyIndexable(profile: ProfileSeoInput | null): boolean {
  if (!profile) return false;
  const settings = profile.privacy_settings || profile.privacySettings || {};
  // Explicit opt-in required: must be strictly boolean true (on settings or profile root)
  return settings.allowPublicIndexing === true || (profile as any).allowPublicIndexing === true;
}

/**
 * Resolves safe public display name without disclosing private identity details.
 */
export function getSafeDisplayName(profile: ProfileSeoInput): string {
  const candidate =
    profile.displayName ||
    profile.display_name ||
    [profile.firstName || profile.first_name, profile.lastName || profile.last_name].filter(Boolean).join(' ');

  if (!candidate || candidate.trim().length === 0) {
    return 'FR8X Member';
  }

  // Never expose raw email address as name
  if (candidate.includes('@')) {
    return candidate.split('@')[0];
  }

  return candidate.trim();
}

/**
 * Generates Next.js Metadata for a public profile view.
 */
export function generateProfileMetadata(profile: ProfileSeoInput | null): Metadata {
  if (!profile || !profile.id) {
    return {
      title: 'Member Profile | FR8X Freight Network',
      description: 'Verified logistics and freight forwarder profile on the FR8X network.',
      robots: {
        index: false,
        follow: false,
        noarchive: true,
        nosnippet: true,
      },
    };
  }

  const displayName = getSafeDisplayName(profile);
  const designation = profile.designation || profile.position || 'Freight Logistics Professional';
  const company = profile.company || profile.company_name || 'Enterprise Logistics';
  const location = profile.location || [profile.city, profile.country].filter(Boolean).join(', ') || 'Global';

  const canonicalUrl = `${SITE_URL}/people/${profile.id}`;
  const isIndexable = isProfilePubliclyIndexable(profile);

  const title = `${displayName} — ${designation} at ${company} | FR8X`;
  const description = `${displayName} is a ${designation} at ${company} based in ${location}. Connect, view verified credentials, and exchange freight inquiries on the FR8X B2B network.`;

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
    },
    robots: isIndexable
      ? {
          index: true,
          follow: true,
          nocache: false,
          googleBot: {
            index: true,
            follow: true,
            'max-snippet': -1,
            'max-image-preview': 'large',
          },
        }
      : {
          index: false,
          follow: false,
          noarchive: true,
          nosnippet: true,
        },
    openGraph: {
      type: 'profile',
      url: canonicalUrl,
      title,
      description,
      siteName: 'FR8X Freight Workspace',
      images: [
        {
          url: profile.avatarUrl || profile.avatar_url || `${SITE_URL}/FR8X ICON.png`,
          width: 512,
          height: 512,
          alt: `${displayName} - FR8X Profile`,
        },
      ],
    },
    twitter: {
      card: 'summary',
      title,
      description,
      images: [profile.avatarUrl || profile.avatar_url || `${SITE_URL}/FR8X ICON.png`],
    },
  };
}

/**
 * Generates Schema.org JSON-LD structured data for public indexing.
 * Strips all private contact details, credentials, and tax IDs.
 */
export function generateProfileStructuredData(profile: ProfileSeoInput | null): Record<string, any> | null {
  if (!profile || !isProfilePubliclyIndexable(profile)) {
    return null;
  }

  const displayName = getSafeDisplayName(profile);
  const designation = profile.designation || profile.position || 'Freight Professional';
  const company = profile.company || profile.company_name || 'Enterprise Logistics';

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'Person',
      name: displayName,
      jobTitle: designation,
      worksFor: {
        '@type': 'Organization',
        name: company,
      },
      ...(profile.city || profile.country
        ? {
            address: {
              '@type': 'PostalAddress',
              addressLocality: profile.city || undefined,
              addressCountry: profile.country || undefined,
            },
          }
        : {}),
    },
  };
}
