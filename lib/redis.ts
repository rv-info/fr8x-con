/**
 * lib/redis.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FR8X Secondary Infrastructure Layer: Upstash Redis & In-Memory Fallback.
 *
 * Strictly secondary: used ONLY for:
 *   - fr8x:ratelimit:* (Rate limiting for auth, mutations, search)
 *   - fr8x:cache:* (Transient query caches, invalidated on authoritative writes)
 *   - fr8x:lock:* (Distributed transactional locks & concurrency prevention)
 *   - fr8x:counter:* (Metrics, attempts, telemetry counters)
 *
 * PostgreSQL remains the single authoritative persistent data source.
 * Redis is NEVER the authoritative source for profile or business data.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  totalLimit: number;
}

// In-memory fallback storage for environments without Redis configured
class InMemoryRedisFallback {
  private store = new Map<string, { value: any; expiresAt?: number }>();

  async get<T = any>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set(key: string, value: any, exSeconds?: number): Promise<void> {
    const expiresAt = exSeconds ? Date.now() + exSeconds * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async incr(key: string, exSeconds?: number): Promise<number> {
    const current = (await this.get<number>(key)) || 0;
    const next = current + 1;
    await this.set(key, next, exSeconds);
    return next;
  }
}

const memoryFallback = new InMemoryRedisFallback();

function getUpstashCredentials() {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  return { url, token };
}

async function upstashCommand(command: string[]): Promise<any> {
  const { url, token } = getUpstashCredentials();
  if (!url || !token) return null;

  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/${command.join('/')}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.result;
  } catch (err: any) {
    console.warn('[Redis] Upstash command error:', err.message);
    return null;
  }
}

export const redis = {
  // ─── CACHE ─────────────────────────────────────────────────────────────────
  async getCache<T = any>(resource: string, id: string): Promise<T | null> {
    const key = `fr8x:cache:${resource}:${id}`;
    const { url, token } = getUpstashCredentials();

    if (url && token) {
      const res = await upstashCommand(['GET', key]);
      if (res !== null && res !== undefined) {
        try {
          return typeof res === 'string' ? JSON.parse(res) : res;
        } catch {
          return res as T;
        }
      }
      return null;
    }

    return memoryFallback.get<T>(key);
  },

  async setCache(resource: string, id: string, value: any, ttlSeconds = 300): Promise<void> {
    const key = `fr8x:cache:${resource}:${id}`;
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    const { url, token } = getUpstashCredentials();

    if (url && token) {
      await upstashCommand(['SET', key, encodeURIComponent(serialized), 'EX', String(ttlSeconds)]);
      return;
    }

    await memoryFallback.set(key, value, ttlSeconds);
  },

  async invalidateCache(resource: string, id: string): Promise<void> {
    const key = `fr8x:cache:${resource}:${id}`;
    const { url, token } = getUpstashCredentials();

    if (url && token) {
      await upstashCommand(['DEL', key]);
      return;
    }

    await memoryFallback.del(key);
  },

  // ─── RATE LIMITING ─────────────────────────────────────────────────────────
  async checkRateLimit(opts: {
    action: string;
    identifier: string;
    limit: number;
    windowSeconds: number;
  }): Promise<RateLimitResult> {
    const { action, identifier, limit, windowSeconds } = opts;
    const key = `fr8x:ratelimit:${action}:${identifier}`;
    const { url, token } = getUpstashCredentials();

    let current = 0;
    if (url && token) {
      const count = await upstashCommand(['INCR', key]);
      if (count === 1) {
        await upstashCommand(['EXPIRE', key, String(windowSeconds)]);
      }
      current = count || 1;
    } else {
      current = await memoryFallback.incr(key, windowSeconds);
    }

    const remaining = Math.max(0, limit - current);
    return {
      allowed: current <= limit,
      remaining,
      resetSeconds: windowSeconds,
      totalLimit: limit,
    };
  },

  // ─── DISTRIBUTED LOCKS ─────────────────────────────────────────────────────
  async acquireLock(resource: string, id: string, ttlSeconds = 30): Promise<boolean> {
    const key = `fr8x:lock:${resource}:${id}`;
    const { url, token } = getUpstashCredentials();

    if (url && token) {
      const res = await upstashCommand(['SET', key, 'locked', 'NX', 'EX', String(ttlSeconds)]);
      return res === 'OK';
    }

    const existing = await memoryFallback.get(key);
    if (existing) return false;
    await memoryFallback.set(key, 'locked', ttlSeconds);
    return true;
  },

  async releaseLock(resource: string, id: string): Promise<void> {
    const key = `fr8x:lock:${resource}:${id}`;
    const { url, token } = getUpstashCredentials();

    if (url && token) {
      await upstashCommand(['DEL', key]);
      return;
    }

    await memoryFallback.del(key);
  },

  // ─── COUNTERS ──────────────────────────────────────────────────────────────
  async incrementCounter(metric: string, period = 'daily', ttlSeconds = 86400): Promise<number> {
    const key = `fr8x:counter:${metric}:${period}`;
    const { url, token } = getUpstashCredentials();

    if (url && token) {
      const count = await upstashCommand(['INCR', key]);
      if (count === 1) {
        await upstashCommand(['EXPIRE', key, String(ttlSeconds)]);
      }
      return count || 1;
    }

    return memoryFallback.incr(key, ttlSeconds);
  },
};
