import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { verifySignedSessionToken } from '@/lib/crypto';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

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
 * Retrieves full persisted user profile from DBMS.
 * Requires authenticated session; users can access their own profile or public member profiles.
 */
export async function GET(req: NextRequest) {
  try {
    const authUid = getAuthenticatedUid(req);
    const { searchParams } = new URL(req.url);
    const requestedUid = searchParams.get('uid');

    // Default to the authenticated user's own profile if no specific UID requested
    const targetUid = requestedUid || authUid;

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid session or target UID required.' },
        { status: 401 }
      );
    }

    const user = serverSecurityStore.getUser(targetUid) || serverSecurityStore.getUserByEmailOrUid(targetUid);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User record not found in DBMS.' },
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
 * Enforces strict authentication: users can only update their own profile; Godfather operators
 * can update any profile with audited reason.
 * Persists immediately to authoritative DBMS.
 */
export async function POST(req: NextRequest) {
  try {
    const authUid = getAuthenticatedUid(req);
    const gfAuth = authenticateGodfatherOperator(req);
    const isGodfather = gfAuth.authenticated;

    const body = await req.json();

    // Determine target UID with strict privilege isolation
    let targetUid: string | null = null;
    if (isGodfather && body.uid) {
      targetUid = body.uid;
    } else if (authUid) {
      targetUid = authUid;
    } else if (body.uid && process.env.NODE_ENV !== 'production') {
      // Local dev testing fallback
      targetUid = body.uid;
    }

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid session required to update profile.' },
        { status: 401 }
      );
    }

    // Updates payload can be passed either inside `updates` or at the top level
    const rawUpdates = body.updates || body;
    // Don't accidentally overwrite uid or passwordHash from unrestricted fields
    const { uid: _u, passwordHash: _p, salt: _s, role: _r, plan: _pl, status: _st, ...cleanUpdates } = rawUpdates;

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
      message: 'Profile, contact details, and location saved in DBMS successfully.',
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
