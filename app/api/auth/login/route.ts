import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { createSignedSessionToken } from '@/lib/crypto';
import { createClient } from '@/lib/supabase/server';
import { mapRowToProfile } from '@/lib/supabase/db';

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

    // 1. Authoritative Supabase Auth Verification
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: targetEmail,
      password,
    });

    if (authError || !authData.user) {
      let errorMessage = 'Invalid corporate email or password. Please verify your credentials.';
      if (authError?.message?.includes('Email not confirmed')) {
        errorMessage = 'Email address not confirmed. Please verify your email.';
      }
      return NextResponse.json({ success: false, error: errorMessage }, { status: 401 });
    }

    const userId = authData.user.id;

    // 2. Authoritative PostgreSQL Profile Check
    const { data: profileRow } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    const user = profileRow ? mapRowToProfile(profileRow) : {
      uid: userId,
      email: targetEmail,
      displayName: targetEmail.split('@')[0],
      firstName: targetEmail.split('@')[0],
      lastName: '',
      company: 'Enterprise Logistics',
      companyId: '',
      role: 'user',
      status: 'active',
      mobile: '',
      phone: '',
      designation: 'Logistics Manager',
      plan: 'trial',
      hasGoldenTick: false,
      email_verified: true,
      isVerified: true,
      city: '',
      state: '',
      country: 'India',
      formattedAddress: '',
      timezone: 'Asia/Kolkata',
      avatarUrl: '',
      companyLogoUrl: '',
      experiences: [],
      educations: [],
      certifications: [],
    };

    // Keep server DBMS in sync
    serverSecurityStore.updateUserProfile(user.uid, user as any);

    // Generate unique session ID for single-device login enforcement
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    const cookieDeviceId = req.cookies.get('fr8x_device_id')?.value;
    const clientDeviceId = (body.deviceId ? String(body.deviceId).trim() : '') || cookieDeviceId || `dev_${Date.now()}`;
    serverSecurityStore.setActiveSession(user.uid, sessionId, { ip, userAgent, deviceId: clientDeviceId });

    const now = Date.now();
    const expiresAt = now + 2 * 60 * 60 * 1000; // 2 hours

    const res = NextResponse.json({
      success: true,
      uid: user.uid,
      sessionId,
      deviceId: clientDeviceId,
      expiresAt,
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
