/**
 * lib/db/cases.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Support Cases & Disputes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { CaseRow } from '@/lib/supabase/types';

export async function getCases(filter?: { userId?: string; companyId?: string; status?: string }): Promise<CaseRow[]> {
  const supabase = getDbClient();
  let query = supabase.from('cases').select('*').order('created_at', { ascending: false });

  if (filter?.userId) {
    query = query.eq('user_id', filter.userId);
  }
  if (filter?.companyId) {
    query = query.eq('company_id', filter.companyId);
  }
  if (filter?.status) {
    query = query.eq('status', filter.status);
  }

  const { data, error } = await query;
  if (error) {
    console.error('[lib/db/cases] getCases error:', error.message);
    throw new Error(`Failed to get cases: ${error.message}`);
  }
  return data || [];
}

export async function saveCase(bCase: any): Promise<CaseRow> {
  const supabase = getDbClient();
  const payload = {
    id: bCase.id || `case_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: bCase.title || 'General Freight Support Request',
    description: bCase.description || '',
    user_id: bCase.userId || bCase.user_id || null,
    company_id: bCase.companyId || bCase.company_id || null,
    category: bCase.category || 'General',
    priority: bCase.priority || 'medium',
    status: bCase.status || 'open',
    metadata: bCase.metadata || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('cases')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/cases] saveCase error:', error.message);
    throw new Error(`Failed to save case: ${error.message}`);
  }
  return data;
}

export async function deleteCase(id: string): Promise<boolean> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from('cases')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[lib/db/cases] deleteCase error:', error.message);
    throw new Error(`Failed to delete case: ${error.message}`);
  }
  return true;
}
