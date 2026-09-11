import crypto from 'crypto';

// ─── AES-256-GCM Application-Layer Encryption ────────────────────────────────
// Key must be exactly 32 bytes (64 hex chars).
// In production, set GODFATHER_KMS_ENCRYPTION_KEY via secrets manager (never commit).
const DEFAULT_KEY_HEX = 'e1a3b5c7d9f2e4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4';
const ENCRYPTION_KEY = Buffer.from(
  process.env.GODFATHER_KMS_ENCRYPTION_KEY || DEFAULT_KEY_HEX,
  'hex'
);

/**
 * AES-256-GCM authenticated encryption.
 * Returns  "iv:authTag:ciphertext"  (all hex-encoded).
 */
export function encryptField(plainText: string): string {
  if (!plainText) return plainText;
  try {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('[CRYPTO] Field encryption error:', err);
    return plainText;
  }
}

/**
 * Decrypts a value produced by encryptField.
 */
export function decryptField(cipherData: string): string {
  if (!cipherData || !cipherData.includes(':')) return cipherData;
  try {
    const parts = cipherData.split(':');
    if (parts.length !== 3) return cipherData;
    const [ivHex, authTagHex, encryptedHex] = parts;
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (err) {
    console.error('[CRYPTO] Field decryption error:', err);
    return cipherData;
  }
}

// ─── OTP Hashing — PBKDF2 with 100 000 iterations + random salt ──────────────
// PBKDF2-HMAC-SHA512 is the NIST-recommended approach for one-time codes;
// brute-forcing a 6-digit OTP through PBKDF2@100k rounds costs ≈100× more
// than a plain SHA-256 hash.

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN     = 64; // bytes → 128 hex chars
const PBKDF2_DIGEST     = 'sha512';

export function hashOtp(otp: string): { salt: string; hash: string; expiresAt: string } {
  const salt     = crypto.randomBytes(32).toString('hex'); // 256-bit salt
  const derived  = crypto.pbkdf2Sync(
    otp.trim(),
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  );
  const hash      = derived.toString('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10-min window
  return { salt, hash, expiresAt };
}

/**
 * Constant-time PBKDF2 verification of a candidate OTP.
 * Returns false immediately if the token is expired.
 */
export function verifyOtpHash(
  candidateOtp: string,
  salt: string,
  expectedHash: string,
  expiresAt: string
): boolean {
  if (new Date() > new Date(expiresAt)) return false; // expired
  const derived = crypto.pbkdf2Sync(
    candidateOtp.trim(),
    salt,
    PBKDF2_ITERATIONS,
    PBKDF2_KEYLEN,
    PBKDF2_DIGEST
  );
  // constant-time comparison — prevents timing-oracle attacks
  return crypto.timingSafeEqual(derived, Buffer.from(expectedHash, 'hex'));
}

// ─── Password hashing — Argon2-style PBKDF2 alternative ──────────────────────
// Use this when storing operator passphrases server-side.
const PASS_PBKDF2_ITER  = 200_000;
const PASS_PBKDF2_KLEN  = 64;
const PASS_PBKDF2_DIG   = 'sha512';

export function hashPassword(plaintext: string): { salt: string; hash: string } {
  const salt   = crypto.randomBytes(32).toString('hex');
  const derived = crypto.pbkdf2Sync(plaintext, salt, PASS_PBKDF2_ITER, PASS_PBKDF2_KLEN, PASS_PBKDF2_DIG);
  return { salt, hash: derived.toString('hex') };
}

export function verifyPassword(plaintext: string, salt: string, expectedHash: string): boolean {
  const derived = crypto.pbkdf2Sync(plaintext, salt, PASS_PBKDF2_ITER, PASS_PBKDF2_KLEN, PASS_PBKDF2_DIG);
  return crypto.timingSafeEqual(derived, Buffer.from(expectedHash, 'hex'));
}

// ─── Rate Limiting & Brute-Force Lockout ─────────────────────────────────────

interface RateLimitEntry {
  attempts: number;
  lockedUntil?: number;
  lastAttempt: number;
}

const loginAttemptStore = new Map<string, RateLimitEntry>();
const MAX_FAILED_ATTEMPTS  = 5;
const LOCKOUT_DURATION_MS  = 30 * 60 * 1000; // 30 minutes

export function checkRateLimit(identifier: string): {
  allowed: boolean;
  remainingAttempts: number;
  retryAfterSeconds?: number;
} {
  const now   = Date.now();
  const entry = loginAttemptStore.get(identifier);

  if (!entry) return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };

  if (entry.lockedUntil && entry.lockedUntil > now) {
    return {
      allowed: false,
      remainingAttempts: 0,
      retryAfterSeconds: Math.ceil((entry.lockedUntil - now) / 1000),
    };
  }

  if (entry.lockedUntil && entry.lockedUntil <= now) {
    loginAttemptStore.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - entry.attempts);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

export function recordFailedAttempt(identifier: string): {
  locked: boolean;
  remainingAttempts: number;
} {
  const now   = Date.now();
  const entry = loginAttemptStore.get(identifier) || { attempts: 0, lastAttempt: now };
  entry.attempts   += 1;
  entry.lastAttempt = now;

  if (entry.attempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;
    loginAttemptStore.set(identifier, entry);
    return { locked: true, remainingAttempts: 0 };
  }

  loginAttemptStore.set(identifier, entry);
  return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS - entry.attempts };
}

export function clearRateLimit(identifier: string): void {
  loginAttemptStore.delete(identifier);
}

// ─── CSPRNG Helpers ─────────────────────────────────────────────────────────

/**
 * Generates a cryptographically secure numeric OTP of specified length.
 * Backed by Node.js crypto.randomInt (CSPRNG).
 */
export function generateSecureOtp(
  length = 6,
  exclude?:
    | string
    | string[]
    | { salt: string; hash: string; iterations?: number; keylen?: number; digest?: string }
): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;

  if (exclude && typeof exclude === 'object' && !Array.isArray(exclude)) {
    const { salt, hash, iterations = PBKDF2_ITERATIONS, keylen = PBKDF2_KEYLEN, digest = PBKDF2_DIGEST } = exclude;
    let code: string;
    let attempts = 0;
    do {
      code = crypto.randomInt(min, max + 1).toString();
      attempts++;
      try {
        const derived = crypto.pbkdf2Sync(code, salt, iterations, keylen, digest);
        const matches = crypto.timingSafeEqual(derived, Buffer.from(hash, 'hex'));
        if (!matches) return code;
      } catch {
        return code;
      }
    } while (attempts < 100);
    return code;
  }

  const excludeSet = new Set(Array.isArray(exclude) ? exclude : exclude ? [exclude] : []);
  let code: string;
  let attempts = 0;
  do {
    code = crypto.randomInt(min, max + 1).toString();
    attempts++;
  } while (excludeSet.has(code) && attempts < 100);
  return code;
}

/**
 * Generates a cryptographically secure random token in hex format.
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

// ─── HMAC-SHA256 Cryptographic Session Signing ─────────────────────────────

function getSessionSecret(): string {
  return (
    process.env.GODFATHER_SESSION_SECRET?.trim() ||
    process.env.GODFATHER_KMS_ENCRYPTION_KEY?.trim() ||
    'fr8x-platform-internal-session-signing-key-2026-production'
  );
}

/**
 * Creates a cryptographically signed session token: payloadBase64.signatureHex
 */
export function createSignedSessionToken(
  payload: Record<string, any> | object | string,
  secret?: string
): string {
  const key = secret || getSessionSecret();
  const rawPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const payloadB64 = Buffer.from(rawPayload, 'utf8').toString('base64url');
  const signature = crypto.createHmac('sha256', key).update(payloadB64).digest('hex');
  return `${payloadB64}.${signature}`;
}

/**
 * Constant-time verification of a signed session token.
 * Returns { valid: true, payload } or { valid: false }.
 */
export function verifySignedSessionToken<T = any>(
  token: string,
  secret?: string
): { valid: boolean; payload?: T } {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { valid: false };
  }
  const parts = token.split('.');
  if (parts.length !== 2) {
    return { valid: false };
  }
  const [payloadB64, providedSig] = parts;
  const key = secret || getSessionSecret();

  try {
    const expectedSig = crypto.createHmac('sha256', key).update(payloadB64).digest('hex');
    const providedBuffer = Buffer.from(providedSig, 'hex');
    const expectedBuffer = Buffer.from(expectedSig, 'hex');

    if (providedBuffer.length !== expectedBuffer.length) {
      return { valid: false };
    }

    const isSigMatch = crypto.timingSafeEqual(providedBuffer, expectedBuffer);
    if (!isSigMatch) {
      return { valid: false };
    }

    const jsonStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr) as T;
    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

// Legacy export kept for backward-compat
export const activeOtpStore = new Map<string, { salt: string; hash: string; expiresAt: string }>();

// ─── CSRF Token Helpers ──────────────────────────────────────────────────────

/**
 * Returns the CSRF signing secret from env, falling back to session secret.
 * Set CSRF_SECRET in Vercel environment variables for production.
 */
function getCsrfSecret(): string {
  return (
    process.env.CSRF_SECRET?.trim() ||
    process.env.GODFATHER_SESSION_SECRET?.trim() ||
    process.env.GODFATHER_KMS_ENCRYPTION_KEY?.trim() ||
    'fr8x-csrf-default-DO-NOT-USE-IN-PRODUCTION'
  );
}

/**
 * Generates a CSRF token bound to the given session ID.
 * Format: {timestampHex}.{nonce}.{hmacHex}
 * Valid for 1 hour.
 */
export function generateCsrfToken(sessionId: string): string {
  const timestamp = Date.now().toString(16); // hex
  const nonce = crypto.randomBytes(8).toString('hex');
  const message = `${timestamp}.${nonce}.${sessionId}`;
  const secret = getCsrfSecret();
  const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');
  return `${timestamp}.${nonce}.${hmac}`;
}

/**
 * Verifies a CSRF token against the session ID it was issued for.
 * Returns false if the token is invalid, expired (>1h), or the session ID does not match.
 */
export function verifyCsrfToken(token: string, sessionId: string): boolean {
  if (!token || typeof token !== 'string') return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const [timestampHex, nonce, providedHmac] = parts;

  // Check expiry (1 hour)
  try {
    const issuedAt = parseInt(timestampHex, 16);
    if (isNaN(issuedAt) || Date.now() - issuedAt > 60 * 60 * 1000) return false;
  } catch {
    return false;
  }

  const message = `${timestampHex}.${nonce}.${sessionId}`;
  const secret = getCsrfSecret();
  const expectedHmac = crypto.createHmac('sha256', secret).update(message).digest('hex');

  // Constant-time comparison
  try {
    const providedBuf = Buffer.from(providedHmac, 'hex');
    const expectedBuf = Buffer.from(expectedHmac, 'hex');
    if (providedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  } catch {
    return false;
  }
}
