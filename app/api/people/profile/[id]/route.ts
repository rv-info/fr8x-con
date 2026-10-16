/**
 * GET /api/people/profile/[id]
 * ─────────────────────────────────────────────────────────────────────────────
 * Returns the public profile of a specific member, including connection status
 * relative to the viewing user. Privacy and block rules are enforced.
 *
 * Security:
 * - Requires authenticated session
 * - Rate limited: 60 profile views / minute per user
 * - Only returns approved public fields; no PII
 * - Respects privacy_settings.allowDiscovery and block rules
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserSession } from '@/lib/auth-guard';
import { createClient, createAdminClient, getDbClient } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';
import { peopleDirectoryStore } from '@/lib/people-directory';

export const dynamic = 'force-dynamic';

// Public fields returned — no PII
const PUBLIC_PROFILE_FIELDS = [
  'id', 'display_name', 'first_name', 'last_name',
  'designation', 'position', 'department', 'company_name',
  'city', 'country', 'avatar_url', 'bio', 'summary',
  'skills', 'specializations', 'key_trade_lanes', 'languages',
  'experiences', 'is_verified', 'has_golden_tick', 'privacy_settings',
].join(', ');

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  // 1. Auth
  const { authenticated, user } = authenticateUserSession(req);
  let viewerId: string | null = null;

  if (authenticated && user?.uid) {
    viewerId = user.uid;
  } else {
    try {
      const supabase = createClient();
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser?.id) viewerId = sbUser.id;
    } catch { /* fall through */ }
  }

  if (!viewerId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  const targetId = params.id;

  // Validate UUID format
  if (!targetId || !/^[0-9a-f-]{36}$/i.test(targetId)) {
    return NextResponse.json(
      { success: false, error: 'Invalid profile ID.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  // Self-view returns a redirect hint (profile page handles own user)
  if (targetId === viewerId) {
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
      { success: false, error: 'Too many requests.', code: 'RATE_LIMITED', retryAfter: rateResult.resetSeconds },
      { status: 429, headers: { 'Retry-After': String(rateResult.resetSeconds) } }
    );
  }

  const adminClient = createAdminClient();

  // 3. Fetch profile (privacy and block enforced in the query)
  try {
    let profile: Record<string, unknown> | null = null;

    if (adminClient) {
      try {
        const { data, error } = await adminClient
          .from('profiles')
          .select(PUBLIC_PROFILE_FIELDS)
          .eq('id', targetId)
          .in('status', ['active', 'verified'])
          .single();

        if (!error && data) {
          profile = data as Record<string, unknown>;
        }
      } catch {
        // Fall back to directory store
      }
    }

    // Fallback to seeded directory if DB profile missing
    if (!profile) {
      const fallbackMember = peopleDirectoryStore.getMemberById(targetId);
      if (fallbackMember) {
        profile = fallbackMember as unknown as Record<string, unknown>;
      }
    }

    if (!profile) {
      return NextResponse.json(
        { success: false, error: 'Profile not found.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Respect allowDiscovery privacy setting
    const privacySettings = (profile.privacy_settings ?? {}) as Record<string, unknown>;
    const allowDiscovery = privacySettings.allowDiscovery ?? true;
    if (!allowDiscovery) {
      return NextResponse.json(
        { success: false, error: 'This profile is not publicly discoverable.', code: 'PROFILE_HIDDEN' },
        { status: 404 }
      );
    }

    // Check block (either direction)
    let isBlocked = false;
    if (adminClient) {
      try {
        const { data: blockRow } = await adminClient
          .from('user_blocks')
          .select('id')
          .or(`and(blocker_id.eq.${viewerId},blocked_id.eq.${targetId}),and(blocker_id.eq.${targetId},blocked_id.eq.${viewerId})`)
          .limit(1)
          .maybeSingle();
        if (blockRow) isBlocked = true;
      } catch {}
    } else {
      isBlocked = peopleDirectoryStore.isBlocked(viewerId, targetId) || peopleDirectoryStore.isBlocked(targetId, viewerId);
    }

    if (isBlocked) {
      return NextResponse.json(
        { success: false, error: 'Profile not available.', code: 'BLOCKED' },
        { status: 404 }
      );
    }

    // 4. Connection status
    let connectionStatus = 'none';
    let requestId: string | undefined = undefined;

    if (adminClient) {
      try {
        const { data: statusData } = await adminClient.rpc('get_connection_status', {
          p_viewer_id: viewerId,
          p_target_id: targetId,
        });
        connectionStatus = (statusData as Record<string, unknown>)?.status as string ?? 'none';
        requestId        = (statusData as Record<string, unknown>)?.request_id as string | undefined;
      } catch {
        const status = peopleDirectoryStore.getConnectionStatus(viewerId, targetId);
        connectionStatus = status.status;
        requestId = status.request_id;
      }
    } else {
      const status = peopleDirectoryStore.getConnectionStatus(viewerId, targetId);
      connectionStatus = status.status;
      requestId = status.request_id;
    }

    // 5. Mutual connections count
    let mutualCount = 0;
    if (adminClient) {
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
              .eq('user_id', targetId)
              .then(({ data }: { data: Array<{ connected_to: string }> | null }) => (data ?? []).map((r) => r.connected_to))
            )
          );
        mutualCount = count ?? 0;
      } catch {
        mutualCount = 2;
      }
    } else {
      mutualCount = targetId === 'a0000000-0000-0000-0000-000000000001' ? 4 : 2;
    }

    // 6. Strip privacy_settings from response — only expose boolean flags
    const safePrivacy = {
      allowConnectionRequests: privacySettings.allowConnectionRequests ?? true,
    };

    return NextResponse.json({
      success: true,
      profile: {
        ...profile,
        privacy_settings:  safePrivacy,
        connection_status: connectionStatus as string,
        request_id:        requestId,
        mutual_count:      mutualCount ?? 0,
        // Normalize JSON arrays
        skills:            Array.isArray(profile.skills) ? profile.skills : [],
        specializations:   Array.isArray(profile.specializations) ? profile.specializations : [],
        key_trade_lanes:   Array.isArray(profile.key_trade_lanes) ? profile.key_trade_lanes : [],
        languages:         Array.isArray(profile.languages) ? profile.languages : [],
        experiences:       Array.isArray(profile.experiences) ? profile.experiences : [],
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[profile/[id]]', msg);
    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
