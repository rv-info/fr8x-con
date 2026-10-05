/**
 * lib/db/presence.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Real-time Presence.
 * Tracks user active device, online/offline status, and heartbeat timestamps.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { PresenceRow } from '@/lib/supabase/types';

export async function getUserPresence(userId: string): Promise<PresenceRow | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('presence')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    console.error('[lib/db/presence] getUserPresence error:', error.message);
    throw new Error(`Failed to get presence for user: ${error.message}`);
  }
  return data;
}

export async function saveUserPresence(state: any): Promise<PresenceRow> {
  const supabase = getDbClient();
  const payload = {
    user_id: state.userId || state.user_id,
    online: Boolean(state.online),
    last_seen: state.lastSeen || state.last_seen || new Date().toISOString(),
    active_device: state.activeDevice || state.active_device || {},
    status: state.status || (state.online ? 'online' : 'offline'),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('presence')
    .upsert(payload, { onConflict: 'user_id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/presence] saveUserPresence error:', error.message);
    throw new Error(`Failed to save presence: ${error.message}`);
  }
  return data;
}

export async function getAllPresence(): Promise<Record<string, PresenceRow>> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('presence')
    .select('*');

  if (error) {
    console.error('[lib/db/presence] getAllPresence error:', error.message);
    throw new Error(`Failed to get all presence: ${error.message}`);
  }

  const map: Record<string, PresenceRow> = {};
  for (const item of data || []) {
    map[item.user_id] = item;
  }
  return map;
}
