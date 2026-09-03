/**
 * FR8X Standardized Corporate Email Templates
 * Professional, accessible, responsive HTML templates for Zoho Mail delivery.
 * IMPORTANT: NEVER include plain-text passwords, hashes, session tokens, or internal secrets.
 */

export interface PasswordResetTemplateParams {
  recipient: string;
  resetLink?: string;
  otpCode?: string;
  expiryMinutes?: number;
}

export interface PasswordChangedTemplateParams {
  recipient: string;
  changedAt?: string;
  ipAddress?: string;
}

export interface OtpChallengeTemplateParams {
  recipient: string;
  otpCode: string;
  expiryMinutes?: number;
  correlationId?: string;
}

export interface SupportTemplateParams {
  recipient: string;
  ticketId?: string;
  subject: string;
  message: string;
  senderName?: string;
}

export interface SecurityAlertTemplateParams {
  subject: string;
  details: string;
  correlationId?: string;
  ipAddress?: string;
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
    .btn-primary { display: inline-block; background-color: #0284c7; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 600; font-size: 13px; letter-spacing: 0.02em; margin: 20px 0; }
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
      <div>This is an automated communication from FR8X Platform (con.fr8x.in).</div>
      <div style="margin-top: 6px;">&copy; ${new Date().getFullYear()} FR8X Platform Technologies. All rights reserved.</div>
    </div>
  </div>
</body>
</html>`;
}

export interface EmailVerificationTemplateParams {
  recipient: string;
  verificationLink?: string;
  otpCode?: string;
  expiryMinutes?: number;
}

/**
 * 1. EMAIL VERIFICATION TEMPLATE
 * Requirements:
 * - Subject: "FR8X Verify Your Email"
 * - Body: "Hello, Good Day!", verification link, OTP code, expiry notice.
 * - ZERO plain-text passwords.
 */
export function renderEmailVerificationEmail(params: EmailVerificationTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const expiry = params.expiryMinutes || 1440; // Default 24 hours (1440 mins)
  const subject = 'FR8X Verify Your Email';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Hello, Good Day!</p>
    <p>Welcome to the FR8X Sovereign Enterprise Platform. To activate your account and verify ownership of corporate address <strong style="color: #f8fafc;">${params.recipient}</strong>, please complete verification below:</p>

    ${params.otpCode ? `
    <div class="code-box">
      <div style="font-size: 11px; text-transform: uppercase; color: #94a3b8; letter-spacing: 0.08em; margin-bottom: 8px;">Your 6-Digit Email Verification Code</div>
      <div class="code-digits">${params.otpCode}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for ${Math.min(expiry, 60)} minutes</div>
    </div>
    ` : ''}

    ${params.verificationLink ? `
    <p style="text-align: center; margin: 24px 0;">
      <a href="${params.verificationLink}" class="btn-primary" target="_blank" rel="noopener noreferrer">Verify My Email Address</a>
    </p>
    <p style="font-size: 11px; color: #64748b; word-break: break-all;">
      Or paste this URL into your secure browser:<br>
      <a href="${params.verificationLink}" style="color: #38bdf8;">${params.verificationLink}</a>
    </p>
    ` : ''}

    <div class="info-box">
      <strong>Notice:</strong> This verification request is valid for ${expiry >= 60 ? `${Math.round(expiry / 60)} hours` : `${expiry} minutes`}. Accounts must be verified prior to platform activation.
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
      If you did not register for an account on the FR8X Platform, please disregard this message or contact <a href="mailto:support@fr8x.in" style="color: #38bdf8;">support@fr8x.in</a>.
    </p>
  `, 'Verify your email address for FR8X');

  const text = `Hello, Good Day!

Welcome to FR8X Platform. Please verify your email address (${params.recipient}).

${params.otpCode ? `Verification Code: ${params.otpCode}\n` : ''}${params.verificationLink ? `Verification Link: ${params.verificationLink}\n` : ''}
This link and code will expire in ${expiry >= 60 ? `${Math.round(expiry / 60)} hours` : `${expiry} minutes`}.

If you did not create an account, please ignore this email.

FR8X Platform Security`;

  return { subject, html, text };
}

/**
 * 2. PASSWORD RESET TEMPLATE
 * Requirements:
 * - Subject: "FR8X Password Reset Request"
 * - Body: "Hello, Good Day!", secure link/OTP, expiry notice, ignore if not requested.
 * - ZERO plain-text passwords.
 */
export function renderPasswordResetEmail(params: PasswordResetTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const expiry = params.expiryMinutes || 15;
  const subject = 'FR8X Password Reset Request';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Hello, Good Day!</p>
    <p>A password reset request was received for your FR8X account associated with <strong style="color: #f8fafc;">${params.recipient}</strong>.</p>
    
    ${params.otpCode ? `
    <p>Use the following 6-digit one-time security passkey on the recovery page to authorize your password update:</p>
    <div class="code-box">
      <div class="code-digits">${params.otpCode}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Valid for ${expiry} minutes</div>
    </div>
    ` : ''}

    ${params.resetLink ? `
    <p>Click the secure link below to reset your account password:</p>
    <div style="text-align: center;">
      <a href="${params.resetLink}" class="btn-primary" target="_blank" rel="noopener noreferrer">Reset Your Password</a>
    </div>
    <p style="font-size: 11px; color: #64748b; word-break: break-all;">
      Or copy and paste this link into your browser:<br>
      <a href="${params.resetLink}" style="color: #38bdf8;">${params.resetLink}</a>
    </p>
    ` : ''}

    <div class="info-box">
      <strong>Notice:</strong> This security passkey will expire in <strong>${expiry} minutes</strong>. For your protection, reset tokens can only be used once.
    </div>

    <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
      If you did not request this password reset, please disregard this email. Your password will remain unchanged and secure.
    </p>
  `, 'Password reset instructions for your FR8X account');

  const text = `Hello, Good Day!

A password reset request was received for your FR8X account (${params.recipient}).

${params.otpCode ? `Your 6-digit recovery code is: ${params.otpCode}\n(Valid for ${expiry} minutes)` : ''}
${params.resetLink ? `Reset link: ${params.resetLink}` : ''}

This passkey will expire in ${expiry} minutes. If you did not request this reset, please ignore this email. Your account remains secure.

FR8X Platform Security`;

  return { subject, html, text };
}

/**
 * 3. PASSWORD CHANGED CONFIRMATION TEMPLATE
 * Requirements:
 * - Subject: "FR8X Password Changed Successfully"
 * - Confirmation that password was updated, no passwords included.
 */
export function renderPasswordChangedEmail(params: PasswordChangedTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = 'FR8X Password Changed Successfully';
  const timestamp = params.changedAt || new Date().toUTCString();

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Hello, Good Day!</p>
    <p>This is confirmation that the password for your FR8X account (<strong style="color: #f8fafc;">${params.recipient}</strong>) has been successfully changed.</p>

    <div class="info-box">
      <strong>Event Details:</strong><br>
      Timestamp: ${timestamp}<br>
      ${params.ipAddress ? `Network IP: ${params.ipAddress}<br>` : ''}
      Status: Completed &amp; Verified
    </div>

    <div class="warning-box">
      <strong>Did not make this change?</strong><br>
      If you did not initiate this password change, your account may be compromised. Alert FR8X Platform Security immediately at <a href="mailto:support@fr8x.in" style="color: #f43f5e; font-weight: 600;">support@fr8x.in</a> to freeze access.
    </div>
  `, 'Your FR8X password has been changed');

  const text = `Hello, Good Day!

Your FR8X account password for ${params.recipient} was changed successfully at ${timestamp}.

If you did not authorize this change, please contact support@fr8x.in immediately.

FR8X Platform Security`;

  return { subject, html, text };
}

/**
 * 4. OTP CHALLENGE / LOGIN VERIFICATION TEMPLATE
 * Requirements:
 * - Subject: "FR8X Verification Code"
 * - Body: "Hello, Good Day!", 6-digit code, expiration, security warning.
 */
export function renderOtpChallengeEmail(params: OtpChallengeTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const expiry = params.expiryMinutes || 10;
  const subject = 'FR8X Verification Code';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Hello, Good Day!</p>
    <p>Your one-time authentication verification code for <strong style="color: #f8fafc;">${params.recipient}</strong> is provided below:</p>

    <div class="code-box">
      <div class="code-digits">${params.otpCode}</div>
      <div style="font-size: 11px; color: #64748b; margin-top: 8px;">Expires in ${expiry} minutes · Single use</div>
    </div>

    <div class="warning-box">
      <strong>Security Warning:</strong> Never share this code with anyone. FR8X staff will never ask for your passkey or OTP.
    </div>

    ${params.correlationId ? `
    <div style="font-size: 11px; font-family: monospace; color: #475569; margin-top: 16px;">
      Correlation ID: ${params.correlationId}
    </div>
    ` : ''}
  `, `Your verification code is ${params.otpCode}`);

  const text = `Hello, Good Day!

FR8X Verification Code: ${params.otpCode}
Valid for ${expiry} minutes. Never share this code with anyone.
Correlation ID: ${params.correlationId || 'N/A'}

FR8X Platform Security`;

  return { subject, html, text };
}

/**
 * 4. SUPPORT REQUEST / TICKET ACKNOWLEDGEMENT TEMPLATE
 */
export function renderSupportEmail(params: SupportTemplateParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = params.subject || 'FR8X Support Request';

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #ffffff; margin-top: 0;">Hello, Good Day!</p>
    <p>Thank you for contacting FR8X Member Support. Your message has been received by our enterprise operations team.</p>

    ${params.ticketId ? `
    <div class="info-box">
      <strong>Ticket Reference:</strong> <span style="font-family: monospace;">#${params.ticketId}</span>
    </div>
    ` : ''}

    <div style="background: #020617; border: 1px solid #1e293b; border-radius: 8px; padding: 18px; margin: 20px 0;">
      <div style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-bottom: 8px;">Message Details</div>
      <div style="color: #e2e8f0; white-space: pre-wrap; font-size: 13px;">${params.message}</div>
    </div>

    <p style="font-size: 13px; color: #94a3b8;">
      Our team typically responds within 2 business hours. You can reply directly to this email (<a href="mailto:support@fr8x.in" style="color: #38bdf8;">support@fr8x.in</a>) to append additional documentation.
    </p>
  `, 'Your FR8X support request has been received');

  const text = `Hello, Good Day!

Your FR8X support request has been received.

${params.ticketId ? `Ticket ID: #${params.ticketId}\n` : ''}
Message:
${params.message}

Our team will respond shortly. You may reply to this email at support@fr8x.in.

FR8X Support Team`;

  return { subject, html, text };
}

/**
 * 5. SECURITY ALERT TEMPLATE
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
  `, `Security Alert: ${params.subject}`);

  const text = `FR8X SECURITY ALERT: ${params.subject}
Details: ${params.details}
Timestamp: ${new Date().toISOString()}
Correlation ID: ${params.correlationId || 'N/A'}`;

  return { subject, html, text };
}
