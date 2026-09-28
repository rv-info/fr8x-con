/**
 * features/rates/services/rateService.ts
 * Domain Service for Freight Rates Management
 *
 * Implements authoritative rate fetching, validation, and cloud synchronization
 * per Directive Section 10 & 42.
 */

import { RateItem, RateVersion } from '@/lib/types';
import {
  getRatesFromDB,
  upsertRateInDB,
  deleteRateInDB,
  batchUpsertRatesInDB,
  batchUpdateRatesInDB,
} from '@/lib/firebase/firestore';

export const DUMMY_RATE_IDS = new Set([
  'RT-884210', 'RT-992144', 'RT-773190', 'RT-662810', 'RT-551940', 'RT-448201', 'RT-339105', 'RT-227490',
  'RT-000001', 'RT-000002', 'RT-000003', 'RT-000004', 'RT-000005', 'RT-000006', 'RT-000007', 'RT-000008',
  'IRT-901234', 'RT-773322'
]);

export function isDummyRate(r: any): boolean {
  if (!r) return true;
  if (r.id && DUMMY_RATE_IDS.has(String(r.id))) return true;
  const prov = String(r.provider || r.carrier || '').toLowerCase();
  if (prov.includes('dummy') || prov.includes('mock carrier')) return true;
  return false;
}

export const rateService = {
  /**
   * Fetches rates from Firestore with optional user filter and limit.
   */
  async getRates(ownerUid?: string, limitCount = 50): Promise<RateItem[]> {
    try {
      const rates = await getRatesFromDB(ownerUid, limitCount);
      return rates.filter((r) => !isDummyRate(r));
    } catch (err) {
      console.warn('[RateService] Error fetching rates:', err);
      return [];
    }
  },

  /**
   * Fetches authoritative rates from Server API (/api/rates).
   */
  async fetchServerRates(): Promise<RateItem[]> {
    try {
      const res = await fetch('/api/rates');
      if (!res.ok) return [];
      const data = await res.json();
      if (data?.success && Array.isArray(data.rates)) {
        return data.rates.filter((r: RateItem) => !isDummyRate(r));
      }
      return [];
    } catch (err) {
      console.warn('[RateService] Error fetching server rates:', err);
      return [];
    }
  },

  /**
   * Persists a rate to Firestore and local storage.
   */
  async saveRate(rate: RateItem): Promise<void> {
    if (isDummyRate(rate)) return;
    await upsertRateInDB(rate);
  },

  /**
   * Deletes a rate in Firestore.
   */
  async deleteRate(rateId: string): Promise<void> {
    await deleteRateInDB(rateId);
  },

  /**
   * Bulk updates rates with optional revisions.
   */
  async batchUpdate(
    updates: { id: string; updates: Partial<RateItem>; revision?: RateVersion }[]
  ): Promise<void> {
    await batchUpdateRatesInDB(updates);
  },

  /**
   * Filters a list to ensure only valid, non-dummy rates are presented.
   */
  sanitizeRates(rates: RateItem[]): RateItem[] {
    return rates.filter((r) => !isDummyRate(r));
  },
};
