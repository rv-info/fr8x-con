import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { createSignedSessionToken } from '@/lib/crypto';
import { EmailService } from '@/lib/email-service';

/**
 * GET /api/auth/verify-email?token=...&email=...
 * POST /api/auth/verify-email { token?: string, otp?: string, email?: string }
 *
 * Validates cryptographic verification token or 6-digit verification code.
 * Upon successful verification:
 * 1. Activates account (status: 'active').
 * 2. Invalidates verification token (single-use).
 * 3. Issues secure httpOnly session cookie.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { token, otp, email } = body;

    if (!token && !otp) {
      return NextResponse.json(
        { success: false, error: 'Verification token or 6-digit code is required.' },
        { status: 400 }
      );
    }

    const result = serverSecurityStore.verifyEmailToken({
      token: token ? String(token).trim() : undefined,
      otp: otp ? String(otp).trim() : undefined,
      email: email ? String(email).trim() : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, code: result.code || 'VERIFICATION_FAILED', error: result.error || 'Verification failed.' },
        { status: 400 }
      );
    }

    const user = result.user!;

    // Dispatch official Welcome Onboarding email (FR8X_WELCOME_USER) from password@fr8x.in
    const origin =
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      req.nextUrl.origin ||
      'https://con.fr8x.in';

    try {
      await EmailService.sendWelcomeEmail({
        to: user.email,
        firstName: user.displayName.split(' ')[0] || user.displayName,
        fullName: user.displayName,
        organizationName: user.company,
        verificationUrl: `${origin}/feeds`,
      });
    } catch (welcomeErr: any) {
      console.error('[VerifyEmailAPI] Welcome email dispatch warning:', welcomeErr.message);
    }

    // Generate unique session ID for single-device login enforcement
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    serverSecurityStore.setActiveSession(user.uid, sessionId, { ip, userAgent });

    // AUTH-02: Mint Firebase Custom Token for client-side Firebase Auth synchronization
    let firebaseCustomToken: string | null = null;
    try {
      const { createCustomToken } = await import('@/lib/firebase/admin');
      firebaseCustomToken = await createCustomToken(user.uid, {
        role: user.role,
        companyId: user.companyId,
        isVerified: true,
        plan: (user as any).plan || 'trial',
        hasGoldenTick: Boolean((user as any).hasGoldenTick),
      });
    } catch (fbErr: any) {
      console.warn('[VerifyEmailAPI] Firebase custom token generation warning:', fbErr.message);
    }

    const res = NextResponse.json({
      success: true,
      message: result.message || 'Email verified successfully!',
      welcomeEmailSent: true,
      sessionId,
      firebaseCustomToken,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        company: user.company,
        companyId: user.companyId,
        role: user.role,
        status: user.status,
        email_verified: true,
      },
    });

    // Set authenticated cryptographically signed session cookie with email_verified: true and bound sessionId
    const userSessionToken = createSignedSessionToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      sessionId,
      email_verified: true,
      issuedAt: Date.now(),
    });

    res.cookies.set('fr8x_session', userSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Verification service error.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (!token) {
      return NextResponse.json(
        { success: false, code: 'TOKEN_MISSING', error: 'Verification token is required.' },
        { status: 400 }
      );
    }

    const result = serverSecurityStore.verifyEmailToken({
      token: token.trim(),
      email: email ? email.trim() : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, code: result.code || 'VERIFICATION_FAILED', error: result.error || 'Verification failed.' },
        { status: 400 }
      );
    }

    const user = result.user!;

    // If newly verified (not already verified), dispatch welcome onboarding email
    if (result.code !== 'ALREADY_VERIFIED') {
      const origin =
        process.env.APP_URL ||
        process.env.NEXT_PUBLIC_APP_URL ||
        req.nextUrl.origin ||
        'https://con.fr8x.in';

      try {
        await EmailService.sendWelcomeEmail({
          to: user.email,
          firstName: user.displayName.split(' ')[0] || user.displayName,
          fullName: user.displayName,
          organizationName: user.company,
          verificationUrl: `${origin}/feeds`,
        });
      } catch (welcomeErr: any) {
        console.error('[VerifyEmailAPI-GET] Welcome email dispatch warning:', welcomeErr.message);
      }
    }

    // Generate unique session ID for single-device login enforcement
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    serverSecurityStore.setActiveSession(user.uid, sessionId, { ip, userAgent });

    // AUTH-02: Mint Firebase Custom Token for client-side Firebase Auth synchronization
    let firebaseCustomToken: string | null = null;
    try {
      const { createCustomToken } = await import('@/lib/firebase/admin');
      firebaseCustomToken = await createCustomToken(user.uid, {
        role: user.role,
        companyId: user.companyId,
        isVerified: true,
        plan: (user as any).plan || 'trial',
        hasGoldenTick: Boolean((user as any).hasGoldenTick),
      });
    } catch (fbErr: any) {
      console.warn('[VerifyEmailAPI-GET] Firebase custom token generation warning:', fbErr.message);
    }

    const res = NextResponse.json({
      success: true,
      alreadyVerified: result.code === 'ALREADY_VERIFIED',
      message: result.message || 'Email verified successfully!',
      sessionId,
      firebaseCustomToken,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        company: user.company,
        companyId: user.companyId,
        role: user.role,
        status: user.status,
        email_verified: true,
      },
    });

    // Set authenticated cryptographically signed session cookie with bound sessionId
    const userSessionToken = createSignedSessionToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      sessionId,
      email_verified: true,
      issuedAt: Date.now(),
    });

    res.cookies.set('fr8x_session', userSessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Verification service error.' },
      { status: 500 }
    );
  }
}
