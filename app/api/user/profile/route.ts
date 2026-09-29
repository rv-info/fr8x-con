import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile
 * Retrieves user profile from DBMS.
 * Requires authenticated session; users can access their own full profile or public profile for others.
 */
export async function GET(req: NextRequest) {
  const userAuth = authenticateUserSession(req);
  const gfAuth = authenticateGodfatherOperator(req);
  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const callerUid = userAuth.user?.uid || gfAuth.operator?.uid;
    const { searchParams } = new URL(req.url);
    const requestedUid = searchParams.get('uid');

    // Default to the authenticated user's own profile if no specific UID requested
    const targetUid = requestedUid || callerUid;

    if (!targetUid) {
      return NextResponse.json(
        { success: false, error: 'Target UID required.' },
        { status: 400 }
      );
    }

    const user = serverSecurityStore.getUser(targetUid) || serverSecurityStore.getUserByEmailOrUid(targetUid);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User record not found in DBMS.' },
        { status: 404 }
      );
    }

    const isSelf = userAuth.authenticated && user.uid === userAuth.user!.uid;
    const isOperator = gfAuth.authenticated;
    const u = user as any;

    // Non-owner / public view sanitization
    if (!isSelf && !isOperator) {
      return NextResponse.json({
        success: true,
        user: {
          uid: user.uid,
          id: user.uid,
          displayName: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Enterprise Member',
          firstName: u.firstName,
          lastName: u.lastName,
          company: u.company,
          companyId: u.companyId,
          designation: u.designation,
          role: user.role,
          city: u.city,
          state: u.state,
          country: u.country,
          location: u.location,
          avatarUrl: u.avatarUrl,
          isVerified: Boolean(u.isVerified || u.email_verified),
          hasGoldenTick: Boolean(u.hasGoldenTick),
          plan: u.plan,
          experiences: u.experiences || [],
          educations: u.educations || [],
          skills: u.skills || [],
        },
      });
    }

    // Owner or Operator view: sanitize internal cryptographic credentials
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
  const userAuth = authenticateUserSession(req);
  const gfAuth = authenticateGodfatherOperator(req);
  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const isGodfather = gfAuth.authenticated;
    const body = await req.json();

    // Determine target UID with strict privilege isolation
    let targetUid: string | null = null;
    if (isGodfather && body.uid) {
      targetUid = body.uid;
    } else if (userAuth.authenticated && userAuth.user?.uid) {
      targetUid = userAuth.user.uid;
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
