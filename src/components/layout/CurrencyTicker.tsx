// FR8X-CON Currency Ticker Strip — Dark Theme, Compact (28px)

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

const tickerBaseClass = "h-[28px] flex items-center overflow-hidden bg-[#1E2329] border-b border-[#333B44] text-[9px]";

export function CurrencyTicker() {
  const { getRate, isLoading } = useCurrency();

  if (isLoading) {
    return (
      <div className={tickerBaseClass}>
        <div className="flex items-center gap-2 px-3">
          <div className="h-1.5 w-1.5 rounded-full bg-[#0EA5E9] animate-pulse-soft" />
          <span className="text-[#94A3B8]">Loading rates...</span>
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
      <div className={tickerBaseClass}>
        <div className="flex items-center gap-2 px-3">
          <div className="h-1.5 w-1.5 rounded-full bg-[#EAB308]" />
          <span className="text-[#94A3B8]">
            Rates unavailable — retrying
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={tickerBaseClass}>
      <div className="flex animate-ticker-scroll">
        {[...tickerItems, ...tickerItems].map((item, idx) =>
          item ? (
            <div key={idx} className="flex items-center gap-3 px-4 whitespace-nowrap">
              <span className="text-[#94A3B8]">{item.pair}</span>
              <span className="text-[#E2E8F0] tabular-nums">
                {item.symbol}{item.rate}
              </span>
              {item.isStale && (
                <span className="text-[#EAB308] text-[8px]">●</span>
              )}
            </div>
          ) : null
        )}
      </div>
    </div>
  );
}
