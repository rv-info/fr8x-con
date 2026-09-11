/**
 * Test all 10 EmailService transactional email flows via FR8X_PRODUCTION Agent on api.zeptomail.in
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

import { EmailService } from '../lib/email-service';

async function runAll10Tests() {
  const targetEmail = process.argv[2] || 'tech@fr8x.in';

  console.log('================================================================');
  console.log('  FR8X — PRODUCTION ZEPTOMAIL REST API ALL 10 EMAIL FLOWS TEST  ');
  console.log('================================================================');
  
  const zeptoStatus = EmailService.getZeptoMailStatus();
  console.log(`Agent:            ${zeptoStatus.agent}`);
  console.log(`Endpoint:         ${zeptoStatus.endpoint}`);
  console.log(`Token Status:     ${zeptoStatus.hasToken ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
  console.log(`Target Recipient: ${targetEmail}`);
  console.log('----------------------------------------------------------------\n');

  if (!zeptoStatus.hasToken) {
    console.error('❌ ZEPTO_MAIL_API_KEY is not configured in .env.local');
    process.exit(1);
  }

  const results: { flow: string; sender: string; success: boolean; msgId?: string; error?: string }[] = [];

  // 1. Welcome Email (password@fr8x.in)
  console.log('[1/10] Testing sendWelcome()...');
  try {
    const res = await EmailService.sendWelcome({
      recipient: targetEmail,
      firstName: 'Rajat',
      fullName: 'Rajat Kumar Rai',
      organizationName: 'FR8X Technologies',
      verificationUrl: 'https://con.fr8x.in/verify-email?token=demo-token',
    });
    console.log(`  -> Success: ${res.success} | Provider: ${res.provider} | MsgId: ${res.messageId || 'N/A'}`);
    results.push({ flow: 'Welcome Email', sender: 'password@fr8x.in', success: res.success, msgId: res.messageId, error: res.error });
  } catch (err: any) {
    console.error('  -> Failed:', err.message);
    results.push({ flow: 'Welcome Email', sender: 'password@fr8x.in', success: false, error: err.message });
  }

  // 2. Email Verification (password@fr8x.in)
  console.log('\n[2/10] Testing sendVerification()...');
  try {
    const res = await EmailService.sendVerification({
      recipient: targetEmail,
      recipientName: 'Rajat Kumar Rai',
      verificationLink: 'https://con.fr8x.in/verify-email?token=test-verif-token',
      otpCode: '849201',
      expiryMinutes: 1440,
    });
    console.log(`  -> Success: ${res.success} | Provider: ${res.provider} | MsgId: ${res.messageId || 'N/A'}`);
    results.push({ flow: 'Email Verification', sender: 'password@fr8x.in', success: res.success, msgId: res.messageId, error: res.error });
  } catch (err: any) {
    console.error('  -> Failed:', err.message);
    results.push({ flow: 'Email Verification', sender: 'password@fr8x.in', success: false, error: err.message });
  }

  // 3. Security OTP (password@fr8x.in)
  console.log('\n[3/10] Testing sendSecurityOtp()...');
  try {
    const res = await EmailService.sendSecurityOtp({
      recipient: targetEmail,
      recipientName: 'Rajat Kumar Rai',
      otpCode: '582914',
      expiryMinutes: 1,
    });
    console.log(`  -> Success: ${res.success} | Provider: ${res.provider} | MsgId: ${res.messageId || 'N/A'}`);
    results.push({ flow: 'Security OTP (15s)', sender: 'password@fr8x.in', success: res.success, msgId: res.messageId, error: res.error });
  } catch (err: any) {
    console.error('  -> Failed:', err.message);
    results.push({ flow: 'Security OTP (15s)', sender: 'password@fr8x.in', success: false, error: err.message });
  }

  // 4. Forgot Password (password@fr8x.in)
  console.log('\n[4/10] Testing sendForgotPassword()...');
  try {
    const res = await EmailService.sendForgotPassword({
      recipient: targetEmail,
      recipientName: 'Rajat Kumar Rai',
      resetLink: 'https://con.fr8x.in/reset-password?token=demo-reset-token',
      otpCode: '319402',
      expiryMinutes: 15,
    });
    console.log(`  -> Success: ${res.success} | Provider: ${res.provider} | MsgId: ${res.messageId || 'N/A'}`);
    results.push({ flow: 'Forgot Password', sender: 'password@fr8x.in', success: res.success, msgId: res.messageId, error: res.error });
  } catch (err: any) {
    console.error('  -> Failed:', err.message);
    results.push({ flow: 'Forgot Password', sender: 'password@fr8x.in', success: false, error: err.message });
  }

  // 5. Password Changed (password@fr8x.in)
  console.log('\n[5/10] Testing sendPasswordChanged()...');
  try {
    const res = await EmailService.sendPasswordChanged({
      recipient: targetEmail,
      recipientName: 'Rajat Kumar Rai',
      changedAt: new Date().toUTCString(),
      ipAddress: '127.0.0.1 (Diagnostic Test)',
      securityLink: 'https://con.fr8x.in/account/security',
    });
    console.log(`  -> Success: ${res.success} | Provider: ${res.provider} | MsgId: ${res.messageId || 'N/A'}`);
    results.push({ flow: 'Password Changed', sender: 'password@fr8x.in', success: res.success, msgId: res.messageId, error: res.error });
  } catch (err: any) {
    console.error('  -> Failed:', err.message);
    results.push({ flow: 'Password Changed', sender: 'password@fr8x.in', success: false, error: err.message });
  }

  // 6. Login Security Alert (password@fr8x.in)
  console.log('\n[6/10] Testing sendLoginSecurityAlert()...');
  try {
    const res = await EmailService.sendLoginSecurityAlert({
      to: targetEmail,
      subject: 'FR8X Security Alert: New Login Detected',
      details: 'Chrome on Windows 11 (Diagnostic Test)',
      ipAddress: '127.0.0.1',
    });
    console.log(`  -> Success: ${res.success} | Provider: ${res.provider} | MsgId: ${res.messageId || 'N/A'}`);
    results.push({ flow: 'Login Security Alert', sender: 'password@fr8x.in', success: res.success, msgId: res.messageId, error: res.error });
  } catch (err: any) {
    console.error('  -> Failed:', err.message);
    results.push({ flow: 'Login Security Alert', sender: 'password@fr8x.in', success: false, error: err.message });
  }

  // 7. Pricing Plan Update (support@fr8x.in)
  console.log('\n[7/10] Testing sendPricingPlanUpdate()...');
  try {
    const res = await EmailService.sendPricingPlanUpdate({
      recipient: targetEmail,
      firstName: 'Rajat',
      planName: 'Enterprise Freight Forwarder Pro',
      effectiveDate: new Date().toISOString().split('T')[0],
      dashboardUrl: 'https://con.fr8x.in/billing',
    });
    console.log(`  -> Success: ${res.success} | Provider: ${res.provider} | MsgId: ${res.messageId || 'N/A'}`);
    results.push({ flow: 'Pricing Plan Update', sender: 'support@fr8x.in', success: res.success, msgId: res.messageId, error: res.error });
  } catch (err: any) {
    console.error('  -> Failed:', err.message);
    results.push({ flow: 'Pricing Plan Update', sender: 'support@fr8x.in', success: false, error: err.message });
  }

  // 8. Billing Issue (support@fr8x.in)
  console.log('\n[8/10] Testing sendBillingIssue()...');
  try {
    const res = await EmailService.sendBillingIssue({
      recipient: targetEmail,
      firstName: 'Rajat',
      invoiceId: 'INV-2026-FR8X-0089',
      amount: '$1,450.00 USD',
      dueDate: 'Immediate Attention',
      billingUrl: 'https://con.fr8x.in/billing/invoices/INV-2026-FR8X-0089',
    });
    console.log(`  -> Success: ${res.success} | Provider: ${res.provider} | MsgId: ${res.messageId || 'N/A'}`);
    results.push({ flow: 'Billing Issue', sender: 'support@fr8x.in', success: res.success, msgId: res.messageId, error: res.error });
  } catch (err: any) {
    console.error('  -> Failed:', err.message);
    results.push({ flow: 'Billing Issue', sender: 'support@fr8x.in', success: false, error: err.message });
  }

  // 9. Support Ticket (support@fr8x.in)
  console.log('\n[9/10] Testing sendSupportTicket()...');
  try {
    const res = await EmailService.sendSupportTicket({
      recipient: targetEmail,
      recipientName: 'Rajat Kumar Rai',
      ticketId: 'TICK-FR8X-90812',
      subject: 'API Integration Assistance',
      message: 'Your ticket has been received by FR8X Enterprise Support.',
      senderName: 'FR8X Support Operations',
    });
    console.log(`  -> Success: ${res.success} | Provider: ${res.provider} | MsgId: ${res.messageId || 'N/A'}`);
    results.push({ flow: 'Support Ticket', sender: 'support@fr8x.in', success: res.success, msgId: res.messageId, error: res.error });
  } catch (err: any) {
    console.error('  -> Failed:', err.message);
    results.push({ flow: 'Support Ticket', sender: 'support@fr8x.in', success: false, error: err.message });
  }

  // 10. System Issue (tech@fr8x.in)
  console.log('\n[10/10] Testing sendSystemIssue()...');
  try {
    const res = await EmailService.sendSystemIssue({
      recipient: targetEmail,
      recipientName: 'Technical Contact',
      type: 'UPDATE',
      incidentId: 'INC-2026-SYS-01',
      title: 'Scheduled System Performance Optimization',
      details: 'FR8X Core Logistics Network scheduled maintenance completed successfully.',
      affectedServices: ['Rates Engine', 'Auction WebSocket Relay', 'ZeptoMail Dispatcher'],
    });
    console.log(`  -> Success: ${res.success} | Provider: ${res.provider} | MsgId: ${res.messageId || 'N/A'}`);
    results.push({ flow: 'System Issue', sender: 'tech@fr8x.in', success: res.success, msgId: res.messageId, error: res.error });
  } catch (err: any) {
    console.error('  -> Failed:', err.message);
    results.push({ flow: 'System Issue', sender: 'tech@fr8x.in', success: false, error: err.message });
  }

  console.log('\n================================================================');
  console.log('                      TEST SUMMARY RESULTS                      ');
  console.log('================================================================');
  let passed = 0;
  for (const r of results) {
    const statusIcon = r.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${statusIcon} | ${r.flow.padEnd(25)} | Sender: ${r.sender.padEnd(18)} | ${r.msgId ? 'MsgID: ' + r.msgId : (r.error || '')}`);
    if (r.success) passed++;
  }
  console.log('----------------------------------------------------------------');
  console.log(`TOTAL: ${passed}/${results.length} PASSED`);
  console.log('================================================================\n');

  if (passed !== results.length) {
    process.exit(1);
  }
}

runAll10Tests();
