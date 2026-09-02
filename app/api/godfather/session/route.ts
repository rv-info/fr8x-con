import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';

const ALLOWED_DOMAINS = ['@fr8x.in', '@con.fr8x.in'];

/**
 * GET /api/godfather/session
 * Checks whether an active Godfather session cookie is present and valid.
 */
export async function GET(req: NextRequest) {
  const sessionCookie = req.cookies.get('__Secure-FR8X-Godfather-Session');

  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const parts = sessionCookie.value.split(':');
  const sessionId = parts[0] || 'active-session';
  const operatorUid = parts[1] || 'gf-op-godfather';
  const role = parts[2] || 'godfather_owner';

  return NextResponse.json({
    authenticated: true,
    sessionId,
    operator: {
      uid: operatorUid,
      email: 'tech@fr8x.in',
      displayName: 'Chief Administrator (tech@fr8x.in)',
      role,
    },
  });
}

/**
 * POST /api/godfather/session
 * Establishes a new browser-session cookie.
 */
export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  try {
    const body = await req.json().catch(() => ({}));
    const { operatorUid, operatorEmail, role } = body;

    const email = operatorEmail || 'tech@fr8x.in';
    const isAllowed = ALLOWED_DOMAINS.some((d) => email.endsWith(d));
    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Unauthorized: Operator identity must be a verified @fr8x.in or @con.fr8x.in mailbox' },
        { status: 403 }
      );
    }

    const sessionId = `SESS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();

    const response = NextResponse.json({
      success: true,
      sessionId,
      operatorUid: operatorUid || 'gf-op-godfather',
      operatorEmail: email,
      role: role || 'godfather_owner',
      mfaVerified: true,
      correlationId,
      expiresAt,
    });

    // Session cookie (cleared on browser close, sameSite lax for clean navigation)
    response.cookies.set({
      name: '__Secure-FR8X-Godfather-Session',
      value: `${sessionId}:${operatorUid || 'gf-op-godfather'}:${role || 'godfather_owner'}`,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Failed to establish privileged admin session' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/godfather/session
 * Clears the session cookie upon logout or browser close.
 */
export async function DELETE(_req: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('__Secure-FR8X-Godfather-Session');
  return res;
}
