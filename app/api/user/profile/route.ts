import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';
import { getUserByIdentifier, updateUser, deleteUser } from '@/lib/db/users';
import { DEFAULT_PRIVACY_SETTINGS, UserPrivacySettings } from '@/lib/types';
import { maskEmail, maskPhone, maskStatutory } from '@/lib/connections';
import { redis } from '@/lib/redis';

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
          postalCode: u.postal_code || u.postalCode || '',
          postal_code: u.postal_code || u.postalCode || '',
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
        postalCode: u.postal_code || u.postalCode || '',
        postal_code: u.postal_code || u.postalCode || '',
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
    const rawBody = await req.json();
    const body = { ...rawBody, ...(rawBody.updates || {}) };
    const callerUid = userAuth.user?.uid || gfAuth.operator?.uid;

    if (!callerUid) {
      return NextResponse.json({ success: false, error: 'Authentication required.' }, { status: 401 });
    }

    // Rate limiting via secondary Redis layer
    const rateLimit = await redis.checkRateLimit({
      action: 'profile_mutation',
      identifier: callerUid,
      limit: 60,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many profile update requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    // Strict identity enforcement: non-operators can ONLY modify their own authenticated record
    const targetUid = gfAuth.authenticated
      ? (body.uid || body.id || body.email || callerUid)
      : callerUid;

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
    if (body.postalCode !== undefined || body.postal_code !== undefined || body.pincode !== undefined) {
      const postal = body.postalCode || body.postal_code || body.pincode;
      dbUpdates.postal_code = postal ? String(postal).trim() : null;
    }
    if (body.avatarUrl !== undefined || body.avatar_url !== undefined) {
      dbUpdates.avatar_url = body.avatarUrl || body.avatar_url;
    }
    if (body.companyLogoUrl !== undefined || body.company_logo_url !== undefined) {
      dbUpdates.company_logo_url = body.companyLogoUrl || body.company_logo_url;
    }
    if (body.privacySettings !== undefined || body.privacy_settings !== undefined) {
      dbUpdates.privacy_settings = body.privacySettings || body.privacy_settings;
    }

    // Credentials & Structured Profile Data
    if (body.experiences !== undefined) dbUpdates.experiences = body.experiences;
    if (body.educations !== undefined) dbUpdates.educations = body.educations;
    if (body.certifications !== undefined) dbUpdates.certifications = body.certifications;

    // Contact Preferences & Communication
    if (body.isdCode !== undefined || body.isd_code !== undefined) {
      dbUpdates.isd_code = body.isdCode || body.isd_code;
    }
    if (body.whatsappSameAsMobile !== undefined || body.whatsapp_same_as_mobile !== undefined) {
      dbUpdates.whatsapp_same_as_mobile = body.whatsappSameAsMobile ?? body.whatsapp_same_as_mobile;
    }
    if (body.preferredContactMethod !== undefined || body.preferred_contact_method !== undefined) {
      dbUpdates.preferred_contact_method = body.preferredContactMethod || body.preferred_contact_method;
    }
    if (body.contactAvailability !== undefined || body.contact_availability !== undefined) {
      dbUpdates.contact_availability = body.contactAvailability || body.contact_availability;
    }
    if (body.department !== undefined) dbUpdates.department = body.department;
    if (body.summary !== undefined) dbUpdates.summary = body.summary;
    if (body.bio !== undefined) dbUpdates.bio = body.bio;

    // Statutory KYC Filings & Multi-Jurisdiction Records
    if (body.gstn !== undefined) dbUpdates.gstn = body.gstn;
    if (body.pan !== undefined) dbUpdates.pan = body.pan;
    if (body.cin !== undefined) dbUpdates.cin = body.cin;
    if (body.iec !== undefined) dbUpdates.iec = body.iec;
    if (body.mto !== undefined) dbUpdates.mto = body.mto;
    if (body.kycCountry !== undefined || body.kyc_country !== undefined) {
      dbUpdates.kyc_country = body.kycCountry || body.kyc_country;
    }
    if (body.taxId !== undefined || body.tax_id !== undefined) {
      dbUpdates.tax_id = body.taxId || body.tax_id;
    }
    if (body.taxIdLabel !== undefined || body.tax_id_label !== undefined) {
      dbUpdates.tax_id_label = body.taxIdLabel || body.tax_id_label;
    }
    if (body.corporateRegNumber !== undefined || body.corporate_reg_number !== undefined) {
      dbUpdates.corporate_reg_number = body.corporateRegNumber || body.corporate_reg_number;
    }
    if (body.corporateRegLabel !== undefined || body.corporate_reg_label !== undefined) {
      dbUpdates.corporate_reg_label = body.corporateRegLabel || body.corporate_reg_label;
    }
    if (body.tradeCustomsCode !== undefined || body.trade_customs_code !== undefined) {
      dbUpdates.trade_customs_code = body.tradeCustomsCode || body.trade_customs_code;
    }
    if (body.tradeCustomsLabel !== undefined || body.trade_customs_label !== undefined) {
      dbUpdates.trade_customs_label = body.tradeCustomsLabel || body.trade_customs_label;
    }
    if (body.logisticsLicenseNumber !== undefined || body.logistics_license_number !== undefined) {
      dbUpdates.logistics_license_number = body.logisticsLicenseNumber || body.logistics_license_number;
    }
    if (body.logisticsLicenseLabel !== undefined || body.logistics_license_label !== undefined) {
      dbUpdates.logistics_license_label = body.logisticsLicenseLabel || body.logistics_license_label;
    }
    if (body.statutoryCountry !== undefined || body.statutory_country !== undefined) {
      dbUpdates.statutory_country = body.statutoryCountry || body.statutory_country;
    }
    if (body.iataCode !== undefined || body.iata_code !== undefined) {
      dbUpdates.iata_code = body.iataCode || body.iata_code;
    }
    if (body.fiataReg !== undefined || body.fiata_reg !== undefined) {
      dbUpdates.fiata_reg = body.fiataReg || body.fiata_reg;
    }
    if (body.fmcNumber !== undefined || body.fmc_number !== undefined) {
      dbUpdates.fmc_number = body.fmcNumber || body.fmc_number;
    }
    if (body.aeoTier !== undefined || body.aeo_tier !== undefined) {
      dbUpdates.aeo_tier = body.aeoTier || body.aeo_tier;
    }
    if (body.associationName !== undefined || body.association_name !== undefined) {
      dbUpdates.association_name = body.associationName || body.association_name;
    }
    if (body.associationId !== undefined || body.association_id !== undefined) {
      dbUpdates.association_id = body.associationId || body.association_id;
    }
    if (body.kycStatus !== undefined || body.kyc_status !== undefined) {
      dbUpdates.kyc_status = body.kycStatus || body.kyc_status;
    }

    // Authoritative update in Supabase PostgreSQL
    const updatedUser = await updateUser(targetUid, dbUpdates);

    // Invalidate Redis secondary caches
    await redis.invalidateCache('profile', targetUid).catch(() => {});
    if (updatedUser.email) await redis.invalidateCache('profile', updatedUser.email.toLowerCase()).catch(() => {});
    if (updatedUser.uid) await redis.invalidateCache('profile', updatedUser.uid).catch(() => {});

    // Audit trail for sensitive profile/KYC/privacy changes (without leaking raw secret values)
    const sensitiveFields = ['gstn', 'pan', 'cin', 'iec', 'mto', 'privacy_settings', 'kyc_status', 'tax_id'];
    const changedSensitives = Object.keys(dbUpdates).filter((k) => sensitiveFields.includes(k));
    if (changedSensitives.length > 0) {
      try {
        const { getDbClient } = await import('@/lib/supabase/server');
        const db = getDbClient();
        await db.from('audit_logs').insert({
          action: 'PROFILE_SENSITIVE_UPDATE',
          target_entity: 'profile',
          target_id: updatedUser.id,
          actor_uid: userAuth.user?.uid && /^[0-9a-f-]{36}$/i.test(userAuth.user.uid) ? userAuth.user.uid : null,
          user_id: callerUid,
          metadata: {
            updated_fields: changedSensitives,
          },
        });
      } catch {}
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated and persisted successfully in PostgreSQL.',
      user: {
        uid: updatedUser.uid || updatedUser.id,
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.display_name,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        designation: updatedUser.designation,
        company: updatedUser.company_name,
        companyId: updatedUser.company_id,
        department: updatedUser.department,
        mobile: updatedUser.mobile,
        phone: updatedUser.phone,
        isdCode: updatedUser.isd_code || '+91',
        whatsappSameAsMobile: updatedUser.whatsapp_same_as_mobile ?? true,
        city: updatedUser.city,
        state: updatedUser.state,
        country: updatedUser.country,
        postalCode: updatedUser.postal_code || '',
        postal_code: updatedUser.postal_code || '',
        location: updatedUser.location,
        formattedAddress: updatedUser.formatted_address,
        address: updatedUser.address,
        timezone: updatedUser.timezone || 'Asia/Kolkata',
        avatarUrl: updatedUser.avatar_url,
        companyLogoUrl: updatedUser.company_logo_url,
        role: updatedUser.role,
        status: updatedUser.status,
        plan: updatedUser.plan,
        hasGoldenTick: updatedUser.has_golden_tick || false,
        isVerified: updatedUser.is_verified || false,
        email_verified: updatedUser.email_verified || false,
        experiences: updatedUser.experiences || [],
        educations: updatedUser.educations || [],
        certifications: updatedUser.certifications || [],
        privacySettings: updatedUser.privacy_settings || {},
        gstn: updatedUser.gstn,
        pan: updatedUser.pan,
        cin: updatedUser.cin,
        iec: updatedUser.iec,
        mto: updatedUser.mto,
        kycCountry: updatedUser.kyc_country,
        taxId: updatedUser.tax_id,
        corporateRegNumber: updatedUser.corporate_reg_number,
        tradeCustomsCode: updatedUser.trade_customs_code,
        logisticsLicenseNumber: updatedUser.logistics_license_number,
        statutoryCountry: updatedUser.statutory_country,
        kycStatus: updatedUser.kyc_status,
        summary: updatedUser.summary,
        bio: updatedUser.bio,
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
