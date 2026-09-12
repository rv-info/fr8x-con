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

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { success: false, error: 'A valid email address is required.' },
        { status: 400 }
      );
    }

    // Always prefer the actual request origin (localhost:3000 in dev, production domain in prod).
    // APP_URL env var is only a last resort (it points to prod and would break dev email links).
    const host = req.headers.get('host');
    const proto = req.headers.get('x-forwarded-proto') || (host?.includes('localhost') ? 'http' : 'https');
    const requestOrigin = host ? `${proto}://${host}` : null;
    const origin =
      requestOrigin ||
      req.nextUrl.origin ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'https://con.fr8x.in';
    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const result = serverSecurityStore.resendEmailVerification(email, origin, ip);

    if (result.rateLimited) {
      return NextResponse.json(
        {
          success: false,
          rateLimited: true,
          error: result.message,
          retryAfterSeconds: result.retryAfterSeconds,
          remainingAttempts: 0,
        },
        {
          status: 429,
          headers: result.retryAfterSeconds ? { 'Retry-After': String(result.retryAfterSeconds) } : undefined,
        }
      );
    }

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
      emailError: isDev ? emailError : undefined,
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
