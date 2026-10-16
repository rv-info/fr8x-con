import { NextRequest, NextResponse } from 'next/server';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { authenticateUserSession } from '@/lib/auth-guard';
import { createClient as createSupabaseServerClient, getDbClient } from '@/lib/supabase/server';
import { peopleDirectoryStore } from '@/lib/people-directory';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // ── Authentication guard: supports fr8x_session HMAC OR Supabase Auth session
  const { authenticated, user, errorResponse } = authenticateUserSession(req);
  if (!authenticated || !user) return errorResponse!;
  // ──────────────────────────────────────────────────────────────────────────

  try {
    const { searchParams } = new URL(req.url);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const roleFilter = (searchParams.get('role') || '').trim().toLowerCase();
    const statusFilter = (searchParams.get('status') || '').trim().toLowerCase();
    const limit = Math.min(Number(searchParams.get('limit') || 100), 200);

    const callerUid = user.uid;
    const seenUids = new Set<string>();
    const seenEmails = new Set<string>();
    const allRecords: any[] = [];

    // 1. Authoritative: Fetch profiles from Supabase PostgreSQL
    try {
      const userToken = user.token || req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();
      const supabase = getDbClient(userToken);
      const { data: dbRows, error: dbError } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, last_name, designation, position, company_name, company_id, department, city, state, country, postal_code, formatted_address, location, timezone, avatar_url, company_logo_url, role, plan, experiences, educations, certifications, contacts, is_verified, email_verified, has_golden_tick, gstn, pan, mobile, email, status');

      if (!dbError && Array.isArray(dbRows)) {
        for (const row of dbRows) {
          if (!row.id) continue;
          const uidKey = row.id.toLowerCase();
          const emailKey = (row.email || '').trim().toLowerCase();
          if (seenUids.has(uidKey)) continue;
          if (emailKey && seenEmails.has(emailKey)) continue;

          seenUids.add(uidKey);
          if (emailKey) seenEmails.add(emailKey);

          allRecords.push({
            uid: row.id,
            id: row.id,
            email: row.email,
            displayName: row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email,
            firstName: row.first_name || (row.display_name ? row.display_name.split(' ')[0] : ''),
            lastName: row.last_name || (row.display_name ? row.display_name.split(' ').slice(1).join(' ') : ''),
            company: row.company_name || 'Enterprise Logistics Member',
            companyId: row.company_id || '',
            designation: row.designation || row.position || 'Trade Specialist',
            role: row.role || 'freight_forwarder',
            city: row.city || 'Mumbai',
            state: row.state || 'Maharashtra',
            country: row.country || 'India',
            location: `${row.city || 'Mumbai'}, ${row.country || 'India'}`,
            formattedAddress: row.formatted_address || '',
            timezone: row.timezone || 'Asia/Kolkata',
            isVerified: Boolean(row.is_verified || row.email_verified),
            hasGoldenTick: Boolean(row.has_golden_tick || row.plan === 'premium'),
            plan: row.plan || 'trial',
            gstn: row.gstn,
            pan: row.pan,
            mobile: row.mobile,
            avatarUrl: row.avatar_url || null,
            companyLogoUrl: row.company_logo_url || null,
            experiences: Array.isArray(row.experiences) ? row.experiences : [],
            educations: Array.isArray(row.educations) ? row.educations : [],
            certifications: Array.isArray(row.certifications) ? row.certifications : [],
            contacts: Array.isArray(row.contacts) ? row.contacts : [],
            isOnline: true,
          });
        }
      }
    } catch (dbErr) {
      console.warn('[API/Members] Note: PostgreSQL profiles query deferred, using store fallback:', dbErr);
    }

    // 2. Secondary: Merge dynamically registered in-memory accounts (for active sessions / unit tests)
    // Strictly deduplicated by stable UID and email to prevent duplicate cards
    try {
      const serverUsers = serverSecurityStore.getAllRegisteredUsers();
      for (const u of serverUsers) {
        if (!u.uid) continue;
        const uidKey = u.uid.toLowerCase();
        const emailKey = (u.email || '').trim().toLowerCase();
        if (seenUids.has(uidKey)) continue;
        if (emailKey && seenEmails.has(emailKey)) continue;

        seenUids.add(uidKey);
        if (emailKey) seenEmails.add(emailKey);

        allRecords.push({
          uid: u.uid,
          id: u.uid,
          email: u.email,
          displayName: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          firstName: u.firstName || (u.displayName ? u.displayName.split(' ')[0] : ''),
          lastName: u.lastName || (u.displayName ? u.displayName.split(' ').slice(1).join(' ') : ''),
          company: u.company || 'Enterprise Logistics Member',
          companyId: u.companyId || '',
          designation: u.designation || 'Trade Specialist',
          role: u.role || 'freight_forwarder',
          city: u.city || 'Mumbai',
          state: u.state || 'Maharashtra',
          country: u.country || 'India',
          location: `${u.city || 'Mumbai'}, ${u.country || 'India'}`,
          formattedAddress: u.formattedAddress || '',
          timezone: u.timezone || 'Asia/Kolkata',
          isVerified: Boolean(u.isVerified || u.email_verified),
          hasGoldenTick: Boolean((u as any).hasGoldenTick || u.plan === 'premium'),
          plan: u.plan || 'trial',
          gstn: u.gstn,
          pan: u.pan,
          mobile: u.mobile,
          avatarUrl: u.avatarUrl || null,
          companyLogoUrl: u.companyLogoUrl || null,
          experiences: Array.isArray(u.experiences) ? u.experiences : [],
          educations: Array.isArray(u.educations) ? u.educations : [],
          certifications: Array.isArray(u.certifications) ? u.certifications : [],
          contacts: Array.isArray(u.contacts) ? u.contacts : [],
          isOnline: true,
        });
      }
    } catch {}

    // Note: No fabricated or seeded directory records are ever injected in production.
    // Every displayed record must come from verified, authorized database records or legitimately registered accounts.

    // 4. Map to sanitized public profiles — strip PII except for the caller's own record
    const sanitized = allRecords.map((u) => {
      const isSelf = u.uid === callerUid;
      return {
        uid: u.uid,
        id: u.uid,
        email: isSelf ? u.email : undefined,
        displayName: u.displayName,
        firstName: u.firstName,
        lastName: u.lastName,
        company: u.company,
        companyId: u.companyId,
        designation: u.designation,
        role: u.role,
        city: u.city,
        state: u.state,
        country: u.country,
        location: u.location,
        formattedAddress: u.formattedAddress,
        timezone: u.timezone,
        isVerified: u.isVerified,
        hasGoldenTick: u.hasGoldenTick,
        plan: u.plan,
        gstn: isSelf ? (u.gstn || '') : undefined,
        pan: isSelf ? (u.pan || '') : undefined,
        mobile: isSelf ? (u.mobile || '') : undefined,
        avatarUrl: u.avatarUrl,
        companyLogoUrl: u.companyLogoUrl,
        experiences: u.experiences,
        educations: u.educations,
        certifications: u.certifications,
        contacts: u.contacts,
        isOnline: true,
      };
    });

    // 5. Apply filtering
    let results = sanitized;

    if (q) {
      results = results.filter((m) => {
        const matchesBasic =
          Boolean(m.displayName?.toLowerCase().includes(q)) ||
          Boolean(m.firstName?.toLowerCase().includes(q)) ||
          Boolean(m.lastName?.toLowerCase().includes(q)) ||
          Boolean(m.email && m.email.toLowerCase().includes(q)) ||
          Boolean(m.company?.toLowerCase().includes(q)) ||
          Boolean(m.designation?.toLowerCase().includes(q)) ||
          Boolean(m.city?.toLowerCase().includes(q)) ||
          Boolean(m.state?.toLowerCase().includes(q)) ||
          Boolean(m.country?.toLowerCase().includes(q)) ||
          Boolean(m.location?.toLowerCase().includes(q)) ||
          Boolean(m.gstn && m.gstn.toLowerCase().includes(q));

        const matchesExp = (m.experiences as any[]).some(
          (exp) =>
            Boolean(exp?.company?.toLowerCase().includes(q)) ||
            Boolean(exp?.designation?.toLowerCase().includes(q)) ||
            Boolean(exp?.title?.toLowerCase().includes(q)) ||
            Boolean(
              (Array.isArray(exp?.skills)
                ? exp.skills.join(' ')
                : typeof exp?.skills === 'string'
                  ? exp.skills
                  : ''
              ).toLowerCase().includes(q)
            )
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
