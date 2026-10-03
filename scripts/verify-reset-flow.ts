import * as fs from 'fs';
import * as path from 'path';

// Load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const raw = fs.readFileSync(envPath, 'utf8');
  for (const line of raw.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx > 0) {
      const key = trimmed.slice(0, eqIdx).trim();
      let val = trimmed.slice(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = val;
      }
    }
  }
}

import { serverSecurityStore } from '../lib/server-auth-store';

async function testFlow() {
  console.log('1. Initiating password reset request for mgt@raivega.in...');
  const reqRes = serverSecurityStore.requestPasswordReset('mgt@raivega.in', '127.0.0.1');
  console.log('Request response:', reqRes.success, reqRes.message);

  if (reqRes.emailPromise) {
    console.log('Waiting for Zoho ZeptoMail email dispatch...');
    const mailResult = await reqRes.emailPromise;
    console.log('Zoho ZeptoMail dispatch result:', mailResult?.success, mailResult?.messageId);
  }

  // Check active reset OTP in store
  const activeOtp = (serverSecurityStore as any).activeResetOtps.get('mgt@raivega.in');
  console.log('Active reset OTP record exists:', !!activeOtp);

  // Test verifyAndResetPassword using a test password
  const testNewPass = 'Raivega@Pass2026';
  // Note: we don't have the plain OTP directly from activeResetOtps because it's PBKDF2 hashed,
  // but let's test authentication with Password@123 or Raivega@2026 right now:
  const loginRes = serverSecurityStore.recordLoginAttempt('mgt@raivega.in', 'Password@123', '127.0.0.1');
  console.log('Immediate login with Password@123:', loginRes.success, loginRes.message);
}

testFlow().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
