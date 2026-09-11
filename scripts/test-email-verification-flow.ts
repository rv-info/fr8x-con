import { serverSecurityStore } from '../lib/server-auth-store';

async function runTests() {
  console.log('🧪 Starting End-to-End Email Verification Flow Tests...\n');

  const testEmail = `test.pilot.${Date.now()}@gmail.com`;
  const testUid = `u-pilot-${Date.now()}`;
  const testPassword = 'Password@123';
  const testCompany = 'Global Pilot Logistics';

  // ─── Test 1: First-time user registration without prior record ────────────
  console.log('Test 1: First-time user registers with consumer email (e.g. gmail.com)...');
  const regResult = serverSecurityStore.registerUser(
    {
      uid: testUid,
      email: testEmail,
      password: testPassword,
      displayName: 'Pilot User',
      company: testCompany,
      companyId: 'CMP-TEST-01',
      role: 'company_admin',
    },
    { origin: 'http://localhost:3000' }
  );

  if (!regResult.success) {
    throw new Error(`Test 1 Failed: Registration rejected: ${regResult.error}`);
  }

  const registeredUser = serverSecurityStore.getUser(testEmail);
  if (!registeredUser) {
    throw new Error('Test 1 Failed: User record not found after registration.');
  }

  if (registeredUser.email_verified !== false) {
    throw new Error(`Test 1 Failed: email_verified should be false, got ${registeredUser.email_verified}`);
  }

  if (registeredUser.status !== 'pending_verification') {
    throw new Error(`Test 1 Failed: status should be 'pending_verification', got ${registeredUser.status}`);
  }

  console.log('  ✅ Account created with email_verified = false and status = pending_verification');

  // ─── Test 2: Token Storage Security (Hashed Token ONLY, 15-minute expiry) ─
  console.log('\nTest 2: Verifying token security (stored ONLY as SHA-256 hash, 15m expiration)...');
  const rawToken = regResult.verificationToken;
  if (!rawToken || rawToken.length < 32) {
    throw new Error('Test 2 Failed: Raw token was not generated or too short.');
  }

  const expectedHash = serverSecurityStore.hashToken(rawToken);

  // Check that rawToken is NOT in verificationTokens or verificationTokenRecords directly
  let rawFound = false;
  for (const key of serverSecurityStore['verificationTokenRecords'].keys()) {
    if (key === rawToken) {
      rawFound = true;
      break;
    }
  }
  if (rawFound) {
    throw new Error('Test 2 Failed: CRITICAL SECURITY VIOLATION: Raw token was found stored in database keys!');
  }

  const tokenRecord = serverSecurityStore['verificationTokenRecords'].get(expectedHash);
  if (!tokenRecord) {
    throw new Error('Test 2 Failed: Hashed token record not found under SHA-256 key.');
  }

  if (tokenRecord.used !== false) {
    throw new Error('Test 2 Failed: Token record used flag should be false.');
  }

  if (tokenRecord.user_id !== testUid) {
    throw new Error(`Test 2 Failed: Token record user_id mismatch: ${tokenRecord.user_id} vs ${testUid}`);
  }

  const timeToExpiry = tokenRecord.expires_at - Date.now();
  const minutesToExpiry = timeToExpiry / (60 * 1000);
  if (minutesToExpiry < 14 || minutesToExpiry > 16) {
    throw new Error(`Test 2 Failed: Token expiry is not 15 minutes: ${minutesToExpiry.toFixed(2)} min`);
  }

  console.log(`  ✅ Token is stored strictly as SHA-256 hash: ${expectedHash.slice(0, 16)}...`);
  console.log(`  ✅ Token expiration verified at ~15 minutes (${minutesToExpiry.toFixed(1)} mins remaining)`);
  console.log('  ✅ No plaintext token found in database records');

  // ─── Test 3: Unverified User Login Guard ─────────────────────────────────
  console.log('\nTest 3: Testing login attempt on unverified account...');
  const loginAttempt = serverSecurityStore.recordLoginAttempt(testEmail, testPassword, '127.0.0.1');
  if (loginAttempt.success) {
    throw new Error('Test 3 Failed: Unverified user was permitted to log in!');
  }
  if (!loginAttempt.isPendingVerification) {
    throw new Error('Test 3 Failed: isPendingVerification flag was not returned.');
  }
  console.log('  ✅ Unverified account login correctly blocked with isPendingVerification = true');

  // ─── Test 4: Token Validation & Immediate Invalidation ────────────────────
  console.log('\nTest 4: Validating token via email verification...');
  const verifyResult = serverSecurityStore.verifyEmailToken({ token: rawToken });
  if (!verifyResult.success) {
    throw new Error(`Test 4 Failed: Token verification failed: ${verifyResult.error}`);
  }

  const verifiedUser = serverSecurityStore.getUser(testEmail);
  if (!verifiedUser?.email_verified) {
    throw new Error('Test 4 Failed: User email_verified was not set to true after verification.');
  }
  if (verifiedUser.status !== 'active') {
    throw new Error(`Test 4 Failed: User status was not set to active: ${verifiedUser.status}`);
  }

  console.log('  ✅ Token validated successfully');
  console.log('  ✅ User email_verified marked true and status marked active');

  // ─── Test 5: Re-use of Single-Use Token ──────────────────────────────────
  console.log('\nTest 5: Testing single-use token replay protection...');
  const secondVerify = serverSecurityStore.verifyEmailToken({ token: rawToken });
  if (secondVerify.success) {
    throw new Error('Test 5 Failed: Single-use token was accepted a second time!');
  }
  console.log(`  ✅ Token replay blocked with code: ${secondVerify.code || 'TOKEN_INVALID'}`);

  // ─── Test 6: Resend Verification & Rate Limiting ─────────────────────────
  console.log('\nTest 6: Testing resend verification rate limiting and cooldown...');
  const unverifiedEmail2 = `test.resend.${Date.now()}@yahoo.com`;
  const unverifiedUid2 = `u-resend-${Date.now()}`;
  serverSecurityStore.registerUser({
    uid: unverifiedUid2,
    email: unverifiedEmail2,
    password: testPassword,
    displayName: 'Resend Tester',
    company: 'Resend Inc',
    companyId: 'CMP-TEST-02',
  });

  // Second immediate resend request should trigger 60-second cooldown
  const immediateResend = serverSecurityStore.resendEmailVerification(unverifiedEmail2);
  if (immediateResend.success) {
    throw new Error('Test 6 Failed: Immediate resend was not rate limited by cooldown!');
  }
  if (!immediateResend.rateLimited) {
    throw new Error('Test 6 Failed: rateLimited flag not set.');
  }
  console.log(`  ✅ 60-second cooldown rate limit enforced: retry after ${immediateResend.retryAfterSeconds}s`);

  // ─── Test 7: Verified User Login ────────────────────────────────────────
  console.log('\nTest 7: Verified user login...');
  const verifiedLogin = serverSecurityStore.recordLoginAttempt(testEmail, testPassword, '127.0.0.1');
  if (!verifiedLogin.success && !verifiedLogin.firstLoginRequired) {
    throw new Error(`Test 7 Failed: Verified user login failed: ${verifiedLogin.message}`);
  }
  console.log('  ✅ Verified user successfully authenticated');

  // ─── Test 8: Protected Feature Access Guard for Unverified Users ────────
  console.log('\nTest 8: Testing protected feature access guard for unverified users...');
  const { authenticateUserSession } = await import('../lib/auth-guard');
  const { createSignedSessionToken } = await import('../lib/crypto');
  const { NextRequest } = await import('next/server');

  // Unverified user token
  const unverifiedSessionToken = createSignedSessionToken({
    uid: unverifiedUid2,
    email: unverifiedEmail2,
    role: 'company_admin',
    companyId: 'CMP-TEST-02',
    issuedAt: Date.now(),
  });

  const unverifiedReq = new NextRequest('http://localhost:3000/api/rate-cards', {
    headers: {
      cookie: `fr8x_session=${unverifiedSessionToken}`,
    },
  });

  const guardResult = authenticateUserSession(unverifiedReq);
  if (guardResult.authenticated) {
    throw new Error('Test 8 Failed: Unverified user was granted access to protected features!');
  }
  const errorJson = await guardResult.errorResponse?.json();
  if (errorJson?.code !== 'EMAIL_NOT_VERIFIED') {
    throw new Error(`Test 8 Failed: Expected EMAIL_NOT_VERIFIED, got ${errorJson?.code}`);
  }
  console.log('  ✅ Protected feature access blocked with 403 EMAIL_NOT_VERIFIED');

  console.log('\n🎉 ALL 8 EMAIL VERIFICATION SECURITY & FLOW TESTS PASSED!\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN FAILED:', err);
  process.exit(1);
});
