import crypto from 'crypto';

// Application-layer AES-256-GCM Encryption Key
const DEFAULT_KEY_HEX = 'e1a3b5c7d9f2e4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4';
const ENCRYPTION_KEY = Buffer.from(process.env.GODFATHER_KMS_ENCRYPTION_KEY || DEFAULT_KEY_HEX, 'hex');

/**
 * Application-layer encryption for sensitive records before Firestore write
 * Uses AES-256-GCM with unique IV and authentication tag
 */
export function encryptField(plainText: string): string {
  if (!plainText) return plainText;
  try {
    const iv = crypto.randomBytes(12); // 96-bit IV for GCM
    const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(plainText, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag().toString('hex');
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
  } catch (err) {
    console.error('Field encryption error:', err);
    return plainText;
  }
}

/**
 * Decrypts field encrypted with encryptField
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
    console.error('Field decryption error:', err);
    return cipherData;
  }
}

/**
 * Generates a salted SHA-256 hash for OTP authentication
 * Never store OTPs in plain text!
 */
export function hashOtp(otp: string): { salt: string; hash: string; expiresAt: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.createHmac('sha256', salt).update(otp.trim()).digest('hex');
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutes expiry
  return { salt, hash, expiresAt };
}

/**
 * Validates candidate OTP against stored salt and hash
 */
export function verifyOtpHash(candidateOtp: string, salt: string, expectedHash: string, expiresAt: string): boolean {
  if (new Date() > new Date(expiresAt)) {
    return false; // Expired
  }
  const computedHash = crypto.createHmac('sha256', salt).update(candidateOtp.trim()).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(computedHash, 'hex'), Buffer.from(expectedHash, 'hex'));
}

/**
 * Server-side in-memory Rate Limiting and Brute Force Lockout Tracker
 */
interface RateLimitEntry {
  attempts: number;
  lockedUntil?: number;
  lastAttempt: number;
}

const loginAttemptStore = new Map<string, RateLimitEntry>();
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

export function checkRateLimit(identifier: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const entry = loginAttemptStore.get(identifier);

  if (!entry) {
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  if (entry.lockedUntil && entry.lockedUntil > now) {
    const retryAfter = Math.ceil((entry.lockedUntil - now) / 1000);
    return { allowed: false, remainingAttempts: 0, retryAfterSeconds: retryAfter };
  }

  // If lockout expired, reset
  if (entry.lockedUntil && entry.lockedUntil <= now) {
    loginAttemptStore.delete(identifier);
    return { allowed: true, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_FAILED_ATTEMPTS - entry.attempts);
  return { allowed: remaining > 0, remainingAttempts: remaining };
}

export function recordFailedAttempt(identifier: string): { locked: boolean; remainingAttempts: number } {
  const now = Date.now();
  const entry = loginAttemptStore.get(identifier) || { attempts: 0, lastAttempt: now };
  entry.attempts += 1;
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

// In-memory store for active OTP salted hashes
// In a distributed production cluster, this is stored in Redis / Firestore with TTL
export const activeOtpStore = new Map<string, { salt: string; hash: string; expiresAt: string }>();
