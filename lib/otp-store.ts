/**
 * lib/otp-store.ts
 *
 * Distributed OTP store abstraction.
 * - In development / single-pod: uses in-memory Map
 * - In production with REDIS_URL set: uses Redis (via ioredis)
 *
 * To use Redis: set REDIS_URL in your environment, e.g.:
 *   REDIS_URL=redis://fr8x-redis-service:6379
 */

type OtpRecord = { salt: string; hash: string; expiresAt: string };

// ── In-memory fallback ────────────────────────────────────────────────────────
const memStore = new Map<string, OtpRecord>();

// ── Redis client (lazy-loaded) ────────────────────────────────────────────────
let redisClient: any = null;
const OTP_TTL_SECONDS = 10 * 60; // 10 minutes

async function getRedis() {
  if (redisClient) return redisClient;
  if (!process.env.REDIS_URL) return null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require('ioredis');
    redisClient = new Redis(process.env.REDIS_URL, { lazyConnect: false, connectTimeout: 3000 });
    return redisClient;
  } catch {
    console.warn('[OTP Store] Redis unavailable — falling back to in-memory store. Install ioredis for production.');
    redisClient = null;
    return null;
  }
}

export const otpStore = {
  async set(key: string, record: OtpRecord): Promise<void> {
    const redis = await getRedis();
    if (redis) {
      await redis.set(`fr8x:otp:${key}`, JSON.stringify(record), 'EX', OTP_TTL_SECONDS);
    } else {
      memStore.set(key, record);
    }
  },

  async get(key: string): Promise<OtpRecord | null> {
    const redis = await getRedis();
    if (redis) {
      const raw = await redis.get(`fr8x:otp:${key}`);
      return raw ? JSON.parse(raw) : null;
    }
    return memStore.get(key) ?? null;
  },

  async delete(key: string): Promise<void> {
    const redis = await getRedis();
    if (redis) {
      await redis.del(`fr8x:otp:${key}`);
    } else {
      memStore.delete(key);
    }
  },
};
