import { serverSecurityStore } from '../lib/server-auth-store';

function runTests() {
  console.log('=== Running FR8X One User, One Login Verification Suite ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: any, testName: string, extra?: string) {
    if (Boolean(condition)) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extra || ''}`);
      failed++;
    }
  }

  // 1. Seed user login by UID
  const resUid = serverSecurityStore.recordLoginAttempt('u-arjun', 'Atlas@2025', '127.0.0.1');
  assert(resUid.success === true, 'Login with seed User ID (u-arjun)');

  // 2. Seed user login by corporate email
  const resEmail = serverSecurityStore.recordLoginAttempt('arjun@atlaslogistics.com', 'Atlas@2025', '127.0.0.1');
  assert(resEmail.success === true, 'Login with seed corporate email (arjun@atlaslogistics.com)');

  // 3. Login with invalid password
  const resBadPass = serverSecurityStore.recordLoginAttempt('u-sarah', 'WrongPassword', '127.0.0.1');
  assert(resBadPass.success === false && resBadPass.attemptsRemaining === 2, 'Invalid password decrements remaining attempts');

  // 4. Duplicate registration in SAME organisation
  const dupSameOrg = serverSecurityStore.registerUser({
    uid: 'u-dup-1',
    email: 'arjun@atlaslogistics.com',
    password: 'Password@2026',
    displayName: 'Arjun Rao Duplicate',
    company: 'Atlas Logistics Pvt. Ltd.',
    companyId: 'CMP-00101',
  });
  assert(
    dupSameOrg.success === false && dupSameOrg.error?.includes('same organization is prohibited'),
    'Reject duplicate account creation within SAME organization'
  );

  // 5. Duplicate registration in DIFFERENT organisation
  const dupDiffOrg = serverSecurityStore.registerUser({
    uid: 'u-dup-2',
    email: 'arjun@atlaslogistics.com',
    password: 'Password@2026',
    displayName: 'Arjun Rao Alt',
    company: 'Global Freight Express Ltd.',
    companyId: 'CMP-99999',
  });
  assert(
    dupDiffOrg.success === false && dupDiffOrg.error?.includes('across organizations is strictly prohibited'),
    'Reject duplicate account creation across DIFFERENT organization'
  );

  // 6. Clean new registration under One User, One Login
  const newReg = serverSecurityStore.registerUser({
    uid: 'u-neha-2026',
    email: 'neha.sharma@gatewaylines.in',
    password: 'Gateway@Pass2026',
    displayName: 'Neha Sharma',
    company: 'Gateway Container Lines Ltd.',
    companyId: 'CMP-00888',
    mobile: '+91 99887 76655',
  });
  assert(newReg.success === true && newReg.user?.uid === 'u-neha-2026', 'Register clean corporate user under One User, One Login');

  // 7. Login with newly registered user
  const newLogin = serverSecurityStore.recordLoginAttempt('neha.sharma@gatewaylines.in', 'Gateway@Pass2026', '127.0.0.1');
  assert(newLogin.success === true && newLogin.user?.displayName === 'Neha Sharma', 'Login successfully with newly registered user');

  // 8. Attempt duplicate registration of newly registered user
  const dupNewUser = serverSecurityStore.registerUser({
    uid: 'u-neha-copy',
    email: 'neha.sharma@gatewaylines.in',
    password: 'AnyPassword@123',
    displayName: 'Neha Sharma 2',
    company: 'Another Freight Org',
    companyId: 'CMP-77777',
  });
  assert(
    dupNewUser.success === false && dupNewUser.error?.includes('One User, One Login'),
    'Reject subsequent duplicate registration of newly created user'
  );

  // 9. Attempt duplicate registration by mobile phone number
  const dupMobile = serverSecurityStore.registerUser({
    uid: 'u-other-person',
    email: 'other.person@gatewaylines.in',
    password: 'Password@123',
    displayName: 'Other Person',
    company: 'Gateway Container Lines Ltd.',
    companyId: 'CMP-00888',
    mobile: '+91 99887 76655', // same mobile as Neha Sharma
  });
  assert(
    dupMobile.success === false && dupMobile.error?.includes('mobile phone number'),
    'Reject duplicate registration sharing same mobile phone number'
  );

  // 10. 3 invalid login attempts trigger automatic Password Reset OTP dispatch
  const userToTest = 'kiran.mehta@indoocean.com';
  // Attempt 1
  const fail1 = serverSecurityStore.recordLoginAttempt(userToTest, 'WrongPass1', '127.0.0.1');
  assert(fail1.success === false && fail1.attemptsRemaining === 2, 'Attempt 1: 2 attempts remaining');
  // Attempt 2
  const fail2 = serverSecurityStore.recordLoginAttempt(userToTest, 'WrongPass2', '127.0.0.1');
  assert(fail2.success === false && fail2.attemptsRemaining === 1, 'Attempt 2: 1 attempt remaining');
  // Attempt 3: triggers lock and OTP dispatch
  const fail3 = serverSecurityStore.recordLoginAttempt(userToTest, 'WrongPass3', '127.0.0.1');
  assert(
    fail3.success === false &&
      fail3.isBlocked === true &&
      fail3.passwordResetRequired === true &&
      fail3.email === userToTest,
    'Attempt 3: Account locked and Password Reset OTP dispatched from server to registered email'
  );

  // 11. Verify OTP code is recorded on server
  const dispatchedOtp = serverSecurityStore.getActiveResetOtp(userToTest);
  assert(
    Boolean(dispatchedOtp && dispatchedOtp.length === 6),
    'Server generated and recorded 6-digit password reset OTP for registered email',
    `OTP: ${dispatchedOtp}`
  );

  // 12. Invalid OTP verification fails
  const badOtpRes = serverSecurityStore.verifyAndResetPassword(userToTest, '999999', 'NewKiranPass@2026');
  assert(badOtpRes.success === false && badOtpRes.error?.includes('Invalid verification OTP'), 'Reject invalid OTP during password reset');

  // 13. Valid OTP resets password and unblocks account
  const goodReset = serverSecurityStore.verifyAndResetPassword(userToTest, dispatchedOtp!, 'NewKiranPass@2026');
  assert(goodReset.success === true, 'Successfully reset password and unblock account with dispatched OTP');

  // 14. Immediate login with newly reset password succeeds
  const loginWithNewPass = serverSecurityStore.recordLoginAttempt(userToTest, 'NewKiranPass@2026', '127.0.0.1');
  assert(loginWithNewPass.success === true, 'Log in successfully with newly updated password after reset');

  console.log(`\n=== Verification Complete: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
