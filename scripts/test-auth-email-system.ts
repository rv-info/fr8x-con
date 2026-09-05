/**
 * FR8X GODFATHER — ZeptoMail Transactional Email & Security Test Suite
 * Production Implementation Verification (Section 25 Compliance)
 *
 * Covers:
 * 1.  Email service initialization & endpoint resolution
 * 2.  Missing API key handling
 * 3.  Invalid sender type & strict sender mapping
 * 4.  Valid password email (password@fr8x.in)
 * 5.  Valid support email (support@fr8x.in)
 * 6.  Valid technical email (tech@fr8x.in)
 * 7.  ZeptoMail success response handling
 * 8.  ZeptoMail 4xx client error (no blind retries)
 * 9.  ZeptoMail 5xx transient error (controlled retry with backoff)
 * 10. Network timeout handling
 * 11. Forgot-password anti-enumeration
 * 12. Verification token expiry
 * 13. Verification token single-use
 * 14. Password reset token expiry
 * 15. Password reset token single-use
 * 16. OTP expiration
 * 17. OTP attempt limit
 * 18. Secret & credential redaction (zero leaks in logs or errors)
 */

import {
  EmailService,
  EMAIL_SENDERS,
  sendTransactionalEmail,
  resolveSenderForType,
  getEmailSendersStatus,
  getZeptoMailStatus,
  isValidEmailAddress,
  redactSensitiveData,
} from '../lib/email-service';
import {
  renderEmailVerificationEmail,
  renderPasswordResetEmail,
  renderPasswordChangedEmail,
  renderOtpChallengeEmail,
  renderSupportEmail,
  renderTechnicalEmail,
  renderTestEmail,
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
  console.log('======================================================================');
  console.log('FR8X — ZEPTOMAIL TRANSACTIONAL EMAIL & SECURITY VERIFICATION SUITE');
  console.log('======================================================================\n');

  const testRecipient = 'qa-auditor@fr8x.in';

  // ───────────────────────────────────────────────────────────────────────────
  // 1. EMAIL SERVICE INITIALIZATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- 1. Email Service Initialization & Endpoint Resolution ---');
  const zeptoStatus = getZeptoMailStatus();
  assert(
    zeptoStatus.endpoint.includes('api.zeptomail.in') || zeptoStatus.endpoint.includes('api.zeptomail.com'),
    'Default ZeptoMail endpoint resolves to regional or global ZeptoMail API endpoint',
    `Endpoint is ${zeptoStatus.endpoint}`
  );
  assert(
    zeptoStatus.agent === 'agent_1',
    'Configured ZeptoMail agent is agent_1'
  );
  assert(
    zeptoStatus.domain === 'fr8x.in',
    'Configured ZeptoMail domain is fr8x.in'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 2. MISSING API KEY HANDLING
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Missing API Key Handling ---');
  const savedKey = process.env.ZEPTO_MAIL_API_KEY;
  const savedZohoKey = process.env.ZOHO_ZEPTOMAIL_TOKEN;
  try {
    delete process.env.ZEPTO_MAIL_API_KEY;
    delete process.env.ZOHO_ZEPTOMAIL_TOKEN;

    const noKeyResult = await EmailService.sendTransactionalEmail({
      to: testRecipient,
      subject: 'Test No Key',
      text: 'Testing dispatch without key',
      senderType: 'SUPPORT',
    });

    // In non-production/test environments, gracefully fall back to Sandbox_Mock
    assert(
      noKeyResult.success && noKeyResult.provider === 'Sandbox_Mock',
      'Missing API key in test environment falls back gracefully to Sandbox_Mock without throwing unhandled error'
    );
  } finally {
    if (savedKey) process.env.ZEPTO_MAIL_API_KEY = savedKey;
    if (savedZohoKey) process.env.ZOHO_ZEPTOMAIL_TOKEN = savedZohoKey;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 3. INVALID SENDER TYPE & STRICT SENDER MAPPING
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Invalid Sender Type & Strict Sender Mapping ---');
  assert(EMAIL_SENDERS.PASSWORD === 'password@fr8x.in', 'PASSWORD sender maps to password@fr8x.in');
  assert(EMAIL_SENDERS.SUPPORT === 'support@fr8x.in', 'SUPPORT sender maps to support@fr8x.in');
  assert(EMAIL_SENDERS.TECH === 'tech@fr8x.in', 'TECH sender maps to tech@fr8x.in');

  // Verify resolveSenderForType mappings
  assert(resolveSenderForType('EMAIL_VERIFICATION').address === 'password@fr8x.in', 'EMAIL_VERIFICATION -> password@fr8x.in');
  assert(resolveSenderForType('AUTH_OTP').address === 'password@fr8x.in', 'AUTH_OTP -> password@fr8x.in');
  assert(resolveSenderForType('PASSWORD_RESET').address === 'password@fr8x.in', 'PASSWORD_RESET -> password@fr8x.in');
  assert(resolveSenderForType('PASSWORD_CHANGED').address === 'password@fr8x.in', 'PASSWORD_CHANGED -> password@fr8x.in');
  assert(resolveSenderForType('LOGIN_SECURITY').address === 'password@fr8x.in', 'LOGIN_SECURITY -> password@fr8x.in');
  assert(resolveSenderForType('SUPPORT_TICKET').address === 'support@fr8x.in', 'SUPPORT_TICKET -> support@fr8x.in');
  assert(resolveSenderForType('SUPPORT_REQUEST').address === 'support@fr8x.in', 'SUPPORT_REQUEST -> support@fr8x.in');
  assert(resolveSenderForType('TECH_NOTIFICATION').address === 'tech@fr8x.in', 'TECH_NOTIFICATION -> tech@fr8x.in');

  // Unknown sender type fallback
  const fallbackSender = resolveSenderForType('UNKNOWN_TYPE' as any);
  assert(
    fallbackSender.address === 'support@fr8x.in' || fallbackSender.address === 'password@fr8x.in',
    'Unknown sender types fallback safely to verified domain addresses'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 4. VALID PASSWORD EMAIL (password@fr8x.in)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Valid Password Email (password@fr8x.in) ---');
  const verifyEmail = await EmailService.sendVerificationEmail({
    to: testRecipient,
    verificationLink: 'https://con.fr8x.in/verify-email/tok_123',
    otpCode: '654321',
  });
  assert(verifyEmail.success, 'Verification email dispatch succeeds');
  assert(verifyEmail.from === 'password@fr8x.in', 'Verification email from address is password@fr8x.in');

  const pwdResetEmail = await EmailService.sendPasswordResetEmail({
    to: testRecipient,
    resetLink: 'https://con.fr8x.in/reset-password/tok_abc',
    otpCode: '123456',
  });
  assert(pwdResetEmail.success, 'Password reset email dispatch succeeds');
  assert(pwdResetEmail.from === 'password@fr8x.in', 'Password reset email from address is password@fr8x.in');

  const pwdChangedEmail = await EmailService.sendPasswordChangedEmail({
    to: testRecipient,
    ipAddress: '10.0.0.1',
  });
  assert(pwdChangedEmail.success, 'Password changed email dispatch succeeds');
  assert(pwdChangedEmail.from === 'password@fr8x.in', 'Password changed email from address is password@fr8x.in');

  // ───────────────────────────────────────────────────────────────────────────
  // 5. VALID SUPPORT EMAIL (support@fr8x.in)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Valid Support Email (support@fr8x.in) ---');
  const supportEmail = await EmailService.sendSupportEmail({
    to: testRecipient,
    subject: 'Urgent Container Tracking Issue',
    message: 'We need assistance with shipment tracking container MSKU908123.',
    ticketId: 'TCK-8890',
  });
  assert(supportEmail.success, 'Support email dispatch succeeds');
  assert(supportEmail.from === 'support@fr8x.in', 'Support email from address is support@fr8x.in');
  assert(
    supportEmail.subject?.includes('TCK-8890'),
    'Support email subject includes Ticket ID: FR8X SUPPORT TICKET CREATED — {{TICKET_ID}}'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 6. VALID TECHNICAL EMAIL (tech@fr8x.in)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Valid Technical Email (tech@fr8x.in) ---');
  const techEmail = await EmailService.sendTechnicalEmail({
    to: testRecipient,
    subject: 'Scheduled Gateway Maintenance',
    details: 'Database cluster indexing scheduled for Sunday 02:00 UTC.',
    category: 'MAINTENANCE',
  });
  assert(techEmail.success, 'Technical email dispatch succeeds');
  assert(techEmail.from === 'tech@fr8x.in', 'Technical email from address is tech@fr8x.in');
  assert(
    techEmail.from !== 'password@fr8x.in' && techEmail.from !== 'support@fr8x.in',
    'Technical emails are isolated from customer authentication and support'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 7. ZEPTOMAIL SUCCESS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. ZeptoMail Success Response Handling ---');
  const originalFetch = global.fetch;
  try {
    global.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
      return {
        ok: true,
        status: 201,
        statusText: 'Created',
        json: async () => ({
          data: [
            {
              code: 'MAIL_SENT',
              message: 'Email sent successfully',
              message_id: 'zm_msg_test_success_998877',
            },
          ],
          message: 'success',
        }),
      } as Response;
    }) as any;

    process.env.ZEPTO_MAIL_API_KEY = 'test_dummy_token_for_mock_fetch';

    const testSendResult = await EmailService.sendTestEmail({
      to: testRecipient,
    });
    assert(testSendResult.success, 'ZeptoMail 201 Created processed successfully');
    assert(
      testSendResult.messageId === 'zm_msg_test_success_998877',
      'Message ID extracted correctly from ZeptoMail payload'
    );
    assert(testSendResult.provider === 'Zoho_ZeptoMail', 'Provider identified as Zoho_ZeptoMail');
  } finally {
    global.fetch = originalFetch;
    delete process.env.ZEPTO_MAIL_API_KEY;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 8. ZEPTOMAIL 4XX CLIENT ERROR (NO BLIND RETRIES)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. ZeptoMail 4xx Handling (No Blind Retries) ---');
  let fetchCallCount4xx = 0;
  try {
    global.fetch = (async () => {
      fetchCallCount4xx++;
      return {
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({
          error: {
            code: 'INVALID_SENDER',
            message: 'Sender address not allowed for agent_1',
          },
        }),
      } as Response;
    }) as any;

    process.env.ZEPTO_MAIL_API_KEY = 'test_token';

    const fail4xxResult = await EmailService.sendTransactionalEmail({
      to: testRecipient,
      subject: 'Test 4xx',
      text: 'Body',
      senderType: 'PASSWORD',
    });

    assert(!fail4xxResult.success, '4xx error returns success: false');
    assert(
      fetchCallCount4xx === 1,
      '4xx error is NOT retried blindly (exactly 1 request made)',
      `Actual call count: ${fetchCallCount4xx}`
    );
    assert(
      fail4xxResult.error?.includes('INVALID_SENDER') || fail4xxResult.error?.includes('Sender address not allowed'),
      '4xx error details safely extracted'
    );
  } finally {
    global.fetch = originalFetch;
    delete process.env.ZEPTO_MAIL_API_KEY;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 9. ZEPTOMAIL 5XX TRANSIENT ERROR (CONTROLLED RETRY)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 9. ZeptoMail 5xx Transient Error (Controlled Retry) ---');
  let fetchCallCount5xx = 0;
  try {
    global.fetch = (async () => {
      fetchCallCount5xx++;
      if (fetchCallCount5xx === 1) {
        // First attempt fails with 503 Service Unavailable
        return {
          ok: false,
          status: 503,
          statusText: 'Service Unavailable',
          json: async () => ({ error: { message: 'Temporary upstream rate limit' } }),
        } as Response;
      }
      // Second attempt succeeds
      return {
        ok: true,
        status: 200,
        json: async () => ({
          data: [{ message_id: 'recovered_msg_id_5544' }],
        }),
      } as Response;
    }) as any;

    process.env.ZEPTO_MAIL_API_KEY = 'test_token';

    const retrySuccess = await EmailService.sendTransactionalEmail({
      to: testRecipient,
      subject: 'Test Retry',
      text: 'Body',
      senderType: 'PASSWORD',
    });

    assert(retrySuccess.success, '5xx transient failure successfully recovers on retry');
    assert(
      fetchCallCount5xx === 2,
      'Controlled retry executed for 5xx transient error (exactly 2 attempts)',
      `Actual attempts: ${fetchCallCount5xx}`
    );
    assert(retrySuccess.messageId === 'recovered_msg_id_5544', 'Message ID received from successful retry');
  } finally {
    global.fetch = originalFetch;
    delete process.env.ZEPTO_MAIL_API_KEY;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 10. NETWORK TIMEOUT HANDLING
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 10. Network Timeout Handling ---');
  try {
    global.fetch = (async () => {
      const err = new Error('The operation was aborted due to timeout');
      err.name = 'AbortError';
      throw err;
    }) as any;

    process.env.ZEPTO_MAIL_API_KEY = 'test_token';

    const timeoutResult = await EmailService.sendTransactionalEmail({
      to: testRecipient,
      subject: 'Test Timeout',
      text: 'Body',
      senderType: 'PASSWORD',
    });

    assert(!timeoutResult.success, 'Network timeout fails gracefully without throwing uncaught exception');
    assert(
      timeoutResult.error?.toLowerCase().includes('timeout') || timeoutResult.error?.toLowerCase().includes('aborted'),
      'Timeout error reported clearly in internal result'
    );
  } finally {
    global.fetch = originalFetch;
    delete process.env.ZEPTO_MAIL_API_KEY;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // 11. FORGOT-PASSWORD ANTI-ACCOUNT-ENUMERATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 11. Anti-Account-Enumeration ---');
  const existingUserEmail = `real-user-${Date.now()}@shippinglogistics.com`;
  serverSecurityStore.registerUser({
    uid: `u-${Date.now()}`,
    email: existingUserEmail,
    password: 'SuperSecretPassword@123',
    displayName: 'Real Registered User',
    company: 'Shipping Logistics Global',
    companyId: 'CMP-10293',
  });

  const existingResp = serverSecurityStore.requestPasswordReset(existingUserEmail);
  const nonExistingResp = serverSecurityStore.requestPasswordReset('nobody-here-ever@nonexistent-domain-xyz.com');

  assert(existingResp.success, 'Existing email request returns success: true');
  assert(nonExistingResp.success, 'Non-existent email request returns success: true');
  assert(
    existingResp.message === nonExistingResp.message,
    'Generic anti-enumeration message is IDENTICAL for existing and non-existent accounts'
  );
  assert(
    existingResp.message === 'If an account exists for this email address, password reset instructions have been sent.',
    'Message matches security specification exactly'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 12. VERIFICATION TOKEN EXPIRY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 12. Verification Token Expiry ---');
  const expiryTestEmail = `expiry-user-${Date.now()}@oceanmarine.com`;
  const expReg = serverSecurityStore.registerUser({
    uid: `u-exp-${Date.now()}`,
    email: expiryTestEmail,
    password: 'ValidPassword@999',
    displayName: 'Expiry User',
    company: 'Ocean Marine Corp',
    companyId: 'CMP-77441',
  });

  // Manually expire verification record in active store
  const pendingRecord = (serverSecurityStore as any).emailVerifications.get(expiryTestEmail.toLowerCase());
  if (pendingRecord) {
    pendingRecord.expiresAt = Date.now() - 1000; // Expired 1 second ago
  }

  const expiredVerifyResult = serverSecurityStore.verifyEmailToken({
    email: expiryTestEmail,
    otp: expReg.verificationOtp,
  });
  assert(!expiredVerifyResult.success, 'Expired verification token rejected');
  assert(
    expiredVerifyResult.error?.toLowerCase().includes('expired'),
    'Expired message returned to user'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 13. VERIFICATION TOKEN SINGLE-USE
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 13. Verification Token Single-Use ---');
  const singleUseEmail = `single-use-${Date.now()}@freightforwarders.com`;
  const suReg = serverSecurityStore.registerUser({
    uid: `u-su-${Date.now()}`,
    email: singleUseEmail,
    password: 'ValidPassword@999',
    displayName: 'Single Use User',
    company: 'Freight Forwarders International',
    companyId: 'CMP-22334',
  });

  const firstVerify = serverSecurityStore.verifyEmailToken({
    email: singleUseEmail,
    otp: suReg.verificationOtp,
  });
  assert(firstVerify.success, 'Initial verification succeeds');

  const reVerify = serverSecurityStore.verifyEmailToken({
    email: singleUseEmail,
    otp: suReg.verificationOtp,
  });
  assert(
    reVerify.success && reVerify.message?.includes('already verified'),
    'Subsequent verification attempt acknowledges already-verified without re-activating or leaking tokens'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 14. PASSWORD RESET TOKEN EXPIRY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 14. Password Reset Token Expiry ---');
  const resetExpEmail = `reset-exp-${Date.now()}@portauthority.org`;
  serverSecurityStore.registerUser(
    {
      uid: `u-rexp-${Date.now()}`,
      email: resetExpEmail,
      password: 'InitialPassword@123',
      displayName: 'Reset Expiry User',
      company: 'Port Authority Global',
      companyId: 'CMP-44556',
    },
    { skipVerification: true }
  );

  serverSecurityStore.requestPasswordReset(resetExpEmail);
  const resetOtp = serverSecurityStore.getActiveResetOtp(resetExpEmail);

  // Manually expire active reset OTP
  const activeOtpRecord = (serverSecurityStore as any).activeResetOtps.get(resetExpEmail.toLowerCase());
  if (activeOtpRecord) {
    activeOtpRecord.expiresAt = Date.now() - 5000;
  }

  const expiredReset = serverSecurityStore.verifyAndResetPassword(
    resetExpEmail,
    resetOtp!,
    'NewSecurePassword@2026'
  );
  assert(!expiredReset.success, 'Expired password reset OTP rejected');
  assert(
    expiredReset.error?.toLowerCase().includes('expired'),
    'Expired password reset error message returned'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 15. PASSWORD RESET TOKEN SINGLE-USE
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 15. Password Reset Token Single-Use ---');
  const suResetEmail = `su-reset-${Date.now()}@containerships.com`;
  serverSecurityStore.registerUser(
    {
      uid: `u-sureset-${Date.now()}`,
      email: suResetEmail,
      password: 'OriginalPassword@123',
      displayName: 'Single Reset User',
      company: 'Container Ships LLC',
      companyId: 'CMP-88776',
    },
    { skipVerification: true }
  );

  const resetReq = serverSecurityStore.requestPasswordReset(suResetEmail);
  const activeToken = resetReq.resetToken || serverSecurityStore.getActiveResetToken(suResetEmail);
  assert(Boolean(activeToken), 'URL reset token successfully generated');

  const firstTokenReset = serverSecurityStore.verifyAndResetPasswordByToken({
    token: activeToken!,
    newPassword: 'BrandNewPassword@2026',
    confirmPassword: 'BrandNewPassword@2026',
  });
  assert(firstTokenReset.success, 'First password reset with token succeeds');

  const secondTokenReset = serverSecurityStore.verifyAndResetPasswordByToken({
    token: activeToken!,
    newPassword: 'ThirdPassword@2026',
    confirmPassword: 'ThirdPassword@2026',
  });
  assert(!secondTokenReset.success, 'Second password reset with same token rejected (single-use enforced)');
  assert(
    secondTokenReset.error?.toLowerCase().includes('already') || secondTokenReset.error?.toLowerCase().includes('expired') || secondTokenReset.error?.toLowerCase().includes('invalid'),
    'Token single-use rejection verified'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // 16. OTP EXPIRATION
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 16. OTP Expiration ---');
  const otpExpTmpl = renderOtpChallengeEmail({
    recipient: testRecipient,
    otpCode: '908172',
    expiryMinutes: 10,
  });
  assert(otpExpTmpl.subject === 'YOUR FR8X VERIFICATION CODE', 'OTP subject matches YOUR FR8X VERIFICATION CODE');
  assert(otpExpTmpl.text.includes('valid for 10 minutes'), 'OTP expiration notice rendered in email body');
  assert(otpExpTmpl.html.includes('908172'), 'OTP code rendered in HTML');

  // ───────────────────────────────────────────────────────────────────────────
  // 17. OTP ATTEMPT LIMIT & RATE LIMITING
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 17. OTP Attempt Limit ---');
  const otpRateEmail = `otprate-${Date.now()}@railfreight.net`;
  const req1 = serverSecurityStore.requestOTP(otpRateEmail);
  assert(req1.success && req1.remaining === 2, 'OTP request 1 succeeds (2 remaining)');

  const req2 = serverSecurityStore.requestOTP(otpRateEmail);
  assert(req2.success && req2.remaining === 1, 'OTP request 2 succeeds (1 remaining)');

  const req3 = serverSecurityStore.requestOTP(otpRateEmail);
  assert(req3.success && req3.remaining === 0, 'OTP request 3 succeeds (0 remaining)');

  const req4 = serverSecurityStore.requestOTP(otpRateEmail);
  assert(!req4.success && req4.remaining === 0, 'OTP request 4 blocked (daily limit 3 reached)');

  // ───────────────────────────────────────────────────────────────────────────
  // 18. SECRET NOT APPEARING IN LOGS OR ERROR STRINGS
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 18. Secret & Credential Redaction ---');
  const secretKey = 'ph_secret_zm_token_991823901923';
  const rawLogString = `Request Authorization: Zoho-enczapikey ${secretKey} for user password: SuperSecretPass123`;
  const redacted = redactSensitiveData(rawLogString);

  assert(!redacted.includes(secretKey), 'Secret API key completely redacted from logs');
  assert(!redacted.includes('SuperSecretPass123'), 'Plaintext password completely redacted from logs');
  assert(redacted.includes('[REDACTED_AUTH_HEADER]'), 'Header replaced with safe placeholder');
  assert(redacted.includes('[REDACTED_PASSWORD]'), 'Password replaced with safe placeholder');

  // Verify test template renders exact prompt text
  const testTmpl = renderTestEmail();
  assert(testTmpl.subject === 'FR8X ZEPTOMAIL TEST', 'Test email subject is FR8X ZEPTOMAIL TEST');
  assert(
    testTmpl.text.startsWith('FR8X ZeptoMail integration test successful.') &&
      testTmpl.html.includes('FR8X ZeptoMail integration test successful.'),
    'Test email body is FR8X ZeptoMail integration test successful.'
  );

  // ───────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n======================================================================');
  console.log(`TEST SUITE FINISHED: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test execution error:', err);
  process.exit(1);
});
