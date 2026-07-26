// FR8X-CON Economic & Strategic Procurement Intelligence Engine (TCO Scoring & Currency Normalization)

import type { StrategicScoringWeights } from "@/lib/types/auction";
import type { SupplierGovernanceProfile } from "@/lib/types/supplierGovernance";

// Fixed exchange rates relative to 1 USD
export const CURRENCY_RATES_TO_USD: Record<string, number> = {
  USD: 1.0,
  INR: 0.012, // 1 INR = 0.012 USD (~83.3 INR/USD)
  EUR: 1.09,  // 1 EUR = 1.09 USD
  GBP: 1.28,  // 1 GBP = 1.28 USD
  AED: 0.27,  // 1 AED = 0.27 USD
  SGD: 0.74,  // 1 SGD = 0.74 USD
  CNY: 0.14,  // 1 CNY = 0.14 USD
};

/**
 * Normalizes any monetary amount from source currency to target currency (default USD)
 */
export function normalizeCurrency(
  amount: number,
  fromCurrency: string = "USD",
  toCurrency: string = "USD"
): number {
  if (fromCurrency === toCurrency) return amount;
  const fromRateInUSD = CURRENCY_RATES_TO_USD[fromCurrency.toUpperCase()] || 1.0;
  const toRateInUSD = CURRENCY_RATES_TO_USD[toCurrency.toUpperCase()] || 1.0;
  
  // Convert from source to USD then to target currency
  const amountInUSD = amount * fromRateInUSD;
  return amountInUSD / toRateInUSD;
}

/**
 * Calculate Total Cost of Ownership (TCO) & Strategic Procurement Score (0 to 100).
 * Lower Commercial Price gives higher price score.
 * Higher Supplier Rating & KPIs give higher strategic score.
 */
export function calculateTCOScore(params: {
  bidAmountUSD: number;
  lowestBidUSD: number;
  highestBidUSD: number;
  supplierProfile?: Partial<SupplierGovernanceProfile>;
  scoringWeights?: StrategicScoringWeights;
}): number {
  const { bidAmountUSD, lowestBidUSD, highestBidUSD, supplierProfile, scoringWeights } = params;

  const weights = scoringWeights || {
    priceWeight: 60,
    performanceWeight: 15,
    onTimeWeight: 10,
    spaceAvailabilityWeight: 10,
    docAccuracyWeight: 5,
  };

  // 1. Price Score (100 for lowest, relative scale for higher)
  let priceScore = 100;
  if (highestBidUSD > lowestBidUSD) {
    const range = highestBidUSD - lowestBidUSD;
    const offset = bidAmountUSD - lowestBidUSD;
    priceScore = Math.max(0, 100 - (offset / range) * 50); // Scale between 50 and 100
  } else if (bidAmountUSD > lowestBidUSD) {
    priceScore = (lowestBidUSD / bidAmountUSD) * 100;
  }

  // 2. Performance Rating Score (0 to 100 based on 5-star rating)
  const rating = supplierProfile?.overallRating || 4.0;
  const performanceScore = (rating / 5.0) * 100;

  // 3. On-Time Delivery % Score
  const onTimeScore = supplierProfile?.onTimeDeliveryPct || 92;

  // 4. Space Availability % Score
  const spaceScore = supplierProfile?.spaceAvailabilityPct || 95;

  // 5. Documentation Accuracy % Score
  const docScore = supplierProfile?.documentationAccuracyPct || 98;

  // Weighted score calculation
  const totalWeight =
    weights.priceWeight +
    weights.performanceWeight +
    weights.onTimeWeight +
    weights.spaceAvailabilityWeight +
    weights.docAccuracyWeight;

  const weightedSum =
    priceScore * (weights.priceWeight / totalWeight) +
    performanceScore * (weights.performanceWeight / totalWeight) +
    onTimeScore * (weights.onTimeWeight / totalWeight) +
    spaceScore * (weights.spaceAvailabilityWeight / totalWeight) +
    docScore * (weights.docAccuracyWeight / totalWeight);

  return Math.round(weightedSum * 10) / 10; // Round to 1 decimal
}
