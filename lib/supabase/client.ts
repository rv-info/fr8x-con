import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('[Supabase Client] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
    }
    return createBrowserClient(
      url || 'https://haarbaqeuuirwkhmefev.supabase.co',
      publishableKey || 'placeholder'
    );
  }

  client = createBrowserClient(url, publishableKey);
  return client;
}

export const getSupabaseBrowserClient = createClient;

