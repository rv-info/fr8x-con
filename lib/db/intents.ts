/**
 * lib/db/intents.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Logistics Intents.
 * Caches and analyzes port queries, trade lanes, followed commodities, and carriers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { IntentRow } from '@/lib/supabase/types';

export async function getUserIntent(userId: string): Promise<IntentRow | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('intents')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[lib/db/intents] getUserIntent error:', error.message);
    throw new Error(`Failed to get intent for user: ${error.message}`);
  }
  return data;
}

export async function saveUserIntent(intent: any): Promise<IntentRow> {
  const supabase = getDbClient();
  const payload = {
    user_id: intent.userId || intent.user_id,
    recent_searched_ports: intent.recentSearchedPorts || intent.recent_searched_ports || [],
    viewed_rates: intent.viewedRates || intent.viewed_rates || [],
    active_auction_routes: intent.activeAuctionRoutes || intent.active_auction_routes || [],
    saved_trade_lanes: intent.savedTradeLanes || intent.saved_trade_lanes || [],
    followed_commodities: intent.followedCommodities || intent.followed_commodities || [],
    carrier_searches: intent.carrierSearches || intent.carrier_searches || [],
    last_active_at: new Date().toISOString(),
    expires_at: intent.expiresAt || intent.expires_at || new Date(Date.now() + 7 * 86400000).toISOString(),
  };

  const { data, error } = await supabase
    .from('intents')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/intents] saveUserIntent error:', error.message);
    throw new Error(`Failed to save user intent: ${error.message}`);
  }
  return data;
}

export async function getIntents(): Promise<Record<string, IntentRow>> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('intents')
    .select('*');

  if (error) {
    console.error('[lib/db/intents] getIntents error:', error.message);
    throw new Error(`Failed to get all intents: ${error.message}`);
  }

  const map: Record<string, IntentRow> = {};
  for (const item of data || []) {
    map[item.user_id] = item;
  }
  return map;
}
