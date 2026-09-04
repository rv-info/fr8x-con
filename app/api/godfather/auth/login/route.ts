import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { getAuthorizedOperatorEmail, verifyOperatorPassword } from '@/lib/godfather/operator-store';

export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json().catch(() => ({}));
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }

    const normEmail = String(email).trim().toLowerCase();
    const authorizedEmail = getAuthorizedOperatorEmail();

    if (normEmail !== authorizedEmail || !verifyOperatorPassword(String(password))) {
      return NextResponse.json(
        { error: 'Invalid operator credentials. Please check your email and password.' },
        { status: 401 }
      );
    }

    const sessionId = `SESS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    const response = NextResponse.json({
      success: true,
      message: 'Authentication successful',
      sessionId,
      operator: {
        uid: 'gf-op-godfather',
        email: authorizedEmail,
        displayName: 'Chief Administrator',
        role: 'godfather_owner',
      },
      correlationId,
      expiresAt,
    });

    const isHttps = req.nextUrl.protocol === 'https:' && process.env.NODE_ENV === 'production';

    // Session cookie (cleared on browser close, compatible with localhost and HTTPS)
    response.cookies.set({
      name: 'fr8x_godfather_session',
      value: `${sessionId}:gf-op-godfather:godfather_owner`,
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });

    if (isHttps) {
      response.cookies.set({
        name: '__Secure-FR8X-Godfather-Session',
        value: `${sessionId}:gf-op-godfather:godfather_owner`,
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 12,
      });
    }

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: 'Authentication processing error' },
      { status: 500 }
    );
  }
}
