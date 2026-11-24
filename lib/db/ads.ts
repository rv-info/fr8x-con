/**
 * lib/db/ads.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase & In-Memory Storage for Sponsored Advertisements,
 * Geographic Targeting, CTA Configurations & Godfather Audit Logs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type AdStatus =
  | 'draft'
  | 'submitted'
  | 'pending_godfather_approval'
  | 'payment_verified'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'active'
  | 'paused'
  | 'rejected'
  | 'expired';

export type GeoScope = 'country' | 'multi_country' | 'region' | 'continent' | 'multi_continent' | 'worldwide';

export type CtaType =
  | 'contact_us'
  | 'email_us'
  | 'whatsapp_us'
  | 'call_now'
  | 'visit_website'
  | 'learn_more'
  | 'apply_now'
  | 'custom';

export interface AdCtaButton {
  id: string;
  type: CtaType;
  label: string;
  destination: string;
  style: 'primary' | 'glass' | 'outline' | 'accent';
  position: 'bottom_bar' | 'vertical_stack' | 'image_overlay';
  visible: boolean;
}

export interface AdCampaignRecord {
  id: string;
  businessName: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber?: string;
  companyWebsite?: string;
  headline: string;
  description: string;
  destUrl: string;
  creativeUrl?: string;
  creativeName?: string;
  category: string;
  targetAudience: string;

  // Geographic Targeting (Phase 5)
  geoScope: GeoScope;
  targetContinents: string[];
  targetCountries: string[];
  isWorldwideRequested: boolean;
  worldwideApprovalStatus?: 'pending' | 'approved' | 'rejected';

  // Schedule & Duration
  duration: '2days' | '10days' | '30days' | 'custom';
  durationDays: number;
  startDate?: string;
  endDate?: string;
  timezone: string;

  // CTAs
  ctaButtons: AdCtaButton[];
  buttonLayout: 'horizontal' | 'vertical' | 'overlay';

  // Commercials & Status (Phase 4.4 Lifecycle)
  costINR: number;
  paymentStatus: 'paid' | 'pending_verification' | 'waived_promotional' | 'unpaid';
  paymentReference?: string;
  status: AdStatus;

  // Tracking
  impressions: number;
  clicks: number;
  ctr: number;

  // Ownership & Timestamps
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdAuditLog {
  id: string;
  campaignId: string;
  adminId: string;
  adminEmail: string;
  action: 'approved' | 'rejected' | 'paused' | 'resumed' | 'extended' | 'worldwide_approved' | 'worldwide_rejected' | 'created';
  previousStatus?: AdStatus;
  newStatus: AdStatus;
  reason?: string;
  timestamp: string;
}

// In-Memory store fallback
const GLOBAL_ADS: AdCampaignRecord[] = [
  {
    id: 'AD-2026-001',
    businessName: 'A.P. Moller - Maersk A/S',
    contactPerson: 'Soren Skou',
    contactEmail: 'ocean.procurement@maersk.com',
    contactPhone: '+45 33 63 33 63',
    whatsappNumber: '+4533633363',
    companyWebsite: 'https://www.maersk.com',
    headline: 'Instant Ocean Booking Guarantee (INNSA -> NLRTM)',
    description: 'Guaranteed space allocation and equipment release across 42 weekly Asia-North Europe strings.',
    destUrl: 'https://www.maersk.com',
    category: 'Carrier Direct Space',
    targetAudience: 'Freight Forwarders & BCOs',
    geoScope: 'continent',
    targetContinents: ['Asia', 'Europe'],
    targetCountries: ['India', 'Netherlands', 'Germany', 'United Kingdom'],
    isWorldwideRequested: false,
    duration: '10days',
    durationDays: 10,
    timezone: 'UTC+01:00',
    ctaButtons: [
      { id: 'cta-1', type: 'visit_website', label: 'Book Space Online', destination: 'https://www.maersk.com', style: 'primary', position: 'bottom_bar', visible: true },
      { id: 'cta-2', type: 'email_us', label: 'Email Desk', destination: 'ocean.procurement@maersk.com', style: 'outline', position: 'bottom_bar', visible: true },
    ],
    buttonLayout: 'horizontal',
    costINR: 5000,
    paymentStatus: 'paid',
    status: 'active',
    impressions: 48210,
    clicks: 3120,
    ctr: 6.47,
    userId: 'u_maersk',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'AD-2026-002',
    businessName: 'MSC Mediterranean Shipping Company',
    contactPerson: 'Diego Aponte',
    contactEmail: 'freight.desk@msc.com',
    contactPhone: '+41 22 703 8888',
    whatsappNumber: '+41227038888',
    companyWebsite: 'https://www.msc.com',
    headline: 'Express Transshipment Hub Connectivity',
    description: 'Connecting Gioia Tauro, Valencia, and Salalah with daily feeder links.',
    destUrl: 'https://www.msc.com',
    category: 'Ocean Freight & Feeder',
    targetAudience: 'International Logistics NVOCCs',
    geoScope: 'worldwide',
    targetContinents: ['Asia', 'Europe', 'North America', 'Africa', 'South America', 'Oceania'],
    targetCountries: [],
    isWorldwideRequested: true,
    worldwideApprovalStatus: 'approved',
    duration: '30days',
    durationDays: 30,
    timezone: 'UTC+01:00',
    ctaButtons: [
      { id: 'cta-3', type: 'visit_website', label: 'Explore Routes', destination: 'https://www.msc.com', style: 'primary', position: 'bottom_bar', visible: true },
      { id: 'cta-4', type: 'whatsapp_us', label: 'WhatsApp Logistics', destination: '+41227038888', style: 'glass', position: 'bottom_bar', visible: true },
    ],
    buttonLayout: 'horizontal',
    costINR: 15000,
    paymentStatus: 'paid',
    status: 'active',
    impressions: 39400,
    clicks: 2280,
    ctr: 5.78,
    userId: 'u_msc',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const GLOBAL_AUDIT_LOGS: AdAuditLog[] = [
  {
    id: 'log-1',
    campaignId: 'AD-2026-002',
    adminId: 'godfather_super',
    adminEmail: 'godfather@fr8x.in',
    action: 'worldwide_approved',
    previousStatus: 'pending_godfather_approval',
    newStatus: 'active',
    reason: 'Verified Global Carrier credential with direct corporate billing settlement.',
    timestamp: new Date().toISOString(),
  },
];

export function getStoredAds(): AdCampaignRecord[] {
  return [...GLOBAL_ADS];
}

export function saveAd(ad: AdCampaignRecord): AdCampaignRecord {
  const index = GLOBAL_ADS.findIndex((a) => a.id === ad.id);
  if (index >= 0) {
    GLOBAL_ADS[index] = { ...ad, updatedAt: new Date().toISOString() };
  } else {
    GLOBAL_ADS.unshift({ ...ad, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
  }
  return ad;
}

export function getAuditLogs(): AdAuditLog[] {
  return [...GLOBAL_AUDIT_LOGS];
}

export function recordAdAuditLog(log: Omit<AdAuditLog, 'id' | 'timestamp'>): AdAuditLog {
  const entry: AdAuditLog = {
    ...log,
    id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
  };
  GLOBAL_AUDIT_LOGS.unshift(entry);
  return entry;
}
