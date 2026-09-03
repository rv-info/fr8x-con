/**
 * FR8X Local Safe Zoho Flow Webhook Tester
 *
 * Usage:
 * npx tsx scripts/test-zoho-flow.ts [recipient@company.com]
 *
 * IMPORTANT SECURITY RULES:
 * - Reads ZOHO_FLOW_WEBHOOK_URL from environment
 * - NEVER prints the webhook secret or API key
 * - Uses developer-controlled test recipient only
 */

import { sendEmail, getEmailSendersStatus, EMAIL_SENDERS } from '../lib/email-service';

async function main() {
  const recipient = process.argv[2] || process.env.TEST_EMAIL_RECIPIENT || 'tech@fr8x.in';

  console.log('=== FR8X Zoho Flow Webhook Safe Dispatch Test ===');
  console.log(`Target Recipient: ${recipient}`);

  const status = getEmailSendersStatus();
  console.log('\nEmail Senders Status:');
  console.log(`- SUPPORT (${EMAIL_SENDERS.SUPPORT}): ${status.SUPPORT.isOperational ? 'OPERATIONAL' : 'PENDING'}`);
  console.log(`  Notes: ${status.SUPPORT.notes}`);
  console.log(`- PASSWORD (${EMAIL_SENDERS.PASSWORD}): ${status.PASSWORD.isOperational ? 'OPERATIONAL' : 'ARCHITECTURALLY READY'}`);
  console.log(`  Notes: ${status.PASSWORD.notes}`);

  const webhookConfigured = Boolean(process.env.ZOHO_FLOW_WEBHOOK_URL);
  console.log(`\nWebhook Configured in Environment: ${webhookConfigured ? 'YES' : 'NO (Sandbox Mode Active)'}`);

  console.log('\n1. Dispatching Diagnostic Support Test Email...');
  const supportResult = await sendEmail({
    fromType: 'SUPPORT',
    to: recipient,
    subject: `[FR8X DIAGNOSTIC] Zoho Flow Verification — ${new Date().toISOString()}`,
    message: 'Hello, Good Day!\n\nThis is a verified test dispatch from the FR8X core engine via Zoho Flow to Zoho Mail.\n\nSender: support@fr8x.in',
    event: 'SUPPORT_REQUEST',
  });

  console.log('Support Dispatch Result:', {
    success: supportResult.success,
    event: supportResult.event,
    fromType: supportResult.fromType,
    sender: supportResult.sender,
    provider: supportResult.provider,
    correlationId: supportResult.correlationId,
    error: supportResult.error,
  });

  console.log('\n2. Testing Password Dispatch Pipeline (Architecturally Isolated)...');
  const passwordResult = await sendEmail({
    fromType: 'PASSWORD',
    to: recipient,
    subject: `[FR8X DIAGNOSTIC] Password Flow Verification — ${new Date().toISOString()}`,
    message: 'Hello, Good Day!\n\nThis is a verification test dispatch for the password pipeline.\n\nSender: password@fr8x.in',
    event: 'PASSWORD_RESET',
  });

  console.log('Password Dispatch Result:', {
    success: passwordResult.success,
    event: passwordResult.event,
    fromType: passwordResult.fromType,
    sender: passwordResult.sender,
    provider: passwordResult.provider,
    isPasswordConfigured: passwordResult.isPasswordConfigured,
    correlationId: passwordResult.correlationId,
    error: passwordResult.error,
  });

  console.log('\n=== Local Dispatch Test Completed ===');
}

main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
