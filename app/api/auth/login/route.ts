import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore, verifyHashedPassword } from '@/lib/server-auth-store';
import { createSignedSessionToken, checkRateLimit, recordFailedAttempt, clearRateLimit } from '@/lib/crypto';
import { createClient } from '@/lib/supabase/server';
import { mapRowToProfile } from '@/lib/supabase/db';
import { redis } from '@/lib/redis';

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

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || '127.0.0.1';
    let targetEmail = String(identifier).trim().toLowerCase();

    // If identifier is a UID or non-email, try to resolve associated email
    if (!targetEmail.includes('@')) {
      const existing = serverSecurityStore.getUser(targetEmail);
      if (existing?.email) {
        targetEmail = existing.email.toLowerCase();
      }
    }

    // Composite key to prevent third-party Denial-of-Service account lockout attacks
    const lockKey = `${ip}:${targetEmail}`;

    // Rate Limiting: max 10 login attempts per IP+identifier per minute
    const rateLimit = await redis.checkRateLimit({
      action: 'user_login',
      identifier: lockKey,
      limit: 10,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many login attempts from this network. Please wait 1 minute before retrying.' },
        { status: 429 }
      );
    }

    // Lockout verification: check if this IP+account has exceeded maximum consecutive failures
    const lockCheck = checkRateLimit(lockKey);
    if (!lockCheck.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Temporary security hold due to repeated failed attempts from this device. Please wait 15 minutes or reset your password.',
          code: 'ACCOUNT_LOCKED',
        },
        { status: 403 }
      );
    }

    // 1. Authoritative Supabase Auth Verification with Server DBMS fallback
    let authSucceeded = false;
    let userId = '';
    let fallbackProfile: any = null;
    let supabaseSession: any = null;
    let authTimedOut = false;

    const supabase = createClient();
    try {
      const authPromise = supabase.auth.signInWithPassword({
        email: targetEmail,
        password,
      });
      const timeoutPromise = new Promise<{ data: any; error: any }>((resolve) =>
        setTimeout(() => resolve({ data: null, error: new Error('Auth timeout') }), 15000)
      );
      const { data: authData, error: authError } = await Promise.race([authPromise, timeoutPromise]);

      if (!authError && authData?.user) {
        authSucceeded = true;
        userId = authData.user.id;
        supabaseSession = authData.session;
      } else if (authError?.message === 'Auth timeout') {
        authTimedOut = true;
      }
    } catch {
      // Continue to server store fallback
    }

    // Fallback: Verify credentials against server security store (PBKDF2)
    if (!authSucceeded) {
      const secUser = serverSecurityStore.getUser(targetEmail) || serverSecurityStore.getUserByEmailOrUid(targetEmail);
      if (secUser && secUser.passwordHash) {
        const isMatch = verifyHashedPassword(password, secUser.passwordHash);
        if (isMatch) {
          authSucceeded = true;
          userId = secUser.uid;
          fallbackProfile = {
            uid: secUser.uid,
            email: secUser.email || targetEmail,
            displayName: secUser.displayName || targetEmail.split('@')[0],
            firstName: secUser.firstName || secUser.displayName?.split(' ')[0] || targetEmail.split('@')[0],
            lastName: secUser.lastName || '',
            company: secUser.company || secUser.companyName || 'Enterprise Logistics',
            companyId: secUser.companyId || '',
            role: secUser.role || 'user',
            status: secUser.status || 'active',
            mobile: secUser.mobile || secUser.phone || '',
            phone: secUser.phone || secUser.mobile || '',
            designation: secUser.designation || 'Logistics Manager',
            plan: secUser.plan || 'trial',
            hasGoldenTick: Boolean((secUser as any).hasGoldenTick || secUser.plan === 'premium'),
            email_verified: Boolean(secUser.email_verified ?? true),
            isVerified: Boolean((secUser as any).isVerified ?? true),
            city: secUser.city || '',
            state: secUser.state || '',
            country: secUser.country || 'India',
            formattedAddress: secUser.formattedAddress || secUser.address || '',
            timezone: secUser.timezone || 'Asia/Kolkata',
            avatarUrl: secUser.avatarUrl || '',
            companyLogoUrl: secUser.companyLogoUrl || '',
            experiences: (secUser as any).experiences || [],
            educations: (secUser as any).educations || [],
            certifications: (secUser as any).certifications || [],
          };
        }
      }
    }

    if (!authSucceeded) {
      if (authTimedOut) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication server took too long to respond. Please check your internet connection and retry.',
            code: 'AUTH_TIMEOUT',
          },
          { status: 504 }
        );
      }

      const lockRes = recordFailedAttempt(lockKey);

      // Progressive delay to exponentially slow down brute force & credential stuffing
      const failedCount = 5 - lockRes.remainingAttempts;
      if (failedCount > 2) {
        const delayMs = Math.min(500 * Math.pow(2, failedCount - 2), 3000);
        await new Promise((r) => setTimeout(r, delayMs));
      }

      serverSecurityStore.addSecurityEvent({
        type: lockRes.locked ? 'ACCOUNT_BLOCKED' : 'FAILED_LOGIN',
        severity: lockRes.locked ? 'HIGH' : 'WARNING',
        userEmail: targetEmail,
        details: `Failed password login from IP ${ip}. Attempts remaining on this device: ${lockRes.remainingAttempts}`,
        ipAddress: ip,
      });

      const errorMessage = lockRes.locked
        ? 'Too many consecutive failed attempts from this device. Please wait 15 minutes.'
        : 'Invalid corporate email or password. Please verify your credentials.';
      return NextResponse.json(
        { success: false, error: errorMessage, attemptsRemaining: lockRes.remainingAttempts },
        { status: lockRes.locked ? 403 : 401 }
      );
    }

    // Clear failed attempts counter on successful login
    clearRateLimit(lockKey);

    // 2. Authoritative PostgreSQL Profile Check (or server store profile)
    let profileRow: any = null;
    try {
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      const profileTimeout = new Promise<{ data: any }>((resolve) =>
        setTimeout(() => resolve({ data: null }), 8000)
      );
      const { data } = await Promise.race([profilePromise, profileTimeout]);
      profileRow = data;
    } catch {
      // continue to fallback
    }

    const user = profileRow ? mapRowToProfile(profileRow) : (fallbackProfile || {
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
    });

    // Keep server DBMS in sync
    serverSecurityStore.updateUserProfile(user.uid, user as any);

    // Generate unique session ID for single-device login enforcement
    const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
    const userAgent = req.headers.get('user-agent') || 'Browser Client';
    const cookieDeviceId = req.cookies.get('fr8x_device_id')?.value;
    const clientDeviceId = (body.deviceId ? String(body.deviceId).trim() : '') || cookieDeviceId || `dev_${Date.now()}`;
    serverSecurityStore.setActiveSession(user.uid, sessionId, { ip, userAgent, deviceId: clientDeviceId });

    // Record login security incident into Godfather security stream
    serverSecurityStore.addSecurityEvent({
      type: 'USER_LOGIN',
      severity: 'INFO',
      userEmail: user.email,
      uid: user.uid,
      company: user.company || 'Enterprise Logistics',
      details: `Corporate login authenticated from ${ip}. User affirmed adherence to FR8X Master Terms of Service & Security Policies.`,
      ipAddress: ip,
    });

    const now = Date.now();
    const expiresAt = now + 2 * 60 * 60 * 1000; // 2 hours

    const res = NextResponse.json({
      success: true,
      uid: user.uid,
      sessionId,
      deviceId: clientDeviceId,
      expiresAt,
      token: supabaseSession?.access_token || undefined,
      refreshToken: supabaseSession?.refresh_token || undefined,
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
