/**
 * FR8X Central Server-Side Email Service
 * Architecture:
 * FR8X Client/Console -> FR8X Backend API -> Server-Side Email Service -> Zoho Flow Webhook -> Zoho Mail -> Recipient
 *
 * Senders:
 * - SUPPORT: support@fr8x.in (Currently authenticated & operational in Zoho Flow)
 * - PASSWORD: password@fr8x.in (Architecturally isolated & ready; requires Zoho Mail connection in Zoho Flow)
 *
 * CRITICAL SECURITY RULES:
 * 1. The browser must never receive or expose the Zoho Flow webhook URL or secret.
 * 2. Unauthenticated clients cannot override the sender or Zoho credentials.
 * 3. Never log passwords, tokens, or webhook secrets.
 */

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
  | 'PASSWORD_RESET'
  | 'PASSWORD_OTP'
  | 'EMAIL_VERIFICATION'
  | 'LOGIN_SECURITY'
  | 'PASSWORD_CHANGED';

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
  const hasSupportFlow = Boolean(
    process.env.ZOHO_FLOW_WEBHOOK_URL &&
      process.env.ZOHO_FLOW_WEBHOOK_URL.trim() &&
      process.env.ZOHO_FLOW_WEBHOOK_URL !== 'undefined'
  );
  const hasDedicatedPasswordFlow = Boolean(
    process.env.ZOHO_FLOW_PASSWORD_WEBHOOK_URL &&
      process.env.ZOHO_FLOW_PASSWORD_WEBHOOK_URL.trim() &&
      process.env.ZOHO_FLOW_PASSWORD_WEBHOOK_URL !== 'undefined'
  );

  return {
    SUPPORT: {
      sender: 'SUPPORT',
      mailbox: EMAIL_SENDERS.SUPPORT,
      isOperational: hasSupportFlow,
      notes: hasSupportFlow
        ? 'Operational: Configured and authenticated via Zoho Flow (support@fr8x.in).'
        : 'Pending: ZOHO_FLOW_WEBHOOK_URL is not set in environment.',
    },
    PASSWORD: {
      sender: 'PASSWORD',
      mailbox: EMAIL_SENDERS.PASSWORD,
      // Operational only if a dedicated password flow connection is explicitly set up,
      // or if password@fr8x.in connection is attached in Zoho Flow.
      isOperational: hasDedicatedPasswordFlow,
      notes: hasDedicatedPasswordFlow
        ? 'Operational: Dedicated password flow configured via ZOHO_FLOW_PASSWORD_WEBHOOK_URL.'
        : 'Architecturally Ready: Code and templates are implemented. Operational once Zoho Mail connection for password@fr8x.in is authorized in Zoho Flow.',
    },
  };
}

/**
 * Validates an email recipient address format.
 */
export function isValidEmailAddress(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length > 254) return false;
  // RFC 5322 compatible regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(trimmed);
}

/**
 * Sanitizes an email input to prevent header injection or malicious payloads.
 */
function sanitizeString(str: string): string {
  return str.replace(/[\r\n\t]/g, ' ').trim();
}

/**
 * Resolves the appropriate Zoho Flow webhook URL based on sender type.
 * Server-side only: never exposed to the client.
 */
function resolveWebhookUrl(fromType: EmailSenderType): string | null {
  const customPassUrl = process.env.ZOHO_FLOW_PASSWORD_WEBHOOK_URL;
  if (fromType === 'PASSWORD' && customPassUrl && customPassUrl.trim() && customPassUrl !== 'undefined') {
    return customPassUrl.trim();
  }
  const defaultUrl = process.env.ZOHO_FLOW_WEBHOOK_URL;
  if (defaultUrl && defaultUrl.trim() && defaultUrl !== 'undefined') {
    return defaultUrl.trim();
  }
  return null;
}

/**
 * Central Server-Side Email Dispatcher
 * Sends outbound email through Zoho Flow webhook -> Zoho Mail.
 */
export async function sendEmail(params: SendEmailParams): Promise<SendEmailResponse> {
  const correlationId =
    params.correlationId ||
    `GF-EML-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const cleanTo = (params.to || '').trim().toLowerCase();
  const cleanSubject = sanitizeString(params.subject || '');
  const cleanMessage = (params.message || '').trim();

  // Validate recipient
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

  // Validate mandatory fields
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

  // Exact Zoho Flow payload format:
  // Preserves 100% compatibility with existing Zoho Flow configuration:
  // ${webhookTrigger.payload.to_email}
  // ${webhookTrigger.payload.subject}
  // ${webhookTrigger.payload.message}
  // And includes event & sender_type for advanced routing:
  const payload = {
    event: params.event,
    sender_type: params.fromType,
    from_email: senderAddress,
    to_email: cleanTo,
    subject: cleanSubject,
    message: cleanMessage,
    correlation_id: correlationId,
    timestamp: new Date().toISOString(),
  };

  const status = getEmailSendersStatus();
  const isPasswordOperational = status.PASSWORD.isOperational;

  // If no Zoho Flow webhook URL is set in environment, use mock sandbox dispatch
  if (!webhookUrl) {
    // Safe mock logging (no secrets, masked recipient)
    const domain = cleanTo.split('@')[1] || 'unknown';
    console.log(
      `[EMAIL_SANDBOX_DISPATCH] From: ${senderAddress} (${params.fromType}) | Event: ${params.event} | Recipient domain: @${domain} | Correlation: ${correlationId}`
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

  // Live Zoho Flow Webhook Dispatch with timeout and retry
  const MAX_RETRIES = 1;
  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8-second timeout

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
        // Safe logging of successful dispatch
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

      // Non-200 HTTP response
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

    // Short backoff before retry if attempt failed
    if (attempt < MAX_RETRIES) {
      await new Promise((res) => setTimeout(res, 600));
    }
  }

  // Failed after retries
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
