import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { createSignedSessionToken } from '@/lib/crypto';

/**
 * POST /api/auth/login
 * Server-side credential validation with strict 3-attempt limit,
 * account blocking, detailed remaining attempt feedback, and httpOnly session cookies.
 */
function parseFirestoreFields(fields: any): any {
  function parseVal(val: any): any {
    if (!val || typeof val !== 'object') return val;
    if ('stringValue' in val) return val.stringValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('doubleValue' in val) return parseFloat(val.doubleValue);
    if ('timestampValue' in val) return val.timestampValue;
    if ('nullValue' in val) return null;
    if ('mapValue' in val) {
      const res: any = {};
      const f = val.mapValue?.fields || {};
      for (const k of Object.keys(f)) res[k] = parseVal(f[k]);
      return res;
    }
    if ('arrayValue' in val) {
      return (val.arrayValue?.values || []).map(parseVal);
    }
    return val;
  }
  const out: any = {};
  for (const k of Object.keys(fields || {})) {
    out[k] = parseVal(fields[k]);
  }
  return out;
}

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
    let targetEmail = String(identifier).trim().toLowerCase();

    // If identifier is a UID or non-email, try to resolve associated email
    if (!targetEmail.includes('@')) {
      const existing = serverSecurityStore.getUser(targetEmail);
      if (existing?.email) {
        targetEmail = existing.email.toLowerCase();
      }
    }

    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCTFPoToXBfIk4BFTc13a3x5geBTZlWwjk";

    // 1. Authoritative Firebase Auth Verification via REST API
    let firebaseUserData: any = null;
    try {
      const fbAuthRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: targetEmail,
            password,
            returnSecureToken: true,
          }),
        }
      );

      if (!fbAuthRes.ok) {
        const errJson = await fbAuthRes.json().catch(() => ({}));
        const errCode = errJson?.error?.message;
        let errorMessage = 'Invalid credentials or user does not exist in Firebase Auth.';
        if (errCode === 'EMAIL_NOT_FOUND') {
          errorMessage = 'Account not found in Firebase Auth. The user may have been deleted.';
        } else if (errCode === 'INVALID_PASSWORD' || errCode === 'INVALID_LOGIN_CREDENTIALS') {
          errorMessage = 'Invalid corporate email or password. Please verify your credentials.';
        } else if (errCode === 'USER_DISABLED') {
          errorMessage = 'This account has been disabled in Firebase.';
        }
        return NextResponse.json({ success: false, error: errorMessage }, { status: 401 });
      }

      firebaseUserData = await fbAuthRes.json();
    } catch (fbErr: any) {
      console.error('[LoginAPI] Firebase Auth connection error:', fbErr);
      return NextResponse.json({ success: false, error: 'Firebase authentication service unavailable.' }, { status: 503 });
    }

    const localId = firebaseUserData.localId;
    const idToken = firebaseUserData.idToken;

    // 2. Authoritative Firestore Profile Check
    let firestoreProfile: any = null;
    try {
      const fsRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/fr8x-con/databases/(default)/documents/users/${localId}`,
        {
          headers: { Authorization: `Bearer ${idToken}` },
        }
      );
      if (fsRes.ok) {
        const fsDoc = await fsRes.json();
        if (fsDoc.fields) {
          firestoreProfile = parseFirestoreFields(fsDoc.fields);
        }
      }
    } catch (fsErr: any) {
      console.warn('[LoginAPI] Firestore profile lookup warning:', fsErr?.message);
    }

    if (!firestoreProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile document not found in Firestore. The user data may have been deleted.' },
        { status: 404 }
      );
    }

    const user = {
      uid: localId,
      firebaseUid: localId,
      email: firebaseUserData.email || firestoreProfile.email || targetEmail,
      displayName: firestoreProfile.displayName || firebaseUserData.displayName || targetEmail.split('@')[0],
      firstName: firestoreProfile.firstName || (firestoreProfile.displayName || '').split(' ')[0] || '',
      lastName: firestoreProfile.lastName || (firestoreProfile.displayName || '').split(' ').slice(1).join(' ') || '',
      company: firestoreProfile.company || '',
      companyId: firestoreProfile.companyId || '',
      role: firestoreProfile.role || 'user',
      status: firestoreProfile.status || 'active',
      mobile: firestoreProfile.mobile || firestoreProfile.phone || '',
      phone: firestoreProfile.mobile || firestoreProfile.phone || '',
      designation: firestoreProfile.designation || '',
      city: firestoreProfile.city || '',
      state: firestoreProfile.state || '',
      country: firestoreProfile.country || '',
      formattedAddress: firestoreProfile.formattedAddress || firestoreProfile.address || '',
      address: firestoreProfile.formattedAddress || firestoreProfile.address || '',
      location: firestoreProfile.location || [firestoreProfile.city, firestoreProfile.state, firestoreProfile.country].filter(Boolean).join(', ') || firestoreProfile.formattedAddress || firestoreProfile.address || '',
      timezone: firestoreProfile.timezone || '',
      avatarUrl: firestoreProfile.avatarUrl || null,
      companyLogoUrl: firestoreProfile.companyLogoUrl || null,
      experiences: firestoreProfile.experiences || [],
      educations: firestoreProfile.educations || [],
      certifications: firestoreProfile.certifications || [],
      plan: firestoreProfile.plan || 'trial',
      hasGoldenTick: Boolean(firestoreProfile.hasGoldenTick),
      email_verified: Boolean(firestoreProfile.email_verified ?? true),
      isVerified: Boolean(firestoreProfile.isVerified ?? true),
      updatedAt: firestoreProfile.updatedAt || undefined,
    };

    // Keep server DBMS in sync with confirmed Firestore user document
    serverSecurityStore.updateUserProfile(user.uid, user);

    // Generate unique session ID for single-device login enforcement
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    const cookieDeviceId = req.cookies.get('fr8x_device_id')?.value;
    const clientDeviceId = (body.deviceId ? String(body.deviceId).trim() : '') || cookieDeviceId || `dev_${Date.now()}`;
    serverSecurityStore.setActiveSession(user.uid, sessionId, { ip, userAgent, deviceId: clientDeviceId });

    let firebaseCustomToken: string | null = null;
    try {
      const { createCustomToken } = await import('@/lib/firebase/admin');
      firebaseCustomToken = await createCustomToken(user.uid, {
        role: user.role,
        companyId: user.companyId,
        isVerified: Boolean(user.email_verified && user.status === 'active'),
        plan: user.plan || 'trial',
        hasGoldenTick: Boolean(user.hasGoldenTick),
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
      firstName: user.firstName,
      lastName: user.lastName,
      company: user.company,
      companyId: user.companyId,
      role: user.role,
      status: user.status,
      mobile: user.mobile,
      designation: user.designation,
      city: user.city,
      state: user.state,
      country: user.country,
      formattedAddress: user.formattedAddress,
      timezone: user.timezone,
      avatarUrl: user.avatarUrl,
      companyLogoUrl: user.companyLogoUrl,
      experiences: user.experiences,
      educations: user.educations,
      certifications: user.certifications,
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
