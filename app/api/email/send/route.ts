import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, EmailSenderType, isValidEmailAddress } from '@/lib/email-service';
import { checkRateLimit, recordFailedAttempt } from '@/lib/crypto';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';

const ALLOWED_USER_RECIPIENTS = new Set([
  'support@fr8x.in',
  'compliance@fr8x.in',
  'tech@fr8x.in',
  'password@fr8x.in',
]);

/**
 * POST /api/email/send
 * Secure, server-side email dispatch endpoint.
 *
 * Enforces:
 * - Caller authentication (session or operator)
 * - Anti-relay restriction (standard users can only send to verified FR8X inboxes)
 * - Server-controlled sender mapping (support -> support@fr8x.in, password -> password@fr8x.in)
 * - Strict client input validation
 * - Anti-abuse rate limiting by client IP
 * - Zero secret or internal credential leakage
 */
export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();

  // Authentication Guard: require user session or godfather operator
  const userAuth = authenticateUserSession(req);
  const gfAuth = authenticateGodfatherOperator(req);
  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return NextResponse.json(
      { error: 'Unauthorized: Authentication required to dispatch emails.', correlationId },
      { status: 401 }
    );
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';

  // Rate limiting by client IP
  const rateLimitKey = `email_send::${ip}`;
  const rateCheck = checkRateLimit(rateLimitKey);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Please retry in ${rateCheck.retryAfterSeconds} seconds.`,
        correlationId,
      },
      { status: 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { type, to, subject, message, event, htmlMessage } = body;

    // Validate recipient
    if (!to || typeof to !== 'string' || !isValidEmailAddress(to)) {
      return NextResponse.json(
        { error: 'A valid recipient email address is required.', correlationId },
        { status: 400 }
      );
    }

    const cleanTo = to.trim().toLowerCase();

    // Anti-Relay Guard: Non-operators can only email internal support addresses
    if (!gfAuth.authenticated && !ALLOWED_USER_RECIPIENTS.has(cleanTo)) {
      return NextResponse.json(
        {
          error: 'Forbidden: Regular enterprise users may only dispatch inquiries to FR8X Support or Compliance inboxes.',
          correlationId,
        },
        { status: 403 }
      );
    }

    // Validate subject
    if (!subject || typeof subject !== 'string' || subject.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email subject is required.', correlationId },
        { status: 400 }
      );
    }

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Email message content is required.', correlationId },
        { status: 400 }
      );
    }

    // Map sender type strictly on the server: never allow arbitrary client 'from'
    const normalizedType = String(type || 'support').trim().toUpperCase();
    let fromType: EmailSenderType = 'SUPPORT';

    if (normalizedType === 'PASSWORD' || normalizedType === 'AUTH') {
      fromType = 'PASSWORD';
    } else if (normalizedType === 'SUPPORT') {
      fromType = 'SUPPORT';
    } else if (normalizedType === 'TECH' || normalizedType === 'TECHNICAL') {
      fromType = 'TECH';
    } else {
      return NextResponse.json(
        {
          error: "Invalid email sender type. Permitted types: 'support', 'password', 'tech'.",
          correlationId,
        },
        { status: 400 }
      );
    }

    // Determine event name
    const resolvedEvent =
      event && typeof event === 'string'
        ? event.trim().toUpperCase()
        : fromType === 'PASSWORD'
        ? 'PASSWORD_SECURITY_NOTICE'
        : fromType === 'TECH'
        ? 'TECHNICAL_NOTICE'
        : 'SUPPORT_MESSAGE';

    // Dispatch via central email service
    const dispatchResult = await sendEmail({
      fromType,
      to: to.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
      htmlMessage: typeof htmlMessage === 'string' && htmlMessage.trim().length > 0 ? htmlMessage.trim() : undefined,
      event: resolvedEvent,
      correlationId,
    });

    if (!dispatchResult.success) {
      // Record failed attempt for rate limiting
      recordFailedAttempt(rateLimitKey);

      return NextResponse.json(
        {
          success: false,
          error: dispatchResult.error || 'Failed to dispatch email.',
          correlationId,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Email dispatched successfully.',
      correlationId,
      sender: dispatchResult.sender,
      event: dispatchResult.event,
      provider: dispatchResult.provider,
      isPasswordConfigured: dispatchResult.isPasswordConfigured,
    });
  } catch (err: any) {
    console.error('[API_EMAIL_SEND_ERROR] Unexpected error in /api/email/send:', err.message);
    return NextResponse.json(
      {
        error: 'An internal error occurred while processing the email dispatch.',
        correlationId,
      },
      { status: 500 }
    );
  }
}
