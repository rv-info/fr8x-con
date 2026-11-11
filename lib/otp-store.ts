/**
 * lib/otp-store.ts
 *
 * Distributed OTP store abstraction.
 *
 * Adapter priority (first available wins):
 *   1. REST KV   — set KV_REST_API_URL + KV_REST_API_TOKEN (e.g. Upstash Redis REST)
 *   2. ioredis   — set REDIS_URL (e.g. redis://host:6379 or Upstash URL)
 *   3. In-Memory — dev/local only.
 *
 * PRODUCTION REQUIREMENT: Set at least one of the above to ensure the
 * 3-OTP-per-24h rate limit and 60-second cooldown are shared across all
 * edge worker invocations.
 */

type OtpRecord = { salt: string; hash: string; expiresAt: string };

// ── OTP TTL: 15 seconds validity + a small buffer for network jitter ─────────
// The buffer allows ZeptoMail to deliver and the user to type before the store
// entry is evicted. The hard expiry is checked inside server-auth-store.ts.
const OTP_TTL_SECONDS = 30; // 15s validity + 15s delivery buffer

// ── In-memory fallback (dev only) ────────────────────────────────────────────
const memStore = new Map<string, OtpRecord>();
const memTimestamps = new Map<string, number[]>();
const memCooldowns = new Map<string, number>();

// ── REST KV client (lazy, optional) ──────────────────────────────────────────
let kvClient: any = null;
let kvInitAttempted = false;

function safeDynamicRequire(modName: string): any {
  try {
    const dynamicRequire = new Function('m', 'try { return require(m); } catch (e) { return null; }');
    return dynamicRequire(modName);
  } catch {
    return null;
  }
}

async function executeKvRestCommand(...args: (string | number)[]): Promise<any> {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  });
  if (!res.ok) {
    throw new Error(`KV REST command [${args[0]}] failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return data?.result ?? null;
}

const restKvClient = {
  async setex(key: string, seconds: number, value: string): Promise<void> {
    await executeKvRestCommand('SET', key, value, 'EX', seconds);
  },
  async get(key: string): Promise<any> {
    return await executeKvRestCommand('GET', key);
  },
  async del(key: string): Promise<void> {
    await executeKvRestCommand('DEL', key);
  },
  async incr(key: string): Promise<number> {
    const res = await executeKvRestCommand('INCR', key);
    return Number(res || 0);
  },
  async expire(key: string, seconds: number): Promise<void> {
    await executeKvRestCommand('EXPIRE', key, seconds);
  },
  async ttl(key: string): Promise<number> {
    const res = await executeKvRestCommand('TTL', key);
    return typeof res === 'number' ? res : Number(res || -1);
  },
};

async function getRestKV(): Promise<any> {
  if (kvClient) return kvClient;
  if (kvInitAttempted) return null;
  kvInitAttempted = true;

  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  // Zero-dependency HTTP REST adapter for Upstash / Redis REST
  console.log('[OTP Store] Using zero-dependency REST KV API adapter.');
  kvClient = restKvClient;
  return kvClient;
}

// ── ioredis client (lazy, optional) ──────────────────────────────────────────
let redisClient: any = null;
let redisInitAttempted = false;

async function getRedis(): Promise<any> {
  if (redisClient) return redisClient;
  if (redisInitAttempted) return null;
  redisInitAttempted = true;

  if (!process.env.REDIS_URL) return null;

  try {
    const Redis = safeDynamicRequire('ioredis');
    if (!Redis) return null;
    redisClient = new Redis(process.env.REDIS_URL, {
      lazyConnect: false,
      connectTimeout: 3000,
      maxRetriesPerRequest: 2,
    });
    console.log('[OTP Store] Using ioredis adapter.');
    return redisClient;
  } catch {
    console.warn('[OTP Store] ioredis unavailable — falling back to in-memory. Install ioredis for production use.');
    return null;
  }
}

const KEY_PREFIX = 'fr8x:otp:';

export const otpStore = {
  async set(key: string, record: OtpRecord): Promise<void> {
    const fullKey = `${KEY_PREFIX}${key}`;
    const serialized = JSON.stringify(record);

    // Try REST KV first
    const kv = await getRestKV();
    if (kv) {
      try {
        await kv.setex(fullKey, OTP_TTL_SECONDS, serialized);
        return;
      } catch (err: any) {
        console.error('[OTP Store] REST KV set failed:', err.message);
      }
    }

    // Try ioredis
    const redis = await getRedis();
    if (redis) {
      try {
        await redis.set(fullKey, serialized, 'EX', OTP_TTL_SECONDS);
        return;
      } catch (err: any) {
        console.error('[OTP Store] ioredis set failed:', err.message);
      }
    }

    // In-memory fallback
    if (process.env.NODE_ENV === 'production') {
      console.warn(
        '[OTP Store] WARNING: Using in-memory fallback in production. ' +
        'OTP rate limits will NOT be shared across serverless invocations. ' +
        'Set KV_REST_API_URL/KV_REST_API_TOKEN or REDIS_URL immediately.'
      );
    }
    memStore.set(fullKey, record);
  },

  async get(key: string): Promise<OtpRecord | null> {
    const fullKey = `${KEY_PREFIX}${key}`;

    // Try REST KV first
    const kv = await getRestKV();
    if (kv) {
      try {
        const raw = await kv.get(fullKey);
        return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
      } catch (err: any) {
        console.error('[OTP Store] REST KV get failed:', err.message);
      }
    }

    // Try ioredis
    const redis = await getRedis();
    if (redis) {
      try {
        const raw = await redis.get(fullKey);
        return raw ? JSON.parse(raw) : null;
      } catch (err: any) {
        console.error('[OTP Store] ioredis get failed:', err.message);
      }
    }

    // In-memory fallback
    return memStore.get(fullKey) ?? null;
  },

  async delete(key: string): Promise<void> {
    const fullKey = `${KEY_PREFIX}${key}`;

    // Try REST KV first
    const kv = await getRestKV();
    if (kv) {
      try {
        await kv.del(fullKey);
        return;
      } catch (err: any) {
        console.error('[OTP Store] REST KV delete failed:', err.message);
      }
    }

    // Try ioredis
    const redis = await getRedis();
    if (redis) {
      try {
        await redis.del(fullKey);
        return;
      } catch (err: any) {
        console.error('[OTP Store] ioredis delete failed:', err.message);
      }
    }

    // In-memory fallback
    memStore.delete(fullKey);
  },

  /**
   * Distributed OTP send-limit tracking (default: max 3 sends per 25-hour window).
   * Ensures limit is enforced across distributed serverless instances.
   */
  async recordOtpSend(
    identifier: string,
    maxSends = 3,
    windowSeconds = 25 * 60 * 60
  ): Promise<{ allowed: boolean; remaining: number; count: number }> {
    const key = `rate:send:${identifier.trim().toLowerCase()}`;
    const fullKey = `${KEY_PREFIX}${key}`;

    // 1. REST KV
    const kv = await getRestKV();
    if (kv) {
      try {
        const count = await kv.incr(fullKey);
        if (count === 1) {
          await kv.expire(fullKey, windowSeconds);
        }
        const allowed = count <= maxSends;
        const remaining = Math.max(0, maxSends - count);
        return { allowed, remaining, count };
      } catch (err: any) {
        console.error('[OTP Store] REST KV recordOtpSend failed:', err.message);
      }
    }

    // 2. ioredis
    const redis = await getRedis();
    if (redis) {
      try {
        const count = await redis.incr(fullKey);
        if (count === 1) {
          await redis.expire(fullKey, windowSeconds);
        }
        const allowed = count <= maxSends;
        const remaining = Math.max(0, maxSends - count);
        return { allowed, remaining, count };
      } catch (err: any) {
        console.error('[OTP Store] ioredis recordOtpSend failed:', err.message);
      }
    }

    // 3. In-memory fallback (local dev)
    const now = Date.now();
    const existing = memTimestamps.get(fullKey) || [];
    const windowMs = windowSeconds * 1000;
    const valid = existing.filter((t) => t > now - windowMs);
    if (valid.length >= maxSends) {
      return { allowed: false, remaining: 0, count: valid.length };
    }
    valid.push(now);
    memTimestamps.set(fullKey, valid);
    return {
      allowed: true,
      remaining: Math.max(0, maxSends - valid.length),
      count: valid.length,
    };
  },

  /**
   * Distributed cooldown check (default: 60 seconds).
   */
  async checkCooldown(
    identifier: string,
    cooldownSeconds = 60
  ): Promise<{ inCooldown: boolean; waitSeconds: number }> {
    const key = `cooldown:${identifier.trim().toLowerCase()}`;
    const fullKey = `${KEY_PREFIX}${key}`;

    // 1. REST KV
    const kv = await getRestKV();
    if (kv) {
      try {
        const ttl = await kv.ttl(fullKey);
        if (typeof ttl === 'number' && ttl > 0) {
          return { inCooldown: true, waitSeconds: ttl };
        }
        return { inCooldown: false, waitSeconds: 0 };
      } catch (err: any) {
        console.error('[OTP Store] REST KV checkCooldown failed:', err.message);
      }
    }

    // 2. ioredis
    const redis = await getRedis();
    if (redis) {
      try {
        const ttl = await redis.ttl(fullKey);
        if (typeof ttl === 'number' && ttl > 0) {
          return { inCooldown: true, waitSeconds: ttl };
        }
        return { inCooldown: false, waitSeconds: 0 };
      } catch (err: any) {
        console.error('[OTP Store] ioredis checkCooldown failed:', err.message);
      }
    }

    // 3. In-memory fallback (local dev)
    const now = Date.now();
    const lastTime = memCooldowns.get(fullKey) || 0;
    const elapsed = now - lastTime;
    const cooldownMs = cooldownSeconds * 1000;
    if (elapsed < cooldownMs) {
      const waitSeconds = Math.ceil((cooldownMs - elapsed) / 1000);
      return { inCooldown: true, waitSeconds };
    }
    return { inCooldown: false, waitSeconds: 0 };
  },

  /**
   * Records the start of a cooldown.
   */
  async recordCooldown(
    identifier: string,
    cooldownSeconds = 60
  ): Promise<void> {
    const key = `cooldown:${identifier.trim().toLowerCase()}`;
    const fullKey = `${KEY_PREFIX}${key}`;

    const kv = await getRestKV();
    if (kv) {
      try {
        await kv.setex(fullKey, cooldownSeconds, '1');
        return;
      } catch (err: any) {
        console.error('[OTP Store] REST KV recordCooldown failed:', err.message);
      }
    }

    const redis = await getRedis();
    if (redis) {
      try {
        await redis.set(fullKey, '1', 'EX', cooldownSeconds);
        return;
      } catch (err: any) {
        console.error('[OTP Store] ioredis recordCooldown failed:', err.message);
      }
    }

    memCooldowns.set(fullKey, Date.now());
  },
};
