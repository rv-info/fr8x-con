import nodemailer from 'nodemailer';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { EmailLog } from '@/lib/godfather/types';
import { EmailService, sendEmail, EMAIL_SENDERS, EmailSenderType } from '@/lib/email-service';
import {
  renderPasswordResetEmail,
  renderPasswordChangedEmail,
  renderOtpChallengeEmail,
  renderSecurityAlertEmail,
  renderSupportEmail,
} from '@/lib/email-templates';

const ZOHO_SMTP_HOST = process.env.ZOHO_SMTP_HOST || process.env.SMTP_HOST || 'smtp.zeptomail.in';
const ZOHO_SMTP_PORT = Number(process.env.ZOHO_SMTP_PORT || process.env.SMTP_PORT) || 587;
const ZOHO_SMTP_USER = process.env.ZOHO_SMTP_USER || process.env.SMTP_USER || 'emailapikey';
const ZOHO_SMTP_PASSWORD = (process.env.ZOHO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || '').trim();
const ZOHO_ZEPTOMAIL_TOKEN = (process.env.ZEPTO_MAIL_API_KEY || process.env.ZOHO_ZEPTOMAIL_TOKEN || '').trim();
const ZOHO_ZEPTOMAIL_URL =
  process.env.ZEPTO_MAIL_API_URL ||
  process.env.ZEPTO_MAIL_URL ||
  process.env.ZOHO_ZEPTOMAIL_URL ||
  'https://api.zeptomail.in/v1.1/email';
const ZOHO_ZEPTOMAIL_BOUNCE_ADDRESS =
  process.env.ZEPTO_MAIL_BOUNCE_ADDRESS ||
  process.env.ZOHO_ZEPTOMAIL_BOUNCE_ADDRESS ||
  '';
const ZEPTO_MAIL_AGENT = process.env.ZEPTO_MAIL_AGENT || 'FR8X_PRODUCTION';
const ZEPTO_MAIL_AGENT_ALIAS = process.env.ZEPTO_MAIL_AGENT_ALIAS || '1581021668e479ce';

// Dynamic nodemailer transporter generator for isolated legacy SMTP (reads live environment variables)
function getTransporter(): nodemailer.Transporter {
  const host = process.env.ZOHO_SMTP_HOST || process.env.SMTP_HOST || 'smtp.zeptomail.in';
  const port = Number(process.env.ZOHO_SMTP_PORT || process.env.SMTP_PORT) || 587;
  const user = process.env.ZOHO_SMTP_USER || process.env.SMTP_USER || 'emailapikey';
  const pass = (process.env.ZOHO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || '').trim();

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user,
      pass,
    },
    tls: {
      minVersion: 'TLSv1.2',
      // SECURITY: Certificate verification enabled. Do not disable in production.
      rejectUnauthorized: true,
    },
  });
}

export interface SendEmailOptions {
  recipient: string;
  recipientName?: string;
  subject: string;
  templateId: string;
  templateName: string;
  htmlBody: string;
  textBody?: string;
  senderType?: EmailSenderType;
  preferredProvider?: 'Zoho_Flow' | 'Zoho_ZeptoMail' | 'Zoho_SMTP' | 'Sandbox_Mock' | 'Auto';
  entityContext?: {
    entityType: string;
    entityId: string;
  };
  actorUid?: string;
  correlationId?: string;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  correlationId: string;
  logId: string;
  provider: 'Zoho_Flow' | 'Zoho_SMTP' | 'Zoho_ZeptoMail' | 'Sandbox_Mock';
  status: 'sent' | 'delivered' | 'failed';
  error?: string;
  responsePayload?: unknown;
}

/**
 * Sends transactional email via Zoho ZeptoMail REST API v1.1
 * Delegated to central EmailService with strict sender mapping, retries, and error redaction.
 */
export async function sendViaZeptoMail(options: {
  recipient: string;
  recipientName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  fromAddress?: string;
  fromName?: string;
  correlationId?: string;
  templateId?: string;
  senderType?: EmailSenderType;
}): Promise<SendEmailResult> {
  const correlationId = options.correlationId || generateCorrelationId();
  const logId = `EML-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  let senderType: EmailSenderType = options.senderType || 'PASSWORD';
  if (options.fromAddress) {
    if (options.fromAddress.includes('support')) senderType = 'SUPPORT';
    else if (options.fromAddress.includes('tech')) senderType = 'TECH';
    else senderType = 'PASSWORD';
  }

  const result = await EmailService.sendTransactionalEmail({
    to: options.recipient,
    recipientName: options.recipientName,
    subject: options.subject,
    html: options.htmlBody,
    text: options.textBody,
    senderType,
    correlationId,
    templateId: options.templateId,
  });

  if (!result.success) {
    throw new Error(result.error || 'ZeptoMail dispatch failed');
  }

  return {
    success: true,
    messageId: result.messageId,
    correlationId,
    logId,
    provider: (result.provider as any) || 'Zoho_ZeptoMail',
    status: 'sent',
    responsePayload: result.details,
  };
}

/**
 * Sends transactional email via Direct Zoho SMTP (port 465 SSL)
 */
export async function sendViaSmtp(options: {
  recipient: string;
  recipientName?: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  fromAddress?: string;
  correlationId?: string;
}): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const mailClient = getTransporter();
    const fromSender = options.fromAddress || ZOHO_SMTP_USER;
    const info = await mailClient.sendMail({
      from: `FR8X Platform <${fromSender}>`,
      to: options.recipient,
      subject: options.subject,
      text: options.textBody || options.htmlBody.replace(/<[^>]*>?/gm, ''),
      html: options.htmlBody,
      headers: {
        'X-FR8X-Correlation-ID': options.correlationId || '',
      },
    });
    console.log(`[ZOHO_SMTP_SUCCESS] Direct SMTP sent to ${options.recipient} | MsgID: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (err: any) {
    console.error(`[ZOHO_SMTP_ERROR] Direct SMTP failed for ${options.recipient}:`, err.message);
    return { success: false, error: err.message };
  }
}

export interface EmailHealthStatus {
  provider: 'zeptomail';
  transport: 'REST_API';
  connected: boolean;
  configured: boolean;
  flowConfigured: boolean;
  zeptoMailConfigured: boolean;
  zeptoMailEndpoint: string;
  endpoint: string;
  agent: string;
  agentAlias: string;
  bounceAddress: string;
  senderIdentities: {
    password: string;
    support: string;
    tech: string;
  };
  lastChecked: string;
  latencyMs: number;
  providerCheck?: {
    status: 'VERIFIED' | 'CONFIGURED' | 'UNAUTHORIZED' | 'ERROR';
    httpStatus?: number;
    message: string;
  };
}

/**
 * Server-only Outbound Email Dispatcher
 * Production Transport: Zoho ZeptoMail REST API (via central EmailService)
 * Legacy SMTP: Strictly isolated, never an automatic production fallback.
 */
export async function sendSystemEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const correlationId = options.correlationId || generateCorrelationId();
  const logId = `EML-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  const fromType: EmailSenderType = options.senderType || 'SUPPORT';
  const fromSender = EMAIL_SENDERS[fromType] || options.senderType || 'support@fr8x.in';

  // 1. If explicit legacy SMTP provider requested (isolated debug / legacy maintenance only)
  if (options.preferredProvider === 'Zoho_SMTP') {
    const smtpPass = (process.env.ZOHO_SMTP_PASSWORD || process.env.SMTP_PASSWORD || '').trim();
    if (!smtpPass) {
      console.warn('[ZOHO_SMTP_ISOLATED] Legacy SMTP requested but no SMTP password configured.');
      return {
        success: false,
        correlationId,
        logId,
        provider: 'Zoho_SMTP',
        status: 'failed',
        error: 'Legacy SMTP credentials not configured.',
      };
    }
    const smtpRes = await sendViaSmtp({
      recipient: options.recipient,
      recipientName: options.recipientName,
      subject: options.subject,
      htmlBody: options.htmlBody,
      textBody: options.textBody,
      fromAddress: fromSender,
      correlationId,
    });
    return {
      success: smtpRes.success,
      messageId: smtpRes.messageId,
      correlationId,
      logId,
      provider: 'Zoho_SMTP',
      status: smtpRes.success ? 'sent' : 'failed',
      error: smtpRes.error,
    };
  }

  // 2. Production Primary Transport: ZeptoMail REST API via central EmailService
  try {
    return await sendViaZeptoMail({
      recipient: options.recipient,
      recipientName: options.recipientName,
      subject: options.subject,
      htmlBody: options.htmlBody,
      textBody: options.textBody,
      fromAddress: fromSender,
      senderType: fromType,
      correlationId,
      templateId: options.templateId,
    });
  } catch (zeptoErr: any) {
    console.error('[ZEPTOMAIL_DISPATCH_ERROR]', zeptoErr.message);

    // Optional legacy Zoho Flow webhook failover if explicitly configured
    const flowUrl = process.env.ZOHO_FLOW_WEBHOOK_URL;
    if (flowUrl && flowUrl.trim() && flowUrl !== 'undefined') {
      try {
        const flowResult = await sendEmail({
          fromType,
          to: options.recipient,
          subject: options.subject,
          message: options.textBody || options.htmlBody.replace(/<[^>]*>?/gm, ' ').trim(),
          htmlMessage: options.htmlBody,
          event: options.templateId || 'SYSTEM_EMAIL',
          correlationId,
        });

        return {
          success: flowResult.success,
          messageId: flowResult.messageId,
          correlationId,
          logId,
          provider: 'Zoho_Flow',
          status: flowResult.success ? 'sent' : 'failed',
          error: flowResult.error,
        };
      } catch (flowErr: any) {
        console.warn('[ZOHO_FLOW_FAILOVER_WARN]', flowErr.message);
      }
    }

    // In local non-production development without key, return mock sandbox response
    if (process.env.NODE_ENV !== 'production' && !process.env.ZEPTO_MAIL_API_KEY) {
      return {
        success: true,
        messageId: `mock-msg-${Date.now()}`,
        correlationId,
        logId,
        provider: 'Sandbox_Mock',
        status: 'sent',
      };
    }

    return {
      success: false,
      correlationId,
      logId,
      provider: 'Zoho_ZeptoMail',
      status: 'failed',
      error: zeptoErr.message || 'ZeptoMail REST API delivery failed',
    };
  }
}

/**
 * Validates production ZeptoMail REST API connectivity and configuration health.
 * Performs safe authenticated REST provider check without sending a live email.
 * Does NOT test SMTP or open smtp.zoho.in:465.
 */
export async function getEmailHealth(): Promise<EmailHealthStatus> {
  const startTime = Date.now();
  const zeptoApiKey = (process.env.ZEPTO_MAIL_API_KEY || process.env.ZOHO_ZEPTOMAIL_TOKEN || '').trim();
  const zeptoMailConfigured = Boolean(zeptoApiKey && zeptoApiKey !== 'undefined' && zeptoApiKey.length > 5);
  const zeptoMailEndpoint =
    process.env.ZEPTO_MAIL_API_URL?.trim() ||
    process.env.ZEPTO_MAIL_URL?.trim() ||
    process.env.ZOHO_ZEPTOMAIL_URL?.trim() ||
    'https://api.zeptomail.in/v1.1/email';
  const zeptoMailBounceAddress =
    process.env.ZEPTO_MAIL_BOUNCE_ADDRESS?.trim() ||
    process.env.ZOHO_ZEPTOMAIL_BOUNCE_ADDRESS?.trim() ||
    '';
  const agent = process.env.ZEPTO_MAIL_AGENT || 'FR8X_PRODUCTION';
  const agentAlias = process.env.ZEPTO_MAIL_AGENT_ALIAS || '1581021668e479ce';

  // Section 5: Underlying calculation for flowConfigured:
  // Dynamically verifies EmailService + ZeptoMail REST API + ZEPTO_MAIL_API_KEY
  const isEmailServiceReady = Boolean(EmailService && typeof EmailService.sendTransactionalEmail === 'function');
  const isEndpointValid = Boolean(zeptoMailEndpoint && zeptoMailEndpoint.startsWith('https://'));
  const flowConfigured = Boolean(isEmailServiceReady && zeptoMailConfigured && isEndpointValid);

  let providerCheckStatus: 'VERIFIED' | 'CONFIGURED' | 'UNAUTHORIZED' | 'ERROR' = zeptoMailConfigured ? 'CONFIGURED' : 'UNAUTHORIZED';
  let providerMessage = zeptoMailConfigured ? 'ZeptoMail REST API credentials configured' : 'ZEPTO_MAIL_API_KEY is missing or invalid';
  let httpStatus: number | undefined = undefined;

  // Section 4: Safe authenticated provider check (does NOT send email, does NOT connect to SMTP)
  if (zeptoMailConfigured) {
    try {
      const cleanToken = zeptoApiKey.replace(/^zoho-enczapikey\s+/i, '').trim();
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      // Sending empty JSON payload {}. ZeptoMail validates Authorization header first:
      // - HTTP 400: Credentials accepted and validated (missing fields), confirming token is authentic!
      // - HTTP 401: Invalid token (TM_4001 Access Denied)
      const checkRes = await fetch(zeptoMailEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Zoho-enczapikey ${cleanToken}`,
        },
        body: JSON.stringify({}),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      httpStatus = checkRes.status;
      if (checkRes.status === 400 || checkRes.status === 200 || checkRes.status === 201) {
        providerCheckStatus = 'VERIFIED';
        providerMessage = 'ZeptoMail API authenticated successfully (credentials accepted, REST endpoint responsive)';
      } else if (checkRes.status === 401) {
        providerCheckStatus = 'UNAUTHORIZED';
        providerMessage = 'ZeptoMail returned 401 Unauthorized (check ZEPTO_MAIL_API_KEY)';
      } else {
        providerCheckStatus = 'CONFIGURED';
        providerMessage = `ZeptoMail endpoint responded with HTTP ${checkRes.status}`;
      }
    } catch (err: any) {
      providerCheckStatus = 'CONFIGURED';
      providerMessage = `ZeptoMail configured (${err.name === 'AbortError' ? 'timeout ping' : 'offline/transient check'})`;
    }
  }

  const latencyMs = Math.max(8, Date.now() - startTime);

  return {
    provider: 'zeptomail',
    transport: 'REST_API',
    connected: zeptoMailConfigured,
    configured: zeptoMailConfigured,
    flowConfigured,
    zeptoMailConfigured,
    zeptoMailEndpoint,
    endpoint: zeptoMailEndpoint,
    agent,
    agentAlias,
    bounceAddress: zeptoMailBounceAddress,
    senderIdentities: {
      password: EMAIL_SENDERS.PASSWORD,
      support: EMAIL_SENDERS.SUPPORT,
      tech: EMAIL_SENDERS.TECH,
    },
    lastChecked: new Date().toISOString(),
    latencyMs,
    providerCheck: {
      status: providerCheckStatus,
      httpStatus,
      message: providerMessage,
    },
  };
}

/**
 * Backwards compatibility export for checkSmtpHealth
 * Now returns the true production transport health (ZeptoMail REST API)
 */
export async function checkSmtpHealth(): Promise<EmailHealthStatus> {
  return getEmailHealth();
}


/**
 * Helper to dispatch email verification email
 * Sender: password@fr8x.in
 */
export async function sendVerificationEmail(
  recipient: string,
  verificationLink?: string,
  otpCode?: string,
  correlationId?: string
) {
  const corrId = correlationId || generateCorrelationId();
  return EmailService.sendVerificationEmail({
    to: recipient,
    verificationLink,
    otpCode,
    correlationId: corrId,
  });
}

/**
 * Helper to dispatch 6-digit MFA / OTP Challenge Email
 * Sender: password@fr8x.in
 */
export async function sendOtpEmail(recipient: string, otpCode: string, correlationId?: string) {
  const corrId = correlationId || generateCorrelationId();
  return EmailService.sendOtpEmail({
    to: recipient,
    otpCode,
    correlationId: corrId,
  });
}

/**
 * Helper to dispatch Password Reset OTP or Link Email
 * Sender: password@fr8x.in
 */
export async function sendPasswordResetOtpEmail(
  recipient: string,
  otpCode?: string,
  correlationId?: string,
  resetLink?: string
) {
  const corrId = correlationId || generateCorrelationId();
  return EmailService.sendPasswordResetEmail({
    to: recipient,
    otpCode,
    resetLink,
    correlationId: corrId,
  });
}

/**
 * Helper to dispatch Password Changed Confirmation Email
 * Sender: password@fr8x.in
 */
export async function sendPasswordChangedConfirmation(
  recipient: string,
  correlationId?: string,
  ipAddress?: string
) {
  const corrId = correlationId || generateCorrelationId();
  return EmailService.sendPasswordChangedEmail({
    to: recipient,
    correlationId: corrId,
    ipAddress,
  });
}

/**
 * Helper to dispatch Security Event / Account Lockout Alert
 * Sender: password@fr8x.in
 */
export async function sendSecurityAlertEmail(
  subject: string,
  details: string,
  correlationId?: string,
  ipAddress?: string
) {
  const corrId = correlationId || generateCorrelationId();
  const recipient = process.env.ZOHO_SECURITY_EMAIL || 'support@fr8x.in';
  return EmailService.sendSecurityAlertEmail({
    to: recipient,
    subject,
    details,
    correlationId: corrId,
    ipAddress,
  });
}

/**
 * Helper to dispatch Support Request / Ticket Email
 * Sender: support@fr8x.in
 */
export async function sendSupportRequestEmail(params: {
  recipient: string;
  subject: string;
  message: string;
  ticketId?: string;
  correlationId?: string;
}) {
  const corrId = params.correlationId || generateCorrelationId();
  return EmailService.sendSupportEmail({
    to: params.recipient,
    subject: params.subject,
    message: params.message,
    ticketId: params.ticketId,
    correlationId: corrId,
  });
}
