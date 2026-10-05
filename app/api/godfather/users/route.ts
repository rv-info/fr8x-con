import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';
import { getAllUsers, updateUser, getUserByIdentifier } from '@/lib/db/users';
import { UserProfile } from '@/lib/types';

export const dynamic = 'force-dynamic';

function mapToGodfatherUserProfile(u: any): UserProfile {
  const email = (u.email || '').trim().toLowerCase();
  const displayName =
    u.display_name ||
    u.displayName ||
    `${u.first_name || u.firstName || ''} ${u.last_name || u.lastName || ''}`.trim() ||
    (email === 'rajat.rai@cogoport.com' ? 'Rajat RAI' : email === 'mgt@raivega.in' ? 'Management RAIVEGA' : email);

  const isCogoport = email === 'rajat.rai@cogoport.com' || u.uid === 'u-rajat';
  const isRaivega = email === 'mgt@raivega.in' || u.uid === 'usr_raivega_mgt' || u.uid === 'user_mgt_raivega_2026';

  let company = u.company_name || u.company;
  let companyId = u.company_id || u.companyId;

  if (isCogoport) {
    company = 'COGOPORT';
    companyId = 'CMP-COGOPORT-001';
  } else if (isRaivega) {
    company = 'RAIVEGA';
    companyId = 'CMP-RAIVEGA-01';
  }

  const role = u.role || (isCogoport || isRaivega ? 'company_admin' : 'freight_forwarder');
  const isVerified = Boolean(u.is_verified || u.email_verified || u.isVerified || isCogoport || isRaivega);
  const hasGoldenTick = Boolean(u.has_golden_tick || u.hasGoldenTick || isRaivega);
  const plan = u.plan || (isRaivega ? 'premium' : isCogoport ? 'professional' : 'trial');

  const mobile = u.mobile || u.phone || '';
  const designation = u.designation || '';

  const city = u.city || 'Mumbai';
  const state = u.state || 'Maharashtra';
  const country = u.country || 'India';
  const location = u.location || `${city}, ${state}, ${country}`;

  return {
    uid: u.uid || u.id || (isCogoport ? 'u-rajat' : isRaivega ? 'usr_raivega_mgt' : `usr_${Date.now()}`),
    email,
    firstName: u.first_name || u.firstName || displayName.split(' ')[0] || '',
    lastName: u.last_name || u.lastName || displayName.split(' ').slice(1).join(' ') || '',
    displayName,
    designation,
    company: company || 'Enterprise Logistics',
    companyId: companyId || '',
    city,
    state,
    country,
    location,
    address: u.address || u.formatted_address || `${city}, ${country}`,
    formattedAddress: u.formatted_address || u.address || `${city}, ${country}`,
    timezone: u.timezone || 'Asia/Kolkata',
    mobile,
    phone: mobile,
    isdCode: u.isd_code || u.isdCode || '+91',
    whatsappSameAsMobile: u.whatsapp_same_as_mobile ?? true,
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
    createdAt: u.created_at || u.createdAt || new Date().toISOString(),
    updatedAt: u.updated_at || u.updatedAt || new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  const { authenticated, errorResponse } = authenticateGodfatherOperator(req);
  if (!authenticated) return errorResponse!;

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const roleFilter = (searchParams.get('role') || '').trim().toLowerCase();
    const companyFilter = (searchParams.get('company') || '').trim().toLowerCase();
    const statusFilter = (searchParams.get('status') || '').trim().toLowerCase();

    // Authoritative PostgreSQL query
    const dbUsers = await getAllUsers();
    let users = dbUsers.map(mapToGodfatherUserProfile);

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
    console.error('[API/godfather/users] GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

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

    const updated = await updateUser(identifier, {
      is_verified: isVerified,
      has_golden_tick: hasGoldenTick,
      status,
      plan,
      designation,
      mobile,
      company_name: company,
    });

    return NextResponse.json({
      success: true,
      message: `User ${updated.display_name || identifier} updated successfully by Godfather.`,
      user: mapToGodfatherUserProfile(updated),
    });
  } catch (error: any) {
    console.error('[API/godfather/users] PUT error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
