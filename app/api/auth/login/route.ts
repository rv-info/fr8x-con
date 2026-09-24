import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { createSignedSessionToken } from '@/lib/crypto';

/**
 * POST /api/auth/login
 * Server-side credential validation with strict 3-attempt limit,
 * account blocking, detailed remaining attempt feedback, and httpOnly session cookies.
 */
export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, error: 'User ID / email and password are required.' },
        { status: 400 }
      );
    }

    const ip = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const result = serverSecurityStore.recordLoginAttempt(identifier, password, ip);

    if (result.isBlocked) {
      return NextResponse.json(
        {
          success: false,
          isBlocked: true,
          passwordResetRequired: result.passwordResetRequired,
          email: result.email,
          maskedEmail: result.maskedEmail,
          error: result.message,
        },
        { status: 403 }
      );
    }

    if (result.isPendingVerification) {
      return NextResponse.json(
        {
          success: false,
          isPendingVerification: true,
          email: result.email,
          maskedEmail: result.maskedEmail,
          error: result.message,
        },
        { status: 403 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          attemptsRemaining: result.attemptsRemaining,
          error: result.message,
        },
        { status: 401 }
      );
    }

    const user = result.user || serverSecurityStore.getUserByEmailOrUid(identifier);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User record not found.' },
        { status: 404 }
      );
    }
    user.firstLoginCompleted = true;

    // Generate unique session ID for single-device login enforcement
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    serverSecurityStore.setActiveSession(user.uid, sessionId, { ip, userAgent });

    const res = NextResponse.json({
      success: true,
      uid: user.uid,
      sessionId,
      email: user.email,
      displayName: user.displayName,
      firstName: user.firstName || user.displayName?.split(' ')[0] || '',
      lastName: user.lastName || user.displayName?.split(' ').slice(1).join(' ') || '',
      company: user.company,
      companyId: user.companyId,
      role: user.role,
      status: user.status,
      mobile: user.mobile || '',
      designation: (user as any).designation || '',
      city: (user as any).city || '',
      state: (user as any).state || '',
      country: (user as any).country || '',
      formattedAddress: (user as any).formattedAddress || '',
      timezone: (user as any).timezone || '',
      avatarUrl: (user as any).avatarUrl || null,
      companyLogoUrl: (user as any).companyLogoUrl || null,
      experiences: (user as any).experiences || [],
      educations: (user as any).educations || [],
      certifications: (user as any).certifications || [],
    });

    // Cryptographically signed httpOnly session cookie with bound sessionId
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
    return NextResponse.json({ success: false, error: err.message || 'Login service unavailable.' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('fr8x_session')?.value;
    if (sessionCookie) {
      const { verifySignedSessionToken } = await import('@/lib/crypto');
      const verified = verifySignedSessionToken<any>(sessionCookie);
      if (verified.valid && verified.payload?.uid) {
        serverSecurityStore.clearActiveSession(verified.payload.uid);
      }
    }
  } catch {}
  const res = NextResponse.json({ success: true, message: 'Session terminated.' });
  res.cookies.delete('fr8x_session');
  return res;
}
