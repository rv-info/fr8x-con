import { NextRequest, NextResponse } from 'next/server';
import { generateCorrelationId } from '@/lib/godfather/utils/audit';
import { verifySignedSessionToken, createSignedSessionToken } from '@/lib/crypto';
import { serverSecurityStore } from '@/lib/server-auth-store';

interface GodfatherSessionPayload {
  sessionId: string;
  uid: string;
  email: string;
  role: string;
  issuedAt: number;
  expiresAt?: string;
}

/**
 * GET /api/godfather/session
 * Checks whether an active Godfather session cookie is present, cryptographically signed,
 * and currently active in the server session registry.
 */
export async function GET(req: NextRequest) {
  const sessionCookie =
    req.cookies.get('fr8x_godfather_session') ||
    req.cookies.get('__Secure-FR8X-Godfather-Session');

  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  // 1. Verify HMAC cryptographic signature
  const verification = verifySignedSessionToken<GodfatherSessionPayload>(sessionCookie.value);
  if (!verification.valid || !verification.payload) {
    return NextResponse.json({ authenticated: false, reason: 'invalid_signature' }, { status: 200 });
  }

  const { sessionId, uid, email, role, expiresAt } = verification.payload;

  // 2. Check expiration
  if (expiresAt && new Date() > new Date(expiresAt)) {
    serverSecurityStore.revokeGodfatherSession(sessionId);
    return NextResponse.json({ authenticated: false, reason: 'session_expired' }, { status: 200 });
  }

  // 3. Verify session exists in server security store
  if (!serverSecurityStore.isGodfatherSessionActive(sessionId)) {
    return NextResponse.json({ authenticated: false, reason: 'session_revoked' }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    sessionId,
    operator: {
      uid: uid || 'gf-op-godfather',
      email: email || 'tech@fr8x.in',
      displayName: `Chief Administrator (${email || 'tech@fr8x.in'})`,
      role: role || 'godfather_owner',
    },
  });
}

/**
 * POST /api/godfather/session
 * Refreshes an authenticated operator session.
 * SECURITY: Unauthenticated callers CANNOT forge sessions through this endpoint (C-03 remediation).
 */
export async function POST(req: NextRequest) {
  const correlationId = generateCorrelationId();
  const sessionCookie =
    req.cookies.get('fr8x_godfather_session') ||
    req.cookies.get('__Secure-FR8X-Godfather-Session');

  if (!sessionCookie || !sessionCookie.value) {
    return NextResponse.json(
      { error: 'Unauthorized: No active operator session found. Authenticate via /api/godfather/auth/login first.' },
      { status: 401 }
    );
  }

  const verification = verifySignedSessionToken<GodfatherSessionPayload>(sessionCookie.value);
  if (!verification.valid || !verification.payload) {
    return NextResponse.json(
      { error: 'Unauthorized: Tampered or invalid session token.' },
      { status: 401 }
    );
  }

  const { sessionId, uid, email, role } = verification.payload;
  if (!serverSecurityStore.isGodfatherSessionActive(sessionId)) {
    return NextResponse.json(
      { error: 'Unauthorized: Session has expired or been revoked.' },
      { status: 401 }
    );
  }

  // Refresh expiration
  const newExpiresAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
  const updatedPayload: GodfatherSessionPayload = {
    sessionId,
    uid,
    email,
    role,
    issuedAt: Date.now(),
    expiresAt: newExpiresAt,
  };

  const signedToken = createSignedSessionToken(updatedPayload);
  const response = NextResponse.json({
    success: true,
    sessionId,
    operatorUid: uid,
    operatorEmail: email,
    role,
    correlationId,
    expiresAt: newExpiresAt,
  });

  const isHttps = req.nextUrl.protocol === 'https:' && process.env.NODE_ENV === 'production';
  response.cookies.set({
    name: 'fr8x_godfather_session',
    value: signedToken,
    httpOnly: true,
    secure: isHttps,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 12,
  });

  if (isHttps) {
    response.cookies.set({
      name: '__Secure-FR8X-Godfather-Session',
      value: signedToken,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    });
  }

  return response;
}

/**
 * DELETE /api/godfather/session
 * Clears the session cookie and revokes the session in server security store.
 */
export async function DELETE(req: NextRequest) {
  const sessionCookie =
    req.cookies.get('fr8x_godfather_session') ||
    req.cookies.get('__Secure-FR8X-Godfather-Session');

  if (sessionCookie && sessionCookie.value) {
    const verification = verifySignedSessionToken<GodfatherSessionPayload>(sessionCookie.value);
    if (verification.valid && verification.payload?.sessionId) {
      serverSecurityStore.revokeGodfatherSession(verification.payload.sessionId);
    }
  }

  const res = NextResponse.json({ success: true, message: 'Godfather session terminated.' });
  res.cookies.delete('fr8x_godfather_session');
  res.cookies.delete('__Secure-FR8X-Godfather-Session');
  return res;
}
