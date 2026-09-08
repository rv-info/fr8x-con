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
        { success: false, error: result.error || 'Verification failed.' },
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

    const res = NextResponse.json({
      success: true,
      message: result.message || 'Email verified successfully!',
      welcomeEmailSent: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        company: user.company,
        companyId: user.companyId,
        role: user.role,
        status: user.status,
      },
    });

    // Set authenticated cryptographically signed session cookie
    const userSessionToken = createSignedSessionToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
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
        { success: false, error: 'Verification token is required.' },
        { status: 400 }
      );
    }

    const result = serverSecurityStore.verifyEmailToken({
      token: token.trim(),
      email: email ? email.trim() : undefined,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Verification failed.' },
        { status: 400 }
      );
    }

    const user = result.user!;
    const res = NextResponse.json({
      success: true,
      message: result.message || 'Email verified successfully!',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        company: user.company,
        companyId: user.companyId,
        role: user.role,
        status: user.status,
      },
    });

    // Set authenticated cryptographically signed session cookie
    const userSessionToken = createSignedSessionToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
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
