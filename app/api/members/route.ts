import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { authenticateUserSession } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // ── Authentication guard ────────────────────────────────────────────────
  const { authenticated, user, errorResponse } = authenticateUserSession(req);
  if (!authenticated || !user) return errorResponse!;
  // ───────────────────────────────────────────────────────────────────────

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const roleFilter = (searchParams.get('role') || '').trim().toLowerCase();
    const statusFilter = (searchParams.get('status') || '').trim().toLowerCase();
    const limit = Math.min(Number(searchParams.get('limit') || 100), 200);

    const allRecords = serverSecurityStore.getAllRegisteredUsers();
    const callerUid = user.uid;

    // Map to sanitized public profiles — strip PII except for the caller's own record
    const sanitized = allRecords.map((uRaw) => {
      const u = uRaw as any;
      const displayName = u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;
      const role = u.role || 'freight_forwarder';
      const isVerified = Boolean(u.isEmailVerified || u.email_verified || u.isVerified);
      const hasGoldenTick = Boolean(u.hasGoldenTick || u.plan === 'premium');
      const isSelf = u.uid === callerUid;

      return {
        uid: u.uid,
        id: u.uid,
        // Email only visible on own record to prevent harvesting
        email: isSelf ? u.email : undefined,
        displayName,
        firstName: u.firstName || displayName.split(' ')[0] || '',
        lastName: u.lastName || displayName.split(' ').slice(1).join(' ') || '',
        company: u.company || 'Enterprise Logistics Member',
        companyId: u.companyId || '',
        designation: u.designation || 'Trade Specialist',
        role,
        city: u.city || 'Mumbai',
        state: u.state || 'Maharashtra',
        country: u.country || 'India',
        location: `${u.city || 'Mumbai'}, ${u.country || 'India'}`,
        formattedAddress: u.formattedAddress || '',
        timezone: u.timezone || 'Asia/Kolkata',
        isVerified,
        hasGoldenTick,
        plan: u.plan || 'trial',
        // PII fields — only expose to the record owner
        gstn: isSelf ? (u.gstn || '') : undefined,
        pan: isSelf ? (u.pan || '') : undefined,
        mobile: isSelf ? (u.mobile || '') : undefined,
        operatingCorridors: u.operatingCorridors || 'Nhava Sheva ⇄ Jebel Ali, Rotterdam',
        avatarUrl: u.avatarUrl || null,
        companyLogoUrl: u.companyLogoUrl || null,
        experiences: u.experiences || [],
        educations: u.educations || [],
        certifications: u.certifications || [],
        contacts: u.contacts || [],
        isOnline: true,
        createdAt: u.createdAt || new Date().toISOString(),
      };
    });

    // Apply filtering
    let results = sanitized;

    if (q) {
      results = results.filter((m) => {
        const matchesBasic =
          Boolean(m.displayName?.toLowerCase().includes(q)) ||
          Boolean(m.email && m.email.toLowerCase().includes(q)) ||
          Boolean(m.company?.toLowerCase().includes(q)) ||
          Boolean(m.designation?.toLowerCase().includes(q)) ||
          Boolean(m.city?.toLowerCase().includes(q)) ||
          Boolean(m.state?.toLowerCase().includes(q)) ||
          Boolean(m.country?.toLowerCase().includes(q)) ||
          Boolean(m.gstn && m.gstn.toLowerCase().includes(q)) ||
          Boolean(m.operatingCorridors && m.operatingCorridors.toLowerCase().includes(q));

        const matchesExp = (m.experiences as any[]).some(
          (exp) =>
            Boolean(exp?.company?.toLowerCase().includes(q)) ||
            Boolean(exp?.designation?.toLowerCase().includes(q)) ||
            Boolean(exp?.skills?.toLowerCase().includes(q))
        );

        const matchesEdu = (m.educations as any[]).some(
          (edu) =>
            Boolean(edu?.institution?.toLowerCase().includes(q)) ||
            Boolean(edu?.qualification?.toLowerCase().includes(q)) ||
            Boolean(edu?.fieldOfStudy?.toLowerCase().includes(q))
        );

        const matchesCert = (m.certifications as any[]).some(
          (cert) =>
            Boolean(cert?.title?.toLowerCase().includes(q)) ||
            Boolean(cert?.issuingAuthority?.toLowerCase().includes(q))
        );

        return matchesBasic || matchesExp || matchesEdu || matchesCert;
      });
    }

    if (roleFilter) {
      if (roleFilter === 'forwarder_nvocc' || roleFilter === 'bidder') {
        results = results.filter((m) =>
          ['freight_forwarder', 'nvocc', 'forwarder', 'company_admin', 'operator'].includes(m.role.toLowerCase())
        );
      } else {
        results = results.filter((m) => m.role.toLowerCase().includes(roleFilter));
      }
    }

    if (statusFilter) {
      if (statusFilter === 'verified') {
        results = results.filter((m) => m.isVerified);
      } else if (statusFilter === 'active') {
        results = results.filter((m) => m.isVerified || m.plan === 'premium' || m.plan === 'professional' || m.plan === 'trial');
      } else if (statusFilter === 'gold') {
        results = results.filter((m) => m.hasGoldenTick);
      }
    }

    return NextResponse.json({
      success: true,
      total: results.length,
      members: results.slice(0, limit),
    });
  } catch (err: any) {
    console.error('[API/Members] Error fetching members:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve registered members' },
      { status: 500 }
    );
  }
}
