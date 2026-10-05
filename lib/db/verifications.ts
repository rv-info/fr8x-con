/**
 * lib/db/verifications.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Authentication Challenges.
 * Manages cryptographically hashed email tokens, OTP expiration, and audit logs.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { VerificationRow } from '@/lib/supabase/types';

export async function getVerificationByHash(tokenHash: string): Promise<VerificationRow | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('verifications')
    .select('*')
    .eq('token_hash', tokenHash)
    .maybeSingle();

  if (error) {
    console.error('[lib/db/verifications] getVerificationByHash error:', error.message);
    throw new Error(`Failed to get verification by hash: ${error.message}`);
  }
  return data;
}

export async function saveVerification(record: {
  tokenHash: string;
  userId: string;
  email: string;
  expiresAt: string | number;
}): Promise<VerificationRow> {
  const supabase = getDbClient();
  const expiresAtIso = typeof record.expiresAt === 'number'
    ? new Date(record.expiresAt).toISOString()
    : record.expiresAt;

  const payload = {
    token_hash: record.tokenHash,
    user_id: record.userId,
    email: record.email.trim().toLowerCase(),
    expires_at: expiresAtIso,
    used: false,
    created_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('verifications')
    .upsert(payload, { onConflict: 'token_hash' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/verifications] saveVerification error:', error.message);
    throw new Error(`Failed to save verification: ${error.message}`);
  }
  return data;
}

export async function markVerificationUsed(tokenHash: string): Promise<boolean> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from('verifications')
    .update({ used: true })
    .eq('token_hash', tokenHash);

  if (error) {
    console.error('[lib/db/verifications] markVerificationUsed error:', error.message);
    throw new Error(`Failed to mark verification as used: ${error.message}`);
  }
  return true;
}
