import fs from 'fs';
import path from 'path';

const authStorePath = path.resolve('lib/server-auth-store.ts');
let content = fs.readFileSync(authStorePath, 'utf8');

console.log('--- Updating lib/server-auth-store.ts for Strict 3-attempt Lockout & OTP Cooldown ---');

// 1. Add otpCooldowns map
if (!content.includes('private otpCooldowns: Map<string, number>')) {
  content = content.replace(
    'private failedAttemptsByIdentifier: Map<string, { count: number; lockedUntil?: number }> = new Map();',
    `private failedAttemptsByIdentifier: Map<string, { count: number; lockedUntil?: number }> = new Map();\n  private otpCooldowns: Map<string, number> = new Map();`
  );
  console.log('[1] Added otpCooldowns map');
}

// 2. Update recordLoginAttempt when user.status === 'blocked'
const oldBlockedLoginCheck = `    if (user.status === 'blocked') {
      this.addSecurityEvent({
        type: 'FAILED_LOGIN',
        severity: 'HIGH',
        userEmail: user.email,
        uid: user.uid,
        company: user.company,
        details: \`Login attempt on blocked account: \${user.email}\`,
        ipAddress: ip,
      });

      // Ensure active password reset OTP exists or send fresh OTP with rotated digits
      let activeOtp = this.activeResetOtps.get(user.email.toLowerCase());
      if (!activeOtp || Date.now() > activeOtp.expiresAt) {
        const resetOtp = generateSecureOtp(6, activeOtp?.otp);
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
        message: \`Account is locked due to 3 failed login attempts. A password reset OTP has been sent from the server to your registered email (\${maskEmail(user.email)}).\`,
      };
    }`;

const newBlockedLoginCheck = `    if (user.status === 'blocked') {
      this.addSecurityEvent({
        type: 'FAILED_LOGIN',
        severity: 'HIGH',
        userEmail: user.email,
        uid: user.uid,
        company: user.company,
        details: \`Login attempt on blocked account: \${user.email}. Denied. Godfather unblock required.\`,
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
        message: \`Your account has been locked due to 3 consecutive failed password attempts. Only the Godfather administrator can remove the block upon receiving an email request from your registered corporate email (\${maskEmail(user.email)}).\`,
      };
    }`;

if (content.includes(oldBlockedLoginCheck)) {
  content = content.replace(oldBlockedLoginCheck, newBlockedLoginCheck);
  console.log('[2] Updated blocked account check in recordLoginAttempt (no repeated OTPs!)');
} else {
  console.log('[2] Warning: oldBlockedLoginCheck pattern not matched directly');
}

// 3. Update lockout trigger on 3 failed attempts
const oldLockoutTrigger = `    if (user.failedLoginAttempts >= maxAttempts) {
      user.status = 'blocked';
      user.blockedAt = new Date().toISOString();
      user.blockedReason = 'Maximum failed password attempts exceeded (3/3). Password reset OTP dispatched.';

      this.failedAttemptsByIdentifier.set(key, { count: user.failedLoginAttempts, lockedUntil: now + 15 * 60 * 1000 });
      this.failedAttemptsByIdentifier.set(user.email.toLowerCase(), { count: user.failedLoginAttempts, lockedUntil: now + 15 * 60 * 1000 });
      this.failedAttemptsByIdentifier.set(user.uid.toLowerCase(), { count: user.failedLoginAttempts, lockedUntil: now + 15 * 60 * 1000 });
      this.persistState();

      // Generate cryptographically secure 6-digit Password Reset OTP
      const existingReset = this.activeResetOtps.get(user.email.toLowerCase());
      const resetOtp = generateSecureOtp(6, existingReset?.otp);
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
      this.dispatchAccountBlockedEmail(user, ip, user.blockedReason);

      const blockRecord: BlockedAccountRecord = {
        id: \`blk-\${Date.now()}-\${generateSecureToken(4)}\`,
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
        details: \`Account automatically locked after 3 consecutive failed password attempts. Password reset OTP sent to \${user.email}.\`,
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
        message: \`Security Alert: 3 invalid attempts detected. A password reset OTP has been sent from the server to your registered email (\${maskEmail(user.email)}).\`,
      };
    }`;

const newLockoutTrigger = `    if (user.failedLoginAttempts >= maxAttempts) {
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
        id: \`blk-\${Date.now()}-\${generateSecureToken(4)}\`,
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
        details: \`Account automatically locked after 3 consecutive failed password attempts. Godfather unblock required upon email receipt.\`,
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
        message: \`Your account has been locked after 3 consecutive failed password attempts. Only the Godfather administrator can remove this block upon receiving an email request from your registered corporate email (\${maskEmail(user.email)}).\`,
      };
    }`;

if (content.includes(oldLockoutTrigger)) {
  content = content.replace(oldLockoutTrigger, newLockoutTrigger);
  console.log('[3] Updated 3-failed-attempts lockout trigger (permanent block until Godfather unblocks)');
} else {
  console.log('[3] Warning: oldLockoutTrigger pattern not matched directly');
}

// 4. Update dispatchAccountBlockedEmail message
const oldDispatchAccountBlocked = `    const blockReason = reason || '3 consecutive failed password attempts';
    EmailService.sendSecurityAlertEmail({
      to: user.email,
      subject: \`Account Blocked: \${user.email}\`,
      details: \`Your FR8X account (\${user.email}) has been locked due to security policy enforcement: \${blockReason}. Origin Network IP: \${ip}. A separate password reset recovery email has been sent containing your single-use recovery code. If you did not initiate these actions, contact FR8X Team at password@fr8x.in immediately.\`,
      ipAddress: ip,
    })`;

const newDispatchAccountBlocked = `    const blockReason = reason || '3 consecutive failed password attempts';
    EmailService.sendSecurityAlertEmail({
      to: user.email,
      subject: \`Account Blocked: \${user.email}\`,
      details: \`Your FR8X account (\${user.email}) has been locked after 3 consecutive failed password attempts (\${blockReason}). Origin Network IP: \${ip}. For security policy enforcement, this block CANNOT be removed automatically and self-service password reset is disabled. To request account review and unblocking, you must send an email from this registered email address (\${user.email}) to support@fr8x.in for administrator verification by the Godfather admin.\`,
      ipAddress: ip,
    })`;

if (content.includes(oldDispatchAccountBlocked)) {
  content = content.replace(oldDispatchAccountBlocked, newDispatchAccountBlocked);
  console.log('[4] Updated dispatchAccountBlockedEmail notification message');
} else {
  console.log('[4] Warning: oldDispatchAccountBlocked pattern not matched directly');
}

// 5. Update unblockAccount
const oldUnblockAccount = `  public unblockAccount(
    uid: string,
    unblockedBy = 'SYSTEM',
    unblockReason = 'Administrative Verification'
  ): { success: boolean; message: string; record?: BlockedAccountRecord } {
    if (!unblockReason || !unblockReason.trim()) {
      return { success: false, message: 'Mandatory unblock reason is required.' };
    }

    const clean = uid.toLowerCase();
    const user = this.users.get(clean);
    if (user) {
      user.status = 'active';
      user.failedLoginAttempts = 0;
      user.blockedAt = undefined;
      user.blockedReason = undefined;
      this.failedAttemptsByIdentifier.delete(user.email.toLowerCase());
      this.failedAttemptsByIdentifier.delete(user.uid.toLowerCase());
    }
    this.failedAttemptsByIdentifier.delete(clean);

    const blockRecord = this.blockedAccounts.get(clean) || this.blockedAccounts.get(user?.uid || '');
    if (blockRecord) {
      blockRecord.status = 'unblocked';
      blockRecord.unblockedBy = unblockedBy;
      blockRecord.unblockedAt = new Date().toISOString();
      blockRecord.unblockReason = unblockReason.trim();

      const eventId = \`sec-evt-\${Date.now()}\`;
      blockRecord.securityEventId = eventId;

      this.addSecurityEvent({
        type: 'ACCOUNT_UNBLOCKED',
        severity: 'HIGH',
        userEmail: blockRecord.email,
        uid: blockRecord.uid,
        company: blockRecord.company,
        details: \`Account unblocked by \${unblockedBy}. Reason: \${unblockReason.trim()}\`,
      });

      this.persistState();
      return { success: true, message: 'Account successfully unblocked.', record: blockRecord };
    }

    this.persistState();
    return { success: true, message: 'Account status reset to active.' };
  }`;

const newUnblockAccount = `  public unblockAccount(
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
        subject: \`FR8X Account Unblocked — \${user.email}\`,
        message: \`Your FR8X account (\${user.email}) has been reviewed and successfully unblocked by the Godfather administrator (\${unblockedBy}).\\n\\nReason: \${unblockReason.trim()}\\n\\nYou may now sign in to your FR8X account using your credentials.\`,
      }).catch((err) => {
        console.error(\`[Security] Failed to dispatch unblock email to \${user.email}:\`, err.message);
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

      const eventId = \`sec-evt-\${Date.now()}\`;
      blockRecord.securityEventId = eventId;

      this.addSecurityEvent({
        type: 'ACCOUNT_UNBLOCKED',
        severity: 'HIGH',
        userEmail: blockRecord.email,
        uid: blockRecord.uid,
        company: blockRecord.company,
        details: \`Account unblocked by \${unblockedBy}. Reason: \${unblockReason.trim()}\`,
      });

      this.persistState();
      return { success: true, message: \`Account \${blockRecord.email} successfully unblocked by Godfather.\`, record: blockRecord };
    }

    this.persistState();
    return { success: true, message: \`Account status reset to active for \${clean}.\` };
  }`;

if (content.includes(oldUnblockAccount)) {
  content = content.replace(oldUnblockAccount, newUnblockAccount);
  console.log('[5] Updated unblockAccount implementation');
} else {
  console.log('[5] Warning: oldUnblockAccount pattern not matched directly');
}

// 6. Update requestOTP for blocked user check and 60-second cooldown
const oldRequestOTPStart = `  public requestOTP(
    email: string,
    ip = '127.0.0.1'
  ): { success: boolean; remaining: number; message: string; date: string; otpDispatched?: boolean } {
    const today = new Date().toISOString().split('T')[0];
    const key = \`\${email.trim().toLowerCase()}:\${today}\`;
    let record = this.otpRecords.get(key);`;

const newRequestOTPStart = `  public requestOTP(
    email: string,
    ip = '127.0.0.1'
  ): { success: boolean; remaining: number; message: string; date: string; otpDispatched?: boolean } {
    const cleanEmail = email.trim().toLowerCase();
    const today = new Date().toISOString().split('T')[0];
    const key = \`\${cleanEmail}:\${today}\`;
    let record = this.otpRecords.get(key);

    // Check if account is blocked
    const user = this.users.get(cleanEmail);
    if (user && user.status === 'blocked') {
      return {
        success: false,
        remaining: 0,
        date: today,
        message: \`Your account is locked due to 3 failed password attempts. OTP generation is disabled. Only the Godfather administrator can unblock your account upon receiving an email request from your registered corporate email (\${maskEmail(user.email)}).\`,
      };
    }

    // 60-second cooldown guard
    const now = Date.now();
    const OTP_COOLDOWN_MS = 60 * 1000;
    const lastSentAt = this.otpCooldowns.get(\`otp:\${cleanEmail}\`) || 0;
    if (now - lastSentAt < OTP_COOLDOWN_MS) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_MS - (now - lastSentAt)) / 1000);
      return {
        success: false,
        remaining: Math.max(0, 3 - (record?.attempts || 0)),
        date: today,
        message: \`Please wait \${waitSeconds} second(s) before requesting another verification code.\`,
      };
    }`;

if (content.includes(oldRequestOTPStart)) {
  content = content.replace(oldRequestOTPStart, newRequestOTPStart);
  // Also record timestamp
  content = content.replace(
    'this.activeLoginOtps.set(email.trim().toLowerCase(), {',
    'this.otpCooldowns.set(`otp:${cleanEmail}`, now);\n    this.activeLoginOtps.set(email.trim().toLowerCase(), {'
  );
  console.log('[6] Updated requestOTP with blocked check & 60-second cooldown');
} else {
  console.log('[6] Warning: oldRequestOTPStart pattern not matched directly');
}

// 7. Update resendEmailVerification with 60-second cooldown
const oldResendLimitCheck = `    const MAX_RESENDS = 3;
    if (rateLimit.count >= MAX_RESENDS) {
      return {
        success: false,
        message: 'Resend limit reached (max 3 per hour). Please try again later or check your spam folder.',
        remainingAttempts: 0,
      };
    }`;

const newResendLimitCheck = `    const MAX_RESENDS = 3;
    if (rateLimit.count >= MAX_RESENDS) {
      return {
        success: false,
        message: 'Resend limit reached (max 3 per hour). Please try again later or check your spam folder.',
        remainingAttempts: 0,
      };
    }

    // 60-second cooldown guard
    const lastSentAt = this.otpCooldowns.get(\`verify:\${cleanEmail}\`) || 0;
    if (now - lastSentAt < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastSentAt)) / 1000);
      return {
        success: false,
        message: \`Please wait \${waitSeconds} second(s) before requesting another verification code.\`,
        remainingAttempts: Math.max(0, MAX_RESENDS - rateLimit.count),
      };
    }
    this.otpCooldowns.set(\`verify:\${cleanEmail}\`, now);`;

if (content.includes(oldResendLimitCheck)) {
  content = content.replace(oldResendLimitCheck, newResendLimitCheck);
  console.log('[7] Added 60-second cooldown to resendEmailVerification');
} else {
  console.log('[7] Warning: oldResendLimitCheck pattern not matched directly');
}

// 8. Update resendUserFirstLoginOtp with 60-second cooldown
const oldFirstLoginSendLimit = `    if (validTimestamps.length >= 3) {
      return {
        success: false,
        error: 'Unable to resend code. Please try again later or contact platform support.',
      };
    }`;

const newFirstLoginSendLimit = `    if (validTimestamps.length >= 3) {
      return {
        success: false,
        error: 'Unable to resend code. Please try again later or contact platform support.',
      };
    }

    // 60-second cooldown guard
    const lastSentAt = this.otpCooldowns.get(\`first_login:\${cleanEmail}\`) || 0;
    if (now - lastSentAt < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastSentAt)) / 1000);
      return {
        success: false,
        error: \`Please wait \${waitSeconds} second(s) before requesting another verification code.\`,
      };
    }
    this.otpCooldowns.set(\`first_login:\${cleanEmail}\`, now);`;

if (content.includes(oldFirstLoginSendLimit)) {
  content = content.replace(oldFirstLoginSendLimit, newFirstLoginSendLimit);
  console.log('[8] Added 60-second cooldown to resendUserFirstLoginOtp');
} else {
  console.log('[8] Warning: oldFirstLoginSendLimit pattern not matched directly');
}

// 9. Update requestPasswordReset for blocked account and cooldown
const oldRequestResetStart = `    const cleanEmail = email.trim().toLowerCase();
    let user = this.users.get(cleanEmail);
    if (!user) {
      this.loadPersistedState();
      user = this.users.get(cleanEmail);
    }

    let resetToken: string | undefined;`;

const newRequestResetStart = `    const cleanEmail = email.trim().toLowerCase();
    let user = this.users.get(cleanEmail);
    if (!user) {
      this.loadPersistedState();
      user = this.users.get(cleanEmail);
    }

    // Refuse reset if user is blocked
    if (user && user.status === 'blocked') {
      return {
        success: false,
        error: \`Your account is locked due to 3 failed password attempts. Self-service password reset is disabled. Only the Godfather administrator can unblock your account upon receiving an email request from your registered corporate email (\${maskEmail(user.email)}).\`,
        otpDispatched: false,
      };
    }

    // 60-second cooldown guard
    const now = Date.now();
    const lastSentAt = this.otpCooldowns.get(\`reset:\${cleanEmail}\`) || 0;
    if (now - lastSentAt < 60 * 1000) {
      const waitSeconds = Math.ceil((60 * 1000 - (now - lastSentAt)) / 1000);
      return {
        success: false,
        error: \`Please wait \${waitSeconds} second(s) before requesting another password reset code.\`,
        otpDispatched: false,
      };
    }
    this.otpCooldowns.set(\`reset:\${cleanEmail}\`, now);

    let resetToken: string | undefined;`;

if (content.includes(oldRequestResetStart)) {
  content = content.replace(oldRequestResetStart, newRequestResetStart);
  console.log('[9] Added blocked refusal & 60-second cooldown to requestPasswordReset');
} else {
  console.log('[9] Warning: oldRequestResetStart pattern not matched directly');
}

// 10. Update verifyAndResetPassword to reject blocked users and not unblock them
const oldVerifyResetBlockedCheck = `    // OTP verified successfully: update password with PBKDF2, reset attempts, unlock account
    user.salt = 'pbkdf2_managed'; // Salt embedded in passwordHash
    user.passwordHash = hashPassword(newPassword.trim()); // PBKDF2 format: pbkdf2:<salt>:<hash>
    user.status = 'active';
    user.failedLoginAttempts = 0;
    user.blockedAt = undefined;
    user.blockedReason = undefined;

    this.blockedAccounts.delete(user.uid);`;

const newVerifyResetBlockedCheck = `    if (user.status === 'blocked') {
      return {
        success: false,
        error: 'Your account is locked due to 3 failed password attempts. Password reset is disabled. Only the Godfather administrator can unblock your account upon receiving an email request from your registered email address.',
      };
    }

    // OTP verified successfully: update password credentials
    user.salt = 'pbkdf2_managed';
    user.passwordHash = hashPassword(newPassword.trim());
    user.failedLoginAttempts = 0;`;

if (content.includes(oldVerifyResetBlockedCheck)) {
  content = content.replace(oldVerifyResetBlockedCheck, newVerifyResetBlockedCheck);
  console.log('[10] Updated verifyAndResetPassword to block self-unblocking');
} else {
  console.log('[10] Warning: oldVerifyResetBlockedCheck pattern not matched directly');
}

fs.writeFileSync(authStorePath, content, 'utf8');
console.log('Finished updating lib/server-auth-store.ts');
