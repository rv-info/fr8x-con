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
    const cookieDeviceId = req.cookies.get('fr8x_device_id')?.value;
    const clientDeviceId = (body.deviceId ? String(body.deviceId).trim() : '') || cookieDeviceId || `dev_${Date.now()}`;

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
    // Check if refreshing an existing valid session to enforce original 2-hour login limit
    const existingCookie = req.cookies.get('fr8x_session')?.value;
    let issuedAt = now;
    let expiresAt = now + SESSION_MAX_AGE_SECONDS * 1000;

    if (existingCookie) {
      const verifiedExisting = verifySignedSessionToken<any>(existingCookie);
      if (verifiedExisting.valid && verifiedExisting.payload?.issuedAt) {
        const origIssuedAt = Number(verifiedExisting.payload.issuedAt);
        const origExpiresAt = Number(verifiedExisting.payload.expiresAt) || (origIssuedAt + SESSION_MAX_AGE_SECONDS * 1000);
        if (now - origIssuedAt > SESSION_MAX_AGE_SECONDS * 1000 || now > origExpiresAt) {
          const res = NextResponse.json({ success: false, error: 'Session expired', reason: 'session_expired' }, { status: 401 });
          res.cookies.delete('fr8x_session');
          return res;
        }
        // Preserve original login timestamp; refreshes do NOT extend the 2-hour maximum session window
        issuedAt = origIssuedAt;
        expiresAt = origExpiresAt;
      }
    }

    // Issue HMAC-SHA256 signed session token
    const token = createSignedSessionToken({
      uid,
      email,
      role,
      companyId,
      sessionId,
      deviceId: clientDeviceId,
      ip,
      issuedAt,
      expiresAt,
    });

    const res = NextResponse.json({
      success: true,
      sessionId,
      deviceId: clientDeviceId,
      issuedAt,
      expiresAt,
    });

    const isHttps = req.nextUrl.protocol === 'https:' || req.headers.get('x-forwarded-proto') === 'https';
    const remainingSeconds = Math.max(1, Math.floor((expiresAt - now) / 1000));
    // Set signed httpOnly session cookie with remaining duration
    res.cookies.set('fr8x_session', token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: remainingSeconds,
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

    let userData = verified.payload;
    try {
      const latestUser = serverSecurityStore.getUser(verified.payload.uid) || serverSecurityStore.getUserByEmailOrUid(verified.payload.uid);
      if (latestUser) {
        const u = latestUser as any;
        userData = {
          ...verified.payload,
          displayName: u.displayName || verified.payload.displayName,
          firstName: u.firstName || verified.payload.firstName,
          lastName: u.lastName || verified.payload.lastName,
          company: u.company || verified.payload.company,
          companyId: u.companyId || verified.payload.companyId,
          role: u.role || verified.payload.role,
          mobile: u.mobile || u.phone || '',
          phone: u.mobile || u.phone || '',
          designation: u.designation || '',
          location: u.location || [u.city, u.state, u.country].filter(Boolean).join(', ') || u.formattedAddress || u.address || '',
          formattedAddress: u.formattedAddress || u.address || '',
          address: u.formattedAddress || u.address || '',
          city: u.city || '',
          state: u.state || '',
          country: u.country || '',
          plan: u.plan || verified.payload.plan,
          avatarUrl: u.avatarUrl || verified.payload.avatarUrl,
          hasGoldenTick: u.hasGoldenTick,
          status: u.status,
        };
      }
    } catch {}

    return NextResponse.json({
      authenticated: true,
      user: userData,
      expiresInSeconds: Math.max(0, Math.floor((expiresAt - now) / 1000)),
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, error: err.message });
  }
}
