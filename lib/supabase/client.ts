import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;
let initializedKey: string | null = null;

export function createClient() {
  const windowEnv = typeof window !== 'undefined' ? (window as any).__FR8X_ENV__ : null;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    windowEnv?.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    'https://haarbaqeuuirwkhmefev.supabase.co';

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    windowEnv?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    windowEnv?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_PUBLISHABLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';

  // If client already cached with a real key, return it
  if (client && initializedKey && initializedKey !== 'placeholder') {
    return client;
  }

  // If we now have a real key and previous was placeholder, recreate
  if (!publishableKey) {
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      console.warn('[Supabase Client] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.');
    }
    initializedKey = 'placeholder';
    client = createBrowserClient(url, 'placeholder');
    return client;
  }

  initializedKey = publishableKey;
  client = createBrowserClient(url, publishableKey);
  return client;
}

export const getSupabaseBrowserClient = createClient;

