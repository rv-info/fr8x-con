import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

/**
 * POST /api/auth/otp
 * Generates and dispatches secure 6-digit OTP via Zoho ZeptoMail REST API (password@fr8x.in)
 * with a daily rate limit of 3 attempts per user/date.
 * Also supports verifying submitted OTP when `otp` is included in the payload.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email, otp, code, action } = body;

    if (!email || typeof email !== 'string' || !email.trim()) {
      return NextResponse.json({ success: false, error: 'Valid email address is required.' }, { status: 400 });
    }

    const cleanEmail = email.trim().toLowerCase();
    const candidateOtp = otp || code;

    // Verification mode
    if (candidateOtp || action === 'verify') {
      if (!candidateOtp) {
        return NextResponse.json(
          { success: false, error: 'Verification code is required.' },
          { status: 400 }
        );
      }
      const verifyResult = serverSecurityStore.verifyOTP(cleanEmail, String(candidateOtp).trim());
      return NextResponse.json(
        verifyResult,
        { status: verifyResult.success ? 200 : 400 }
      );
    }

    // Dispatch mode
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const result = serverSecurityStore.requestOTP(cleanEmail, ip);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          remaining: result.remaining,
          remainingAttemptsToday: result.remaining,
          date: result.date,
          error: result.message,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      remaining: result.remaining,
      remainingAttemptsToday: result.remaining,
      date: result.date,
      message: result.message,
      otpDispatched: true,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'OTP dispatch failed.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const status = serverSecurityStore.getOTPStatus(email);
  return NextResponse.json({ success: true, ...status, remainingAttemptsToday: status.remaining });
}
