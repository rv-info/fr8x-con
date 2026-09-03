import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

/**
 * POST /api/auth/resend-verification
 * Resends email verification link and 6-digit code.
 * Enforces rate limiting (max 3 per hour) and anti-enumeration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { email } = body;

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Corporate email address is required.' },
        { status: 400 }
      );
    }

    const origin = req.nextUrl.origin;
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const result = serverSecurityStore.resendEmailVerification(email, origin);

    return NextResponse.json({
      success: result.success,
      message: result.message,
      remainingAttempts: result.remainingAttempts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Resend service error.' },
      { status: 500 }
    );
  }
}
