// FR8X-CON Currency Ticker Strip — Compact (28px)

"use client";

import { useCurrency } from "@/providers/CurrencyProvider";
import { CURRENCY_SYMBOLS } from "@/lib/types/currency";

const TICKER_PAIRS: [string, string][] = [
  ["USD", "INR"],
  ["EUR", "INR"],
  ["GBP", "INR"],
  ["USD", "EUR"],
  ["AED", "INR"],
  ["SGD", "INR"],
  ["CNY", "INR"],
  ["JPY", "INR"],
  ["USD", "GBP"],
  ["USD", "SGD"],
];

export function CurrencyTicker() {
  const { getRate, isLoading } = useCurrency();

  if (isLoading) {
    return (
      <div className="fr8x-ticker">
        <div className="flex items-center gap-2 px-3">
          <div className="h-1.5 w-1.5 rounded-full bg-brand-400 animate-pulse-soft" />
          <span className="text-brand-300">Loading rates...</span>
        </div>
      </div>
    );
  }

  const tickerItems = TICKER_PAIRS.map(([from, to]) => {
    const rate = getRate(from, to);
    if (!rate) return null;

    return {
      pair: `${from}/${to}`,
      rate: rate.rate.toFixed(from === "JPY" || to === "JPY" ? 4 : 2),
      symbol: CURRENCY_SYMBOLS[to] || to,
      isStale: rate.isStale,
    };
  }).filter(Boolean);

  if (tickerItems.length === 0) {
    return (
      <div className="fr8x-ticker">
        <div className="flex items-center gap-2 px-3">
          <div className="h-1.5 w-1.5 rounded-full bg-warning" />
          <span className="text-brand-300">
            Rates unavailable — retrying
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="fr8x-ticker">
      <div className="flex animate-ticker-scroll">
        {[...tickerItems, ...tickerItems].map((item, idx) =>
          item ? (
            <div key={idx} className="flex items-center gap-3 px-4 whitespace-nowrap">
              <span className="text-brand-300 font-medium">{item.pair}</span>
              <span className="text-white font-semibold tabular-nums">
                {item.symbol}{item.rate}
              </span>
              {item.isStale && (
                <span className="text-warning text-[8px]">●</span>
              )}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
