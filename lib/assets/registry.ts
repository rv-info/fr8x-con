/**
 * lib/assets/registry.ts
 * FR8X Centralized Asset Registry
 * 
 * All application icons, logos and graphic assets are cataloged here.
 * Components reference assets by stable ID, avoiding hardcoded paths.
 * Administrators can upload/replace assets through the Icons & Branding panel.
 */

export type AssetCategory =
  | 'app-logo'
  | 'sidebar-icon'
  | 'nav-icon'
  | 'module-icon'
  | 'dashboard-icon'
  | 'action-icon'
  | 'notification-icon'
  | 'transportation-icon'
  | 'empty-state'
  | 'print-logo'
  | 'profile-avatar'
  | 'misc';

export type AssetFormat = 'png' | 'gif' | 'svg' | 'webp' | 'jpg';

export interface AssetDefinition {
  id: string;               // Unique stable asset ID
  name: string;             // Display name
  category: AssetCategory;
  module: string;           // Functional module
  purpose: string;          // Intended UI context
  defaultPath: string;      // Current asset location
  recommendedFileName: string;
  supportedFormats: AssetFormat[];
  recommendedDimensions: string;
  recommendedWidth: number;
  recommendedHeight: number;
  preserveTransparency: boolean;
  supportsAnimation: boolean;
  replacementInstructions: string;
}

/**
 * MASTER ASSET REGISTRY
 * Genuine inventory of icons and visual assets across FR8X.
 */
export const ASSET_REGISTRY: AssetDefinition[] = [
  // ─── APPLICATION LOGOS ──────────────────────────────────────────
  {
    id: 'fr8x-logo',
    name: 'FR8X Primary Brand Logo',
    category: 'app-logo',
    module: 'Global / Header / Auth',
    purpose: 'Primary corporate identity logo used in TopBar, Sidebar header, login and registration screens',
    defaultPath: '/ART/LOGOS/logo_primary.png',
    recommendedFileName: 'logo_primary.png',
    supportedFormats: ['png', 'svg', 'webp'],
    recommendedDimensions: '120x40px',
    recommendedWidth: 120,
    recommendedHeight: 40,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 32-bit PNG or SVG with transparent background. Preserve aspect ratio to prevent horizontal stretching.',
  },
  {
    id: 'fr8x-logo-mark',
    name: 'FR8X Logo Square Mark',
    category: 'app-logo',
    module: 'Sidebar / Mobile Header',
    purpose: 'Square brand icon displayed when sidebar is collapsed or on mobile header',
    defaultPath: '/ART/LOGOS/logo_primary.png',
    recommendedFileName: 'logo_primary.png',
    supportedFormats: ['png', 'svg', 'webp'],
    recommendedDimensions: '48x48px',
    recommendedWidth: 48,
    recommendedHeight: 48,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 1:1 square PNG with transparent background. Optimized for 24-32px display size.',
  },
  {
    id: 'fr8x-logo-print',
    name: 'FR8X High-Res Print Logo',
    category: 'print-logo',
    module: 'Invoices / Quotations / Print',
    purpose: 'High-resolution logo embedded in printable invoices, RFQ PDF schedules and rate sheets',
    defaultPath: '/ART/LOGOS/logo_primary.png',
    recommendedFileName: 'logo_primary.png',
    supportedFormats: ['png'],
    recommendedDimensions: '400x120px',
    recommendedWidth: 400,
    recommendedHeight: 120,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload high-resolution 300 DPI PNG with transparent background for crisp document printing.',
  },

  // ─── SIDEBAR & NAVIGATION ICONS ─────────────────────────────────
  {
    id: 'icon-dashboard',
    name: 'Dashboard Nav Icon',
    category: 'sidebar-icon',
    module: 'Dashboard (/dashboard)',
    purpose: 'Sidebar speedometer/layout dashboard icon for executive KPI overview',
    defaultPath: '/ART/ICONS/navigation_dashboard.png',
    recommendedFileName: 'navigation_dashboard.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '24x24px',
    recommendedWidth: 24,
    recommendedHeight: 24,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 24x24px transparent PNG or SVG. Vector outline in Navy #1B2B4B or monochrome.',
  },
  {
    id: 'icon-feeds',
    name: 'Feeds Nav Icon',
    category: 'sidebar-icon',
    module: 'Feeds (/feeds)',
    purpose: 'Sidebar RSS/signal feed icon for logistics updates, broadcasts and industry announcements',
    defaultPath: '/ART/ICONS/navigation_feeds.png',
    recommendedFileName: 'navigation_feeds.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '24x24px',
    recommendedWidth: 24,
    recommendedHeight: 24,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 24x24px transparent PNG or SVG outline.',
  },
  {
    id: 'icon-nexus',
    name: 'Nexus Trade Hub Icon',
    category: 'sidebar-icon',
    module: 'Nexus (/nexus)',
    purpose: 'Sidebar globe icon for international trade intelligence, messaging and verified bilateral inquiries',
    defaultPath: '/ART/ICONS/navigation_nexus.png',
    recommendedFileName: 'navigation_nexus.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '24x24px',
    recommendedWidth: 24,
    recommendedHeight: 24,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 24x24px transparent PNG or animated GIF for subtle live trade hub motion.',
  },
  {
    id: 'icon-auctions',
    name: 'Reverse Auctions Gavel Icon',
    category: 'sidebar-icon',
    module: 'Auctions (/auctions)',
    purpose: 'Sidebar gavel icon for live reverse freight tenders, spot container auctions and bidding rooms',
    defaultPath: '/ART/ICONS/navigation_auctions.png',
    recommendedFileName: 'navigation_auctions.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '24x24px',
    recommendedWidth: 24,
    recommendedHeight: 24,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 24x24px transparent PNG with high contrast on #EEF2F7 sidebar background.',
  },
  {
    id: 'icon-rates',
    name: 'Freight Rates Chart Icon',
    category: 'sidebar-icon',
    module: 'Rates (/rates)',
    purpose: 'Sidebar bar chart icon for spot ocean freight indices, FCL/LCL market benchmarks and port rate discovery',
    defaultPath: '/ART/ICONS/navigation_rates.png',
    recommendedFileName: 'navigation_rates.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '24x24px',
    recommendedWidth: 24,
    recommendedHeight: 24,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 24x24px transparent PNG or SVG outline.',
  },
  {
    id: 'icon-network',
    name: 'Network & People Icon',
    category: 'sidebar-icon',
    module: 'Network (/network)',
    purpose: 'Sidebar users icon for verified freight forwarding network, partner discovery and bilateral connections',
    defaultPath: '/ART/ICONS/navigation_network.png',
    recommendedFileName: 'navigation_network.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '24x24px',
    recommendedWidth: 24,
    recommendedHeight: 24,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 24x24px transparent PNG or SVG.',
  },
  {
    id: 'icon-jobs',
    name: 'Logistics Jobs Briefcase Icon',
    category: 'sidebar-icon',
    module: 'Jobs (/jobs)',
    purpose: 'Sidebar briefcase icon for maritime logistics career postings, freight agent opportunities and talent',
    defaultPath: '/ART/ICONS/navigation_jobs.png',
    recommendedFileName: 'navigation_jobs.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '24x24px',
    recommendedWidth: 24,
    recommendedHeight: 24,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 24x24px transparent PNG or SVG outline.',
  },
  {
    id: 'icon-profile',
    name: 'Enterprise Profile User Icon',
    category: 'sidebar-icon',
    module: 'Profile (/profile)',
    purpose: 'Sidebar user badge icon for corporate passport, business credentials and KYC compliance verification',
    defaultPath: '/ART/ICONS/navigation_profile.png',
    recommendedFileName: 'navigation_profile.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '24x24px',
    recommendedWidth: 24,
    recommendedHeight: 24,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 24x24px transparent PNG or SVG.',
  },

  // ─── TRANSPORTATION & CARGO MODES ───────────────────────────────
  {
    id: 'icon-sea-freight',
    name: 'Ocean Vessel / Ship Icon',
    category: 'transportation-icon',
    module: 'Rates / Auctions / Schedulers',
    purpose: 'Ocean vessel graphic representing maritime freight, container liner services and port-to-port voyages',
    defaultPath: '/ART/ICONS/transport_ship.png',
    recommendedFileName: 'transport_ship.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '32x32px',
    recommendedWidth: 32,
    recommendedHeight: 32,
    preserveTransparency: true,
    supportsAnimation: true,
    replacementInstructions: 'Upload 32x32px or 48x48px transparent PNG or animated GIF for active transit depiction.',
  },
  {
    id: 'icon-air-freight',
    name: 'Air Cargo Aviation Icon',
    category: 'transportation-icon',
    module: 'Rates / Quotes / Operations',
    purpose: 'Aircraft silhouette representing expedited air freight, IATA customs airport transit and cargo flights',
    defaultPath: '/ART/ICONS/transport_air.png',
    recommendedFileName: 'transport_air.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '32x32px',
    recommendedWidth: 32,
    recommendedHeight: 32,
    preserveTransparency: true,
    supportsAnimation: true,
    replacementInstructions: 'Upload 32x32px transparent PNG or SVG.',
  },
  {
    id: 'icon-road-transport',
    name: 'Inland Drayage / Truck Icon',
    category: 'transportation-icon',
    module: 'Auctions / Rates / First-Last Mile',
    purpose: 'Heavy commercial vehicle icon for inland container drayage, CFS movement and multimodal road carriage',
    defaultPath: '/ART/ICONS/transport_truck.png',
    recommendedFileName: 'transport_truck.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '32x32px',
    recommendedWidth: 32,
    recommendedHeight: 32,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 32x32px transparent PNG.',
  },
  {
    id: 'icon-container-box',
    name: 'ISO Shipping Container Icon',
    category: 'transportation-icon',
    module: 'Auctions / Quotations / Cargo',
    purpose: 'Standard 20ft/40ft intermodal ISO freight container symbol for equipment breakdown and packaging specs',
    defaultPath: '/ART/ICONS/transport_container.png',
    recommendedFileName: 'transport_container.png',
    supportedFormats: ['png', 'svg'],
    recommendedDimensions: '24x24px',
    recommendedWidth: 24,
    recommendedHeight: 24,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 24x24px transparent PNG or SVG.',
  },

  // ─── NOTIFICATION & ACTION GRAPHICS ─────────────────────────────
  {
    id: 'icon-notification-bell',
    name: 'Notification Bell Graphic',
    category: 'notification-icon',
    module: 'TopBar / Notification Center',
    purpose: 'Interactive alert bell indicating unread business events, bid updates, rate changes and invitations',
    defaultPath: '/ART/ICONS/action_notification.png',
    recommendedFileName: 'action_notification.png',
    supportedFormats: ['png', 'svg', 'gif'],
    recommendedDimensions: '24x24px',
    recommendedWidth: 24,
    recommendedHeight: 24,
    preserveTransparency: true,
    supportsAnimation: true,
    replacementInstructions: 'Upload 24x24px transparent PNG or animated GIF for subtle ringing alert on pending bids.',
  },
  {
    id: 'icon-currency-calc',
    name: 'Currency Calculator Icon',
    category: 'action-icon',
    module: 'TopBar / Financial Controls',
    purpose: 'Direct currency conversion modal trigger supporting live USD, EUR, INR, AED, SGD, and GBP parity',
    defaultPath: '/ART/ICONS/action_calculator.png',
    recommendedFileName: 'action_calculator.png',
    supportedFormats: ['png', 'svg'],
    recommendedDimensions: '20x20px',
    recommendedWidth: 20,
    recommendedHeight: 20,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 20x20px transparent PNG or SVG.',
  },
  {
    id: 'icon-golden-tick',
    name: 'Verified Enterprise Golden Tick',
    category: 'action-icon',
    module: 'Global / Member Directory',
    purpose: 'Authoritative gold verification badge rendered alongside verified freight forwarding enterprise profiles',
    defaultPath: '/ART/ICONS/status_verified.png',
    recommendedFileName: 'status_verified.png',
    supportedFormats: ['png', 'svg'],
    recommendedDimensions: '16x16px',
    recommendedWidth: 16,
    recommendedHeight: 16,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 16x16px transparent PNG with crisp gold emblem border.',
  },

  // ─── EMPTY STATE ILLUSTRATIONS ──────────────────────────────────
  {
    id: 'empty-auctions',
    name: 'No Live Auctions Illustration',
    category: 'empty-state',
    module: 'Auctions (/auctions)',
    purpose: 'Clean minimal empty state graphic shown when no live reverse tenders match current filter parameters',
    defaultPath: '/ART/ILLUSTRATIONS/illustration_empty_auctions.png',
    recommendedFileName: 'illustration_empty_auctions.png',
    supportedFormats: ['png', 'svg', 'webp'],
    recommendedDimensions: '160x160px',
    recommendedWidth: 160,
    recommendedHeight: 160,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 160x160px transparent PNG illustration in restrained Navy and Steel Blue tones.',
  },
  {
    id: 'empty-rates',
    name: 'No Spot Rates Found Illustration',
    category: 'empty-state',
    module: 'Rates (/rates)',
    purpose: 'Empty state illustration shown when no spot freight tariffs exist for the chosen origin/destination pair',
    defaultPath: '/ART/ILLUSTRATIONS/illustration_empty_rates.png',
    recommendedFileName: 'illustration_empty_rates.png',
    supportedFormats: ['png', 'svg', 'webp'],
    recommendedDimensions: '160x160px',
    recommendedWidth: 160,
    recommendedHeight: 160,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 160x160px transparent PNG in neutral Corporate Premium palette.',
  },
  {
    id: 'empty-jobs',
    name: 'No Job Openings Illustration',
    category: 'empty-state',
    module: 'Jobs (/jobs)',
    purpose: 'Empty state illustration displayed when no maritime freight vacancies are open for application',
    defaultPath: '/ART/ILLUSTRATIONS/illustration_empty_jobs.png',
    recommendedFileName: 'illustration_empty_jobs.png',
    supportedFormats: ['png', 'svg', 'webp'],
    recommendedDimensions: '160x160px',
    recommendedWidth: 160,
    recommendedHeight: 160,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 160x160px transparent PNG.',
  },
  {
    id: 'profile-default',
    name: 'Default User Avatar Graphic',
    category: 'profile-avatar',
    module: 'Global / UserAvatar / Profile',
    purpose: 'Default personal avatar placeholder graphic with transparent alpha backing',
    defaultPath: '/ART/PROFILE/profile_default.png',
    recommendedFileName: 'profile_default.png',
    supportedFormats: ['png', 'webp'],
    recommendedDimensions: '160x160px',
    recommendedWidth: 160,
    recommendedHeight: 160,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 160x160px transparent PNG personal avatar placeholder.',
  },
  {
    id: 'fr8x-infinity-icon',
    name: 'FR8X Infinity Master Icon',
    category: 'app-logo',
    module: 'Marketing / App Packaging',
    purpose: 'Ultra high-resolution brand app icon with infinity loop design',
    defaultPath: '/ART/ICONS/app_icon_infinity.png',
    recommendedFileName: 'app_icon_infinity.png',
    supportedFormats: ['png'],
    recommendedDimensions: '1024x1024px',
    recommendedWidth: 1024,
    recommendedHeight: 1024,
    preserveTransparency: true,
    supportsAnimation: false,
    replacementInstructions: 'Upload 1024x1024px high-res PNG.',
  },
];

/**
 * Lookup an asset definition by stable unique ID
 */
export function getAsset(id: string): AssetDefinition | null {
  return ASSET_REGISTRY.find((a) => a.id === id) || null;
}

/**
 * Filter assets by category
 */
export function getAssetsByCategory(category: AssetCategory | 'all'): AssetDefinition[] {
  if (category === 'all') return ASSET_REGISTRY;
  return ASSET_REGISTRY.filter((a) => a.category === category);
}

/**
 * Resolve display URI for an asset ID.
 * Returns default path or fallback logo.
 */
export function getAssetPath(id: string, overridePath?: string | null): string {
  if (overridePath) return overridePath;
  const asset = getAsset(id);
  return asset?.defaultPath || '/ART/LOGOS/logo_primary.png';
}
