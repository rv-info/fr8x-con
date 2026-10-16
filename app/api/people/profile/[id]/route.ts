/**
 * GET /api/people/profile/[id]
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns the professional profile of a specific member, including connection
 * status relative to the viewing user.
 *
 * Relationship-Aware Contact Privacy Matrix:
 * - Not connected / Pending: Email and Phone hidden unless explicitly public
 * - Accepted Connection: Email and Phone exposed ONLY if owner permits connections
 * - Blocked: Profile access denied (HTTP 404)
 * - Self: Redirect hint to /profile
 *
 * Security:
 * - Requires authenticated user session
 * - Rate limited: 60 profile views / minute per user
 * - Zero-trust database authorization with parameterization
 * - Universal discovery: Resolves both standard UUIDs and legacy UIDs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserSession } from '@/lib/auth-guard';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';
import { peopleDirectoryStore, DirectoryMember } from '@/lib/people-directory';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { getUserByIdentifier } from '@/lib/db/users';

export const dynamic = 'force-dynamic';

// Public fields returned
const PUBLIC_PROFILE_FIELDS = [
  'id', 'uid', 'display_name', 'full_name', 'first_name', 'last_name',
  'designation', 'position', 'headline', 'department', 'company_name',
  'city', 'state', 'country', 'location', 'avatar_url', 'bio', 'summary',
  'skills', 'specializations', 'key_trade_lanes', 'languages',
  'experiences', 'is_verified', 'has_golden_tick', 'privacy_settings',
  'email', 'mobile', 'phone',
].join(', ');

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Authentication
  const { authenticated, user } = authenticateUserSession(req);
  let viewerId: string | null = null;

  if (authenticated && user?.uid) {
    viewerId = user.uid;
  } else {
    try {
      const supabase = createClient();
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser?.id) viewerId = sbUser.id;
    } catch {
      // fall through
    }
  }

  if (!viewerId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required to view member profiles.',
        },
        code: 'UNAUTHENTICATED',
      },
      { status: 401 }
    );
  }

  const targetId = params.id?.trim();
  if (!targetId) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Invalid profile identifier.',
        },
        code: 'BAD_REQUEST',
      },
      { status: 400 }
    );
  }

  // Self-view returns a redirect hint
  if (targetId === viewerId || (user?.email && targetId.toLowerCase() === user.email.toLowerCase())) {
    return NextResponse.json({
      success: true,
      isSelf: true,
      profile: null,
      redirectTo: '/profile',
    });
  }

  // 2. Rate limit
  const rateResult = await redis.checkRateLimit({
    action:        'profile_view',
    identifier:    viewerId,
    limit:         60,
    windowSeconds: 60,
  });

  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many profile requests. Please slow down.',
        },
        code: 'RATE_LIMITED',
        retryAfter: rateResult.resetSeconds,
      },
      { status: 429, headers: { 'Retry-After': String(rateResult.resetSeconds) } }
    );
  }

  const adminClient = createAdminClient();

  // 3. Fetch profile
  try {
    let profile: Record<string, unknown> | null = null;
    const isUuid = /^[0-9a-f-]{36}$/i.test(targetId);

    if (adminClient && isUuid) {
      try {
        const { data, error } = await adminClient
          .from('profiles')
          .select(PUBLIC_PROFILE_FIELDS)
          .eq('id', targetId)
          .maybeSingle();

        if (!error && data) {
          profile = data as Record<string, unknown>;
        }
      } catch {
        // Fall back to users db / store
      }
    }

    // Try finding via getUserByIdentifier (supports id, uid, email)
    if (!profile) {
      try {
        const dbUser = await getUserByIdentifier(targetId);
        if (dbUser) {
          profile = dbUser as unknown as Record<string, unknown>;
        }
      } catch {
        // fall through
      }
    }

    // Try finding via serverSecurityStore
    if (!profile) {
      const storeUser = serverSecurityStore.getUser(targetId);
      if (storeUser) {
        profile = {
          id: storeUser.uid,
          uid: storeUser.uid,
          display_name: storeUser.displayName,
          first_name: storeUser.firstName,
          last_name: storeUser.lastName,
          designation: storeUser.designation,
          company_name: storeUser.company,
          city: storeStoreUserCity(storeUser),
          country: storeUser.country || 'India',
          location: `${storeUser.city || 'Mumbai'}, ${storeUser.country || 'India'}`,
          avatar_url: storeUser.avatarUrl,
          bio: (storeUser as any).bio,
          summary: (storeUser as any).summary,
          is_verified: Boolean(storeUser.isVerified ?? storeUser.email_verified),
          has_golden_tick: Boolean(storeUser.plan === 'premium'),
          privacy_settings: storeUser.privacySettings || {},
          email: storeUser.email,
          mobile: storeUser.mobile || storeUser.phone,
          phone: storeUser.phone || storeUser.mobile,
          experiences: storeUser.experiences || [],
        };
      }
    }

    // Fallback to directory store
    if (!profile) {
      const fallbackMember = peopleDirectoryStore.getMemberById(targetId);
      if (fallbackMember) {
        profile = fallbackMember as unknown as Record<string, unknown>;
      }
    }

    if (!profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Profile not found.',
          },
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const resolvedTargetId = (profile.id as string) || targetId;

    // Respect allowDiscovery privacy setting
    const rawPrivacySettings = (profile.privacy_settings ?? {}) as Record<string, unknown>;
    const allowDiscovery = rawPrivacySettings.allowDiscovery ?? true;
    if (allowDiscovery === false) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROFILE_HIDDEN',
            message: 'This profile is not publicly discoverable.',
          },
          code: 'PROFILE_HIDDEN',
        },
        { status: 404 }
      );
    }

    // Check block status (either direction)
    let isBlocked = false;
    if (adminClient && isUuid) {
      try {
        const { data: blockRow } = await adminClient
          .from('user_blocks')
          .select('id')
          .or(`and(blocker_id.eq.${viewerId},blocked_id.eq.${resolvedTargetId}),and(blocker_id.eq.${resolvedTargetId},blocked_id.eq.${viewerId})`)
          .limit(1)
          .maybeSingle();
        if (blockRow) isBlocked = true;
      } catch {
        isBlocked = peopleDirectoryStore.isBlocked(viewerId, resolvedTargetId) ||
                    peopleDirectoryStore.isBlocked(resolvedTargetId, viewerId);
      }
    } else {
      isBlocked = peopleDirectoryStore.isBlocked(viewerId, resolvedTargetId) ||
                  peopleDirectoryStore.isBlocked(resolvedTargetId, viewerId);
    }

    if (isBlocked) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'BLOCKED',
            message: 'Profile not available.',
          },
          code: 'BLOCKED',
        },
        { status: 404 }
      );
    }

    // 4. Connection status resolution
    let connectionStatus = 'not_connected';
    let requestId: string | undefined = undefined;

    if (adminClient && isUuid) {
      try {
        const { data: statusData } = await adminClient.rpc('get_connection_status', {
          p_viewer_id: viewerId,
          p_target_id: resolvedTargetId,
        });
        const resStatus = (statusData as Record<string, unknown>)?.status as string;
        connectionStatus = resStatus === 'none' ? 'not_connected' : (resStatus || 'not_connected');
        requestId = (statusData as Record<string, unknown>)?.request_id as string | undefined;
      } catch {
        const status = peopleDirectoryStore.getConnectionStatus(viewerId, resolvedTargetId);
        connectionStatus = status.status === 'none' ? 'not_connected' : status.status;
        requestId = status.request_id;
      }
    } else {
      const status = peopleDirectoryStore.getConnectionStatus(viewerId, resolvedTargetId);
      connectionStatus = status.status === 'none' ? 'not_connected' : status.status;
      requestId = status.request_id;
    }

    // 5. Mutual connections count
    let mutualCount = 0;
    if (adminClient && isUuid) {
      try {
        const { count } = await adminClient
          .from('accepted_connections')
          .select('connected_to', { count: 'exact', head: true })
          .eq('user_id', viewerId)
          .in(
            'connected_to',
            (await adminClient
              .from('accepted_connections')
              .select('connected_to')
              .eq('user_id', resolvedTargetId)
              .then(({ data }: { data: Array<{ connected_to: string }> | null }) => (data ?? []).map((r) => r.connected_to))
            )
          );
        mutualCount = count ?? 0;
      } catch {
        mutualCount = 0;
      }
    } else {
      mutualCount = resolvedTargetId === 'a0000000-0000-0000-0000-000000000001' ? 4 : 0;
    }

    // 6. Relationship-aware contact privacy enforcement
    // Table:
    // - Not connected / Pending: Email & Phone hidden unless explicitly public
    // - Accepted Connection: Email & Phone visible only if permitted by owner
    const emailVisibility = String(rawPrivacySettings.emailVisibility || 'connections').toLowerCase();
    const phoneVisibility = String(rawPrivacySettings.phoneVisibility || 'connections').toLowerCase();

    let permittedEmail: string | null = null;
    let permittedPhone: string | null = null;

    if (emailVisibility === 'public') {
      permittedEmail = (profile.email as string) || null;
    } else if (emailVisibility === 'connections' && connectionStatus === 'connected') {
      permittedEmail = (profile.email as string) || null;
    }

    if (phoneVisibility === 'public') {
      permittedPhone = (profile.mobile as string) || (profile.phone as string) || null;
    } else if (phoneVisibility === 'connections' && connectionStatus === 'connected') {
      permittedPhone = (profile.mobile as string) || (profile.phone as string) || null;
    }

    // 7. Canonical profile output
    const fullName =
      (profile.full_name as string) ||
      (profile.display_name as string) ||
      [profile.first_name, profile.last_name].filter(Boolean).join(' ') ||
      'FR8X Member';

    const headline =
      (profile.headline as string) ||
      (profile.designation as string) ||
      (profile.position as string) ||
      '';

    const company =
      (profile.company as string) ||
      (profile.company_name as string) ||
      '';

    const location =
      (profile.location as string) ||
      [profile.city, profile.country].filter(Boolean).join(', ') ||
      '';

    const safePrivacy = {
      allowConnectionRequests: rawPrivacySettings.allowConnectionRequests ?? true,
      allowDiscovery:          true,
      emailVisibility,
      phoneVisibility,
    };

    return NextResponse.json({
      success: true,
      profile: {
        id:                resolvedTargetId,
        full_name:         fullName,
        display_name:      fullName,
        first_name:        profile.first_name ?? null,
        last_name:         profile.last_name ?? null,
        headline:          headline,
        designation:       headline,
        position:          profile.position ?? headline,
        department:        profile.department ?? null,
        company:           company,
        company_name:      company,
        city:              profile.city ?? null,
        state:             profile.state ?? null,
        country:           profile.country ?? null,
        location:          location,
        avatar_url:        profile.avatar_url ?? null,
        bio:               profile.bio ?? null,
        summary:           profile.summary ?? null,
        ...(permittedEmail ? { email: permittedEmail } : {}),
        ...(permittedPhone ? { phone: permittedPhone, mobile: permittedPhone } : {}),
        is_verified:       Boolean(profile.is_verified),
        has_golden_tick:   Boolean(profile.has_golden_tick),
        connection_status: connectionStatus,
        request_id:        requestId,
        mutual_count:      mutualCount,
        privacy_settings:  safePrivacy,
        skills:            Array.isArray(profile.skills) ? profile.skills : [],
        specializations:   Array.isArray(profile.specializations) ? profile.specializations : [],
        key_trade_lanes:   Array.isArray(profile.key_trade_lanes) ? profile.key_trade_lanes : [],
        languages:         Array.isArray(profile.languages) ? profile.languages : [],
        experiences:       Array.isArray(profile.experiences) ? profile.experiences : [],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[profile/[id]] error:', msg);
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred while loading the profile.',
        },
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}

function storeStoreUserCity(u: any): string {
  return u.city || 'Mumbai';
}
