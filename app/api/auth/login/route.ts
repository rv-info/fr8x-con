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
    const body = await req.json();
    const { identifier, password, deviceId } = body || {};

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

    // AUTH-01: Intercept mandatory first-login 2FA challenge
    if (result.firstLoginRequired) {
      if (result.emailPromise) {
        try {
          await result.emailPromise;
        } catch (err: any) {
          console.error('[LoginAPI] First-login OTP delivery warning:', err.message);
        }
      }
      return NextResponse.json({
        success: true,
        firstLoginRequired: true,
        challengeToken: result.challengeToken,
        email: result.email,
        maskedEmail: result.maskedEmail,
        expiresIn: result.expiresIn || 10,
        message: 'First-time authentication challenge sent to your corporate email.',
      });
    }

    const user = result.user || serverSecurityStore.getUserByEmailOrUid(identifier);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User record not found.' },
        { status: 404 }
      );
    }

    // Generate unique session ID for single-device login enforcement
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    const cookieDeviceId = req.cookies.get('fr8x_device_id')?.value;
    const clientDeviceId = (body.deviceId ? String(body.deviceId).trim() : '') || cookieDeviceId || `dev_${Date.now()}`;
    serverSecurityStore.setActiveSession(user.uid, sessionId, { ip, userAgent, deviceId: clientDeviceId });

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
      console.warn('[LoginAPI] Firebase custom token generation warning:', fbErr.message);
    }

    const now = Date.now();
    const expiresAt = now + 2 * 60 * 60 * 1000; // 2 hours

    const res = NextResponse.json({
      success: true,
      uid: user.uid,
      sessionId,
      deviceId: clientDeviceId,
      expiresAt,
      firebaseCustomToken,
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

    // Cryptographically signed httpOnly session cookie with bound sessionId and 2-hour duration
    const userSessionToken = createSignedSessionToken({
      uid: user.uid,
      email: user.email,
      role: user.role,
      companyId: user.companyId,
      sessionId,
      deviceId: clientDeviceId,
      issuedAt: now,
      expiresAt,
    });

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
    res.cookies.set('fr8x_session', userSessionToken, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 2 * 60 * 60, // 2 hours strictly
      path: '/',
    });
    res.cookies.set('fr8x_device_id', clientDeviceId, {
      httpOnly: false,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 365 * 24 * 60 * 60,
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
