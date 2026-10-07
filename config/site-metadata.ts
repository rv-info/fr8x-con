/**
 * config/site-metadata.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FR8X Authoritative Site Metadata Configuration.
 * Centralized, typed source of truth for site branding, titles, publisher,
 * localization, social profiles, and corporate contact details.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface SiteSocialProfiles {
  twitterHandle: string;
  twitterUrl: string;
  linkedinUrl: string;
  youtubeUrl?: string;
}

export interface SiteContactInfo {
  supportEmail: string;
  techEmail: string;
  securityEmail: string;
  operationsEmail: string;
  phone?: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
}

export interface SiteMetadata {
  siteName: string;
  legalName: string;
  tagline: string;
  description: string;
  defaultTitle: string;
  titleTemplate: string;
  siteUrl: string;
  publisher: string;
  applicationCategory: string;
  language: string;
  locale: string;
  themeColor: string;
  social: SiteSocialProfiles;
  contact: SiteContactInfo;
}

const rawSiteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || 'https://con.fr8x.in';
export const SITE_URL = rawSiteUrl.replace(/\/+$/, '');

export const siteMetadata: SiteMetadata = {
  siteName: 'FR8X',
  legalName: 'FR8X Logistics Technologies Private Limited',
  tagline: 'Global Multimodal Freight Forwarding & Reverse Bidding Platform',
  description:
    'Enterprise-grade digital logistics and multimodal freight forwarding workspace. Real-time spot reverse auctions, verified carrier nexus ratings, container tracking, and instant quote intelligence.',
  defaultTitle: 'FR8X | Multimodal Freight Logistics & Reverse Bidding Platform',
  titleTemplate: '%s | FR8X Freight Platform',
  siteUrl: SITE_URL,
  publisher: 'FR8X',
  applicationCategory: 'LogisticsApplication',
  language: 'en',
  locale: 'en_IN',
  themeColor: '#0f172a',
  social: {
    twitterHandle: '@fr8x_in',
    twitterUrl: 'https://twitter.com/fr8x_in',
    linkedinUrl: 'https://www.linkedin.com/company/fr8x',
  },
  contact: {
    supportEmail: 'support@fr8x.in',
    techEmail: 'tech@fr8x.in',
    securityEmail: 'tech@fr8x.in',
    operationsEmail: 'ops@fr8x.in',
    address: {
      street: 'Corporate Logistics Center, Marol, Andheri East',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400059',
    },
  },
};

/**
 * Validates required configuration keys and returns the typed metadata object.
 */
export function getSiteMetadata(): SiteMetadata {
  if (!siteMetadata.siteUrl) {
    throw new Error('[SiteMetadata] NEXT_PUBLIC_APP_URL or fallback siteUrl is missing.');
  }
  return siteMetadata;
}
