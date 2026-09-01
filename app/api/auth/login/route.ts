import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/login
 * Server-side credential validation — validates user ID/email + password.
 * Sets an httpOnly session cookie on success.
 *
 * In production: swap USER_CREDENTIALS for a DB/Firebase Auth lookup.
 */

// Server-side password store (mirrors AuthContext demo passwords)
const USER_CREDENTIALS: Record<string, { uid: string; email: string; password: string }> = {
  'u-arjun': { uid: 'u-arjun', email: 'arjun@atlaslogistics.com', password: 'Atlas@2025' },
  'arjun@atlaslogistics.com': { uid: 'u-arjun', email: 'arjun@atlaslogistics.com', password: 'Atlas@2025' },
  'u-sarah': { uid: 'u-sarah', email: 'sarah.lewis@rotterdamfreight.nl', password: 'Rotterdam@2025' },
  'sarah.lewis@rotterdamfreight.nl': { uid: 'u-sarah', email: 'sarah.lewis@rotterdamfreight.nl', password: 'Rotterdam@2025' },
  'u-kiran': { uid: 'u-kiran', email: 'kiran.mehta@indoocean.com', password: 'IndoOcean@2025' },
  'kiran.mehta@indoocean.com': { uid: 'u-kiran', email: 'kiran.mehta@indoocean.com', password: 'IndoOcean@2025' },
};

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'User ID and password are required.' }, { status: 400 });
    }

    const record = USER_CREDENTIALS[identifier.trim().toLowerCase()];

    if (!record || record.password !== password) {
      return NextResponse.json({ error: 'Invalid credentials.' }, { status: 401 });
    }

    const res = NextResponse.json({ success: true, uid: record.uid, email: record.email });

    // httpOnly session cookie — 8-hour expiry
    res.cookies.set('fr8x_session', record.uid, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8,
      path: '/',
    });

    return res;
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Login failed.' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('fr8x_session');
  return res;
}
