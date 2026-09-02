import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';

const AUTHORISED_EMAIL = 'tech@fr8x.in';
const AUTHORISED_PASS = 'Godfather@Sovereign1';

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

    if (normEmail !== AUTHORISED_EMAIL || password !== AUTHORISED_PASS) {
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
        email: AUTHORISED_EMAIL,
        displayName: 'Chief Administrator (tech@fr8x.in)',
        role: 'godfather_owner',
      },
      correlationId,
      expiresAt,
    });

    // Session cookie (cleared on browser close)
    response.cookies.set({
      name: '__Secure-FR8X-Godfather-Session',
      value: `${sessionId}:gf-op-godfather:godfather_owner`,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Authentication processing error' },
      { status: 500 }
    );
  }
}
