'use client';

import { useState, useEffect } from 'react';

export type PromotionalFeatureKey = 'LOGIN' | 'JOB_POSTING' | 'AD_POSTING' | 'REVERSE_AUCTION';

export type PricingMode = 'free' | 'fixed' | 'unconfigured';

export interface UserOverride {
  userId: string;
  userName: string;
  userEmail: string;
  status: 'free' | 'chargeable';
  startDate?: string;
  endDate?: string;
  reason?: string;
}

export interface PromotionalFeatureConfig {
  key: PromotionalFeatureKey;
  label: string;
  description: string;
  globalStatus: 'free' | 'chargeable';
  pricingMode: PricingMode;
  priceAmount: number;
  currency: string;
  startDate?: string;
  endDate?: string;
  userOverrides: UserOverride[];
}

export interface PromotionalAuditLog {
  id: string;
  operatorId: string;
  operatorName: string;
  featureKey: PromotionalFeatureKey;
  featureLabel: string;
  previousState: string;
  newState: string;
  pricingInfo: string;
  scope: 'GLOBAL' | 'USER_OVERRIDE';
  targetUser?: string;
  effectiveDate: string;
  expiryDate?: string;
  timestamp: string;
}

export interface PlatformCommerceConfig {
  requirePaymentCards: boolean; // When false, login & platform payment cards are removed/bypassed
  biddingFeeEnabled: boolean; // When false, tender bid fee is ₹0 (Free Bidding)
  biddingFeeAmount: number;
  jobPostingFeeEnabled: boolean; // When false, job posting fee is ₹0 (Free Job Posting)
  jobPostingFeeAmount: number;
  feedAdsFeeEnabled: boolean;
  feedAdsFeeAmount: number;
  kycFeeEnabled: boolean;
  kycFeeAmount: number;
  promotionalFeatures: PromotionalFeatureConfig[];
  promotionalAuditLogs: PromotionalAuditLog[];
}

export const DEFAULT_PROMOTIONAL_FEATURES: PromotionalFeatureConfig[] = [
  {
    key: 'LOGIN',
    label: 'Login & Enterprise Workspace Access',
    description: 'Zero-barrier registration & credentialed workspace login for verified freight professionals.',
    globalStatus: 'free',
    pricingMode: 'free',
    priceAmount: 0,
    currency: 'INR',
    userOverrides: [],
  },
  {
    key: 'JOB_POSTING',
    label: 'Trade Careers Job Posting',
    description: 'Publish verified maritime & forwarding vacancy openings across the national logistics network.',
    globalStatus: 'chargeable',
    pricingMode: 'fixed',
    priceAmount: 300,
    currency: 'INR',
    userOverrides: [
      {
        userId: 'u-arjun',
        userName: 'Arjun Rao',
        userEmail: 'arjun@atlaslogistics.com',
        status: 'free',
        reason: 'Strategic Founding Tier-1 Partner Campaign',
      },
    ],
  },
  {
    key: 'AD_POSTING',
    label: 'Commercial Feed Banner Ad Placement',
    description: 'Targeted brand and service promotion banners rendered in verified trade feeds.',
    globalStatus: 'chargeable',
    pricingMode: 'fixed',
    priceAmount: 1000,
    currency: 'INR',
    userOverrides: [],
  },
  {
    key: 'REVERSE_AUCTION',
    label: 'Reverse Auction Spot Bidding',
    description: 'Submit legally binding container freight bids in real-time digital reverse auctions.',
    globalStatus: 'free',
    pricingMode: 'free',
    priceAmount: 0,
    currency: 'INR',
    userOverrides: [],
  },
];

export const DEFAULT_PLATFORM_CONFIG: PlatformCommerceConfig = {
  requirePaymentCards: false,
  biddingFeeEnabled: false,
  biddingFeeAmount: 300,
  jobPostingFeeEnabled: false,
  jobPostingFeeAmount: 500,
  feedAdsFeeEnabled: true,
  feedAdsFeeAmount: 1200,
  kycFeeEnabled: false,
  kycFeeAmount: 2500,
  promotionalFeatures: DEFAULT_PROMOTIONAL_FEATURES,
  promotionalAuditLogs: [
    {
      id: 'AUD-PROM-001',
      operatorId: 'tech@fr8x.in',
      operatorName: 'Godfather Sovereign Tech',
      featureKey: 'REVERSE_AUCTION',
      featureLabel: 'Reverse Auction Spot Bidding',
      previousState: 'CHARGEABLE (₹300/bid)',
      newState: 'FREE (100% Platform Waiver)',
      pricingInfo: '₹0 (Free Mode)',
      scope: 'GLOBAL',
      effectiveDate: '2026-09-01T00:00:00.000Z',
      timestamp: '2026-09-01T10:00:00.000Z',
    },
    {
      id: 'AUD-PROM-002',
      operatorId: 'tech@fr8x.in',
      operatorName: 'Godfather Sovereign Tech',
      featureKey: 'JOB_POSTING',
      featureLabel: 'Trade Careers Job Posting',
      previousState: 'GLOBAL CHARGEABLE (₹300)',
      newState: 'USER OVERRIDE: FREE',
      pricingInfo: '₹0 Override for Arjun Rao (Atlas Logistics)',
      scope: 'USER_OVERRIDE',
      targetUser: 'Arjun Rao (u-arjun)',
      effectiveDate: '2026-09-01T00:00:00.000Z',
      timestamp: '2026-09-01T10:15:00.000Z',
    },
  ],
};

const STORAGE_KEY = 'fr8x_platform_commerce_config_v3';

export function getStoredPlatformConfig(): PlatformCommerceConfig {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLATFORM_CONFIG;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PLATFORM_CONFIG,
      ...parsed,
      promotionalFeatures: parsed.promotionalFeatures || DEFAULT_PROMOTIONAL_FEATURES,
      promotionalAuditLogs: parsed.promotionalAuditLogs || DEFAULT_PLATFORM_CONFIG.promotionalAuditLogs,
    };
  } catch {
    return DEFAULT_PLATFORM_CONFIG;
  }
}

export function saveStoredPlatformConfig(cfg: PlatformCommerceConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
    window.dispatchEvent(new Event('fr8x_platform_config_updated'));
  } catch (e) {
    console.error('Failed to save platform config:', e);
  }
}

/**
 * Deterministic Rule Precedence:
 * 1. Explicit user-level promotional override (if active/valid)
 * 2. Global platform rule
 * 3. Default configured behavior
 */
export function isFeatureFreeForUser(
  config: PlatformCommerceConfig,
  featureKey: PromotionalFeatureKey,
  userId?: string
): boolean {
  const feature = config.promotionalFeatures?.find((f) => f.key === featureKey);
  if (!feature) return false;

  // 1. Explicit User Override
  if (userId && feature.userOverrides && feature.userOverrides.length > 0) {
    const override = feature.userOverrides.find((o) => o.userId === userId);
    if (override) {
      return override.status === 'free';
    }
  }

  // 2. Global Platform Rule
  return feature.globalStatus === 'free';
}

export function usePlatformConfig() {
  const [config, setConfig] = useState<PlatformCommerceConfig>(DEFAULT_PLATFORM_CONFIG);

  useEffect(() => {
    setConfig(getStoredPlatformConfig());

    const handleUpdate = () => {
      setConfig(getStoredPlatformConfig());
    };

    window.addEventListener('fr8x_platform_config_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('fr8x_platform_config_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const updateConfig = (updates: Partial<PlatformCommerceConfig>) => {
    const next = { ...config, ...updates };
    setConfig(next);
    saveStoredPlatformConfig(next);
  };

  const updatePromotionalFeature = (
    key: PromotionalFeatureKey,
    updates: Partial<PromotionalFeatureConfig>,
    operatorInfo?: { id: string; name: string }
  ) => {
    const feature = config.promotionalFeatures.find((f) => f.key === key);
    if (!feature) return;

    const previousState = `${feature.globalStatus.toUpperCase()} (${feature.pricingMode === 'free' ? 'Free' : `₹${feature.priceAmount}`})`;
    const nextFeatures = config.promotionalFeatures.map((f) =>
      f.key === key ? { ...f, ...updates } : f
    );
    const updatedFeature = nextFeatures.find((f) => f.key === key)!;
    const newState = `${updatedFeature.globalStatus.toUpperCase()} (${updatedFeature.pricingMode === 'free' ? 'Free' : `₹${updatedFeature.priceAmount}`})`;

    const auditEntry: PromotionalAuditLog = {
      id: `AUD-PROM-${Date.now()}`,
      operatorId: operatorInfo?.id || 'tech@fr8x.in',
      operatorName: operatorInfo?.name || 'Godfather Operator',
      featureKey: key,
      featureLabel: feature.label,
      previousState,
      newState,
      pricingInfo: updatedFeature.globalStatus === 'free' ? '₹0 (Free Promo Mode)' : `₹${updatedFeature.priceAmount} (${updatedFeature.currency})`,
      scope: 'GLOBAL',
      effectiveDate: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    const nextConfig: PlatformCommerceConfig = {
      ...config,
      promotionalFeatures: nextFeatures,
      promotionalAuditLogs: [auditEntry, ...(config.promotionalAuditLogs || [])],
    };

    setConfig(nextConfig);
    saveStoredPlatformConfig(nextConfig);
  };

  const addUserOverride = (
    key: PromotionalFeatureKey,
    override: UserOverride,
    operatorInfo?: { id: string; name: string }
  ) => {
    const feature = config.promotionalFeatures.find((f) => f.key === key);
    if (!feature) return;

    const existingOverrides = feature.userOverrides || [];
    const nextOverrides = existingOverrides.filter((o) => o.userId !== override.userId).concat(override);

    const nextFeatures = config.promotionalFeatures.map((f) =>
      f.key === key ? { ...f, userOverrides: nextOverrides } : f
    );

    const auditEntry: PromotionalAuditLog = {
      id: `AUD-PROM-${Date.now()}`,
      operatorId: operatorInfo?.id || 'tech@fr8x.in',
      operatorName: operatorInfo?.name || 'Godfather Operator',
      featureKey: key,
      featureLabel: feature.label,
      previousState: 'STANDARD GLOBAL RULE',
      newState: `USER OVERRIDE: ${override.status.toUpperCase()}`,
      pricingInfo: `User Override: ${override.userName} (${override.userId}) set to ${override.status.toUpperCase()}`,
      scope: 'USER_OVERRIDE',
      targetUser: `${override.userName} (${override.userId})`,
      effectiveDate: override.startDate || new Date().toISOString(),
      expiryDate: override.endDate,
      timestamp: new Date().toISOString(),
    };

    const nextConfig: PlatformCommerceConfig = {
      ...config,
      promotionalFeatures: nextFeatures,
      promotionalAuditLogs: [auditEntry, ...(config.promotionalAuditLogs || [])],
    };

    setConfig(nextConfig);
    saveStoredPlatformConfig(nextConfig);
  };

  const removeUserOverride = (
    key: PromotionalFeatureKey,
    userId: string,
    operatorInfo?: { id: string; name: string }
  ) => {
    const feature = config.promotionalFeatures.find((f) => f.key === key);
    if (!feature) return;

    const target = feature.userOverrides.find((o) => o.userId === userId);
    const nextOverrides = (feature.userOverrides || []).filter((o) => o.userId !== userId);
    const nextFeatures = config.promotionalFeatures.map((f) =>
      f.key === key ? { ...f, userOverrides: nextOverrides } : f
    );

    const auditEntry: PromotionalAuditLog = {
      id: `AUD-PROM-${Date.now()}`,
      operatorId: operatorInfo?.id || 'tech@fr8x.in',
      operatorName: operatorInfo?.name || 'Godfather Operator',
      featureKey: key,
      featureLabel: feature.label,
      previousState: `USER OVERRIDE: ${target?.status.toUpperCase() || 'CUSTOM'}`,
      newState: 'OVERRIDE REMOVED (REVERTED TO GLOBAL RULE)',
      pricingInfo: `User Override for ${target?.userName || userId} revoked`,
      scope: 'USER_OVERRIDE',
      targetUser: `${target?.userName || userId}`,
      effectiveDate: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    const nextConfig: PlatformCommerceConfig = {
      ...config,
      promotionalFeatures: nextFeatures,
      promotionalAuditLogs: [auditEntry, ...(config.promotionalAuditLogs || [])],
    };

    setConfig(nextConfig);
    saveStoredPlatformConfig(nextConfig);
  };

  return {
    config,
    updateConfig,
    updatePromotionalFeature,
    addUserOverride,
    removeUserOverride,
    isFeatureFree: (featureKey: PromotionalFeatureKey, userId?: string) =>
      isFeatureFreeForUser(config, featureKey, userId),
  };
}
