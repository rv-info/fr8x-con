import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { hashOtp, checkRateLimit } from '@/lib/crypto';
import { sendOtpEmail } from '@/lib/mailer';
import { otpStore } from '@/lib/otp-store';

// ─── SINGLE AUTHORISED OPERATOR ──────────────────────────────────────────────
// Only this email address is permitted to initiate a GODFATHER session.
const AUTHORISED_OPERATOR = 'tech@fr8x.in';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Valid operator email is required' }, { status: 400 });
    }

    const normEmail = email.trim().toLowerCase();

    // ── Authorisation gate: reject any email other than tech@fr8x.in ──────────
    if (normEmail !== AUTHORISED_OPERATOR) {
      // Deliberately vague error to avoid email enumeration
      return NextResponse.json(
        { error: 'Operator not recognised or not authorised for GODFATHER access.' },
        { status: 403 }
      );
    }

    // ── Rate-limiting ──────────────────────────────────────────────────────────
    const rateCheck = checkRateLimit(normEmail);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many authentication attempts. Account temporarily locked. Retry in ${rateCheck.retryAfterSeconds} seconds.`,
          locked: true,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    // ── Generate cryptographically-secure 6-digit OTP ─────────────────────────
    // crypto.randomInt is CSPRNG-backed; avoid Math.random() for security codes.
    const otpCode = crypto.randomInt(100_000, 999_999).toString();

    // ── Hash with PBKDF2 before storing ───────────────────────────────────────
    const hashed = hashOtp(otpCode);
    await otpStore.set(normEmail, hashed);

    // ── Dispatch via Zoho SMTP ────────────────────────────────────────────────
    await sendOtpEmail(normEmail, otpCode, correlationId);

    return NextResponse.json({
      success: true,
      message: `Verification code dispatched to ${AUTHORISED_OPERATOR}`,
      correlationId,
      expiresAt: hashed.expiresAt,
      // Only expose the demo code in development when SMTP is unconfigured
      demoCode:
        process.env.NODE_ENV === 'development' && !process.env.ZOHO_SMTP_PASSWORD
          ? otpCode
          : undefined,
    });
  } catch (err: any) {
    console.error('[SEND_OTP_ERROR]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch OTP verification code' },
      { status: 500 }
    );
  }
}
