import { serverSecurityStore } from '../lib/server-auth-store';

async function runTests() {
  console.log('================================================================');
  console.log('TEST SUITE: Strict 3-Attempt Lockout, Godfather Unblock & OTP Cooldown');
  console.log('================================================================\n');

  const testEmail = `test-user-${Date.now()}@fr8x.in`;
  const initialPassword = 'SecurePassword123!';

  // Step 0: Register a new test user
  console.log('Step 0: Creating test account:', testEmail);
  const regResult = serverSecurityStore.registerUser({
    uid: `u-${Date.now()}`,
    email: testEmail,
    password: initialPassword,
    company: 'Test Freight Ltd',
    companyId: 'comp-1',
    displayName: 'Test User',
    mobile: `+9199${Math.floor(10000000 + Math.random() * 90000000)}`,
  });

  if (!regResult.success) {
    console.error('Registration failed:', regResult.error);
    process.exit(1);
  }

  // Activate user directly for testing
  const user = serverSecurityStore.getUser(testEmail)!;
  user.status = 'active';
  user.email_verified = true;
  console.log('Account registered and activated. Status:', user.status);

  // -------------------------------------------------------------
  // Test 1: 3 Wrong Passwords Lockout
  // -------------------------------------------------------------
  console.log('\n--- Test 1: Testing 3 Wrong Password Attempts ---');

  // Attempt 1
  const attempt1 = serverSecurityStore.recordLoginAttempt(testEmail, 'WrongPass1');
  console.log('Attempt 1 (Wrong):', {
    success: attempt1.success,
    attemptsRemaining: attempt1.attemptsRemaining,
    message: attempt1.message,
  });
  if (attempt1.attemptsRemaining !== 2) throw new Error('Attempt 1 should leave 2 attempts remaining');

  // Attempt 2
  const attempt2 = serverSecurityStore.recordLoginAttempt(testEmail, 'WrongPass2');
  console.log('Attempt 2 (Wrong):', {
    success: attempt2.success,
    attemptsRemaining: attempt2.attemptsRemaining,
    message: attempt2.message,
  });
  if (attempt2.attemptsRemaining !== 1) throw new Error('Attempt 2 should leave 1 attempt remaining');

  // Attempt 3: Must trigger permanent block
  const attempt3 = serverSecurityStore.recordLoginAttempt(testEmail, 'WrongPass3');
  console.log('Attempt 3 (Wrong):', {
    success: attempt3.success,
    isBlocked: attempt3.isBlocked,
    passwordResetRequired: attempt3.passwordResetRequired,
    message: attempt3.message,
  });
  if (!attempt3.isBlocked) throw new Error('Attempt 3 must permanently block the account');
  if (serverSecurityStore.getUser(testEmail)!.status !== 'blocked') throw new Error('User status must be blocked');

  // Attempt 4: Should remain blocked with NO OTP sent
  const attempt4 = serverSecurityStore.recordLoginAttempt(testEmail, 'WrongPass4');
  console.log('Attempt 4 (Subsequent while blocked):', {
    success: attempt4.success,
    isBlocked: attempt4.isBlocked,
    message: attempt4.message,
  });
  if (!attempt4.isBlocked) throw new Error('Account must remain blocked on attempt 4');

  // -------------------------------------------------------------
  // Test 2: Blocked User Cannot Self-Unblock via Password Reset or OTP
  // -------------------------------------------------------------
  console.log('\n--- Test 2: Testing Blocked Account Restrictions (No Self-Service Unblock) ---');

  const otpRequest = serverSecurityStore.requestOTP(testEmail);
  console.log('requestOTP while blocked:', {
    success: otpRequest.success,
    message: otpRequest.message,
  });
  if (otpRequest.success) throw new Error('Blocked user must not be able to request OTPs');

  const resetRequest = serverSecurityStore.requestPasswordReset(testEmail);
  console.log('requestPasswordReset while blocked:', {
    success: resetRequest.success,
    error: resetRequest.error,
  });
  if (resetRequest.success) throw new Error('Blocked user must not be able to request password reset');

  const verifyReset = serverSecurityStore.verifyAndResetPassword(testEmail, '123456', 'NewPassword999!');
  console.log('verifyAndResetPassword while blocked:', {
    success: verifyReset.success,
    error: verifyReset.error,
  });
  if (verifyReset.success) throw new Error('Blocked user must not be able to verify/reset password');
  if (serverSecurityStore.getUser(testEmail)!.status !== 'blocked') throw new Error('User status must remain blocked');

  // -------------------------------------------------------------
  // Test 3: OTP 60-Second Cooldown on Active Users
  // -------------------------------------------------------------
  console.log('\n--- Test 3: Testing 60-Second OTP Cooldown ---');
  const activeUserEmail = `active-${Date.now()}@fr8x.in`;
  serverSecurityStore.registerUser({
    uid: `u-${Date.now()}-act`,
    email: activeUserEmail,
    password: initialPassword,
    company: 'Cooldown Test Co',
    companyId: 'comp-2',
    displayName: 'Active User',
    mobile: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
  });
  const activeUser = serverSecurityStore.getUser(activeUserEmail)!;
  activeUser.status = 'active';
  activeUser.email_verified = true;

  // First request: Should succeed
  const otp1 = serverSecurityStore.requestOTP(activeUserEmail);
  console.log('First OTP Request:', { success: otp1.success, message: otp1.message });
  if (!otp1.success) throw new Error('First OTP request should succeed');

  // Immediate second request: Must be blocked by 60-second cooldown
  const otp2 = serverSecurityStore.requestOTP(activeUserEmail);
  console.log('Immediate Second OTP Request (Within 60s):', { success: otp2.success, message: otp2.message });
  if (otp2.success) throw new Error('Immediate second OTP request must be blocked by cooldown');
  if (!otp2.message.includes('second(s)')) throw new Error('Cooldown error message must state wait seconds');

  // -------------------------------------------------------------
  // Test 4: Only Godfather Can Unblock
  // -------------------------------------------------------------
  console.log('\n--- Test 4: Testing Godfather Unblock ---');
  console.log('Current status of blocked user:', user.status);

  // Godfather unblocks with audited reason
  const unblockRes = serverSecurityStore.unblockAccount(
    testEmail,
    'Godfather Administrator',
    'Received email confirmation from registered address test-user@fr8x.in requesting account unlock.'
  );

  const unblockedUser = serverSecurityStore.getUser(testEmail)!;
  console.log('Godfather Unblock Result:', {
    success: unblockRes.success,
    message: unblockRes.message,
    status: unblockedUser.status,
    failedAttempts: unblockedUser.failedLoginAttempts,
  });

  if (!unblockRes.success) throw new Error('Godfather unblock should succeed');
  if (unblockedUser.status !== 'active') throw new Error('User status must be restored to active');
  if (unblockedUser.failedLoginAttempts !== 0) throw new Error('Failed attempts must be reset to 0');

  // Login with correct password now succeeds
  const loginAfterUnblock = serverSecurityStore.recordLoginAttempt(testEmail, initialPassword);
  console.log('Login After Godfather Unblock:', {
    success: loginAfterUnblock.success,
    isBlocked: loginAfterUnblock.isBlocked,
    message: loginAfterUnblock.message,
  });

  if (!loginAfterUnblock.success) throw new Error('User should now be able to login successfully');

  console.log('\n================================================================');
  console.log('ALL SECURITY LOCKOUT, GODFATHER UNBLOCK & COOLDOWN TESTS PASSED!');
  console.log('================================================================');
}

runTests().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
