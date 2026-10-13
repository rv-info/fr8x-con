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

export type MembershipCampaignMode = 'standard' | 'discounted' | 'all_free';

export interface MembershipPromotionConfig {
  mode: MembershipCampaignMode;
  discountPercent: number; // e.g. 50 for 50% discount
  promoBadgeText: string;  // e.g. 'FESTIVE 50% OFF' or 'LIMITED PROMO'
  campaignHeadline: string; // e.g. 'Godfather Sovereign Promotion: 50% Off Enterprise Tiers'
  campaignDescription: string;
  trialDurationDays: number; // default 30
  proMonthlyPrice: number;   // standard 1500 (or custom price)
  premiumMonthlyPrice: number; // standard 3000 (or custom price)
  bidFeeAmount: number;      // standard 300
  premiumBidFeeAmount: number; // standard 180
  updatedAt?: string;
  updatedBy?: string;
}

export const DEFAULT_MEMBERSHIP_PROMOTION: MembershipPromotionConfig = {
  mode: 'standard',
  discountPercent: 0,
  promoBadgeText: 'LIMITED PROMO',
  campaignHeadline: 'Special Promotional Access Active',
  campaignDescription: 'Special pricing authorized by Godfather Sovereign Administration for new logistics registrations.',
  trialDurationDays: 30,
  proMonthlyPrice: 1500,
  premiumMonthlyPrice: 3000,
  bidFeeAmount: 300,
  premiumBidFeeAmount: 180,
};

export interface PlatformCommerceConfig {
  allFreeMode: boolean; // Master Sovereign Switch: When true, all registration pricing cards, paywalls, and transaction fees are 100% waived
  requirePaymentCards: boolean; // When false, login & platform payment cards are removed/bypassed
  biddingFeeEnabled: boolean; // When false, tender bid fee is ₹0 (Free Bidding)
  biddingFeeAmount: number;
  jobPostingFeeEnabled: boolean; // When false, job posting fee is ₹0 (Free Job Posting)
  jobPostingFeeAmount: number;
  feedAdsFeeEnabled: boolean;
  feedAdsFeeAmount: number;
  kycFeeEnabled: boolean;
  kycFeeAmount: number;
  paymentAutomationEnabled: boolean; // Master Automation Switch: When true, verified payment references & gateways auto-confirm and activate listings instantly
  razorpayEnabled: boolean; // Master Razorpay User Switch: When true, Razorpay is active and accessible for all users during checkout
  razorpayKeyId?: string; // Razorpay Merchant Key ID (e.g., 'rzp_live_8842Fr8xInd99')
  razorpayKeySecret?: string; // KMS-sealed Secret reference
  razorpayEnvironment?: 'production' | 'sandbox';
  razorpayWebhookUrl?: string; // Official Webhook endpoint
  razorpayWebhookSecret?: string;
  razorpayAutoSettlement?: boolean;
  promotionalFeatures: PromotionalFeatureConfig[];
  promotionalAuditLogs: PromotionalAuditLog[];
  membershipPromotion: MembershipPromotionConfig;
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
    userOverrides: [],
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
    globalStatus: 'chargeable',
    pricingMode: 'fixed',
    priceAmount: 300,
    currency: 'INR',
    userOverrides: [],
  },
];

export const DEFAULT_PLATFORM_CONFIG: PlatformCommerceConfig = {
  allFreeMode: false,
  requirePaymentCards: false,
  biddingFeeEnabled: true,
  biddingFeeAmount: 300,
  jobPostingFeeEnabled: true,
  jobPostingFeeAmount: 300,
  feedAdsFeeEnabled: true,
  feedAdsFeeAmount: 1000,
  kycFeeEnabled: false,
  kycFeeAmount: 2500,
  paymentAutomationEnabled: true,
  razorpayEnabled: true,
  razorpayKeyId: 'rzp_live_8842Fr8xInd99',
  razorpayKeySecret: 'sec_live_kms_sealed_8842fr8x',
  razorpayEnvironment: 'production',
  razorpayWebhookUrl: 'https://con.fr8x.in/api/webhooks/razorpay',
  razorpayWebhookSecret: 'whsec_kms_sealed_fr8x_rzp',
  razorpayAutoSettlement: true,
  promotionalFeatures: DEFAULT_PROMOTIONAL_FEATURES,
  promotionalAuditLogs: [
    {
      id: 'AUD-PROM-001',
      operatorId: 'tech@fr8x.in',
      operatorName: 'Godfather Sovereign Tech',
      featureKey: 'REVERSE_AUCTION',
      featureLabel: 'Reverse Auction Spot Bidding',
      previousState: 'CHARGEABLE (₹300/bid)',
      newState: 'CHARGEABLE (Pay to Post/Bid Enforced)',
      pricingInfo: '₹300 Standard Listing Tariff',
      scope: 'GLOBAL',
      effectiveDate: '2026-09-01T00:00:00.000Z',
      timestamp: '2026-09-01T10:00:00.000Z',
    },
  ],
  membershipPromotion: DEFAULT_MEMBERSHIP_PROMOTION,
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
      allFreeMode: parsed.allFreeMode ?? DEFAULT_PLATFORM_CONFIG.allFreeMode,
      paymentAutomationEnabled: parsed.paymentAutomationEnabled ?? DEFAULT_PLATFORM_CONFIG.paymentAutomationEnabled,
      razorpayEnabled: parsed.razorpayEnabled ?? DEFAULT_PLATFORM_CONFIG.razorpayEnabled,
      razorpayKeyId: parsed.razorpayKeyId ?? DEFAULT_PLATFORM_CONFIG.razorpayKeyId,
      razorpayKeySecret: parsed.razorpayKeySecret ?? DEFAULT_PLATFORM_CONFIG.razorpayKeySecret,
      razorpayEnvironment: parsed.razorpayEnvironment ?? DEFAULT_PLATFORM_CONFIG.razorpayEnvironment,
      razorpayWebhookUrl: parsed.razorpayWebhookUrl ?? DEFAULT_PLATFORM_CONFIG.razorpayWebhookUrl,
      razorpayWebhookSecret: parsed.razorpayWebhookSecret ?? DEFAULT_PLATFORM_CONFIG.razorpayWebhookSecret,
      razorpayAutoSettlement: parsed.razorpayAutoSettlement ?? DEFAULT_PLATFORM_CONFIG.razorpayAutoSettlement,
      promotionalFeatures: parsed.promotionalFeatures || DEFAULT_PROMOTIONAL_FEATURES,
      promotionalAuditLogs: parsed.promotionalAuditLogs || DEFAULT_PLATFORM_CONFIG.promotionalAuditLogs,
      membershipPromotion: parsed.membershipPromotion || DEFAULT_MEMBERSHIP_PROMOTION,
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
 * Computes active membership pricing dynamically based on Godfather's decision.
 * Returns calculated prices, discount percentages, badges, and active mode (standard, discounted, all_free).
 */
export function getActiveMembershipPricing(config: PlatformCommerceConfig) {
  const promo = config.membershipPromotion || DEFAULT_MEMBERSHIP_PROMOTION;
  const isFree = config.allFreeMode === true || promo.mode === 'all_free';
  const isDiscounted = !isFree && promo.mode === 'discounted' && (promo.discountPercent || 0) > 0;

  const stdPro = promo.proMonthlyPrice || 1500;
  const stdPremium = promo.premiumMonthlyPrice || 3000;
  const discountRate = (100 - (promo.discountPercent || 0)) / 100;

  const currentPro = isFree ? 0 : isDiscounted ? Math.round(stdPro * discountRate) : stdPro;
  const currentPremium = isFree ? 0 : isDiscounted ? Math.round(stdPremium * discountRate) : stdPremium;

  return {
    mode: isFree ? ('all_free' as const) : isDiscounted ? ('discounted' as const) : ('standard' as const),
    isFree,
    isDiscounted,
    discountPercent: promo.discountPercent || 0,
    promoBadgeText: promo.promoBadgeText || `${promo.discountPercent}% PROMO OFF`,
    trialDays: promo.trialDurationDays || 30,
    stdPro,
    stdPremium,
    currentPro,
    currentPremium,
    campaignHeadline: promo.campaignHeadline || 'Special Promotional Access Active',
    campaignDescription: promo.campaignDescription || 'Special pricing authorized by Godfather Sovereign Administration for new logistics registrations.',
    bidFee: isFree ? 0 : (promo.bidFeeAmount || 300),
    premiumBidFee: isFree ? 0 : isDiscounted ? Math.round((promo.premiumBidFeeAmount || 180) * discountRate) : (promo.premiumBidFeeAmount || 180),
  };
}

/**
 * Check if the Godfather has selected "All Free" platform mode.
 * When true, registration cards, paywalls, and transaction fees are 100% waived.
 */
export function isAllFreeActive(config: PlatformCommerceConfig): boolean {
  return config.allFreeMode === true || config.membershipPromotion?.mode === 'all_free';
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
  // Master All-Free bypass
  if (config.allFreeMode === true) return true;

  // Direct fee enable flags
  if (featureKey === 'JOB_POSTING' && config.jobPostingFeeEnabled === false) return true;
  if (featureKey === 'REVERSE_AUCTION' && config.biddingFeeEnabled === false) return true;
  if (featureKey === 'AD_POSTING' && config.feedAdsFeeEnabled === false) return true;

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
  return feature.globalStatus === 'free' || feature.pricingMode === 'free';
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

  const setAllFreeMode = (
    enabled: boolean,
    operatorInfo?: { id: string; name: string }
  ) => {
    const nextFeatures = config.promotionalFeatures.map((f) => {
      if (f.key === 'LOGIN' || f.key === 'REVERSE_AUCTION') {
        return {
          ...f,
          globalStatus: enabled ? ('free' as const) : ('chargeable' as const),
          pricingMode: enabled ? ('free' as const) : ('fixed' as const),
        };
      }
      return f;
    });

    const auditEntry: PromotionalAuditLog = {
      id: `AUD-PROM-${Date.now()}`,
      operatorId: operatorInfo?.id || 'tech@fr8x.in',
      operatorName: operatorInfo?.name || 'Godfather Operator',
      featureKey: 'LOGIN',
      featureLabel: 'Platform Commerce All-Free Sovereign Mode',
      previousState: config.allFreeMode ? 'ALL-FREE ACTIVE' : 'COMMERCIAL CHARGEABLE',
      newState: enabled ? 'ALL-FREE 100% WAIVED ACTIVE' : 'STANDARD COMMERCIAL BILLING',
      pricingInfo: enabled ? 'All registration pricing cards, paywalls, and transaction fees waived (₹0)' : 'Standard Plan Pricing Enforced',
      scope: 'GLOBAL',
      effectiveDate: new Date().toISOString(),
      timestamp: new Date().toISOString(),
    };

    const nextConfig: PlatformCommerceConfig = {
      ...config,
      allFreeMode: enabled,
      requirePaymentCards: !enabled,
      biddingFeeEnabled: !enabled,
      jobPostingFeeEnabled: !enabled,
      feedAdsFeeEnabled: !enabled,
      kycFeeEnabled: !enabled,
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
    setAllFreeMode,
    setPaymentAutomationEnabled: (enabled: boolean) => {
      const next = { ...config, paymentAutomationEnabled: enabled };
      setConfig(next);
      saveStoredPlatformConfig(next);
    },
    setRazorpayEnabled: (enabled: boolean) => {
      const next = { ...config, razorpayEnabled: enabled };
      setConfig(next);
      saveStoredPlatformConfig(next);
    },
    updateRazorpayConfig: (updates: Partial<{
      razorpayEnabled: boolean;
      razorpayKeyId: string;
      razorpayKeySecret: string;
      razorpayEnvironment: 'production' | 'sandbox';
      razorpayWebhookUrl: string;
      razorpayWebhookSecret: string;
      razorpayAutoSettlement: boolean;
    }>) => {
      const next = { ...config, ...updates };
      setConfig(next);
      saveStoredPlatformConfig(next);
    },
    setMembershipPromotion: (
      promo: Partial<MembershipPromotionConfig>,
      operatorInfo?: { id: string; name: string }
    ) => {
      const nextPromo: MembershipPromotionConfig = {
        ...(config.membershipPromotion || DEFAULT_MEMBERSHIP_PROMOTION),
        ...promo,
        updatedAt: new Date().toISOString(),
        updatedBy: operatorInfo?.name || 'Godfather Operator',
      };
      const isFree = nextPromo.mode === 'all_free';
      const auditEntry: PromotionalAuditLog = {
        id: `AUD-PROM-${Date.now()}`,
        operatorId: operatorInfo?.id || 'tech@fr8x.in',
        operatorName: operatorInfo?.name || 'Godfather Operator',
        featureKey: 'LOGIN',
        featureLabel: 'Membership Registration & Access Pricing',
        previousState: `MODE: ${config.membershipPromotion?.mode?.toUpperCase() || 'STANDARD'}`,
        newState: `MODE: ${nextPromo.mode.toUpperCase()} (${nextPromo.mode === 'all_free' ? '100% Free' : nextPromo.mode === 'discounted' ? `${nextPromo.discountPercent}% OFF` : 'Standard Rates'})`,
        pricingInfo: `Pro: ₹${nextPromo.mode === 'all_free' ? 0 : nextPromo.mode === 'discounted' ? Math.round(nextPromo.proMonthlyPrice * (1 - nextPromo.discountPercent / 100)) : nextPromo.proMonthlyPrice}/mo, Premium: ₹${nextPromo.mode === 'all_free' ? 0 : nextPromo.mode === 'discounted' ? Math.round(nextPromo.premiumMonthlyPrice * (1 - nextPromo.discountPercent / 100)) : nextPromo.premiumMonthlyPrice}/mo`,
        scope: 'GLOBAL',
        effectiveDate: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      const nextConfig: PlatformCommerceConfig = {
        ...config,
        allFreeMode: isFree,
        membershipPromotion: nextPromo,
        promotionalAuditLogs: [auditEntry, ...(config.promotionalAuditLogs || [])],
      };
      setConfig(nextConfig);
      saveStoredPlatformConfig(nextConfig);
    },
    isFeatureFree: (featureKey: PromotionalFeatureKey, userId?: string) =>
      isFeatureFreeForUser(config, featureKey, userId),
  };
}
