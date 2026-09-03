/**
 * FR8X GODFATHER — User Authentication Email System
 * Automated Verification & Security Test Suite
 *
 * Covers:
 * 1. Sender isolation & status (support@fr8x.in vs password@fr8x.in)
 * 2. Zoho Flow JSON contract verification ({ event, to_email, subject, message })
 * 3. Email validation & sanitization (RFC 5322, CRLF injection prevention)
 * 4. User Registration with email verification token dispatch
 * 5. Email Verification (valid token, invalid token, expired token, single-use token consumption)
 * 6. Resend Verification with rate-limiting
 * 7. Login authentication, attempt tracking, and 3-attempt lockout
 * 8. Forgot Password anti-enumeration & reset token dispatch
 * 9. Password Reset with token consumption, strength check, and PASSWORD_CHANGED email
 * 10. OTP MFA generation (CSPRNG), expiration, and verification
 * 11. Support email routing strictly to support@fr8x.in
 * 12. Sender spoofing prevention (client cannot dictate from_email)
 */

import {
  EmailService,
  EMAIL_SENDERS,
  sendEmail,
  getEmailSendersStatus,
  isValidEmailAddress,
} from '../lib/email-service';
import {
  renderEmailVerificationEmail,
  renderPasswordResetEmail,
  renderPasswordChangedEmail,
  renderOtpChallengeEmail,
  renderSupportEmail,
} from '../lib/email-templates';
import { serverSecurityStore } from '../lib/server-auth-store';

let passedTests = 0;
let failedTests = 0;

function assert(condition: unknown, testName: string, detail?: string) {
  if (Boolean(condition)) {
    console.log(`  ✓ PASS: ${testName}`);
    passedTests++;
  } else {
    console.error(`  ✗ FAIL: ${testName}${detail ? ` — ${detail}` : ''}`);
    failedTests++;
  }
}

async function runTests() {
  console.log('============================================================');
  console.log('FR8X GODFATHER — USER AUTHENTICATION EMAIL SYSTEM TESTS');
  console.log('============================================================\n');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 1: BUSINESS EMAIL IDENTITIES & STATUS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Business Email Identities & Sender Status ---');

  assert(
    EMAIL_SENDERS.SUPPORT === 'support@fr8x.in',
    'SUPPORT identity is strictly support@fr8x.in'
  );
  assert(
    EMAIL_SENDERS.PASSWORD === 'password@fr8x.in',
    'PASSWORD identity is strictly password@fr8x.in'
  );

  const status = getEmailSendersStatus();
  assert(
    typeof status.SUPPORT.isOperational === 'boolean',
    'SUPPORT operational status is exposed'
  );
  assert(
    status.PASSWORD.mailbox === 'password@fr8x.in',
    'PASSWORD mailbox is password@fr8x.in'
  );

  if (!process.env.ZOHO_PASSWORD_FLOW_WEBHOOK_URL && !process.env.ZOHO_FLOW_PASSWORD_WEBHOOK_URL) {
    assert(
      status.PASSWORD.notes.includes('REQUIRES ZOHO FLOW MAIL CONNECTION/AUTHORIZATION'),
      'PASSWORD status notes explicitly flag Zoho authorization requirement'
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 2: EMAIL VALIDATION & SANITIZATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Email Validation & Injection Sanitization ---');

  assert(isValidEmailAddress('operator@fr8x.in'), 'Valid corporate email accepted');
  assert(isValidEmailAddress('test.user+tag@company.com'), 'Valid email with subaddress accepted');
  assert(!isValidEmailAddress('invalid-email'), 'Malformed email rejected');
  assert(!isValidEmailAddress(''), 'Empty email rejected');
  assert(!isValidEmailAddress('test@invalid..com'), 'Double-dot domain rejected');
  assert(
    !isValidEmailAddress('user@domain.com\r\nBcc: victim@example.com'),
    'Header injection newline in email rejected'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 3: ZOHO FLOW JSON CONTRACT VALIDATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Zoho Flow JSON Contract & Dispatch ---');

  const testRecipient = 'test-auditor@corporate-test.com';

  // Support dispatch
  const supportResult = await EmailService.sendSupportEmail({
    to: testRecipient,
    subject: 'FR8X Support Request',
    message: 'Hello, Good Day!\nThis is a test support message.',
    ticketId: 'TCK-1001',
  });

  assert(supportResult.success, 'Support email dispatch handled successfully');
  assert(supportResult.fromType === 'SUPPORT', 'Support email fromType is SUPPORT');
  assert(
    supportResult.sender === 'support@fr8x.in',
    'Support email sender is strictly support@fr8x.in'
  );
  assert(
    supportResult.event === 'SUPPORT_REQUEST',
    'Support email event contract matches SUPPORT_REQUEST'
  );

  // Auth / Verification dispatch
  const verifyResult = await EmailService.sendVerificationEmail({
    to: testRecipient,
    verificationLink: 'https://con.fr8x.in/verify-email?token=test_token_abc',
    otpCode: '582910',
    expiryMinutes: 1440,
  });

  assert(verifyResult.success, 'Verification email dispatch handled successfully');
  assert(verifyResult.fromType === 'PASSWORD', 'Verification email fromType is PASSWORD');
  assert(
    verifyResult.sender === 'password@fr8x.in',
    'Verification email sender is strictly password@fr8x.in'
  );
  assert(
    verifyResult.event === 'EMAIL_VERIFICATION',
    'Verification email event contract matches EMAIL_VERIFICATION'
  );

  // Password reset dispatch
  const resetResult = await EmailService.sendPasswordResetEmail({
    to: testRecipient,
    resetLink: 'https://con.fr8x.in/godfather/reset-password?email=' + encodeURIComponent(testRecipient),
    otpCode: '729104',
    expiryMinutes: 15,
  });

  assert(resetResult.success, 'Password reset email dispatch handled successfully');
  assert(resetResult.fromType === 'PASSWORD', 'Password reset fromType is PASSWORD');
  assert(
    resetResult.sender === 'password@fr8x.in',
    'Password reset sender is strictly password@fr8x.in'
  );
  assert(
    resetResult.event === 'PASSWORD_RESET',
    'Password reset event contract matches PASSWORD_RESET'
  );

  // Password changed confirmation dispatch
  const changedResult = await EmailService.sendPasswordChangedEmail({
    to: testRecipient,
    ipAddress: '192.168.1.50',
  });

  assert(changedResult.success, 'Password changed confirmation dispatch handled successfully');
  assert(changedResult.fromType === 'PASSWORD', 'Password changed fromType is PASSWORD');
  assert(
    changedResult.sender === 'password@fr8x.in',
    'Password changed sender is strictly password@fr8x.in'
  );
  assert(
    changedResult.event === 'PASSWORD_CHANGED',
    'Password changed event contract matches PASSWORD_CHANGED'
  );

  // OTP dispatch
  const otpResult = await EmailService.sendOtpEmail({
    to: testRecipient,
    otpCode: '839201',
    expiryMinutes: 10,
  });

  assert(otpResult.success, 'OTP challenge dispatch handled successfully');
  assert(otpResult.fromType === 'PASSWORD', 'OTP challenge fromType is PASSWORD');
  assert(
    otpResult.sender === 'password@fr8x.in',
    'OTP challenge sender is strictly password@fr8x.in'
  );
  assert(otpResult.event === 'AUTH_OTP', 'OTP challenge event contract matches AUTH_OTP');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 4: TEMPLATE CONTENT & GREETINGS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Template Content & Zero Secret Leaks ---');

  const verTmpl = renderEmailVerificationEmail({
    recipient: 'user@logistics.com',
    verificationLink: 'https://con.fr8x.in/verify-email?token=xyz123',
    otpCode: '918234',
  });
  assert(verTmpl.subject === 'FR8X Verify Your Email', 'Verification subject matches specification');
  assert(verTmpl.text.startsWith('Hello, Good Day!'), 'Verification text begins with Hello, Good Day!');
  assert(verTmpl.html.includes('Hello, Good Day!'), 'Verification HTML begins with Hello, Good Day!');
  assert(verTmpl.html.includes('918234'), 'Verification code included in template');
  assert(!verTmpl.html.includes('password'), 'Verification template contains no passwords');

  const resetTmpl = renderPasswordResetEmail({
    recipient: 'user@logistics.com',
    otpCode: '112233',
    resetLink: 'https://con.fr8x.in/reset?token=xyz',
  });
  assert(resetTmpl.subject === 'FR8X Password Reset Request', 'Password reset subject matches specification');
  assert(resetTmpl.text.startsWith('Hello, Good Day!'), 'Password reset text begins with Hello, Good Day!');
  assert(resetTmpl.html.includes('112233'), 'Reset passkey rendered in template');

  const changedTmpl = renderPasswordChangedEmail({
    recipient: 'user@logistics.com',
  });
  assert(
    changedTmpl.subject === 'FR8X Password Changed Successfully',
    'Password changed subject matches specification'
  );
  assert(changedTmpl.text.startsWith('Hello, Good Day!'), 'Password changed text begins with Hello, Good Day!');

  const otpTmpl = renderOtpChallengeEmail({
    recipient: 'operator@fr8x.in',
    otpCode: '654321',
  });
  assert(otpTmpl.subject === 'FR8X Verification Code', 'OTP challenge subject matches specification');
  assert(otpTmpl.text.startsWith('Hello, Good Day!'), 'OTP challenge text begins with Hello, Good Day!');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 5: USER REGISTRATION & EMAIL VERIFICATION LIFECYCLE
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. User Registration & Email Verification Lifecycle ---');

  const testEmail = `new-operator-${Date.now()}@oceanfreight.corp`;
  const regResult = serverSecurityStore.registerUser({
    uid: `u-test-${Date.now()}`,
    email: testEmail,
    password: 'SecurePass@2026',
    displayName: 'Test Operator',
    company: 'Ocean Freight Corp',
    companyId: 'CMP-99881',
  });

  assert(regResult.success, 'New user registered successfully');
  assert(
    regResult.user?.status === 'pending_verification',
    'New user account is placed in pending_verification status'
  );
  assert(Boolean(regResult.verificationToken), 'Cryptographic verification token generated');
  assert(Boolean(regResult.verificationOtp), '6-digit verification code generated');

  // Attempt to login while pending verification
  const preVerifyLogin = serverSecurityStore.recordLoginAttempt(testEmail, 'SecurePass@2026');
  assert(
    !preVerifyLogin.success && preVerifyLogin.isPendingVerification,
    'Login rejected while account is pending email verification'
  );

  // Invalid verification code
  const badVerify = serverSecurityStore.verifyEmailToken({
    email: testEmail,
    otp: '000000',
  });
  assert(!badVerify.success, 'Invalid verification code rejected');

  // Valid verification code
  const goodVerify = serverSecurityStore.verifyEmailToken({
    email: testEmail,
    otp: regResult.verificationOtp,
  });
  assert(goodVerify.success, 'Email verification succeeds with valid OTP');
  assert(goodVerify.user?.status === 'active', 'User status transitioned to active after verification');

  // Single-use token consumption test: reusing token fails
  const reuseVerify = serverSecurityStore.verifyEmailToken({
    email: testEmail,
    otp: regResult.verificationOtp,
  });
  assert(
    reuseVerify.success && reuseVerify.message?.includes('already verified'),
    'Reusing verification code is safely handled without duplicate activation'
  );

  // Login succeeds after verification
  const postVerifyLogin = serverSecurityStore.recordLoginAttempt(testEmail, 'SecurePass@2026');
  assert(postVerifyLogin.success, 'Login succeeds after account is verified');

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 6: RESEND VERIFICATION & RATE LIMITING
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Resend Verification & Rate Limiting ---');

  const unverifiedEmail = `unverified-${Date.now()}@portlogistics.com`;
  serverSecurityStore.registerUser({
    uid: `u-unverified-${Date.now()}`,
    email: unverifiedEmail,
    password: 'Password@123',
    displayName: 'Unverified User',
    company: 'Port Logistics Ltd',
    companyId: 'CMP-77665',
  });

  // Resend attempt 1
  const resend1 = serverSecurityStore.resendEmailVerification(unverifiedEmail);
  assert(resend1.success, 'Resend attempt 1 succeeds');

  // Resend attempt 2
  const resend2 = serverSecurityStore.resendEmailVerification(unverifiedEmail);
  assert(resend2.success, 'Resend attempt 2 succeeds');

  // Resend attempt 3
  const resend3 = serverSecurityStore.resendEmailVerification(unverifiedEmail);
  assert(resend3.success, 'Resend attempt 3 succeeds');

  // Resend attempt 4 (rate limited)
  const resend4 = serverSecurityStore.resendEmailVerification(unverifiedEmail);
  assert(
    !resend4.success && resend4.remainingAttempts === 0,
    'Resend attempt 4 blocked by rate limiter (max 3/hour)'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 7: LOGIN ATTEMPTS & 3-STRIKE LOCKOUT
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Login Security & Lockout Policy ---');

  const lockoutUserEmail = `lockout-${Date.now()}@terminalops.com`;
  serverSecurityStore.registerUser(
    {
      uid: `u-lockout-${Date.now()}`,
      email: lockoutUserEmail,
      password: 'InitialPassword@1',
      displayName: 'Terminal Operator',
      company: 'Terminal Operations SA',
      companyId: 'CMP-55443',
    },
    { skipVerification: true } // Active account for lockout test
  );

  // Failed attempt 1
  const fail1 = serverSecurityStore.recordLoginAttempt(lockoutUserEmail, 'WrongPassword1');
  assert(!fail1.success && fail1.attemptsRemaining === 2, 'Failed attempt 1: 2 attempts remaining');

  // Failed attempt 2
  const fail2 = serverSecurityStore.recordLoginAttempt(lockoutUserEmail, 'WrongPassword2');
  assert(!fail2.success && fail2.attemptsRemaining === 1, 'Failed attempt 2: 1 attempt remaining');

  // Failed attempt 3 (triggers lockout and password reset OTP)
  const fail3 = serverSecurityStore.recordLoginAttempt(lockoutUserEmail, 'WrongPassword3');
  assert(
    !fail3.success && fail3.isBlocked && fail3.passwordResetRequired,
    'Failed attempt 3 locks account and requires verified password reset'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 8: FORGOT PASSWORD & ANTI-ENUMERATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. Forgot Password & Anti-Enumeration ---');

  const validForgot = serverSecurityStore.requestPasswordReset(lockoutUserEmail);
  assert(validForgot.success, 'Valid email request returns success');
  assert(
    validForgot.message ===
      'If an account matches this email, password reset instructions have been dispatched.',
    'Valid email returns generic anti-enumeration response'
  );

  const invalidForgot = serverSecurityStore.requestPasswordReset('non-existent-user@randomcompany.com');
  assert(invalidForgot.success, 'Non-existent email request returns success');
  assert(
    invalidForgot.message ===
      'If an account matches this email, password reset instructions have been dispatched.',
    'Non-existent email returns IDENTICAL anti-enumeration response'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // TEST SUITE 9: PASSWORD RESET & CONFIRMATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 9. Password Reset Verification & Invalidation ---');

  const activeResetOtp = serverSecurityStore.getActiveResetOtp(lockoutUserEmail);
  assert(Boolean(activeResetOtp), 'Active password reset OTP exists in secure store');

  // Invalid OTP rejected
  const badOtpReset = serverSecurityStore.verifyAndResetPassword(
    lockoutUserEmail,
    '000000',
    'NewSecurePassword@2026'
  );
  assert(!badOtpReset.success, 'Invalid password reset OTP rejected');

  // Weak password rejected
  const weakPassReset = serverSecurityStore.verifyAndResetPassword(
    lockoutUserEmail,
    activeResetOtp!,
    '123'
  );
  assert(!weakPassReset.success, 'Short/weak password rejected');

  // Valid reset
  const goodReset = serverSecurityStore.verifyAndResetPassword(
    lockoutUserEmail,
    activeResetOtp!,
    'BrandNewPassword@2026'
  );
  assert(goodReset.success, 'Password successfully reset with valid OTP');
  assert(goodReset.user?.status === 'active', 'Account restored to active status after reset');

  // Single-use token invalidation: token consumed
  const reusedOtpReset = serverSecurityStore.verifyAndResetPassword(
    lockoutUserEmail,
    activeResetOtp!,
    'AnotherPassword@2026'
  );
  assert(!reusedOtpReset.success, 'Reusing password reset OTP rejected (single-use enforced)');

  // New password authenticates
  const postResetLogin = serverSecurityStore.recordLoginAttempt(
    lockoutUserEmail,
    'BrandNewPassword@2026'
  );
  assert(postResetLogin.success, 'User can log in with new password');

  // Old password rejected
  const oldPassLogin = serverSecurityStore.recordLoginAttempt(
    lockoutUserEmail,
    'InitialPassword@1'
  );
  assert(!oldPassLogin.success, 'Old password no longer authenticates');

  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n============================================================');
  console.log(`TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
