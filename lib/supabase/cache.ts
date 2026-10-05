/**
 * lib/supabase/cache.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Static Reference Data Cache for FR8X.
 * ONLY for static/semi-static reference data (e.g., ports, countries, pin codes).
 * NEVER used for mutable user profiles, session state, or dynamic rate cards.
 * ─────────────────────────────────────────────────────────────────────────────
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

class ReferenceDataCache {
  private cache = new Map<string, CacheEntry<any>>();

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlSeconds: number = 300): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const referenceCache = new ReferenceDataCache();
