import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { verifySignedSessionToken } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const sessionCookie = req.cookies.get('fr8x_session')?.value;
    let cookieUid: string | undefined;
    let cookieSessionId: string | undefined;

    if (sessionCookie) {
      const verified = verifySignedSessionToken<any>(sessionCookie);
      if (verified.valid && verified.payload) {
        cookieUid = verified.payload.uid;
        cookieSessionId = verified.payload.sessionId;
      }
    }

    const uid = body.uid || cookieUid;
    const sessionId = body.sessionId || cookieSessionId;

    if (!uid || !sessionId) {
      return NextResponse.json(
        { valid: false, reason: 'missing_credentials', message: 'No active session or UID provided.' },
        { status: 400 }
      );
    }

    const result = serverSecurityStore.validateActiveSession(uid, sessionId);

    if (!result.valid) {
      const res = NextResponse.json(
        {
          valid: false,
          reason: result.reason || 'session_invalid',
          message:
            result.message ||
            "Your account was accessed from another device. For your security, FR8X allows only one active session per user, so this device has been signed out.",
        },
        { status: 401 }
      );
      // Remove cookie on old device
      res.cookies.delete('fr8x_session');
      return res;
    }

    return NextResponse.json({ valid: true, timestamp: Date.now() });
  } catch (err: any) {
    return NextResponse.json(
      { valid: false, error: err.message || 'Session validation failed.' },
      { status: 500 }
    );
  }
}
