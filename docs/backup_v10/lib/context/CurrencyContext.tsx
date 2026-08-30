'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CURRENCY_RATES, formatCurrency, convertAmount } from '@/lib/utils';

interface CurrencyContextType {
  currentCurrency: string;
  setCurrency: (curr: string) => void;
  format: (amountUSD: number) => string;
  convert: (amount: number, fromCurrency: string) => number;
  availableCurrencies: typeof CURRENCY_RATES;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currentCurrency, setCurrentCurrency] = useState<string>('INR');

  const format = (amountUSD: number) => formatCurrency(amountUSD, currentCurrency);
  const convert = (amount: number, fromCurrency: string) =>
    convertAmount(amount, fromCurrency, currentCurrency);

  return (
    <CurrencyContext.Provider
      value={{
        currentCurrency,
        setCurrency: setCurrentCurrency,
        format,
        convert,
        availableCurrencies: CURRENCY_RATES,
      }}
    >
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
