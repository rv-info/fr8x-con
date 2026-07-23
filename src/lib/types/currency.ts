// FR8X-CON Currency Types

import type { AuditFields } from "./common";

export type CurrencyCode = string; // ISO 4217: USD, INR, EUR, etc.

export type Currency = {
  code: CurrencyCode;
  name: string;
  symbol: string;
  lastRate: number; // Rate against USD
  lastUpdated: AuditFields["createdAt"];
  source: string;
};

export type ExchangeRate = {
  from: CurrencyCode;
  to: CurrencyCode;
  rate: number;
  timestamp: number;
  source: string;
  isCached: boolean;
  isStale: boolean;
};

export type CurrencyProviderConfig = {
  provider: "exchangerate-api" | "openexchangerates" | "fixer" | "custom";
  apiKey?: string;
  baseUrl: string;
  cacheTTL: number; // seconds
  fallbackEnabled: boolean;
};

export interface ICurrencyProvider {
  getRate(from: CurrencyCode, to: CurrencyCode): Promise<ExchangeRate>;
  getRates(base: CurrencyCode): Promise<Record<CurrencyCode, number>>;
  getLastKnown(from: CurrencyCode, to: CurrencyCode): ExchangeRate | null;
  isAvailable(): Promise<boolean>;
}

// Common currencies for freight industry
export const FREIGHT_CURRENCIES: CurrencyCode[] = [
  "USD",
  "INR",
  "EUR",
  "GBP",
  "AED",
  "SGD",
  "CNY",
  "JPY",
  "KRW",
  "THB",
  "MYR",
  "HKD",
  "AUD",
  "NZD",
  "ZAR",
  "BRL",
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  INR: "₹",
  EUR: "€",
  GBP: "£",
  AED: "د.إ",
  SGD: "S$",
  CNY: "¥",
  JPY: "¥",
  KRW: "₩",
  THB: "฿",
  MYR: "RM",
  HKD: "HK$",
  AUD: "A$",
  NZD: "NZ$",
  ZAR: "R",
  BRL: "R$",
};
