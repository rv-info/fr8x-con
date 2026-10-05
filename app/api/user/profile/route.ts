import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';
import { getUserByIdentifier, updateUser, deleteUser } from '@/lib/db/users';
import { DEFAULT_PRIVACY_SETTINGS, UserPrivacySettings } from '@/lib/types';
import { maskEmail, maskPhone, maskStatutory } from '@/lib/connections';

export const dynamic = 'force-dynamic';

/**
 * GET /api/user/profile
 * Retrieves user profile directly from Supabase PostgreSQL.
 * Requires authenticated session; users can access their own full profile or public profile for others.
 */
export async function GET(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
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

    const requestedEmail = searchParams.get('email') || userAuth.user?.email;
    let user = await getUserByIdentifier(targetUid);
    if (!user && requestedEmail) {
      user = await getUserByIdentifier(requestedEmail.trim().toLowerCase());
    }

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User record not found in PostgreSQL.' },
        { status: 404 }
      );
    }

    const isSelf = userAuth.authenticated && (user.id === userAuth.user!.uid || user.uid === userAuth.user!.uid || user.email === userAuth.user!.email);
    const isOperator = gfAuth.authenticated;
    const u = user as any;

    // Non-owner / public view sanitization with Privacy Settings enforcement (SEC-03)
    if (!isSelf && !isOperator) {
      const isConnected = Boolean(callerUid && Array.isArray(u.contacts) && u.contacts.includes(callerUid));
      const privacy: UserPrivacySettings = {
        ...DEFAULT_PRIVACY_SETTINGS,
        ...(u.privacy_settings || u.privacySettings || {}),
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

      // Statutory GSTN / PAN privacy resolution
      const rawGstn = u.gstn;
      const rawPan = u.pan;
      let resolvedGstn: string | undefined;
      let resolvedPan: string | undefined;

      if (privacy.statutoryVisibility === 'public' || (privacy.statutoryVisibility === 'contacts_only' && isConnected)) {
        resolvedGstn = rawGstn;
        resolvedPan = rawPan;
      } else {
        if (rawGstn) resolvedGstn = maskStatutory(rawGstn);
        if (rawPan) resolvedPan = maskStatutory(rawPan);
      }

      return NextResponse.json({
        success: true,
        user: {
          uid: u.uid || u.id,
          displayName: u.display_name || u.displayName || 'Enterprise Member',
          company: privacy.companyVisibility === 'private' ? 'Confidential Logistics Member' : (u.company_name || u.company),
          companyId: privacy.companyVisibility === 'private' ? undefined : (u.company_id || u.companyId),
          designation: u.designation || 'Freight Logistics Specialist',
          email: resolvedEmail,
          mobile: resolvedPhone,
          phone: resolvedPhone,
          city: u.city,
          state: u.state,
          country: u.country,
          location: [u.city, u.state, u.country].filter(Boolean).join(', ') || u.location,
          formattedAddress: u.formatted_address || u.address,
          status: u.status || 'active',
          role: u.role || 'user',
          plan: u.plan || 'trial',
          hasGoldenTick: u.has_golden_tick || u.hasGoldenTick,
          isVerified: u.is_verified || u.isVerified,
          email_verified: u.email_verified,
          avatarUrl: u.avatar_url,
          experiences: u.experiences || [],
          educations: u.educations || [],
          certifications: u.certifications || [],
          gstn: resolvedGstn,
          pan: resolvedPan,
          isSelf: false,
          isConnected,
          privacySettings: privacy,
        },
      });
    }

    // Full profile returned to the verified account owner or privileged Godfather operator
    return NextResponse.json({
      success: true,
      user: {
        uid: u.uid || u.id,
        id: u.id,
        email: u.email,
        displayName: u.display_name || u.displayName,
        firstName: u.first_name || u.firstName,
        lastName: u.last_name || u.lastName,
        designation: u.designation || '',
        company: u.company_name || u.company,
        companyId: u.company_id || u.companyId,
        mobile: u.mobile || u.phone || '',
        phone: u.phone || u.mobile || '',
        isdCode: u.isd_code || '+91',
        whatsappSameAsMobile: u.whatsapp_same_as_mobile ?? true,
        city: u.city || '',
        state: u.state || '',
        country: u.country || 'India',
        location: u.location || [u.city, u.state, u.country].filter(Boolean).join(', ') || '',
        formattedAddress: u.formatted_address || u.address || '',
        address: u.address || u.formatted_address || '',
        timezone: u.timezone || 'Asia/Kolkata',
        avatarUrl: u.avatar_url,
        companyLogoUrl: u.company_logo_url,
        plan: u.plan || 'trial',
        hasGoldenTick: u.has_golden_tick || false,
        isVerified: u.is_verified || false,
        email_verified: u.email_verified || false,
        role: u.role || 'company_admin',
        status: u.status || 'active',
        gstn: u.gstn,
        pan: u.pan,
        cin: u.cin,
        iec: u.iec,
        mto: u.mto,
        experiences: u.experiences || [],
        educations: u.educations || [],
        certifications: u.certifications || [],
        privacySettings: u.privacy_settings || DEFAULT_PRIVACY_SETTINGS,
        isSelf,
        isOperator,
      },
    });
  } catch (err: any) {
    console.error('[API/User/Profile] GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Profile service error.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/profile
 * Updates user profile directly in Supabase PostgreSQL (Single Source of Truth).
 */
export async function POST(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const body = await req.json();
    const callerUid = userAuth.user?.uid || gfAuth.operator?.uid;
    const bodyUid = body.uid || body.id;
    const bodyEmail = body.email ? body.email.trim().toLowerCase() : undefined;

    const targetUid = bodyUid || bodyEmail || callerUid;

    if (!targetUid) {
      return NextResponse.json({ success: false, error: 'Target identifier required.' }, { status: 400 });
    }

    // Ownership check: regular users may only modify their own profile
    if (!gfAuth.authenticated && userAuth.user) {
      const isOwner =
        targetUid === userAuth.user.uid ||
        (bodyEmail && bodyEmail === userAuth.user.email?.toLowerCase());

      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You cannot modify another user’s profile.' },
          { status: 403 }
        );
      }
    }

    // Clean and normalize incoming fields
    const dbUpdates: any = {};
    if (body.phone !== undefined) {
      dbUpdates.phone = body.phone ? String(body.phone).trim() : null;
      dbUpdates.mobile = dbUpdates.phone;
    }
    if (body.mobile !== undefined) {
      dbUpdates.mobile = body.mobile ? String(body.mobile).trim() : null;
      dbUpdates.phone = dbUpdates.mobile;
    }
    if (body.designation !== undefined) dbUpdates.designation = body.designation ? String(body.designation).trim() : null;
    if (body.displayName !== undefined || body.display_name !== undefined) {
      dbUpdates.display_name = body.displayName || body.display_name;
    }
    if (body.firstName !== undefined || body.first_name !== undefined) {
      dbUpdates.first_name = body.firstName || body.first_name;
    }
    if (body.lastName !== undefined || body.last_name !== undefined) {
      dbUpdates.last_name = body.lastName || body.last_name;
    }
    if (body.company !== undefined || body.company_name !== undefined) {
      dbUpdates.company_name = body.company || body.company_name;
    }
    if (body.city !== undefined) dbUpdates.city = body.city ? String(body.city).trim() : null;
    if (body.state !== undefined) dbUpdates.state = body.state ? String(body.state).trim() : null;
    if (body.country !== undefined) dbUpdates.country = body.country ? String(body.country).trim() : 'India';
    if (body.location !== undefined) {
      dbUpdates.location = body.location ? String(body.location).trim() : null;
    } else if (dbUpdates.city || dbUpdates.state || dbUpdates.country) {
      dbUpdates.location = [dbUpdates.city, dbUpdates.state, dbUpdates.country].filter(Boolean).join(', ');
    }
    if (body.address !== undefined || body.formattedAddress !== undefined) {
      dbUpdates.address = body.address || body.formattedAddress;
      dbUpdates.formatted_address = dbUpdates.address;
    }
    if (body.avatarUrl !== undefined || body.avatar_url !== undefined) {
      dbUpdates.avatar_url = body.avatarUrl || body.avatar_url;
    }
    if (body.privacySettings !== undefined || body.privacy_settings !== undefined) {
      dbUpdates.privacy_settings = body.privacySettings || body.privacy_settings;
    }

    // Authoritative update in Supabase PostgreSQL
    const updatedUser = await updateUser(targetUid, dbUpdates);

    return NextResponse.json({
      success: true,
      message: 'Profile updated and persisted successfully in PostgreSQL.',
      user: {
        uid: updatedUser.uid || updatedUser.id,
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.display_name,
        designation: updatedUser.designation,
        company: updatedUser.company_name,
        mobile: updatedUser.mobile,
        phone: updatedUser.phone,
        city: updatedUser.city,
        state: updatedUser.state,
        country: updatedUser.country,
        location: updatedUser.location,
        formattedAddress: updatedUser.formatted_address,
        address: updatedUser.address,
        role: updatedUser.role,
        status: updatedUser.status,
        plan: updatedUser.plan,
        updatedAt: updatedUser.updated_at,
      },
    });
  } catch (err: any) {
    console.error('[API/User/Profile] POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Profile update error.' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  return POST(req);
}

export async function DELETE(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const body = await req.json().catch(() => ({}));
    const targetUid = (gfAuth.authenticated && (body.uid || searchParams.get('uid')))
      ? (body.uid || searchParams.get('uid'))
      : (userAuth.user?.uid || body.uid || searchParams.get('uid'));

    if (!targetUid) {
      return NextResponse.json({ success: false, error: 'Target UID required.' }, { status: 400 });
    }

    const deleted = await deleteUser(targetUid);
    return NextResponse.json({
      success: deleted,
      message: deleted ? 'User deleted successfully from PostgreSQL' : 'User not found',
    });
  } catch (err: any) {
    console.error('[API/User/Profile] DELETE error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
