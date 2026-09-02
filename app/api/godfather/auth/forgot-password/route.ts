import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { hashOtp, checkRateLimit, recordFailedAttempt } from '@/lib/crypto';
import { sendOtpEmail } from '@/lib/mailer';
import { otpStore } from '@/lib/otp-store';

// Separate OTP namespace for password-reset to avoid collisions with login OTPs
const FORGOT_NAMESPACE = 'forgot::';
const AUTHORISED_OPERATOR = 'tech@fr8x.in';

/**
 * POST /api/godfather/auth/forgot-password
 * Sends a password-reset OTP to the authorised operator email.
 */
export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const normEmail = email.trim().toLowerCase();

    // Only the authorised operator may request a password reset
    if (normEmail !== AUTHORISED_OPERATOR) {
      // Vague response to avoid enumeration
      return NextResponse.json(
        { success: true, message: 'If that address is registered, a reset code has been sent.' },
        { status: 200 }
      );
    }

    const storeKey = `${FORGOT_NAMESPACE}${normEmail}`;

    const rateCheck = checkRateLimit(storeKey);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many reset attempts. Retry in ${rateCheck.retryAfterSeconds} seconds.`,
          locked: true,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // CSPRNG 6-digit code
    const otpCode = crypto.randomInt(100_000, 999_999).toString();
    const hashed  = hashOtp(otpCode);
    await otpStore.set(storeKey, hashed);

    await sendOtpEmail(normEmail, otpCode, correlationId);

    return NextResponse.json({
      success: true,
      message: 'If that address is registered, a reset code has been sent.',
      correlationId,
      expiresAt: hashed.expiresAt,
      demoCode:
        process.env.NODE_ENV === 'development' && !process.env.ZOHO_SMTP_PASSWORD
          ? otpCode
          : undefined,
    });
  } catch (err: any) {
    console.error('[FORGOT_PASSWORD_OTP_ERROR]', err);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
