/**
 * lib/otp-store.ts
 *
 * Distributed OTP store abstraction.
 *
 * Adapter priority (first available wins):
 *   1. Vercel KV  — set KV_REST_API_URL + KV_REST_API_TOKEN (recommended for Vercel)
 *   2. ioredis    — set REDIS_URL (e.g. redis://host:6379 or Upstash URL)
 *   3. In-Memory  — dev/local only. NOT suitable for Vercel (state lost on each invocation).
 *
 * PRODUCTION REQUIREMENT: Set at least one of the above to ensure the
 * 3-OTP-per-24h rate limit and 60-second cooldown are shared across all
 * Vercel serverless function invocations.
 */

type OtpRecord = { salt: string; hash: string; expiresAt: string };

// ── OTP TTL: 15 seconds validity + a small buffer for network jitter ─────────
// The buffer allows ZeptoMail to deliver and the user to type before the store
// entry is evicted. The hard expiry is checked inside server-auth-store.ts.
const OTP_TTL_SECONDS = 30; // 15s validity + 15s delivery buffer

// ── In-memory fallback (dev only) ────────────────────────────────────────────
const memStore = new Map<string, OtpRecord>();

// ── Vercel KV client (lazy, optional) ────────────────────────────────────────
let kvClient: any = null;
let kvInitAttempted = false;

async function getVercelKV(): Promise<any> {
  if (kvClient) return kvClient;
  if (kvInitAttempted) return null;
  kvInitAttempted = true;

  // Vercel KV requires both KV_REST_API_URL and KV_REST_API_TOKEN
  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) return null;

  try {
    // Dynamic import avoids compile-time errors when @vercel/kv is not installed
    const modName = '@vercel/kv';
    const kvModule = typeof require !== 'undefined' ? require(modName) : null;
    if (!kvModule?.kv) return null;
    kvClient = kvModule.kv;
    console.log('[OTP Store] Using Vercel KV adapter.');
    return kvClient;
  } catch {
    console.warn('[OTP Store] @vercel/kv not available — will try ioredis.');
    return null;
  }
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
    const modName = 'ioredis';
    const Redis = typeof require !== 'undefined' ? require(modName) : null;
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

    // Try Vercel KV first
    const kv = await getVercelKV();
    if (kv) {
      try {
        await kv.setex(fullKey, OTP_TTL_SECONDS, serialized);
        return;
      } catch (err: any) {
        console.error('[OTP Store] Vercel KV set failed:', err.message);
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

    // Try Vercel KV first
    const kv = await getVercelKV();
    if (kv) {
      try {
        const raw = await kv.get(fullKey);
        return raw ? (typeof raw === 'string' ? JSON.parse(raw) : raw) : null;
      } catch (err: any) {
        console.error('[OTP Store] Vercel KV get failed:', err.message);
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

    // Try Vercel KV first
    const kv = await getVercelKV();
    if (kv) {
      try {
        await kv.del(fullKey);
        return;
      } catch (err: any) {
        console.error('[OTP Store] Vercel KV delete failed:', err.message);
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
};
