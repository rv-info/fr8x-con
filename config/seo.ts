/**
 * config/seo.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FR8X Authoritative SEO & Social Graph Configuration.
 * Canonical URL rules, Open Graph/Twitter defaults, robots policy, sitemap
 * routes, and per-route SEO overrides for Next.js 14 App Router.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { Metadata } from 'next';
import { siteMetadata, SITE_URL } from './site-metadata';

export interface RouteSeoConfig {
  title: string;
  description: string;
  path: string;
  noIndex?: boolean;
  priority?: number;
  changeFrequency?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  keywords?: string[];
}

export const canonicalUrlRules = {
  baseUrl: SITE_URL,
  enforceTrailingSlash: false,
  enforceHttps: true,
};

/**
 * Normalizes and produces an absolute canonical URL for a given relative or absolute path.
 */
export function getCanonicalUrl(pathname: string = '/'): string {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
  const normalized = cleanPath === '/' ? '' : cleanPath.replace(/\/+$/, '');
  return `${SITE_URL}${normalized}`;
}

export const defaultOpenGraph = {
  type: 'website',
  locale: siteMetadata.locale,
  url: SITE_URL,
  siteName: siteMetadata.siteName,
  title: siteMetadata.defaultTitle,
  description: siteMetadata.description,
  images: [
    {
      url: `${SITE_URL}/logo.png`,
      width: 512,
      height: 512,
      alt: 'FR8X Freight Platform Logo',
      type: 'image/png',
    },
  ],
};

export const defaultTwitterCard = {
  card: 'summary_large_image' as const,
  site: siteMetadata.social.twitterHandle,
  creator: siteMetadata.social.twitterHandle,
  title: siteMetadata.defaultTitle,
  description: siteMetadata.description,
  images: [`${SITE_URL}/logo.png`],
};

export const robotsPolicy = {
  rules: [
    {
      userAgent: '*',
      allow: [
        '/',
        '/auctions',
        '/rates',
        '/directory',
        '/about',
        '/privacy',
        '/terms',
        '/contact',
      ],
      disallow: [
        '/api/',
        '/godfather/',
        '/godfatheron/',
        '/GODFATHERON/',
        '/dashboard/',
        '/profile/',
        '/nexus/',
        '/feeds/',
        '/jobs/',
        '/_next/',
      ],
    },
  ],
  sitemap: `${SITE_URL}/sitemap.xml`,
  host: SITE_URL,
};

/**
 * Authoritative per-route SEO definitions for indexable and public surfaces.
 */
export const routeSeoConfigs: Record<string, RouteSeoConfig> = {
  home: {
    path: '/',
    title: 'FR8X | Multimodal Freight Logistics & Reverse Bidding Platform',
    description:
      'Digital freight logistics workspace for shippers, fleet owners, and freight forwarders. Real-time reverse auctions, instant rate intelligence, and verified logistics partners.',
    priority: 1.0,
    changeFrequency: 'daily',
  },
  auctions: {
    path: '/auctions',
    title: 'Live Freight Reverse Auctions & Spot Bidding',
    description:
      'Participate in real-time freight reverse auctions. Submit bids, compare lanes, decrement spot pricing, and secure verified cargo loads across road, rail, and ocean corridors.',
    priority: 0.9,
    changeFrequency: 'hourly',
  },
  rates: {
    path: '/rates',
    title: 'Spot & Contract Freight Rate Intelligence',
    description:
      'Compare transparent freight rates across domestic trucking, FCL ocean container shipping, and intermodal corridors. Real-time rate benchmarking for commercial logistics.',
    priority: 0.8,
    changeFrequency: 'daily',
  },
  directory: {
    path: '/directory',
    title: 'Verified Freight Forwarder & Fleet Owner Directory',
    description:
      'Search verified logistics enterprises, licensed multimodal transport operators, customs brokers, and commercial fleet owners across India and global trade hubs.',
    priority: 0.7,
    changeFrequency: 'weekly',
  },
  privacy: {
    path: '/privacy',
    title: 'Enterprise Privacy Policy & Data Governance',
    description:
      'FR8X privacy principles, statutory data compliance, cryptographic access safeguards, and business records retention standards.',
    priority: 0.3,
    changeFrequency: 'monthly',
  },
  login: {
    path: '/login',
    title: 'Sign In to FR8X Workspace',
    description: 'Secure enterprise authentication portal for FR8X logistics workspace users.',
    noIndex: true,
  },
  register: {
    path: '/register',
    title: 'Register Corporate Logistics Account',
    description: 'Onboard your freight forwarding, manufacturing, or fleet business onto the FR8X network.',
    noIndex: true,
  },
};

/**
 * Builds standard Next.js App Router Metadata for any route, merging defaults with overrides.
 */
export function buildRouteMetadata(routeKey: keyof typeof routeSeoConfigs | string, customOverrides?: Partial<Metadata>): Metadata {
  const route = routeSeoConfigs[routeKey];
  const title = route?.title || siteMetadata.defaultTitle;
  const description = route?.description || siteMetadata.description;
  const canonical = getCanonicalUrl(route?.path || '/');

  const base: Metadata = {
    title,
    description,
    alternates: {
      canonical,
    },
    openGraph: {
      ...defaultOpenGraph,
      title,
      description,
      url: canonical,
    },
    twitter: {
      ...defaultTwitterCard,
      title,
      description,
    },
    robots: route?.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
  };

  return { ...base, ...customOverrides };
}
