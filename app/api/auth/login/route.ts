import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

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
          error: 'ACCOUNT BLOCKED. CONTACT PLATFORM ADMINISTRATOR.',
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

    const user = result.user!;
    const res = NextResponse.json({
      success: true,
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      company: user.company,
      companyId: user.companyId,
      role: user.role,
      status: user.status,
    });

    // Secure httpOnly session cookie
    res.cookies.set('fr8x_session', user.uid, {
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

export async function DELETE(_req: NextRequest) {
  const res = NextResponse.json({ success: true, message: 'Session terminated.' });
  res.cookies.delete('fr8x_session');
  return res;
}
