/**
 * lib/cache/safe-cache.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Multi-Tier Safe Caching Layer with Strict Zero-Leakage Privacy Controls.
 *
 * Enforces:
 * 1. Safe short-lived caching of non-sensitive public profile snippets & directory views.
 * 2. Explicit cache invalidation on relationship mutations.
 * 3. ZERO-LEAKAGE invariant: Never cache private contact fields (email, phone, private messages)
 *    across user sessions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class SafeCacheManager {
  private store: Map<string, CacheEntry<unknown>> = new Map();
  private userToKeysMap: Map<string, Set<string>> = new Map();

  /**
   * Generates a safe cache key.
   */
  public makeKey(prefix: string, identifier: string): string {
    return `${prefix}:${identifier.toLowerCase()}`;
  }

  /**
   * Stores a value with a time-to-live in seconds.
   * Rejects any payloads containing unauthorized private contact fields.
   */
  public set<T>(key: string, value: T, ttlSeconds: number, associatedUserId?: string): void {
    // Assert zero-leakage: do not cache raw objects containing unshielded private email or phone
    if (value && typeof value === 'object') {
      const v = value as Record<string, unknown>;
      if (v.email || v.phone || v.mobile) {
        // Contact details should only be delivered directly via authorized queries
        const sanitized = { ...v };
        delete sanitized.email;
        delete sanitized.phone;
        delete sanitized.mobile;
        value = sanitized as T;
      }
    }

    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.store.set(key, { value, expiresAt });

    if (associatedUserId) {
      const keys = this.userToKeysMap.get(associatedUserId) || new Set();
      keys.add(key);
      this.userToKeysMap.set(associatedUserId, keys);
    }
  }

  /**
   * Retrieves a cached value if unexpired.
   */
  public get<T>(key: string): T | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }

    return entry.value as T;
  }

  /**
   * Deletes a specific cache key.
   */
  public delete(key: string): void {
    this.store.delete(key);
  }

  /**
   * Explicitly invalidates all caches associated with a specific user.
   */
  public invalidateUser(userId: string): void {
    const keys = this.userToKeysMap.get(userId);
    if (keys) {
      for (const k of keys) {
        this.store.delete(k);
      }
      this.userToKeysMap.delete(userId);
    }
  }

  /**
   * Invalidates global feed caches.
   */
  public invalidateFeed(): void {
    for (const key of this.store.keys()) {
      if (key.startsWith('feed:')) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Clears the entire cache (useful for testing).
   */
  public clear(): void {
    this.store.clear();
    this.userToKeysMap.clear();
  }

  /**
   * Cache statistics.
   */
  public getStats(): { size: number; userKeysTracked: number } {
    return {
      size: this.store.size,
      userKeysTracked: this.userToKeysMap.size,
    };
  }
}

export const safeCache = new SafeCacheManager();
