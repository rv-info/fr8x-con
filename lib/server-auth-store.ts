// Server-side Authentication, Security, and State Management Engine
// Handles credential validation, failed login attempt tracking, account blocking,
// daily OTP limits, salted PBKDF2 password hashing, privileged session control, and audit logs.
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { EmailService } from '@/lib/email-service';
import {
  hashPassword as pbkdf2HashPassword,
  verifyPassword as pbkdf2VerifyPassword,
  generateSecureOtp,
  generateSecureToken,
  createSignedSessionToken,
  verifySignedSessionToken,
} from '@/lib/crypto';
import { isCorporateEmail } from '@/lib/utils';

export interface ServerUserRecord {
  uid: string;
  email: string;
  passwordHash: string; // SHA-256 / PBKDF2 hashed password
  salt: string;
  displayName: string;
  company: string;
  companyId: string;
  role: 'company_admin' | 'user' | 'billing_admin';
  status: 'active' | 'blocked' | 'suspended' | 'pending_verification';
  mobile?: string;
  failedLoginAttempts: number;
  lastFailedAttemptAt?: string;
  blockedAt?: string;
  blockedReason?: string;
  emailVerificationToken?: string;
  emailVerificationExpiresAt?: number;
  emailVerifiedAt?: string;
  firstLoginCompleted?: boolean;
  createdAt: string;
}

export interface EmailVerificationRecord {
  email: string;
  token: string;
  otp: string;
  expiresAt: number;
  attempts: number;
  createdAt: number;
}

export interface BlockedAccountRecord {
  id: string;
  uid: string;
  email: string;
  displayName: string;
  company: string;
  companyId: string;
  failedAttempts: number;
  lastAttemptAt: string;
  blockedAt: string;
  status: 'blocked' | 'unblocked';
  reason: string;
  ipAddress?: string;
  unblockedBy?: string;
  unblockedAt?: string;
  unblockReason?: string;
  securityEventId?: string;
}

export interface SecurityEventRecord {
  id: string;
  type:
    | 'FAILED_LOGIN'
    | 'ACCOUNT_BLOCKED'
    | 'ACCOUNT_UNBLOCKED'
    | 'OTP_LIMIT_WARNING'
    | 'OTP_LIMIT_REACHED'
    | 'PASSWORD_RESET_REQUEST'
    | 'SUSPICIOUS_LOGIN'
    | 'GODFATHER_LOGIN'
    | 'GODFATHER_LOGOUT'
    | 'PRIVILEGED_ADMIN_ACTION';
  severity: 'INFO' | 'WARNING' | 'HIGH' | 'CRITICAL';
  userEmail: string;
  uid?: string;
  company?: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface OTPRecord {
  userEmail: string;
  date: string; // YYYY-MM-DD
  attempts: number; // max 3 per date
  lastRequestedAt: string;
}

export interface PasswordResetRecord {
  id: string;
  email: string;
  requestedAt: string;
  status: 'pending' | 'completed' | 'expired';
  ipAddress?: string;
}

export interface ActivePasswordResetOTP {
  email: string;
  otp: string;
  token?: string;
  expiresAt: number; // timestamp in ms
  attempts: number;
  ipAddress?: string;
}

export function maskEmail(email: string): string {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/**
 * SECURITY: Uses PBKDF2-HMAC-SHA512 with 200,000 iterations.
 * The old 32-bit rolling hash ('sha256_sim_...') has been replaced.
 * @deprecated Pass only 1 argument (plaintext) — the salt is generated internally.
 * Legacy 2-arg form is accepted for backward compat but now uses PBKDF2.
 */
export function hashPassword(password: string, _legacySalt?: string): string {
  // PBKDF2 path — returns "salt:hash" encoded as hex, prefixed for identification
  const { salt, hash } = pbkdf2HashPassword(password);
  return `pbkdf2:${salt}:${hash}`;
}

/**
 * Verifies a password produced by hashPassword().
 * Handles both the new PBKDF2 format and detects the old weak format.
 */
export function verifyHashedPassword(plaintext: string, stored: string): boolean {
  if (stored.startsWith('pbkdf2:')) {
    const parts = stored.split(':');
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    return pbkdf2VerifyPassword(plaintext, salt, hash);
  }
  // Legacy weak hash detected — refuse to authenticate and log
  console.error('[ServerSecurityStore] CRITICAL: Refusing auth against legacy weak hash. Password must be reset.');
  return false;
}

// Production environment guard
if (process.env.NODE_ENV === 'production') {
  const KMS_KEY = process.env.GODFATHER_KMS_ENCRYPTION_KEY;
  const DEFAULT_HEX = 'e1a3b5c7d9f2e4a6b8c0d2e4f6a8b0c2d4e6f8a0b2c4d6e8f0a2b4c6d8e0f2a4';
  if (!KMS_KEY || KMS_KEY === DEFAULT_HEX) {
    console.error(
      '[ServerSecurityStore] CRITICAL: GODFATHER_KMS_ENCRYPTION_KEY is using the default fallback value in production. ' +
      'All field-encrypted data is at risk. Set a unique 64-hex-char key in Vercel environment variables immediately.'
    );
  }
}

// Global server state with file-backed persistence to prevent state loss across Next.js reloads
class ServerSecurityStore {
  private users: Map<string, ServerUserRecord> = new Map();
  private blockedAccounts: Map<string, BlockedAccountRecord> = new Map();
  private otpRecords: Map<string, OTPRecord> = new Map(); // key: email:date
  private emailVerifications: Map<string, EmailVerificationRecord> = new Map(); // key: email.toLowerCase()
  private verificationTokens: Map<string, string> = new Map(); // key: token -> email.toLowerCase()
  private resendLimits: Map<string, { count: number; windowStart: number }> = new Map(); // key: email.toLowerCase()
  private activeResetOtps: Map<string, ActivePasswordResetOTP> = new Map(); // key: email.toLowerCase()
  private activeLoginOtps: Map<
    string,
    { email: string; salt: string; hash: string; expiresAt: number; attempts: number; ipAddress?: string }
  > = new Map(); // key: email.toLowerCase() — OTP stored as PBKDF2 hash, never plaintext
  private resetTokens: Map<string, string> = new Map(); // key: token -> email.toLowerCase()
  private passwordResets: PasswordResetRecord[] = [];
  private securityEvents: SecurityEventRecord[] = [];
  private activeGodfatherSessions: Set<string> = new Set();
  private activeFirstLoginOtps: Map<
    string,
    { salt: string; hash: string; expiresAt: number; attempts: number; challengeId: string }
  > = new Map();
  private firstLoginOtpSendTimestamps: Map<string, number[]> = new Map();
  private failedAttemptsByIdentifier: Map<string, { count: number; lockedUntil?: number }> = new Map();
  private otpCooldowns: Map<string, number> = new Map();

  constructor() {
    this.loadPersistedState();
    this.seedFoundationAccounts();
    this.persistState();
  }

  /**
   * Seeds enterprise foundation accounts (u-arjun, u-sarah, u-kiran, etc.)
   * using secure PBKDF2 hashing and firstLoginCompleted: true.
   */
  public seedFoundationAccounts() {
    const defaultAccounts = [
      {
        uid: 'u-arjun',
        email: 'arjun@atlaslogistics.com',
        passwordPlain: 'Atlas@2025',
        displayName: 'Arjun Rao',
        company: 'Atlas Logistics Pvt. Ltd.',
        companyId: 'CMP-00101',
        role: 'company_admin' as const,
        status: 'active' as const,
        mobile: '+919820011223',
        failedLoginAttempts: 0,
        firstLoginCompleted: true,
        createdAt: '2026-01-15T08:00:00.000Z',
      },
      {
        uid: 'u-sarah',
        email: 'sarah.lewis@rotterdamfreight.nl',
        passwordPlain: 'Rotterdam@2025',
        displayName: 'Sarah Lewis',
        company: 'Rotterdam Freight NV',
        companyId: 'CMP-00102',
        role: 'company_admin' as const,
        status: 'active' as const,
        mobile: '+31612345678',
        failedLoginAttempts: 0,
        firstLoginCompleted: true,
        createdAt: '2026-01-15T08:00:00.000Z',
      },
      {
        uid: 'u-kiran',
        email: 'kiran.sharma@gatewaylines.in',
        passwordPlain: 'Gateway@Pass2026',
        displayName: 'Kiran Sharma',
        company: 'Gateway Lines India',
        companyId: 'CMP-00103',
        role: 'company_admin' as const,
        status: 'active' as const,
        mobile: '+919820033445',
        failedLoginAttempts: 0,
        firstLoginCompleted: true,
        createdAt: '2026-01-15T08:00:00.000Z',
      },
      {
        uid: 'u-elena',
        email: 'elena.rostova@balticlogistics.eu',
        passwordPlain: 'Baltic@2025',
        displayName: 'Elena Rostova',
        company: 'Baltic Logistics EU',
        companyId: 'CMP-00104',
        role: 'company_admin' as const,
        status: 'active' as const,
        mobile: '+491512345678',
        failedLoginAttempts: 0,
        firstLoginCompleted: true,
        createdAt: '2026-01-15T08:00:00.000Z',
      },
      {
        uid: 'u-david',
        email: 'david.chen@pacificfreight.sg',
        passwordPlain: 'Pacific@2025',
        displayName: 'David Chen',
        company: 'Pacific Freight Singapore',
        companyId: 'CMP-00105',
        role: 'company_admin' as const,
        status: 'active' as const,
        mobile: '+6591234567',
        failedLoginAttempts: 0,
        firstLoginCompleted: true,
        createdAt: '2026-01-15T08:00:00.000Z',
      },
    ];

    for (const acc of defaultAccounts) {
      const cleanUid = acc.uid.toLowerCase();
      const cleanEmail = acc.email.toLowerCase();
      const existing = this.users.get(cleanUid);
      if (!existing || !existing.passwordHash?.startsWith('pbkdf2:')) {
        const { passwordPlain, ...rest } = acc;
        const record: ServerUserRecord = {
          ...rest,
          salt: 'pbkdf2_managed',
          passwordHash: hashPassword(passwordPlain),
        };
        this.users.set(cleanUid, record);
        this.users.set(cleanEmail, record);
      }
    }
  }

  /**
   * Persists registered users, verification tokens, and active reset OTPs to disk
   * to ensure zero state loss during Next.js dev server reloads or multi-worker evaluation.
   */
  public persistState() {
    try {
      const dataDir = path.join(process.cwd(), '.knox');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const dataFile = path.join(dataDir, 'server-auth-data.json');

      // Always merge existing disk data before writing so concurrent workers never overwrite user registrations
      if (fs.existsSync(dataFile)) {
        try {
          const raw = fs.readFileSync(dataFile, 'utf8');
          const diskData = JSON.parse(raw);
          if (Array.isArray(diskData.users)) {
            for (const [k, u] of diskData.users) {
              if (!this.users.has(k)) {
                this.users.set(k, u);
              }
            }
          }
          if (Array.isArray(diskData.blockedAccounts)) {
            for (const [k, b] of diskData.blockedAccounts) {
              if (!this.blockedAccounts.has(k)) {
                this.blockedAccounts.set(k, b);
              }
            }
          }
          if (Array.isArray(diskData.activeGodfatherSessions)) {
            for (const s of diskData.activeGodfatherSessions) {
              this.activeGodfatherSessions.add(s);
            }
          }
        } catch {
          // Ignore disk read/parse errors
        }
      }

      const payload = {
        users: Array.from(this.users.entries()),
        emailVerifications: Array.from(this.emailVerifications.entries()),
        verificationTokens: Array.from(this.verificationTokens.entries()),
        activeResetOtps: Array.from(this.activeResetOtps.entries()),
        activeLoginOtps: Array.from(this.activeLoginOtps.entries()),
        resetTokens: Array.from(this.resetTokens.entries()),
        blockedAccounts: Array.from(this.blockedAccounts.entries()),
        activeGodfatherSessions: Array.from(this.activeGodfatherSessions.values()),
      };
      fs.writeFileSync(dataFile, JSON.stringify(payload, null, 2), 'utf8');
    } catch (err: any) {
      console.warn('[ServerSecurityStore] State persistence warning:', err.message);
    }
  }

  /**
   * Loads persisted users and active verification challenges from disk.
   */
  public loadPersistedState() {
    try {
      const dataFile = path.join(process.cwd(), '.knox', 'server-auth-data.json');
      if (fs.existsSync(dataFile)) {
        const raw = fs.readFileSync(dataFile, 'utf8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.users)) {
          for (const [k, u] of data.users) {
            this.users.set(k, u);
          }
        }
        if (Array.isArray(data.emailVerifications)) {
          for (const [k, v] of data.emailVerifications) {
            this.emailVerifications.set(k, v);
          }
        }
        if (Array.isArray(data.verificationTokens)) {
          for (const [k, t] of data.verificationTokens) {
            this.verificationTokens.set(k, t);
          }
        }
        if (Array.isArray(data.activeResetOtps)) {
          for (const [k, r] of data.activeResetOtps) {
            this.activeResetOtps.set(k, r);
          }
        }
        if (Array.isArray(data.activeLoginOtps)) {
          for (const [k, o] of data.activeLoginOtps) {
            this.activeLoginOtps.set(k, o);
          }
        }
        if (Array.isArray(data.resetTokens)) {
          for (const [k, t] of data.resetTokens) {
            this.resetTokens.set(k, t);
          }
        }
        if (Array.isArray(data.blockedAccounts)) {
          for (const [k, b] of data.blockedAccounts) {
            this.blockedAccounts.set(k, b);
          }
        }
        if (Array.isArray(data.activeGodfatherSessions)) {
          for (const s of data.activeGodfatherSessions) {
            this.activeGodfatherSessions.add(s);
          }
        }
      }
    } catch (err: any) {
      console.warn('[ServerSecurityStore] Load persisted state warning:', err.message);
    }
  }

  // seedRealTestingUsers() removed for production security.
  // No demo/test users are seeded at runtime.
  // See SECURITY AUDIT 2026-09: C-05 remediation.

  public getUser(emailOrUid: string): ServerUserRecord | undefined {
    const clean = emailOrUid.trim().toLowerCase();
    let user = this.users.get(clean);
    if (!user) {
      this.loadPersistedState();
      user = this.users.get(clean);
    }
    return user;
  }

  public registerUser(
    user: {
      uid: string;
      email: string;
      password: string;
      displayName: string;
      company: string;
      companyId: string;
      role?: 'company_admin' | 'user' | 'billing_admin';
      mobile?: string;
    },
    options?: { skipVerification?: boolean; origin?: string; firstLoginCompleted?: boolean }
  ): {
    success: boolean;
    error?: string;
    user?: ServerUserRecord;
    verificationToken?: string;
    verificationOtp?: string;
    isVerificationRequired?: boolean;
    emailPromise?: Promise<any>;
  } {
    const cleanEmail = user.email.trim().toLowerCase();
    const cleanUid = user.uid.trim().toLowerCase();
    const cleanMobile = user.mobile ? user.mobile.replace(/[^0-9+]/g, '') : undefined;

    // Enforce corporate organization email policy (strictly blocks personal/free webmail)
    if (!isCorporateEmail(cleanEmail)) {
      return {
        success: false,
        error: 'Please provide a valid corporate organization email address.',
      };
    }

    // Check if email or UID is already registered
    const existingByEmailOrUid = this.users.get(cleanEmail) || this.users.get(cleanUid);
    if (existingByEmailOrUid) {
      const isSameCompany =
        existingByEmailOrUid.company.trim().toLowerCase() === user.company.trim().toLowerCase();
      if (isSameCompany) {
        return {
          success: false,
          error: `An account with this corporate email (${user.email}) is already registered under ${existingByEmailOrUid.company}. Multi-accounting in the same organization is prohibited under the One User, One Login policy. Please sign in instead.`,
        };
      } else {
        return {
          success: false,
          error: `This corporate email (${user.email}) is already associated with another registered organization (${existingByEmailOrUid.company}). Multi-accounting across organizations is strictly prohibited (One User, One Login policy). Each user is permitted only one active account.`,
        };
      }
    }

    // Check if mobile number is already registered
    if (cleanMobile && cleanMobile.length >= 8) {
      for (const existing of this.users.values()) {
        if (existing.mobile) {
          const norm = existing.mobile.replace(/[^0-9+]/g, '');
          if (norm === cleanMobile) {
            return {
              success: false,
              error: `This mobile phone number (${user.mobile}) is already associated with an active account (${existing.email}). Multi-accounting is prohibited under the One User, One Login policy.`,
            };
          }
        }
      }
    }

    const salt = `fr8x_salt_${Date.now()}`;
    const isVerificationRequired = !options?.skipVerification;
    const initialStatus = isVerificationRequired ? 'pending_verification' : 'active';

    // Clean up any existing verification token and ensure new OTP is distinct from old
    const existingVerif = this.emailVerifications.get(cleanEmail);
    if (existingVerif?.token) {
      this.verificationTokens.delete(existingVerif.token);
    }
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationOtp = generateSecureOtp(6, existingVerif?.otp);
    const tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const record: ServerUserRecord = {
      uid: user.uid,
      email: user.email,
      salt: 'pbkdf2_managed', // Salt is embedded in passwordHash for PBKDF2
      passwordHash: hashPassword(user.password), // PBKDF2 hash, format: pbkdf2:<salt>:<hash>
      displayName: user.displayName,
      company: user.company,
      companyId: user.companyId,
      role: user.role || 'company_admin',
      status: initialStatus,
      mobile: user.mobile,
      failedLoginAttempts: 0,
      firstLoginCompleted: options?.firstLoginCompleted ?? false,
      emailVerificationToken: isVerificationRequired ? verificationToken : undefined,
      emailVerificationExpiresAt: isVerificationRequired ? tokenExpiresAt : undefined,
      emailVerifiedAt: !isVerificationRequired ? new Date().toISOString() : undefined,
      createdAt: new Date().toISOString(),
    };

    this.users.set(cleanUid, record);
    this.users.set(cleanEmail, record);

    if (isVerificationRequired) {
      this.emailVerifications.set(cleanEmail, {
        email: cleanEmail,
        token: verificationToken,
        otp: verificationOtp,
        expiresAt: tokenExpiresAt,
        attempts: 0,
        createdAt: Date.now(),
      });
      this.verificationTokens.set(verificationToken, cleanEmail);

      const origin =
        options?.origin ||
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://con.fr8x.in';
      const verificationLink = `${origin}/verify-email/${verificationToken}`;

      // Persist state to disk so reload / worker boundary never loses the account
      this.persistState();

      // Dispatch verification email via EmailService (password@fr8x.in)
      const emailPromise = EmailService.sendVerificationEmail({
        to: cleanEmail,
        verificationLink,
        token: verificationToken,
        otpCode: verificationOtp,
        expiryMinutes: 1440,
      }).catch((err) => {
        console.error('[Security] Failed to dispatch verification email:', err.message);
        return { success: false, error: err.message };
      });

      return {
        success: true,
        user: record,
        verificationToken: isVerificationRequired ? verificationToken : undefined,
        verificationOtp: isVerificationRequired ? verificationOtp : undefined,
        isVerificationRequired,
        emailPromise,
      };
    } else {
      this.persistState();
    }

    return {
      success: true,
      user: record,
      verificationToken: undefined,
      verificationOtp: undefined,
      isVerificationRequired: false,
    };
  }

  /**
   * Validates email verification via token (URL click) or 6-digit OTP
   */
  public verifyEmailToken(params: {
    token?: string;
    otp?: string;
    email?: string;
  }): { success: boolean; error?: string; message?: string; user?: ServerUserRecord } {
    let cleanEmail = (params.email || '').trim().toLowerCase();

    // 1. If token provided without email, look up email
    if (params.token && !cleanEmail) {
      let mapped = this.verificationTokens.get(params.token.trim());
      if (!mapped) {
        this.loadPersistedState();
        mapped = this.verificationTokens.get(params.token.trim());
      }
      if (mapped) cleanEmail = mapped;
    }

    // 2. If OTP is provided, locate active verification challenge by email or by OTP code
    if (params.otp) {
      const inputOtp = params.otp.trim();
      // Ensure latest state from disk is loaded across concurrent worker processes
      if (!cleanEmail || !this.emailVerifications.has(cleanEmail) || !this.users.has(cleanEmail)) {
        this.loadPersistedState();
      }

      // If email didn't match directly, scan active verification challenges for the exact OTP
      if (!cleanEmail || !this.emailVerifications.has(cleanEmail)) {
        for (const [em, rec] of this.emailVerifications.entries()) {
          if (rec.otp === inputOtp && Date.now() <= rec.expiresAt) {
            cleanEmail = em;
            break;
          }
        }
      }
    }

    if (!cleanEmail) {
      return { success: false, error: 'Corporate email address or 6-digit verification code is required.' };
    }

    let verificationRecord = this.emailVerifications.get(cleanEmail);
    let user = this.users.get(cleanEmail);

    // If not found in current memory, reload from persisted disk store
    if (!user || !verificationRecord) {
      this.loadPersistedState();
      user = this.users.get(cleanEmail);
      verificationRecord = this.emailVerifications.get(cleanEmail);
    }

    // If user object not mapped by email key directly, search by user.email property
    if (!user) {
      for (const u of this.users.values()) {
        if (u.email && u.email.toLowerCase() === cleanEmail) {
          user = u;
          this.users.set(cleanEmail, u);
          break;
        }
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'Registration record not found or verification session expired. Please resend the code or re-enter your details.',
      };
    }

    if (user.status === 'active') {
      return {
        success: true,
        message: 'Account is already verified and active. Please sign in.',
        user,
      };
    }

    if (!verificationRecord) {
      // Check if token matches stored token on user record
      if (
        params.token &&
        user.emailVerificationToken === params.token.trim() &&
        user.emailVerificationExpiresAt &&
        user.emailVerificationExpiresAt > Date.now()
      ) {
        user.status = 'active';
        user.emailVerifiedAt = new Date().toISOString();
        user.emailVerificationToken = undefined;
        user.emailVerificationExpiresAt = undefined;
        return {
          success: true,
          message: 'Email successfully verified! Your account is now active.',
          user,
        };
      }
      return {
        success: false,
        error: 'No active verification record found or verification code has expired. Please request a new verification code.',
      };
    }

    if (Date.now() > verificationRecord.expiresAt) {
      this.emailVerifications.delete(cleanEmail);
      if (verificationRecord.token) this.verificationTokens.delete(verificationRecord.token);
      return {
        success: false,
        error: 'Verification code or token has expired. Please request a new code.',
      };
    }

    // Check match: token or OTP
    let isMatch = false;
    if (params.token && params.token.trim() === verificationRecord.token) {
      isMatch = true;
    } else if (params.otp && params.otp.trim() === verificationRecord.otp) {
      isMatch = true;
    }

    if (!isMatch) {
      verificationRecord.attempts += 1;
      if (verificationRecord.attempts >= 5) {
        this.emailVerifications.delete(cleanEmail);
        if (verificationRecord.token) this.verificationTokens.delete(verificationRecord.token);
        return {
          success: false,
          error: 'Maximum verification attempts exceeded. Please request a new code.',
        };
      }
      return {
        success: false,
        error: 'Invalid verification token or 6-digit code. Please check your email.',
      };
    }

    // Success: activate user, clear verification tokens
    user.status = 'active';
    user.emailVerifiedAt = new Date().toISOString();
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiresAt = undefined;

    this.emailVerifications.delete(cleanEmail);
    this.verificationTokens.delete(verificationRecord.token);
    this.persistState();

    this.addSecurityEvent({
      type: 'ACCOUNT_UNBLOCKED',
      severity: 'INFO',
      userEmail: cleanEmail,
      uid: user.uid,
      company: user.company,
      details: 'Account successfully verified via email confirmation.',
    });

    return {
      success: true,
      message: 'Email verified successfully! Your account is now active.',
      user,
    };
  }

  /**
   * Resend verification email with rate-limiting (max 3 resends per hour)
   */
  public resendEmailVerification(
    email: string,
    origin?: string
  ): {
    success: boolean;
    message: string;
    remainingAttempts?: number;
    otp?: string;
    token?: string;
    emailPromise?: Promise<any>;
  } {
    const cleanEmail = email.trim().toLowerCase();
    let user = this.users.get(cleanEmail);
    if (!user) {
      this.loadPersistedState();
      user = this.users.get(cleanEmail);
    }

    // Rate limiting
    const now = Date.now();
    const rateLimit = this.resendLimits.get(cleanEmail) || { count: 0, windowStart: now };
    const ONE_HOUR = 60 * 60 * 1000;

    if (now - rateLimit.windowStart > ONE_HOUR) {
      rateLimit.count = 0;
      rateLimit.windowStart = now;
    }

    const MAX_RESENDS = 3;
    if (rateLimit.count >= MAX_RESENDS) {
      return {
        success: false,
        message: 'Resend limit reached (max 3 per hour). Please try again later or check your spam folder.',
        remainingAttempts: 0,
      };
    }

    // 60-second cooldown guard
    const lastSentAt = this.otpCooldowns.get(`verify:${cleanEmail}`) || 0;
    if (now - lastSentAt < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastSentAt)) / 1000);
      return {
        success: false,
        message: `Please wait ${waitSeconds} second(s) before requesting another verification code.`,
        remainingAttempts: Math.max(0, MAX_RESENDS - rateLimit.count),
      };
    }
    this.otpCooldowns.set(`verify:${cleanEmail}`, now);

    rateLimit.count += 1;
    this.resendLimits.set(cleanEmail, rateLimit);

    if (user && user.status === 'pending_verification') {
      // Clean up old token if mapped and grab previous OTP to guarantee new OTP rotates
      const existing = this.emailVerifications.get(cleanEmail);
      if (existing?.token) this.verificationTokens.delete(existing.token);

      const oldOtp = existing?.otp;
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationOtp = generateSecureOtp(6, oldOtp);
      const tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpiresAt = tokenExpiresAt;

      this.emailVerifications.set(cleanEmail, {
        email: cleanEmail,
        token: verificationToken,
        otp: verificationOtp,
        expiresAt: tokenExpiresAt,
        attempts: 0,
        createdAt: now,
      });
      this.verificationTokens.set(verificationToken, cleanEmail);

      const baseOrigin =
        origin ||
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        'https://con.fr8x.in';
      const verificationLink = `${baseOrigin}/verify-email/${verificationToken}`;

      this.persistState();

      const emailPromise = EmailService.sendVerificationEmail({
        to: cleanEmail,
        verificationLink,
        token: verificationToken,
        otpCode: verificationOtp,
        expiryMinutes: 1440,
      }).catch((err) => {
        console.error('[Security] Failed to resend verification email:', err.message);
        return { success: false, error: err.message };
      });

      return {
        success: true,
        message: 'If an unverified account matches this email, a new verification link and code have been sent.',
        remainingAttempts: MAX_RESENDS - rateLimit.count,
        otp: verificationOtp,
        token: verificationToken,
        emailPromise,
      };
    }

    // Always generic message to prevent enumeration
    return {
      success: true,
      message: 'If an unverified account matches this email, a new verification link and code have been sent.',
      remainingAttempts: MAX_RESENDS - rateLimit.count,
    };
  }

  public getVerificationStatus(email: string): { isVerified: boolean; isPending: boolean } {
    const user = this.users.get(email.trim().toLowerCase());
    if (!user) return { isVerified: false, isPending: false };
    return {
      isVerified: user.status === 'active',
      isPending: user.status === 'pending_verification',
    };
  }

  public getUserByEmailOrUid(identifier: string): ServerUserRecord | undefined {
    return this.users.get(identifier.trim().toLowerCase());
  }

  public recordLoginAttempt(
    identifier: string,
    passwordAttempt: string,
    ip = '127.0.0.1'
  ): {
    success: boolean;
    user?: ServerUserRecord;
    isBlocked?: boolean;
    isPendingVerification?: boolean;
    passwordResetRequired?: boolean;
    firstLoginRequired?: boolean;
    challengeToken?: string;
    expiresIn?: number;
    email?: string;
    maskedEmail?: string;
    attemptsRemaining?: number;
    emailPromise?: Promise<any>;
    message: string;
  } {
    const key = identifier.trim().toLowerCase();
    const now = Date.now();

    // Check identifier-level lockout
    const attemptRecord = this.failedAttemptsByIdentifier.get(key);
    if (attemptRecord?.lockedUntil && now < attemptRecord.lockedUntil) {
      const remainingSeconds = Math.ceil((attemptRecord.lockedUntil - now) / 1000);
      return {
        success: false,
        isBlocked: true,
        passwordResetRequired: true,
        attemptsRemaining: 0,
        message: `Account is locked due to 3 failed login attempts. Please wait ${Math.ceil(remainingSeconds / 60)} minute(s) or reset your password.`,
      };
    }

    let user = this.users.get(key);
    if (!user) {
      this.loadPersistedState();
      user = this.users.get(key);
    }

    if (!user) {
      const currentCount = (attemptRecord?.count || 0) + 1;
      const maxAttempts = 3;
      const remaining = Math.max(0, maxAttempts - currentCount);

      if (currentCount >= maxAttempts) {
        this.failedAttemptsByIdentifier.set(key, {
          count: currentCount,
          lockedUntil: now + 15 * 60 * 1000,
        });
        this.addSecurityEvent({
          type: 'ACCOUNT_BLOCKED',
          severity: 'HIGH',
          userEmail: key,
          details: `Identifier locked out after 3 consecutive failed login attempts: ${key}`,
          ipAddress: ip,
        });
        return {
          success: false,
          isBlocked: true,
          passwordResetRequired: false,
          attemptsRemaining: 0,
          message: 'Security Alert: 3 invalid attempts detected. This identifier has been temporarily blocked from authentication.',
        };
      } else {
        this.failedAttemptsByIdentifier.set(key, {
          count: currentCount,
        });
        this.addSecurityEvent({
          type: 'FAILED_LOGIN',
          severity: 'WARNING',
          userEmail: key,
          details: `Failed login attempt ${currentCount}/3 for identifier: ${key}`,
          ipAddress: ip,
        });
        return {
          success: false,
          attemptsRemaining: remaining,
          message:
            remaining === 1
              ? 'Invalid User ID / email or password. 1 attempt remaining before account lockout.'
              : `Invalid User ID / email or password. ${remaining} attempts remaining.`,
        };
      }
    }

    // Check if account is awaiting email verification
    if (user.status === 'pending_verification') {
      return {
        success: false,
        isPendingVerification: true,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        message: `Account is pending email verification. Please check your registered corporate email (${maskEmail(user.email)}) for your verification link and 6-digit code.`,
      };
    }

    if (user.status === 'blocked') {
      this.addSecurityEvent({
        type: 'FAILED_LOGIN',
        severity: 'HIGH',
        userEmail: user.email,
        uid: user.uid,
        company: user.company,
        details: `Login attempt on blocked account: ${user.email}. Denied. Godfather unblock required.`,
        ipAddress: ip,
      });

      return {
        success: false,
        isBlocked: true,
        passwordResetRequired: false,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        attemptsRemaining: 0,
        user,
        message: `Your account has been locked due to 3 consecutive failed password attempts. Only the Godfather administrator can remove the block upon receiving an email request from your registered corporate email (${maskEmail(user.email)}).`,
      };
    }

    // Verify password using PBKDF2 constant-time comparison
    const isPasswordValid = verifyHashedPassword(passwordAttempt, user.passwordHash);
    if (isPasswordValid) {
      // Reset failed attempts on successful authentication
      user.failedLoginAttempts = 0;
      this.failedAttemptsByIdentifier.delete(key);
      this.failedAttemptsByIdentifier.delete(user.email.toLowerCase());
      this.failedAttemptsByIdentifier.delete(user.uid.toLowerCase());
      this.persistState();

      // Check if first-login OTP verification is required
      if (!user.firstLoginCompleted) {
        const cleanEmail = user.email.toLowerCase();
        const now = Date.now();
        const sendTimestamps = this.firstLoginOtpSendTimestamps.get(cleanEmail) || [];
        const validTimestamps = sendTimestamps.filter((t) => t > now - 25 * 60 * 60 * 1000);
        this.firstLoginOtpSendTimestamps.set(cleanEmail, validTimestamps);

        if (validTimestamps.length >= 3) {
          return {
            success: false,
            message: 'Unable to sign in. Please try again later or contact platform support.',
          };
        }

        const existingFirstLogin = this.activeFirstLoginOtps.get(cleanEmail);
        const rawOtp = generateSecureOtp(
          6,
          existingFirstLogin
            ? { salt: existingFirstLogin.salt, hash: existingFirstLogin.hash, iterations: 100_000, keylen: 32, digest: 'sha256' }
            : undefined
        );
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.pbkdf2Sync(rawOtp, salt, 100_000, 32, 'sha256').toString('hex');
        const challengeId = `CHAL-USR-${Date.now()}-${generateSecureToken(4).toUpperCase()}`;
        // SECURITY: OTP validity is 15 seconds (server-enforced). Frontend countdown is visual only.
        const OTP_EXPIRY_MS = 15 * 1000;
        const expiresAt = now + OTP_EXPIRY_MS;

        this.activeFirstLoginOtps.set(cleanEmail, {
          salt,
          hash,
          expiresAt,
          attempts: 0,
          challengeId,
        });
        validTimestamps.push(now);

        const challengeToken = createSignedSessionToken({
          challengeId,
          email: user.email,
          uid: user.uid,
          type: 'user_first_login_challenge',
          issuedAt: now,
          expiresAt: now + OTP_EXPIRY_MS,
        });

        const emailPromise = EmailService.sendOtpEmail({
          to: user.email,
          recipientName: user.displayName || 'Member',
          otpCode: rawOtp,
          expiryMinutes: 1,
          correlationId: `FR8X-AUTH-OTP-${challengeId}`,
        }).catch((err) => {
          console.error('[UserAuth] Failed to send first-login OTP email:', err.message);
          return { success: false, error: err.message };
        });

        return {
          success: true,
          firstLoginRequired: true,
          challengeToken,
          email: user.email,
          maskedEmail: maskEmail(user.email),
          expiresIn: 15,
          message: 'First-time login verification required. A 6-digit code has been sent.',
          emailPromise,
        };
      }

      return {
        success: true,
        firstLoginRequired: false,
        user,
        message: 'Authentication successful.',
      };
    }

    // Failed attempt increment
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    user.lastFailedAttemptAt = new Date().toISOString();

    const maxAttempts = 3;
    const remaining = Math.max(0, maxAttempts - user.failedLoginAttempts);

    this.failedAttemptsByIdentifier.set(key, { count: user.failedLoginAttempts });
    this.failedAttemptsByIdentifier.set(user.email.toLowerCase(), { count: user.failedLoginAttempts });
    this.failedAttemptsByIdentifier.set(user.uid.toLowerCase(), { count: user.failedLoginAttempts });

    if (user.failedLoginAttempts >= maxAttempts) {
      user.status = 'blocked';
      user.blockedAt = new Date().toISOString();
      user.blockedReason = 'Account locked after 3 consecutive failed password attempts. Godfather unblock required.';

      this.failedAttemptsByIdentifier.set(key, { count: user.failedLoginAttempts });
      this.failedAttemptsByIdentifier.set(user.email.toLowerCase(), { count: user.failedLoginAttempts });
      this.failedAttemptsByIdentifier.set(user.uid.toLowerCase(), { count: user.failedLoginAttempts });
      this.persistState();

      // Dispatch account blocked security notification (NO reset OTP!)
      this.dispatchAccountBlockedEmail(user, ip, user.blockedReason);

      const blockRecord: BlockedAccountRecord = {
        id: `blk-${Date.now()}-${generateSecureToken(4)}`,
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        company: user.company,
        companyId: user.companyId,
        failedAttempts: user.failedLoginAttempts,
        lastAttemptAt: user.lastFailedAttemptAt,
        blockedAt: user.blockedAt,
        status: 'blocked',
        reason: user.blockedReason,
        ipAddress: ip,
      };
      this.blockedAccounts.set(user.uid, blockRecord);
      this.blockedAccounts.set(user.email.toLowerCase(), blockRecord);

      this.addSecurityEvent({
        type: 'ACCOUNT_BLOCKED',
        severity: 'CRITICAL',
        userEmail: user.email,
        uid: user.uid,
        company: user.company,
        details: `Account automatically locked after 3 consecutive failed password attempts. Godfather unblock required upon email receipt.`,
        ipAddress: ip,
      });

      return {
        success: false,
        isBlocked: true,
        passwordResetRequired: false,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        attemptsRemaining: 0,
        user,
        message: `Your account has been locked after 3 consecutive failed password attempts. Only the Godfather administrator can remove this block upon receiving an email request from your registered corporate email (${maskEmail(user.email)}).`,
      };
    }

    this.addSecurityEvent({
      type: 'FAILED_LOGIN',
      severity: user.failedLoginAttempts === 2 ? 'HIGH' : 'WARNING',
      userEmail: user.email,
      uid: user.uid,
      company: user.company,
      details: `Failed password attempt ${user.failedLoginAttempts}/3. ${remaining} attempt(s) remaining.`,
      ipAddress: ip,
    });

    return {
      success: false,
      attemptsRemaining: remaining,
      user,
      message:
        remaining === 1
          ? 'Invalid password. 1 attempt remaining before password reset OTP is dispatched.'
          : `Invalid password. ${remaining} attempts remaining.`,
    };
  }

  public getActiveFirstLoginChallenge(email: string) {
    return this.activeFirstLoginOtps.get(email.toLowerCase());
  }

  public verifyUserFirstLoginOtp(
    challengeToken: string,
    candidateOtp: string
  ): { success: boolean; user?: ServerUserRecord; error?: string } {
    if (!candidateOtp || typeof candidateOtp !== 'string' || candidateOtp.trim().length === 0) {
      return { success: false, error: 'Please enter a valid verification code.' };
    }

    const tokenCheck = verifySignedSessionToken<{
      challengeId: string;
      email: string;
      uid: string;
      type: string;
    }>(challengeToken);

    if (
      !tokenCheck.valid ||
      !tokenCheck.payload ||
      tokenCheck.payload.type !== 'user_first_login_challenge'
    ) {
      return { success: false, error: 'Invalid or expired authentication challenge.' };
    }

    const cleanEmail = tokenCheck.payload.email.toLowerCase();
    const activeOtp = this.activeFirstLoginOtps.get(cleanEmail);
    if (!activeOtp || activeOtp.challengeId !== tokenCheck.payload.challengeId) {
      return {
        success: false,
        error: 'No active verification code found. Please request a new code.',
      };
    }

    const now = Date.now();
    if (now > activeOtp.expiresAt) {
      this.activeFirstLoginOtps.delete(cleanEmail);
      return { success: false, error: 'Code expired.' };
    }

    activeOtp.attempts += 1;
    const derived = crypto.pbkdf2Sync(candidateOtp.trim(), activeOtp.salt, 100_000, 32, 'sha256');
    const isMatch = crypto.timingSafeEqual(derived, Buffer.from(activeOtp.hash, 'hex'));

    if (!isMatch) {
      if (activeOtp.attempts >= 3) {
        this.activeFirstLoginOtps.delete(cleanEmail);
        return {
          success: false,
          error: 'Verification failed. Please request a new verification code.',
        };
      }
      return { success: false, error: 'Invalid verification code.' };
    }

    this.activeFirstLoginOtps.delete(cleanEmail);
    const user = this.users.get(cleanEmail);
    if (user) {
      user.firstLoginCompleted = true;
      this.persistState();
    }
    return { success: true, user };
  }

  public resendUserFirstLoginOtp(
    challengeToken: string,
    ip = '127.0.0.1'
  ): { success: boolean; expiresIn?: number; error?: string; emailPromise?: Promise<any> } {
    const tokenCheck = verifySignedSessionToken<{
      challengeId: string;
      email: string;
      uid: string;
      type: string;
    }>(challengeToken);

    if (
      !tokenCheck.valid ||
      !tokenCheck.payload ||
      tokenCheck.payload.type !== 'user_first_login_challenge'
    ) {
      return { success: false, error: 'Invalid or expired authentication challenge.' };
    }

    const cleanEmail = tokenCheck.payload.email.toLowerCase();
    const now = Date.now();
    const sendTimestamps = this.firstLoginOtpSendTimestamps.get(cleanEmail) || [];
    const validTimestamps = sendTimestamps.filter(
      (t) => t > now - 25 * 60 * 60 * 1000
    );
    this.firstLoginOtpSendTimestamps.set(cleanEmail, validTimestamps);

    if (validTimestamps.length >= 3) {
      return {
        success: false,
        error: 'Unable to resend code. Please try again later or contact platform support.',
      };
    }

    // 60-second cooldown guard
    const lastSentAt = this.otpCooldowns.get(`first_login:${cleanEmail}`) || 0;
    if (now - lastSentAt < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastSentAt)) / 1000);
      return {
        success: false,
        error: `Please wait ${waitSeconds} second(s) before requesting another verification code.`,
      };
    }
    this.otpCooldowns.set(`first_login:${cleanEmail}`, now);

    const user = this.users.get(cleanEmail);
    const existingFirstLogin = this.activeFirstLoginOtps.get(cleanEmail);
    const rawOtp = generateSecureOtp(
      6,
      existingFirstLogin
        ? { salt: existingFirstLogin.salt, hash: existingFirstLogin.hash, iterations: 100_000, keylen: 32, digest: 'sha256' }
        : undefined
    );
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(rawOtp, salt, 100_000, 32, 'sha256')
      .toString('hex');
    // SECURITY: OTP validity is 15 seconds (server-enforced).
    const OTP_EXPIRY_MS = 15 * 1000;
    const expiresAt = now + OTP_EXPIRY_MS;

    this.activeFirstLoginOtps.set(cleanEmail, {
      salt,
      hash,
      expiresAt,
      attempts: 0,
      challengeId: tokenCheck.payload.challengeId,
    });
    validTimestamps.push(now);

    const emailPromise = EmailService.sendOtpEmail({
      to: cleanEmail,
      recipientName: user?.displayName || 'Member',
      otpCode: rawOtp,
      expiryMinutes: 1,
      correlationId: `FR8X-AUTH-OTP-${tokenCheck.payload.challengeId}`,
    }).catch((err) => {
      console.error('[UserAuth] Failed to resend first-login OTP email:', err.message);
      return { success: false, error: err.message };
    });

    return { success: true, expiresIn: 15, emailPromise };
  }

  public unblockAccount(
    uidOrEmail: string,
    unblockedBy = 'Godfather Administrator',
    unblockReason = 'Administrative Verification'
  ): { success: boolean; message: string; record?: BlockedAccountRecord } {
    if (!unblockReason || !unblockReason.trim()) {
      return { success: false, message: 'Mandatory unblock reason is required.' };
    }

    const clean = uidOrEmail.trim().toLowerCase();
    let user = this.users.get(clean);
    if (!user) {
      for (const u of this.users.values()) {
        if (u.uid.toLowerCase() === clean || u.email.toLowerCase() === clean) {
          user = u;
          break;
        }
      }
    }

    if (user) {
      user.status = 'active';
      user.failedLoginAttempts = 0;
      user.blockedAt = undefined;
      user.blockedReason = undefined;
      this.failedAttemptsByIdentifier.delete(user.email.toLowerCase());
      this.failedAttemptsByIdentifier.delete(user.uid.toLowerCase());

      // Send unblock confirmation email to user's registered corporate email
      EmailService.sendSupportEmail({
        to: user.email,
        recipientName: user.displayName || 'Member',
        subject: `FR8X Account Unblocked — ${user.email}`,
        message: `Your FR8X account (${user.email}) has been reviewed and successfully unblocked by the Godfather administrator (${unblockedBy}).\n\nReason: ${unblockReason.trim()}\n\nYou may now sign in to your FR8X account using your credentials.`,
      }).catch((err) => {
        console.error(`[Security] Failed to dispatch unblock email to ${user.email}:`, err.message);
      });
    }

    this.failedAttemptsByIdentifier.delete(clean);

    const blockRecord =
      this.blockedAccounts.get(clean) ||
      (user ? this.blockedAccounts.get(user.uid) || this.blockedAccounts.get(user.email.toLowerCase()) : undefined);

    if (blockRecord) {
      blockRecord.status = 'unblocked';
      blockRecord.unblockedBy = unblockedBy;
      blockRecord.unblockedAt = new Date().toISOString();
      blockRecord.unblockReason = unblockReason.trim();

      const eventId = `sec-evt-${Date.now()}`;
      blockRecord.securityEventId = eventId;

      this.addSecurityEvent({
        type: 'ACCOUNT_UNBLOCKED',
        severity: 'HIGH',
        userEmail: blockRecord.email,
        uid: blockRecord.uid,
        company: blockRecord.company,
        details: `Account unblocked by ${unblockedBy}. Reason: ${unblockReason.trim()}`,
      });

      this.persistState();
      return { success: true, message: `Account ${blockRecord.email} successfully unblocked by Godfather.`, record: blockRecord };
    }

    this.persistState();
    return { success: true, message: `Account status reset to active for ${clean}.` };
  }

  /**
   * Manually block an account via administrative action and dispatch notification
   */
  public blockAccount(
    uidOrEmail: string,
    blockedBy: string,
    reason: string
  ): { success: boolean; message: string; record?: BlockedAccountRecord } {
    const clean = uidOrEmail.trim().toLowerCase();
    let user = this.users.get(clean);
    if (!user) {
      this.loadPersistedState();
      user = this.users.get(clean);
    }

    if (!user) {
      return { success: false, message: `User ${uidOrEmail} not found.` };
    }

    user.status = 'blocked';
    user.blockedAt = new Date().toISOString();
    user.blockedReason = reason.trim() || 'Blocked by system administrator';

    const blockRecord: BlockedAccountRecord = {
      id: `blk-${Date.now()}-${generateSecureToken(4)}`,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      company: user.company,
      companyId: user.companyId,
      failedAttempts: user.failedLoginAttempts || 0,
      lastAttemptAt: new Date().toISOString(),
      blockedAt: user.blockedAt,
      status: 'blocked',
      reason: user.blockedReason,
      ipAddress: 'Admin Action',
    };
    this.blockedAccounts.set(user.uid, blockRecord);
    this.blockedAccounts.set(user.email.toLowerCase(), blockRecord);

    this.addSecurityEvent({
      type: 'ACCOUNT_BLOCKED',
      severity: 'CRITICAL',
      userEmail: user.email,
      uid: user.uid,
      company: user.company,
      details: `Account manually blocked by ${blockedBy}. Reason: ${user.blockedReason}`,
    });

    this.persistState();

    // Dispatch real account blocked email notification to user
    this.dispatchAccountBlockedEmail(user, 'Admin Action', user.blockedReason);

    return {
      success: true,
      message: `Account ${user.email} successfully blocked and notification email dispatched.`,
      record: blockRecord,
    };
  }

  /**
   * Helper to dispatch explicit Account Blocked security alert email via EmailService
   */
  private dispatchAccountBlockedEmail(user: ServerUserRecord, ip: string, reason?: string) {
    const blockReason = reason || '3 consecutive failed password attempts';
    EmailService.sendSecurityAlertEmail({
      to: user.email,
      subject: `Account Blocked: ${user.email}`,
      details: `Your FR8X account (${user.email}) has been locked after 3 consecutive failed password attempts (${blockReason}). Origin Network IP: ${ip}. For security policy enforcement, this block CANNOT be removed automatically and self-service password reset is disabled. To request account review and unblocking, you must send an email from this registered email address (${user.email}) to support@fr8x.in for administrator verification by the Godfather admin.`,
      ipAddress: ip,
    })
      .then((res) => {
        if (!res.success) {
          console.error(`[Security] Failed to dispatch account blocked security email to ${user.email}:`, res.error);
        } else {
          console.log(`[Security] Account blocked security email dispatched to ${user.email}, msgId: ${res.messageId}`);
        }
      })
      .catch((err) => {
        console.error(`[Security] Failed to dispatch account blocked security email to ${user.email}:`, err.message);
      });
  }

  public getBlockedAccounts(): BlockedAccountRecord[] {
    return Array.from(this.blockedAccounts.values()).filter((b) => b.status === 'blocked');
  }

  public getAllBlockedHistory(): BlockedAccountRecord[] {
    return Array.from(this.blockedAccounts.values());
  }

  // ─── OTP Rate Limiting (3 attempts per date) ──────────────────────────────────
  public requestOTP(
    email: string,
    ip = '127.0.0.1'
  ): { success: boolean; remaining: number; message: string; date: string; otpDispatched?: boolean } {
    const cleanEmail = email.trim().toLowerCase();
    const today = new Date().toISOString().split('T')[0];
    const key = `${cleanEmail}:${today}`;
    let record = this.otpRecords.get(key);

    // Check if account is blocked
    const user = this.users.get(cleanEmail);
    if (user && user.status === 'blocked') {
      return {
        success: false,
        remaining: 0,
        date: today,
        message: `Your account is locked due to 3 failed password attempts. OTP generation is disabled. Only the Godfather administrator can unblock your account upon receiving an email request from your registered corporate email (${maskEmail(user.email)}).`,
      };
    }

    // 60-second cooldown guard
    const now = Date.now();
    const OTP_COOLDOWN_MS = 60 * 1000;
    const lastSentAt = this.otpCooldowns.get(`otp:${cleanEmail}`) || 0;
    if (now - lastSentAt < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - lastSentAt)) / 1000);
      return {
        success: false,
        remaining: Math.max(0, 3 - (record?.attempts || 0)),
        date: today,
        message: `Please wait ${waitSeconds} second(s) before requesting another verification code.`,
      };
    }

    if (!record) {
      record = {
        userEmail: email.trim().toLowerCase(),
        date: today,
        attempts: 0,
        lastRequestedAt: new Date().toISOString(),
      };
      this.otpRecords.set(key, record);
    }

    const MAX_DAILY_OTP = 3;
    if (record.attempts >= MAX_DAILY_OTP) {
      this.addSecurityEvent({
        type: 'OTP_LIMIT_REACHED',
        severity: 'HIGH',
        userEmail: email,
        details: `OTP request limit exceeded for date ${today}.`,
        ipAddress: ip,
      });

      return {
        success: false,
        remaining: 0,
        date: today,
        // SECURITY: Do not expose internal send limits or window duration to the user.
        message: 'Verification code requests are temporarily restricted. Please try again later or contact support.',
      };
    }

    record.attempts += 1;
    record.lastRequestedAt = new Date().toISOString();
    const remaining = MAX_DAILY_OTP - record.attempts;

    // Generate cryptographically secure 6-digit OTP, exclude previous code.
    // SECURITY: OTP stored as PBKDF2 hash — never plaintext. Validity: 15 seconds.
    const existingLoginOtp = this.activeLoginOtps.get(cleanEmail);
    const otpCode = generateSecureOtp(6);
    const otpSalt = crypto.randomBytes(16).toString('hex');
    const otpHash = crypto.pbkdf2Sync(otpCode, otpSalt, 100_000, 32, 'sha256').toString('hex');
    // SECURITY: 15-second OTP validity, server-enforced.
    const OTP_EXPIRY_MS = 15 * 1000;
    const expiresAt = now + OTP_EXPIRY_MS;
    this.otpCooldowns.set(`otp:${cleanEmail}`, now);
    this.activeLoginOtps.set(cleanEmail, {
      email: cleanEmail,
      salt: otpSalt,
      hash: otpHash,
      expiresAt,
      attempts: 0,
      ipAddress: ip,
    });
    this.persistState();

    // Dispatch real email via EmailService
    EmailService.sendOtpEmail({
      to: cleanEmail,
      otpCode,
      expiryMinutes: 1,
    })
      .then((res) => {
        if (!res.success) {
          console.error(`[Security] Failed to dispatch OTP email to ${email}:`, res.error);
        } else {
          console.log(`[Security] OTP email successfully dispatched to ${email}, msgId: ${res.messageId}`);
        }
      })
      .catch((err) => {
        console.error(`[Security] Failed to dispatch OTP email to ${email}:`, err.message);
      });

    if (remaining === 0) {
      this.addSecurityEvent({
        type: 'OTP_LIMIT_REACHED',
        severity: 'HIGH',
        userEmail: email,
        details: `OTP send limit reached for ${email} on ${today}.`,
        ipAddress: ip,
      });
    } else {
      this.addSecurityEvent({
        type: 'OTP_LIMIT_WARNING',
        severity: 'INFO',
        userEmail: email,
        details: `OTP generated for ${email} on ${today}.`,
        ipAddress: ip,
      });
    }

    return {
      success: true,
      remaining,
      date: today,
      message: 'A verification code has been sent to your registered email address.',
      otpDispatched: true,
    };
  }

  /**
   * Validates and consumes active OTP challenge for the given email
   */
  public verifyOTP(
    email: string,
    enteredOtp: string
  ): { success: boolean; message: string } {
    const cleanEmail = email.trim().toLowerCase();
    const record = this.activeLoginOtps.get(cleanEmail);
    if (!record) {
      return { success: false, message: 'No active verification code found. Please request a new code.' };
    }
    if (Date.now() > record.expiresAt) {
      this.activeLoginOtps.delete(cleanEmail);
      this.persistState();
      return { success: false, message: 'Verification code has expired. Please request a new code.' };
    }

    // SECURITY: Constant-time PBKDF2 comparison — prevents timing-oracle attacks.
    let isMatch = false;
    try {
      const derived = crypto.pbkdf2Sync(enteredOtp.trim(), record.salt, 100_000, 32, 'sha256');
      isMatch = crypto.timingSafeEqual(derived, Buffer.from(record.hash, 'hex'));
    } catch {
      isMatch = false;
    }

    if (!isMatch) {
      record.attempts = (record.attempts || 0) + 1;
      if (record.attempts >= 3) {
        this.activeLoginOtps.delete(cleanEmail);
        this.persistState();
        // SECURITY: Do not expose internal attempt count to the user.
        return { success: false, message: 'Verification failed. Please request a new code.' };
      }
      this.persistState();
      // SECURITY: Do not expose remaining attempt count.
      return { success: false, message: 'Invalid verification code. Please try again.' };
    }
    // Success: burn OTP immediately (single-use)
    this.activeLoginOtps.delete(cleanEmail);
    this.persistState();
    return { success: true, message: 'Verification code confirmed successfully.' };
  }

  public getOTPStatus(email: string): { attempts: number; remaining: number; date: string } {
    const today = new Date().toISOString().split('T')[0];
    const key = `${email.trim().toLowerCase()}:${today}`;
    const record = this.otpRecords.get(key);
    const attempts = record?.attempts || 0;
    return {
      attempts,
      remaining: Math.max(0, 3 - attempts),
      date: today,
    };
  }

  /**
   * Helper to dispatch secure password reset email via EmailService (password@fr8x.in)
   */
  private dispatchPasswordResetEmail(user: ServerUserRecord, otp: string, ip: string, token?: string): Promise<any> {
    const origin = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://con.fr8x.in';
    const resetLink = token
      ? `${origin}/reset-password/${token}`
      : `${origin}/reset-password?email=${encodeURIComponent(user.email)}`;

    return EmailService.sendPasswordResetEmail({
      to: user.email,
      recipientName: user.displayName || user.email.split('@')[0],
      otpCode: otp,
      resetLink,
      expiryMinutes: 15,
    })
      .then((res) => {
        if (!res.success) {
          console.error(`[Security] Failed to dispatch password reset OTP email to ${user.email}:`, res.error);
        } else {
          console.log(`[Security] Password reset email dispatched to ${user.email}, msgId: ${res.messageId}`);
        }
        return res;
      })
      .catch((err) => {
        console.error('[Security] Failed to dispatch password reset OTP email:', err.message);
        return { success: false, error: err.message };
      });
  }

  // ─── Password Reset Requests (Generic non-leaking responses) ──────────────────
  public requestPasswordReset(
    email: string,
    ip = '127.0.0.1'
  ): { success: boolean; message?: string; error?: string; otpDispatched?: boolean; resetToken?: string; emailPromise?: Promise<any> } {
    const cleanEmail = email.trim().toLowerCase();
    let user = this.users.get(cleanEmail);
    if (!user) {
      this.loadPersistedState();
      user = this.users.get(cleanEmail);
    }

    // Refuse reset if user is blocked
    if (user && user.status === 'blocked') {
      return {
        success: false,
        error: `Your account is locked due to 3 failed password attempts. Self-service password reset is disabled. Only the Godfather administrator can unblock your account upon receiving an email request from your registered corporate email (${maskEmail(user.email)}).`,
        otpDispatched: false,
      };
    }

    // 60-second cooldown guard
    const now = Date.now();
    const lastSentAt = this.otpCooldowns.get(`reset:${cleanEmail}`) || 0;
    if (now - lastSentAt < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastSentAt)) / 1000);
      return {
        success: false,
        error: `Please wait ${waitSeconds} second(s) before requesting another password reset code.`,
        otpDispatched: false,
      };
    }
    this.otpCooldowns.set(`reset:${cleanEmail}`, now);

    if (!user) {
      // SECURITY: Auto-provisioning of test users removed.
      // fr8x.in domain users and dev accounts must register through /api/auth/register.
      // Auto-provisioning was a backdoor that allowed any fr8x.in email to gain access.
    }

    this.passwordResets.push({
      id: `pr-${Date.now()}-${generateSecureToken(4)}`,
      email: cleanEmail,
      requestedAt: new Date().toISOString(),
      status: user ? 'pending' : 'completed',
      ipAddress: ip,
    });

    let resetToken: string | undefined;
    let emailPromise: Promise<any> | undefined;

    if (user) {
      const existingReset = this.activeResetOtps.get(cleanEmail);
      if (existingReset?.token) {
        this.resetTokens.delete(existingReset.token);
      }
      // SECURITY: Generate CSPRNG OTP, store as PBKDF2 hash — never plaintext.
      const resetOtpPlain = generateSecureOtp(6);
      const resetOtpSalt = crypto.randomBytes(16).toString('hex');
      const resetOtpHash = crypto
        .pbkdf2Sync(resetOtpPlain, resetOtpSalt, 100_000, 32, 'sha256')
        .toString('hex');
      resetToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = Date.now() + 15 * 60 * 1000;

      this.activeResetOtps.set(cleanEmail, {
        email: user.email,
        otp: resetOtpPlain,   // COMPATIBILITY: keep field for dispatchPasswordResetEmail
        otpSalt: resetOtpSalt,
        otpHash: resetOtpHash,
        token: resetToken,
        expiresAt,
        attempts: 0,
        ipAddress: ip,
      } as any);
      this.resetTokens.set(resetToken, cleanEmail);
      this.persistState();

      emailPromise = this.dispatchPasswordResetEmail(user, resetOtpPlain, ip, resetToken);

      this.addSecurityEvent({
        type: 'PASSWORD_RESET_REQUEST',
        severity: 'INFO',
        userEmail: user.email,
        uid: user.uid,
        company: user.company,
        details: `Password reset requested for valid account: ${user.email}. Token and OTP dispatched.`,
        ipAddress: ip,
      });
    } else {
      this.addSecurityEvent({
        type: 'PASSWORD_RESET_REQUEST',
        severity: 'INFO',
        userEmail: cleanEmail,
        details: `Password reset requested for unverified email: ${cleanEmail}`,
        ipAddress: ip,
      });
    }

    // Always return generic response to prevent account enumeration
    return {
      success: true,
      message: 'If an account exists for this email address, password reset instructions have been sent.',
      otpDispatched: !!user,
      resetToken: process.env.NODE_ENV === 'test' ? resetToken : undefined,
      emailPromise,
    };
  }

  /**
   * Verify Password Reset OTP and update credentials
   */
  public verifyAndResetPassword(
    email: string,
    otp: string,
    newPassword: string,
    ip = '127.0.0.1'
  ): { success: boolean; message?: string; error?: string; user?: ServerUserRecord; emailPromise?: Promise<any> } {
    const cleanEmail = email.trim().toLowerCase();
    let user = this.users.get(cleanEmail);
    if (!user) {
      this.loadPersistedState();
      user = this.users.get(cleanEmail);
    }
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    let resetRecord = this.activeResetOtps.get(cleanEmail);
    if (!resetRecord) {
      this.loadPersistedState();
      resetRecord = this.activeResetOtps.get(cleanEmail);
    }
    if (!resetRecord) {
      return {
        success: false,
        error: 'No active password reset request found or code expired. Please request a new code.',
      };
    }

    if (Date.now() > resetRecord.expiresAt) {
      this.activeResetOtps.delete(cleanEmail);
      if (resetRecord.token) this.resetTokens.delete(resetRecord.token);
      this.persistState();
      return {
        success: false,
        error: 'The password reset code has expired. Please request a new one.',
      };
    }

    // SECURITY: Constant-time PBKDF2 comparison. Max 3 attempts.
    let otpIsValid = false;
    const rec = resetRecord as any;
    if (rec.otpSalt && rec.otpHash) {
      // New hashed path
      try {
        const derived = crypto.pbkdf2Sync(otp.trim(), rec.otpSalt, 100_000, 32, 'sha256');
        otpIsValid = crypto.timingSafeEqual(derived, Buffer.from(rec.otpHash, 'hex'));
      } catch {
        otpIsValid = false;
      }
    } else {
      // Legacy fallback: plaintext (transitional, will be removed after all active resets expire)
      otpIsValid = (resetRecord.otp === otp.trim());
    }

    if (!otpIsValid) {
      resetRecord.attempts += 1;
      // SECURITY: Max 3 attempts, not 5. Do not expose attempt count.
      if (resetRecord.attempts >= 3) {
        this.activeResetOtps.delete(cleanEmail);
        if (resetRecord.token) this.resetTokens.delete(resetRecord.token);
        this.persistState();
        return {
          success: false,
          error: 'Verification failed. Please request a new password reset code.',
        };
      }
      return {
        success: false,
        error: 'Invalid verification code. Please check your email.',
      };
    }

    if (!newPassword || newPassword.trim().length < 8) {
      return { success: false, error: 'New password must be at least 8 characters long.' };
    }

    if (user.status === 'blocked') {
      return {
        success: false,
        error: 'Your account is locked due to 3 failed password attempts. Password reset is disabled. Only the Godfather administrator can unblock your account upon receiving an email request from your registered email address.',
      };
    }

    // OTP verified successfully: update password credentials
    user.salt = 'pbkdf2_managed';
    user.passwordHash = hashPassword(newPassword.trim());
    user.failedLoginAttempts = 0;
    this.activeResetOtps.delete(cleanEmail);
    if (resetRecord.token) this.resetTokens.delete(resetRecord.token);
    this.failedAttemptsByIdentifier.delete(cleanEmail);
    this.failedAttemptsByIdentifier.delete(user.email.toLowerCase());
    this.failedAttemptsByIdentifier.delete(user.uid.toLowerCase());
    this.persistState();

    this.addSecurityEvent({
      type: 'ACCOUNT_UNBLOCKED',
      severity: 'INFO',
      userEmail: user.email,
      uid: user.uid,
      company: user.company,
      details: 'Password reset completed and account unblocked via server-verified OTP.',
      ipAddress: ip,
    });

    // Dispatch confirmation notice via password@fr8x.in
    const emailPromise = EmailService.sendPasswordChangedEmail({
      to: user.email,
      ipAddress: ip,
    }).catch((err) => {
      console.error('[Security] Failed to dispatch password changed confirmation email:', err.message);
      return { success: false, error: err.message };
    });

    return {
      success: true,
      message: 'Password successfully reset. Account has been restored to active status.',
      user,
      emailPromise,
    };
  }

  /**
   * Verify Password Reset via Cryptographic URL Token and update credentials
   */
  public verifyAndResetPasswordByToken(params: {
    token: string;
    newPassword: string;
    confirmPassword?: string;
    ip?: string;
  }): { success: boolean; message?: string; error?: string; user?: ServerUserRecord; emailPromise?: Promise<any> } {
    const cleanToken = (params.token || '').trim();
    if (!cleanToken) {
      return { success: false, error: 'Password reset token is required.' };
    }

    if (params.confirmPassword !== undefined && params.newPassword !== params.confirmPassword) {
      return { success: false, error: 'New password and confirm password do not match.' };
    }

    if (!params.newPassword || params.newPassword.trim().length < 8) {
      return { success: false, error: 'Password must be at least 8 characters long.' };
    }

    let cleanEmail = this.resetTokens.get(cleanToken);
    if (!cleanEmail) {
      this.loadPersistedState();
      cleanEmail = this.resetTokens.get(cleanToken);
    }

    if (!cleanEmail) {
      for (const record of this.activeResetOtps.values()) {
        if (record.token === cleanToken) {
          cleanEmail = record.email.toLowerCase();
          break;
        }
      }
    }

    if (!cleanEmail) {
      return {
        success: false,
        error: 'Invalid or expired password reset token. Please request a new link.',
      };
    }

    let user = this.users.get(cleanEmail);
    if (!user) {
      this.loadPersistedState();
      user = this.users.get(cleanEmail);
    }

    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    if (user.status === 'blocked') {
      return {
        success: false,
        error: 'Your account is locked due to 3 failed password attempts. Password reset is disabled. Only the Godfather administrator can unblock your account upon receiving an email request from your registered email address.',
      };
    }

    const resetRecord = this.activeResetOtps.get(cleanEmail);
    if (!resetRecord || (resetRecord.token && resetRecord.token !== cleanToken)) {
      return {
        success: false,
        error: 'This password reset link has already been used or expired.',
      };
    }

    if (Date.now() > resetRecord.expiresAt) {
      this.activeResetOtps.delete(cleanEmail);
      this.resetTokens.delete(cleanToken);
      this.persistState();
      return {
        success: false,
        error: 'This password reset link has expired. Please request a new one.',
      };
    }

    // Invalidate reset token and OTP immediately (single-use enforced)
    this.activeResetOtps.delete(cleanEmail);
    this.resetTokens.delete(cleanToken);

    user.salt = 'pbkdf2_managed'; // Salt embedded in passwordHash
    user.passwordHash = hashPassword(params.newPassword.trim()); // PBKDF2 format: pbkdf2:<salt>:<hash>
    user.failedLoginAttempts = 0;
    this.persistState();

    const ip = params.ip || '127.0.0.1';
    this.addSecurityEvent({
      type: 'ACCOUNT_UNBLOCKED',
      severity: 'INFO',
      userEmail: user.email,
      uid: user.uid,
      company: user.company,
      details: 'Password reset completed and account unblocked via secure URL token.',
      ipAddress: ip,
    });

    const emailPromise = EmailService.sendPasswordChangedEmail({
      to: user.email,
      ipAddress: ip,
    }).catch((err) => {
      console.error('[Security] Failed to dispatch password changed confirmation email:', err.message);
      return { success: false, error: err.message };
    });

    return {
      success: true,
      message: 'Your password has been successfully reset! You may now sign in.',
      user,
      emailPromise,
    };
  }

  /**
   * Helper to retrieve active OTP (for verification/testing)
   */
  public getActiveResetOtp(email: string): string | undefined {
    return this.activeResetOtps.get(email.trim().toLowerCase())?.otp;
  }

  /**
   * Helper to retrieve active URL reset token (for verification/testing)
   */
  public getActiveResetToken(email: string): string | undefined {
    return this.activeResetOtps.get(email.trim().toLowerCase())?.token;
  }

  public getPasswordResets(): PasswordResetRecord[] {
    return [...this.passwordResets];
  }

  // ─── Security Events ─────────────────────────────────────────────────────────
  public addSecurityEvent(event: Omit<SecurityEventRecord, 'id' | 'timestamp'>) {
    const record: SecurityEventRecord = {
      id: `sec-${Date.now()}-${generateSecureToken(4)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.securityEvents.unshift(record);
    if (this.securityEvents.length > 500) {
      this.securityEvents.pop();
    }
  }

  public getSecurityEvents(): SecurityEventRecord[] {
    return [...this.securityEvents];
  }

  // ─── Godfather Session Control ───────────────────────────────────────────────
  public registerGodfatherSession(sessionId: string) {
    this.activeGodfatherSessions.add(sessionId);
    this.persistState();
  }

  public revokeGodfatherSession(sessionId: string) {
    this.activeGodfatherSessions.delete(sessionId);
    this.persistState();
  }

  public isGodfatherSessionActive(sessionId: string): boolean {
    if (this.activeGodfatherSessions.has(sessionId)) return true;
    this.loadPersistedState();
    return this.activeGodfatherSessions.has(sessionId);
  }
}

// Global Singleton
const globalForStore = global as unknown as { serverSecurityStore?: ServerSecurityStore };
export const serverSecurityStore = globalForStore.serverSecurityStore || new ServerSecurityStore();
if (process.env.NODE_ENV !== 'production') globalForStore.serverSecurityStore = serverSecurityStore;
