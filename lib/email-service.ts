/**
 * FR8X Central Server-Side Email Service
 *
 * Architecture:
 * Godfather / FR8X UI -> FR8X Backend API -> Central Email Service -> Zoho ZeptoMail API -> Recipient
 *
 * Senders & Strict Routing:
 * - AUTHENTICATION / SECURITY: password@fr8x.in
 *   (account verification, email verification, OTP, forgot password, password reset, password changed, login security)
 * - SUPPORT: support@fr8x.in
 *   (support request, support ticket, contact support)
 * - NEVER use tech@fr8x.in for user authentication emails.
 *
 * CRITICAL SECURITY POLICIES:
 * 1. The client must NEVER specify arbitrary sender, from_email, or smtp credentials.
 *    Sender is strictly determined server-side by internal email type.
 * 2. ZeptoMail credentials / API key MUST remain strictly server-side (process.env only).
 * 3. Never log passwords, OTPs, verification/reset tokens, authorization headers, or ZeptoMail keys.
 * 4. Communicates directly with official Zoho ZeptoMail transactional REST API (JSON payload, TLS 1.2+).
 */

import {
  renderEmailVerificationEmail,
  renderPasswordResetEmail,
  renderPasswordChangedEmail,
  renderOtpChallengeEmail,
  renderSupportEmail,
  renderSecurityAlertEmail,
} from '@/lib/email-templates';

export const EMAIL_SENDERS = {
  SUPPORT: 'support@fr8x.in',
  PASSWORD: 'password@fr8x.in',
} as const;

export type EmailSenderType = keyof typeof EMAIL_SENDERS;

export type TransactionalEmailType =
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFICATION'
  | 'AUTH_OTP'
  | 'PASSWORD_OTP'
  | 'PASSWORD_CHANGED'
  | 'LOGIN_SECURITY'
  | 'SUPPORT_REQUEST'
  | 'SUPPORT_TICKET'
  | 'CONTACT_SUPPORT'
  | 'SUPPORT_NOTIFICATION'
  | 'SUPPORT_CONTACT'
  | 'EMAIL_TEST';

// Alias for backwards compatibility
export type EmailEventType = TransactionalEmailType;

export interface SendTransactionalEmailParams {
  type: TransactionalEmailType;
  to: string;
  subject: string;
  text: string;
  html?: string;
  recipientName?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionalEmailResult {
  success: boolean;
  messageId?: string;
  correlationId: string;
  type: TransactionalEmailType;
  from: string;
  to: string;
  provider: 'ZOHO_ZEPTOMAIL' | 'MOCK_SANDBOX';
  error?: string;
}

// Backwards-compatible param and response interfaces
export interface SendEmailParams {
  fromType: EmailSenderType;
  to: string;
  subject: string;
  message: string;
  htmlMessage?: string;
  event: EmailEventType | string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  correlationId: string;
  event: string;
  fromType: EmailSenderType;
  sender: string;
  to: string;
  provider: 'ZOHO_FLOW' | 'ZOHO_ZEPTOMAIL' | 'MOCK_SANDBOX';
  isPasswordConfigured: boolean;
  error?: string;
}

export interface EmailSenderStatus {
  sender: string;
  mailbox: string;
  isOperational: boolean;
  notes: string;
}

export interface ZeptoMailConfigStatus {
  isOperational: boolean;
  endpoint: string;
  bounceAddress: string;
  hasToken: boolean;
  tokenMasked?: string;
  notes: string;
}

/**
 * Returns current operational status of the Zoho ZeptoMail API configuration
 */
export function getZeptoMailStatus(): ZeptoMailConfigStatus {
  const token = (
    process.env.ZEPTO_MAIL_API_KEY ||
    process.env.ZOHO_ZEPTOMAIL_TOKEN ||
    ''
  ).trim();
  const endpoint =
    process.env.ZEPTO_MAIL_URL?.trim() ||
    process.env.ZOHO_ZEPTOMAIL_URL?.trim() ||
    'https://api.zeptomail.in/v1.1/email';
  const bounceAddress =
    process.env.ZEPTO_MAIL_BOUNCE_ADDRESS?.trim() ||
    process.env.ZOHO_ZEPTOMAIL_BOUNCE_ADDRESS?.trim() ||
    'bounce@bounce.fr8x.in';
  const hasToken = Boolean(token && token !== 'undefined' && token.length > 5);

  return {
    isOperational: hasToken,
    endpoint,
    bounceAddress,
    hasToken,
    tokenMasked: hasToken
      ? `${token.substring(0, 10)}••••••••${token.slice(-4)}`
      : undefined,
    notes: hasToken
      ? `Operational: Zoho ZeptoMail transactional API active (${endpoint}).`
      : 'Pending: ZEPTO_MAIL_API_KEY is not configured in environment (operating in dev sandbox mode).',
  };
}

/**
 * Returns the current operational status of dedicated FR8X email identities.
 */
export function getEmailSendersStatus(): Record<EmailSenderType, EmailSenderStatus> {
  const zeptoStatus = getZeptoMailStatus();

  return {
    SUPPORT: {
      sender: 'SUPPORT',
      mailbox: EMAIL_SENDERS.SUPPORT,
      isOperational: zeptoStatus.isOperational,
      notes: zeptoStatus.isOperational
        ? 'Operational: Support mail identity configured via Zoho ZeptoMail (support@fr8x.in).'
        : 'Dev Mode: Configured with mock sandbox fallback until ZEPTO_MAIL_API_KEY is added.',
    },
    PASSWORD: {
      sender: 'PASSWORD',
      mailbox: EMAIL_SENDERS.PASSWORD,
      isOperational: zeptoStatus.isOperational,
      notes: zeptoStatus.isOperational
        ? 'Operational: Dedicated authentication mailbox active via Zoho ZeptoMail (password@fr8x.in).'
        : 'PASSWORD@FR8X.IN REQUIRES ZOHO FLOW MAIL CONNECTION/AUTHORIZATION or ZEPTO_MAIL_API_KEY.',
    },
  };
}

/**
 * Validates an email recipient address format (RFC 5322 compatible).
 * Prevents newline injection and invalid syntax.
 */
export function isValidEmailAddress(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  if (/[\r\n\t]/.test(trimmed)) return false;
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Sanitizes input strings to prevent CRLF header injection.
 */
function sanitizeString(str: string): string {
  return str.replace(/[\r\n\t]/g, ' ').trim();
}

/**
 * Strict Server-Side Sender Routing:
 * The frontend/client must NEVER control the sender.
 * Auth & Security -> password@fr8x.in
 * Support -> support@fr8x.in
 */
export function resolveSenderForType(type: TransactionalEmailType): {
  address: string;
  name: string;
  senderType: EmailSenderType;
} {
  switch (type) {
    case 'SUPPORT_REQUEST':
    case 'SUPPORT_TICKET':
    case 'CONTACT_SUPPORT':
    case 'SUPPORT_NOTIFICATION':
    case 'SUPPORT_CONTACT':
      return {
        address: process.env.ZOHO_SUPPORT_EMAIL || EMAIL_SENDERS.SUPPORT,
        name: process.env.ZEPTO_MAIL_FROM_NAME || 'FR8X Support',
        senderType: 'SUPPORT',
      };
    case 'PASSWORD_RESET':
    case 'EMAIL_VERIFICATION':
    case 'AUTH_OTP':
    case 'PASSWORD_OTP':
    case 'PASSWORD_CHANGED':
    case 'LOGIN_SECURITY':
    case 'EMAIL_TEST':
    default:
      return {
        address: process.env.ZEPTO_MAIL_FROM_ADDRESS || EMAIL_SENDERS.PASSWORD,
        name: process.env.ZEPTO_MAIL_FROM_NAME || 'FR8X',
        senderType: 'PASSWORD',
      };
  }
}

/**
 * Central Server-Side Transactional Email Dispatcher
 * Directly communicates with official Zoho ZeptoMail REST API v1.1.
 */
export async function sendTransactionalEmail(
  params: SendTransactionalEmailParams
): Promise<TransactionalEmailResult> {
  const correlationId =
    params.correlationId ||
    `GF-EML-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const cleanTo = (params.to || '').trim().toLowerCase();
  const cleanSubject = sanitizeString(params.subject || '');
  const textContent = (params.text || '').trim();
  const htmlContent = params.html || `<pre style="font-family:sans-serif;">${textContent}</pre>`;

  // Determine sender strictly server-side
  const sender = resolveSenderForType(params.type);

  // Validate recipient
  if (!isValidEmailAddress(cleanTo)) {
    return {
      success: false,
      correlationId,
      type: params.type,
      from: sender.address,
      to: cleanTo,
      provider: 'ZOHO_ZEPTOMAIL',
      error: 'Invalid recipient email address format.',
    };
  }

  // Validate subject
  if (!cleanSubject) {
    return {
      success: false,
      correlationId,
      type: params.type,
      from: sender.address,
      to: cleanTo,
      provider: 'ZOHO_ZEPTOMAIL',
      error: 'Email subject cannot be empty.',
    };
  }

  // Validate message
  if (!textContent && !params.html) {
    return {
      success: false,
      correlationId,
      type: params.type,
      from: sender.address,
      to: cleanTo,
      provider: 'ZOHO_ZEPTOMAIL',
      error: 'Email message content cannot be empty.',
    };
  }

  // Check ZeptoMail configuration
  const apiKey = (
    process.env.ZEPTO_MAIL_API_KEY ||
    process.env.ZOHO_ZEPTOMAIL_TOKEN ||
    ''
  ).trim();
  const endpoint =
    process.env.ZEPTO_MAIL_URL?.trim() ||
    process.env.ZOHO_ZEPTOMAIL_URL?.trim() ||
    'https://api.zeptomail.in/v1.1/email';
  const bounceAddress =
    process.env.ZEPTO_MAIL_BOUNCE_ADDRESS?.trim() ||
    process.env.ZOHO_ZEPTOMAIL_BOUNCE_ADDRESS?.trim() ||
    'bounce@bounce.fr8x.in';

  // ── Production / Configured Dispatch via Zoho ZeptoMail REST API ─────────
  if (apiKey && apiKey !== 'undefined') {
    const authHeader = apiKey.toLowerCase().startsWith('zoho-enczapikey')
      ? apiKey
      : `Zoho-enczapikey ${apiKey}`;

    const recipientName =
      params.recipientName || cleanTo.split('@')[0].replace(/[._-]/g, ' ');

    const payload = {
      bounce_address: bounceAddress,
      from: {
        address: sender.address,
        name: sender.name,
      },
      to: [
        {
          email_address: {
            address: cleanTo,
            name: recipientName,
          },
        },
      ],
      subject: cleanSubject,
      htmlbody: htmlContent,
      textbody: textContent || cleanSubject,
    };

    // Strict 8-second timeout for serverless & low-latency execution
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: authHeader,
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      const resData = await response.json().catch(() => ({}));

      if (response.ok) {
        const messageId =
          resData?.data?.[0]?.message_id ||
          resData?.data?.[0]?.id ||
          `zepto-${Date.now()}`;

        console.log(
          `[ZOHO_ZEPTOMAIL_SUCCESS] Type: ${params.type} | Sender: ${sender.address} | Recipient: ${cleanTo} | MsgID: ${messageId}`
        );

        return {
          success: true,
          messageId,
          correlationId,
          type: params.type,
          from: sender.address,
          to: cleanTo,
          provider: 'ZOHO_ZEPTOMAIL',
        };
      } else {
        const errorDetail =
          resData?.error?.message ||
          resData?.message ||
          `HTTP ${response.status} ${response.statusText}`;

        console.error(
          `[ZOHO_ZEPTOMAIL_ERROR] API rejection for ${cleanTo}: ${errorDetail}`
        );

        return {
          success: false,
          correlationId,
          type: params.type,
          from: sender.address,
          to: cleanTo,
          provider: 'ZOHO_ZEPTOMAIL',
          error: `ZeptoMail rejected dispatch: ${errorDetail}`,
        };
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      const isTimeout = err.name === 'AbortError';
      const errorMsg = isTimeout
        ? 'ZeptoMail API connection timed out after 8000ms.'
        : `ZeptoMail dispatch network error: ${err.message}`;

      console.error(`[ZOHO_ZEPTOMAIL_NETWORK_FAIL] ${errorMsg}`);

      return {
        success: false,
        correlationId,
        type: params.type,
        from: sender.address,
        to: cleanTo,
        provider: 'ZOHO_ZEPTOMAIL',
        error: errorMsg,
      };
    }
  }

  // ── Development Mock / Sandbox Fallback (when no API key configured) ────
  // Enables automated testing and local verification without throwing unhandled exceptions
  console.log(
    `[EMAIL_DEV_SANDBOX_DISPATCH] Simulating ${params.type} from ${sender.address} to ${cleanTo} (Subject: "${cleanSubject}")`
  );

  return {
    success: true,
    messageId: `mock-zepto-${Date.now()}`,
    correlationId,
    type: params.type,
    from: sender.address,
    to: cleanTo,
    provider: 'MOCK_SANDBOX',
  };
}

/**
 * Backwards-compatible sendEmail dispatcher
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
  let mappedType: TransactionalEmailType = 'EMAIL_TEST';
  const rawEvent = String(params.event || '').toUpperCase();

  if (rawEvent.includes('VERIF')) mappedType = 'EMAIL_VERIFICATION';
  else if (rawEvent.includes('OTP')) mappedType = 'AUTH_OTP';
  else if (rawEvent.includes('RESET')) mappedType = 'PASSWORD_RESET';
  else if (rawEvent.includes('CHANGED')) mappedType = 'PASSWORD_CHANGED';
  else if (rawEvent.includes('SECURITY')) mappedType = 'LOGIN_SECURITY';
  else if (rawEvent.includes('SUPPORT')) mappedType = 'SUPPORT_REQUEST';

  const result = await sendTransactionalEmail({
    type: mappedType,
    to: params.to,
    subject: params.subject,
    text: params.message,
    html: params.htmlMessage,
    correlationId: params.correlationId,
    metadata: params.metadata,
  });

  const senderInfo = resolveSenderForType(mappedType);

  return {
    success: result.success,
    messageId: result.messageId,
    correlationId: result.correlationId,
    event: params.event,
    fromType: senderInfo.senderType,
    sender: result.from,
    to: result.to,
    provider: result.provider === 'ZOHO_ZEPTOMAIL' ? 'ZOHO_ZEPTOMAIL' : 'MOCK_SANDBOX',
    isPasswordConfigured: Boolean(process.env.ZEPTO_MAIL_API_KEY || process.env.ZOHO_ZEPTOMAIL_TOKEN),
    error: result.error,
  };
}

/**
 * Standardized High-Level Email Service API
 */
export const EmailService = {
  sendTransactionalEmail,

  /**
   * Account registration email verification: strictly routes to password@fr8x.in
   * Subject: "FR8X Verify Your Email"
   */
  async sendVerificationEmail(params: {
    to: string;
    verificationLink?: string;
    token?: string;
    otpCode?: string;
    expiryMinutes?: number;
    correlationId?: string;
  }): Promise<TransactionalEmailResult> {
    const tmpl = renderEmailVerificationEmail({
      recipient: params.to,
      verificationLink: params.verificationLink,
      otpCode: params.otpCode,
      expiryMinutes: params.expiryMinutes || 1440,
    });

    return sendTransactionalEmail({
      type: 'EMAIL_VERIFICATION',
      to: params.to,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * One-time passcode (OTP): strictly routes to password@fr8x.in
   * Subject: "FR8X Verification Code"
   */
  async sendOtpEmail(params: {
    to: string;
    otpCode: string;
    expiryMinutes?: number;
    correlationId?: string;
  }): Promise<TransactionalEmailResult> {
    const tmpl = renderOtpChallengeEmail({
      recipient: params.to,
      otpCode: params.otpCode,
      expiryMinutes: params.expiryMinutes || 10,
      correlationId: params.correlationId,
    });

    return sendTransactionalEmail({
      type: 'AUTH_OTP',
      to: params.to,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Password reset request: strictly routes to password@fr8x.in
   * Subject: "FR8X Password Reset Request"
   */
  async sendPasswordResetEmail(params: {
    to: string;
    resetLink?: string;
    otpCode?: string;
    expiryMinutes?: number;
    correlationId?: string;
  }): Promise<TransactionalEmailResult> {
    const tmpl = renderPasswordResetEmail({
      recipient: params.to,
      resetLink: params.resetLink,
      otpCode: params.otpCode,
      expiryMinutes: params.expiryMinutes || 15,
    });

    return sendTransactionalEmail({
      type: 'PASSWORD_RESET',
      to: params.to,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Password changed confirmation: strictly routes to password@fr8x.in
   * Subject: "FR8X Password Changed Successfully"
   */
  async sendPasswordChangedEmail(params: {
    to: string;
    changedAt?: string;
    ipAddress?: string;
    correlationId?: string;
  }): Promise<TransactionalEmailResult> {
    const tmpl = renderPasswordChangedEmail({
      recipient: params.to,
      changedAt: params.changedAt || new Date().toUTCString(),
      ipAddress: params.ipAddress,
    });

    return sendTransactionalEmail({
      type: 'PASSWORD_CHANGED',
      to: params.to,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Security notifications: strictly routes to password@fr8x.in
   */
  async sendSecurityAlertEmail(params: {
    to: string;
    subject: string;
    details: string;
    correlationId?: string;
    ipAddress?: string;
  }): Promise<TransactionalEmailResult> {
    const tmpl = renderSecurityAlertEmail({
      subject: params.subject,
      details: params.details,
      correlationId: params.correlationId,
      ipAddress: params.ipAddress,
    });

    return sendTransactionalEmail({
      type: 'LOGIN_SECURITY',
      to: params.to,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Customer / Member Support request: strictly routes to support@fr8x.in
   * Subject: "FR8X Support Request"
   */
  async sendSupportEmail(params: {
    to: string;
    subject: string;
    message: string;
    ticketId?: string;
    senderName?: string;
    correlationId?: string;
  }): Promise<TransactionalEmailResult> {
    const tmpl = renderSupportEmail({
      recipient: params.to,
      subject: params.subject,
      message: params.message,
      ticketId: params.ticketId,
      senderName: params.senderName,
    });

    return sendTransactionalEmail({
      type: 'SUPPORT_REQUEST',
      to: params.to,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      recipientName: params.senderName,
      correlationId: params.correlationId,
    });
  },

  getStatus: getEmailSendersStatus,
  getZeptoMailStatus,
  validateEmail: isValidEmailAddress,
};
