import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { hashOtp, checkRateLimit } from '@/lib/crypto';
import { sendOtpEmail } from '@/lib/mailer';
import { otpStore } from '@/lib/otp-store';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid operator email is required' }, { status: 400 });
    }

    const rateCheck = checkRateLimit(email.toLowerCase());
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many login attempts. Account temporarily locked. Retry in ${rateCheck.retryAfterSeconds} seconds.`,
          locked: true,
          retryAfterSeconds: rateCheck.retryAfterSeconds,
        },
        { status: 429 }
      );
    }

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = hashOtp(otpCode);

    // Use distributed store (Redis in production, in-memory in dev)
    await otpStore.set(email.toLowerCase(), hashed);

    await sendOtpEmail(email, otpCode, correlationId);

    return NextResponse.json({
      success: true,
      message: `Verification code dispatched to ${email}`,
      correlationId,
      expiresAt: hashed.expiresAt,
      demoCode: process.env.NODE_ENV === 'development' || !process.env.ZOHO_SMTP_PASSWORD ? otpCode : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch OTP verification code' },
      { status: 500 }
    );
  }
}
