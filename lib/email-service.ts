/**
 * FR8X Central Server-Side Email Service
 *
 * Architecture:
 * FR8X Client / Console -> FR8X Backend API -> EmailService -> Zoho Flow Webhook -> Zoho Mail -> Recipient
 *
 * Senders & Strict Routing:
 * - SUPPORT: support@fr8x.in (Authenticated and operational via Zoho Flow)
 * - PASSWORD: password@fr8x.in (Dedicated auth mailbox; requires separate Zoho Mail authorization in Zoho Flow)
 *
 * CRITICAL SECURITY POLICIES:
 * 1. The client must NEVER specify arbitrary sender or from_email. Sender is strictly determined by internal email type.
 * 2. Webhook URLs and secrets remain strictly server-side (process.env only).
 * 3. Never log passwords, OTPs, verification/reset tokens, or webhook credentials.
 * 4. Preserves 100% exact Zoho Flow JSON contract:
 *    { "event": "<EVENT>", "to_email": "<RECIPIENT>", "subject": "<SUBJECT>", "message": "<MESSAGE>" }
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

export type EmailEventType =
  | 'SUPPORT_REQUEST'
  | 'SUPPORT_CONTACT'
  | 'SUPPORT_TICKET'
  | 'SUPPORT_NOTIFICATION'
  | 'EMAIL_VERIFICATION'
  | 'AUTH_OTP'
  | 'PASSWORD_OTP'
  | 'PASSWORD_RESET'
  | 'PASSWORD_CHANGED'
  | 'LOGIN_SECURITY'
  | 'EMAIL_TEST';

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
  provider: 'ZOHO_FLOW' | 'MOCK_SANDBOX';
  isPasswordConfigured: boolean;
  error?: string;
}

export interface EmailSenderStatus {
  sender: string;
  mailbox: string;
  isOperational: boolean;
  notes: string;
}

/**
 * Returns the current operational status of the dedicated FR8X email addresses.
 */
export function getEmailSendersStatus(): Record<EmailSenderType, EmailSenderStatus> {
  const supportWebhook =
    process.env.ZOHO_SUPPORT_FLOW_WEBHOOK_URL?.trim() ||
    process.env.ZOHO_FLOW_WEBHOOK_URL?.trim();

  const hasSupportFlow = Boolean(
    supportWebhook && supportWebhook !== 'undefined' && supportWebhook.length > 0
  );

  const passwordWebhook =
    process.env.ZOHO_PASSWORD_FLOW_WEBHOOK_URL?.trim() ||
    process.env.ZOHO_FLOW_PASSWORD_WEBHOOK_URL?.trim();

  const hasDedicatedPasswordFlow = Boolean(
    passwordWebhook && passwordWebhook !== 'undefined' && passwordWebhook.length > 0
  );

  return {
    SUPPORT: {
      sender: 'SUPPORT',
      mailbox: EMAIL_SENDERS.SUPPORT,
      isOperational: hasSupportFlow,
      notes: hasSupportFlow
        ? 'Operational: Configured and authenticated via Zoho Flow (support@fr8x.in).'
        : 'Pending: ZOHO_SUPPORT_FLOW_WEBHOOK_URL is not configured in environment.',
    },
    PASSWORD: {
      sender: 'PASSWORD',
      mailbox: EMAIL_SENDERS.PASSWORD,
      isOperational: hasDedicatedPasswordFlow,
      notes: hasDedicatedPasswordFlow
        ? 'Operational: Dedicated password flow configured via ZOHO_PASSWORD_FLOW_WEBHOOK_URL.'
        : 'PASSWORD@FR8X.IN REQUIRES ZOHO FLOW MAIL CONNECTION/AUTHORIZATION.',
    },
  };
}

/**
 * Validates an email recipient address format (RFC 5322 compatible).
 */
export function isValidEmailAddress(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Sanitizes input to prevent header injection or malicious control characters.
 */
function sanitizeString(str: string): string {
  return str.replace(/[\r\n\t]/g, ' ').trim();
}

/**
 * Resolves the appropriate Zoho Flow webhook URL based on sender type.
 * Server-side only: never exposed to the client.
 */
function resolveWebhookUrl(fromType: EmailSenderType): string | null {
  if (fromType === 'PASSWORD') {
    const customPassUrl =
      process.env.ZOHO_PASSWORD_FLOW_WEBHOOK_URL?.trim() ||
      process.env.ZOHO_FLOW_PASSWORD_WEBHOOK_URL?.trim();
    if (customPassUrl && customPassUrl !== 'undefined') {
      return customPassUrl;
    }
  }

  // Support webhook URL or general fallback
  const supportUrl =
    process.env.ZOHO_SUPPORT_FLOW_WEBHOOK_URL?.trim() ||
    process.env.ZOHO_FLOW_WEBHOOK_URL?.trim();
  if (supportUrl && supportUrl !== 'undefined') {
    return supportUrl;
  }

  return null;
}

/**
 * Central Server-Side Email Dispatcher
 * Sends outbound email strictly following the Zoho Flow JSON contract:
 * {
 *   "event": "<EVENT>",
 *   "to_email": "<RECIPIENT>",
 *   "subject": "<SUBJECT>",
 *   "message": "<MESSAGE>"
 * }
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
  const correlationId =
    params.correlationId ||
    `GF-EML-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const cleanTo = (params.to || '').trim().toLowerCase();
  const cleanSubject = sanitizeString(params.subject || '');
  const cleanMessage = (params.message || '').trim();

  // Validate recipient email
  if (!isValidEmailAddress(cleanTo)) {
    return {
      success: false,
      correlationId,
      event: params.event,
      fromType: params.fromType,
      sender: EMAIL_SENDERS[params.fromType] || 'unknown',
      to: cleanTo,
      provider: 'ZOHO_FLOW',
      isPasswordConfigured: false,
      error: 'Invalid recipient email address format.',
    };
  }

  // Validate subject
  if (!cleanSubject) {
    return {
      success: false,
      correlationId,
      event: params.event,
      fromType: params.fromType,
      sender: EMAIL_SENDERS[params.fromType],
      to: cleanTo,
      provider: 'ZOHO_FLOW',
      isPasswordConfigured: false,
      error: 'Email subject cannot be empty.',
    };
  }

  // Validate body message
  if (!cleanMessage) {
    return {
      success: false,
      correlationId,
      event: params.event,
      fromType: params.fromType,
      sender: EMAIL_SENDERS[params.fromType],
      to: cleanTo,
      provider: 'ZOHO_FLOW',
      isPasswordConfigured: false,
      error: 'Email body message cannot be empty.',
    };
  }

  const senderAddress = EMAIL_SENDERS[params.fromType] || EMAIL_SENDERS.SUPPORT;
  const webhookUrl = resolveWebhookUrl(params.fromType);
  const status = getEmailSendersStatus();
  const isPasswordOperational = status.PASSWORD.isOperational;

  // REQUIRED BACKEND PAYLOAD (Section 2 & 3 JSON Contract)
  const payload = {
    event: params.event,
    to_email: cleanTo,
    subject: cleanSubject,
    message: cleanMessage,
  };

  // If no Zoho Flow webhook URL is set in environment, use mock sandbox dispatch
  if (!webhookUrl) {
    const domain = cleanTo.split('@')[1] || 'unknown';
    console.log(
      `[EMAIL_SANDBOX_DISPATCH] From: ${senderAddress} (${params.fromType}) | Event: ${params.event} | Recipient: ***@${domain} | Correlation: ${correlationId}`
    );

    return {
      success: true,
      messageId: `mock-flow-${Date.now()}`,
      correlationId,
      event: params.event,
      fromType: params.fromType,
      sender: senderAddress,
      to: cleanTo,
      provider: 'MOCK_SANDBOX',
      isPasswordConfigured: isPasswordOperational,
    };
  }

  // Live Zoho Flow Webhook Dispatch with retry
  const MAX_RETRIES = 1;
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout limit

    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'FR8X-Core-Engine/1.0',
          'X-Correlation-ID': correlationId,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        console.log(
          `[ZOHO_FLOW_DISPATCH_SUCCESS] Event: ${params.event} | Sender: ${senderAddress} | Correlation: ${correlationId} | HTTP ${response.status}`
        );

        return {
          success: true,
          messageId: `flow-${Date.now()}`,
          correlationId,
          event: params.event,
          fromType: params.fromType,
          sender: senderAddress,
          to: cleanTo,
          provider: 'ZOHO_FLOW',
          isPasswordConfigured: isPasswordOperational,
        };
      }

      lastError = `Zoho Flow returned HTTP status ${response.status}`;
      console.warn(
        `[ZOHO_FLOW_HTTP_WARN] Attempt ${attempt + 1}: ${lastError} | Correlation: ${correlationId}`
      );
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        lastError = 'Zoho Flow webhook request timed out (8s limit exceeded)';
      } else {
        lastError = err.message || 'Zoho Flow network connection error';
      }
      console.warn(
        `[ZOHO_FLOW_RETRY_WARN] Attempt ${attempt + 1} failed: ${lastError} | Correlation: ${correlationId}`
      );
    }

    if (attempt < MAX_RETRIES) {
      await new Promise((res) => setTimeout(res, 600));
    }
  }

  console.error(
    `[ZOHO_FLOW_ERROR] All dispatch attempts failed for event: ${params.event} | Correlation: ${correlationId} | Reason: ${lastError}`
  );

  return {
    success: false,
    correlationId,
    event: params.event,
    fromType: params.fromType,
    sender: senderAddress,
    to: cleanTo,
    provider: 'ZOHO_FLOW',
    isPasswordConfigured: isPasswordOperational,
    error: lastError || 'Email dispatch failed through Zoho Flow',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// CENTRALIZED EMAIL SERVICE ABSTRACTION
// ─────────────────────────────────────────────────────────────────────────────

export const EmailService = {
  /**
   * Support emails: strictly routes to support@fr8x.in
   */
  async sendSupportEmail(params: {
    to: string;
    subject: string;
    message: string;
    ticketId?: string;
    senderName?: string;
    correlationId?: string;
  }): Promise<SendEmailResponse> {
    const tmpl = renderSupportEmail({
      recipient: params.to,
      subject: params.subject,
      message: params.message,
      ticketId: params.ticketId,
      senderName: params.senderName,
    });

    return sendEmail({
      fromType: 'SUPPORT',
      to: params.to,
      subject: tmpl.subject,
      message: tmpl.text,
      htmlMessage: tmpl.html,
      event: 'SUPPORT_REQUEST',
      correlationId: params.correlationId,
    });
  },

  /**
   * General authentication / password email dispatcher: strictly routes to password@fr8x.in
   */
  async sendPasswordEmail(params: {
    to: string;
    subject: string;
    message: string;
    htmlMessage?: string;
    event?: EmailEventType;
    correlationId?: string;
  }): Promise<SendEmailResponse> {
    return sendEmail({
      fromType: 'PASSWORD',
      to: params.to,
      subject: params.subject,
      message: params.message,
      htmlMessage: params.htmlMessage,
      event: params.event || 'PASSWORD_RESET',
      correlationId: params.correlationId,
    });
  },

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
  }): Promise<SendEmailResponse> {
    const tmpl = renderEmailVerificationEmail({
      recipient: params.to,
      verificationLink: params.verificationLink,
      otpCode: params.otpCode,
      expiryMinutes: params.expiryMinutes || 1440,
    });

    return sendEmail({
      fromType: 'PASSWORD',
      to: params.to,
      subject: tmpl.subject,
      message: tmpl.text,
      htmlMessage: tmpl.html,
      event: 'EMAIL_VERIFICATION',
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
  }): Promise<SendEmailResponse> {
    const tmpl = renderOtpChallengeEmail({
      recipient: params.to,
      otpCode: params.otpCode,
      expiryMinutes: params.expiryMinutes || 10,
      correlationId: params.correlationId,
    });

    return sendEmail({
      fromType: 'PASSWORD',
      to: params.to,
      subject: tmpl.subject,
      message: tmpl.text,
      htmlMessage: tmpl.html,
      event: 'AUTH_OTP',
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
  }): Promise<SendEmailResponse> {
    const tmpl = renderPasswordResetEmail({
      recipient: params.to,
      resetLink: params.resetLink,
      otpCode: params.otpCode,
      expiryMinutes: params.expiryMinutes || 15,
    });

    return sendEmail({
      fromType: 'PASSWORD',
      to: params.to,
      subject: tmpl.subject,
      message: tmpl.text,
      htmlMessage: tmpl.html,
      event: 'PASSWORD_RESET',
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
  }): Promise<SendEmailResponse> {
    const tmpl = renderPasswordChangedEmail({
      recipient: params.to,
      changedAt: params.changedAt || new Date().toUTCString(),
      ipAddress: params.ipAddress,
    });

    return sendEmail({
      fromType: 'PASSWORD',
      to: params.to,
      subject: tmpl.subject,
      message: tmpl.text,
      htmlMessage: tmpl.html,
      event: 'PASSWORD_CHANGED',
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
  }): Promise<SendEmailResponse> {
    const tmpl = renderSecurityAlertEmail({
      subject: params.subject,
      details: params.details,
      correlationId: params.correlationId,
      ipAddress: params.ipAddress,
    });

    return sendEmail({
      fromType: 'PASSWORD',
      to: params.to,
      subject: tmpl.subject,
      message: tmpl.text,
      htmlMessage: tmpl.html,
      event: 'LOGIN_SECURITY',
      correlationId: params.correlationId,
    });
  },

  getStatus: getEmailSendersStatus,
  validateEmail: isValidEmailAddress,
};
