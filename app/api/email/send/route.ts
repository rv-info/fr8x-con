import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, EmailSenderType, isValidEmailAddress } from '@/lib/email-service';
import { checkRateLimit, recordFailedAttempt } from '@/lib/crypto';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';

/**
 * POST /api/email/send
 * Secure, server-side email dispatch endpoint.
 *
 * Enforces:
 * - Server-controlled sender mapping (support -> support@fr8x.in, password -> password@fr8x.in)
 * - Strict client input validation
 * - Anti-abuse rate limiting by client IP
 * - Zero secret or internal credential leakage
 */
export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
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
    const { type, to, subject, message, event } = body;

    // Validate recipient
    if (!to || typeof to !== 'string' || !isValidEmailAddress(to)) {
      return NextResponse.json(
        { error: 'A valid recipient email address is required.', correlationId },
        { status: 400 }
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
    } else {
      return NextResponse.json(
        {
          error: "Invalid email sender type. Permitted types: 'support', 'password'.",
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
        : 'SUPPORT_MESSAGE';

    // Dispatch via central email service
    const dispatchResult = await sendEmail({
      fromType,
      to: to.trim().toLowerCase(),
      subject: subject.trim(),
      message: message.trim(),
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
