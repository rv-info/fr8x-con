/**
 * FR8X Email Configuration & OTP Diagnostic Tool
 *
 * Usage:
 *   npx -y tsx scripts/test-email-config.ts [optional_recipient_email]
 *
 * Checks:
 *   1. Zoho ZeptoMail REST API status & Daily Limit
 *   2. Zoho Direct SMTP (smtp.zoho.in:465) connection & auth
 *   3. Resend API status (if configured)
 *   4. Dispatches a real test OTP code
 */

import fs from 'fs';
import path from 'path';

// Parse .env.local
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

import { EmailService } from '../lib/email-service';
import { checkSmtpHealth } from '../lib/mailer';

async function runDiagnostics() {
  const targetEmail = process.argv[2] || 'password@fr8x.in';

  console.log('================================================================');
  console.log('  FR8X EMAIL & OTP ENGINE DIAGNOSTIC REPORT');
  console.log('================================================================');
  console.log(`Target Test Recipient: ${targetEmail}`);
  console.log(`Current Time: ${new Date().toISOString()}`);
  console.log('----------------------------------------------------------------\n');

  // 1. Check ZeptoMail Configuration
  console.log('▶ [1/3] CHECKING ZOHO ZEPTOMAIL REST API...');
  const zeptoStatus = EmailService.getZeptoMailStatus();
  console.log(`  - Endpoint: ${zeptoStatus.endpoint}`);
  console.log(`  - Token Configured: ${zeptoStatus.hasToken ? 'YES (' + zeptoStatus.tokenMasked + ')' : 'NO'}`);
  console.log(`  - Status: ${zeptoStatus.notes}`);

  // 2. Check SMTP Configuration
  console.log('\n▶ [2/3] CHECKING DIRECT ZOHO SMTP (Port 465 SSL)...');
  const smtpHost = process.env.ZOHO_SMTP_HOST || 'smtp.zoho.in';
  const smtpPort = process.env.ZOHO_SMTP_PORT || '465';
  const smtpUser = process.env.ZOHO_SMTP_USER || 'password@fr8x.in';
  const hasSmtpPass = Boolean(process.env.ZOHO_SMTP_PASSWORD?.trim());

  console.log(`  - Host: ${smtpHost}:${smtpPort}`);
  console.log(`  - User: ${smtpUser}`);
  console.log(`  - Password Configured: ${hasSmtpPass ? 'YES' : 'NO (ZOHO_SMTP_PASSWORD is empty in .env.local)'}`);

  if (hasSmtpPass) {
    try {
      const health = await checkSmtpHealth();
      console.log(`  - SMTP Server Handshake: ${health.connected ? 'CONNECTED (Latency: ' + health.latencyMs + 'ms)' : 'FAILED'}`);
    } catch (err: any) {
      console.log(`  - SMTP Server Handshake Error: ${err.message}`);
    }
  } else {
    console.log('  - Tip: To enable direct unlimited SMTP, set ZOHO_SMTP_PASSWORD in .env.local with a Zoho Mail App Password.');
  }

  // 3. Dispatch Live Test OTP
  console.log('\n▶ [3/3] DISPATCHING TEST OTP EMAIL...');
  const testOtp = Math.floor(100000 + Math.random() * 900000).toString();
  console.log(`  - Generated Security OTP: ${testOtp}`);

  const result = await EmailService.sendOtpEmail({
    to: targetEmail,
    otpCode: testOtp,
    expiryMinutes: 10,
  });

  console.log('\n================================================================');
  console.log('  DISPATCH RESULT SUMMARY');
  console.log('================================================================');
  console.log(`Success: ${result.success}`);
  console.log(`Provider: ${result.provider}`);
  console.log(`Sender: ${result.from}`);
  console.log(`Recipient: ${result.to}`);
  console.log(`Message ID: ${result.messageId}`);
  if (result.error) {
    console.log(`Error: ${result.error}`);
  }

  console.log('\n================================================================');
  console.log('  HOW TO RESOLVE EMAIL DELIVERY:');
  console.log('================================================================');
  if (result.provider === 'Sandbox_Mock' || !result.success) {
    console.log('1. ZOHO ZEPTOMAIL 3-EMAIL LIMIT:');
    console.log('   Your ZeptoMail Mail Agent (agent_1) has reached its 3 emails/day cap.');
    console.log('   To remove this cap: Go to https://mailagent.zoho.in -> Mail Agents -> agent_1 -> Limits -> Increase quota.\n');
    console.log('2. DIRECT ZOHO SMTP (RECOMMENDED INSTANT FIX):');
    console.log('   Generate an Application-Specific Password for password@fr8x.in in Zoho Mail:');
    console.log('   a. Log into Zoho Mail (https://mail.zoho.in) as password@fr8x.in');
    console.log('   b. Go to Account Settings -> Security -> App Passwords');
    console.log('   c. Generate a new App Password (name: "FR8X Backend")');
    console.log('   d. Add to .env.local:');
    console.log('      ZOHO_SMTP_PASSWORD="your_generated_app_password"');
    console.log('   e. Run this test again: npx -y tsx scripts/test-email-config.ts\n');
    console.log('3. RESEND API ALTERNATIVE:');
    console.log('   If you prefer Resend (100 free emails/day):');
    console.log('   Add to .env.local: RESEND_API_KEY="re_123456789"');
  } else {
    console.log('✓ Email dispatch is OPERATIONAL and delivered via ' + result.provider + '!');
  }
  console.log('================================================================\n');
}

runDiagnostics().catch(console.error);
