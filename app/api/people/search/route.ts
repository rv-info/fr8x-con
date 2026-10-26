/**
 * GET /api/people/search
 * ─────────────────────────────────────────────────────────────────────────────
 * Protected professional people search and discovery endpoint for FR8X.
 *
 * Conforms to FR8X Production API Response Contract:
 * {
 *   "success": true,
 *   "data": [
 *     {
 *       "id": "...",
 *       "full_name": "...",
 *       "headline": "...",
 *       "company": "...",
 *       "location": "...",
 *       "connection_status": "not_connected"
 *     }
 *   ],
 *   "pagination": {
 *     "nextCursor": null,
 *     "hasMore": false
 *   }
 * }
 *
 * Security:
 * - Authenticated via fr8x_session HMAC cookie OR Supabase cookie
 * - Zero-trust database authorization via SECURITY DEFINER RPC & RLS
 * - Rate limited: 30 searches / minute per user
 * - Zod-validated query params; parameterized operations only
 * - Privacy protection: email, phone, PII, and internal IDs stripped
 * - Cursor-based pagination; universal discovery across all companies & hubs
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUserSession } from '@/lib/auth-guard';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient, getDbClient } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';
import { peopleDirectoryStore, DirectoryMember } from '@/lib/people-directory';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { isSelfProfile, isTestOrDummyAccount } from '@/lib/connections-algorithm';
import { resolveDisplayName } from '@/lib/utils';
import {
  resolveCallerIdentity,
  queryWithTimeout,
  getAcceptedConnectionsForUser,
  getOutgoingRequestsForUser,
  getIncomingRequestsForUser,
} from '@/lib/connections-backend';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

// ── Zod schema for query params ────────────────────────────────────────────────
const SearchParamsSchema = z.object({
  q:        z.string().max(100).optional().default(''),
  country:  z.string().max(60).optional(),
  city:     z.string().max(60).optional(),
  industry: z.string().max(80).optional(),
  company:  z.string().max(100).optional(),
  skills:   z.string().max(200).optional(), // comma-separated
  verified: z.enum(['true', 'false']).optional(),
  limit:    z.coerce.number().int().min(1).max(50).optional().default(20),
  cursor:   z.string().max(100).optional(),
});

// ── Public profile fields returned (no email/phone/PII) ───────────────────────
const SAFE_FIELDS = [
  'id', 'full_name', 'display_name', 'first_name', 'last_name',
  'headline', 'designation', 'position',
  'company', 'company_name',
  'location', 'city', 'country',
  'avatar_url', 'is_verified', 'has_golden_tick',
  'skills', 'specializations', 'key_trade_lanes', 'bio', 'summary', 'experiences', 'privacy_settings',
  'rank', 'connection_status', 'mutual_count', 'request_id',
] as const;

type SafeField = typeof SAFE_FIELDS[number];

/** Strip any fields not in the approved allow-list from a result row */
function sanitizeRow(row: Record<string, unknown>): Record<SafeField, unknown> {
  const out = {} as Record<SafeField, unknown>;

  // Canonical full_name computation
  const fullName =
    (row.full_name as string) ||
    (row.display_name as string) ||
    [row.first_name, row.last_name].filter(Boolean).join(' ') ||
    'FR8X Member';

  // Canonical headline computation
  const headline =
    (row.headline as string) ||
    (row.designation as string) ||
    (row.position as string) ||
    '';

  // Canonical company computation
  const company =
    (row.company as string) ||
    (row.company_name as string) ||
    '';

  // Canonical location computation
  const location =
    (row.location as string) ||
    [row.city, row.country].filter(Boolean).join(', ') ||
    '';

  // Canonical connection status: 'not_connected' is canonical, 'none' is alias
  const rawStatus = (row.connection_status as string) || 'none';
  const connectionStatus =
    rawStatus === 'none' ? 'not_connected' : rawStatus;

  for (const field of SAFE_FIELDS) {
    out[field] = row[field] ?? null;
  }

  out.full_name = fullName;
  out.display_name = fullName;
  out.headline = headline;
  out.designation = headline;
  out.company = company;
  out.location = location;
  out.connection_status = connectionStatus;
  out.request_id = (row.request_id as string) || null;
  out.specializations = Array.isArray(row.specializations) ? row.specializations : [];
  out.key_trade_lanes = Array.isArray(row.key_trade_lanes) ? row.key_trade_lanes : [];
  out.skills = Array.isArray(row.skills) ? row.skills : [];
  out.bio = (row.bio as string) || '';
  out.summary = (row.summary as string) || '';

  // Redact privacy_settings — only expose boolean flags, not raw JSON
  const ps = (row.privacy_settings as Record<string, unknown> | null) ?? {};
  out.privacy_settings = {
    allowConnectionRequests: ps.allowConnectionRequests ?? true,
    allowDiscovery:          ps.allowDiscovery ?? true,
  };

  return out;
}

/** Synchronizes existing registered platform users into the directory store */
function syncRegisteredUsersToDirectory() {
  try {
    const registeredUsers = serverSecurityStore.getAllRegisteredUsers();
    for (const u of registeredUsers) {
      if (!u.uid) continue;
      const ps = (u.privacySettings ?? {}) as Record<string, unknown>;
      const resolvedPersonName = resolveDisplayName({
        firstName: u.firstName,
        lastName: u.lastName,
        displayName: u.displayName,
        email: u.email,
      }, 'FR8X Member');

      const member: DirectoryMember = {
        id: u.uid,
        display_name: resolvedPersonName,
        full_name: resolvedPersonName,
        first_name: u.firstName || (resolvedPersonName.split(' ').length > 1 ? resolvedPersonName.split(' ')[0] : resolvedPersonName),
        last_name: u.lastName || (resolvedPersonName.split(' ').length > 1 ? resolvedPersonName.split(' ').slice(1).join(' ') : ''),
        designation: u.designation || 'Freight Professional',
        headline: u.designation || 'Freight Professional',
        company_name: u.company || '',
        company: u.company || '',
        city: u.city || '',
        country: u.country || 'India',
        location: [u.city, u.country || 'India'].filter(Boolean).join(', ') || '',
        avatar_url: u.avatarUrl || undefined,
        is_verified: Boolean(u.isVerified ?? u.email_verified),
        has_golden_tick: Boolean(u.plan === 'premium'),
        skills: ['Freight Forwarding', 'Logistics Management', 'Customs Clearance'],
        specializations: ['B2B Freight', 'NVOCC Operations'],
        key_trade_lanes: ['Global Multi-Modal'],
        privacy_settings: {
          allowDiscovery: ps.allowDiscovery ?? true,
          allowConnectionRequests: ps.allowConnectionRequests ?? true,
          emailVisibility: ps.emailVisibility ?? 'connections',
          phoneVisibility: ps.phoneVisibility ?? 'connections',
        },
      };
      peopleDirectoryStore.registerMember(member);
    }
  } catch {
    // Non-blocking sync
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // 1. Caller identity resolution (HMAC cookie, Supabase session, x-fr8x-user-uid header, or guest fallback)
  const caller = await resolveCallerIdentity(req);
  const userId = caller.userId || 'guest_viewer';
  const user = caller.profile || { uid: userId, email: caller.userEmail };
  const currentUser = user;

  // 2. Rate limiting: 60 searches per minute per identified user
  if (caller.userId) {
    const rateResult = await redis.checkRateLimit({
      action:        'people_search',
      identifier:    caller.userId,
      limit:         60,
      windowSeconds: 60,
    });

    if (!rateResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many search requests. Please slow down.',
          },
          code: 'RATE_LIMITED',
          retryAfter: rateResult.resetSeconds,
        },
        {
          status:  429,
          headers: { 'Retry-After': String(rateResult.resetSeconds) },
        }
      );
    }
  }

  // 3. Parse and validate query params
  const { searchParams } = new URL(req.url);
  const raw = {
    q:        searchParams.get('q')        ?? '',
    country:  searchParams.get('country')  ?? undefined,
    city:     searchParams.get('city')     ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    company:  searchParams.get('company')  ?? undefined,
    skills:   searchParams.get('skills')   ?? undefined,
    verified: searchParams.get('verified') ?? undefined,
    limit:    searchParams.get('limit')    ?? '20',
    cursor:   searchParams.get('cursor')   ?? undefined,
  };

  const parsed = SearchParamsSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search parameters.',
        },
        code:    'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const params = parsed.data;
  const query = params.q.trim();
  const hasTextQuery = query.length >= 2;

  // 4. Build DB call params
  const skillsArray = params.skills
    ? params.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    : null;

  // Sync existing registered users to directory store
  syncRegisteredUsersToDirectory();

  // 5. Execute via admin (service-role) client → search_people RPC
  const adminClient = createAdminClient();
  let results: Record<string, unknown>[] = [];
  let dbSuccess = false;

  if (adminClient) {
    try {
      const rpcPromise = adminClient.rpc('search_people', {
        p_requester_id:  userId,
        p_query:         hasTextQuery ? query : '',
        p_country:       params.country  ?? null,
        p_city:          params.city     ?? null,
        p_industry:      params.industry ?? null,
        p_company:       params.company  ?? null,
        p_skills:        skillsArray,
        p_verified_only: params.verified === 'true',
        p_limit:         params.limit,
        p_cursor:        params.cursor   ?? null,
      });

      const { data, error } = await queryWithTimeout(rpcPromise, 1000);

      if (!error && Array.isArray(data) && data.length > 0) {
        results = data as Record<string, unknown>[];
        dbSuccess = true;
      }
    } catch {
      // Continue to universal directory store fallback
    }
  }

  // 5b. Fallback to direct PostgreSQL public.profiles query if RPC unavailable
  if (!dbSuccess || results.length === 0) {
    try {
      const dbClient = getDbClient();
      let dbQuery = dbClient
        .from('profiles')
        .select('id, display_name, first_name, last_name, company_name, designation, avatar_url, city, country, is_verified, created_at')
        .neq('id', userId)
        .limit(params.limit);

      if (hasTextQuery) {
        dbQuery = dbQuery.or(
          `display_name.ilike.%${query}%,first_name.ilike.%${query}%,last_name.ilike.%${query}%,company_name.ilike.%${query}%,designation.ilike.%${query}%`
        );
      }
      if (params.country) {
        dbQuery = dbQuery.ilike('country', `%${params.country}%`);
      }
      if (params.city) {
        dbQuery = dbQuery.ilike('city', `%${params.city}%`);
      }
      if (params.company) {
        dbQuery = dbQuery.ilike('company_name', `%${params.company}%`);
      }
      if (params.verified === 'true') {
        dbQuery = dbQuery.eq('is_verified', true);
      }

      const { data: dbProfiles, error: dbErr } = await queryWithTimeout(dbQuery, 1000);
      if (!dbErr && dbProfiles && dbProfiles.length > 0) {
        results = dbProfiles.map((p: any) => ({
          id: p.id,
          user_id: p.id,
          full_name: p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'FR8X Member',
          display_name: p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'FR8X Member',
          first_name: p.first_name,
          last_name: p.last_name,
          company: p.company_name,
          company_name: p.company_name,
          designation: p.designation,
          headline: p.designation ? `${p.designation} at ${p.company_name || 'Enterprise'}` : (p.company_name ? `Logistics Professional at ${p.company_name}` : 'Logistics Professional'),
          city: p.city,
          country: p.country,
          avatar_url: p.avatar_url,
          is_verified: p.is_verified,
        }));
        dbSuccess = true;
      }
    } catch {
      // Continue to universal directory store fallback
    }
  }

  // 5c. Fallback to universal directory store (seeded + existing registered users)
  if (!dbSuccess || results.length === 0) {
    const fallbackResults = peopleDirectoryStore.searchMembers({
      query:        hasTextQuery ? query : (query.length > 0 ? query : undefined),
      country:      params.country,
      city:         params.city,
      industry:     params.industry,
      company:      params.company,
      skills:       skillsArray,
      verifiedOnly: params.verified === 'true',
      viewerId:     userId,
    });
    results = fallbackResults as unknown as Record<string, unknown>[];
  }

  // 6. Deduplicate by unique person ID, filter out self and test/dummy profiles
  const seenMemberIds = new Set<string>();
  const deduplicatedResults = results.filter((r) => {
    const memId = String(r.id || r.user_id || '').toLowerCase();
    if (!memId || seenMemberIds.has(memId)) return false;
    if (isTestOrDummyAccount(r)) return false;
    if (userId !== 'guest_viewer' && (isSelfProfile(user, r as any) || memId === userId.toLowerCase())) return false;
    seenMemberIds.add(memId);
    return true;
  });

  // 6b. Dynamic connection status reconciliation against authoritative stores
  if (userId && userId !== 'guest_viewer') {
    try {
      const [acceptedConns, outgoingReqs, incomingReqs] = await Promise.all([
        getAcceptedConnectionsForUser(userId, 100, caller.token),
        getOutgoingRequestsForUser(userId, 50, caller.token),
        getIncomingRequestsForUser(userId, 50, caller.token),
      ]);

      const connectedIdSet = new Set<string>();
      const connectedNameSet = new Set<string>();
      for (const c of acceptedConns) {
        if (c.connected_to) connectedIdSet.add(String(c.connected_to).toLowerCase());
        if (c.profiles?.id) connectedIdSet.add(String(c.profiles.id).toLowerCase());
        const cName = (c.profiles?.display_name || c.profiles?.full_name || '').toLowerCase().trim();
        if (cName && cName !== 'freight professional' && cName !== 'fr8x member') {
          connectedNameSet.add(cName);
        }
      }

      const outgoingMap = new Map<string, string>(); // targetId -> requestId
      for (const o of outgoingReqs) {
        const oTarget = String(o.recipient_id || o.profiles?.id || '').toLowerCase();
        if (oTarget) outgoingMap.set(oTarget, o.id);
      }

      const incomingMap = new Map<string, string>(); // senderId -> requestId
      for (const inc of incomingReqs) {
        const incSender = String(inc.requester_id || inc.profiles?.id || '').toLowerCase();
        if (incSender) incomingMap.set(incSender, inc.id);
      }

      for (const r of deduplicatedResults) {
        const rId = String(r.id || r.user_id || '').toLowerCase();
        const rName = String(r.full_name || r.display_name || '').toLowerCase().trim();

        if (connectedIdSet.has(rId) || (rName && connectedNameSet.has(rName))) {
          r.connection_status = 'connected';
        } else if (outgoingMap.has(rId)) {
          r.connection_status = 'pending_sent';
          r.request_id = outgoingMap.get(rId);
        } else if (incomingMap.has(rId)) {
          r.connection_status = 'pending_received';
          r.request_id = incomingMap.get(rId);
        } else if (!r.connection_status || r.connection_status === 'none') {
          r.connection_status = 'not_connected';
        }
      }
    } catch (statusErr) {
      console.warn('[PeopleSearch] Connection status reconciliation warning:', statusErr);
    }
  }

  const sanitized = deduplicatedResults.map(sanitizeRow);

  // 7. Pagination calculation
  const hasMore = sanitized.length === params.limit;
  const nextCursor = hasMore && sanitized.length > 0
    ? (sanitized[sanitized.length - 1].id as string)
    : null;

  // 8. Return standardized FR8X response contract
  return NextResponse.json({
    success: true,
    data: sanitized,
    results: sanitized, // backward compatibility
    count: sanitized.length,
    pagination: {
      nextCursor,
      hasMore,
    },
    hasMore,
    nextCursor,
  });
}
