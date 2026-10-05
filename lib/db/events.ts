/**
 * lib/db/events.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Platform & Audit Events.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { EventRow } from '@/lib/supabase/types';

export async function getEvents(): Promise<EventRow[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(500);

  if (error) {
    console.error('[lib/db/events] getEvents error:', error.message);
    throw new Error(`Failed to get events: ${error.message}`);
  }
  return data || [];
}

export async function recordEvents(events: any[]): Promise<number> {
  if (!events || events.length === 0) return 0;
  const supabase = getDbClient();
  const payloads = events.map((e) => ({
    id: e.id || `evt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    event_type: e.eventType || e.event_type || e.type || 'system_event',
    user_id: e.userId || e.user_id || null,
    session_id: e.sessionId || e.session_id || null,
    payload: e.payload || e.data || {},
    timestamp: e.timestamp || new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('events')
    .upsert(payloads, { onConflict: 'id' });

  if (error) {
    console.error('[lib/db/events] recordEvents error:', error.message);
    throw new Error(`Failed to record events: ${error.message}`);
  }
  return payloads.length;
}
