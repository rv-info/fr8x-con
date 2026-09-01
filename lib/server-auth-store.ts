// Server-side Authentication, Security, and State Management Engine
// Handles credential validation, failed login attempt tracking, account blocking,
// daily OTP limits, salted password hashing, privileged session control, and audit logs.

export interface ServerUserRecord {
  uid: string;
  email: string;
  passwordHash: string; // SHA-256 / PBKDF2 hashed password
  salt: string;
  displayName: string;
  company: string;
  companyId: string;
  role: 'company_admin' | 'user' | 'billing_admin';
  status: 'active' | 'blocked' | 'suspended';
  failedLoginAttempts: number;
  lastFailedAttemptAt?: string;
  blockedAt?: string;
  blockedReason?: string;
  createdAt: string;
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
    ];

    for (const u of usersList) {
      this.users.set(u.uid.toLowerCase(), u);
      this.users.set(u.email.toLowerCase(), u);
    }
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
      return {
        success: false,
        isBlocked: true,
        user,
        message: 'Account blocked. Contact platform administrator.',
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
      user.blockedReason = 'Maximum failed password attempts exceeded (3/3).';

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
        details: `Account automatically blocked after 3 consecutive failed password attempts.`,
        ipAddress: ip,
      });

      return {
        success: false,
        isBlocked: true,
        attemptsRemaining: 0,
        user,
        message: 'Account blocked. Contact platform administrator.',
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
          ? 'Invalid password. 1 attempt remaining before account block.'
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

  // ─── Password Reset Requests (Generic non-leaking responses) ──────────────────
  public requestPasswordReset(email: string, ip = '127.0.0.1'): { success: true; message: string } {
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
      this.addSecurityEvent({
        type: 'PASSWORD_RESET_REQUEST',
        severity: 'INFO',
        userEmail: user.email,
        uid: user.uid,
        company: user.company,
        details: `Password reset requested for valid account: ${user.email}`,
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
    };
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
