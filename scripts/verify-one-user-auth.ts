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
  serverSecurityStore.unblockAccount('u-sarah');
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
  const dynamicId = Date.now();
  const testRegUid = `u-neha-${dynamicId}`;
  const testRegEmail = `neha.${dynamicId}@gatewaylines.in`;
  const testRegMobile = `+91 99${Math.floor(10000000 + Math.random() * 90000000)}`;

  const newReg = serverSecurityStore.registerUser(
    {
      uid: testRegUid,
      email: testRegEmail,
      password: 'Gateway@Pass2026',
      displayName: 'Neha Sharma',
      company: 'Gateway Container Lines Ltd.',
      companyId: 'CMP-00888',
      mobile: testRegMobile,
    },
    { skipVerification: true, firstLoginCompleted: true }
  );
  assert(newReg.success === true && newReg.user?.uid === testRegUid, 'Register clean corporate user under One User, One Login');

  // 7. Login with newly registered user
  const newLogin = serverSecurityStore.recordLoginAttempt(testRegEmail, 'Gateway@Pass2026', '127.0.0.1');
  assert(newLogin.success === true && newLogin.user?.displayName === 'Neha Sharma', 'Login successfully with newly registered user');

  // 8. Attempt duplicate registration of newly registered user
  const dupNewUser = serverSecurityStore.registerUser({
    uid: `u-neha-copy-${dynamicId}`,
    email: testRegEmail,
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
    uid: `u-other-person-${dynamicId}`,
    email: `other.${dynamicId}@gatewaylines.in`,
    password: 'Password@123',
    displayName: 'Other Person',
    company: 'Gateway Container Lines Ltd.',
    companyId: 'CMP-00888',
    mobile: testRegMobile, // same mobile as Neha Sharma
  });
  assert(
    dupMobile.success === false && dupMobile.error?.includes('mobile phone number'),
    'Reject duplicate registration sharing same mobile phone number'
  );

  // 10. 3 invalid login attempts trigger account lockout
  const userToTest = 'kiran.mehta@indoocean.com';
  serverSecurityStore.unblockAccount(userToTest);
  // Attempt 1
  const fail1 = serverSecurityStore.recordLoginAttempt(userToTest, 'WrongPass1', '127.0.0.1');
  assert(fail1.success === false && fail1.attemptsRemaining === 2, 'Attempt 1: 2 attempts remaining');
  // Attempt 2
  const fail2 = serverSecurityStore.recordLoginAttempt(userToTest, 'WrongPass2', '127.0.0.1');
  assert(fail2.success === false && fail2.attemptsRemaining === 1, 'Attempt 2: 1 attempt remaining');
  // Attempt 3: triggers account block
  const fail3 = serverSecurityStore.recordLoginAttempt(userToTest, 'WrongPass3', '127.0.0.1');
  assert(
    fail3.success === false &&
      fail3.isBlocked === true &&
      fail3.message.includes('blocked'),
    'Attempt 3: Account strictly blocked after 3 failed attempts'
  );

  // 11. Blocked account cannot self-unblock
  const blockedResetReq = serverSecurityStore.requestPasswordReset(userToTest);
  assert(
    blockedResetReq.success === false && Boolean(blockedResetReq.error?.includes('blocked')),
    'Blocked user cannot self-service reset password'
  );

  // 12. Only Godfather can unblock account
  const unblockRes = serverSecurityStore.unblockAccount(userToTest, 'Godfather Operator', 'Identity verified via official channel');
  assert(unblockRes.success === true, 'Godfather administrator unblocks account');

  // 13. Unblocked user can now request and perform password reset
  serverSecurityStore.requestPasswordReset(userToTest);
  const resetOtp = serverSecurityStore.getActiveResetOtp(userToTest);
  assert(Boolean(resetOtp && resetOtp.length === 6), 'Password reset OTP issued after unblock');

  const goodReset = serverSecurityStore.verifyAndResetPassword(userToTest, resetOtp!, 'NewKiranPass@2026');
  assert(goodReset.success === true, 'Successfully reset password with verified OTP');

  // 14. Login with newly reset password succeeds
  const loginWithNewPass = serverSecurityStore.recordLoginAttempt(userToTest, 'NewKiranPass@2026', '127.0.0.1');
  assert(loginWithNewPass.success === true, 'Log in successfully with newly updated password after reset');

  console.log(`\n=== Verification Complete: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
