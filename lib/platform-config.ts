'use client';

import { useState, useEffect } from 'react';

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
}

export const DEFAULT_PLATFORM_CONFIG: PlatformCommerceConfig = {
  requirePaymentCards: false, // Default removed for zero-friction
  biddingFeeEnabled: false, // Default free posting/bidding
  biddingFeeAmount: 300,
  jobPostingFeeEnabled: false, // Default free
  jobPostingFeeAmount: 500,
  feedAdsFeeEnabled: true,
  feedAdsFeeAmount: 1200,
  kycFeeEnabled: false,
  kycFeeAmount: 2500,
};

const STORAGE_KEY = 'fr8x_platform_commerce_config_v2';

export function getStoredPlatformConfig(): PlatformCommerceConfig {
  if (typeof window === 'undefined') return DEFAULT_PLATFORM_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_PLATFORM_CONFIG;
    return { ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(raw) };
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

  return { config, updateConfig };
}
