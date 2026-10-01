import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { createSignedSessionToken, verifySignedSessionToken } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

/**
 * 2 Hours in Seconds (7,200 seconds)
 */
const SESSION_MAX_AGE_SECONDS = 2 * 60 * 60;

/**
 * POST /api/auth/session
 * Binds active device session for an authenticated user, enforcing the 2-hour single-device policy.
 * Sets the httpOnly 'fr8x_session' cookie with 2-hour expiration.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const uid = body.uid ? String(body.uid).trim() : '';
    const email = body.email ? String(body.email).trim().toLowerCase() : '';
    const role = body.role || 'user';
    const companyId = body.companyId || 'CMP-00000';
    const clientDeviceId = body.deviceId ? String(body.deviceId).trim() : `dev_${Date.now()}`;

    if (!uid && !email) {
      return NextResponse.json(
        { success: false, error: 'User UID or email required to bind session.' },
        { status: 400 }
      );
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Browser Client';

    // Generate or reuse bound session ID
    const sessionId =
      body.sessionId ||
      `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    // Bind session in authoritative security store with 2-hour duration
    serverSecurityStore.setActiveSession(uid || email, sessionId, {
      ip,
      userAgent,
      deviceId: clientDeviceId,
    });

    const now = Date.now();
    const expiresAt = now + SESSION_MAX_AGE_SECONDS * 1000;

    // Issue HMAC-SHA256 signed session token
    const token = createSignedSessionToken({
      uid,
      email,
      role,
      companyId,
      sessionId,
      deviceId: clientDeviceId,
      ip,
      issuedAt: now,
      expiresAt,
    });

    const res = NextResponse.json({
      success: true,
      sessionId,
      deviceId: clientDeviceId,
      issuedAt: now,
      expiresAt,
    });

    // Set signed httpOnly session cookie with strict 2-hour maxAge
    res.cookies.set('fr8x_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_MAX_AGE_SECONDS,
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Session initialization failed.' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/session
 * Verifies current session cookie and returns session validity status.
 */
export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get('fr8x_session')?.value;
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false, reason: 'missing_cookie' });
    }

    const verified = verifySignedSessionToken<any>(sessionCookie);
    if (!verified.valid || !verified.payload) {
      return NextResponse.json({ authenticated: false, reason: 'invalid_token' });
    }

    // Check 2-hour expiration window
    const now = Date.now();
    const issuedAt = verified.payload.issuedAt || 0;
    const expiresAt = verified.payload.expiresAt || (issuedAt + SESSION_MAX_AGE_SECONDS * 1000);

    if (now > expiresAt || (now - issuedAt > SESSION_MAX_AGE_SECONDS * 1000)) {
      const res = NextResponse.json({ authenticated: false, reason: 'session_expired' });
      res.cookies.delete('fr8x_session');
      return res;
    }

    return NextResponse.json({
      authenticated: true,
      user: verified.payload,
      expiresInSeconds: Math.max(0, Math.floor((expiresAt - now) / 1000)),
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message });
  }
}
