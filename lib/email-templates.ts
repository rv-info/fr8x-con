/**
 * FR8X Standardized Corporate Email Templates
 * Professional, accessible, responsive HTML templates for Zoho ZeptoMail delivery.
 * IMPORTANT: NEVER include plain-text passwords, hashes, session tokens, or internal secrets.
 */

export interface PasswordResetTemplateParams {
  recipient: string;
  recipientName?: string;
  resetLink?: string;
  otpCode?: string;
  expiryMinutes?: number;
}

export interface PasswordChangedTemplateParams {
  recipient: string;
  recipientName?: string;
  changedAt?: string;
  ipAddress?: string;
  securityLink?: string;
}

export interface OtpChallengeTemplateParams {
  recipient: string;
  recipientName?: string;
  otpCode: string;
  expiryMinutes?: number;
  correlationId?: string;
}

export interface SupportTemplateParams {
  recipient: string;
  recipientName?: string;
  ticketId?: string;
  subject?: string;
  message: string;
  senderName?: string;
  createdAt?: string;
}

export interface SecurityAlertTemplateParams {
  subject: string;
  details: string;
  correlationId?: string;
  ipAddress?: string;
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

export interface TestEmailTemplateParams {
  recipient: string;
  correlationId?: string;
}

/**
 * Common HTML email container wrapper
 */
function wrapEmailHtml(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FR8X Platform</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
    .email-container { max-width: 580px; margin: 30px auto; background-color: #0f172a; border-radius: 12px; border: 1px solid #1e293b; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.4); }
    .email-header { padding: 24px 32px; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-bottom: 1px solid #334155; }
    .brand-title { font-size: 20px; font-weight: 800; color: #ffffff; margin: 0; letter-spacing: -0.02em; }
    .brand-accent { color: #38bdf8; }
    .brand-tag { display: inline-block; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 8px; border-radius: 4px; background: rgba(56, 189, 248, 0.15); color: #38bdf8; margin-top: 6px; }
    .email-body { padding: 32px; color: #cbd5e1; font-size: 14px; line-height: 1.6; }
    .email-footer { padding: 20px 32px; background-color: #090d16; border-top: 1px solid #1e293b; font-size: 11px; color: #64748b; text-align: center; }
    .btn-primary { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 700; font-size: 13px; letter-spacing: 0.04em; margin: 20px 0; text-transform: uppercase; }
    .code-box { background: #020617; border: 1px solid #334155; border-radius: 8px; padding: 20px; text-align: center; margin: 24px 0; }
    .code-digits { font-family: 'SFMono-Regular', Consolas, Monaco, monospace; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #38bdf8; }
    .warning-box { background: rgba(244, 63, 94, 0.1); border-left: 3px solid #f43f5e; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 12px; color: #fda4af; }
    .info-box { background: rgba(56, 189, 248, 0.08); border-left: 3px solid #38bdf8; padding: 12px 16px; border-radius: 4px; margin: 20px 0; font-size: 12px; color: #bae6fd; }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none;font-size:1px;color:#0b1120;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <div class="email-container">
    <div class="email-header">
      <div class="brand-title">fr<span class="brand-accent">8</span>x <span style="font-size: 15px; font-weight: 400; color: #94a3b8;">· Sovereign Enterprise Platform</span></div>
      <span class="brand-tag">Security &amp; Communications</span>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      <div>This is an automated transactional communication from FR8X Platform (fr8x.in).</div>
      <div style="margin-top: 6px;">&copy; ${new Date().getFullYear()} FR8X Platform Technologies. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Mask an email address for privacy and security (e.g. j***e@domain.com)
 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}*@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
}

export interface EmailVerificationTemplateParams {
  recipient: string;
  recipientName?: string;
  verificationLink?: string;
  otpCode?: string;
  expiryMinutes?: number;
}

/**
 * 1. EMAIL VERIFICATION TEMPLATE
 * Requirements:
 * - Sender: password@fr8x.in
 * - Subject: VERIFY YOUR FR8X EMAIL ADDRESS
 * - Action button: VERIFY EMAIL ADDRESS
 * - Secure URL: ${APP_URL}/verify-email/<TOKEN>
 */
export function renderEmailVerificationEmail(params: EmailVerificationTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const expiry = params.expiryMinutes || 1440;
  const subject = 'VERIFY YOUR FR8X EMAIL ADDRESS';
  const firstName = params.recipientName ? params.recipientName.split(' ')[0] : 'Member';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Hello ${firstName},</p>
    <p>Welcome to the FR8X Sovereign Enterprise Platform. To activate your account and verify ownership of corporate address <strong style="color: #f8fafc;">${params.recipient}</strong>, please verify your email address:</p>

    ${params.otpCode ? `
    <div class="code-box">
      <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.08em; margin-bottom: 8px;">Your 6-Digit Email Verification Code</div>
      <div class="code-digits">${params.otpCode}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for ${Math.min(expiry, 60)} minutes</div>
    </div>
    ` : ''}

    ${params.verificationLink ? `
    <p style="text-align: center; margin: 24px 0;">
      <a href="${params.verificationLink}" class="btn-primary" target="_blank" rel="noopener noreferrer">VERIFY EMAIL ADDRESS</a>
    </p>
    <p style="font-size: 11px; color: #64748b; word-break: break-all;">
      Or paste this URL into your secure browser:<br>
      <a href="${params.verificationLink}" style="color: #38bdf8;">${params.verificationLink}</a>
    </p>
    ` : ''}

    <div class="info-box">
      <strong>Notice:</strong> This verification request is valid for ${expiry >= 60 ? `${Math.round(expiry / 60)} hours` : `${expiry} minutes`}. Single-use token protection enforced. Accounts must be verified prior to platform activation.
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
      If you did not register for an account on the FR8X Platform, please disregard this message or contact <a href="mailto:support@fr8x.in" style="color: #38bdf8;">support@fr8x.in</a>.
    </p>
  `, 'Verify your email address for FR8X');

  const text = `Hello ${firstName},

Welcome to FR8X Platform. Please verify your corporate email address (${params.recipient}).

${params.otpCode ? `Verification Code: ${params.otpCode}\n` : ''}${params.verificationLink ? `Verification Link: ${params.verificationLink}\n` : ''}
This link and code will expire in ${expiry >= 60 ? `${Math.round(expiry / 60)} hours` : `${expiry} minutes`}. Single-use only.

If you did not create an account, please ignore this email.

Regards,
FR8X Security Team
password@fr8x.in`;

  return { subject, html, text };
}

/**
 * 2. PASSWORD RESET TEMPLATE
 * Requirements:
 * - Sender: password@fr8x.in
 * - Subject: RESET YOUR FR8X PASSWORD
 * - Action button: RESET PASSWORD
 * - Secure URL: ${APP_URL}/reset-password/<TOKEN>
 */
export function renderPasswordResetEmail(params: PasswordResetTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const expiry = params.expiryMinutes || 15;
  const subject = 'RESET YOUR FR8X PASSWORD';
  const firstName = params.recipientName ? params.recipientName.split(' ')[0] : 'Member';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Hello ${firstName},</p>
    <p>A password reset request was received for your FR8X account associated with <strong style="color: #f8fafc;">${params.recipient}</strong>.</p>
    
    ${params.otpCode ? `
    <p>Use the following 6-digit one-time security code on the recovery page to authorize your password update:</p>
    <div class="code-box">
      <div class="code-digits">${params.otpCode}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for ${expiry} minutes · Single use</div>
    </div>
    ` : ''}

    ${params.resetLink ? `
    <p>Click the secure link below to reset your account password:</p>
    <div style="text-align: center;">
      <a href="${params.resetLink}" class="btn-primary" target="_blank" rel="noopener noreferrer">RESET PASSWORD</a>
    </div>
    <p style="font-size: 11px; color: #64748b; word-break: break-all;">
      Or copy and paste this link into your browser:<br>
      <a href="${params.resetLink}" style="color: #38bdf8;">${params.resetLink}</a>
    </p>
    ` : ''}

    <div class="info-box">
      <strong>Notice:</strong> This security token will expire in <strong>${expiry} minutes</strong>. For your protection, reset tokens can only be used once.
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
      If you did not request this password reset, please disregard this email. Your password will remain unchanged and secure.
    </p>
  `, 'Password reset instructions for your FR8X account');

  const text = `Hello ${firstName},

A password reset request was received for your FR8X account (${params.recipient}).

${params.otpCode ? `Your 6-digit recovery code is: ${params.otpCode}\n(Valid for ${expiry} minutes)\n` : ''}${params.resetLink ? `Reset link: ${params.resetLink}\n` : ''}
This token is valid for ${expiry} minutes and is single-use. If you did not request this reset, please ignore this email. Your account remains secure.

Regards,
FR8X Security Team
password@fr8x.in`;

  return { subject, html, text };
}

/**
 * 3. OTP CHALLENGE / LOGIN VERIFICATION TEMPLATE
 * Requirements:
 * - Sender: password@fr8x.in
 * - Subject: YOUR FR8X VERIFICATION CODE
 * - Strict body format from prompt:
 *   Hello {{First Name}},
 *   Your FR8X verification code is:
 *   {{OTP}}
 *   This code is valid for {{EXPIRY}} minutes.
 *   Do not share this code with anyone, including FR8X support personnel.
 *   Regards,
 *   FR8X Security Team
 *   password@fr8x.in
 */
export function renderOtpChallengeEmail(params: OtpChallengeTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const expiry = params.expiryMinutes || 10;
  const subject = 'YOUR FR8X VERIFICATION CODE';
  const firstName = params.recipientName ? params.recipientName.split(' ')[0] : 'Member';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Hello ${firstName},</p>
    <p>Your FR8X verification code is:</p>

    <div class="code-box">
      <div class="code-digits">${params.otpCode}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for ${expiry} minutes · Single use</div>
    </div>

    <p>This code is valid for <strong>${expiry} minutes</strong>.</p>

    <div class="warning-box">
      <strong>Do not share this code with anyone</strong>, including FR8X support personnel.
    </div>

    ${params.correlationId ? `
    <div style="font-size: 11px; font-family: monospace; color: #475569; margin-top: 16px;">
      Correlation ID: ${params.correlationId}
    </div>
    ` : ''}

    <p style="margin-top: 24px; color: #cbd5e1;">
      Regards,<br>
      <strong>FR8X Security Team</strong><br>
      <a href="mailto:password@fr8x.in" style="color: #38bdf8;">password@fr8x.in</a>
    </p>
  `, `Your verification code is ${params.otpCode}`);

  const text = `Hello ${firstName},

Your FR8X verification code is:

${params.otpCode}

This code is valid for ${expiry} minutes.

Do not share this code with anyone, including FR8X support personnel.

Regards,
FR8X Security Team
password@fr8x.in`;

  return { subject, html, text };
}

/**
 * 4. PASSWORD CHANGED CONFIRMATION TEMPLATE
 * Requirements:
 * - Sender: password@fr8x.in
 * - Subject: YOUR FR8X PASSWORD WAS CHANGED
 * - Date/time, masked email, security warning, action button: SECURE MY ACCOUNT
 */
export function renderPasswordChangedEmail(params: PasswordChangedTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'YOUR FR8X PASSWORD WAS CHANGED';
  const timestamp = params.changedAt || new Date().toUTCString();
  const masked = maskEmail(params.recipient);
  const firstName = params.recipientName ? params.recipientName.split(' ')[0] : 'Member';
  const secureLink = params.securityLink || 'https://con.fr8x.in/support';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Hello ${firstName},</p>
    <p>This is confirmation that the password for your FR8X account (<strong style="color: #f8fafc;">${masked}</strong>) was changed successfully.</p>

    <div class="info-box">
      <strong>Event Details:</strong><br>
      Date/Time: ${timestamp}<br>
      ${params.ipAddress ? `Origin Network IP: ${params.ipAddress}<br>` : ''}
      Status: Password Updated &amp; Verified
    </div>

    <div class="warning-box">
      <strong>Did not make this change?</strong><br>
      If you did not initiate this change, your account may be compromised. Take immediate action to secure your account.
    </div>

    <p style="text-align: center; margin: 20px 0;">
      <a href="${secureLink}" class="btn-primary" target="_blank" rel="noopener noreferrer" style="background-color: #dc2626;">SECURE MY ACCOUNT</a>
    </p>

    <p style="font-size: 12px; color: #94a3b8;">
      Alert FR8X Platform Security immediately at <a href="mailto:password@fr8x.in" style="color: #38bdf8;">password@fr8x.in</a> or <a href="mailto:support@fr8x.in" style="color: #38bdf8;">support@fr8x.in</a> to freeze access.
    </p>

    <p style="margin-top: 24px; color: #cbd5e1;">
      Regards,<br>
      <strong>FR8X Security Team</strong><br>
      <a href="mailto:password@fr8x.in" style="color: #38bdf8;">password@fr8x.in</a>
    </p>
  `, 'Your FR8X password has been changed');

  const text = `Hello ${firstName},

This is confirmation that the password for your FR8X account (${masked}) was changed successfully.

Date/Time: ${timestamp}
${params.ipAddress ? `Origin Network IP: ${params.ipAddress}\n` : ''}Status: Password Updated & Verified

DID NOT MAKE THIS CHANGE?
If you did not initiate this change, please secure your account immediately or contact password@fr8x.in / support@fr8x.in.

Regards,
FR8X Security Team
password@fr8x.in`;

  return { subject, html, text };
}

/**
 * 5. SUPPORT REQUEST / TICKET ACKNOWLEDGEMENT TEMPLATE
 * Requirements:
 * - Sender: support@fr8x.in
 * - Subject: FR8X SUPPORT TICKET CREATED — {{TICKET_ID}}
 * - Ticket ID, user name, safe message details
 */
export function renderSupportEmail(params: SupportTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const ticketRef = params.ticketId || `TIC-${Date.now().toString().slice(-6)}`;
  const subject = params.ticketId
    ? `FR8X SUPPORT TICKET CREATED — ${params.ticketId}`
    : (params.subject || `FR8X SUPPORT TICKET CREATED — ${ticketRef}`);
  const userName = params.senderName || params.recipientName || 'Member';
  const createdAt = params.createdAt || new Date().toUTCString();

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Hello ${userName},</p>
    <p>Thank you for contacting FR8X Member Support. Your support request has been registered in our system.</p>

    <div class="info-box">
      <strong>Support Ticket ID:</strong> <span style="font-family: monospace; font-weight: 700;">${ticketRef}</span><br>
      <strong>Created:</strong> ${createdAt}<br>
      <strong>Account:</strong> ${params.recipient}${params.subject ? `<br><strong>Request Subject:</strong> ${params.subject}` : ''}
    </div>

    <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 8px;">Request Summary</div>
      <div style="color: #e2e8f0; white-space: pre-wrap; font-size: 13px;">${params.message}</div>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      Our enterprise operations team typically responds within 2 business hours. You can reply directly to this email (<a href="mailto:support@fr8x.in" style="color: #38bdf8;">support@fr8x.in</a>) to append additional information or documents.
    </p>

    <p style="margin-top: 24px; color: #cbd5e1;">
      Regards,<br>
      <strong>FR8X Support Operations</strong><br>
      <a href="mailto:support@fr8x.in" style="color: #38bdf8;">support@fr8x.in</a>
    </p>
  `, `Support Ticket ${ticketRef} Created`);

  const text = `Hello ${userName},

Your FR8X support request has been received.

Ticket ID: ${ticketRef}
Created: ${createdAt}
Account: ${params.recipient}
${params.subject ? `Request Subject: ${params.subject}\n` : ''}
Request Summary:
${params.message}

Our team will respond shortly. You may reply directly to this email.

Regards,
FR8X Support Operations
support@fr8x.in`;

  return { subject, html, text };
}

/**
 * 6. TECHNICAL & INFRASTRUCTURE NOTIFICATION TEMPLATE
 * Requirements:
 * - Sender: tech@fr8x.in
 * - Subjects:
 *   - FR8X SYSTEM MAINTENANCE NOTIFICATION
 *   - FR8X SYSTEM INCIDENT — {{INCIDENT_ID}}
 *   - FR8X SYSTEM SERVICE RESTORED — {{INCIDENT_ID}}
 */
export function renderTechnicalEmail(params: TechnicalNotificationTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  let subject = 'FR8X TECHNICAL NOTIFICATION';
  if (params.type === 'MAINTENANCE') {
    subject = 'FR8X SYSTEM MAINTENANCE NOTIFICATION';
  } else if (params.type === 'INCIDENT') {
    subject = `FR8X SYSTEM INCIDENT — ${params.incidentId || 'ALERT'}`;
  } else if (params.type === 'RESTORED') {
    subject = `FR8X SYSTEM SERVICE RESTORED — ${params.incidentId || 'RESOLVED'}`;
  } else if (params.title) {
    subject = params.title;
  }

  const recipientName = params.recipientName || 'FR8X Technical Contact';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Attention: ${recipientName},</p>
    <p>This is an automated infrastructure notification from the FR8X Engineering &amp; Operations Center.</p>

    <div class="info-box">
      <strong>Notification Type:</strong> ${params.type}<br>
      ${params.incidentId ? `<strong>Incident Reference:</strong> <code>${params.incidentId}</code><br>` : ''}
      ${params.scheduledTime ? `<strong>Scheduled Window:</strong> ${params.scheduledTime}<br>` : ''}
      <strong>Timestamp:</strong> ${new Date().toUTCString()}
    </div>

    <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 8px;">Notice Details</div>
      <div style="color: #e2e8f0; white-space: pre-wrap; font-size: 13px;">${params.details}</div>
    </div>

    ${params.affectedServices && params.affectedServices.length > 0 ? `
    <div style="margin: 16px 0; font-size: 12px; color: #94a3b8;">
      <strong>Affected Services / Infrastructure:</strong>
      <ul style="margin: 6px 0 0 16px; padding: 0;">
        ${params.affectedServices.map((s) => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    ` : ''}

    ${params.correlationId ? `
    <div style="font-size: 11px; font-family: monospace; color: #475569; margin-top: 16px;">
      Correlation ID: ${params.correlationId}
    </div>
    ` : ''}

    <p style="margin-top: 24px; color: #cbd5e1;">
      Regards,<br>
      <strong>FR8X Engineering &amp; Platform Infrastructure</strong><br>
      <a href="mailto:tech@fr8x.in" style="color: #38bdf8;">tech@fr8x.in</a>
    </p>
  `, subject);

  const text = `Attention: ${recipientName},

FR8X Infrastructure Notification: ${subject}

Type: ${params.type}
${params.incidentId ? `Incident ID: ${params.incidentId}\n` : ''}${params.scheduledTime ? `Scheduled Window: ${params.scheduledTime}\n` : ''}Timestamp: ${new Date().toUTCString()}

Details:
${params.details}

${params.affectedServices ? `Affected Services:\n${params.affectedServices.map((s) => `- ${s}`).join('\n')}\n` : ''}
Regards,
FR8X Engineering & Platform Infrastructure
tech@fr8x.in`;

  return { subject, html, text };
}

export interface SecurityAlertTemplateParams {
  subject: string;
  details: string;
  correlationId?: string;
  ipAddress?: string;
}

/**
 * 7. SECURITY ALERT TEMPLATE
 */
export function renderSecurityAlertEmail(params: SecurityAlertTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `🚨 [SECURITY ALERT] ${params.subject}`;

  const html = wrapEmailHtml(`
    <div class="warning-box" style="margin-top: 0;">
      <h3 style="margin: 0 0 8px 0; color: #f43f5e; font-size: 15px;">⚠️ Platform Security Alert</h3>
      <p style="margin: 0; font-size: 13px; color: #fee2e2;">${params.details}</p>
    </div>

    <div style="font-size: 11px; font-family: monospace; color: #64748b; margin-top: 16px;">
      Timestamp: ${new Date().toISOString()}<br>
      ${params.ipAddress ? `Origin IP: ${params.ipAddress}<br>` : ''}
      Correlation ID: ${params.correlationId || 'N/A'}
    </div>

    <p style="margin-top: 24px; color: #cbd5e1;">
      Regards,<br>
      <strong>FR8X Security Operations</strong><br>
      <a href="mailto:password@fr8x.in" style="color: #38bdf8;">password@fr8x.in</a>
    </p>
  `, `Security Alert: ${params.subject}`);

  const text = `FR8X SECURITY ALERT: ${params.subject}
Details: ${params.details}
Timestamp: ${new Date().toISOString()}
Correlation ID: ${params.correlationId || 'N/A'}

FR8X Security Operations
password@fr8x.in`;

  return { subject, html, text };
}

/**
 * 8. TEST EMAIL TEMPLATE
 * Requirements:
 * - Sender: password@fr8x.in
 * - Subject: FR8X ZEPTOMAIL TEST
 * - Body: FR8X ZeptoMail integration test successful.
 */
export function renderTestEmail(params?: TestEmailTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const recipient = params?.recipient || 'test@fr8x.in';
  const correlationId = params?.correlationId;
  const subject = 'FR8X ZEPTOMAIL TEST';
  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">FR8X ZeptoMail integration test successful.</p>
    <div class="info-box">
      <strong>Verification Details:</strong><br>
      Sender Identity: password@fr8x.in<br>
      Recipient: ${recipient}<br>
      Timestamp: ${new Date().toUTCString()}<br>
      ${correlationId ? `Correlation ID: <code>${correlationId}</code>` : ''}
    </div>
    <p style="font-size: 12px; color: #94a3b8;">
      This test confirms that the ZeptoMail REST API connection (agent_1 on fr8x.in) is operational and authorized.
    </p>
  `, 'FR8X ZeptoMail Integration Test');

  const text = `FR8X ZeptoMail integration test successful.

Sender: password@fr8x.in
Recipient: ${recipient}
Timestamp: ${new Date().toUTCString()}
Correlation ID: ${correlationId || 'N/A'}

FR8X Platform Security`;

  return { subject, html, text };
}
