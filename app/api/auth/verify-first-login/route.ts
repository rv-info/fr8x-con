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
        isVerified: Boolean(user.email_verified && user.status === 'active'),
        plan: (user as any).plan || 'trial',
        hasGoldenTick: Boolean((user as any).hasGoldenTick),
      });
    } catch (fbErr: any) {
      console.warn('[VerifyFirstLoginAPI] Firebase custom token generation warning:', fbErr.message);
    }

    const res = NextResponse.json({
      success: true,
      message: 'First-time login verified. Session created.',
      uid: user.uid,
      sessionId,
      firebaseCustomToken,
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
      sessionId,
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
