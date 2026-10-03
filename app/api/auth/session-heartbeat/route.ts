import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { verifySignedSessionToken } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

const SESSION_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2 hours strictly

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const sessionCookie = req.cookies.get('fr8x_session')?.value;
    let cookieUid: string | undefined;
    let cookieSessionId: string | undefined;
    let cookieDeviceId: string | undefined;
    let issuedAt: number | undefined;

    if (sessionCookie) {
      const verified = verifySignedSessionToken<any>(sessionCookie);
      if (verified.valid && verified.payload) {
        cookieUid = verified.payload.uid;
        cookieSessionId = verified.payload.sessionId;
        cookieDeviceId = verified.payload.deviceId;
        issuedAt = verified.payload.issuedAt;
      }
    }

    const email = body.email ? String(body.email).trim().toLowerCase() : '';
    const uid = body.uid || cookieUid;
    const sessionId = body.sessionId || cookieSessionId;
    const explicitCookieDeviceId = req.cookies.get('fr8x_device_id')?.value;
    const clientDeviceId = body.deviceId || cookieDeviceId || explicitCookieDeviceId;

    if (!uid && !email) {
      return NextResponse.json(
        { valid: false, reason: 'missing_credentials', message: 'No active authenticated user session provided.' },
        { status: 401 }
      );
    }

    // 1. Check 2-hour session expiration window
    const now = Date.now();
    if (issuedAt && (now - issuedAt > SESSION_MAX_AGE_MS)) {
      const res = NextResponse.json(
        {
          valid: false,
          reason: 'session_expired',
          message: 'Your 2-hour session has expired. Please sign in again to continue.',
        },
        { status: 401 }
      );
      res.cookies.delete('fr8x_session');
      return res;
    }

    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 2. Validate against server store (checks same device vs actual device change)
    const result = serverSecurityStore.validateActiveSession(
      email || uid,
      sessionId || '',
      clientDeviceId,
      ip
    );

    if (!result.valid) {
      if (result.reason === 'concurrent_device_login') {
        const res = NextResponse.json(
          {
            valid: false,
            reason: 'concurrent_device_login',
            message:
              result.message ||
              "Your account was accessed from another device. For your security, FR8X allows only one active session per user, so this device has been signed out.",
          },
          { status: 401 }
        );
        res.cookies.delete('fr8x_session');
        return res;
      }
      if (result.reason === 'session_expired') {
        const res = NextResponse.json(
          {
            valid: false,
            reason: 'session_expired',
            message: 'Your 2-hour session has expired. Please sign in again to continue.',
          },
          { status: 401 }
        );
        res.cookies.delete('fr8x_session');
        return res;
      }
    }

    return NextResponse.json({ valid: true, sessionId: sessionId || cookieSessionId, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || 'Session validation failed.' },
      { status: 500 }
    );
  }
}
