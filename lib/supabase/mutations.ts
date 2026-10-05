/**
 * lib/supabase/mutations.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Domain Mutation Layer for FR8X.
 * Handles validation, authorization, PostgreSQL write, audit logging,
 * and returns the authoritative confirmed database result.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getSupabaseBrowserClient } from './client';
import { handleSupabaseError } from './errors';
import { validateProfileUpdate } from './validation';
import { AuditLogger } from './audit';
import { ProfileRow, CompanyRow, RateRow, AuctionBidRow, PostRow } from './types';

export class DomainMutations {
  /**
   * Authoritative profile update:
   * 1. Validates and normalizes phone, designation, location
   * 2. Writes to public.profiles in PostgreSQL
   * 3. Confirms write succeeded
   * 4. Logs change to public.audit_logs
   * 5. Returns confirmed ProfileRow
   */
  static async updateProfile(
    userId: string,
    updates: Record<string, any>
  ): Promise<ProfileRow> {
    const validated = validateProfileUpdate(updates);
    const client = getSupabaseBrowserClient();

    try {
      const { data, error } = await (client.from('profiles') as any)
        .update(validated)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error, 'DomainMutations.updateProfile');
      }

      // Record audit log
      AuditLogger.log({
        userId,
        action: 'UPDATE_PROFILE',
        entity: 'profiles',
        entityId: userId,
        newData: validated,
      }).catch(() => {});

      return data as ProfileRow;
    } catch (err) {
      throw handleSupabaseError(err, 'DomainMutations.updateProfile');
    }
  }

  /**
   * Upsert company record in PostgreSQL.
   */
  static async upsertCompany(company: Partial<CompanyRow> & { id: string; name: string }): Promise<CompanyRow> {
    const client = getSupabaseBrowserClient();
    try {
      const { data, error } = await (client.from('companies') as any)
        .upsert(company)
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error, 'DomainMutations.upsertCompany');
      }

      return data as CompanyRow;
    } catch (err) {
      throw handleSupabaseError(err, 'DomainMutations.upsertCompany');
    }
  }

  /**
   * Place an auction bid in PostgreSQL.
   */
  static async placeBid(bid: {
    auctionId: string;
    bidderId: string;
    bidderCompany?: string;
    amount: number;
    transitDays?: number;
    freeDays?: number;
    carrier?: string;
    routing?: string;
    remarks?: string;
  }): Promise<AuctionBidRow> {
    const client = getSupabaseBrowserClient();
    try {
      const { data, error } = await (client.from('auction_bids') as any)
        .insert({
          id: `bid_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          auction_id: bid.auctionId,
          bidder_id: bid.bidderId,
          bidder_company: bid.bidderCompany || null,
          amount: bid.amount,
          transit_days: bid.transitDays || null,
          free_days: bid.freeDays || null,
          carrier: bid.carrier || null,
          routing: bid.routing || null,
          remarks: bid.remarks || null,
          status: 'submitted',
        })
        .select()
        .single();

      if (error) {
        throw handleSupabaseError(error, 'DomainMutations.placeBid');
      }

      // Also update auction current lowest bid if applicable
      await (client.from('auctions') as any)
        .update({ current_lowest_bid: bid.amount })
        .eq('id', bid.auctionId)
        .or(`current_lowest_bid.is.null,current_lowest_bid.gt.${bid.amount}`);

      return data as AuctionBidRow;
    } catch (err) {
      throw handleSupabaseError(err, 'DomainMutations.placeBid');
    }
  }
}
