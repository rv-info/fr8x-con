import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';
import { DEFAULT_PRIVACY_SETTINGS, UserPrivacySettings } from '@/lib/types';
import { maskEmail, maskPhone, maskStatutory } from '@/lib/connections';

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

    // Non-owner / public view sanitization with Privacy Settings enforcement (SEC-03)
    if (!isSelf && !isOperator) {
      const isConnected = Boolean(callerUid && Array.isArray(u.contacts) && u.contacts.includes(callerUid));
      const privacy: UserPrivacySettings = {
        ...DEFAULT_PRIVACY_SETTINGS,
        ...(u.privacySettings || {}),
      };

      // Email privacy resolution
      let resolvedEmail: string | undefined;
      if (privacy.emailVisibility === 'public' || (privacy.emailVisibility === 'contacts_only' && isConnected)) {
        resolvedEmail = user.email;
      } else if (user.email) {
        resolvedEmail = maskEmail(user.email);
      }

      // Phone privacy resolution
      let resolvedPhone: string | undefined;
      const rawPhone = u.mobile || u.phone;
      if (privacy.phoneVisibility === 'public' || (privacy.phoneVisibility === 'contacts_only' && isConnected)) {
        resolvedPhone = rawPhone;
      } else if (rawPhone) {
        resolvedPhone = maskPhone(rawPhone);
      }

      // Statutory / KYC numbers (GSTN, PAN, CIN, IEC)
      let resolvedGstn: string | undefined;
      let resolvedPan: string | undefined;
      let resolvedCin: string | undefined;
      let resolvedIec: string | undefined;
      if (privacy.statutoryVisibility === 'public' || (privacy.statutoryVisibility === 'contacts_only' && isConnected)) {
        resolvedGstn = u.gstn;
        resolvedPan = u.pan;
        resolvedCin = u.cin;
        resolvedIec = u.iec;
      } else {
        if (u.gstn) resolvedGstn = maskStatutory(u.gstn);
        if (u.pan) resolvedPan = maskStatutory(u.pan);
        if (u.cin) resolvedCin = maskStatutory(u.cin);
        if (u.iec) resolvedIec = maskStatutory(u.iec);
      }

      // Company and bio visibility
      const companyVisible = privacy.companyVisibility !== 'private';
      const tradeLanesVisible = privacy.tradeLanesVisibility !== 'private';
      const bioVisible = privacy.bioVisibility !== 'private';

      return NextResponse.json({
        success: true,
        user: {
          uid: user.uid,
          id: user.uid,
          displayName: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Enterprise Member',
          firstName: u.firstName,
          lastName: u.lastName,
          email: resolvedEmail,
          mobile: resolvedPhone,
          phone: resolvedPhone,
          gstn: resolvedGstn,
          pan: resolvedPan,
          cin: resolvedCin,
          iec: resolvedIec,
          company: companyVisible ? u.company : undefined,
          companyId: companyVisible ? u.companyId : undefined,
          designation: bioVisible ? u.designation : undefined,
          bio: bioVisible ? u.bio : undefined,
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
          isConnected,
          allowConnectionRequests: privacy.allowConnectionRequests,
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
    } else if (body.uid) {
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
