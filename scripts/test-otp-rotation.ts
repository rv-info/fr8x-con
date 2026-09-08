import { generateSecureOtp, hashOtp, verifyOtpHash } from '../lib/crypto';
import { serverSecurityStore } from '../lib/server-auth-store';
import { UntraceableSecureOtpEngine } from '../lib/security/secure-otp-engine';

async function runOtpRotationTests() {
  console.log('\n======================================================');
  console.log('       FR8X OTP DIGIT ROTATION AUDIT & TEST SUITE      ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // TEST 1: generateSecureOtp direct exclusion of string
  console.log('\n--- 1. Testing generateSecureOtp Exclusion (Single & Array) ---');
  const baseCode = '123456';
  let collisionDetected = false;
  for (let i = 0; i < 50; i++) {
    const newCode = generateSecureOtp(6, baseCode);
    if (newCode === baseCode) {
      collisionDetected = true;
      break;
    }
  }
  assert(!collisionDetected, 'generateSecureOtp never outputs the excluded single code over 50 iterations');

  const multipleExcludes = ['111111', '222222', '333333', '444444', '555555'];
  let multiCollision = false;
  for (let i = 0; i < 50; i++) {
    const newCode = generateSecureOtp(6, multipleExcludes);
    if (multipleExcludes.includes(newCode)) {
      multiCollision = true;
      break;
    }
  }
  assert(!multiCollision, 'generateSecureOtp never outputs any of the excluded array codes');

  // TEST 2: generateSecureOtp exclusion by Hash
  console.log('\n--- 2. Testing generateSecureOtp Exclusion by PBKDF2 Hash ---');
  const targetCode = '654321';
  const hashedTarget = hashOtp(targetCode);
  let hashCollision = false;
  for (let i = 0; i < 25; i++) {
    const newCode = generateSecureOtp(6, { salt: hashedTarget.salt, hash: hashedTarget.hash });
    if (newCode === targetCode) {
      hashCollision = true;
      break;
    }
  }
  assert(!hashCollision, 'generateSecureOtp rotates away from code matching PBKDF2 salt/hash');

  // TEST 3: Email Verification Resend Rotates OTP
  console.log('\n--- 3. Testing resendEmailVerification Digit Rotation ---');
  const dynamicSuffix = Date.now();
  const testEmail = `neha.${dynamicSuffix}@gatewaylines.in`;
  const regResult = serverSecurityStore.registerUser({
    uid: `u-neha-${dynamicSuffix}`,
    email: testEmail,
    password: 'SecurePassword123!',
    displayName: 'Rotation Test User',
    company: 'Gateway Lines Ltd',
    companyId: `CMP-${dynamicSuffix}`,
    mobile: `+91 99${Math.floor(10000000 + Math.random() * 90000000)}`,
  });
  assert(regResult.success, 'Test user registered successfully in pending_verification status', regResult.error);

  const initialVerif = (serverSecurityStore as any).emailVerifications.get(testEmail.toLowerCase());
  assert(!!initialVerif, 'Initial verification record exists');
  const otp1 = initialVerif?.otp;
  console.log(`  Initial OTP: ${otp1}`);

  // Resend 1
  const resend1 = serverSecurityStore.resendEmailVerification(testEmail);
  assert(resend1.success, 'First resendEmailVerification succeeded');
  const verifAfterResend1 = (serverSecurityStore as any).emailVerifications.get(testEmail.toLowerCase());
  const otp2 = verifAfterResend1?.otp;
  console.log(`  Resend 1 OTP: ${otp2}`);
  assert(otp2 !== otp1, `Resend 1 OTP (${otp2}) is strictly DIFFERENT from initial OTP (${otp1})`);

  // Resend 2
  const resend2 = serverSecurityStore.resendEmailVerification(testEmail);
  assert(resend2.success, 'Second resendEmailVerification succeeded');
  const verifAfterResend2 = (serverSecurityStore as any).emailVerifications.get(testEmail.toLowerCase());
  const otp3 = verifAfterResend2?.otp;
  console.log(`  Resend 2 OTP: ${otp3}`);
  assert(otp3 !== otp2, `Resend 2 OTP (${otp3}) is strictly DIFFERENT from Resend 1 OTP (${otp2})`);

  // Verify that the OLD OTP is REJECTED and only the NEW OTP is ACCEPTED
  console.log('\n--- 4. Testing Invalidation of Old OTP after Resend ---');
  const verifyOldResult = serverSecurityStore.verifyEmailToken({
    email: testEmail,
    otp: otp1,
  });
  assert(!verifyOldResult.success, 'Submitting older invalidated OTP (otp1) is rejected');

  const verifyNewResult = serverSecurityStore.verifyEmailToken({
    email: testEmail,
    otp: otp3,
  });
  assert(verifyNewResult.success, 'Submitting latest rotated OTP (otp3) succeeds');

  // TEST 5: requestOTP / generateOTP Rotation
  console.log('\n--- 5. Testing Login requestOTP Rotation ---');
  const loginEmail = `login.rot.${Date.now()}@fr8x-audit.internal`;
  const req1 = serverSecurityStore.requestOTP(loginEmail);
  assert(req1.success, 'First login requestOTP succeeded');
  const activeOtp1 = (serverSecurityStore as any).activeLoginOtps.get(loginEmail)?.otp;
  console.log(`  Login OTP 1: ${activeOtp1}`);

  const req2 = serverSecurityStore.requestOTP(loginEmail);
  assert(req2.success, 'Second login requestOTP succeeded');
  const activeOtp2 = (serverSecurityStore as any).activeLoginOtps.get(loginEmail)?.otp;
  console.log(`  Login OTP 2: ${activeOtp2}`);
  assert(activeOtp2 !== activeOtp1, `Second login OTP (${activeOtp2}) is strictly DIFFERENT from first OTP (${activeOtp1})`);

  // TEST 6: UntraceableSecureOtpEngine Rotation on Resend
  console.log('\n--- 6. Testing UntraceableSecureOtpEngine Rotation ---');
  const engine = UntraceableSecureOtpEngine.getInstance();
  const challenge1 = engine.createChallenge({
    subject: 'operator@internal.corp',
    purpose: 'godfather_access',
    length: 6,
    ttlSeconds: 60,
  });
  const plainOtp1 = challenge1.plainOtpForDispatch;
  console.log(`  Engine Challenge 1 OTP: ${plainOtp1}`);

  const challenge2 = engine.createChallenge({
    subject: 'operator@internal.corp',
    purpose: 'godfather_access',
    length: 6,
    ttlSeconds: 60,
    previousChallengeTicket: challenge1.challengeTicket,
  });
  const plainOtp2 = challenge2.plainOtpForDispatch;
  console.log(`  Engine Challenge 2 OTP: ${plainOtp2}`);
  assert(plainOtp2 !== plainOtp1, `Engine Challenge 2 OTP (${plainOtp2}) is strictly DIFFERENT from Challenge 1 OTP (${plainOtp1})`);

  // Verify that Challenge 1 ticket was incinerated
  const oldVerify = engine.verifyChallenge({
    challengeTicket: challenge1.challengeTicket,
    otpInput: plainOtp1,
    expectedSubject: 'operator@internal.corp',
    expectedPurpose: 'godfather_access',
  });
  assert(!oldVerify.success, 'Incinerated old challenge ticket is rejected');

  // Verify Challenge 2 ticket works
  const newVerify = engine.verifyChallenge({
    challengeTicket: challenge2.challengeTicket,
    otpInput: plainOtp2,
    expectedSubject: 'operator@internal.corp',
    expectedPurpose: 'godfather_access',
  });
  assert(newVerify.success, 'New rotated challenge verifies successfully');

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runOtpRotationTests().catch((err) => {
  console.error('Test run failed with unhandled error:', err);
  process.exit(1);
});
