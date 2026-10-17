/**
 * lib/db/users.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Users & Profiles.
 * Single source of truth for user accounts, profiles, permissions, and KYC.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { ProfileRow, ProfileInsert, ProfileUpdate } from '@/lib/supabase/types';

export interface DbUserRecord extends ProfileRow {
  uid: string;
}

export async function getUserById(id: string): Promise<ProfileRow | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[lib/db/users] getUserById error:', error.message);
    throw new Error(`Failed to get user by id: ${error.message}`);
  }
  return data;
}

export async function getUserByEmail(email: string): Promise<ProfileRow | null> {
  const supabase = getDbClient();
  const cleanEmail = email.trim().toLowerCase();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .ilike('email', cleanEmail)
    .maybeSingle();

  if (error) {
    console.error('[lib/db/users] getUserByEmail error:', error.message);
    throw new Error(`Failed to get user by email: ${error.message}`);
  }
  return data;
}

export async function getUserByIdentifier(identifier: string): Promise<ProfileRow | null> {
  if (!identifier) return null;
  const cleanId = identifier.trim();
  const supabase = getDbClient();

  // 1. Try matching by email
  if (cleanId.includes('@')) {
    return getUserByEmail(cleanId);
  }

  // 2. Try matching by uid column
  const { data: byUid, error: uidError } = await supabase
    .from('profiles')
    .select('*')
    .eq('uid', cleanId)
    .maybeSingle();

  if (!uidError && byUid) {
    return byUid;
  }

  // 3. Try matching by id (UUID)
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
  if (isUuid) {
    return getUserById(cleanId);
  }

  // 4. Try matching by slug
  const { data: bySlug, error: slugError } = await supabase
    .from('profiles')
    .select('*')
    .eq('slug', cleanId.toLowerCase())
    .maybeSingle();

  if (!slugError && bySlug) {
    return bySlug;
  }

  return null;
}

export async function getAllUsers(): Promise<ProfileRow[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[lib/db/users] getAllUsers error:', error.message);
    throw new Error(`Failed to get all users: ${error.message}`);
  }

  // Filter out any synthetic Mumbai duplicates and deduplicate by (name + company)
  const seenIdentities = new Set<string>();
  const cleanList: ProfileRow[] = [];

  for (const u of data || []) {
    const name = (u.display_name || `${u.first_name || ''} ${u.last_name || ''}`).toLowerCase().trim();
    const comp = (u.company_name || '').toLowerCase().trim();
    const city = (u.city || '').toLowerCase().trim();
    const loc = (u.location || '').toLowerCase().trim();

    // Block synthetic Mumbai fallback duplicate for Kumar R
    if (name.includes('kumar r') && comp.includes('syb') && (city === 'mumbai' || loc.includes('mumbai'))) {
      continue;
    }

    const key = name && comp ? `${name}:::${comp}` : (u.email || u.id);
    if (seenIdentities.has(key)) continue;
    seenIdentities.add(key);
    cleanList.push(u);
  }

  return cleanList;
}

export async function createUser(user: ProfileInsert): Promise<ProfileRow> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('profiles')
    .insert({
      ...user,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/users] createUser error:', error.message);
    throw new Error(`Failed to create user: ${error.message}`);
  }
  return data;
}

export async function updateUser(identifier: string, updates: ProfileUpdate): Promise<ProfileRow> {
  const existing = await getUserByIdentifier(identifier);
  const supabase = getDbClient();

  if (!existing) {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
    if (isUuid) {
      // Upsert directly for authenticated user
      const payload: ProfileInsert = {
        ...updates,
        id: identifier,
        email: updates.email || `${identifier}@fr8x.in`,
        updated_at: new Date().toISOString(),
      };
      const { data, error } = await supabase
        .from('profiles')
        .upsert(payload, { onConflict: 'id' })
        .select()
        .single();
      if (error) {
        throw new Error(`Failed to upsert user profile: ${error.message}`);
      }
      return data;
    }
    throw new Error(`User not found for identifier: ${identifier}`);
  }

  const { generateProfileSlug } = await import('@/lib/seo/profile-seo');
  const slug = updates.slug || generateProfileSlug(updates.display_name || existing.display_name, existing.id);

  let { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      slug,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select()
    .single();

  if (error && error.message?.includes("'slug' column")) {
    const { slug: _s, ...updatesWithoutSlug } = updates;
    const retry = await supabase
      .from('profiles')
      .update({
        ...updatesWithoutSlug,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('[lib/db/users] updateUser error:', error.message);
    throw new Error(`Failed to update user: ${error.message}`);
  }
  return data;
}


export async function upsertUser(user: Partial<ProfileRow> & { email: string }): Promise<ProfileRow> {
  const supabase = getDbClient();
  const existing = await getUserByEmail(user.email);
  const id = existing?.id || user.id || crypto.randomUUID();

  const { generateProfileSlug } = await import('@/lib/seo/profile-seo');
  const slug = user.slug || generateProfileSlug(user.display_name || user.email, id);

  const payload: ProfileInsert = {
    ...user,
    id,
    slug,
    email: user.email.trim().toLowerCase(),
    updated_at: new Date().toISOString(),
  };

  let { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'email' })
    .select()
    .single();

  if (error && error.message?.includes("'slug' column")) {
    const { slug: _s, ...payloadWithoutSlug } = payload;
    const retry = await supabase
      .from('profiles')
      .upsert(payloadWithoutSlug, { onConflict: 'email' })
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error) {
    console.error('[lib/db/users] upsertUser error:', error.message);
    throw new Error(`Failed to upsert user: ${error.message}`);
  }
  return data;
}

export async function deleteUser(identifier: string): Promise<boolean> {
  const existing = await getUserByIdentifier(identifier);
  if (!existing) return false;

  const supabase = getDbClient();
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', existing.id);

  if (error) {
    console.error('[lib/db/users] deleteUser error:', error.message);
    throw new Error(`Failed to delete user: ${error.message}`);
  }
  return true;
}
