import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export function createClient() {
  const cookieStore = cookies();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://haarbaqeuuirwkhmefev.supabase.co';
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

  return createServerClient(url, publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}

/**
 * Privileged Admin Supabase Client using SUPABASE_SECRET_KEY.
 * ONLY available on the server and only when configured.
 */
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secretKey) return null;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://haarbaqeuuirwkhmefev.supabase.co';
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
  return createSupabaseClient(url, secretKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const createServerSupabaseClient = createClient;
export const getSupabaseAdminClient = createAdminClient;

/**
 * Returns the best available server-side Supabase client for database operations.
 * Prefers admin client with service role key if available, otherwise cookie-based server client,
 * or direct client.
 */
export function getDbClient() {
  const admin = createAdminClient();
  if (admin) return admin;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://haarbaqeuuirwkhmefev.supabase.co';
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
  const { createClient: createSupabaseClient } = require('@supabase/supabase-js');
  return createSupabaseClient(url, publishableKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

