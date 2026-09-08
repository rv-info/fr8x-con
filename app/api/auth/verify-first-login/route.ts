import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { createSignedSessionToken } from '@/lib/crypto';

export async function POST(req: NextRequest) {
  try {
    const { challengeToken, otp } = await req.json().catch(() => ({}));

    if (!challengeToken || !otp) {
      return NextResponse.json(
        { success: false, error: 'Challenge token and verification code are required.' },
        { status: 400 }
      );
    }

    const verifyResult = serverSecurityStore.verifyUserFirstLoginOtp(
      String(challengeToken),
      String(otp)
    );

    if (!verifyResult.success || !verifyResult.user) {
      return NextResponse.json(
        { success: false, error: verifyResult.error || 'Verification failed.' },
        { status: 400 }
      );
    }

    const user = verifyResult.user;
    const res = NextResponse.json({
      success: true,
      message: 'First-time login verified. Session created.',
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      company: user.company,
      companyId: user.companyId,
      role: user.role,
      status: user.status,
    });

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
