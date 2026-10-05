/**
 * lib/db/rates.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Freight Rates.
 * Handles ocean & multimodal container rate cards, spot quotes, and tariffs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { RateRow, RateInsert } from '@/lib/supabase/types';

export interface RateItemDto {
  id: string;
  sp: string;
  line: string;
  por: string;
  pol: string;
  pod: string;
  fpod: string;
  rate20: number;
  rate40: number;
  rate40hc: number;
  currency?: string;
  type?: string;
  ft?: number;
  validity: string;
  transitTime?: string;
  transit_time?: string;
  ownerUid?: string;
  owner_uid?: string;
  createdBy?: string;
  created_by?: string;
  isOwner?: boolean;
  isSelfPosted?: boolean;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

function mapToDbRate(r: any): any {
  return {
    id: r.id || `rate_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    sp: r.sp || 'Spot Carrier',
    line: r.line || 'Direct Line',
    por: r.por || r.pol || 'Origin Port',
    pol: r.pol || 'Origin Port',
    pod: r.pod || 'Destination Port',
    fpod: r.fpod || r.pod || 'Destination Port',
    rate20: Number(r.rate20) || 0,
    rate40: Number(r.rate40) || 0,
    rate40hc: Number(r.rate40hc) || Number(r.rate40) || 0,
    currency: r.currency || 'USD',
    type: r.type || 'Direct Spot',
    ft: Number(r.ft) || 14,
    validity: r.validity || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    transit_time: r.transitTime || r.transit_time || '30',
    owner_uid: r.ownerUid || r.owner_uid || null,
    created_by: r.createdBy || r.created_by || null,
    is_owner: r.isOwner !== false,
    is_self_posted: r.isSelfPosted !== false,
    status: r.status || 'active',
    updated_at: new Date().toISOString(),
  };
}

export async function getRates(filter?: { pol?: string; pod?: string; sp?: string; ownerUid?: string }): Promise<RateRow[]> {
  const supabase = getDbClient();
  let query = supabase.from('rates').select('*').order('created_at', { ascending: false });

  if (filter?.pol) {
    query = query.ilike('pol', `%${filter.pol}%`);
  }
  if (filter?.pod) {
    query = query.ilike('pod', `%${filter.pod}%`);
  }
  if (filter?.sp) {
    query = query.ilike('sp', `%${filter.sp}%`);
  }
  if (filter?.ownerUid) {
    query = query.eq('owner_uid', filter.ownerUid);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[lib/db/rates] getRates error:', error.message);
    throw new Error(`Failed to get rates: ${error.message}`);
  }
  return data || [];
}

export async function getRateById(id: string): Promise<RateRow | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('rates')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[lib/db/rates] getRateById error:', error.message);
    throw new Error(`Failed to get rate by id: ${error.message}`);
  }
  return data;
}

export async function saveRate(rate: any): Promise<RateRow> {
  const supabase = getDbClient();
  const payload = mapToDbRate(rate);

  const { data, error } = await supabase
    .from('rates')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/rates] saveRate error:', error.message);
    throw new Error(`Failed to save rate: ${error.message}`);
  }
  return data;
}

export async function bulkSaveRates(rates: any[]): Promise<RateRow[]> {
  if (!rates || rates.length === 0) return [];
  const supabase = getDbClient();
  const payloads = rates.map(mapToDbRate);

  const { data, error } = await supabase
    .from('rates')
    .upsert(payloads, { onConflict: 'id' })
    .select();

  if (error) {
    console.error('[lib/db/rates] bulkSaveRates error:', error.message);
    throw new Error(`Failed to bulk save rates: ${error.message}`);
  }
  return data || [];
}

export async function deleteRate(id: string): Promise<boolean> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from('rates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[lib/db/rates] deleteRate error:', error.message);
    throw new Error(`Failed to delete rate: ${error.message}`);
  }
  return true;
}
