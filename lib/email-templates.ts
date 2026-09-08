/**
 * FR8X Standardized Corporate Email Templates
 * ==============================================================================
 * AESTHETICS & BRANDING SPECIFICATION:
 * - Pure white background (#ffffff) across all containers, body, and cards.
 * - Sharp, accessible dark typography (#111827 / #1f2937 / #374151).
 * - High-contrast CTA buttons and clean structural separators (#e5e7eb).
 * - Strict 3-channel sender separation:
 *     1. password@fr8x.in (Auth, OTP, Verifications, Password Changes, Security Alerts)
 *     2. support@fr8x.in  (Pricing, Billing, Invoices, Customer Support Tickets)
 *     3. tech@fr8x.in     (Technical Notices, Maintenance, Infrastructure Incidents)
 * - Zero plaintext passwords, hashes, session keys, or KMS secrets in any payload.
 * ==============================================================================
 */

export interface WelcomeTemplateParams {
  recipient: string;
  firstName?: string;
  fullName?: string;
  organizationName?: string;
  verificationUrl?: string;
  correlationId?: string;
}

export interface EmailVerificationTemplateParams {
  recipient: string;
  recipientName?: string;
  firstName?: string;
  verificationLink?: string;
  otpCode?: string;
  expiryMinutes?: number;
  expiryTime?: string;
  correlationId?: string;
}

export interface OtpChallengeTemplateParams {
  recipient: string;
  recipientName?: string;
  firstName?: string;
  otpCode: string;
  expiryMinutes?: number;
  correlationId?: string;
}

export interface ForgotPasswordTemplateParams {
  recipient: string;
  recipientName?: string;
  firstName?: string;
  resetLink?: string;
  otpCode?: string;
  expiryMinutes?: number;
  expiryTime?: string;
  correlationId?: string;
}

export interface PasswordResetTemplateParams extends ForgotPasswordTemplateParams {}

export interface PasswordChangedTemplateParams {
  recipient: string;
  recipientName?: string;
  firstName?: string;
  changedAt?: string;
  dateTime?: string;
  ipAddress?: string;
  securityLink?: string;
  correlationId?: string;
}

export interface LoginSecurityAlertTemplateParams {
  recipient: string;
  recipientName?: string;
  firstName?: string;
  dateTime?: string;
  device?: string;
  browser?: string;
  location?: string;
  ipAddress?: string;
  securityLink?: string;
  correlationId?: string;
}

export interface SecurityAlertTemplateParams {
  subject: string;
  details: string;
  correlationId?: string;
  ipAddress?: string;
}

export interface PricingPlanUpdateTemplateParams {
  recipient: string;
  recipientName?: string;
  firstName?: string;
  planName: string;
  billingCycle?: string;
  planStatus?: string;
  renewalDate?: string;
  planDescription?: string;
  dashboardUrl?: string;
  effectiveDate?: string;
  correlationId?: string;
}

export interface BillingIssueTemplateParams {
  recipient: string;
  recipientName?: string;
  firstName?: string;
  planName?: string;
  amount: string;
  paymentDate?: string;
  paymentStatus?: string;
  invoiceId?: string;
  billingUrl?: string;
  dueDate?: string;
  correlationId?: string;
}

export interface SupportTemplateParams {
  recipient: string;
  recipientName?: string;
  firstName?: string;
  ticketId?: string;
  subject?: string;
  message: string;
  createdAt?: string;
  priority?: string;
  ticketUrl?: string;
  senderName?: string;
  correlationId?: string;
}

export interface SupportReplyTemplateParams {
  recipient: string;
  recipientName?: string;
  firstName?: string;
  ticketId: string;
  replyMessage: string;
  agentName?: string;
  originalSubject?: string;
  ticketUrl?: string;
  correlationId?: string;
}

export interface SystemIssueTemplateParams {
  recipient: string;
  recipientName?: string;
  firstName?: string;
  incidentId: string;
  incidentTitle?: string;
  serviceName: string;
  detectedAt?: string;
  status: string;
  incidentDescription: string;
  serviceStatusUrl?: string;
  correlationId?: string;
}

export interface TechnicalNotificationTemplateParams {
  recipient: string;
  recipientName?: string;
  type: 'MAINTENANCE' | 'INCIDENT' | 'RESTORED' | 'GENERAL';
  incidentId?: string;
  title?: string;
  details: string;
  scheduledTime?: string;
  affectedServices?: string[];
  correlationId?: string;
}

export interface TechnicalMaintenanceTemplateParams {
  recipient: string;
  recipientName?: string;
  scheduledTime: string;
  details: string;
  affectedServices?: string[];
  correlationId?: string;
}

export interface TechnicalIncidentTemplateParams {
  recipient: string;
  recipientName?: string;
  incidentId: string;
  details: string;
  severity?: string;
  affectedServices?: string[];
  correlationId?: string;
}

export interface TechnicalRecoveryTemplateParams {
  recipient: string;
  recipientName?: string;
  incidentId: string;
  details: string;
  resolvedTime?: string;
  affectedServices?: string[];
  correlationId?: string;
}

export interface TestEmailTemplateParams {
  recipient: string;
  correlationId?: string;
}

// ─── Pure White & Dark Text HTML Container Wrapper ───────────────────────────

/**
 * Standardized pure white email container with dark text and crisp contrast
 */
function wrapEmailHtml(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FR8X Platform</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff !important;
      color: #111827;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    .email-container {
      max-width: 600px;
      margin: 24px auto;
      background-color: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
    }
    .email-header {
      padding: 24px 32px;
      background-color: #ffffff;
      border-bottom: 1px solid #e5e7eb;
    }
    .brand-title {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.02em;
    }
    .brand-accent {
      color: #0284c7;
    }
    .brand-tag {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #64748b;
      margin-top: 4px;
    }
    .email-body {
      padding: 32px;
      background-color: #ffffff;
      color: #1f2937;
      font-size: 15px;
      line-height: 1.65;
    }
    .email-footer {
      padding: 24px 32px;
      background-color: #ffffff;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
      text-align: center;
      line-height: 1.5;
    }
    .btn-primary {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin: 20px 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .btn-danger {
      display: inline-block;
      background-color: #be123c;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 28px;
      border-radius: 6px;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      margin: 20px 0;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    }
    .code-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .code-digits {
      font-family: 'SFMono-Regular', Consolas, Monaco, monospace;
      font-size: 36px;
      font-weight: 800;
      letter-spacing: 8px;
      color: #0f172a;
    }
    .section-title {
      font-size: 12px;
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin: 24px 0 10px 0;
    }
    .detail-card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 16px 20px;
      margin: 16px 0;
      color: #1f2937;
      font-size: 14px;
      line-height: 1.6;
    }
    .detail-row {
      margin: 6px 0;
    }
    .detail-label {
      font-weight: 700;
      color: #111827;
    }
    .detail-value {
      color: #374151;
    }
    .warning-box {
      background-color: #fff1f2;
      border-left: 3px solid #e11d48;
      padding: 14px 18px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 13px;
      color: #9f1239;
      line-height: 1.5;
    }
    .info-box {
      background-color: #f0fdf4;
      border-left: 3px solid #16a34a;
      padding: 14px 18px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 13px;
      color: #166534;
      line-height: 1.5;
    }
    .security-notice {
      background-color: #fefce8;
      border-left: 3px solid #ca8a04;
      padding: 14px 18px;
      border-radius: 4px;
      margin: 20px 0;
      font-size: 13px;
      color: #854d0e;
      line-height: 1.5;
    }
    p {
      margin: 14px 0;
      color: #1f2937;
    }
    a {
      color: #0284c7;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body style="background-color: #ffffff; margin: 0; padding: 0;">
  ${preheader ? `<span style="display:none;font-size:1px;color:#ffffff;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 20px 10px;">
        <div class="email-container">
          <div class="email-header">
            <div class="brand-title">fr<span class="brand-accent">8</span>x <span style="font-size: 14px; font-weight: 500; color: #64748b;">· Sovereign Enterprise Platform</span></div>
            <div class="brand-tag">Security &amp; Communications</div>
          </div>
          <div class="email-body">
            ${content}
          </div>
          <div class="email-footer">
            <div>This is an official transactional communication from FR8X Platform (<a href="https://fr8x.in" style="color: #6b7280; text-decoration: underline;">fr8x.in</a>).</div>
            <div style="margin-top: 6px;">&copy; ${new Date().getFullYear()} FR8X Sovereign Platform Technologies. All rights reserved.</div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ─── 01. WELCOME / ACCOUNT CREATED (FR8X_WELCOME_USER) ───────────────────────
// FROM: FR8X <password@fr8x.in>
// SUBJECT: Welcome to FR8X — Your Account Has Been Created
// CTA: VERIFY EMAIL ADDRESS

export function renderWelcomeEmail(params: WelcomeTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.fullName ? params.fullName.split(' ')[0] : 'Member');
  const fullName = params.fullName || firstName;
  const email = params.recipient;
  const organizationName = params.organizationName || 'FR8X Network Member';
  const verificationUrl = params.verificationUrl || 'https://con.fr8x.in/verify-email';
  const subject = 'Welcome to FR8X — Your Account Has Been Created';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>Welcome to FR8X.</p>
    <p>Your FR8X account has been successfully created.</p>

    <div class="section-title">ACCOUNT DETAILS</div>
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Name:</span> <span class="detail-value">${fullName}</span></div>
      <div class="detail-row"><span class="detail-label">Email:</span> <span class="detail-value">${email}</span></div>
      <div class="detail-row"><span class="detail-label">Organization:</span> <span class="detail-value">${organizationName}</span></div>
    </div>

    <p>To get started, please verify your email address.</p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${verificationUrl}" class="btn-primary" target="_blank" rel="noopener noreferrer">VERIFY EMAIL ADDRESS</a>
    </div>

    <p style="font-size: 13px; color: #4b5563;">
      If you did not create this account, please contact FR8X Support immediately.
    </p>

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Security Team</strong><br>
      <a href="mailto:password@fr8x.in" style="color: #0284c7;">password@fr8x.in</a>
    </p>
  `, `Welcome to FR8X, ${firstName}. Please verify your email.`);

  const text = `Hello ${firstName},

Welcome to FR8X.

Your FR8X account has been successfully created.

ACCOUNT DETAILS

Name: ${fullName}
Email: ${email}
Organization: ${organizationName}

To get started, please verify your email address:
${verificationUrl}

If you did not create this account, please contact FR8X Support immediately.

Regards,

FR8X Security Team
password@fr8x.in`;

  return { subject, html, text };
}

// ─── 02. EMAIL VERIFICATION (FR8X_EMAIL_VERIFICATION) ────────────────────────
// FROM: FR8X <password@fr8x.in>
// SUBJECT: Verify Your FR8X Email Address
// CTA: VERIFY MY EMAIL

export function renderEmailVerificationEmail(params: EmailVerificationTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.recipientName ? params.recipientName.split(' ')[0] : 'Member');
  const expiryTime = params.expiryTime || (params.expiryMinutes ? (params.expiryMinutes >= 60 ? `${Math.round(params.expiryMinutes / 60)} hours` : `${params.expiryMinutes} minutes`) : '24 hours');
  const verificationLink = params.verificationLink || 'https://con.fr8x.in/verify-email';
  const subject = 'Verify Your FR8X Email Address';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>Please verify your email address to activate your FR8X account.</p>

    ${params.otpCode ? `
    <div class="code-box">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.06em; margin-bottom: 8px;">6-Digit Verification Code</div>
      <div class="code-digits">${params.otpCode}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Expires in ${expiryTime}</div>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 24px 0;">
      <a href="${verificationLink}" class="btn-primary" target="_blank" rel="noopener noreferrer">VERIFY MY EMAIL</a>
    </div>

    <p style="font-size: 14px; color: #374151;">
      This verification link will expire in <strong>${expiryTime}</strong>.
    </p>

    <div class="security-notice">
      <strong>Security Notice:</strong> For your security, do not forward this email or share the verification link with anyone.
    </div>

    <p style="font-size: 13px; color: #6b7280;">
      If you did not create an FR8X account, you can safely ignore this email.
    </p>

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Security Team</strong><br>
      <a href="mailto:password@fr8x.in" style="color: #0284c7;">password@fr8x.in</a>
    </p>
  `, 'Please verify your email address to activate your FR8X account.');

  const text = `Hello ${firstName},

Please verify your email address to activate your FR8X account.

${params.otpCode ? `Your 6-digit verification code is: ${params.otpCode}\n\n` : ''}Verification Link:
${verificationLink}

This verification link will expire in ${expiryTime}.

For your security, do not forward this email or share the verification link with anyone.

If you did not create an FR8X account, you can safely ignore this email.

Regards,

FR8X Security Team
password@fr8x.in`;

  return { subject, html, text };
}

// ─── 03. OTP / SECURITY CODE (FR8X_SECURITY_OTP) ─────────────────────────────
// FROM: FR8X <password@fr8x.in>
// SUBJECT: Your FR8X Verification Code
// Important: Never log or store the OTP unnecessarily.

export function renderOtpChallengeEmail(params: OtpChallengeTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.recipientName ? params.recipientName.split(' ')[0] : 'Member');
  const expiryMinutes = params.expiryMinutes || 10;
  const subject = 'Your FR8X Verification Code';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>Your FR8X verification code is:</p>

    <div class="code-box">
      <div class="code-digits">${params.otpCode}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for ${expiryMinutes} minutes · Single use</div>
    </div>

    <p style="font-size: 14px; color: #374151;">
      This code will expire in <strong>${expiryMinutes} minutes</strong>.
    </p>

    <div class="section-title">SECURITY NOTICE</div>
    <div class="security-notice">
      <p style="margin: 4px 0; font-weight: 700;">Never share this code with anyone.</p>
      <p style="margin: 4px 0;">FR8X Support will never ask you to provide your OTP, password, or security code.</p>
      <p style="margin: 4px 0;">If you did not request this code, please secure your account and contact FR8X Support.</p>
    </div>

    ${params.correlationId ? `
    <div style="font-size: 11px; font-family: monospace; color: #9ca3af; margin-top: 12px;">
      Correlation ID: ${params.correlationId}
    </div>
    ` : ''}

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Security Team</strong><br>
      <a href="mailto:password@fr8x.in" style="color: #0284c7;">password@fr8x.in</a>
    </p>
  `, `Your FR8X verification code is ${params.otpCode}`);

  const text = `Hello ${firstName},

Your FR8X verification code is:

${params.otpCode}

This code will expire in ${expiryMinutes} minutes.

SECURITY NOTICE

Never share this code with anyone.

FR8X Support will never ask you to provide your OTP, password, or security code.

If you did not request this code, please secure your account and contact FR8X Support.

Regards,

FR8X Security Team
password@fr8x.in`;

  return { subject, html, text };
}

// ─── 04. FORGOT PASSWORD (FR8X_FORGOT_PASSWORD) ──────────────────────────────
// FROM: FR8X <password@fr8x.in>
// SUBJECT: Reset Your FR8X Password
// CTA: RESET MY PASSWORD

export function renderForgotPasswordEmail(params: ForgotPasswordTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.recipientName ? params.recipientName.split(' ')[0] : 'Member');
  const expiryTime = params.expiryTime || (params.expiryMinutes ? `${params.expiryMinutes} minutes` : '15 minutes');
  const resetLink = params.resetLink || 'https://con.fr8x.in/reset-password';
  const subject = 'Reset Your FR8X Password';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>We received a request to reset the password associated with your FR8X account.</p>
    <p>You can create a new password by clicking below:</p>

    ${params.otpCode ? `
    <div class="code-box">
      <div style="font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 0.06em; margin-bottom: 8px;">6-Digit Password Reset Code</div>
      <div class="code-digits">${params.otpCode}</div>
      <div style="font-size: 12px; color: #64748b; margin-top: 8px;">Valid for ${expiryTime}</div>
    </div>
    ` : ''}

    <div style="text-align: center; margin: 24px 0;">
      <a href="${resetLink}" class="btn-primary" target="_blank" rel="noopener noreferrer">RESET MY PASSWORD</a>
    </div>

    <p style="font-size: 14px; color: #374151;">
      This password-reset link will expire in <strong>${expiryTime}</strong> and can only be used once.
    </p>

    <div class="info-box">
      If you did not request a password reset, you can safely ignore this email.<br>
      Your current password will remain unchanged.
    </div>

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Security Team</strong><br>
      <a href="mailto:password@fr8x.in" style="color: #0284c7;">password@fr8x.in</a>
    </p>
  `, 'Instructions to reset your FR8X password.');

  const text = `Hello ${firstName},

We received a request to reset the password associated with your FR8X account.

You can create a new password by clicking below:

${params.otpCode ? `Your 6-digit recovery code is: ${params.otpCode}\n\n` : ''}Reset Link:
${resetLink}

This password-reset link will expire in ${expiryTime} and can only be used once.

If you did not request a password reset, you can safely ignore this email.

Your current password will remain unchanged.

Regards,

FR8X Security Team
password@fr8x.in`;

  return { subject, html, text };
}

export function renderPasswordResetEmail(params: PasswordResetTemplateParams) {
  return renderForgotPasswordEmail(params);
}

// ─── 05. PASSWORD CHANGED (FR8X_PASSWORD_CHANGED) ────────────────────────────
// FROM: FR8X <password@fr8x.in>
// SUBJECT: Your FR8X Password Has Been Changed
// CTA: SECURE MY ACCOUNT

export function renderPasswordChangedEmail(params: PasswordChangedTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.recipientName ? params.recipientName.split(' ')[0] : 'Member');
  const email = params.recipient;
  const dateTime = params.dateTime || params.changedAt || new Date().toUTCString();
  const securityLink = params.securityLink || 'https://con.fr8x.in/support';
  const subject = 'Your FR8X Password Has Been Changed';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>Your FR8X account password has been successfully changed.</p>

    <div class="section-title">ACCOUNT</div>
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Email:</span> <span class="detail-value">${email}</span></div>
      <div class="detail-row"><span class="detail-label">Date &amp; Time:</span> <span class="detail-value">${dateTime}</span></div>
      ${params.ipAddress ? `<div class="detail-row"><span class="detail-label">IP Address:</span> <span class="detail-value">${params.ipAddress}</span></div>` : ''}
    </div>

    <p style="font-size: 14px; color: #374151;">
      If you made this change, no further action is required.
    </p>

    <div class="warning-box">
      <strong>Security Alert:</strong> If you did not change your password, your account may be at risk.
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${securityLink}" class="btn-danger" target="_blank" rel="noopener noreferrer">SECURE MY ACCOUNT</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">
      If you need assistance, contact FR8X Support.
    </p>

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Security Team</strong><br>
      <a href="mailto:password@fr8x.in" style="color: #0284c7;">password@fr8x.in</a>
    </p>
  `, 'Your FR8X account password was successfully changed.');

  const text = `Hello ${firstName},

Your FR8X account password has been successfully changed.

ACCOUNT

Email: ${email}
Date & Time: ${dateTime}

If you made this change, no further action is required.

If you did not change your password, your account may be at risk:
${securityLink}

If you need assistance, contact FR8X Support.

Regards,

FR8X Security Team
password@fr8x.in`;

  return { subject, html, text };
}

// ─── 06. LOGIN / SECURITY ALERT (FR8X_LOGIN_SECURITY_ALERT) ──────────────────
// FROM: FR8X <password@fr8x.in>
// SUBJECT: FR8X Security Alert — New Login Detected
// CTA: SECURE MY ACCOUNT

export function renderLoginSecurityAlertEmail(params: LoginSecurityAlertTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.recipientName ? params.recipientName.split(' ')[0] : 'Member');
  const dateTime = params.dateTime || new Date().toUTCString();
  const device = params.device || 'Standard Workstation';
  const browser = params.browser || 'Secure Enterprise Browser';
  const location = params.location || 'Recognized Network Hub';
  const ipAddress = params.ipAddress || 'Origin IP Logged';
  const securityLink = params.securityLink || 'https://con.fr8x.in/support';
  const subject = 'FR8X Security Alert — New Login Detected';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>A new login to your FR8X account was detected.</p>

    <div class="section-title">LOGIN DETAILS</div>
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Date &amp; Time:</span> <span class="detail-value">${dateTime}</span></div>
      <div class="detail-row"><span class="detail-label">Device:</span> <span class="detail-value">${device}</span></div>
      <div class="detail-row"><span class="detail-label">Browser:</span> <span class="detail-value">${browser}</span></div>
      <div class="detail-row"><span class="detail-label">Location:</span> <span class="detail-value">${location}</span></div>
      <div class="detail-row"><span class="detail-label">IP Address:</span> <span class="detail-value">${ipAddress}</span></div>
    </div>

    <p style="font-size: 14px; color: #374151;">
      If this was you, no action is required.
    </p>

    <div class="warning-box">
      <strong>Suspicious Activity?</strong> If you do not recognize this activity, secure your account immediately.
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${securityLink}" class="btn-danger" target="_blank" rel="noopener noreferrer">SECURE MY ACCOUNT</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">
      If you need assistance, contact FR8X Support.
    </p>

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Security Team</strong><br>
      <a href="mailto:password@fr8x.in" style="color: #0284c7;">password@fr8x.in</a>
    </p>
  `, 'A new login to your FR8X account was detected.');

  const text = `Hello ${firstName},

A new login to your FR8X account was detected.

LOGIN DETAILS

Date & Time: ${dateTime}
Device: ${device}
Browser: ${browser}
Location: ${location}
IP Address: ${ipAddress}

If this was you, no action is required.

If you do not recognize this activity, secure your account immediately:
${securityLink}

If you need assistance, contact FR8X Support.

Regards,

FR8X Security Team
password@fr8x.in`;

  return { subject, html, text };
}

export function renderSecurityAlertEmail(params: SecurityAlertTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  return renderLoginSecurityAlertEmail({
    recipient: 'security@fr8x.in',
    firstName: 'Member',
    dateTime: new Date().toUTCString(),
    device: 'Network Node',
    browser: 'Automated Client',
    location: 'Encrypted Enclave',
    ipAddress: params.ipAddress || '127.0.0.1',
  });
}

// ─── 07. PRICING / PLAN / SUBSCRIPTION (FR8X_PRICING_PLAN_UPDATE) ────────────
// FROM: FR8X <support@fr8x.in>
// SUBJECT: FR8X — Your Plan & Pricing Information
// CTA: VIEW MY PLAN

export function renderPricingPlanUpdateEmail(params: PricingPlanUpdateTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.recipientName ? params.recipientName.split(' ')[0] : 'Member');
  const planName = params.planName || 'Enterprise Freight Standard';
  const billingCycle = params.billingCycle || 'Annual Commercial';
  const planStatus = params.planStatus || 'Active & Provisioned';
  const renewalDate = params.renewalDate || 'January 15, 2027';
  const planDescription = params.planDescription || 'Full enterprise access to global shipping lanes, realtime spot freight pricing, instant ocean container booking, and automated KYC/customs clearance.';
  const dashboardUrl = params.dashboardUrl || 'https://con.fr8x.in/dashboard';
  const subject = 'FR8X — Your Plan & Pricing Information';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>Here is the latest information regarding your FR8X account plan.</p>

    <div class="section-title">CURRENT PLAN</div>
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Plan:</span> <span class="detail-value">${planName}</span></div>
      <div class="detail-row"><span class="detail-label">Billing Cycle:</span> <span class="detail-value">${billingCycle}</span></div>
      <div class="detail-row"><span class="detail-label">Status:</span> <span class="detail-value">${planStatus}</span></div>
      <div class="detail-row"><span class="detail-label">Renewal Date:</span> <span class="detail-value">${renewalDate}</span></div>
    </div>

    <div class="section-title">PLAN DETAILS</div>
    <div class="detail-card" style="background-color: #ffffff; border-color: #cbd5e1;">
      <p style="margin: 0; color: #374151;">${planDescription}</p>
    </div>

    <p>You can review your account and available plans from your FR8X dashboard.</p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${dashboardUrl}" class="btn-primary" target="_blank" rel="noopener noreferrer">VIEW MY PLAN</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">
      If you have questions about pricing, billing, or available plans, please contact FR8X Support.
    </p>

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Support Team</strong><br>
      <a href="mailto:support@fr8x.in" style="color: #0284c7;">support@fr8x.in</a>
    </p>
  `, 'Your FR8X account plan and pricing details.');

  const text = `Hello ${firstName},

Here is the latest information regarding your FR8X account plan.

CURRENT PLAN

Plan: ${planName}
Billing Cycle: ${billingCycle}
Status: ${planStatus}
Renewal Date: ${renewalDate}

PLAN DETAILS

${planDescription}

You can review your account and available plans from your FR8X dashboard:
${dashboardUrl}

If you have questions about pricing, billing, or available plans, please contact FR8X Support.

Regards,

FR8X Support Team
support@fr8x.in`;

  return { subject, html, text };
}

// ─── 08. PAYMENT / BILLING ISSUE (FR8X_BILLING_ISSUE) ────────────────────────
// FROM: FR8X <support@fr8x.in>
// SUBJECT: Action Required — FR8X Billing Issue
// CTA: REVIEW BILLING

export function renderBillingIssueEmail(params: BillingIssueTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.recipientName ? params.recipientName.split(' ')[0] : 'Member');
  const email = params.recipient;
  const planName = params.planName || 'Enterprise Subscription';
  const amount = params.amount || '$0.00';
  const paymentDate = params.paymentDate || new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const paymentStatus = params.paymentStatus || 'Payment Failed';
  const billingUrl = params.billingUrl || 'https://con.fr8x.in/dashboard';
  const subject = 'Action Required — FR8X Billing Issue';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>We were unable to complete the latest billing transaction for your FR8X account.</p>

    <div class="section-title">BILLING DETAILS</div>
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Account:</span> <span class="detail-value">${email}</span></div>
      <div class="detail-row"><span class="detail-label">Plan:</span> <span class="detail-value">${planName}</span></div>
      <div class="detail-row"><span class="detail-label">Amount:</span> <span class="detail-value">${amount}</span></div>
      <div class="detail-row"><span class="detail-label">Payment Date:</span> <span class="detail-value">${paymentDate}</span></div>
      <div class="detail-row"><span class="detail-label">Status:</span> <span class="detail-value" style="color: #dc2626; font-weight: 700;">${paymentStatus}</span></div>
    </div>

    <p>Please review your billing information and take the necessary action.</p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${billingUrl}" class="btn-danger" target="_blank" rel="noopener noreferrer">REVIEW BILLING</a>
    </div>

    <p style="font-size: 13px; color: #6b7280;">
      If you believe this message was sent in error or need assistance, contact FR8X Support.
    </p>

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Support Team</strong><br>
      <a href="mailto:support@fr8x.in" style="color: #0284c7;">support@fr8x.in</a>
    </p>
  `, 'Action required regarding your latest FR8X billing transaction.');

  const text = `Hello ${firstName},

We were unable to complete the latest billing transaction for your FR8X account.

BILLING DETAILS

Account: ${email}
Plan: ${planName}
Amount: ${amount}
Payment Date: ${paymentDate}
Status: ${paymentStatus}

Please review your billing information and take the necessary action:
${billingUrl}

If you believe this message was sent in error or need assistance, contact FR8X Support.

Regards,

FR8X Support Team
support@fr8x.in`;

  return { subject, html, text };
}

// ─── 09. SUPPORT TICKET / ISSUE (FR8X_SUPPORT_TICKET) ────────────────────────
// FROM: FR8X <support@fr8x.in>
// SUBJECT: FR8X Support Ticket — {{ticket_id}}
// CTA: VIEW SUPPORT TICKET

export function renderSupportEmail(params: SupportTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.recipientName ? params.recipientName.split(' ')[0] : 'Member');
  const ticketId = params.ticketId || `TCK-${Math.floor(100000 + Math.random() * 900000)}`;
  const ticketSubject = params.subject || 'Platform Inquiry';
  const createdAt = params.createdAt || new Date().toUTCString();
  const priority = params.priority || 'Normal';
  const ticketMessage = params.message;
  const ticketUrl = params.ticketUrl || `https://con.fr8x.in/support?ticket=${ticketId}`;
  const subject = `FR8X Support Ticket — ${ticketId}`;

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>Your support request has been received by FR8X.</p>

    <div class="section-title">TICKET DETAILS</div>
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Ticket ID:</span> <span class="detail-value">${ticketId}</span></div>
      <div class="detail-row"><span class="detail-label">Subject:</span> <span class="detail-value">${ticketSubject}</span></div>
      <div class="detail-row"><span class="detail-label">Created:</span> <span class="detail-value">${createdAt}</span></div>
      <div class="detail-row"><span class="detail-label">Priority:</span> <span class="detail-value">${priority}</span></div>
    </div>

    <div class="section-title">REQUEST</div>
    <div class="detail-card" style="background-color: #ffffff; border-color: #cbd5e1; white-space: pre-wrap;">
      ${ticketMessage}
    </div>

    <p>Our support team will review your request and respond as soon as possible.</p>
    <p style="font-weight: 600; color: #111827;">Please keep your Ticket ID for future communication.</p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${ticketUrl}" class="btn-primary" target="_blank" rel="noopener noreferrer">VIEW SUPPORT TICKET</a>
    </div>

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Support Team</strong><br>
      <a href="mailto:support@fr8x.in" style="color: #0284c7;">support@fr8x.in</a>
    </p>
  `, `FR8X Support Request Received — Ticket ID: ${ticketId}`);

  const text = `Hello ${firstName},

Your support request has been received by FR8X.

TICKET DETAILS

Ticket ID: ${ticketId}
Subject: ${ticketSubject}
Created: ${createdAt}
Priority: ${priority}

REQUEST

${ticketMessage}

Our support team will review your request and respond as soon as possible.

Please keep your Ticket ID for future communication:
${ticketUrl}

Regards,

FR8X Support Team
support@fr8x.in`;

  return { subject, html, text };
}

export function renderSupportTicketEmail(params: SupportTemplateParams) {
  return renderSupportEmail(params);
}

export function renderSupportReplyEmail(params: SupportReplyTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.recipientName ? params.recipientName.split(' ')[0] : 'Member');
  const agentName = params.agentName || 'FR8X Support Specialist';
  const subject = `Re: [${params.ticketId}] ${params.originalSubject || 'FR8X Support Update'}`;

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>A response has been posted to your support inquiry (Ticket: <strong>${params.ticketId}</strong>) by ${agentName}:</p>

    <div class="detail-card" style="background-color: #ffffff; border-left: 3px solid #0284c7; white-space: pre-wrap;">
      ${params.replyMessage}
    </div>

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Support Team</strong><br>
      <a href="mailto:support@fr8x.in" style="color: #0284c7;">support@fr8x.in</a>
    </p>
  `, `Update on Ticket ${params.ticketId}`);

  const text = `Hello ${firstName},

A response has been posted to Ticket ${params.ticketId} by ${agentName}:

${params.replyMessage}

Regards,
FR8X Support Team
support@fr8x.in`;

  return { subject, html, text };
}

// ─── 10. SYSTEM / TECHNICAL ISSUE (FR8X_SYSTEM_ISSUE) ────────────────────────
// FROM: FR8X <tech@fr8x.in>
// SUBJECT: FR8X Technical Notice — {{incident_title}}
// CTA: VIEW SERVICE STATUS

export function renderSystemIssueEmail(params: SystemIssueTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const firstName = params.firstName || (params.recipientName ? params.recipientName.split(' ')[0] : 'Technical Contact');
  const incidentTitle = params.incidentTitle || 'Infrastructure Update';
  const incidentId = params.incidentId;
  const serviceName = params.serviceName;
  const detectedAt = params.detectedAt || new Date().toUTCString();
  const status = params.status;
  const incidentDescription = params.incidentDescription;
  const serviceStatusUrl = params.serviceStatusUrl || 'https://con.fr8x.in/status';
  const subject = `FR8X Technical Notice — ${incidentTitle}`;

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>FR8X has identified a technical issue that may affect some services.</p>

    <div class="section-title">INCIDENT DETAILS</div>
    <div class="detail-card">
      <div class="detail-row"><span class="detail-label">Incident ID:</span> <span class="detail-value">${incidentId}</span></div>
      <div class="detail-row"><span class="detail-label">Service:</span> <span class="detail-value">${serviceName}</span></div>
      <div class="detail-row"><span class="detail-label">Detected:</span> <span class="detail-value">${detectedAt}</span></div>
      <div class="detail-row"><span class="detail-label">Current Status:</span> <span class="detail-value" style="font-weight: 700;">${status}</span></div>
    </div>

    <div class="section-title">DESCRIPTION</div>
    <div class="detail-card" style="background-color: #ffffff; border-color: #cbd5e1; white-space: pre-wrap;">
      ${incidentDescription}
    </div>

    <p>Our technical team is working to resolve the issue.</p>
    <p>No action is required unless otherwise specified.</p>
    <p>We apologize for any inconvenience.</p>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${serviceStatusUrl}" class="btn-primary" target="_blank" rel="noopener noreferrer">VIEW SERVICE STATUS</a>
    </div>

    <p style="margin-top: 28px; color: #374151;">
      Regards,<br><br>
      <strong style="color: #111827;">FR8X Technical Team</strong><br>
      <a href="mailto:tech@fr8x.in" style="color: #0284c7;">tech@fr8x.in</a>
    </p>
  `, `FR8X Technical Notice: ${incidentTitle}`);

  const text = `Hello ${firstName},

FR8X has identified a technical issue that may affect some services.

INCIDENT DETAILS

Incident ID: ${incidentId}
Service: ${serviceName}
Detected: ${detectedAt}
Current Status: ${status}

DESCRIPTION

${incidentDescription}

Our technical team is working to resolve the issue.

No action is required unless otherwise specified.

We apologize for any inconvenience.

View Status:
${serviceStatusUrl}

Regards,

FR8X Technical Team
tech@fr8x.in`;

  return { subject, html, text };
}

export function renderTechnicalEmail(params: TechnicalNotificationTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  return renderSystemIssueEmail({
    recipient: params.recipient,
    recipientName: params.recipientName,
    incidentId: params.incidentId || `INC-${Date.now()}`,
    incidentTitle: params.title || 'Technical Notice',
    serviceName: params.affectedServices?.join(', ') || 'Platform Infrastructure',
    detectedAt: params.scheduledTime || new Date().toUTCString(),
    status: params.type,
    incidentDescription: params.details,
  });
}

export function renderTechnicalMaintenanceEmail(params: TechnicalMaintenanceTemplateParams) {
  return renderSystemIssueEmail({
    recipient: params.recipient,
    recipientName: params.recipientName,
    incidentId: `MNT-${Date.now().toString().slice(-6)}`,
    incidentTitle: 'Scheduled System Maintenance',
    serviceName: params.affectedServices?.join(', ') || 'Core API Services',
    detectedAt: params.scheduledTime,
    status: 'SCHEDULED',
    incidentDescription: params.details,
  });
}

export function renderTechnicalIncidentEmail(params: TechnicalIncidentTemplateParams) {
  return renderSystemIssueEmail({
    recipient: params.recipient,
    recipientName: params.recipientName,
    incidentId: params.incidentId,
    incidentTitle: 'Infrastructure Degraded Notice',
    serviceName: params.affectedServices?.join(', ') || 'Platform Gateway',
    detectedAt: new Date().toUTCString(),
    status: params.severity || 'INVESTIGATING',
    incidentDescription: params.details,
  });
}

export function renderTechnicalRecoveryEmail(params: TechnicalRecoveryTemplateParams) {
  return renderSystemIssueEmail({
    recipient: params.recipient,
    recipientName: params.recipientName,
    incidentId: params.incidentId,
    incidentTitle: 'Service Restored',
    serviceName: params.affectedServices?.join(', ') || 'All Systems Operational',
    detectedAt: params.resolvedTime || new Date().toUTCString(),
    status: 'RESOLVED',
    incidentDescription: params.details,
  });
}

export function renderTestEmail(params?: TestEmailTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'FR8X ZEPTOMAIL TEST';
  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">FR8X Integration Test</p>
    <p>FR8X ZeptoMail integration test successful.</p>
    <div class="info-box">
      <strong>Verification Status:</strong> Connection Active · Credentials Validated
    </div>
  `, 'FR8X ZeptoMail Test');
  const text = 'FR8X ZeptoMail integration test successful.';
  return { subject, html, text };
}
