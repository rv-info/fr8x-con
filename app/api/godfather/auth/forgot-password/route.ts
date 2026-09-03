import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { hashOtp, checkRateLimit, recordFailedAttempt } from '@/lib/crypto';
import { sendPasswordResetOtpEmail } from '@/lib/mailer';
import { otpStore } from '@/lib/otp-store';

// Dedicated OTP namespace for Godfather password reset to prevent collisions
const FORGOT_NAMESPACE = 'forgot::';
const AUTHORISED_OPERATOR = 'tech@fr8x.in';

/**
 * POST /api/godfather/auth/forgot-password
 * Initiates the password recovery flow for the authorized Godfather operator.
 * Enforces:
 * - Anti-enumeration: returns identical success message regardless of existence.
 * - Rate limiting per identifier.
 * - PBKDF2 hashed one-time token storage with 10-minute expiry.
 * - Dispatches reset email via central email service with sender password@fr8x.in.
 */
export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();

  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }

    const normEmail = email.trim().toLowerCase();
    const storeKey = `${FORGOT_NAMESPACE}${normEmail}`;

    // Rate limit check
    const rateCheck = checkRateLimit(storeKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many password reset requests. Please retry in ${rateCheck.retryAfterSeconds} seconds.`,
          locked: true,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
          correlationId,
        },
        { status: 429 }
      );
    }

    // Only the authorized operator account is valid
    if (normEmail !== AUTHORISED_OPERATOR) {
      // Return safe generic response to prevent account enumeration
      return NextResponse.json(
        {
          success: true,
          message: 'If an account exists for this email address, password reset instructions have been sent.',
          correlationId,
        },
        { status: 200 }
      );
    }

    // Generate cryptographically secure 6-digit OTP
    const otpCode = crypto.randomInt(100_000, 999_999).toString();
    const hashed = hashOtp(otpCode);
    await otpStore.set(storeKey, hashed);

    // Build reset link using the current origin
    const origin = req.nextUrl.origin;
    const resetLink = `${origin}/godfather/reset-password?email=${encodeURIComponent(normEmail)}`;

    // Dispatch via central email service using PASSWORD sender (password@fr8x.in)
    await sendPasswordResetOtpEmail(normEmail, otpCode, correlationId, resetLink);

    return NextResponse.json({
      success: true,
      message: 'If an account exists for this email address, password reset instructions have been sent.',
      correlationId,
      expiresAt: hashed.expiresAt,
      demoCode:
        process.env.NODE_ENV === 'development' && !process.env.ZOHO_FLOW_WEBHOOK_URL
          ? otpCode
          : undefined,
    });
  } catch (err: any) {
    console.error('[GODFATHER_FORGOT_PASSWORD_ERROR] Processing error:', err.message);
    return NextResponse.json(
      { error: 'An error occurred while processing your password reset request.', correlationId },
      { status: 500 }
    );
  }
}
