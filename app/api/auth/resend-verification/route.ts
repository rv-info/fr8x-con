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

    let emailDispatched = false;
    let emailError: string | null = null;

    if (result.emailPromise) {
      try {
        const mailRes = await result.emailPromise;
        emailDispatched = Boolean(mailRes && mailRes.success);
        if (!emailDispatched && mailRes) {
          emailError = mailRes.error || 'Email service rejected delivery';
        }
      } catch (mailErr: any) {
        console.error('[ResendAPI] Verification email delivery error:', mailErr.message);
        emailError = mailErr.message;
      }
    }

    const isDev = process.env.NODE_ENV !== 'production';

    return NextResponse.json({
      success: result.success,
      emailDispatched,
      devOtp: (isDev || !emailDispatched) ? result.otp : undefined,
      emailError: isDev ? emailError : undefined,
      message: emailDispatched
        ? result.message
        : isDev
          ? `New verification code issued. Note: Live email rejected (${emailError || 'API token invalid'}). Dev OTP: ${result.otp}`
          : result.message,
      remainingAttempts: result.remainingAttempts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Resend service error.' },
      { status: 500 }
    );
  }
}
