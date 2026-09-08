import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { hashOtp, checkRateLimit, generateSecureOtp } from '@/lib/crypto';
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

    // ── Generate cryptographically-secure 6-digit OTP distinct from previous ──
    const existing = await otpStore.get(normEmail);
    const otpCode = generateSecureOtp(
      6,
      existing ? { salt: existing.salt, hash: existing.hash } : undefined
    );

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
    });
  } catch (err: any) {
    console.error('[SEND_OTP_ERROR]', err);
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch OTP verification code' },
      { status: 500 }
    );
  }
}
