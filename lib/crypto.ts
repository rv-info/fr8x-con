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

// Legacy export kept for backward-compat
export const activeOtpStore = new Map<string, { salt: string; hash: string; expiresAt: string }>();
