import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { verifySignedSessionToken } from '@/lib/crypto';

export const dynamic = 'force-dynamic';

function getAuthenticatedUid(req: NextRequest): string | null {
  const sessionCookie = req.cookies.get('fr8x_session')?.value;
  if (!sessionCookie) return null;
  const verified = verifySignedSessionToken<any>(sessionCookie);
  if (verified.valid && verified.payload?.uid) {
    return verified.payload.uid;
  }
  return null;
}

/**
 * GET /api/user/profile
 * Retrieves full persisted user profile from DBMS
 */
export async function GET(req: NextRequest) {
  try {
    const authUid = getAuthenticatedUid(req);
    const { searchParams } = new URL(req.url);
    const targetUid = searchParams.get('uid') || authUid;

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized. Valid session or UID required.' },
        { status: 401 }
      );
    }

    const user = serverSecurityStore.getUser(targetUid) || serverSecurityStore.getUserByEmailOrUid(targetUid);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found in DBMS.' },
        { status: 404 }
      );
    }

    // Sanitize sensitive credentials
    const { passwordHash, salt, ...safeUser } = user;
    return NextResponse.json({ success: true, user: safeUser });
  } catch (err: any) {
    console.error('[API/User/Profile] GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch user profile.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/profile
 * Updates contact number, locations, experiences, educations, company affiliation, etc.
 * Persists immediately to authoritative DBMS (.knox/dbms/users.json).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authUid = getAuthenticatedUid(req);
    const targetUid = body.uid || body.email || authUid;

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized or target user identifier missing.' },
        { status: 401 }
      );
    }

    // Updates payload can be passed either inside `updates` or at the top level
    const updates = body.updates || body;
    // Don't accidentally overwrite uid or passwordHash from unrestricted fields
    const { uid: _u, passwordHash: _p, salt: _s, ...cleanUpdates } = updates;

    const result = serverSecurityStore.updateUserProfile(targetUid, cleanUpdates);
    if (!result.success || !result.user) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to update user profile in DBMS.' },
        { status: 400 }
      );
    }

    const { passwordHash, salt, ...safeUser } = result.user;
    return NextResponse.json({
      success: true,
      message: 'Profile, contact details and geographic location saved in DBMS successfully.',
      user: safeUser,
    });
  } catch (err: any) {
    console.error('[API/User/Profile] POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Profile update service error.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}
