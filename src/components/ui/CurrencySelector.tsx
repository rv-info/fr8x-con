// FR8X-CON Global Currency Selector Header Component
"use client";

import { useState, useEffect } from "react";
import { Globe } from "lucide-react";
import {
  getPreferredCurrency,
  setPreferredCurrency,
  CURRENCY_MAP,
  type SupportedCurrency,
} from "@/lib/services/currencyService";

export function CurrencySelector() {
  const [currency, setCurrency] = useState<SupportedCurrency>("INR");

  useEffect(() => {
    setCurrency(getPreferredCurrency());

    const handleCurrencyChange = () => {
      setCurrency(getPreferredCurrency());
    };

    window.addEventListener("fr8x_currency_changed", handleCurrencyChange);
    return () => window.removeEventListener("fr8x_currency_changed", handleCurrencyChange);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value as SupportedCurrency;
    setCurrency(selected);
    setPreferredCurrency(selected);
  };

  return (
    <div className="flex items-center gap-1.5 bg-slate-100/80 hover:bg-slate-200/80 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-[var(--fr8x-jet)] transition-colors">
      <Globe className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)] shrink-0" />
      <select
        value={currency}
        onChange={handleChange}
        className="bg-transparent border-none focus:outline-none focus:ring-0 text-[11px] font-bold cursor-pointer pr-1"
        title="Select Preferred Display Currency"
      >
        {Object.values(CURRENCY_MAP).map((c) => (
          <option key={c.code} value={c.code}>
            {c.code} ({c.symbol.trim()})
          </option>
        ))}
      </select>
    </div>
  );
}
