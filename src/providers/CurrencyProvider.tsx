// FR8X-CON Currency Provider
// Provider-agnostic live currency data with caching and fallback

"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import type {
  CurrencyCode,
  ExchangeRate,
} from "@/lib/types/currency";
import { CURRENCY_CACHE_TTL } from "@/lib/utils/constants";

type CurrencyContextType = {
  getRate: (from: CurrencyCode, to: CurrencyCode) => ExchangeRate | null;
  convert: (amount: number, from: CurrencyCode, to: CurrencyCode) => number | null;
  isLoading: boolean;
  isAvailable: boolean;
  lastUpdated: Date | null;
  error: string | null;
  supportedCurrencies: CurrencyCode[];
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// In-memory cache
const rateCache = new Map<string, { rate: ExchangeRate; expiresAt: number }>();

// LocalStorage fallback keys
const LS_RATES_KEY = "fr8x_currency_rates";
const LS_TIMESTAMP_KEY = "fr8x_currency_timestamp";

function getCacheKey(from: CurrencyCode, to: CurrencyCode): string {
  return `${from}_${to}`;
}

function getFromLocalStorage(): Record<string, number> | null {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(LS_RATES_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function saveToLocalStorage(rates: Record<string, number>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LS_RATES_KEY, JSON.stringify(rates));
    localStorage.setItem(LS_TIMESTAMP_KEY, Date.now().toString());
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [rates, setRates] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAvailable, setIsAvailable] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchRates = useCallback(async () => {
    const baseUrl = process.env.NEXT_PUBLIC_CURRENCY_API_BASE_URL;
    if (!baseUrl) {
      // Fallback to cached rates
      const cached = getFromLocalStorage();
      if (cached) {
        setRates(cached);
        setIsAvailable(false);
        setError("Currency API not configured — using cached rates");
      } else {
        setError("Currency API not configured");
        setIsAvailable(false);
      }
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${baseUrl}/latest/USD`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      if (data.rates) {
        setRates(data.rates);
        saveToLocalStorage(data.rates);
        setIsAvailable(true);
        setLastUpdated(new Date());
        setError(null);
      }
    } catch (err) {
      console.warn("Currency fetch failed, using fallback:", err);
      // Fallback to last-known values
      const cached = getFromLocalStorage();
      if (cached) {
        setRates(cached);
        setError("Using cached currency rates — live feed unavailable");
      } else {
        setError("Currency data unavailable");
      }
      setIsAvailable(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
    // Refresh at configured interval
    const interval = setInterval(fetchRates, CURRENCY_CACHE_TTL * 1000);
    return () => clearInterval(interval);
  }, [fetchRates]);

  const getRate = useCallback(
    (from: CurrencyCode, to: CurrencyCode): ExchangeRate | null => {
      const cacheKey = getCacheKey(from, to);

      // Check in-memory cache first
      const cached = rateCache.get(cacheKey);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.rate;
      }

      // Calculate from base rates (USD-based)
      const fromRate = from === "USD" ? 1 : rates[from];
      const toRate = to === "USD" ? 1 : rates[to];

      if (!fromRate || !toRate) return null;

      const rate = toRate / fromRate;
      const exchangeRate: ExchangeRate = {
        from,
        to,
        rate,
        timestamp: Date.now(),
        source: isAvailable ? "live" : "cached",
        isCached: !isAvailable,
        isStale: !isAvailable,
      };

      // Cache it
      rateCache.set(cacheKey, {
        rate: exchangeRate,
        expiresAt: Date.now() + CURRENCY_CACHE_TTL * 1000,
      });

      return exchangeRate;
    },
    [rates, isAvailable]
  );

  const convert = useCallback(
    (amount: number, from: CurrencyCode, to: CurrencyCode): number | null => {
      if (from === to) return amount;
      const exchangeRate = getRate(from, to);
      if (!exchangeRate) return null;
      return amount * exchangeRate.rate;
    },
    [getRate]
  );

  const supportedCurrencies = useMemo(() => Object.keys(rates), [rates]);

  const value = useMemo(
    () => ({
      getRate,
      convert,
      isLoading,
      isAvailable,
      lastUpdated,
      error,
      supportedCurrencies,
    }),
    [getRate, convert, isLoading, isAvailable, lastUpdated, error, supportedCurrencies]
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error("useCurrency must be used within a CurrencyProvider");
  }
  return context;
}
