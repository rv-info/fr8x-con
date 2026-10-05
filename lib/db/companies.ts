/**
 * lib/db/companies.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Enterprise Companies.
 * Manages freight forwarders, carriers, statutory verifications, and KYC.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { CompanyRow, CompanyInsert, CompanyUpdate } from '@/lib/supabase/types';

export async function getCompanies(): Promise<CompanyRow[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[lib/db/companies] getCompanies error:', error.message);
    throw new Error(`Failed to get companies: ${error.message}`);
  }
  return data || [];
}

export async function getCompanyById(id: string): Promise<CompanyRow | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[lib/db/companies] getCompanyById error:', error.message);
    throw new Error(`Failed to get company by id: ${error.message}`);
  }
  return data;
}

export async function searchCompanies(queryStr: string): Promise<CompanyRow[]> {
  const supabase = getDbClient();
  const q = queryStr.trim();
  if (!q) return getCompanies();

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .or(`name.ilike.%${q}%,legal_name.ilike.%${q}%,gstin.ilike.%${q}%,city.ilike.%${q}%`)
    .limit(50);

  if (error) {
    console.error('[lib/db/companies] searchCompanies error:', error.message);
    throw new Error(`Failed to search companies: ${error.message}`);
  }
  return data || [];
}

export async function saveCompany(company: Partial<CompanyRow> & { id: string; name?: string; legal_name?: string }): Promise<CompanyRow> {
  const supabase = getDbClient();
  const payload = {
    ...company,
    name: company.name || company.legal_name || 'Enterprise Company',
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('companies')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/companies] saveCompany error:', error.message);
    throw new Error(`Failed to save company: ${error.message}`);
  }
  return data;
}

export async function deleteCompany(id: string): Promise<boolean> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[lib/db/companies] deleteCompany error:', error.message);
    throw new Error(`Failed to delete company: ${error.message}`);
  }
  return true;
}
