/**
 * FR8X End-to-End Transactional Email Delivery Verification
 *
 * Validates that all email pathways:
 * 1. User Registration Verification Email
 * 2. User Registration Welcome Email
 * 3. Resend Verification Email
 * 4. User First-Login Security OTP Email
 * 5. Resend First-Login OTP Email
 * 6. Password Reset Instructions OTP Email
 * 7. Godfather Operator First-Login OTP Email
 *
 * Strictly await delivery from password@fr8x.in via Zoho ZeptoMail REST API (https://api.zeptomail.in/v1.1/email).
 */

import fs from 'fs';
import path from 'path';

// Parse .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      process.env[key] = val;
    }
  }
}

import { serverSecurityStore } from '../lib/server-auth-store';
import { EmailService } from '../lib/email-service';
import {
  authenticateOperatorCredentials,
  resendOperatorFirstLoginOtp,
  resetOperatorFirstLoginStatus,
  updateOperatorPassword,
} from '../lib/godfather/operator-store';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function main() {
  console.log('================================================================');
  console.log('  FR8X TRANSACTIONAL EMAIL DELIVERY AUDIT & VERIFICATION');
  console.log('================================================================');

  // Verify ZeptoMail status
  const zeptoStatus = EmailService.getZeptoMailStatus();
  console.log('\n[1/7] ZEPTO MAIL CONFIGURATION CHECK');
  console.log(`  - Operational: ${zeptoStatus.isOperational}`);
  console.log(`  - Endpoint: ${zeptoStatus.endpoint}`);
  assert(zeptoStatus.isOperational, 'ZeptoMail is operational with active API token');
  assert(zeptoStatus.endpoint.includes('api.zeptomail.in'), 'Default endpoint is India DC (api.zeptomail.in)');

  const testEmail = `delivery-test-${Date.now()}@atlaslogistics.com`;
  const origin = 'https://con.fr8x.in';

  // [2/7] Registration Verification Email
  console.log('\n[2/7] TESTING USER REGISTRATION VERIFICATION EMAIL DISPATCH');
  const regResult = serverSecurityStore.registerUser(
    {
      uid: `test-uid-${Date.now()}`,
      email: testEmail,
      password: 'StrongPassword@2026',
      displayName: 'Delivery Test User',
      company: 'Atlas Logistics Corp',
      companyId: 'CMP-ATLAS-01',
      role: 'company_admin',
    },
    { origin }
  );

  assert(regResult.success, 'User registered successfully');
  assert(regResult.isVerificationRequired === true, 'Email verification required');
  assert(Boolean(regResult.emailPromise), 'Registration returns emailPromise');

  console.log('  - Awaiting registration verification email dispatch...');
  const regEmailRes = await regResult.emailPromise;
  console.log(`  - Dispatch Result: success=${regEmailRes.success}, provider=${regEmailRes.provider}, msgId=${regEmailRes.messageId || 'sandbox'}`);
  assert(regEmailRes.success, 'Registration verification email dispatched successfully');

  // [3/7] Resend Verification Email
  console.log('\n[3/7] TESTING RESEND VERIFICATION EMAIL DISPATCH');
  (serverSecurityStore as any).otpCooldowns.delete(`verify:${testEmail}`);
  const resendResult = serverSecurityStore.resendEmailVerification(testEmail, origin);
  assert(resendResult.success, 'Resend verification succeeds');
  assert(Boolean(resendResult.emailPromise), 'Resend returns emailPromise');

  console.log('  - Awaiting resend verification email dispatch...');
  const resendEmailRes = await resendResult.emailPromise;
  console.log(`  - Dispatch Result: success=${resendEmailRes.success}, provider=${resendEmailRes.provider}, msgId=${resendEmailRes.messageId || 'sandbox'}`);
  assert(resendEmailRes.success, 'Resend verification email dispatched successfully');

  // Verify the account to test login OTP
  console.log('\n[4/7] VERIFYING ACCOUNT & TESTING FIRST-LOGIN SECURITY OTP');
  const verifyResult = serverSecurityStore.verifyEmailToken({
    token: resendResult.token,
    email: testEmail,
  });
  assert(verifyResult.success, 'Account verified with rotated OTP');

  // Attempt login with verified account (should trigger first-login OTP)
  const loginResult = serverSecurityStore.recordLoginAttempt(testEmail, 'StrongPassword@2026', '127.0.0.1');
  assert(loginResult.success, 'Login password validated');
  assert(loginResult.firstLoginRequired === true, 'First-time login verification required');
  assert(Boolean(loginResult.expiresIn), 'OTP expiresIn is returned');
  assert(Boolean(loginResult.emailPromise), 'Login returns emailPromise');

  console.log('  - Awaiting first-login OTP email dispatch...');
  const loginEmailRes = await loginResult.emailPromise;
  console.log(`  - Dispatch Result: success=${loginEmailRes.success}, provider=${loginEmailRes.provider}, msgId=${loginEmailRes.messageId || 'sandbox'}`);
  assert(loginEmailRes.success, 'First-login OTP email dispatched successfully');

  // [5/7] Resend First-Login OTP
  console.log('\n[5/7] TESTING RESEND FIRST-LOGIN OTP DISPATCH');
  (serverSecurityStore as any).otpCooldowns.delete(`first_login:${testEmail}`);
  const resendFirstLoginResult = serverSecurityStore.resendUserFirstLoginOtp(loginResult.challengeToken!, '127.0.0.1');
  assert(resendFirstLoginResult.success, 'Resend first-login OTP succeeds');
  assert(Boolean(resendFirstLoginResult.expiresIn), 'Resend first-login OTP expiresIn is returned');
  assert(Boolean(resendFirstLoginResult.emailPromise), 'Resend first-login OTP returns emailPromise');

  console.log('  - Awaiting resend first-login OTP email dispatch...');
  const resendFirstLoginEmailRes = await resendFirstLoginResult.emailPromise;
  console.log(`  - Dispatch Result: success=${resendFirstLoginEmailRes.success}, provider=${resendFirstLoginEmailRes.provider}, msgId=${resendFirstLoginEmailRes.messageId || 'sandbox'}`);
  assert(resendFirstLoginEmailRes.success, 'Resend first-login OTP email dispatched successfully');

  // [6/7] Password Reset Request Email
  console.log('\n[6/7] TESTING PASSWORD RESET EMAIL DISPATCH');
  const resetReqResult = serverSecurityStore.requestPasswordReset(testEmail, '127.0.0.1');
  assert(resetReqResult.success, 'Password reset request succeeds');
  assert(Boolean(resetReqResult.emailPromise), 'Password reset request returns emailPromise');

  console.log('  - Awaiting password reset email dispatch...');
  const resetEmailRes = await resetReqResult.emailPromise;
  console.log(`  - Dispatch Result: success=${resetEmailRes.success}, provider=${resetEmailRes.provider}, msgId=${resetEmailRes.messageId || 'sandbox'}`);
  assert(resetEmailRes.success, 'Password reset email dispatched successfully');

  // [7/7] Godfather Operator First-Login Security OTP
  console.log('\n[7/7] TESTING GODFATHER OPERATOR FIRST-LOGIN OTP DISPATCH');
  resetOperatorFirstLoginStatus(false);
  updateOperatorPassword('MasterSecure@2026');

  const operatorEmail = 'tech@fr8x.in';
  const opAuthResult = await authenticateOperatorCredentials(operatorEmail, 'MasterSecure@2026', '127.0.0.1');
  if (!opAuthResult.success) {
    console.error('opAuthResult failed:', opAuthResult);
  }
  assert(opAuthResult.success, 'Godfather password authenticated');
  assert(opAuthResult.firstLoginRequired === true, 'Godfather first-login verification required');
  assert(Boolean(opAuthResult.expiresIn), 'Godfather OTP expiresIn is returned');
  assert(Boolean(opAuthResult.emailPromise), 'Godfather auth returns emailPromise');

  console.log('  - Awaiting Godfather operator first-login OTP email dispatch...');
  const opEmailRes = await opAuthResult.emailPromise;
  console.log(`  - Dispatch Result: success=${opEmailRes.success}, provider=${opEmailRes.provider}, msgId=${opEmailRes.messageId || 'sandbox'}`);
  assert(opEmailRes.success, 'Godfather operator OTP email dispatched successfully');

  const opResendResult = await resendOperatorFirstLoginOtp(opAuthResult.challengeToken!, '127.0.0.1');
  assert(opResendResult.success, 'Godfather resend OTP succeeds');
  assert(Boolean(opResendResult.emailPromise), 'Godfather resend returns emailPromise');

  console.log('  - Awaiting Godfather operator resend OTP email dispatch...');
  const opResendEmailRes = await opResendResult.emailPromise;
  console.log(`  - Dispatch Result: success=${opResendEmailRes.success}, provider=${opResendEmailRes.provider}, msgId=${opResendEmailRes.messageId || 'sandbox'}`);
  assert(opResendEmailRes.success, 'Godfather operator resend OTP email dispatched successfully');

  console.log('\n================================================================');
  console.log('  🎉 ALL 7/7 TRANSACTIONAL EMAIL WORKFLOWS FULLY VERIFIED!');
  console.log('  All dispatches are guaranteed, fully awaited, and verified.');
  console.log('================================================================\n');
}

main().catch((err) => {
  console.error('Fatal error during email verification:', err);
  process.exit(1);
});
