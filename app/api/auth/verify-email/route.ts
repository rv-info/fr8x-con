import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

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

    // Set authenticated session cookie
    res.cookies.set('fr8x_session', user.uid, {
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

    // Set authenticated session cookie
    res.cookies.set('fr8x_session', user.uid, {
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
