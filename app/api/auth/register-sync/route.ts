import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';

export const dynamic = 'force-dynamic';

/**
 * POST /api/auth/register-sync
 * Synchronizes newly registered Firebase Authentication users into the server store
 * so that member directories, Godfather views, and legacy APIs share the identical UID.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await req.json();
    if (!user || !user.uid || !user.email) {
      return NextResponse.json({ success: false, error: 'Missing UID or email' }, { status: 400 });
    }

    const cleanEmail = user.email.trim().toLowerCase();
    const cleanUid = user.uid.trim();

    // Check if user already exists
    const existing = serverSecurityStore.getUser(cleanUid) || serverSecurityStore.getUser(cleanEmail);
    if (!existing) {
      serverSecurityStore.registerUser(
        {
          uid: cleanUid,
          email: cleanEmail,
          password: 'FirebaseVerifiedSession@2026',
          displayName: user.displayName || cleanEmail,
          company: user.company || user.companyName || 'Enterprise Member',
          companyId: user.companyId || `CMP-${Math.floor(10000 + Math.random() * 90000)}`,
          role: user.role === 'user' ? 'user' : 'company_admin',
          mobile: user.mobile || user.mobileNumber || '',
        },
        { skipVerification: true, firstLoginCompleted: true }
      );
    }

    return NextResponse.json({ success: true, uid: cleanUid });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
