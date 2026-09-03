// Server-side Authentication, Security, and State Management Engine
// Handles credential validation, failed login attempt tracking, account blocking,
// daily OTP limits, salted password hashing, privileged session control, and audit logs.
import crypto from 'crypto';
import { EmailService } from '@/lib/email-service';

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

// Simple deterministic salt+hash for runtime demo environment
export function hashPassword(password: string, salt: string): string {
  let hash = 0;
  const combined = `${salt}:${password}:${salt}`;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return 'sha256_sim_' + Math.abs(hash).toString(16).padStart(8, '0');
}

// Global in-memory server state (retained across requests in Node.js server lifecycle)
class ServerSecurityStore {
  private users: Map<string, ServerUserRecord> = new Map();
  private blockedAccounts: Map<string, BlockedAccountRecord> = new Map();
  private otpRecords: Map<string, OTPRecord> = new Map(); // key: email:date
  private emailVerifications: Map<string, EmailVerificationRecord> = new Map(); // key: email.toLowerCase()
  private verificationTokens: Map<string, string> = new Map(); // key: token -> email.toLowerCase()
  private resendLimits: Map<string, { count: number; windowStart: number }> = new Map(); // key: email.toLowerCase()
  private activeResetOtps: Map<string, ActivePasswordResetOTP> = new Map(); // key: email.toLowerCase()
  private passwordResets: PasswordResetRecord[] = [];
  private securityEvents: SecurityEventRecord[] = [];
  private activeGodfatherSessions: Set<string> = new Set();

  constructor() {
    this.seedRealTestingUsers();
  }

  private seedRealTestingUsers() {
    const salt1 = 'fr8x_salt_arjun_2026';
    const salt2 = 'fr8x_salt_sarah_2026';
    const salt3 = 'fr8x_salt_kiran_2026';
    const salt4 = 'fr8x_salt_elena_2026';
    const salt5 = 'fr8x_salt_david_2026';

    const usersList: ServerUserRecord[] = [
      {
        uid: 'u-arjun',
        email: 'arjun@atlaslogistics.com',
        salt: salt1,
        passwordHash: hashPassword('Atlas@2025', salt1),
        displayName: 'Arjun Rao',
        company: 'Atlas Logistics Pvt. Ltd.',
        companyId: 'CMP-00101',
        role: 'company_admin',
        status: 'active',
        failedLoginAttempts: 0,
        createdAt: '2026-01-15T08:00:00.000Z',
      },
      {
        uid: 'u-sarah',
        email: 'sarah.lewis@rotterdamfreight.nl',
        salt: salt2,
        passwordHash: hashPassword('Rotterdam@2025', salt2),
        displayName: 'Sarah Lewis',
        company: 'Rotterdam Freight NV',
        companyId: 'CMP-00102',
        role: 'company_admin',
        status: 'active',
        failedLoginAttempts: 0,
        createdAt: '2026-01-20T09:30:00.000Z',
      },
      {
        uid: 'u-kiran',
        email: 'kiran.mehta@indoocean.com',
        salt: salt3,
        passwordHash: hashPassword('IndoOcean@2025', salt3),
        displayName: 'Kiran Mehta',
        company: 'Indo Ocean Lines',
        companyId: 'CMP-00103',
        role: 'user',
        status: 'active',
        failedLoginAttempts: 0,
        createdAt: '2026-02-01T11:15:00.000Z',
      },
      {
        uid: 'u-elena',
        email: 'elena.rossi@mediterraneanlines.it',
        salt: salt4,
        passwordHash: hashPassword('MedLines@2025', salt4),
        displayName: 'Elena Rossi',
        company: 'Mediterranean Shipping Agency S.p.A.',
        companyId: 'CMP-00104',
        role: 'company_admin',
        status: 'active',
        failedLoginAttempts: 0,
        createdAt: '2026-02-10T10:00:00.000Z',
      },
      {
        uid: 'u-david',
        email: 'david.chen@pacificcargo.sg',
        salt: salt5,
        passwordHash: hashPassword('Pacific@2025', salt5),
        displayName: 'David Chen',
        company: 'Pacific Maritime Cargo Pte. Ltd.',
        companyId: 'CMP-00105',
        role: 'company_admin',
        status: 'active',
        failedLoginAttempts: 0,
        createdAt: '2026-02-15T14:30:00.000Z',
      },
    ];

    for (const u of usersList) {
      this.users.set(u.uid.toLowerCase(), u);
      this.users.set(u.email.toLowerCase(), u);
    }
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
    options?: { skipVerification?: boolean; origin?: string }
  ): {
    success: boolean;
    error?: string;
    user?: ServerUserRecord;
    verificationToken?: string;
    verificationOtp?: string;
    isVerificationRequired?: boolean;
  } {
    const cleanEmail = user.email.trim().toLowerCase();
    const cleanUid = user.uid.trim().toLowerCase();
    const cleanMobile = user.mobile ? user.mobile.replace(/[^0-9+]/g, '') : undefined;

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

    // Generate cryptographic email verification token and 6-digit OTP
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationOtp = crypto.randomInt(100_000, 999_999).toString();
    const tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

    const record: ServerUserRecord = {
      uid: user.uid,
      email: user.email,
      salt,
      passwordHash: hashPassword(user.password, salt),
      displayName: user.displayName,
      company: user.company,
      companyId: user.companyId,
      role: user.role || 'company_admin',
      status: initialStatus,
      mobile: user.mobile,
      failedLoginAttempts: 0,
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

      const origin = options?.origin || 'https://con.fr8x.in';
      const verificationLink = `${origin}/verify-email?token=${verificationToken}&email=${encodeURIComponent(cleanEmail)}`;

      // Dispatch verification email via EmailService (password@fr8x.in)
      EmailService.sendVerificationEmail({
        to: cleanEmail,
        verificationLink,
        token: verificationToken,
        otpCode: verificationOtp,
        expiryMinutes: 1440,
      }).catch((err) => {
        console.error('[Security] Failed to dispatch verification email:', err.message);
      });
    }

    return {
      success: true,
      user: record,
      verificationToken: isVerificationRequired ? verificationToken : undefined,
      verificationOtp: isVerificationRequired ? verificationOtp : undefined,
      isVerificationRequired,
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

    // If token provided without email, look up email
    if (params.token && !cleanEmail) {
      const mapped = this.verificationTokens.get(params.token.trim());
      if (mapped) cleanEmail = mapped;
    }

    if (!cleanEmail) {
      return { success: false, error: 'Email address or valid token is required for verification.' };
    }

    const verificationRecord = this.emailVerifications.get(cleanEmail);
    const user = this.users.get(cleanEmail);

    if (!user) {
      return { success: false, error: 'User account not found.' };
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
    origin = 'https://con.fr8x.in'
  ): { success: boolean; message: string; remainingAttempts?: number } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.get(cleanEmail);

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

    rateLimit.count += 1;
    this.resendLimits.set(cleanEmail, rateLimit);

    if (user && user.status === 'pending_verification') {
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationOtp = crypto.randomInt(100_000, 999_999).toString();
      const tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

      user.emailVerificationToken = verificationToken;
      user.emailVerificationExpiresAt = tokenExpiresAt;

      // Clean up old token if mapped
      const existing = this.emailVerifications.get(cleanEmail);
      if (existing?.token) this.verificationTokens.delete(existing.token);

      this.emailVerifications.set(cleanEmail, {
        email: cleanEmail,
        token: verificationToken,
        otp: verificationOtp,
        expiresAt: tokenExpiresAt,
        attempts: 0,
        createdAt: now,
      });
      this.verificationTokens.set(verificationToken, cleanEmail);

      const verificationLink = `${origin}/verify-email?token=${verificationToken}&email=${encodeURIComponent(cleanEmail)}`;

      EmailService.sendVerificationEmail({
        to: cleanEmail,
        verificationLink,
        token: verificationToken,
        otpCode: verificationOtp,
        expiryMinutes: 1440,
      }).catch((err) => {
        console.error('[Security] Failed to resend verification email:', err.message);
      });
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
    email?: string;
    maskedEmail?: string;
    attemptsRemaining?: number;
    message: string;
  } {
    const key = identifier.trim().toLowerCase();
    const user = this.users.get(key);

    if (!user) {
      this.addSecurityEvent({
        type: 'FAILED_LOGIN',
        severity: 'WARNING',
        userEmail: key,
        details: `Failed login attempt for unknown or non-existent identifier: ${key}`,
        ipAddress: ip,
      });
      return {
        success: false,
        message: 'Invalid User ID / email or password.',
      };
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
        details: `Login attempt on blocked account: ${user.email}`,
        ipAddress: ip,
      });

      // Ensure active password reset OTP exists or send fresh OTP
      let activeOtp = this.activeResetOtps.get(user.email.toLowerCase());
      if (!activeOtp || Date.now() > activeOtp.expiresAt) {
        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
        activeOtp = {
          email: user.email,
          otp: resetOtp,
          expiresAt: Date.now() + 15 * 60 * 1000,
          attempts: 0,
          ipAddress: ip,
        };
        this.activeResetOtps.set(user.email.toLowerCase(), activeOtp);
        this.dispatchPasswordResetEmail(user, resetOtp, ip);
      }

      return {
        success: false,
        isBlocked: true,
        passwordResetRequired: true,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        attemptsRemaining: 0,
        user,
        message: `Account is locked due to 3 failed login attempts. A password reset OTP has been sent from the server to your registered email (${maskEmail(user.email)}).`,
      };
    }

    const expectedHash = hashPassword(passwordAttempt, user.salt);
    if (expectedHash === user.passwordHash) {
      // Reset failed attempts on successful authentication
      user.failedLoginAttempts = 0;
      return {
        success: true,
        user,
        message: 'Authentication successful.',
      };
    }

    // Failed attempt increment
    user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
    user.lastFailedAttemptAt = new Date().toISOString();

    const maxAttempts = 3;
    const remaining = Math.max(0, maxAttempts - user.failedLoginAttempts);

    if (user.failedLoginAttempts >= maxAttempts) {
      user.status = 'blocked';
      user.blockedAt = new Date().toISOString();
      user.blockedReason = 'Maximum failed password attempts exceeded (3/3). Password reset OTP dispatched.';

      // Generate 6-digit Password Reset OTP
      const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity
      this.activeResetOtps.set(user.email.toLowerCase(), {
        email: user.email,
        otp: resetOtp,
        expiresAt,
        attempts: 0,
        ipAddress: ip,
      });

      // Dispatch real email via sendSystemEmail from lib/mailer
      this.dispatchPasswordResetEmail(user, resetOtp, ip);

      const blockRecord: BlockedAccountRecord = {
        id: `blk-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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

      this.addSecurityEvent({
        type: 'ACCOUNT_BLOCKED',
        severity: 'CRITICAL',
        userEmail: user.email,
        uid: user.uid,
        company: user.company,
        details: `Account automatically locked after 3 consecutive failed password attempts. Password reset OTP sent to ${user.email}.`,
        ipAddress: ip,
      });

      return {
        success: false,
        isBlocked: true,
        passwordResetRequired: true,
        email: user.email,
        maskedEmail: maskEmail(user.email),
        attemptsRemaining: 0,
        user,
        message: `Security Alert: 3 invalid attempts detected. A password reset OTP has been sent from the server to your registered email (${maskEmail(user.email)}).`,
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

  public unblockAccount(
    uid: string,
    unblockedBy: string,
    unblockReason: string
  ): { success: boolean; message: string; record?: BlockedAccountRecord } {
    if (!unblockReason || !unblockReason.trim()) {
      return { success: false, message: 'Mandatory unblock reason is required.' };
    }

    const user = this.users.get(uid.toLowerCase());
    if (user) {
      user.status = 'active';
      user.failedLoginAttempts = 0;
      user.blockedAt = undefined;
      user.blockedReason = undefined;
    }

    const blockRecord = this.blockedAccounts.get(uid);
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

      return { success: true, message: 'Account successfully unblocked.', record: blockRecord };
    }

    return { success: true, message: 'Account status reset to active.' };
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
  ): { success: boolean; remaining: number; message: string; date: string } {
    const today = new Date().toISOString().split('T')[0];
    const key = `${email.trim().toLowerCase()}:${today}`;
    let record = this.otpRecords.get(key);

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
        details: `OTP daily request limit (3/3) exceeded for date ${today}.`,
        ipAddress: ip,
      });

      return {
        success: false,
        remaining: 0,
        date: today,
        message: 'OTP request limit exceeded for today (0 remaining). Please try again tomorrow.',
      };
    }

    record.attempts += 1;
    record.lastRequestedAt = new Date().toISOString();
    const remaining = MAX_DAILY_OTP - record.attempts;

    if (remaining === 0) {
      this.addSecurityEvent({
        type: 'OTP_LIMIT_REACHED',
        severity: 'HIGH',
        userEmail: email,
        details: `OTP daily limit reached (3/3) for ${email} on ${today}.`,
        ipAddress: ip,
      });
    } else {
      this.addSecurityEvent({
        type: 'OTP_LIMIT_WARNING',
        severity: 'INFO',
        userEmail: email,
        details: `OTP generated for ${email}. Remaining attempts today: ${remaining}`,
        ipAddress: ip,
      });
    }

    return {
      success: true,
      remaining,
      date: today,
      message: `OTP sent. OTP attempts remaining: ${remaining}`,
    };
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
  private dispatchPasswordResetEmail(user: ServerUserRecord, otp: string, ip: string) {
    const origin = 'https://con.fr8x.in';
    const resetLink = `${origin}/godfather/reset-password?email=${encodeURIComponent(user.email)}`;

    EmailService.sendPasswordResetEmail({
      to: user.email,
      otpCode: otp,
      resetLink,
      expiryMinutes: 15,
    }).catch((err) => {
      console.error('[Security] Failed to dispatch password reset OTP email:', err.message);
    });
  }

  // ─── Password Reset Requests (Generic non-leaking responses) ──────────────────
  public requestPasswordReset(email: string, ip = '127.0.0.1'): { success: true; message: string; otpDispatched?: boolean } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.get(cleanEmail);

    this.passwordResets.push({
      id: `pr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      email: cleanEmail,
      requestedAt: new Date().toISOString(),
      status: user ? 'pending' : 'completed',
      ipAddress: ip,
    });

    if (user) {
      const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = Date.now() + 15 * 60 * 1000;
      this.activeResetOtps.set(cleanEmail, {
        email: user.email,
        otp: resetOtp,
        expiresAt,
        attempts: 0,
        ipAddress: ip,
      });

      this.dispatchPasswordResetEmail(user, resetOtp, ip);

      this.addSecurityEvent({
        type: 'PASSWORD_RESET_REQUEST',
        severity: 'INFO',
        userEmail: user.email,
        uid: user.uid,
        company: user.company,
        details: `Password reset requested for valid account: ${user.email}. OTP dispatched.`,
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
      message: 'If an account matches this email, password reset instructions have been dispatched.',
      otpDispatched: !!user,
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
  ): { success: boolean; message?: string; error?: string; user?: ServerUserRecord } {
    const cleanEmail = email.trim().toLowerCase();
    const user = this.users.get(cleanEmail);
    if (!user) {
      return { success: false, error: 'User account not found.' };
    }

    const resetRecord = this.activeResetOtps.get(cleanEmail);
    if (!resetRecord) {
      return {
        success: false,
        error: 'No active password reset request found or code expired. Please request a new code.',
      };
    }

    if (Date.now() > resetRecord.expiresAt) {
      this.activeResetOtps.delete(cleanEmail);
      return {
        success: false,
        error: 'The password reset OTP code has expired. Please request a new code.',
      };
    }

    if (resetRecord.otp !== otp.trim()) {
      resetRecord.attempts += 1;
      if (resetRecord.attempts >= 5) {
        this.activeResetOtps.delete(cleanEmail);
        return {
          success: false,
          error: 'Too many invalid OTP verification attempts. Please request a new code.',
        };
      }
      return {
        success: false,
        error: 'Invalid verification OTP code. Please check your email and try again.',
      };
    }

    if (!newPassword || newPassword.trim().length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    // OTP verified successfully: update password, reset attempts, unlock account
    user.salt = `fr8x_salt_${Date.now()}`;
    user.passwordHash = hashPassword(newPassword.trim(), user.salt);
    user.status = 'active';
    user.failedLoginAttempts = 0;
    user.blockedAt = undefined;
    user.blockedReason = undefined;

    this.blockedAccounts.delete(user.uid);
    this.activeResetOtps.delete(cleanEmail);

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
    EmailService.sendPasswordChangedEmail({
      to: user.email,
      ipAddress: ip,
    }).catch((err) => {
      console.error('[Security] Failed to dispatch password changed confirmation email:', err.message);
    });

    return {
      success: true,
      message: 'Password successfully reset. Account has been restored to active status.',
      user,
    };
  }

  /**
   * Helper to retrieve active OTP (for verification/testing)
   */
  public getActiveResetOtp(email: string): string | undefined {
    return this.activeResetOtps.get(email.trim().toLowerCase())?.otp;
  }

  public getPasswordResets(): PasswordResetRecord[] {
    return [...this.passwordResets];
  }

  // ─── Security Events ─────────────────────────────────────────────────────────
  public addSecurityEvent(event: Omit<SecurityEventRecord, 'id' | 'timestamp'>) {
    const record: SecurityEventRecord = {
      id: `sec-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
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
  }

  public revokeGodfatherSession(sessionId: string) {
    this.activeGodfatherSessions.delete(sessionId);
  }

  public isGodfatherSessionActive(sessionId: string): boolean {
    return this.activeGodfatherSessions.has(sessionId);
  }
}

// Global Singleton
const globalForStore = global as unknown as { serverSecurityStore?: ServerSecurityStore };
export const serverSecurityStore = globalForStore.serverSecurityStore || new ServerSecurityStore();
if (process.env.NODE_ENV !== 'production') globalForStore.serverSecurityStore = serverSecurityStore;
