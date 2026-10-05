/**
 * features/auctions/services/auctionService.ts
 * Domain Service for Freight Auctions Management
 *
 * Implements authoritative auction query, bid submission, and cloud persistence
 * via Supabase PostgreSQL per Directive Section 10 & 42.
 */

import { Auction, SubmittedBid } from '@/lib/types';
import { auctionDbService } from '@/lib/supabase/db';

export const DUMMY_AUCTION_IDS = new Set([
  'RA-2026-0842', 'GB-2026-0311', 'RA-2026-0901', 'RA-2026-0788', 'RA-2026-0940', 'RA-2026-0955', 'RA-2026-0843'
]);

export function isDummyAuction(a: any): boolean {
  if (!a) return true;
  if (a.id && DUMMY_AUCTION_IDS.has(String(a.id))) return true;
  const title = String(a.title || '').toLowerCase();
  if (title.includes('dummy') || title.includes('mock auction')) return true;
  return false;
}

export const auctionService = {
  /**
   * Fetches active auctions from Supabase PostgreSQL.
   */
  async getAuctions(limitCount = 30): Promise<Auction[]> {
    try {
      const auctions = await auctionDbService.getAuctions();
      return auctions.slice(0, limitCount).filter((a) => !isDummyAuction(a));
    } catch (err) {
      console.warn('[AuctionService] Error fetching auctions:', err);
      return [];
    }
  },

  /**
   * Creates or updates an auction in Supabase PostgreSQL.
   */
  async saveAuction(auction: Auction): Promise<void> {
    if (isDummyAuction(auction)) return;
    await auctionDbService.upsertAuction(auction);
  },

  /**
   * Submits a bid to an auction in Supabase PostgreSQL.
   */
  async submitBid(auctionId: string, bid: SubmittedBid): Promise<void> {
    await auctionDbService.submitBid({ ...bid, auctionId });
  },

  /**
   * Filters an auction list to ensure only non-dummy items are retained.
   */
  sanitizeAuctions(auctions: Auction[]): Auction[] {
    return auctions.filter((a) => !isDummyAuction(a));
  },
};
