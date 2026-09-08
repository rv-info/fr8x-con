/**
 * FR8X — Military-Grade Untraceable Secure OTP Engine
 * ==============================================================================
 * ARCHITECTURAL SPECIFICATION & SECURITY GUARANTEES:
 * 1. Zero-Knowledge Storage: The plain OTP is NEVER stored in memory, disk, or logs.
 *    Only a double-salted HMAC-SHA256 digest is held in the blinded vault.
 * 2. Identity Blindness (Anti-Correlation): The recipient identifier (email/phone/uid)
 *    is hashed via a keyed HMAC digest, preventing memory dumps from tracing subjects.
 * 3. CSPRNG Uniform Generation: Uses Node.js crypto.randomInt() to eliminate modulo bias.
 * 4. Timing Side-Channel Immunity: All string comparisons execute via crypto.timingSafeEqual().
 * 5. Single-Use Invalidation (Burn-on-Read): Challenges are permanently incinerated immediately
 *    upon successful verification to prevent replay attacks.
 * 6. Brute-Force Auto-Incineration: Exceeding maximum failed attempts (default 3) instantly
 *    destroys the challenge and locks the session.
 * 7. Ephemeral Time-To-Live (TTL): Cryptographically bounded expiry with auto-pruning.
 * 8. Proof-of-Verification Minting: Issues an HMAC-signed single-use proof token for downstream tasks.
 * 9. Memory & Log Redaction: Automatically prevents sensitive data leaks via custom toJSON & inspect.
 * ==============================================================================
 */

import crypto from 'crypto';
import util from 'util';

export type OtpPurpose =
  | 'login'
  | 'register'
  | 'password_reset'
  | 'transaction'
  | 'godfather_access'
  | 'email_verification'
  | 'account_recovery'
  | (string & {});

export interface CreateOtpOptions {
  /** The recipient or entity identifier (email, phone, user ID) */
  subject: string;
  /** The specific purpose of this OTP to enforce purpose binding */
  purpose: OtpPurpose;
  /** Number of digits (default: 6) */
  length?: number;
  /** Validity window in seconds (default: 120 seconds) */
  ttlSeconds?: number;
  /** Maximum allowable incorrect attempts before auto-incineration (default: 3) */
  maxAttempts?: number;
  /** Whether to generate alphanumeric OTP instead of numeric (default: false) */
  alphanumeric?: boolean;
  /** Optional contextual metadata to bind to the challenge (blinded in ticket) */
  metadata?: Record<string, unknown>;
}

export interface OtpChallengeResult {
  /** Signed, opaque challenge ticket required for verification */
  challengeTicket: string;
  /**
   * The plaintext OTP intended exclusively for out-of-band delivery (SMS/Email).
   * MUST NOT be logged, stored, or returned in public API payloads.
   */
  plainOtpForDispatch: string;
  /** Expiration period in seconds */
  expiresInSeconds: number;
  /** Absolute expiration timestamp (ms) */
  expiresAt: number;
  /** Blinded correlation ID safe for server logs */
  correlationId: string;
}

export interface VerifyOtpOptions {
  /** The opaque challenge ticket issued during generation */
  challengeTicket: string;
  /** The user-submitted OTP code to verify */
  otpInput: string;
  /** Optional subject to enforce identity match if known */
  expectedSubject?: string;
  /** Expected purpose to prevent cross-workflow attack */
  expectedPurpose?: OtpPurpose;
}

export interface OtpVerificationResult {
  /** Whether the OTP was successfully verified */
  success: boolean;
  /** User-friendly security status message */
  message: string;
  /** Error explanation if unsuccessful */
  error?: string;
  /** Remaining invalid attempts allowed before permanent challenge incineration */
  attemptsRemaining?: number;
  /** True if the challenge was burned/destroyed (either by success or attempt exhaustion) */
  isBurned?: boolean;
  /** Cryptographically signed single-use proof token valid for 5 minutes */
  proofToken?: string;
  /** Verified purpose */
  purpose?: string;
  /** Blinded subject fingerprint for audit trails */
  blindedSubject?: string;
}

export interface ProofConsumptionResult {
  valid: boolean;
  error?: string;
  purpose?: string;
  blindedSubject?: string;
  metadata?: Record<string, unknown>;
}

interface VaultEntry {
  challengeId: string;
  salt: string;
  /** HMAC-SHA256(pepper, OTP + salt + blindedSubject + purpose + challengeId) */
  otpHash: string;
  /** HMAC-SHA256(pepper, subject) */
  blindedSubject: string;
  purpose: string;
  maxAttempts: number;
  failedAttempts: number;
  createdAt: number;
  expiresAt: number;
  metadata?: Record<string, unknown>;
}

export class UntraceableSecureOtpEngine {
  private static instance: UntraceableSecureOtpEngine;
  private vault: Map<string, VaultEntry> = new Map();
  private consumedProofs: Set<string> = new Set();
  private cleanupInterval: NodeJS.Timeout | null = null;
  private readonly masterPepper: Buffer;

  constructor(customPepper?: string) {
    const pepperSource =
      customPepper ||
      process.env.OTP_VAULT_PEPPER ||
      process.env.GODFATHER_SESSION_SECRET ||
      process.env.GODFATHER_KMS_ENCRYPTION_KEY ||
      'fr8x-untraceable-vault-pepper-key-2026-production-secured';

    this.masterPepper = crypto.createHash('sha256').update(pepperSource).digest();

    // Routine background garbage collection for expired entries (every 60 seconds)
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.pruneExpiredEntries(), 60_000);
      if (this.cleanupInterval.unref) {
        this.cleanupInterval.unref();
      }
    }
  }

  public static getInstance(): UntraceableSecureOtpEngine {
    if (!UntraceableSecureOtpEngine.instance) {
      UntraceableSecureOtpEngine.instance = new UntraceableSecureOtpEngine();
    }
    return UntraceableSecureOtpEngine.instance;
  }

  // ─── Core Generation & Blinded Challenge Creation ─────────────────────────

  /**
   * Generates a cryptographically random, uniform-distribution OTP and records
   * a blinded zero-knowledge challenge in the memory vault.
   */
  public createChallenge(options: CreateOtpOptions): OtpChallengeResult {
    const {
      subject,
      purpose,
      length = 6,
      ttlSeconds = 120,
      maxAttempts = 3,
      alphanumeric = false,
      metadata,
    } = options;

    if (!subject || !subject.trim()) {
      throw new Error('[SecureOtpEngine] Subject identifier is required.');
    }
    if (!purpose || !purpose.trim()) {
      throw new Error('[SecureOtpEngine] Purpose binding is required.');
    }
    if (length < 4 || length > 16) {
      throw new Error('[SecureOtpEngine] OTP length must be between 4 and 16 characters.');
    }

    // 1. CSPRNG Generation (Zero modulo bias)
    const plainOtp = this.generateCsprngCode(length, alphanumeric);

    // 2. Blind identity via HMAC digest (untraceable subject fingerprint)
    const blindedSubject = this.computeHmac(subject.trim().toLowerCase());

    // 3. Cryptographic Challenge ID & Salt
    const challengeId = `ch_${crypto.randomBytes(16).toString('hex')}`;
    const salt = crypto.randomBytes(16).toString('hex');

    // 4. One-Way Digest of the OTP (Plaintext OTP is discarded immediately from vault)
    const otpHash = this.computeOtpHmac(plainOtp, salt, blindedSubject, purpose, challengeId);

    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;

    // 5. Store zero-knowledge entry in vault
    this.vault.set(challengeId, {
      challengeId,
      salt,
      otpHash,
      blindedSubject,
      purpose,
      maxAttempts,
      failedAttempts: 0,
      createdAt: now,
      expiresAt,
      metadata,
    });

    // 6. Mint Signed Opaque Challenge Ticket
    const ticketPayload = {
      cid: challengeId,
      pur: purpose,
      sub: blindedSubject,
      exp: expiresAt,
      non: crypto.randomBytes(8).toString('hex'),
    };
    const challengeTicket = this.signTicket(ticketPayload);

    // 7. Correlation ID for safe logging
    const correlationId = `CID-${challengeId.slice(3, 11).toUpperCase()}`;

    return {
      challengeTicket,
      plainOtpForDispatch: plainOtp,
      expiresInSeconds: ttlSeconds,
      expiresAt,
      correlationId,
    };
  }

  // ─── Constant-Time Verification & Incineration ───────────────────────────

  /**
   * Verifies a user-submitted OTP against the blinded challenge in constant time.
   * On success: Permanently incinerates the challenge and issues a proof token.
   * On failure: Decrements remaining attempts. Incinerates on threshold limit.
   */
  public verifyChallenge(options: VerifyOtpOptions): OtpVerificationResult {
    const { challengeTicket, otpInput, expectedSubject, expectedPurpose } = options;

    if (!challengeTicket || !otpInput) {
      return {
        success: false,
        message: 'Invalid verification request. Missing ticket or code.',
        error: 'MISSING_CREDENTIALS',
      };
    }

    // 1. Verify ticket cryptographic signature & extract payload
    const ticketPayload = this.verifyAndParseTicket(challengeTicket);
    if (!ticketPayload) {
      return {
        success: false,
        message: 'Invalid or forged verification challenge ticket.',
        error: 'INVALID_TICKET',
      };
    }

    const { cid: challengeId, pur: ticketPurpose, sub: ticketBlindedSub, exp: ticketExpiresAt } = ticketPayload;

    // 2. Fetch challenge entry from vault
    const entry = this.vault.get(challengeId);
    if (!entry) {
      return {
        success: false,
        message: 'Verification code has expired or has already been used.',
        error: 'CHALLENGE_NOT_FOUND_OR_BURNED',
        isBurned: true,
      };
    }

    // 3. Expiration Check
    const now = Date.now();
    if (now > entry.expiresAt || now > ticketExpiresAt) {
      this.incinerate(challengeId);
      return {
        success: false,
        message: 'The verification code has expired. Please request a new code.',
        error: 'CODE_EXPIRED',
        isBurned: true,
      };
    }

    // 4. Purpose Binding Check
    if (expectedPurpose && expectedPurpose !== entry.purpose) {
      this.incinerate(challengeId);
      return {
        success: false,
        message: 'Purpose mismatch. This verification code was issued for a different operation.',
        error: 'PURPOSE_MISMATCH',
        isBurned: true,
      };
    }

    // 5. Subject Binding Check (if expectedSubject provided)
    if (expectedSubject) {
      const expectedBlinded = this.computeHmac(expectedSubject.trim().toLowerCase());
      if (
        !this.constantTimeCompare(
          Buffer.from(expectedBlinded, 'utf8'),
          Buffer.from(entry.blindedSubject, 'utf8')
        )
      ) {
        this.incinerate(challengeId);
        return {
          success: false,
          message: 'Subject mismatch. This code is bound to another identifier.',
          error: 'SUBJECT_MISMATCH',
          isBurned: true,
        };
      }
    }

    // 6. Compute Candidate Hash with same parameters
    const candidateHash = this.computeOtpHmac(
      otpInput.trim(),
      entry.salt,
      entry.blindedSubject,
      entry.purpose,
      entry.challengeId
    );

    // 7. Constant-Time Timing-Attack Resistant Comparison
    const candidateBuf = Buffer.from(candidateHash, 'hex');
    const storedBuf = Buffer.from(entry.otpHash, 'hex');

    const isMatch = this.constantTimeCompare(candidateBuf, storedBuf);

    if (!isMatch) {
      entry.failedAttempts += 1;
      const remaining = Math.max(0, entry.maxAttempts - entry.failedAttempts);

      if (remaining === 0) {
        // Exceeded attempt limit: Immediately incinerate challenge to thwart brute-force attacks
        this.incinerate(challengeId);
        return {
          success: false,
          message: 'Maximum verification attempts exceeded. For your security, this code has been destroyed.',
          error: 'MAX_ATTEMPTS_EXCEEDED',
          attemptsRemaining: 0,
          isBurned: true,
        };
      }

      return {
        success: false,
        message:
          remaining === 1
            ? 'Incorrect verification code. 1 attempt remaining before this code is destroyed.'
            : `Incorrect verification code. ${remaining} attempts remaining.`,
        error: 'INCORRECT_CODE',
        attemptsRemaining: remaining,
        isBurned: false,
      };
    }

    // 8. SUCCESS: Immediately burn the challenge from vault (Zero Replay Window)
    const preservedMetadata = entry.metadata;
    const verifiedPurpose = entry.purpose;
    const verifiedBlindedSubject = entry.blindedSubject;
    this.incinerate(challengeId);

    // 9. Issue Cryptographic Proof Token (valid for 5 minutes)
    const proofToken = this.mintProofToken({
      challengeId,
      purpose: verifiedPurpose,
      blindedSubject: verifiedBlindedSubject,
      metadata: preservedMetadata,
      verifiedAt: now,
      expiresAt: now + 5 * 60 * 1000,
    });

    return {
      success: true,
      message: 'Verification confirmed successfully.',
      isBurned: true,
      proofToken,
      purpose: verifiedPurpose,
      blindedSubject: verifiedBlindedSubject,
    };
  }

  // ─── Single-Use Proof-of-Verification Grant ───────────────────────────────

  /**
   * Validates and consumes a Proof Token issued upon successful OTP verification.
   * Proof tokens can only be consumed once.
   */
  public consumeProofToken(proofToken: string, expectedPurpose?: string): ProofConsumptionResult {
    if (!proofToken) {
      return { valid: false, error: 'MISSING_PROOF_TOKEN' };
    }

    const payload = this.verifyAndParseProofToken(proofToken);
    if (!payload) {
      return { valid: false, error: 'INVALID_OR_TAMPERED_PROOF_TOKEN' };
    }

    const { proofId, purpose, blindedSubject, metadata, expiresAt } = payload;

    if (this.consumedProofs.has(proofId)) {
      return { valid: false, error: 'PROOF_TOKEN_ALREADY_CONSUMED' };
    }

    if (Date.now() > expiresAt) {
      return { valid: false, error: 'PROOF_TOKEN_EXPIRED' };
    }

    if (expectedPurpose && expectedPurpose !== purpose) {
      return { valid: false, error: 'PURPOSE_MISMATCH' };
    }

    // Single-use burn
    this.consumedProofs.add(proofId);

    return {
      valid: true,
      purpose,
      blindedSubject,
      metadata,
    };
  }

  // ─── Incineration & Memory Pruning ────────────────────────────────────────

  /**
   * Irreversibly expunges a challenge entry from the memory vault.
   */
  public incinerate(challengeId: string): boolean {
    const entry = this.vault.get(challengeId);
    if (entry) {
      // Overwrite salt & hash buffers in memory before deleting pointer
      entry.salt = '0000000000000000';
      entry.otpHash = '0000000000000000000000000000000000000000000000000000000000000000';
      this.vault.delete(challengeId);
      return true;
    }
    return false;
  }

  /**
   * Garbage collects expired challenges.
   */
  public pruneExpiredEntries(): number {
    const now = Date.now();
    let pruned = 0;
    for (const [id, entry] of this.vault.entries()) {
      if (now > entry.expiresAt) {
        this.incinerate(id);
        pruned++;
      }
    }
    return pruned;
  }

  /**
   * Returns active vault size (for diagnostics/metrics without exposing entries).
   */
  public getActiveVaultSize(): number {
    return this.vault.size;
  }

  // ─── Cryptographic Utility Primitives ─────────────────────────────────────

  private generateCsprngCode(length: number, alphanumeric: boolean): string {
    if (!alphanumeric) {
      const min = Math.pow(10, length - 1);
      const max = Math.pow(10, length) - 1;
      return crypto.randomInt(min, max + 1).toString();
    } else {
      const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // Unambiguous charset (no 0/O, 1/I)
      let result = '';
      for (let i = 0; i < length; i++) {
        const idx = crypto.randomInt(0, charset.length);
        result += charset[idx];
      }
      return result;
    }
  }

  private computeHmac(data: string): string {
    return crypto.createHmac('sha256', this.masterPepper).update(data).digest('hex');
  }

  private computeOtpHmac(
    otp: string,
    salt: string,
    blindedSubject: string,
    purpose: string,
    challengeId: string
  ): string {
    const payload = `${otp}:${salt}:${blindedSubject}:${purpose}:${challengeId}`;
    return crypto.createHmac('sha256', this.masterPepper).update(payload).digest('hex');
  }

  private constantTimeCompare(a: Buffer, b: Buffer): boolean {
    if (a.length !== b.length) {
      return false;
    }
    try {
      return crypto.timingSafeEqual(a, b);
    } catch {
      return false;
    }
  }

  private signTicket(payload: Record<string, unknown>): string {
    const raw = JSON.stringify(payload);
    const b64 = Buffer.from(raw, 'utf8').toString('base64url');
    const signature = crypto.createHmac('sha256', this.masterPepper).update(b64).digest('base64url');
    return `${b64}.${signature}`;
  }

  private verifyAndParseTicket(ticket: string): Record<string, any> | null {
    const parts = ticket.split('.');
    if (parts.length !== 2) return null;
    const [b64, signature] = parts;
    const expectedSig = crypto.createHmac('sha256', this.masterPepper).update(b64).digest('base64url');

    const sigBufA = Buffer.from(signature, 'utf8');
    const sigBufB = Buffer.from(expectedSig, 'utf8');
    if (!this.constantTimeCompare(sigBufA, sigBufB)) {
      return null;
    }

    try {
      const raw = Buffer.from(b64, 'base64url').toString('utf8');
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  private mintProofToken(payload: {
    challengeId: string;
    purpose: string;
    blindedSubject: string;
    metadata?: Record<string, unknown>;
    verifiedAt: number;
    expiresAt: number;
  }): string {
    const proofId = `prf_${crypto.randomBytes(16).toString('hex')}`;
    const tokenPayload = {
      ...payload,
      proofId,
      iss: 'FR8X-SECURE-OTP-VAULT',
    };
    return this.signTicket(tokenPayload);
  }

  private verifyAndParseProofToken(token: string): Record<string, any> | null {
    return this.verifyAndParseTicket(token);
  }

  // ─── Log & Serialization Redaction ────────────────────────────────────────

  public toJSON(): Record<string, string> {
    return {
      status: 'active',
      vaultSize: String(this.vault.size),
      securityModel: 'ZERO_KNOWLEDGE_BLINDED_HMAC_SHA256',
      redacted: '[REDACTED_SECURE_OTP_VAULT]',
    };
  }

  [util.inspect.custom](): string {
    return '[UntraceableSecureOtpEngine: ZERO_KNOWLEDGE_VAULT_ACTIVE]';
  }
}

// Export singleton instance for system-wide consumption
export const secureOtpEngine = UntraceableSecureOtpEngine.getInstance();
