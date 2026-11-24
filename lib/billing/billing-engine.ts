/**
 * lib/billing/billing-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Central Multi-Currency Billing Engine.
 * Controls service pricing catalogs, live FX conversion, decimal-safe minor unit
 * calculations, regional fixed pricing overrides, and 15-minute cryptographic quote locking.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import crypto from 'crypto';
import {
  BASE_PLATFORM_CURRENCY,
  SUPPORTED_CURRENCIES,
  toMinorUnits,
  fromMinorUnits,
} from './currency-detector';

export type ChargeableServiceType = 'subscription' | 'job' | 'ad' | 'auction' | 'registration';

export interface CatalogItem {
  id: string;
  serviceType: ChargeableServiceType;
  title: string;
  basePriceINR: number;
  durationDays?: number;
  description: string;
}

/**
 * Authoritative Base Tariffs in INR (Platform Base Currency).
 */
export const AUTHORITATIVE_CATALOG: Record<string, CatalogItem> = {
  // Subscriptions
  'sub_trial': {
    id: 'sub_trial',
    serviceType: 'subscription',
    title: 'Trial Access (30 Days)',
    basePriceINR: 0,
    durationDays: 30,
    description: 'Complimentary trial access to FR8X freight platform',
  },
  'sub_pro': {
    id: 'sub_pro',
    serviceType: 'subscription',
    title: 'Professional Plan',
    basePriceINR: 1500,
    durationDays: 30,
    description: 'B2B Trade Network, verified passport & priority RFQ access',
  },
  'sub_premium': {
    id: 'sub_premium',
    serviceType: 'subscription',
    title: 'Premium Plan',
    basePriceINR: 3000,
    durationDays: 30,
    description: 'Unlimited rate intelligence, discounted bidding fees & dedicated support',
  },
  'sub_enterprise': {
    id: 'sub_enterprise',
    serviceType: 'subscription',
    title: 'Enterprise Custom Plan',
    basePriceINR: 9999,
    durationDays: 30,
    description: 'Custom API access, multi-seat governance & sovereign SLA',
  },

  // Job Postings
  'job_2d': {
    id: 'job_2d',
    serviceType: 'job',
    title: 'Job Listing — 2 Days (Min)',
    basePriceINR: 300,
    durationDays: 2,
    description: 'Standard 2-day listing on Trade Careers & Jobs board',
  },
  'job_7d': {
    id: 'job_7d',
    serviceType: 'job',
    title: 'Job Listing — 7 Days',
    basePriceINR: 1200,
    durationDays: 7,
    description: 'Weekly job listing with candidate pipeline access',
  },
  'job_15d': {
    id: 'job_15d',
    serviceType: 'job',
    title: 'Job Listing — 15 Days',
    basePriceINR: 2640,
    durationDays: 15,
    description: 'Fortnightly listing with recruiter application manager',
  },
  'job_30d': {
    id: 'job_30d',
    serviceType: 'job',
    title: 'Job Listing — 30 Days',
    basePriceINR: 5340,
    durationDays: 30,
    description: 'Monthly prominent recruitment listing',
  },

  // Sponsored Feed Ads
  'ad_2d': {
    id: 'ad_2d',
    serviceType: 'ad',
    title: 'Sponsored Ad — 2 Days',
    basePriceINR: 1000,
    durationDays: 2,
    description: 'High-visibility commercial feed banner placement for 2 days',
  },
  'ad_10d': {
    id: 'ad_10d',
    serviceType: 'ad',
    title: 'Sponsored Ad — 10 Days',
    basePriceINR: 5000,
    durationDays: 10,
    description: 'Featured multi-day banner placement with analytics tracking',
  },

  // Reverse Auctions
  'auction_standard_bid': {
    id: 'auction_standard_bid',
    serviceType: 'auction',
    title: 'Tender Reverse Auction Bid Participation',
    basePriceINR: 300,
    description: 'Standard verified bidder submission fee for container tenders',
  },
  'auction_premium_bid': {
    id: 'auction_premium_bid',
    serviceType: 'auction',
    title: 'Premium Member Tender Bid Fee',
    basePriceINR: 180,
    description: 'Discounted tender submission fee for active premium members',
  },

  // Registration & Profile
  'reg_standard': {
    id: 'reg_standard',
    serviceType: 'registration',
    title: 'Standard Network Registration',
    basePriceINR: 0,
    description: 'Account activation and Freight Passport issuance',
  },
};

/**
 * Baseline Exchange Rates relative to USD.
 */
export const BASE_EXCHANGE_RATES_USD: Record<string, number> = {
  USD: 1.0,
  INR: 86.5,
  EUR: 0.92,
  GBP: 0.79,
  AED: 3.6725,
  SGD: 1.34,
  AUD: 1.55,
  CAD: 1.39,
  CHF: 0.88,
  JPY: 153.5,
  CNY: 7.24,
  SAR: 3.75,
  QAR: 3.64,
  KWD: 0.31,
  BHD: 0.377,
  OMR: 0.385,
  KRW: 1380.0,
  NZD: 1.70,
  HKD: 7.78,
  ZAR: 18.2,
};

/**
 * Optional Admin Regional Fixed Pricing table overrides (Base INR -> fixed in currency).
 */
export const REGIONAL_FIXED_PRICES: Record<string, Record<string, number>> = {
  // e.g. 'sub_pro': { USD: 19.99, EUR: 18.50, GBP: 15.99, AED: 75 }
};

export interface BillingQuote {
  quoteId: string;
  serviceType: ChargeableServiceType;
  itemId: string;
  itemTitle: string;
  basePriceINR: number;
  targetCurrency: string;
  exchangeRate: number; // targetCurrency units per 1 INR
  finalAmount: number;
  minorUnits: number;
  currencyDecimals: number;
  currencySymbol: string;
  isFree: boolean;
  freeReason?: string;
  createdAt: number;
  expiresAt: number;
  signature: string;
}

const QUOTE_SECRET = process.env.ENCRYPTION_KEY || 'fr8x-billing-engine-quote-secret-2026';
export const QUOTE_TTL_MS = 15 * 60 * 1000; // 15 Minutes TTL

/**
 * Computes exchange rate from INR to target currency.
 */
export function getExchangeRateFromINR(targetCurrency: string, liveRatesUSD?: Record<string, number>): number {
  const upper = (targetCurrency || BASE_PLATFORM_CURRENCY).toUpperCase();
  if (upper === BASE_PLATFORM_CURRENCY) return 1.0;

  const rates = liveRatesUSD || BASE_EXCHANGE_RATES_USD;
  const inrRateFromUSD = rates.INR || 86.5;
  const targetRateFromUSD = rates[upper];

  if (!targetRateFromUSD) {
    return 1.0; // Fallback to 1:1 if unknown
  }

  // targetCurrency / INR = (target / USD) / (INR / USD)
  return targetRateFromUSD / inrRateFromUSD;
}

/**
 * Generates an authoritative cryptographic HMAC signature for a quote.
 */
export function signQuotePayload(payload: {
  quoteId: string;
  itemId: string;
  serviceType: string;
  basePriceINR: number;
  targetCurrency: string;
  finalAmount: number;
  minorUnits: number;
  createdAt: number;
  expiresAt: number;
}): string {
  const serialized = [
    payload.quoteId,
    payload.itemId,
    payload.serviceType,
    payload.basePriceINR.toFixed(2),
    payload.targetCurrency,
    payload.finalAmount.toFixed(4),
    payload.minorUnits.toString(),
    payload.createdAt.toString(),
    payload.expiresAt.toString(),
  ].join('|');

  return crypto.createHmac('sha256', QUOTE_SECRET).update(serialized).digest('hex');
}

/**
 * Creates a cryptographically signed, 15-minute locked quote for any catalog service.
 */
export function generateBillingQuote(params: {
  catalogKey: string;
  targetCurrency?: string;
  customTitle?: string;
  isFree?: boolean;
  freeReason?: string;
  liveRatesUSD?: Record<string, number>;
}): BillingQuote {
  const item = AUTHORITATIVE_CATALOG[params.catalogKey] || AUTHORITATIVE_CATALOG['sub_pro'];
  const currency = (params.targetCurrency || BASE_PLATFORM_CURRENCY).toUpperCase();
  const meta = SUPPORTED_CURRENCIES[currency] || SUPPORTED_CURRENCIES[BASE_PLATFORM_CURRENCY];

  const now = Date.now();
  const expiresAt = now + QUOTE_TTL_MS;
  const quoteId = `quot_${now}_${crypto.randomBytes(4).toString('hex')}`;

  const isFree = Boolean(params.isFree || item.basePriceINR === 0);

  let finalAmount = 0;
  let minorUnits = 0;
  let exchangeRate = 1.0;

  if (!isFree) {
    // Check regional fixed pricing first
    const regionalFixed = REGIONAL_FIXED_PRICES[item.id]?.[currency];
    if (regionalFixed !== undefined) {
      finalAmount = Number(regionalFixed.toFixed(meta.decimals));
      exchangeRate = finalAmount / (item.basePriceINR || 1);
    } else {
      exchangeRate = getExchangeRateFromINR(currency, params.liveRatesUSD);
      const rawConverted = item.basePriceINR * exchangeRate;
      finalAmount = Number(rawConverted.toFixed(meta.decimals));
    }
    minorUnits = toMinorUnits(finalAmount, currency);
    // Recalibrate finalAmount directly from minor units to guarantee 0 drift
    finalAmount = fromMinorUnits(minorUnits, currency);
  }

  const quoteData = {
    quoteId,
    itemId: item.id,
    serviceType: item.serviceType,
    basePriceINR: item.basePriceINR,
    targetCurrency: currency,
    finalAmount,
    minorUnits,
    createdAt: now,
    expiresAt,
  };

  const signature = signQuotePayload(quoteData);

  return {
    ...quoteData,
    itemTitle: params.customTitle || item.title,
    exchangeRate: Number(exchangeRate.toFixed(6)),
    currencyDecimals: meta.decimals,
    currencySymbol: meta.symbol,
    isFree,
    freeReason: params.freeReason || (isFree ? 'Promotional Complimentary Access' : undefined),
    signature,
  };
}

/**
 * Verifies that a quote's cryptographic signature is authentic and the quote is not expired.
 */
export function verifyBillingQuote(quote: BillingQuote): { valid: boolean; reason?: string } {
  if (!quote || !quote.quoteId || !quote.signature) {
    return { valid: false, reason: 'Missing quote parameters or signature.' };
  }

  const now = Date.now();
  if (now > quote.expiresAt) {
    return { valid: false, reason: 'Billing quote has expired (15-minute TTL exceeded). Please refresh quote.' };
  }

  const expectedSignature = signQuotePayload({
    quoteId: quote.quoteId,
    itemId: quote.itemId,
    serviceType: quote.serviceType,
    basePriceINR: quote.basePriceINR,
    targetCurrency: quote.targetCurrency,
    finalAmount: quote.finalAmount,
    minorUnits: quote.minorUnits,
    createdAt: quote.createdAt,
    expiresAt: quote.expiresAt,
  });

  const valid = crypto.timingSafeEqual(
    Buffer.from(quote.signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );

  if (!valid) {
    return { valid: false, reason: 'Invalid quote cryptographic signature. Possible tampering detected.' };
  }

  return { valid: true };
}
