import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';
import { getPersistedUsers, savePersistedUser, DbmsUserRecord } from '@/lib/dbms/server-dbms';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * Maps raw DBMS or security store record to authoritative Godfather UserProfile.
 */
function mapToGodfatherUserProfile(u: any): UserProfile {
  const email = (u.email || '').trim().toLowerCase();
  const displayName =
    u.displayName ||
    `${u.firstName || ''} ${u.lastName || ''}`.trim() ||
    (email === 'rajat.rai@cogoport.com' ? 'Rajat RAI' : email === 'mgt@raivega.in' ? 'Management RAIVEGA' : email);

  const isCogoport = email === 'rajat.rai@cogoport.com' || u.uid === 'u-rajat';
  const isRaivega = email === 'mgt@raivega.in' || u.uid === 'usr_raivega_mgt' || u.uid === 'user_mgt_raivega_2026';

  let company = u.company;
  let companyId = u.companyId;

  if (isCogoport) {
    company = 'COGOPORT';
    companyId = 'CMP-COGOPORT-001';
  } else if (isRaivega) {
    company = 'RAIVEGA';
    companyId = 'CMP-RAIVEGA-01';
  }

  const role = u.role || (isCogoport || isRaivega ? 'company_admin' : 'freight_forwarder');
  const isVerified = Boolean(u.isVerified || u.email_verified || u.emailVerified || isCogoport || isRaivega);
  const hasGoldenTick = Boolean(u.hasGoldenTick || isRaivega);
  const plan = u.plan || (isRaivega ? 'premium' : isCogoport ? 'professional' : 'trial');

  const mobile = u.mobile || u.phone || '';
  const designation = u.designation || '';

  const city = u.city || 'Mumbai';
  const state = u.state || 'Maharashtra';
  const country = u.country || 'India';
  const location = u.location || `${city}, ${state}, ${country}`;

  return {
    uid: u.uid || (isCogoport ? 'u-rajat' : isRaivega ? 'usr_raivega_mgt' : `usr_${Date.now()}`),
    email,
    firstName: u.firstName || displayName.split(' ')[0] || '',
    lastName: u.lastName || displayName.split(' ').slice(1).join(' ') || '',
    displayName,
    designation,
    company: company || 'Enterprise Logistics',
    companyId: companyId || '',
    city,
    state,
    country,
    location,
    address: u.address || u.formattedAddress || `${city}, ${country}`,
    formattedAddress: u.formattedAddress || u.address || `${city}, ${country}`,
    timezone: u.timezone || 'Asia/Kolkata',
    mobile,
    phone: mobile,
    isdCode: u.isdCode || '+91',
    whatsappSameAsMobile: u.whatsappSameAsMobile ?? true,
    preferredContactMethod: u.preferredContactMethod || 'email',
    contactAvailability: u.contactAvailability || 'Mon-Fri 09:00 - 18:00 IST',
    plan,
    hasGoldenTick,
    isVerified,
    email_verified: isVerified,
    role,
    status: u.status || 'active',
    isPlanExpired: Boolean(u.isPlanExpired),
    experiences: Array.isArray(u.experiences) ? u.experiences : [],
    educations: Array.isArray(u.educations) ? u.educations : [],
    certifications: Array.isArray(u.certifications) ? u.certifications : [],
    gstn: u.gstn || (isCogoport ? '27AAACC1234F1Z5' : isRaivega ? '27AABCR9876Q1Z2' : undefined),
    pan: u.pan || (isCogoport ? 'AAACC1234F' : isRaivega ? 'AABCR9876Q' : undefined),
    createdAt: u.createdAt || new Date().toISOString(),
    updatedAt: u.updatedAt || new Date().toISOString(),
  };
}

/**
 * GET /api/godfather/users
 * Privileged endpoint providing Godfather Super Admin complete access to all user profiles,
 * including Cogoport, Raivega, enterprise admins, and forwarders with full contact info and KYC data.
 */
export async function GET(req: NextRequest) {
  const { authenticated, errorResponse } = authenticateGodfatherOperator(req);
  if (!authenticated) return errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const roleFilter = (searchParams.get('role') || '').trim().toLowerCase();
    const companyFilter = (searchParams.get('company') || '').trim().toLowerCase();
    const statusFilter = (searchParams.get('status') || '').trim().toLowerCase();

    // 1. Gather all users from DBMS and serverSecurityStore
    const dbmsUsers = getPersistedUsers();
    const storeUsers = serverSecurityStore.getAllRegisteredUsers();

    const userMap = new Map<string, any>();

    // Seed foundation accounts if somehow absent
    const foundationUsers = [
      {
        uid: 'u-rajat',
        email: 'rajat.rai@cogoport.com',
        displayName: 'Rajat RAI',
        firstName: 'Rajat',
        lastName: 'RAI',
        company: 'COGOPORT',
        companyId: 'CMP-COGOPORT-001',
        designation: 'Senior Freight Procurement Manager',
        mobile: '+91 9620012345',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        role: 'company_admin',
        status: 'active',
        isVerified: true,
        email_verified: true,
        plan: 'professional',
        hasGoldenTick: false,
        gstn: '27AAACC1234F1Z5',
        pan: 'AAACC1234F',
        createdAt: '2026-09-12T15:37:00.000Z',
      },
      {
        uid: 'usr_raivega_mgt',
        email: 'mgt@raivega.in',
        displayName: 'Management RAIVEGA',
        firstName: 'Management',
        lastName: 'RAIVEGA',
        company: 'RAIVEGA',
        companyId: 'CMP-RAIVEGA-01',
        designation: 'General Manager & Forwarding Controller',
        mobile: '+91 98200 99999',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        role: 'company_admin',
        status: 'active',
        isVerified: true,
        email_verified: true,
        plan: 'premium',
        hasGoldenTick: true,
        gstn: '27AABCR9876Q1Z2',
        pan: 'AABCR9876Q',
        createdAt: '2026-09-15T10:00:00.000Z',
      },
    ];

    for (const u of foundationUsers) {
      userMap.set(u.email.toLowerCase(), u);
      userMap.set(u.uid.toLowerCase(), u);
    }

    for (const u of storeUsers) {
      if (u.email) userMap.set(u.email.toLowerCase(), { ...userMap.get(u.email.toLowerCase()), ...u });
      if (u.uid) userMap.set(u.uid.toLowerCase(), { ...userMap.get(u.uid.toLowerCase()), ...u });
    }

    for (const u of dbmsUsers) {
      if (u.email) userMap.set(u.email.toLowerCase(), { ...userMap.get(u.email.toLowerCase()), ...u });
      if (u.uid) userMap.set(u.uid.toLowerCase(), { ...userMap.get(u.uid.toLowerCase()), ...u });
    }

    // Deduplicate unique profiles
    const uniqueMap = new Map<string, UserProfile>();
    for (const val of userMap.values()) {
      const mapped = mapToGodfatherUserProfile(val);
      const primaryKey = mapped.email ? mapped.email.toLowerCase() : mapped.uid.toLowerCase();
      if (!uniqueMap.has(primaryKey)) {
        uniqueMap.set(primaryKey, mapped);
      }
    }

    let users = Array.from(uniqueMap.values());

    // Apply filters
    if (q) {
      users = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.company.toLowerCase().includes(q) ||
          (u.designation && u.designation.toLowerCase().includes(q)) ||
          (u.mobile && u.mobile.includes(q)) ||
          (u.gstn && u.gstn.toLowerCase().includes(q))
      );
    }

    if (roleFilter && roleFilter !== 'all') {
      users = users.filter((u) => u.role.toLowerCase() === roleFilter);
    }

    if (companyFilter && companyFilter !== 'all') {
      users = users.filter((u) => u.company.toLowerCase().includes(companyFilter));
    }

    if (statusFilter && statusFilter !== 'all') {
      users = users.filter((u) => u.status?.toLowerCase() === statusFilter);
    }

    return NextResponse.json({
      success: true,
      users,
      total: users.length,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * PUT /api/godfather/users
 * Allows Godfather Super Admin to update user profile, verification status, plan tier, or account status.
 */
export async function PUT(req: NextRequest) {
  const { authenticated, errorResponse } = authenticateGodfatherOperator(req);
  if (!authenticated) return errorResponse!;

  try {
    const body = await req.json();
    const { uid, email, isVerified, hasGoldenTick, status, plan, designation, mobile, company } = body;

    const identifier = uid || email;
    if (!identifier) {
      return NextResponse.json({ success: false, error: 'User UID or email required.' }, { status: 400 });
    }

    const updated = serverSecurityStore.updateUserProfile(identifier, {
      isVerified,
      hasGoldenTick,
      status,
      plan,
      designation,
      mobile,
      company,
    });

    if (!updated || !updated.success || !updated.user) {
      return NextResponse.json({ success: false, error: updated?.error || 'User account not found.' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: `User ${updated.user.displayName || identifier} updated successfully by Godfather.`,
      user: mapToGodfatherUserProfile(updated.user),
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
