/**
 * lib/billing/currency-detector.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Global Multi-Currency Detection and ISO 4217 Currency Utilities.
 * Handles country-to-currency mapping, minor unit rules, decimal precision,
 * IP/geolocation header extraction, and safe conversions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface CurrencyMetadata {
  code: string;
  symbol: string;
  name: string;
  decimals: number;
  minorUnitMultiplier: number;
  flagEmoji: string;
}

/**
 * Standard ISO 4217 Currencies supported across FR8X Global Logistics Network.
 */
export const SUPPORTED_CURRENCIES: Record<string, CurrencyMetadata> = {
  INR: { code: 'INR', symbol: '₹', name: 'Indian Rupee', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇮🇳' },
  USD: { code: 'USD', symbol: '$', name: 'United States Dollar', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇺🇸' },
  EUR: { code: 'EUR', symbol: '€', name: 'Euro', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇪🇺' },
  GBP: { code: 'GBP', symbol: '£', name: 'British Pound', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇬🇧' },
  AED: { code: 'AED', symbol: 'AED', name: 'UAE Dirham', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇦🇪' },
  SGD: { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇸🇬' },
  AUD: { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇦🇺' },
  CAD: { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇨🇦' },
  CHF: { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇨🇭' },
  JPY: { code: 'JPY', symbol: '¥', name: 'Japanese Yen', decimals: 0, minorUnitMultiplier: 1, flagEmoji: '🇯🇵' },
  CNY: { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇨🇳' },
  SAR: { code: 'SAR', symbol: 'SAR', name: 'Saudi Riyal', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇸🇦' },
  QAR: { code: 'QAR', symbol: 'QAR', name: 'Qatari Riyal', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇶🇦' },
  KWD: { code: 'KWD', symbol: 'KWD', name: 'Kuwaiti Dinar', decimals: 3, minorUnitMultiplier: 1000, flagEmoji: '🇰🇼' },
  BHD: { code: 'BHD', symbol: 'BHD', name: 'Bahraini Dinar', decimals: 3, minorUnitMultiplier: 1000, flagEmoji: '🇧🇭' },
  OMR: { code: 'OMR', symbol: 'OMR', name: 'Omani Rial', decimals: 3, minorUnitMultiplier: 1000, flagEmoji: '🇴🇲' },
  KRW: { code: 'KRW', symbol: '₩', name: 'South Korean Won', decimals: 0, minorUnitMultiplier: 1, flagEmoji: '🇰🇷' },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'New Zealand Dollar', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇳🇿' },
  HKD: { code: 'HKD', symbol: 'HK$', name: 'Hong Kong Dollar', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇭🇰' },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'South African Rand', decimals: 2, minorUnitMultiplier: 100, flagEmoji: '🇿🇦' },
};

export const BASE_PLATFORM_CURRENCY = 'INR';

/**
 * Maps ISO 3166-1 alpha-2 country codes to primary national currencies.
 */
export const COUNTRY_TO_CURRENCY_MAP: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  AE: 'AED',
  SG: 'SGD',
  AU: 'AUD',
  CA: 'CAD',
  CH: 'CHF',
  JP: 'JPY',
  CN: 'CNY',
  SA: 'SAR',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
  KR: 'KRW',
  NZ: 'NZD',
  HK: 'HKD',
  ZA: 'ZAR',
  // Eurozone countries
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR',
  AT: 'EUR', PT: 'EUR', IE: 'EUR', FI: 'EUR', GR: 'EUR',
};

/**
 * Resolves the primary currency for a given country code, with fallback to INR.
 */
export function resolveCurrencyForCountry(countryCode?: string | null): string {
  if (!countryCode) return BASE_PLATFORM_CURRENCY;
  const upper = countryCode.trim().toUpperCase();
  const matched = COUNTRY_TO_CURRENCY_MAP[upper];
  if (matched && SUPPORTED_CURRENCIES[matched]) {
    return matched;
  }
  return BASE_PLATFORM_CURRENCY;
}

/**
 * Extracts country code from common edge/proxy/gateway headers.
 */
export function detectCountryFromHeaders(headers: Headers | Record<string, string | undefined>): string {
  const getHeader = (name: string): string | undefined => {
    if (typeof (headers as Headers).get === 'function') {
      return (headers as Headers).get(name) || undefined;
    }
    return (headers as Record<string, string | undefined>)[name.toLowerCase()] ||
           (headers as Record<string, string | undefined>)[name];
  };

  const candidateCountry =
    getHeader('cf-ipcountry') ||
    getHeader('x-country-code') ||
    getHeader('x-forwarded-country') ||
    'IN';

  return candidateCountry.trim().toUpperCase() || 'IN';
}

/**
 * Converts an authoritative decimal amount into integer minor units (paise, cents, yen)
 * preventing floating point drift.
 */
export function toMinorUnits(amount: number, currencyCode: string): number {
  const meta = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES[BASE_PLATFORM_CURRENCY];
  return Math.round(amount * meta.minorUnitMultiplier);
}

/**
 * Converts minor units back into standard decimal amount.
 */
export function fromMinorUnits(minorUnits: number, currencyCode: string): number {
  const meta = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES[BASE_PLATFORM_CURRENCY];
  return Number((minorUnits / meta.minorUnitMultiplier).toFixed(meta.decimals));
}

/**
 * Formats a currency amount with correct symbol and decimal places.
 */
export function formatCurrencyAmount(amount: number, currencyCode: string): string {
  const meta = SUPPORTED_CURRENCIES[currencyCode] || SUPPORTED_CURRENCIES[BASE_PLATFORM_CURRENCY];
  const formatted = amount.toLocaleString('en-US', {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });
  return `${meta.symbol} ${formatted}`;
}
