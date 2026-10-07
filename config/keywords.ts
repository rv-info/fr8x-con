/**
 * config/keywords.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FR8X Authoritative Freight & Logistics Domain Keywords.
 * Organizes domain terminology into structured thematic groups and routes.
 * Used to guide page titles, headings, content copywriting, and semantic search
 * without obsolete meta-keywords tag stuffing.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface KeywordGroup {
  id: string;
  name: string;
  description: string;
  terms: string[];
}

export const KEYWORD_GROUPS: Record<string, KeywordGroup> = {
  corePlatform: {
    id: 'corePlatform',
    name: 'Digital Freight Platform',
    description: 'Foundational concepts for modern digital freight marketplaces.',
    terms: [
      'digital freight forwarding',
      'multimodal logistics platform',
      'freight marketplace India',
      'enterprise supply chain workspace',
      'logistics collaboration network',
      'verified cargo transporters',
    ],
  },
  reverseAuctions: {
    id: 'reverseAuctions',
    name: 'Freight Reverse Auctions & Spot Bidding',
    description: 'Dynamic price discovery and spot load tender mechanisms.',
    terms: [
      'freight reverse auction',
      'spot freight bidding',
      'real-time freight tender',
      'reverse auction logistics',
      'transparent freight bidding',
      'carrier quote comparison',
      'lowest price freight bids',
    ],
  },
  truckingAndFleet: {
    id: 'truckingAndFleet',
    name: 'Full Truckload & Road Transport',
    description: 'Intercity surface transport and commercial fleet procurement.',
    terms: [
      'full truckload freight FTL',
      'intercity transport marketplace',
      'verified fleet owners',
      'GPS vehicle tracking logistics',
      'container trailer booking',
      'open body and closed container trucks',
    ],
  },
  oceanAndMultimodal: {
    id: 'oceanAndMultimodal',
    name: 'Ocean Freight & Multimodal Corridors',
    description: 'Containerized maritime transport, rail freight, and port connectivity.',
    terms: [
      'FCL container shipping rates',
      'ocean freight forwarder India',
      'port container transport',
      'multimodal transport operator MTO',
      'customs bonded cargo movement',
      'air cargo charter booking',
    ],
  },
  statutoryCompliance: {
    id: 'statutoryCompliance',
    name: 'Statutory Compliance & Settlement',
    description: 'Legal, tax, security, and financial settlement in Indian freight logistics.',
    terms: [
      'GSTN verified freight billing',
      'e-way bill logistics compliance',
      'Fastag toll reconciliation',
      'freight escrow payment protection',
      'in-transit cargo insurance',
      'statutory KYC logistics directory',
    ],
  },
};

/**
 * Route-to-keyword group associations.
 * Guides headings, breadcrumbs, and descriptive body copy for each route.
 */
export const ROUTE_KEYWORD_MAP: Record<string, string[]> = {
  '/': [
    'digital freight forwarding',
    'multimodal logistics platform',
    'freight marketplace India',
    'enterprise supply chain workspace',
  ],
  '/auctions': [
    'freight reverse auction',
    'spot freight bidding',
    'real-time freight tender',
    'transparent freight bidding',
  ],
  '/rates': [
    'carrier quote comparison',
    'FCL container shipping rates',
    'full truckload freight FTL',
    'spot freight benchmarking',
  ],
  '/directory': [
    'verified fleet owners',
    'multimodal transport operator MTO',
    'verified cargo transporters',
    'statutory KYC logistics directory',
  ],
  '/privacy': [
    'freight escrow payment protection',
    'statutory compliance',
    'enterprise supply chain workspace',
  ],
};

/**
 * Returns prioritized keywords mapped to a specific pathname.
 */
export function getKeywordsForRoute(pathname: string): string[] {
  const normalized = pathname.replace(/\/+$/, '') || '/';
  if (ROUTE_KEYWORD_MAP[normalized]) {
    return ROUTE_KEYWORD_MAP[normalized];
  }
  // Fall back to core platform keywords
  return KEYWORD_GROUPS.corePlatform.terms;
}

/**
 * Returns the primary lead keyword for a route to inform page H1 headings and summaries.
 */
export function getPrimaryKeywordForRoute(pathname: string): string {
  const keywords = getKeywordsForRoute(pathname);
  return keywords[0] || 'digital freight logistics';
}
