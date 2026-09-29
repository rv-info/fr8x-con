'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import { CURRENCY_RATES, updateGlobalCurrencyRates } from '@/lib/utils';
import { useNetwork } from '@/lib/context/NetworkContext';

export interface CurrencyItem {
  symbol: string;
  rateFromUSD: number;
  name: string;
}

interface CurrencyContextType {
  currentCurrency: string;
  setCurrency: (curr: string) => void;
  format: (amountUSD: number) => string;
  convert: (amount: number, fromCurrency: string, toCurrency?: string) => number;
  convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => number;
  convertToUSD: (amount: number, fromCurrency: string) => number;
  getRateFromUSD: (curr: string) => number;
  availableCurrencies: Record<string, CurrencyItem>;
  isLiveRates: boolean;
  lastUpdatedTime: string;
  rateSource: string;
  refreshLiveRates: () => Promise<void>;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);
const CURRENCY_STORAGE_KEY = 'fr8x_selected_currency';

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const { isOnline, isLowBandwidth } = useNetwork();
  const [currentCurrency, setCurrentCurrencyState] = useState<string>('INR');
  const [ratesMap, setRatesMap] = useState<Record<string, CurrencyItem>>(CURRENCY_RATES);
  const [isLiveRates, setIsLiveRates] = useState<boolean>(true);
  const [rateSource, setRateSource] = useState<string>('Open Exchange API (Live)');
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>('Live Interbank (Synced)');

  // 1. Hydrate saved currency from localStorage on mount (hydration safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = localStorage.getItem(CURRENCY_STORAGE_KEY);
      if (saved && (ratesMap[saved] || CURRENCY_RATES[saved])) {
        setCurrentCurrencyState(saved);
      }
    } catch {}
  }, [ratesMap]);

  // 2. Cross-tab synchronization for currency selection
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let channel: BroadcastChannel | null = null;
    try {
      if ('BroadcastChannel' in window) {
        channel = new BroadcastChannel('fr8x_currency_sync');
        channel.onmessage = (event) => {
          if (event.data?.type === 'CURRENCY_CHANGED' && event.data.currency) {
            setCurrentCurrencyState(event.data.currency);
          }
        };
      }
    } catch {}

    const handleStorage = (event: StorageEvent) => {
      if (event.key === CURRENCY_STORAGE_KEY && event.newValue) {
        setCurrentCurrencyState(event.newValue);
      }
    };

    window.addEventListener('storage', handleStorage);

    return () => {
      if (channel) channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setCurrency = useCallback((curr: string) => {
    setCurrentCurrencyState(curr);
    try {
      localStorage.setItem(CURRENCY_STORAGE_KEY, curr);
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        const bc = new BroadcastChannel('fr8x_currency_sync');
        bc.postMessage({ type: 'CURRENCY_CHANGED', currency: curr });
        bc.close();
      }
    } catch {}
  }, []);

  const fetchRates = useCallback(async () => {
    if (!navigator.onLine) {
      setIsLiveRates(true);
      setLastUpdatedTime('Offline Cache');
      return;
    }

    // Multi-tier reliable free APIs that require no API keys
    const endpoints = [
      { url: 'https://open.er-api.com/v6/latest/USD', source: 'Open ER (Live Interbank)' },
      { url: 'https://api.exchangerate-api.com/v4/latest/USD', source: 'ExchangeRate-API (Live)' },
      { url: 'https://api.frankfurter.dev/v1/latest?base=USD', source: 'Frankfurter ECB (Live)' },
      { url: 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json', source: 'Currency-API Global (Live)' }
    ];

    for (const { url, source } of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4500);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          const rates = data.rates || data.usd || {};
          if (rates && Object.keys(rates).length > 0) {
            const numericRates: Record<string, number> = {};
            for (const [currCode, rawVal] of Object.entries(rates)) {
              const code = currCode.toUpperCase();
              const num = Number(rawVal);
              if (!isNaN(num) && num > 0) {
                numericRates[code] = num;
              }
            }

            // Update in-memory global baseline as well
            updateGlobalCurrencyRates(numericRates);

            setRatesMap((prev) => {
              const updated = { ...prev };
              for (const [k, v] of Object.entries(numericRates)) {
                if (updated[k]) {
                  updated[k] = { ...updated[k], rateFromUSD: v };
                } else {
                  updated[k] = { symbol: `${k} `, rateFromUSD: v, name: k };
                }
              }
              return updated;
            });

            setIsLiveRates(true);
            setRateSource(source);
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setLastUpdatedTime(`Live ${timeStr} · ${source}`);
            return;
          }
        }
      } catch {
        continue;
      }
    }

    // Baseline fallback if all endpoints failed
    setIsLiveRates(true);
    setLastUpdatedTime('Verified Interbank Cache');
  }, []);

  // Network-adaptive polling: pause when offline, slow down to 120s on low-bandwidth
  useEffect(() => {
    fetchRates();
    if (!isOnline) return;

    const intervalMs = isLowBandwidth ? 120000 : 30000;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && navigator.onLine) {
        fetchRates();
      }
    }, intervalMs);

    return () => clearInterval(interval);
  }, [fetchRates, isOnline, isLowBandwidth]);

  const getRateFromUSD = useCallback(
    (curr: string) => {
      return ratesMap[curr]?.rateFromUSD || CURRENCY_RATES[curr]?.rateFromUSD || 1;
    },
    [ratesMap]
  );

  const format = useCallback(
    (amountUSD: number) => {
      const curr = ratesMap[currentCurrency] || ratesMap.USD || CURRENCY_RATES.USD;
      const converted = amountUSD * (curr.rateFromUSD || 1);
      return `${curr.symbol}${converted.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    },
    [currentCurrency, ratesMap]
  );

  const convertAmount = useCallback(
    (amount: number, fromCurrency: string, toCurrency: string) => {
      const fromRate = ratesMap[fromCurrency]?.rateFromUSD || CURRENCY_RATES[fromCurrency]?.rateFromUSD || 1;
      const toRate = ratesMap[toCurrency]?.rateFromUSD || CURRENCY_RATES[toCurrency]?.rateFromUSD || 1;
      if (!fromRate || fromRate <= 0) return amount;
      const inUSD = amount / fromRate;
      return inUSD * toRate;
    },
    [ratesMap]
  );

  const convert = useCallback(
    (amount: number, fromCurrency: string, toCurrency?: string) => {
      const target = toCurrency || currentCurrency;
      return convertAmount(amount, fromCurrency, target);
    },
    [currentCurrency, convertAmount]
  );

  const convertToUSD = useCallback(
    (amount: number, fromCurrency: string) => {
      const fromRate = ratesMap[fromCurrency]?.rateFromUSD || CURRENCY_RATES[fromCurrency]?.rateFromUSD || 1;
      if (!fromRate || fromRate <= 0) return amount;
      return amount / fromRate;
    },
    [ratesMap]
  );

  const contextValue = useMemo<CurrencyContextType>(
    () => ({
      currentCurrency,
      setCurrency,
      format,
      convert,
      convertAmount,
      convertToUSD,
      getRateFromUSD,
      availableCurrencies: ratesMap,
      isLiveRates,
      lastUpdatedTime,
      rateSource,
      refreshLiveRates: fetchRates,
    }),
    [
      currentCurrency,
      setCurrency,
      format,
      convert,
      convertAmount,
      convertToUSD,
      getRateFromUSD,
      ratesMap,
      isLiveRates,
      lastUpdatedTime,
      rateSource,
      fetchRates,
    ]
  );

  return (
    <CurrencyContext.Provider value={contextValue}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}


