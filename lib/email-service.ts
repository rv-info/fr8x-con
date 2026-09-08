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
  renderForgotPasswordEmail,
  renderSupportReplyEmail,
  renderTechnicalMaintenanceEmail,
  renderTechnicalIncidentEmail,
  renderTechnicalRecoveryEmail,
  renderWelcomeEmail,
  renderPricingPlanUpdateEmail,
  renderBillingIssueEmail,
  renderSystemIssueEmail,
  EmailVerificationTemplateParams,
  PasswordResetTemplateParams,
  PasswordChangedTemplateParams,
  OtpChallengeTemplateParams,
  SupportTemplateParams,
  TechnicalNotificationTemplateParams,
  SecurityAlertTemplateParams,
  TestEmailTemplateParams,
  ForgotPasswordTemplateParams,
  SupportReplyTemplateParams,
  TechnicalMaintenanceTemplateParams,
  TechnicalIncidentTemplateParams,
  TechnicalRecoveryTemplateParams,
  WelcomeTemplateParams,
  PricingPlanUpdateTemplateParams,
  BillingIssueTemplateParams,
  SystemIssueTemplateParams,
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

export type ZeptoMailTemplateIdentifier =
  | 'FR8X_WELCOME_USER'
  | 'FR8X_EMAIL_VERIFICATION'
  | 'FR8X_SECURITY_OTP'
  | 'FR8X_FORGOT_PASSWORD'
  | 'FR8X_PASSWORD_CHANGED'
  | 'FR8X_LOGIN_SECURITY_ALERT'
  | 'FR8X_PRICING_PLAN_UPDATE'
  | 'FR8X_BILLING_ISSUE'
  | 'FR8X_SUPPORT_TICKET'
  | 'FR8X_SYSTEM_ISSUE';

export const ZEPTOMAIL_TEMPLATES: Record<
  ZeptoMailTemplateIdentifier,
  {
    templateKeyEnvVar: string;
    defaultKey: string;
    senderType: EmailSenderType;
    defaultSubject: string;
  }
> = {
  FR8X_WELCOME_USER: {
    templateKeyEnvVar: 'ZEPTO_TEMPLATE_FR8X_WELCOME_USER',
    defaultKey: '2518b.7300c3b061031d8e.k1.7cbfe1a0-1234-11ef-8f6b-5254005d5e56',
    senderType: 'PASSWORD',
    defaultSubject: 'Welcome to FR8X — Your Account Has Been Created',
  },
  FR8X_EMAIL_VERIFICATION: {
    templateKeyEnvVar: 'ZEPTO_TEMPLATE_FR8X_EMAIL_VERIFICATION',
    defaultKey: '2518b.7300c3b061031d8e.k1.7cbfe1a1-1234-11ef-8f6b-5254005d5e56',
    senderType: 'PASSWORD',
    defaultSubject: 'Verify Your FR8X Email Address',
  },
  FR8X_SECURITY_OTP: {
    templateKeyEnvVar: 'ZEPTO_TEMPLATE_FR8X_SECURITY_OTP',
    defaultKey: '2518b.7300c3b061031d8e.k1.7cbfe1a2-1234-11ef-8f6b-5254005d5e56',
    senderType: 'PASSWORD',
    defaultSubject: 'Your FR8X Verification Code',
  },
  FR8X_FORGOT_PASSWORD: {
    templateKeyEnvVar: 'ZEPTO_TEMPLATE_FR8X_FORGOT_PASSWORD',
    defaultKey: '2518b.7300c3b061031d8e.k1.7cbfe1a3-1234-11ef-8f6b-5254005d5e56',
    senderType: 'PASSWORD',
    defaultSubject: 'Reset Your FR8X Password',
  },
  FR8X_PASSWORD_CHANGED: {
    templateKeyEnvVar: 'ZEPTO_TEMPLATE_FR8X_PASSWORD_CHANGED',
    defaultKey: '2518b.7300c3b061031d8e.k1.7cbfe1a4-1234-11ef-8f6b-5254005d5e56',
    senderType: 'PASSWORD',
    defaultSubject: 'Your FR8X Password Has Been Changed',
  },
  FR8X_LOGIN_SECURITY_ALERT: {
    templateKeyEnvVar: 'ZEPTO_TEMPLATE_FR8X_LOGIN_SECURITY_ALERT',
    defaultKey: '2518b.7300c3b061031d8e.k1.7cbfe1a5-1234-11ef-8f6b-5254005d5e56',
    senderType: 'PASSWORD',
    defaultSubject: 'FR8X Security Alert — New Login Detected',
  },
  FR8X_PRICING_PLAN_UPDATE: {
    templateKeyEnvVar: 'ZEPTO_TEMPLATE_FR8X_PRICING_PLAN_UPDATE',
    defaultKey: '2518b.7300c3b061031d8e.k1.7cbfe1a6-1234-11ef-8f6b-5254005d5e56',
    senderType: 'SUPPORT',
    defaultSubject: 'FR8X — Your Plan & Pricing Information',
  },
  FR8X_BILLING_ISSUE: {
    templateKeyEnvVar: 'ZEPTO_TEMPLATE_FR8X_BILLING_ISSUE',
    defaultKey: '2518b.7300c3b061031d8e.k1.7cbfe1a7-1234-11ef-8f6b-5254005d5e56',
    senderType: 'SUPPORT',
    defaultSubject: 'Action Required — FR8X Billing Issue',
  },
  FR8X_SUPPORT_TICKET: {
    templateKeyEnvVar: 'ZEPTO_TEMPLATE_FR8X_SUPPORT_TICKET',
    defaultKey: '2518b.7300c3b061031d8e.k1.7cbfe1a8-1234-11ef-8f6b-5254005d5e56',
    senderType: 'SUPPORT',
    defaultSubject: 'FR8X Support Ticket — {{ticket_id}}',
  },
  FR8X_SYSTEM_ISSUE: {
    templateKeyEnvVar: 'ZEPTO_TEMPLATE_FR8X_SYSTEM_ISSUE',
    defaultKey: '2518b.7300c3b061031d8e.k1.7cbfe1a9-1234-11ef-8f6b-5254005d5e56',
    senderType: 'TECH',
    defaultSubject: 'FR8X Technical Notice — {{incident_title}}',
  },
};

export interface SendTemplateEmailParams {
  template: ZeptoMailTemplateIdentifier;
  to: string;
  recipientName?: string;
  mergeInfo?: Record<string, string | number | boolean | undefined>;
  clientReference?: string;
  correlationId?: string;
  fallbackSubject?: string;
  fallbackHtml?: string;
  fallbackText?: string;
}

export interface SendTemplateEmailResult extends TransactionalEmailResult {
  template: ZeptoMailTemplateIdentifier;
  templateKey?: string;
}

export interface EmailEventRecord {
  id: string;
  eventId: string;
  clientReference: string;
  template?: string;
  templateKey?: string;
  sender: string;
  recipient: string;
  provider: 'Zoho_ZeptoMail' | 'Sandbox_Mock' | 'Zoho_SMTP';
  providerMessageId?: string;
  status: 'sent' | 'processed' | 'delivered' | 'soft_bounce' | 'hard_bounce' | 'failed';
  createdAt: string;
  sentAt?: string;
  deliveredAt?: string;
  failedAt?: string;
  failureCode?: string;
  failureReason?: string;
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
      let currentEndpoint = endpoint;
      let response = await fetchWithRetry(
        currentEndpoint,
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

      let resData = await response.json().catch(() => ({}));

      // Intelligent Regional Failover: If 401 Unauthorized (Invalid API Token found) on .com, retry on .in (and vice versa)
      if (
        response.status === 401 &&
        (resData?.error?.code === 'TM_4001' ||
          String(resData?.error?.message || '').toLowerCase().includes('access denied'))
      ) {
        const alternateEndpoint = currentEndpoint.includes('api.zeptomail.com')
          ? currentEndpoint.replace('api.zeptomail.com', 'api.zeptomail.in')
          : currentEndpoint.includes('api.zeptomail.in')
            ? currentEndpoint.replace('api.zeptomail.in', 'api.zeptomail.com')
            : null;

        if (alternateEndpoint) {
          console.warn(
            `[ZEPTOMAIL_REGION_FAILOVER] Token invalid on ${currentEndpoint}. Attempting alternate regional endpoint: ${alternateEndpoint}`
          );
          try {
            const altResponse = await fetchWithRetry(
              alternateEndpoint,
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
              1
            );
            const altData = await altResponse.json().catch(() => ({}));
            if (altResponse.ok) {
              response = altResponse;
              resData = altData;
              currentEndpoint = alternateEndpoint;
            }
          } catch (altErr: any) {
            console.warn(
              `[ZEPTOMAIL_REGION_FAILOVER_FAIL] Alternate endpoint error: ${altErr.message}`
            );
          }
        }
      }

      if (response.ok) {
        const messageId =
          resData?.data?.[0]?.message_id ||
          resData?.data?.[0]?.id ||
          resData?.request_id ||
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
        const detailObj = resData?.error?.details?.[0];
        const detailMsg = detailObj?.message
          ? `${detailObj.message}${detailObj.target_value ? ` (quota/limit: ${detailObj.target_value})` : ''}`
          : null;
        const errorDetail = detailMsg
          ? `${resData?.error?.message || 'Request Denied'}: ${detailMsg}`
          : resData?.error?.message ||
            resData?.message ||
            `HTTP ${response.status} ${response.statusText}`;

        console.error(
          `[ZEPTOMAIL_API_ERROR] API rejection for ${cleanTo}: ${errorDetail}`
        );

        // Intelligent handling for ZeptoMail Quota/Daily Limit Exceeded (TM_3601 / SM_151) or API Rejection
        const isDailyLimitExceeded =
          resData?.error?.code === 'TM_3601' ||
          detailObj?.code === 'SM_151' ||
          String(errorDetail).toLowerCase().includes('per day mail limit exceeded');

        if (isDailyLimitExceeded) {
          console.warn(
            `[ZEPTOMAIL_DAILY_LIMIT_EXCEEDED] Zoho ZeptoMail Mail Agent daily limit (3 emails/day) exceeded for ${cleanTo}. To remove this limit in production, increase the daily quota in Zoho ZeptoMail Console (https://mailagent.zoho.in) under Mail Agents -> agent_1 -> Limits.`
          );
        }

        // 1. Attempt Zoho / Generic SMTP Failover if credentials configured
        const smtpPassword = (process.env.ZOHO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || '').trim();
        if (smtpPassword) {
          try {
            console.log(`[SMTP_FAILOVER] Attempting failover delivery via SMTP for ${cleanTo}...`);
            const { sendViaSmtp } = await import('@/lib/mailer');
            const smtpRes = await sendViaSmtp({
              recipient: cleanTo,
              recipientName,
              subject: cleanSubject,
              htmlBody: htmlContent,
              textBody: textContent,
              fromAddress: sender.address,
              correlationId,
            });
            if (smtpRes && smtpRes.success) {
              return {
                success: true,
                messageId: smtpRes.messageId,
                correlationId,
                type: resolvedType,
                from: sender.address,
                to: cleanTo,
                subject: cleanSubject,
                provider: 'Zoho_SMTP' as any,
                details: { failoverFrom: 'Zoho_ZeptoMail', smtpRes },
              };
            }
          } catch (smtpErr: any) {
            console.warn(`[SMTP_FAILOVER_FAIL] SMTP failover failed: ${smtpErr.message}`);
          }
        }

        // 2. Attempt Resend API Failover if RESEND_API_KEY is configured
        const resendApiKey = (process.env.RESEND_API_KEY || '').trim();
        if (resendApiKey) {
          try {
            console.log(`[RESEND_FAILOVER] Attempting failover delivery via Resend API for ${cleanTo}...`);
            const resendFrom = process.env.RESEND_FROM || `${sender.name} <onboarding@resend.dev>`;
            const resendRes = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: resendFrom,
                to: [cleanTo],
                subject: cleanSubject,
                html: htmlContent,
                text: textContent,
              }),
            });
            const resendData = await resendRes.json().catch(() => ({}));
            if (resendRes.ok && resendData?.id) {
              console.log(`[RESEND_SUCCESS] Email sent via Resend: ${resendData.id}`);
              return {
                success: true,
                messageId: resendData.id,
                correlationId,
                type: resolvedType,
                from: resendFrom,
                to: cleanTo,
                subject: cleanSubject,
                provider: 'Zoho_ZeptoMail' as any,
                details: { failoverFrom: 'Zoho_ZeptoMail', provider: 'Resend', resendData },
              };
            }
          } catch (resendErr: any) {
            console.warn(`[RESEND_FAILOVER_FAIL] Resend failover failed: ${resendErr.message}`);
          }
        }

        // 3. Fallback to simulated delivery ONLY when ALLOW_DEV_EMAIL_FALLBACK is explicitly enabled AND it is specifically a quota exhaustion
        const isQuotaFallbackAllowed =
          isDailyLimitExceeded && process.env.ALLOW_DEV_EMAIL_FALLBACK === 'true';

        if (isQuotaFallbackAllowed) {
          console.log('\n================================================================================');
          console.log(`⚡ [EMAIL_DEV_FALLBACK_DISPATCH] Simulated Delivery to: ${cleanTo}`);
          console.log(`⚡ Subject: ${cleanSubject}`);
          console.log(`⚡ Type: ${resolvedType}`);
          if (textContent) {
            console.log(`⚡ Content Snippet: ${textContent.substring(0, 120)}...`);
          }
          console.log(`⚡ Notice: ZeptoMail rejection ("${errorDetail}").`);
          console.log(`⚡ TO RECEIVE REAL EMAILS: Provide ZOHO_SMTP_PASSWORD in .env.local or increase quota in mailagent.zoho.in.`);
          console.log('================================================================================\n');

          return {
            success: true,
            messageId: `dev-zepto-cap-${Date.now()}`,
            correlationId,
            type: resolvedType,
            from: sender.address,
            to: cleanTo,
            subject: cleanSubject,
            provider: 'Sandbox_Mock',
            details: {
              warning: 'ZeptoMail daily limit reached - fell back to development console dispatch',
              originalError: errorDetail,
            },
          };
        }

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

// ─── Email Event Model & Idempotency Store ──────────────────────────────────
const emailEventStore: EmailEventRecord[] = [];
const MAX_EMAIL_EVENTS = 500;
const idempotencyCache = new Map<string, { timestamp: number; result: SendTemplateEmailResult }>();
const IDEMPOTENCY_WINDOW_MS = 10_000; // 10 seconds duplicate suppression

export function recordEmailEvent(
  event: Omit<EmailEventRecord, 'id' | 'createdAt'>
): EmailEventRecord {
  const fullEvent: EmailEventRecord = {
    id: `eml-evt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
    ...event,
  };
  emailEventStore.unshift(fullEvent);
  if (emailEventStore.length > MAX_EMAIL_EVENTS) {
    emailEventStore.pop();
  }
  return fullEvent;
}

export function getEmailEvents(): EmailEventRecord[] {
  return [...emailEventStore];
}

/**
 * ZeptoMail Template API Dispatcher
 * Directly communicates with https://api.zeptomail.com/v1.1/email/template
 */
export async function sendTemplateEmail(
  params: SendTemplateEmailParams
): Promise<SendTemplateEmailResult> {
  const templateConfig = ZEPTOMAIL_TEMPLATES[params.template];
  const templateKey =
    process.env[templateConfig.templateKeyEnvVar]?.trim() || templateConfig.defaultKey;
  const correlationId =
    params.correlationId ||
    `FR8X-EML-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
  const clientReference =
    params.clientReference ||
    `FR8X-${params.template}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  // Idempotency check: prevent duplicate sends within rapid window
  const now = Date.now();
  const cached = idempotencyCache.get(clientReference);
  if (cached && now - cached.timestamp < IDEMPOTENCY_WINDOW_MS) {
    console.log(
      `[EMAIL_IDEMPOTENCY] Suppressed duplicate email send for clientReference: ${clientReference}`
    );
    return {
      ...cached.result,
      template: params.template,
      templateKey,
    };
  }

  const cleanTo = (params.to || '').trim().toLowerCase();
  if (!isValidEmailAddress(cleanTo)) {
    const error = `Invalid recipient email address: "${cleanTo}"`;
    recordEmailEvent({
      eventId: correlationId,
      clientReference,
      template: params.template,
      templateKey,
      sender: EMAIL_SENDERS[templateConfig.senderType],
      recipient: cleanTo,
      provider: 'Zoho_ZeptoMail',
      status: 'failed',
      failureCode: 'INVALID_RECIPIENT',
      failureReason: error,
    });
    return {
      success: false,
      correlationId,
      template: params.template,
      templateKey,
      from: EMAIL_SENDERS[templateConfig.senderType],
      to: cleanTo,
      provider: 'Zoho_ZeptoMail',
      error,
    };
  }

  const senderAddress =
    (templateConfig.senderType === 'PASSWORD'
      ? process.env.ZEPTO_MAIL_PASSWORD_FROM
      : templateConfig.senderType === 'SUPPORT'
        ? process.env.ZEPTO_MAIL_SUPPORT_FROM
        : process.env.ZEPTO_MAIL_TECH_FROM) || EMAIL_SENDERS[templateConfig.senderType];

  const senderName = `${process.env.ZEPTO_MAIL_FROM_NAME || 'FR8X'} Security`;

  const token = (
    process.env.ZEPTO_MAIL_API_KEY ||
    process.env.ZOHO_ZEPTOMAIL_TOKEN ||
    ''
  ).trim();
  const hasToken = Boolean(token && token !== 'undefined' && token.length > 5);

  if (!hasToken) {
    console.log(
      `[EMAIL_DEV_TEMPLATE_DISPATCH] Simulating template ${params.template} to ${cleanTo} via ${senderAddress}`
    );
    const mockResult: SendTemplateEmailResult = {
      success: true,
      messageId: `mock-zepto-tmpl-${Date.now()}`,
      correlationId,
      template: params.template,
      templateKey,
      from: senderAddress,
      to: cleanTo,
      subject: params.fallbackSubject || templateConfig.defaultSubject,
      provider: 'Sandbox_Mock',
      details: { mode: 'sandbox', mergeInfo: params.mergeInfo },
    };
    recordEmailEvent({
      eventId: correlationId,
      clientReference,
      template: params.template,
      templateKey,
      sender: senderAddress,
      recipient: cleanTo,
      provider: 'Sandbox_Mock',
      providerMessageId: mockResult.messageId,
      status: 'sent',
      sentAt: new Date().toISOString(),
    });
    idempotencyCache.set(clientReference, { timestamp: now, result: mockResult });
    return mockResult;
  }

  // Live ZeptoMail Template API dispatch
  const templateEndpoint =
    process.env.ZEPTO_MAIL_TEMPLATE_URL?.trim() ||
    'https://api.zeptomail.com/v1.1/email/template';

  const authHeader = token.startsWith('Zoho-enczapikey') ? token : `Zoho-enczapikey ${token}`;
  const payload = {
    template_key: templateKey,
    bounce_address: process.env.ZEPTO_MAIL_BOUNCE_ADDRESS?.trim() || undefined,
    from: {
      address: senderAddress,
      name: senderName,
    },
    to: [
      {
        email_address: {
          address: cleanTo,
          name: params.recipientName || cleanTo,
        },
      },
    ],
    merge_info: params.mergeInfo || {},
    client_reference: clientReference,
  };

  try {
    const res = await fetch(templateEndpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authHeader,
        'X-Correlation-ID': correlationId,
      },
      body: JSON.stringify(payload),
    });

    const resData = await res.json().catch(() => ({}));

    if (res.ok) {
      const messageId =
        resData?.data?.[0]?.message_id ||
        resData?.data?.[0]?.id ||
        resData?.request_id ||
        `zepto-tmpl-${Date.now()}`;

      const result: SendTemplateEmailResult = {
        success: true,
        messageId,
        correlationId,
        template: params.template,
        templateKey,
        from: senderAddress,
        to: cleanTo,
        subject: params.fallbackSubject || templateConfig.defaultSubject,
        provider: 'Zoho_ZeptoMail',
        details: resData,
      };

      recordEmailEvent({
        eventId: correlationId,
        clientReference,
        template: params.template,
        templateKey,
        sender: senderAddress,
        recipient: cleanTo,
        provider: 'Zoho_ZeptoMail',
        providerMessageId: messageId,
        status: 'sent',
        sentAt: new Date().toISOString(),
      });

      idempotencyCache.set(clientReference, { timestamp: now, result });
      return result;
    }

    // Fallback gracefully to pre-rendered HTML transactional send if template key is not provisioned on live ZeptoMail
    if (params.fallbackHtml) {
      console.warn(
        `[ZEPTOMAIL_TEMPLATE_FALLBACK] Template API returned ${res.status}. Falling back to pre-rendered HTML dispatch.`
      );
      const fallbackResult = await sendTransactionalEmail({
        type:
          templateConfig.senderType === 'PASSWORD'
            ? 'AUTH_OTP'
            : templateConfig.senderType === 'SUPPORT'
              ? 'SUPPORT_REQUEST'
              : 'TECH_NOTIFICATION',
        to: cleanTo,
        recipientName: params.recipientName,
        subject: params.fallbackSubject || templateConfig.defaultSubject,
        html: params.fallbackHtml,
        text: params.fallbackText,
        correlationId,
      });

      return {
        ...fallbackResult,
        template: params.template,
        templateKey,
      };
    }

    const errorMsg = resData?.error?.message || `HTTP ${res.status} ${res.statusText}`;
    recordEmailEvent({
      eventId: correlationId,
      clientReference,
      template: params.template,
      templateKey,
      sender: senderAddress,
      recipient: cleanTo,
      provider: 'Zoho_ZeptoMail',
      status: 'failed',
      failedAt: new Date().toISOString(),
      failureCode: String(res.status),
      failureReason: errorMsg,
    });

    return {
      success: false,
      correlationId,
      template: params.template,
      templateKey,
      from: senderAddress,
      to: cleanTo,
      provider: 'Zoho_ZeptoMail',
      error: `ZeptoMail Template API rejected dispatch: ${errorMsg}`,
      details: resData,
    };
  } catch (err: any) {
    const errorMsg = `ZeptoMail template connection failed: ${err.message}`;
    return {
      success: false,
      correlationId,
      template: params.template,
      templateKey,
      from: senderAddress,
      to: cleanTo,
      provider: 'Zoho_ZeptoMail',
      error: errorMsg,
    };
  }
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
    provider:
      result.provider === 'ZOHO_ZEPTOMAIL' || result.provider === 'Zoho_ZeptoMail'
        ? 'Zoho_ZeptoMail'
        : 'Sandbox_Mock',
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
   * Forgot password recovery email
   * Sender: password@fr8x.in
   * Subject: "FORGOT PASSWORD REQUEST — FR8X"
   */
  async sendForgotPasswordEmail(
    params: (ForgotPasswordTemplateParams | { to: string; recipient?: string; recipientName?: string; resetLink?: string; otpCode?: string; expiryMinutes?: number }) & { correlationId?: string }
  ): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderForgotPasswordEmail({
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
   * Customer / Member Support reply
   * Sender: support@fr8x.in
   */
  async sendSupportReplyEmail(
    params: (SupportReplyTemplateParams | { to: string; recipient?: string; recipientName?: string; ticketId: string; replyMessage: string; agentName?: string; originalSubject?: string }) & { correlationId?: string }
  ): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderSupportReplyEmail({
      recipient: targetEmail,
      recipientName: params.recipientName,
      ticketId: params.ticketId,
      replyMessage: params.replyMessage,
      agentName: params.agentName,
      originalSubject: params.originalSubject,
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
   * Technical maintenance notice
   * Sender: tech@fr8x.in
   */
  async sendMaintenanceEmail(
    params: (TechnicalMaintenanceTemplateParams | { to: string; recipient?: string; recipientName?: string; scheduledTime: string; details: string; affectedServices?: string[] }) & { correlationId?: string }
  ): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderTechnicalMaintenanceEmail({
      recipient: targetEmail,
      recipientName: params.recipientName,
      scheduledTime: params.scheduledTime,
      details: params.details,
      affectedServices: params.affectedServices,
      correlationId: params.correlationId,
    });

    return sendTransactionalEmail({
      type: 'SYSTEM_MAINTENANCE',
      to: targetEmail,
      recipientName: params.recipientName,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Technical incident notice
   * Sender: tech@fr8x.in
   */
  async sendIncidentEmail(
    params: (TechnicalIncidentTemplateParams | { to: string; recipient?: string; recipientName?: string; incidentId: string; details: string; severity?: string; affectedServices?: string[] }) & { correlationId?: string }
  ): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderTechnicalIncidentEmail({
      recipient: targetEmail,
      recipientName: params.recipientName,
      incidentId: params.incidentId,
      details: params.details,
      severity: params.severity,
      affectedServices: params.affectedServices,
      correlationId: params.correlationId,
    });

    return sendTransactionalEmail({
      type: 'SYSTEM_INCIDENT',
      to: targetEmail,
      recipientName: params.recipientName,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Technical service restored notice
   * Sender: tech@fr8x.in
   */
  async sendRecoveryEmail(
    params: (TechnicalRecoveryTemplateParams | { to: string; recipient?: string; recipientName?: string; incidentId: string; details: string; resolvedTime?: string; affectedServices?: string[] }) & { correlationId?: string }
  ): Promise<TransactionalEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderTechnicalRecoveryEmail({
      recipient: targetEmail,
      recipientName: params.recipientName,
      incidentId: params.incidentId,
      details: params.details,
      resolvedTime: params.resolvedTime,
      affectedServices: params.affectedServices,
      correlationId: params.correlationId,
    });

    return sendTransactionalEmail({
      type: 'SERVICE_RESTORED',
      to: targetEmail,
      recipientName: params.recipientName,
      subject: tmpl.subject,
      text: tmpl.text,
      html: tmpl.html,
      correlationId: params.correlationId,
    });
  },

  /**
   * Welcome onboarding email (FR8X_WELCOME_USER)
   * Sender: password@fr8x.in
   */
  async sendWelcomeEmail(
    params: (WelcomeTemplateParams | { to?: string; recipient?: string; firstName?: string; fullName?: string; organizationName?: string; verificationUrl?: string }) & { correlationId?: string; clientReference?: string }
  ): Promise<SendTemplateEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderWelcomeEmail({
      recipient: targetEmail,
      firstName: params.firstName,
      fullName: params.fullName,
      organizationName: params.organizationName,
      verificationUrl: params.verificationUrl,
    });
    const firstName = params.firstName || (params.fullName ? params.fullName.split(' ')[0] : 'Member');
    return sendTemplateEmail({
      template: 'FR8X_WELCOME_USER',
      to: targetEmail,
      recipientName: params.fullName || firstName,
      mergeInfo: {
        first_name: firstName,
        full_name: params.fullName || firstName,
        organization_name: params.organizationName || 'FR8X Network',
        verification_url: params.verificationUrl || '',
      },
      clientReference: params.clientReference,
      correlationId: params.correlationId,
      fallbackSubject: tmpl.subject,
      fallbackHtml: tmpl.html,
      fallbackText: tmpl.text,
    });
  },

  /**
   * Commercial pricing tier update (FR8X_PRICING_PLAN_UPDATE)
   * Sender: support@fr8x.in
   */
  async sendPricingEmail(
    params: (PricingPlanUpdateTemplateParams | { to?: string; recipient?: string; firstName?: string; planName: string; effectiveDate?: string; dashboardUrl?: string }) & { correlationId?: string; clientReference?: string }
  ): Promise<SendTemplateEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderPricingPlanUpdateEmail({
      recipient: targetEmail,
      firstName: params.firstName,
      planName: params.planName,
      effectiveDate: params.effectiveDate,
      dashboardUrl: params.dashboardUrl,
    });
    return sendTemplateEmail({
      template: 'FR8X_PRICING_PLAN_UPDATE',
      to: targetEmail,
      recipientName: params.firstName,
      mergeInfo: {
        first_name: params.firstName || 'Member',
        plan_name: params.planName,
        effective_date: params.effectiveDate || new Date().toISOString(),
        dashboard_url: params.dashboardUrl || '',
      },
      clientReference: params.clientReference,
      correlationId: params.correlationId,
      fallbackSubject: tmpl.subject,
      fallbackHtml: tmpl.html,
      fallbackText: tmpl.text,
    });
  },

  /**
   * Commercial billing notice (FR8X_BILLING_ISSUE)
   * Sender: support@fr8x.in
   */
  async sendBillingIssueEmail(
    params: (BillingIssueTemplateParams | { to?: string; recipient?: string; firstName?: string; invoiceId: string; amount: string; dueDate?: string; billingUrl?: string }) & { correlationId?: string; clientReference?: string }
  ): Promise<SendTemplateEmailResult> {
    const targetEmail = (params.recipient || (params as any).to || '').trim();
    const tmpl = renderBillingIssueEmail({
      recipient: targetEmail,
      firstName: params.firstName,
      invoiceId: params.invoiceId,
      amount: params.amount,
      dueDate: params.dueDate,
      billingUrl: params.billingUrl,
    });
    return sendTemplateEmail({
      template: 'FR8X_BILLING_ISSUE',
      to: targetEmail,
      recipientName: params.firstName,
      mergeInfo: {
        first_name: params.firstName || 'Member',
        invoice_id: params.invoiceId,
        amount: params.amount,
        due_date: params.dueDate || 'Immediate',
        billing_url: params.billingUrl || '',
      },
      clientReference: params.clientReference,
      correlationId: params.correlationId,
      fallbackSubject: tmpl.subject,
      fallbackHtml: tmpl.html,
      fallbackText: tmpl.text,
    });
  },

  /**
   * Platform system incident / issue notice (FR8X_SYSTEM_ISSUE)
   * Sender: tech@fr8x.in
   */
  async sendSystemIssueEmail(
    params: SystemIssueTemplateParams & { correlationId?: string; clientReference?: string }
  ): Promise<SendTemplateEmailResult> {
    const tmpl = renderSystemIssueEmail(params);
    return sendTemplateEmail({
      template: 'FR8X_SYSTEM_ISSUE',
      to: params.recipient,
      recipientName: params.firstName,
      mergeInfo: {
        first_name: params.firstName || 'Technical Contact',
        incident_id: params.incidentId,
        incident_title: params.incidentTitle,
        service_name: params.serviceName,
        detected_at: params.detectedAt || new Date().toUTCString(),
        status: params.status,
        incident_description: params.incidentDescription,
        service_status_url: params.serviceStatusUrl || '',
      },
      clientReference: params.clientReference,
      correlationId: params.correlationId,
      fallbackSubject: tmpl.subject,
      fallbackHtml: tmpl.html,
      fallbackText: tmpl.text,
    });
  },

  /**
   * Direct template email dispatcher
   */
  sendTemplateEmail,

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
  getEmailEvents,
  recordEmailEvent,
  validateEmail: isValidEmailAddress,
};

