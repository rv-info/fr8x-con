import {
  hashPassword,
  verifyPassword,
  generateSecureOtp,
  createSignedSessionToken,
  verifySignedSessionToken,
} from '@/lib/crypto';
import { EmailService } from '@/lib/email-service';
import crypto from 'crypto';

export interface OperatorCredential {
  email: string;
  salt: string;
  hash: string;
  updatedAt: string;
}

// Default authorized operator email address
export const DEFAULT_GODFATHER_OPERATOR_EMAIL = 'tech@fr8x.in';

// In-memory dynamic credential store
let dynamicOperatorCredential: OperatorCredential | null = null;

// ─── First-Time Login & Lockout State ───────────────────────────────────────
const MAX_PASSWORD_ATTEMPTS = 3;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes
const OTP_VALIDITY_SECONDS = 15; // Strictly 15 seconds validity
const MAX_OTP_SENDS_IN_WINDOW = 3; // Maximum 3 sends
const OTP_SECURITY_WINDOW_MS = 25 * 60 * 60 * 1000; // 25-hour window

interface OperatorSecurityState {
  failedPasswordAttempts: number;
  lockedUntil?: number;
  firstLoginCompleted: boolean;
  activeFirstLoginOtp?: {
    salt: string;
    hash: string;
    expiresAt: number; // timestamp in ms (now + 15s)
    attempts: number;
    challengeId: string;
  };
  otpSendTimestamps: number[]; // rolling 25-hour timestamps
}

const operatorSecurityState: OperatorSecurityState = {
  failedPasswordAttempts: 0,
  firstLoginCompleted: false, // First login verification required
  otpSendTimestamps: [],
};

/**
 * Returns the active authorized operator email.
 */
export function getAuthorizedOperatorEmail(): string {
  return (
    process.env.GODFATHER_OPERATOR_EMAIL?.trim().toLowerCase() ||
    dynamicOperatorCredential?.email ||
    DEFAULT_GODFATHER_OPERATOR_EMAIL
  );
}

/**
 * Validates candidate password using multi-layer verification:
 * 1. Runtime-updated credentials (from recent password reset)
 * 2. Environment variables GODFATHER_OPERATOR_PASSWORD_HASH & SALT (if set)
 */
export function verifyOperatorPassword(candidatePassword: string): boolean {
  if (!candidatePassword || typeof candidatePassword !== 'string') return false;

  // 1. Dynamic credential check (from authorized password reset)
  if (dynamicOperatorCredential) {
    try {
      if (verifyPassword(candidatePassword, dynamicOperatorCredential.salt, dynamicOperatorCredential.hash)) {
        return true;
      }
    } catch {
      // continue
    }
  }

  // 2. Server Environment variable check (production secure store)
  const envSalt = process.env.GODFATHER_OPERATOR_PASSWORD_SALT?.trim();
  const envHash = process.env.GODFATHER_OPERATOR_PASSWORD_HASH?.trim();
  if (envSalt && envHash) {
    try {
      if (verifyPassword(candidatePassword, envSalt, envHash)) {
        return true;
      }
    } catch {
      // continue
    }
  }

  return false;
}

/**
 * Helper to hash OTP with PBKDF2
 */
function hashOtp(otp: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.pbkdf2Sync(otp, salt, 100_000, 32, 'sha256');
  return { salt, hash: derived.toString('hex') };
}

function verifyOtpHash(candidateOtp: string, salt: string, expectedHash: string): boolean {
  try {
    const derived = crypto.pbkdf2Sync(candidateOtp, salt, 100_000, 32, 'sha256');
    return crypto.timingSafeEqual(derived, Buffer.from(expectedHash, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Clean up expired timestamps from the 25-hour window
 */
function cleanExpiredOtpSendTimestamps(): void {
  const cutoff = Date.now() - OTP_SECURITY_WINDOW_MS;
  operatorSecurityState.otpSendTimestamps = operatorSecurityState.otpSendTimestamps.filter(
    (t) => t > cutoff
  );
}

/**
 * Validates operator login attempt with strict 3-attempt lockout and first-login OTP challenge.
 * Supports:
 * - authenticateOperatorCredentials(email, password, ip)
 * - authenticateOperatorCredentials(password, ip)
 */
export async function authenticateOperatorCredentials(
  emailOrPassword: string,
  passwordOrIp?: string,
  clientIp = '127.0.0.1'
): Promise<{
  success: boolean;
  isLocked?: boolean;
  firstLoginRequired?: boolean;
  challengeToken?: string;
  expiresIn?: number;
  error?: string;
}> {
  let email = getAuthorizedOperatorEmail();
  let password = emailOrPassword;
  let ip = clientIp;

  if (passwordOrIp !== undefined && (emailOrPassword.includes('@') || passwordOrIp.length > 0 && !passwordOrIp.includes('.'))) {
    email = emailOrPassword;
    password = passwordOrIp;
  } else if (passwordOrIp !== undefined) {
    ip = passwordOrIp;
  }

  const now = Date.now();

  // Check account lockout
  if (operatorSecurityState.lockedUntil && operatorSecurityState.lockedUntil > now) {
    return {
      success: false,
      isLocked: true,
      error:
        'Sign-in is temporarily unavailable. Please try again later or use the available account recovery option.',
    };
  }

  // Anti-enumeration email check
  const normEmail = email.trim().toLowerCase();
  const authorizedEmail = getAuthorizedOperatorEmail().toLowerCase();
  if (normEmail !== authorizedEmail) {
    return {
      success: false,
      error: 'Unable to sign in. Please check your credentials.',
    };
  }

  // Verify candidate password
  const isValid = verifyOperatorPassword(password);
  if (!isValid) {
    operatorSecurityState.failedPasswordAttempts += 1;
    if (operatorSecurityState.failedPasswordAttempts >= MAX_PASSWORD_ATTEMPTS) {
      operatorSecurityState.lockedUntil = now + LOCKOUT_DURATION_MS;
      return {
        success: false,
        isLocked: true,
        error:
          'Sign-in is temporarily unavailable. Please try again later or use the available account recovery option.',
      };
    }
    return {
      success: false,
      error: 'Unable to sign in. Please check your credentials.',
    };
  }

  // Password correct: reset failed attempts
  operatorSecurityState.failedPasswordAttempts = 0;
  operatorSecurityState.lockedUntil = undefined;

  // Check if first-login verification is required
  if (!operatorSecurityState.firstLoginCompleted) {
    cleanExpiredOtpSendTimestamps();

    if (operatorSecurityState.otpSendTimestamps.length >= MAX_OTP_SENDS_IN_WINDOW) {
      return {
        success: false,
        error: 'Unable to complete sign in. Please try again later or contact platform support.',
      };
    }

    // Generate secure 6-digit OTP
    const rawOtp = generateSecureOtp(6);
    const { salt, hash } = hashOtp(rawOtp);
    const challengeId = `CHAL-GF-${Date.now()}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const expiresAt = now + OTP_VALIDITY_SECONDS * 1000;

    operatorSecurityState.activeFirstLoginOtp = {
      salt,
      hash,
      expiresAt,
      attempts: 0,
      challengeId,
    };
    operatorSecurityState.otpSendTimestamps.push(now);

    const challengeToken = createSignedSessionToken({
      challengeId,
      email: getAuthorizedOperatorEmail(),
      type: 'godfather_first_login_challenge',
      issuedAt: now,
      expiresAt: now + 5 * 60 * 1000,
    });

    // Send OTP email using existing ZeptoMail template FR8X_SECURITY_OTP from password@fr8x.in
    EmailService.sendOtpEmail({
      to: getAuthorizedOperatorEmail(),
      recipientName: 'Chief Administrator',
      otpCode: rawOtp,
      expiryMinutes: 1, // 15 seconds display
      correlationId: `FR8X-AUTH-OTP-${challengeId}`,
    }).catch((err) => {
      console.error('[GodfatherOperator] Failed to send first-login OTP email:', err.message);
    });

    return {
      success: true,
      firstLoginRequired: true,
      challengeToken,
      expiresIn: OTP_VALIDITY_SECONDS,
    };
  }

  // Existing verified operator: direct session
  return {
    success: true,
    firstLoginRequired: false,
  };
}

/**
 * Verifies first-login OTP challenge
 */
export function verifyOperatorFirstLoginOtp(
  challengeToken: string,
  candidateOtp: string
): { success: boolean; error?: string } {
  const tokenCheck = verifySignedSessionToken<{
    challengeId: string;
    email: string;
    type: string;
  }>(challengeToken);

  if (!tokenCheck.valid || !tokenCheck.payload || tokenCheck.payload.type !== 'godfather_first_login_challenge') {
    return { success: false, error: 'Invalid or expired authentication challenge.' };
  }

  const activeOtp = operatorSecurityState.activeFirstLoginOtp;
  if (!activeOtp || activeOtp.challengeId !== tokenCheck.payload.challengeId) {
    return { success: false, error: 'No active verification code found. Please request a new code.' };
  }

  const now = Date.now();
  if (now > activeOtp.expiresAt) {
    operatorSecurityState.activeFirstLoginOtp = undefined;
    return { success: false, error: 'Code expired.' };
  }

  activeOtp.attempts += 1;
  const isMatch = verifyOtpHash(candidateOtp.trim(), activeOtp.salt, activeOtp.hash);

  if (!isMatch) {
    if (activeOtp.attempts >= 3) {
      operatorSecurityState.activeFirstLoginOtp = undefined;
      return { success: false, error: 'Verification failed. Please request a new verification code.' };
    }
    return { success: false, error: 'Invalid verification code.' };
  }

  // Successful verification: invalidate OTP and mark first-login completed
  operatorSecurityState.activeFirstLoginOtp = undefined;
  operatorSecurityState.firstLoginCompleted = true;
  return { success: true };
}

/**
 * Resends first-login OTP under 25-hour sending policy (max 3 sends)
 */
export async function resendOperatorFirstLoginOtp(
  challengeToken: string,
  ip = '127.0.0.1'
): Promise<{ success: boolean; expiresIn?: number; error?: string }> {
  const tokenCheck = verifySignedSessionToken<{
    challengeId: string;
    email: string;
    type: string;
  }>(challengeToken);

  if (!tokenCheck.valid || !tokenCheck.payload || tokenCheck.payload.type !== 'godfather_first_login_challenge') {
    return { success: false, error: 'Invalid or expired authentication challenge.' };
  }

  cleanExpiredOtpSendTimestamps();
  if (operatorSecurityState.otpSendTimestamps.length >= MAX_OTP_SENDS_IN_WINDOW) {
    return {
      success: false,
      error: 'Unable to resend code. Please try again later or contact platform support.',
    };
  }

  const now = Date.now();
  const rawOtp = generateSecureOtp(6);
  const { salt, hash } = hashOtp(rawOtp);
  const expiresAt = now + OTP_VALIDITY_SECONDS * 1000;

  operatorSecurityState.activeFirstLoginOtp = {
    salt,
    hash,
    expiresAt,
    attempts: 0,
    challengeId: tokenCheck.payload.challengeId,
  };
  operatorSecurityState.otpSendTimestamps.push(now);

  EmailService.sendOtpEmail({
    to: getAuthorizedOperatorEmail(),
    recipientName: 'Chief Administrator',
    otpCode: rawOtp,
    expiryMinutes: 1,
    correlationId: `FR8X-AUTH-OTP-${tokenCheck.payload.challengeId}`,
  }).catch((err) => {
    console.error('[GodfatherOperator] Failed to resend first-login OTP email:', err.message);
  });

  return {
    success: true,
    expiresIn: OTP_VALIDITY_SECONDS,
  };
}

/**
 * Updates operator credentials dynamically (e.g. after password reset)
 */
export function updateOperatorPassword(newPasswordPlaintext: string): { salt: string; hash: string } {
  const { salt, hash } = hashPassword(newPasswordPlaintext);
  dynamicOperatorCredential = {
    email: getAuthorizedOperatorEmail(),
    salt,
    hash,
    updatedAt: new Date().toISOString(),
  };
  // Reset lockouts on password update
  operatorSecurityState.failedPasswordAttempts = 0;
  operatorSecurityState.lockedUntil = undefined;
  return { salt, hash };
}

export function resetOperatorFirstLoginStatus(status = false): void {
  operatorSecurityState.firstLoginCompleted = status;
  operatorSecurityState.failedPasswordAttempts = 0;
  operatorSecurityState.lockedUntil = undefined;
  operatorSecurityState.activeFirstLoginOtp = undefined;
  operatorSecurityState.otpSendTimestamps = [];
}

export const operatorStore = {
  getAuthorizedOperatorEmail,
  verifyOperatorPassword,
  authenticateOperatorCredentials,
  verifyOperatorFirstLoginOtp,
  resendOperatorFirstLoginOtp,
  updateOperatorPassword,
  resetOperatorFirstLoginStatus,
  getSecurityState: () => ({ ...operatorSecurityState }),
  _setSecurityState: (patch: Partial<OperatorSecurityState>) => Object.assign(operatorSecurityState, patch),
};

