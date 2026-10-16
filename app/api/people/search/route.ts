/**
 * GET /api/people/search
 * ─────────────────────────────────────────────────────────────────────────────
 * Protected people search endpoint.
 *
 * Security:
 * - Authenticated via fr8x_session HMAC cookie OR Supabase cookie
 * - Service-role Supabase client; all DB logic in SECURITY DEFINER RPC
 * - Rate limited: 30 searches / minute per user
 * - Zod-validated query params; parameterized DB calls only
 * - Returns explicit public-profile fields only; no email, PII, or internal IDs
 * - Cursor-based pagination (opaque UUID cursor)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUserSession } from '@/lib/auth-guard';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { createAdminClient, getDbClient } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';
import { peopleDirectoryStore } from '@/lib/people-directory';

export const dynamic = 'force-dynamic';

// ── Zod schema for query params ────────────────────────────────────────────────
const SearchParamsSchema = z.object({
  q:            z.string().max(100).optional().default(''),
  country:      z.string().max(60).optional(),
  city:         z.string().max(60).optional(),
  industry:     z.string().max(80).optional(),
  company:      z.string().max(100).optional(),
  skills:       z.string().max(200).optional(), // comma-separated
  verified:     z.enum(['true', 'false']).optional(),
  limit:        z.coerce.number().int().min(1).max(50).optional().default(20),
  cursor:       z.string().uuid('Invalid cursor').optional(),
});

// ── Public profile fields returned (no email/phone/PII) ───────────────────────
const SAFE_FIELDS = [
  'id', 'display_name', 'first_name', 'last_name', 'designation', 'position',
  'company_name', 'city', 'country', 'avatar_url', 'is_verified',
  'has_golden_tick', 'skills', 'specializations', 'privacy_settings',
  'rank', 'connection_status', 'mutual_count',
] as const;

type SafeField = typeof SAFE_FIELDS[number];

/** Strip any fields not in the approved allow-list from a result row */
function sanitizeRow(row: Record<string, unknown>): Record<SafeField, unknown> {
  const out = {} as Record<SafeField, unknown>;
  for (const field of SAFE_FIELDS) {
    out[field] = row[field] ?? null;
  }
  // Redact privacy_settings — only expose boolean flags, not raw JSON
  const ps = (row.privacy_settings as Record<string, unknown> | null) ?? {};
  out.privacy_settings = {
    allowConnectionRequests: ps.allowConnectionRequests ?? true,
    allowDiscovery:          ps.allowDiscovery ?? true,
  };
  return out;
}

// ── Route handler ─────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  // 1. Authentication — fr8x_session HMAC OR Supabase session cookie
  const { authenticated, user, errorResponse } = authenticateUserSession(req);

  // If HMAC session not present, fall back to Supabase cookie auth
  let userId: string | null = null;

  if (authenticated && user) {
    // HMAC session: user.uid is the Supabase auth UUID
    userId = user.uid;
  } else {
    // Try Supabase cookie
    try {
      const supabase = createSupabaseServerClient();
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser?.id) {
        userId = sbUser.id;
      }
    } catch {
      // fall through to unauthorized
    }
  }

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  // 2. Rate limiting: 30 searches per minute per user
  const rateResult = await redis.checkRateLimit({
    action:        'people_search',
    identifier:    userId,
    limit:         30,
    windowSeconds: 60,
  });

  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        success:   false,
        error:     'Too many search requests. Please slow down.',
        code:      'RATE_LIMITED',
        retryAfter: rateResult.resetSeconds,
      },
      {
        status:  429,
        headers: { 'Retry-After': String(rateResult.resetSeconds) },
      }
    );
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
        error:   'Invalid search parameters.',
        code:    'VALIDATION_ERROR',
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const params = parsed.data;

  // Minimum query length for text search (prevents unbounded directory dumps)
  const query = params.q.trim();
  const hasTextQuery = query.length >= 2;

  // If no query AND no filter, require at least one filter to prevent full dumps
  const hasAnyFilter =
    hasTextQuery ||
    params.country  ||
    params.city     ||
    params.industry ||
    params.company  ||
    params.skills   ||
    params.verified === 'true';

  if (!hasAnyFilter) {
    return NextResponse.json(
      {
        success: false,
        error:   'Please provide a search term or at least one filter.',
        code:    'NO_SEARCH_CRITERIA',
      },
      { status: 400 }
    );
  }

  // 4. Build DB call params
  const skillsArray = params.skills
    ? params.skills.split(',').map((s: string) => s.trim()).filter(Boolean)
    : null;

  // 5. Execute via admin (service-role) client → search_people RPC
  const adminClient = createAdminClient();
  let results: Record<string, unknown>[] = [];
  let dbSuccess = false;

  if (adminClient) {
    try {
      const { data, error } = await adminClient.rpc('search_people', {
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

      if (!error && Array.isArray(data) && data.length > 0) {
        results = data as Record<string, unknown>[];
        dbSuccess = true;
      }
    } catch {
      // Continue to directory store fallback
    }
  }

  // Fallback to populated directory store if DB is empty or RPC pending migration
  if (!dbSuccess || results.length === 0) {
    const fallbackResults = peopleDirectoryStore.searchMembers({
      query:        hasTextQuery ? query : undefined,
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

  // 6. Sanitize: strip any field not in the allow-list
  const sanitized = results.map(sanitizeRow);

  // 7. Build opaque cursor (last result's id)
  const nextCursor =
    sanitized.length === params.limit
      ? (sanitized[sanitized.length - 1].id as string)
      : null;

  return NextResponse.json({
    success:    true,
    results:    sanitized,
    data:       sanitized,
    count:      sanitized.length,
    hasMore:    nextCursor !== null,
    nextCursor: nextCursor,
  });
}
