// FR8X-CON Utility: Formatting helpers

import { CURRENCY_SYMBOLS } from "@/lib/types/currency";

/**
 * Format a date string to a human-readable format.
 */
export function formatDate(
  date: string | Date | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...options,
  };
  return new Intl.DateTimeFormat("en-IN", defaultOptions).format(
    typeof date === "string" ? new Date(date) : date
  );
}

/**
 * Format a date to relative time (e.g., "2 hours ago").
 */
export function formatRelativeTime(date: string | Date | number): string {
  const now = Date.now();
  const target = typeof date === "string" ? new Date(date).getTime() : typeof date === "number" ? date : date.getTime();
  const diffMs = now - target;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffWeeks < 4) return `${diffWeeks}w ago`;
  if (diffMonths < 12) return `${diffMonths}mo ago`;
  return formatDate(date);
}

/**
 * Format a number as currency.
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = "USD",
  options?: Intl.NumberFormatOptions
): string {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
      ...options,
    }).format(amount);
  } catch {
    // Fallback for unsupported currency codes
    const symbol = CURRENCY_SYMBOLS[currencyCode] || currencyCode;
    return `${symbol}${formatNumber(amount)}`;
  }
}

/**
 * Format a number with thousands separators.
 */
export function formatNumber(
  num: number,
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
    ...options,
  }).format(num);
}

/**
 * Format a number in compact form (e.g., 1.2K, 3.4M).
 */
export function formatCompactNumber(num: number): string {
  return new Intl.NumberFormat("en", {
    notation: "compact",
    compactDisplay: "short",
  }).format(num);
}

/**
 * Truncate text to a maximum length with ellipsis.
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "…";
}

/**
 * Convert a Firestore timestamp to a Date.
 */
export function timestampToDate(timestamp: {
  seconds: number;
  nanoseconds: number;
}): Date {
  return new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
}

/**
 * Generate initials from a full name.
 */
export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * Format weight with unit.
 */
export function formatWeight(kg: number): string {
  if (kg >= 1000) {
    return `${formatNumber(kg / 1000)} MT`;
  }
  return `${formatNumber(kg)} KG`;
}

/**
 * Format transit time in days.
 */
export function formatTransitTime(days: number): string {
  if (days === 1) return "1 day";
  return `${days} days`;
}
