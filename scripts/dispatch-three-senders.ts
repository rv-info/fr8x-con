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

async function dispatchFromAllSenders() {
  console.log('================================================================================');
  console.log('  FR8X — DISPATCHING TRANSACTIONAL EMAILS ACROSS ALL 3 VERIFIED IDENTITIES');
  console.log('================================================================================');

  const targetRecipient = process.argv[2] || 'tech@fr8x.in'; // Allows 'npx tsx scripts/dispatch-three-senders.ts myemail@domain.com'
  const correlationIdBase = `FR8X-DIAG-${Date.now()}`;

  // ─────────────────────────────────────────────────────────────────────────────
  // 1. SENDER: PASSWORD@FR8X.IN
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--------------------------------------------------------------------------------');
  console.log('📬 [1/3] SENDER: PASSWORD@FR8X.IN (Security & Authentication)');
  console.log('--------------------------------------------------------------------------------');
  console.log('• Event:        OTP Challenge & Password Reset');
  console.log('• From:         password@fr8x.in (FR8X Security)');
  console.log('• To:          ', targetRecipient);
  console.log('• Subject:      RESET YOUR FR8X PASSWORD');
  console.log('• OTP Code:     849201 (Valid 15 mins)');
  console.log('• Reset Link:   https://con.fr8x.in/reset-password?token=sec_rec_993812');

  const passwordResult = await EmailService.sendPasswordResetEmail({
    to: targetRecipient,
    recipientName: 'Rajat Kumar Rai',
    otpCode: '849201',
    resetLink: 'https://con.fr8x.in/reset-password?token=sec_rec_993812',
    expiryMinutes: 15,
    correlationId: `${correlationIdBase}-PWD`,
  });

  console.log('• Dispatch Result:', JSON.stringify(passwordResult, null, 2));

  // ─────────────────────────────────────────────────────────────────────────────
  // 2. SENDER: SUPPORT@FR8X.IN
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--------------------------------------------------------------------------------');
  console.log('📬 [2/3] SENDER: SUPPORT@FR8X.IN (Customer Operations & Tickets)');
  console.log('--------------------------------------------------------------------------------');
  console.log('• Event:        Customer Support Ticket Created');
  console.log('• From:         support@fr8x.in (FR8X Support)');
  console.log('• To:          ', targetRecipient);
  console.log('• Subject:      FR8X SUPPORT TICKET CREATED — TCK-849102');
  console.log('• Ticket ID:    TCK-849102');
  console.log('• Message:      Your priority support inquiry regarding KYC verification has been logged.');

  const supportResult = await EmailService.sendSupportEmail({
    to: targetRecipient,
    recipientName: 'Rajat Kumar Rai',
    ticketId: 'TCK-849102',
    subject: 'KYC Verification & Rate Capsule Inquiry',
    message: 'Your inquiry regarding KYC document verification and smart rate capsule sharing has been escalated to enterprise support. A dedicated desk specialist will respond within 30 minutes.',
    senderName: 'FR8X Client Desk',
    correlationId: `${correlationIdBase}-SUP`,
  });

  console.log('• Dispatch Result:', JSON.stringify(supportResult, null, 2));

  // ─────────────────────────────────────────────────────────────────────────────
  // 3. SENDER: TECH@FR8X.IN
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n--------------------------------------------------------------------------------');
  console.log('📬 [3/3] SENDER: TECH@FR8X.IN (Engineering & System Operations)');
  console.log('--------------------------------------------------------------------------------');
  console.log('• Event:        System Maintenance & Infrastructure Status');
  console.log('• From:         tech@fr8x.in (FR8X Engineering)');
  console.log('• To:          ', targetRecipient);
  console.log('• Subject:      FR8X SYSTEM MAINTENANCE NOTIFICATION');
  console.log('• Incident ID:  INC-2026-SYS-09');
  console.log('• Details:      Scheduled database indexing and cache warming window.');

  const techResult = await EmailService.sendTechnicalEmail({
    to: targetRecipient,
    recipientName: 'Rajat Kumar Rai',
    type: 'MAINTENANCE',
    incidentId: 'INC-2026-SYS-09',
    title: 'Global Freight Index Cache Optimization',
    details: 'The sovereign pricing index and reverse auction cluster are undergoing routine zero-downtime optimization. All real-time bid streams remain fully operational.',
    scheduledTime: 'Saturday, 05 Sep 2026 23:00 UTC',
    affectedServices: ['Rates Search Cache', 'Live Vessel AIS Feeds'],
    correlationId: `${correlationIdBase}-TEC`,
  });

  console.log('• Dispatch Result:', JSON.stringify(techResult, null, 2));

  console.log('\n================================================================================');
  console.log('  DISPATCH SUMMARY ACROSS ALL 3 IDENTITIES COMPLETED');
  console.log('================================================================================');
}

dispatchFromAllSenders().catch(console.error);
