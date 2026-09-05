/**
 * FR8X Central Server-Side Email Service
 *
 * Production ZeptoMail REST Email Sending API Implementation.
 *
 * Architecture:
 * FR8X FRONTEND -> FR8X BACKEND -> CENTRAL EMAIL SERVICE -> ZEPTOMAIL REST API -> USER EMAIL
 *
 * Senders & Strict Routing:
 * - PASSWORD / SECURITY: password@fr8x.in
 *   (Email verification, OTP, Forgot password, Password reset, Password changed, Login security alert, Account security notification)
 * - SUPPORT: support@fr8x.in
 *   (Support ticket, Customer support, Complaint, Support response, Account assistance, General support communication)
 * - TECHNICAL: tech@fr8x.in
 *   (Technical notification, System maintenance, System incident, System recovery, Infrastructure/system notification)
 *
 * CRITICAL SECURITY POLICIES:
 * 1. The client must NEVER specify arbitrary sender, from_email, or credentials.
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
  renderTechnicalEmail,
  renderSecurityAlertEmail,
  renderTestEmail,
  EmailVerificationTemplateParams,
  PasswordResetTemplateParams,
  PasswordChangedTemplateParams,
  OtpChallengeTemplateParams,
  SupportTemplateParams,
  TechnicalNotificationTemplateParams,
  SecurityAlertTemplateParams,
  TestEmailTemplateParams,
} from '@/lib/email-templates';

export const EMAIL_SENDERS = {
  PASSWORD: 'password@fr8x.in',
  SUPPORT: 'support@fr8x.in',
  TECH: 'tech@fr8x.in',
} as const;

export type EmailSenderType = keyof typeof EMAIL_SENDERS;

export type TransactionalEmailType =
  // Password & Security (password@fr8x.in)
  | 'PASSWORD_RESET'
  | 'EMAIL_VERIFICATION'
  | 'AUTH_OTP'
  | 'PASSWORD_OTP'
  | 'PASSWORD_CHANGED'
  | 'LOGIN_SECURITY'
  | 'EMAIL_TEST'
  // Customer & Platform Support (support@fr8x.in)
  | 'SUPPORT_REQUEST'
  | 'SUPPORT_TICKET'
  | 'CONTACT_SUPPORT'
  | 'SUPPORT_NOTIFICATION'
  | 'SUPPORT_CONTACT'
  // Technical & System Infrastructure (tech@fr8x.in)
  | 'TECH_NOTIFICATION'
  | 'SYSTEM_MAINTENANCE'
  | 'SYSTEM_INCIDENT'
  | 'SERVICE_RESTORED';

// Alias for backwards compatibility
export type EmailEventType = TransactionalEmailType;

export interface SendTransactionalEmailParams {
  type?: TransactionalEmailType;
  senderType?: EmailSenderType;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  recipientName?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  replyTo?: string;
  templateId?: string;
}

export interface TransactionalEmailResult {
  success: boolean;
  messageId?: string;
  correlationId: string;
  type?: TransactionalEmailType;
  from: string;
  to: string;
  subject?: string;
  provider: 'ZOHO_ZEPTOMAIL' | 'MOCK_SANDBOX' | 'Zoho_ZeptoMail' | 'Sandbox_Mock';
  error?: string;
  details?: unknown;
}

// Backwards-compatible param and response interfaces
export interface SendEmailParams {
  fromType?: EmailSenderType;
  to: string;
  subject: string;
  message: string;
  htmlMessage?: string;
  event: EmailEventType | string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  recipientName?: string;
}

export interface SendEmailResponse {
  success: boolean;
  messageId?: string;
  correlationId: string;
  event: string;
  fromType: EmailSenderType;
  sender: string;
  to: string;
  provider: 'ZOHO_FLOW' | 'ZOHO_ZEPTOMAIL' | 'MOCK_SANDBOX' | 'Zoho_ZeptoMail' | 'Sandbox_Mock';
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
  hasToken: boolean;
  tokenMasked?: string;
  notes: string;
  agent: string;
  domain: string;
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
    process.env.ZEPTO_MAIL_API_URL?.trim() ||
    process.env.ZEPTO_MAIL_URL?.trim() ||
    process.env.ZOHO_ZEPTOMAIL_URL?.trim() ||
    'https://api.zeptomail.com/v1.1/email';

  const hasToken = Boolean(token && token !== 'undefined' && token.length > 5);

  return {
    isOperational: hasToken,
    endpoint,
    hasToken,
    tokenMasked: hasToken
      ? `${token.substring(0, 6)}••••••••${token.slice(-4)}`
      : undefined,
    notes: hasToken
      ? `Operational: ZeptoMail REST API active (${endpoint}).`
      : 'Pending: ZEPTO_MAIL_API_KEY is not configured in environment (operating in local sandbox mode).',
    agent: 'agent_1',
    domain: 'fr8x.in',
  };
}

/**
 * Returns the current operational status of dedicated FR8X email identities.
 */
export function getEmailSendersStatus(): Record<EmailSenderType, EmailSenderStatus> {
  const zeptoStatus = getZeptoMailStatus();

  return {
    PASSWORD: {
      sender: 'PASSWORD',
      mailbox: process.env.ZEPTO_MAIL_PASSWORD_FROM || EMAIL_SENDERS.PASSWORD,
      isOperational: zeptoStatus.isOperational,
      notes: zeptoStatus.isOperational
        ? 'Operational: Dedicated password and security mailbox active via ZeptoMail (password@fr8x.in).'
        : 'Sandbox Mode: Awaiting ZEPTO_MAIL_API_KEY.',
    },
    SUPPORT: {
      sender: 'SUPPORT',
      mailbox: process.env.ZEPTO_MAIL_SUPPORT_FROM || EMAIL_SENDERS.SUPPORT,
      isOperational: zeptoStatus.isOperational,
      notes: zeptoStatus.isOperational
        ? 'Operational: Support mail identity configured via ZeptoMail (support@fr8x.in).'
        : 'Sandbox Mode: Awaiting ZEPTO_MAIL_API_KEY.',
    },
    TECH: {
      sender: 'TECH',
      mailbox: process.env.ZEPTO_MAIL_TECH_FROM || EMAIL_SENDERS.TECH,
      isOperational: zeptoStatus.isOperational,
      notes: zeptoStatus.isOperational
        ? 'Operational: Technical and infrastructure mailbox active via ZeptoMail (tech@fr8x.in).'
        : 'Sandbox Mode: Awaiting ZEPTO_MAIL_API_KEY.',
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
export function sanitizeString(str: string): string {
  return str.replace(/[\r\n\t]/g, ' ').trim();
}

/**
 * Redacts sensitive credentials, tokens, passwords, and authorization headers from logs and error strings.
 */
export function redactSensitiveData(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/(?:Zoho-enczapikey|Bearer)\s+[A-Za-z0-9_\-.~+/]+=*/gi, '[REDACTED_AUTH_HEADER]')
    .replace(/(?:password|passkey|secret|token)\s*[:=]\s*[^\s,;]+/gi, (match) => {
      const parts = match.split(/[:=]/);
      return `${parts[0]}: [REDACTED_PASSWORD]`;
    })
    .replace(/\b(?:ph_|zm_)[A-Za-z0-9_]{10,}\b/gi, '[REDACTED_TOKEN]');
}

/**
 * Strict Server-Side Sender Routing:
 * The frontend/client must NEVER control the sender.
 * - Password & Security -> password@fr8x.in
 * - Support -> support@fr8x.in
 * - Technical -> tech@fr8x.in
 */
export function resolveSenderForType(type: TransactionalEmailType): {
  address: string;
  name: string;
  senderType: EmailSenderType;
} {
  const fromName = process.env.ZEPTO_MAIL_FROM_NAME || 'FR8X';

  switch (type) {
    case 'SUPPORT_REQUEST':
    case 'SUPPORT_TICKET':
    case 'CONTACT_SUPPORT':
    case 'SUPPORT_NOTIFICATION':
    case 'SUPPORT_CONTACT':
      return {
        address: process.env.ZEPTO_MAIL_SUPPORT_FROM || EMAIL_SENDERS.SUPPORT,
        name: `${fromName} Support`,
        senderType: 'SUPPORT',
      };

    case 'TECH_NOTIFICATION':
    case 'SYSTEM_MAINTENANCE':
    case 'SYSTEM_INCIDENT':
    case 'SERVICE_RESTORED':
      return {
        address: process.env.ZEPTO_MAIL_TECH_FROM || EMAIL_SENDERS.TECH,
        name: `${fromName} Engineering`,
        senderType: 'TECH',
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
        address: process.env.ZEPTO_MAIL_PASSWORD_FROM || EMAIL_SENDERS.PASSWORD,
        name: `${fromName} Security`,
        senderType: 'PASSWORD',
      };
  }
}

/**
 * Executes an HTTP fetch with controlled retries on transient errors (network failure, 5xx).
 * Does NOT retry on 4xx (client, bad request, auth) errors.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 2
): Promise<Response> {
  let attempt = 0;
  let lastError: any = null;

  while (attempt <= maxRetries) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // If response is transient server error (500, 502, 503, 504), retry
      if (response.status >= 500 && response.status <= 504 && attempt < maxRetries) {
        attempt++;
        const backoffMs = attempt * 400;
        console.warn(
          `[ZEPTOMAIL_RETRY] Server returned ${response.status}. Retrying attempt ${attempt}/${maxRetries} in ${backoffMs}ms...`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      return response;
    } catch (err: any) {
      clearTimeout(timeoutId);
      lastError = err;
      const isTransient = err.name === 'AbortError' || err.code === 'ECONNRESET' || err.code === 'ETIMEDOUT';

      if (isTransient && attempt < maxRetries) {
        attempt++;
        const backoffMs = attempt * 400;
        console.warn(
          `[ZEPTOMAIL_RETRY] Transient network error (${err.message}). Retrying attempt ${attempt}/${maxRetries} in ${backoffMs}ms...`
        );
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      throw err;
    }
  }

  throw lastError || new Error('Request failed after retries');
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
    `FR8X-EML-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const cleanTo = (params.to || '').trim().toLowerCase();
  const cleanSubject = sanitizeString(params.subject || '');
  const textContent = (params.text || '').trim();
  const htmlContent = params.html || `<pre style="font-family:sans-serif;">${textContent}</pre>`;

  const resolvedType =
    params.type ||
    (params.senderType === 'SUPPORT'
      ? 'SUPPORT_REQUEST'
      : params.senderType === 'TECH'
        ? 'TECH_NOTIFICATION'
        : 'EMAIL_VERIFICATION');

  const sender = params.senderType
    ? {
        address: EMAIL_SENDERS[params.senderType] || EMAIL_SENDERS.PASSWORD,
        name:
          params.senderType === 'SUPPORT'
            ? 'FR8X Support'
            : params.senderType === 'TECH'
              ? 'FR8X Systems'
              : 'FR8X Security',
        senderType: params.senderType,
      }
    : resolveSenderForType(resolvedType);

  // Validate recipient format
  if (!isValidEmailAddress(cleanTo)) {
    return {
      success: false,
      correlationId,
      type: resolvedType,
      from: sender.address,
      to: cleanTo,
      subject: cleanSubject,
      provider: 'Zoho_ZeptoMail',
      error: 'Invalid recipient email address format.',
    };
  }

  // Validate subject
  if (!cleanSubject) {
    return {
      success: false,
      correlationId,
      type: resolvedType,
      from: sender.address,
      to: cleanTo,
      subject: cleanSubject,
      provider: 'Zoho_ZeptoMail',
      error: 'Email subject cannot be empty.',
    };
  }

  // Validate message
  if (!textContent && !params.html) {
    return {
      success: false,
      correlationId,
      type: resolvedType,
      from: sender.address,
      to: cleanTo,
      subject: cleanSubject,
      provider: 'Zoho_ZeptoMail',
      error: 'Email message content cannot be empty.',
    };
  }

  // Resolve configuration
  const apiKey = (
    process.env.ZEPTO_MAIL_API_KEY ||
    process.env.ZOHO_ZEPTOMAIL_TOKEN ||
    ''
  ).trim();

  const endpoint =
    process.env.ZEPTO_MAIL_API_URL?.trim() ||
    process.env.ZEPTO_MAIL_URL?.trim() ||
    process.env.ZOHO_ZEPTOMAIL_URL?.trim() ||
    'https://api.zeptomail.com/v1.1/email';

  // ── Production Dispatch via Zoho ZeptoMail REST API ───────────────────────
  if (apiKey && apiKey !== 'undefined') {
    const authHeader = apiKey.toLowerCase().startsWith('zoho-enczapikey')
      ? apiKey
      : `Zoho-enczapikey ${apiKey}`;

    const recipientName =
      params.recipientName || cleanTo.split('@')[0].replace(/[._-]/g, ' ');

    const replyToAddress =
      params.replyTo ||
      (sender.senderType === 'SUPPORT' ? sender.address : 'support@fr8x.in');

    const payload: Record<string, any> = {
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
      reply_to: [
        {
          address: replyToAddress,
          name: 'FR8X Support',
        },
      ],
      subject: cleanSubject,
      htmlbody: htmlContent,
      textbody: textContent || cleanSubject,
    };

    // Optional bounce address only if explicitly defined in environment
    const bounceAddress = (
      process.env.ZEPTO_MAIL_BOUNCE_ADDRESS ||
      process.env.ZOHO_ZEPTOMAIL_BOUNCE_ADDRESS ||
      ''
    ).trim();
    if (bounceAddress) {
      payload.bounce_address = bounceAddress;
    }

    try {
      const response = await fetchWithRetry(
        endpoint,
        {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: authHeader,
            'X-Correlation-ID': correlationId,
          },
          body: JSON.stringify(payload),
        },
        2
      );

      const resData = await response.json().catch(() => ({}));

      if (response.ok) {
        const messageId =
          resData?.data?.[0]?.message_id ||
          resData?.data?.[0]?.id ||
          `zepto-${Date.now()}`;

        console.log(
          `[ZEPTOMAIL_SUCCESS] Type: ${resolvedType} | Sender: ${sender.address} | Recipient: ${cleanTo} | MsgID: ${messageId} | Corr: ${correlationId}`
        );

        return {
          success: true,
          messageId,
          correlationId,
          type: resolvedType,
          from: sender.address,
          to: cleanTo,
          subject: cleanSubject,
          provider: 'Zoho_ZeptoMail',
          details: resData,
        };
      } else {
        const errorDetail =
          resData?.error?.message ||
          resData?.message ||
          `HTTP ${response.status} ${response.statusText}`;

        console.error(
          `[ZEPTOMAIL_API_ERROR] API rejection for ${cleanTo}: ${errorDetail}`
        );

        return {
          success: false,
          correlationId,
          type: resolvedType,
          from: sender.address,
          to: cleanTo,
          subject: cleanSubject,
          provider: 'Zoho_ZeptoMail',
          error: `ZeptoMail rejected dispatch: ${errorDetail}`,
          details: resData,
        };
      }
    } catch (err: any) {
      const isTimeout =
        err.name === 'AbortError' ||
        String(err.message || '').toLowerCase().includes('timeout') ||
        String(err.message || '').toLowerCase().includes('aborted');
      const errorMsg = isTimeout
        ? 'ZeptoMail API connection timed out after 8000ms (timeout).'
        : `ZeptoMail dispatch network error: ${err.message}`;

      console.error(`[ZEPTOMAIL_NETWORK_FAIL] ${errorMsg}`);

      return {
        success: false,
        correlationId,
        type: resolvedType,
        from: sender.address,
        to: cleanTo,
        subject: cleanSubject,
        provider: 'Zoho_ZeptoMail',
        error: errorMsg,
      };
    }
  }

  // ── Development Mock / Sandbox Fallback (when no API key configured) ──────
  console.log(
    `[EMAIL_DEV_SANDBOX_DISPATCH] Simulating ${resolvedType} from ${sender.address} to ${cleanTo} (Subject: "${cleanSubject}")`
  );

  return {
    success: true,
    messageId: `mock-zepto-${Date.now()}`,
    correlationId,
    type: resolvedType,
    from: sender.address,
    to: cleanTo,
    subject: cleanSubject,
    provider: 'Sandbox_Mock',
    details: { mode: 'sandbox' },
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
  else if (rawEvent.includes('TECH') || rawEvent.includes('MAINT') || rawEvent.includes('INCIDENT')) mappedType = 'TECH_NOTIFICATION';
  else if (rawEvent.includes('SUPPORT')) mappedType = 'SUPPORT_REQUEST';

  const result = await sendTransactionalEmail({
    type: mappedType,
    to: params.to,
    subject: params.subject,
    text: params.message,
    html: params.htmlMessage,
    correlationId: params.correlationId,
    recipientName: params.recipientName,
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
   * Account registration email verification
   * Sender: password@fr8x.in
   * Subject: "VERIFY YOUR FR8X EMAIL ADDRESS"
   */
  async sendVerificationEmail(params: (EmailVerificationTemplateParams | { to: string; recipient?: string; recipientName?: string; verificationLink?: string; token?: string; otpCode?: string; expiryMinutes?: number }) & { correlationId?: string }): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderEmailVerificationEmail({
      recipient: targetEmail,
      recipientName: params.recipientName,
      verificationLink: params.verificationLink,
      otpCode: params.otpCode,
      expiryMinutes: params.expiryMinutes || 1440,
    });

    return sendTransactionalEmail({
      type: 'EMAIL_VERIFICATION',
      to: targetEmail,
      recipientName: params.recipientName,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * One-time passcode (OTP)
   * Sender: password@fr8x.in
   * Subject: "YOUR FR8X VERIFICATION CODE"
   */
  async sendOtpEmail(params: (OtpChallengeTemplateParams | { to: string; recipient?: string; recipientName?: string; otpCode: string; expiryMinutes?: number }) & { correlationId?: string }): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderOtpChallengeEmail({
      recipient: targetEmail,
      recipientName: params.recipientName,
      otpCode: params.otpCode,
      expiryMinutes: params.expiryMinutes || 10,
      correlationId: params.correlationId,
    });

    return sendTransactionalEmail({
      type: 'AUTH_OTP',
      to: targetEmail,
      recipientName: params.recipientName,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Password reset request
   * Sender: password@fr8x.in
   * Subject: "RESET YOUR FR8X PASSWORD"
   */
  async sendPasswordResetEmail(params: (PasswordResetTemplateParams | { to: string; recipient?: string; recipientName?: string; resetLink?: string; otpCode?: string; expiryMinutes?: number }) & { correlationId?: string }): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderPasswordResetEmail({
      recipient: targetEmail,
      recipientName: params.recipientName,
      resetLink: params.resetLink,
      otpCode: params.otpCode,
      expiryMinutes: params.expiryMinutes || 15,
    });

    return sendTransactionalEmail({
      type: 'PASSWORD_RESET',
      to: targetEmail,
      recipientName: params.recipientName,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Password changed confirmation
   * Sender: password@fr8x.in
   * Subject: "YOUR FR8X PASSWORD WAS CHANGED"
   */
  async sendPasswordChangedEmail(params: (PasswordChangedTemplateParams | { to: string; recipient?: string; recipientName?: string; changedAt?: string; ipAddress?: string; securityLink?: string }) & { correlationId?: string }): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderPasswordChangedEmail({
      recipient: targetEmail,
      recipientName: params.recipientName,
      changedAt: params.changedAt || new Date().toUTCString(),
      ipAddress: params.ipAddress,
      securityLink: params.securityLink,
    });

    return sendTransactionalEmail({
      type: 'PASSWORD_CHANGED',
      to: targetEmail,
      recipientName: params.recipientName,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Security & Account Lockout notification
   * Sender: password@fr8x.in
   */
  async sendSecurityAlertEmail(params: SecurityAlertTemplateParams & { to: string }): Promise<TransactionalEmailResult> {
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
   * Customer / Member Support request
   * Sender: support@fr8x.in
   * Subject: "FR8X SUPPORT TICKET CREATED — {{TICKET_ID}}"
   */
  async sendSupportEmail(params: (SupportTemplateParams | { to: string; recipient?: string; recipientName?: string; ticketId?: string; subject?: string; message: string; senderName?: string; createdAt?: string }) & { correlationId?: string }): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderSupportEmail({
      recipient: targetEmail,
      recipientName: params.recipientName,
      subject: params.subject,
      message: params.message,
      ticketId: params.ticketId,
      senderName: params.senderName,
      createdAt: params.createdAt,
    });

    return sendTransactionalEmail({
      type: 'SUPPORT_REQUEST',
      to: targetEmail,
      recipientName: params.recipientName,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Technical & Infrastructure notification
   * Sender: tech@fr8x.in
   */
  async sendTechnicalEmail(
    params:
      | TechnicalNotificationTemplateParams
      | ({
          to: string;
          recipient?: string;
          recipientName?: string;
          type?: 'MAINTENANCE' | 'INCIDENT' | 'RESTORED' | 'UPDATE';
          category?: 'MAINTENANCE' | 'INCIDENT' | 'RESTORED' | 'UPDATE';
          incidentId?: string;
          title?: string;
          subject?: string;
          details: string;
          scheduledTime?: string;
          affectedServices?: string[];
        } & { correlationId?: string })
  ): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const resolvedType = params.type || (params as any).category || 'MAINTENANCE';
    const resolvedTitle =
      params.title || (params as any).subject || 'System Technical Notification';

    const tmpl = renderTechnicalEmail({
      recipient: targetEmail,
      recipientName: params.recipientName,
      type: resolvedType,
      incidentId: params.incidentId,
      title: resolvedTitle,
      details: params.details,
      scheduledTime: params.scheduledTime,
      affectedServices: params.affectedServices,
      correlationId: params.correlationId,
    });

    return sendTransactionalEmail({
      type:
        resolvedType === 'MAINTENANCE'
          ? 'SYSTEM_MAINTENANCE'
          : resolvedType === 'INCIDENT'
            ? 'SYSTEM_INCIDENT'
            : 'TECH_NOTIFICATION',
      to: targetEmail,
      recipientName: params.recipientName,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Diagnostic verification test email
   * Sender: password@fr8x.in
   * Subject: "FR8X ZEPTOMAIL TEST"
   * Body: "FR8X ZeptoMail integration test successful."
   */
  async sendTestEmail(
    params:
      | TestEmailTemplateParams
      | ({ to: string; recipient?: string } & { correlationId?: string })
  ): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderTestEmail({
      recipient: targetEmail,
      correlationId: params.correlationId,
    });

    return sendTransactionalEmail({
      type: 'EMAIL_TEST',
      to: targetEmail,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  getStatus: getEmailSendersStatus,
  getZeptoMailStatus,
  validateEmail: isValidEmailAddress,
};
