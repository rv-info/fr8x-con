import {
  renderWelcomeEmail,
  renderEmailVerificationEmail,
  renderOtpChallengeEmail,
  renderForgotPasswordEmail,
  renderPasswordChangedEmail,
  renderLoginSecurityAlertEmail,
  renderPricingPlanUpdateEmail,
  renderBillingIssueEmail,
  renderSupportEmail,
  renderSupportReplyEmail,
  renderSystemIssueEmail,
  renderTestEmail,
} from '../lib/email-templates';

const templates = [
  { name: 'Welcome', fn: () => renderWelcomeEmail({ recipient: 'user@example.com', fullName: 'John Doe' }) },
  { name: 'Email Verification', fn: () => renderEmailVerificationEmail({ recipient: 'user@example.com', otpCode: '492815' }) },
  { name: 'OTP Challenge', fn: () => renderOtpChallengeEmail({ recipient: 'user@example.com', otpCode: '827104' }) },
  { name: 'Forgot Password', fn: () => renderForgotPasswordEmail({ recipient: 'user@example.com', otpCode: '194726' }) },
  { name: 'Password Changed', fn: () => renderPasswordChangedEmail({ recipient: 'user@example.com' }) },
  { name: 'Login Security Alert', fn: () => renderLoginSecurityAlertEmail({ recipient: 'user@example.com' }) },
  { name: 'Pricing Plan Update', fn: () => renderPricingPlanUpdateEmail({ recipient: 'user@example.com', planName: 'Global Enterprise Plan' }) },
  { name: 'Billing Issue', fn: () => renderBillingIssueEmail({ recipient: 'user@example.com', amount: '$450.00' }) },
  { name: 'Support Ticket', fn: () => renderSupportEmail({ recipient: 'user@example.com', message: 'Assistance required with customs export code.' }) },
  { name: 'Support Reply', fn: () => renderSupportReplyEmail({ recipient: 'user@example.com', ticketId: 'TCK-9921', replyMessage: 'We have updated your export credentials.' }) },
  { name: 'System Issue', fn: () => renderSystemIssueEmail({ recipient: 'user@example.com', incidentId: 'INC-2026-01', serviceName: 'Pricing API', status: 'INVESTIGATING', incidentDescription: 'Latency identified on pricing cluster.' }) },
  { name: 'Test Email', fn: () => renderTestEmail() },
];

console.log('=== AUDITING ALL EMAIL TEMPLATES ===\n');

let allPassed = true;

for (const t of templates) {
  const res = t.fn();
  const html = res.html;
  const text = res.text;

  // Check sovereign
  const hasSovereign = /sovereign/i.test(html) || /sovereign/i.test(text);
  // Check header
  const hasHeader = html.includes('FR<span class="brand-accent">8</span>X') && html.includes('FR8X TEAM');
  // Check footer
  const hasFooter = html.includes('&copy;') && html.includes('FR8X. All rights reserved.') && html.includes('fr8x.in');
  // Check signoff
  const hasSignoff = (html.includes('FR8X Team</strong>') || html.includes('FR8X Team<')) && text.includes('FR8X Team');
  // Check pure white bg
  const hasWhiteBg = html.includes('background-color: #ffffff');

  const passed = !hasSovereign && hasHeader && hasFooter && hasSignoff && hasWhiteBg;
  if (!passed) allPassed = false;

  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${t.name}:`);
  console.log(`       - No Sovereign: ${!hasSovereign}`);
  console.log(`       - FR8X / FR8X TEAM Header: ${hasHeader}`);
  console.log(`       - Pure White Background: ${hasWhiteBg}`);
  console.log(`       - FR8X Team Sign-off: ${hasSignoff}`);
  console.log(`       - Official Footer: ${hasFooter}`);
}

console.log(`\nOVERALL STATUS: ${allPassed ? 'ALL TEMPLATES FABULOUS & 100% ALIGNED!' : 'FAILURES DETECTED'}`);
