// FR8X-CON Centralized Live Currency Conversion Service
"use client";

export type SupportedCurrency =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "AED"
  | "SGD"
  | "JPY"
  | "AUD"
  | "CAD"
  | "CHF"
  | "CNY"
  | "SAR"
  | "QAR"
  | "KWD"
  | "OMR"
  | "BHD";

export interface CurrencyRateInfo {
  code: SupportedCurrency;
  name: string;
  symbol: string;
  rateToINR: number; // 1 Currency = X INR
}

export const CURRENCY_MAP: Record<SupportedCurrency, CurrencyRateInfo> = {
  INR: { code: "INR", name: "Indian Rupee", symbol: "₹", rateToINR: 1.0 },
  USD: { code: "USD", name: "US Dollar", symbol: "$", rateToINR: 83.5 },
  EUR: { code: "EUR", name: "Euro", symbol: "€", rateToINR: 90.2 },
  GBP: { code: "GBP", name: "British Pound", symbol: "£", rateToINR: 106.8 },
  AED: { code: "AED", name: "UAE Dirham", symbol: "AED ", rateToINR: 22.73 },
  SGD: { code: "SGD", name: "Singapore Dollar", symbol: "S$", rateToINR: 61.8 },
  JPY: { code: "JPY", name: "Japanese Yen", symbol: "¥", rateToINR: 0.55 },
  AUD: { code: "AUD", name: "Australian Dollar", symbol: "A$", rateToINR: 54.2 },
  CAD: { code: "CAD", name: "Canadian Dollar", symbol: "C$", rateToINR: 61.1 },
  CHF: { code: "CHF", name: "Swiss Franc", symbol: "CHF ", rateToINR: 94.1 },
  CNY: { code: "CNY", name: "Chinese Yuan", symbol: "¥", rateToINR: 11.5 },
  SAR: { code: "SAR", name: "Saudi Riyal", symbol: "SAR ", rateToINR: 22.25 },
  QAR: { code: "QAR", name: "Qatari Riyal", symbol: "QAR ", rateToINR: 22.9 },
  KWD: { code: "KWD", name: "Kuwaiti Dinar", symbol: "KWD ", rateToINR: 272.5 },
  OMR: { code: "OMR", name: "Omani Rial", symbol: "OMR ", rateToINR: 216.8 },
  BHD: { code: "BHD", name: "Bahraini Dinar", symbol: "BHD ", rateToINR: 221.5 },
};

const USER_CURRENCY_KEY = "fr8x_user_currency";

export function getPreferredCurrency(): SupportedCurrency {
  if (typeof window === "undefined") return "INR";
  try {
    const saved = localStorage.getItem(USER_CURRENCY_KEY);
    if (saved && saved in CURRENCY_MAP) return saved as SupportedCurrency;
  } catch (err) {
    console.error("Error loading preferred currency:", err);
  }
  return "INR";
}

export function setPreferredCurrency(currency: SupportedCurrency): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(USER_CURRENCY_KEY, currency);
    window.dispatchEvent(new Event("fr8x_currency_changed"));
  } catch (err) {
    console.error("Error saving preferred currency:", err);
  }
}

/**
 * Convert an amount from one currency to another currency
 */
export function convertCurrency(
  amount: number,
  from: SupportedCurrency = "INR",
  to: SupportedCurrency = "INR"
): number {
  if (from === to || amount === 0) return amount;
  const fromInfo = CURRENCY_MAP[from] || CURRENCY_MAP.INR;
  const toInfo = CURRENCY_MAP[to] || CURRENCY_MAP.INR;

  // Convert to INR first, then to target currency
  const amountInINR = amount * fromInfo.rateToINR;
  return amountInINR / toInfo.rateToINR;
}

/**
 * Format currency amount with symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: SupportedCurrency = "INR"
): string {
  const info = CURRENCY_MAP[currencyCode] || CURRENCY_MAP.INR;
  const formattedNum = amount.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${info.symbol}${formattedNum}`;
}
