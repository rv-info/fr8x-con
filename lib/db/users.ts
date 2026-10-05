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
  return data || [];
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
  if (!existing) {
    throw new Error(`User not found for identifier: ${identifier}`);
  }

  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', existing.id)
    .select()
    .single();

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

  const payload: ProfileInsert = {
    ...user,
    id,
    email: user.email.trim().toLowerCase(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'email' })
    .select()
    .single();

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
