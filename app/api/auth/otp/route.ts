import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

/**
 * POST /api/auth/otp
 * Generates and validates OTP with daily cap of 3 attempts per user/date.
 * Returns remaining count: 2, 1, 0.
 */
export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = serverSecurityStore.requestOTP(email, ip);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          remaining: result.remaining,
          date: result.date,
          error: result.message,
        },
        { status: 429 }
      );
    }

    return NextResponse.json({
      success: true,
      remaining: result.remaining,
      date: result.date,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message || 'OTP dispatch failed.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get('email');
  if (!email) {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const status = serverSecurityStore.getOTPStatus(email);
  return NextResponse.json({ success: true, ...status });
}
