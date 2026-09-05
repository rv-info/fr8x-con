import fs from 'fs';
import path from 'path';

// Parse .env.local manually
function loadEnv() {
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
}

loadEnv();

// Explicitly set the correct endpoint
process.env.ZEPTO_MAIL_API_URL = 'https://api.zeptomail.in/v1.1/email';

import { EmailService } from '../lib/email-service';

async function testAll() {
  console.log('Testing EmailService with Endpoint:', process.env.ZEPTO_MAIL_API_URL);

  const testTarget = 'password@fr8x.in';

  console.log('\n--- 1. Testing OTP Email ---');
  const otpRes = await EmailService.sendOtpEmail({
    to: testTarget,
    otpCode: '482910',
    expiryMinutes: 10,
  });
  console.log('OTP Result:', JSON.stringify(otpRes, null, 2));

  console.log('\n--- 2. Testing Password Reset Email ---');
  const pwdResetRes = await EmailService.sendPasswordResetEmail({
    to: testTarget,
    otpCode: '619283',
    resetLink: 'https://con.fr8x.in/reset-password?token=test-token-123',
    expiryMinutes: 15,
  });
  console.log('Password Reset Result:', JSON.stringify(pwdResetRes, null, 2));

  console.log('\n--- 3. Testing Security Alert / Account Block Email ---');
  const secAlertRes = await EmailService.sendSecurityAlertEmail({
    to: testTarget,
    subject: 'Account Locked: Too many failed attempts',
    details: 'Your account has been temporarily locked following 3 consecutive failed login attempts. A password reset OTP has been issued.',
  });
  console.log('Security Alert Result:', JSON.stringify(secAlertRes, null, 2));

  console.log('\n--- 4. Testing Password Changed Confirmation ---');
  const pwdChangedRes = await EmailService.sendPasswordChangedEmail({
    to: testTarget,
    ipAddress: '203.0.113.195',
  });
  console.log('Password Changed Result:', JSON.stringify(pwdChangedRes, null, 2));
}

testAll().catch(console.error);
