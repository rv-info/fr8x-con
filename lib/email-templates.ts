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
 * Standardized executive email container with 600px constraint, MSO Outlook support,
 * and high-contrast enterprise styling.
 */
function wrapEmailHtml(content: string, preheader = ''): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>FR8X</title>
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; outline: none; text-decoration: none; }
    body {
      margin: 0;
      padding: 0;
      width: 100% !important;
      height: 100% !important;
      background-color: #f8fafc;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
    }
    table {
      border-collapse: collapse !important;
    }
    .btn-primary {
      display: inline-block;
      background-color: #0284c7;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 34px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.02em;
    }
    .btn-danger {
      display: inline-block;
      background-color: #be123c;
      color: #ffffff !important;
      text-decoration: none;
      padding: 13px 30px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 13px;
    }
    .code-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 20px 24px;
      text-align: center;
      margin: 22px 0;
    }
    .code-digits {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 32px;
      font-weight: 700;
      letter-spacing: 8px;
      color: #0f172a;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 22px 0 8px 0;
    }
    .detail-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 18px 22px;
      margin: 16px 0;
      color: #334155;
      font-size: 14px;
      line-height: 1.6;
    }
    .detail-row {
      margin: 8px 0;
    }
    .detail-label {
      font-weight: 600;
      color: #0f172a;
    }
    .detail-value {
      color: #334155;
    }
    .warning-box {
      background-color: #fff1f2;
      border-left: 3px solid #e11d48;
      padding: 14px 18px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 13px;
      color: #9f1239;
      line-height: 1.6;
    }
    .info-box {
      background-color: #f0fdf4;
      border-left: 3px solid #16a34a;
      padding: 14px 18px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 13px;
      color: #166534;
      line-height: 1.6;
    }
    .security-notice {
      background-color: #f8fafc;
      border-left: 3px solid #94a3b8;
      padding: 14px 18px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 13px;
      color: #475569;
      line-height: 1.6;
    }
    p {
      margin: 14px 0;
      color: #334155;
      font-size: 15px;
      line-height: 1.65;
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
<body style="background-color: #f8fafc; margin: 0; padding: 0;">
  ${preheader ? `<span style="display:none;font-size:1px;color:#f8fafc;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">${preheader}</span>` : ''}
  <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="background-color: #f8fafc; margin: 0; padding: 0;">
    <tr>
      <td align="center" style="padding: 32px 16px; background-color: #f8fafc;">
        <!--[if (gte mso 9)|(IE)]>
        <table width="600" align="center" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td>
        <![endif]-->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width: 600px; width: 100%; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.06);">
          <!-- Header -->
          <tr>
            <td style="padding: 28px 36px 20px; background-color: #ffffff; border-bottom: 1px solid #f1f5f9;">
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td valign="middle">
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 22px; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; line-height: 1;">
                      FR<span style="color: #0284c7;">8</span>X
                    </div>
                    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: #64748b; letter-spacing: 0.08em; text-transform: uppercase; margin-top: 4px;">
                      Enterprise Logistics Platform
                    </div>
                  </td>
                  <td align="right" valign="middle">
                    <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; font-weight: 600; color: #64748b; background-color: #f1f5f9; padding: 4px 10px; border-radius: 4px; letter-spacing: 0.04em; text-transform: uppercase;">
                      Official Notice
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Body Content -->
          <tr>
            <td style="padding: 36px; background-color: #ffffff; color: #334155; font-size: 15px; line-height: 1.65;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 24px 36px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; font-weight: 700; color: #334155; margin-bottom: 4px;">
                FR8X Enterprise Network
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; color: #64748b; line-height: 1.6;">
                This communication was issued by FR8X Infrastructure (<a href="https://fr8x.in" style="color: #0284c7; text-decoration: none; font-weight: 600;">fr8x.in</a>).<br>
                Support: <a href="mailto:support@fr8x.in" style="color: #0284c7; text-decoration: none;">support@fr8x.in</a> &nbsp;&bull;&nbsp; 
                Security: <a href="mailto:password@fr8x.in" style="color: #0284c7; text-decoration: none;">password@fr8x.in</a> &nbsp;&bull;&nbsp; 
                Portal: <a href="https://con.fr8x.in" style="color: #0284c7; text-decoration: none;">con.fr8x.in</a>
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11px; color: #94a3b8; margin-top: 8px;">
                &copy; ${new Date().getFullYear()} FR8X Technologies Inc. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
        <!--[if (gte mso 9)|(IE)]>
            </td>
          </tr>
        </table>
        <![endif]-->
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
    <p style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">Welcome to FR8X, ${firstName},</p>
    <p style="font-size: 15px; color: #334155; line-height: 1.65; margin: 0 0 20px 0;">
      We are pleased to welcome you to the FR8X Enterprise Freight Network. Your organization account has been established and configured for real-time logistics operations.
    </p>

    <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.08em; margin: 24px 0 8px 0;">
      ENTERPRISE CREDENTIAL DOSSIER
    </div>
    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px 22px; margin: 12px 0 24px 0; font-size: 14px; line-height: 1.6;">
      <div style="margin: 6px 0;"><span style="font-weight: 600; color: #0f172a;">Account Holder:</span> <span style="color: #334155;">${fullName}</span></div>
      <div style="margin: 6px 0;"><span style="font-weight: 600; color: #0f172a;">Corporate Email:</span> <span style="color: #334155;">${email}</span></div>
      <div style="margin: 6px 0;"><span style="font-weight: 600; color: #0f172a;">Organization:</span> <span style="color: #334155;">${organizationName}</span></div>
      <div style="margin: 6px 0;"><span style="font-weight: 600; color: #0f172a;">Platform Status:</span> <span style="color: #16a34a; font-weight: 600;">Active & Provisioned</span></div>
    </div>

    <!-- Primary Action Button -->
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 28px auto;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: #0284c7;">
          <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff !important; text-decoration: none; border-radius: 8px; letter-spacing: 0.01em; background-color: #0284c7;">
            Access Logistics Workspace &rarr;
          </a>
        </td>
      </tr>
    </table>

    <div style="margin-top: 24px; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #0284c7; border-radius: 4px; font-size: 12px; color: #475569; line-height: 1.5;">
      <strong>Dedicated Concierge Desk:</strong> As a verified corporate partner, your account manager is available to assist with trade-lane rate integrations, custom matrices, and API connectivity: <a href="mailto:support@fr8x.in" style="color: #0284c7;">support@fr8x.in</a>.
    </div>

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
  `, `Welcome to FR8X, ${firstName}. Your enterprise workspace is active.`);

  const text = `Dear ${firstName},

Welcome to FR8X. Your enterprise freight organization workspace has been created.

ENTERPRISE CREDENTIAL DOSSIER:
Name: ${fullName}
Email: ${email}
Organization: ${organizationName}
Status: Active & Provisioned

Access your enterprise freight workspace:
${verificationUrl}

Dedicated Concierge Support: support@fr8x.in

Sincerely,
The FR8X Enterprise Team
https://fr8x.in`;

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
  const resolvedName = (params.firstName || params.recipientName || '').trim();
  const firstName = resolvedName ? resolvedName.split(' ')[0] : 'Member';
  const expiryMinutes = params.expiryMinutes || 15;
  const expiryTime = `${expiryMinutes} minutes`;
  const verificationLink = params.verificationLink || 'https://con.fr8x.in/verify-email';
  const subject = 'Verify Your FR8X Email Address';

  const html = wrapEmailHtml(`
    <p style="font-size: 17px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0;">Dear ${firstName},</p>
    <p style="font-size: 15px; color: #334155; line-height: 1.65; margin: 0 0 20px 0;">
      Thank you for choosing FR8X. Your enterprise freight organization workspace has been created. To activate your corporate credentials and access live rate matrices, container tenders, and verified trade lanes, please verify your email address.
    </p>

    <!-- Primary Action Button -->
    <table border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin: 28px auto;">
      <tr>
        <td align="center" style="border-radius: 8px; background-color: #0284c7;">
          <a href="${verificationLink}" target="_blank" rel="noopener noreferrer" style="display: inline-block; padding: 14px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; font-weight: 600; color: #ffffff !important; text-decoration: none; border-radius: 8px; letter-spacing: 0.01em; background-color: #0284c7;">
            Verify Corporate Email &rarr;
          </a>
        </td>
      </tr>
    </table>

    ${params.otpCode ? `
    <!-- 6-Digit Verification Code -->
    <div style="margin: 28px 0; padding: 20px 24px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; text-align: center;">
      <div style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px;">
        Single-Use Verification Code
      </div>
      <div style="font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #0f172a;">
        ${params.otpCode}
      </div>
      <div style="font-size: 12px; color: #94a3b8; margin-top: 6px;">
        Valid for ${expiryMinutes} minutes &bull; Single-use security token
      </div>
    </div>
    ` : ''}

    <p style="font-size: 14px; color: #475569; margin: 20px 0 0 0;">
      This cryptographic verification link will remain valid for <strong>${expiryTime}</strong>.
    </p>

    <!-- Direct Fallback Link Box -->
    <div style="margin-top: 24px; padding: 14px 18px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
      <p style="font-size: 12px; color: #64748b; margin: 0 0 6px 0; line-height: 1.5;">
        If the button above does not open directly, copy and paste this verification URL into your web browser:
      </p>
      <div style="font-size: 12px; word-break: break-all; color: #0284c7; font-family: monospace;">
        <a href="${verificationLink}" style="color: #0284c7; text-decoration: underline;">${verificationLink}</a>
      </div>
    </div>

    <!-- Security Advisory -->
    <div style="margin-top: 24px; padding: 14px 18px; background-color: #f8fafc; border-left: 3px solid #94a3b8; border-radius: 4px; font-size: 12px; color: #475569; line-height: 1.5;">
      <strong>Security Advisory:</strong> This verification link is unique to your corporate account and will expire in ${expiryTime}. FR8X team members will never ask for your password, verification link, or credentials.
    </div>

    <p style="font-size: 13px; color: #64748b; margin-top: 20px;">
      If you did not register for an FR8X account, please disregard this email or contact <a href="mailto:support@fr8x.in" style="color: #0284c7;">support@fr8x.in</a>.
    </p>

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
  `, 'Please verify your corporate email address to activate your FR8X account.');

  const text = `Dear ${firstName},

Thank you for choosing FR8X. Your enterprise freight organization workspace has been created.

Please verify your corporate email address to activate your account:
${verificationLink}
${params.otpCode ? `\nYour 6-Digit Verification Code:\n${params.otpCode}\n` : ''}
This verification link will expire in ${expiryTime}.

If you are having trouble clicking the button, copy and paste this URL into your browser:
${verificationLink}

SECURITY ADVISORY:
Never share this verification link or code with anyone. FR8X Team will never ask you for your verification credentials.

If you did not create an FR8X account, please ignore this email or contact support@fr8x.in.

Sincerely,
The FR8X Enterprise Team
https://fr8x.in`;

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
      <p style="margin: 4px 0;">FR8X Team will never ask you to provide your OTP, password, or security code.</p>
      <p style="margin: 4px 0;">If you did not request this code, please secure your account and contact FR8X Team.</p>
    </div>

    ${params.correlationId ? `
    <div style="font-size: 11px; font-family: monospace; color: #9ca3af; margin-top: 12px;">
      Correlation ID: ${params.correlationId}
    </div>
    ` : ''}

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
  `, `Your FR8X verification code is ${params.otpCode}`);

  const text = `Hello ${firstName},

Your FR8X verification code is:

${params.otpCode}

This code will expire in ${expiryMinutes} minutes.

SECURITY NOTICE

Never share this code with anyone.

FR8X Team will never ask you to provide your OTP, password, or security code.

If you did not request this code, please secure your account and contact FR8X Team.

Regards,

FR8X Team
https://fr8x.in`;

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

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
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

FR8X Team
https://fr8x.in`;

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
      If you need assistance, contact FR8X Team.
    </p>

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
  `, 'Your FR8X account password was successfully changed.');

  const text = `Hello ${firstName},

Your FR8X account password has been successfully changed.

ACCOUNT

Email: ${email}
Date & Time: ${dateTime}

If you made this change, no further action is required.

If you did not change your password, your account may be at risk:
${securityLink}

If you need assistance, contact FR8X Team.

Regards,

FR8X Team
https://fr8x.in`;

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
      If you need assistance, contact FR8X Team.
    </p>

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
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

If you need assistance, contact FR8X Team.

Regards,

FR8X Team
https://fr8x.in`;

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
      If you have questions about pricing, billing, or available plans, please contact FR8X Team.
    </p>

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
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

If you have questions about pricing, billing, or available plans, please contact FR8X Team.

Regards,

FR8X Team
https://fr8x.in`;

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
      If you believe this message was sent in error or need assistance, contact FR8X Team.
    </p>

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
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

If you believe this message was sent in error or need assistance, contact FR8X Team.

Regards,

FR8X Team
https://fr8x.in`;

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

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
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

FR8X Team
https://fr8x.in`;

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
  const agentName = params.agentName || 'FR8X Team Specialist';
  const subject = `Re: [${params.ticketId}] ${params.originalSubject || 'FR8X Support Update'}`;

  const html = wrapEmailHtml(`
    <p style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 0;">Hello ${firstName},</p>
    <p>A response has been posted to your support inquiry (Ticket: <strong>${params.ticketId}</strong>) by ${agentName}:</p>

    <div class="detail-card" style="background-color: #ffffff; border-left: 3px solid #0284c7; white-space: pre-wrap;">
      ${params.replyMessage}
    </div>

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
  `, `Update on Ticket ${params.ticketId}`);

  const text = `Hello ${firstName},

A response has been posted to Ticket ${params.ticketId} by ${agentName}:

${params.replyMessage}

Regards,
FR8X Team
https://fr8x.in`;

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

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
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

FR8X Team
https://fr8x.in`;

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

    <div style="margin-top: 32px; font-size: 14px; color: #334155; line-height: 1.6;">
      Sincerely,<br>
      <strong style="color: #0f172a; font-size: 15px;">The FR8X Enterprise Team</strong><br>
      <span style="color: #64748b; font-size: 13px;">Global Logistics & Freight Infrastructure</span>
    </div>
  `, 'FR8X ZeptoMail Test');

  const text = `FR8X Integration Test

FR8X ZeptoMail integration test successful.

Verification Status: Connection Active · Credentials Validated

Regards,

FR8X Team
https://fr8x.in`;
  return { subject, html, text };
}
