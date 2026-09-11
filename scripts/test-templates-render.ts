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

console.log('=== AUDITING ALL EMAIL TEMPLATES FOR EXECUTIVE DESIGN STANDARDS ===\n');

let allPassed = true;

for (const t of templates) {
  const res = t.fn();
  const html = res.html;
  const text = res.text;

  // 1. Check no obsolete sovereign branding
  const hasSovereign = /sovereign/i.test(html) || /sovereign/i.test(text);
  // 2. Check rigid 600px MSO responsive table container
  const has600Table = html.includes('max-width: 600px') && html.includes('<!--[if (gte mso 9)|(IE)]>');
  // 3. Verify no childish tags like "SECURITY DISPATCH"
  const hasChildishTag = html.includes('SECURITY DISPATCH');
  // 4. Check executive FR8X branding in header
  const hasExecutiveHeader = html.includes('FR<span style="color: #0284c7;">8</span>X') && html.includes('Enterprise Logistics Platform');
  // 5. Check official enterprise footer
  const hasOfficialFooter = html.includes('FR8X Enterprise Network') && html.includes('fr8x.in') && html.includes('All rights reserved');
  // 6. Check executive signoff in body/signature
  const hasExecutiveSignoff = html.includes('The FR8X Enterprise Team') || html.includes('FR8X Enterprise Team') || html.includes('FR8X Security Team') || html.includes('FR8X Support Team') || html.includes('FR8X Systems Operations') || html.includes('FR8X Team');

  const passed = !hasSovereign && has600Table && !hasChildishTag && hasExecutiveHeader && hasOfficialFooter && hasExecutiveSignoff;
  if (!passed) allPassed = false;

  console.log(`[${passed ? 'PASS' : 'FAIL'}] ${t.name}:`);
  console.log(`       - No Obsolete Sovereign: ${!hasSovereign}`);
  console.log(`       - Rigid 600px MSO Table Layout: ${has600Table}`);
  console.log(`       - No "SECURITY DISPATCH" Tag: ${!hasChildishTag}`);
  console.log(`       - Executive FR8X Header: ${hasExecutiveHeader}`);
  console.log(`       - Official Enterprise Footer: ${hasOfficialFooter}`);
  console.log(`       - Executive Sign-off: ${hasExecutiveSignoff}`);
}

console.log(`\nOVERALL STATUS: ${allPassed ? 'ALL TEMPLATES FABULOUS & 100% ENTERPRISE ALIGNED!' : 'FAILURES DETECTED'}`);

if (!allPassed) {
  process.exit(1);
}
