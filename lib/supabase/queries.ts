/**
 * lib/supabase/queries.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Centralized Domain Query Layer for FR8X.
 * Strongly-typed read operations against Supabase PostgreSQL.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getSupabaseBrowserClient } from './client';
import { handleSupabaseError, NotFoundError } from './errors';
import { ProfileRow, CompanyRow, RateRow, AuctionRow, PostRow } from './types';

export class DomainQueries {
  /**
   * Fetches profile by Supabase user UUID.
   */
  static async getProfileById(userId: string): Promise<ProfileRow | null> {
    try {
      const client = getSupabaseBrowserClient();
      const { data, error } = await (client.from('profiles') as any)
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        throw handleSupabaseError(error, 'DomainQueries.getProfileById');
      }

      return data as ProfileRow | null;
    } catch (err) {
      throw handleSupabaseError(err, 'DomainQueries.getProfileById');
    }
  }

  /**
   * Fetches profile by email address (for canonical resolution).
   */
  static async getProfileByEmail(email: string): Promise<ProfileRow | null> {
    try {
      const client = getSupabaseBrowserClient();
      const { data, error } = await (client.from('profiles') as any)
        .select('*')
        .eq('email', email.trim().toLowerCase())
        .maybeSingle();

      if (error) {
        throw handleSupabaseError(error, 'DomainQueries.getProfileByEmail');
      }

      return data as ProfileRow | null;
    } catch (err) {
      throw handleSupabaseError(err, 'DomainQueries.getProfileByEmail');
    }
  }

  /**
   * Fetches all registered enterprise companies.
   */
  static async getCompanies(): Promise<CompanyRow[]> {
    try {
      const client = getSupabaseBrowserClient();
      const { data, error } = await (client.from('companies') as any)
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw handleSupabaseError(error, 'DomainQueries.getCompanies');
      }

      return (data || []) as CompanyRow[];
    } catch (err) {
      throw handleSupabaseError(err, 'DomainQueries.getCompanies');
    }
  }

  /**
   * Fetches rate cards.
   */
  static async getRates(limit = 100): Promise<RateRow[]> {
    try {
      const client = getSupabaseBrowserClient();
      const { data, error } = await (client.from('rates') as any)
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw handleSupabaseError(error, 'DomainQueries.getRates');
      }

      return (data || []) as RateRow[];
    } catch (err) {
      throw handleSupabaseError(err, 'DomainQueries.getRates');
    }
  }

  /**
   * Fetches active spot auctions.
   */
  static async getAuctions(status = 'active', limit = 50): Promise<AuctionRow[]> {
    try {
      const client = getSupabaseBrowserClient();
      const { data, error } = await (client.from('auctions') as any)
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw handleSupabaseError(error, 'DomainQueries.getAuctions');
      }

      return (data || []) as AuctionRow[];
    } catch (err) {
      throw handleSupabaseError(err, 'DomainQueries.getAuctions');
    }
  }

  /**
   * Fetches published feed posts.
   */
  static async getFeedPosts(limit = 50): Promise<PostRow[]> {
    try {
      const client = getSupabaseBrowserClient();
      const { data, error } = await (client.from('posts') as any)
        .select('*')
        .eq('is_published', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw handleSupabaseError(error, 'DomainQueries.getFeedPosts');
      }

      return (data || []) as PostRow[];
    } catch (err) {
      throw handleSupabaseError(err, 'DomainQueries.getFeedPosts');
    }
  }
}
