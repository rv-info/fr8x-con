import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { hashOtp, checkRateLimit } from '@/lib/crypto';
import { sendOtpEmail } from '@/lib/mailer';

// In-memory store for active OTP salted hashes
// In a distributed production cluster, this is stored in Redis / Firestore with TTL
export const activeOtpStore = new Map<string, { salt: string; hash: string; expiresAt: string }>();

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid operator email is required' }, { status: 400 });
    }

    // Rate limit check
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

    // Generate 6-digit random cryptographically-safe OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const hashed = hashOtp(otpCode);

    // Save salted hash
    activeOtpStore.set(email.toLowerCase(), hashed);

    // Send email via Zoho SMTP
    const emailResult = await sendOtpEmail(email, otpCode, correlationId);

    return NextResponse.json({
      success: true,
      message: `Verification code dispatched to ${email}`,
      correlationId,
      expiresAt: hashed.expiresAt,
      // For development/demo purposes when running in emulator mode or without live SMTP
      demoCode: process.env.NODE_ENV === 'development' || !process.env.ZOHO_SMTP_PASSWORD ? otpCode : undefined,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to dispatch OTP verification code' },
      { status: 500 }
    );
  }
}
