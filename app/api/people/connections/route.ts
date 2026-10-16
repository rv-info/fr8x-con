/**
 * POST  /api/people/connections  — mutate connection state
 * GET   /api/people/connections  — list connections / requests
 *
 * Security:
 * - All actions enforced via SECURITY DEFINER PostgreSQL RPCs
 * - Rate limited: 10 mutations / minute per user
 * - Zod-validated request bodies
 * - No direct table writes from the client
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUserSession } from '@/lib/auth-guard';
import { createClient as createSupabaseServerClient, createAdminClient, getDbClient } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';
import { peopleDirectoryStore } from '@/lib/people-directory';
import { outboxService } from '@/lib/outbox/service';
import { safeCache } from '@/lib/cache/safe-cache';

export const dynamic = 'force-dynamic';

// ── Action schema ─────────────────────────────────────────────────────────────
const ConnectionActionSchema = z.discriminatedUnion('action', [
  z.object({
    action:     z.literal('send'),
    target_id:  z.string().uuid('target_id must be a UUID'),
    message:    z.string().max(300).optional(),
  }),
  z.object({
    action:     z.literal('accept'),
    request_id: z.string().uuid('request_id must be a UUID'),
  }),
  z.object({
    action:     z.literal('decline'),
    request_id: z.string().uuid('request_id must be a UUID'),
  }),
  z.object({
    action:     z.literal('cancel'),
    request_id: z.string().uuid('request_id must be a UUID'),
  }),
  z.object({
    action:    z.literal('remove'),
    target_id: z.string().uuid('target_id must be a UUID'),
  }),
  z.object({
    action:    z.literal('block'),
    target_id: z.string().uuid('target_id must be a UUID'),
  }),
  z.object({
    action:    z.literal('unblock'),
    target_id: z.string().uuid('target_id must be a UUID'),
  }),
  z.object({
    action:    z.literal('status'),
    target_id: z.string().uuid('target_id must be a UUID'),
  }),
]);

// ── GET — list connections and requests ───────────────────────────────────────
const GetQuerySchema = z.object({
  tab:   z.enum(['connections', 'incoming', 'outgoing', 'blocked']).optional().default('connections'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
});

async function resolveUserId(req: NextRequest): Promise<string | null> {
  const { authenticated, user } = authenticateUserSession(req);
  if (authenticated && user?.uid) return user.uid;

  try {
    const supabase = createSupabaseServerClient();
    const { data: { user: sbUser } } = await supabase.auth.getUser();
    if (sbUser?.id) return sbUser.id;
  } catch { /* fall through */ }
  return null;
}

export async function GET(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = GetQuerySchema.safeParse({
    tab:    searchParams.get('tab')    ?? 'connections',
    limit:  searchParams.get('limit') ?? '50',
    cursor: searchParams.get('cursor') ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid parameters.', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

  const { tab, limit } = parsed.data;
  const adminClient = createAdminClient();

  if (adminClient) {
    try {
      if (tab === 'connections') {
        const { data, error } = await adminClient
          .from('accepted_connections')
          .select(`
            id,
            connected_at,
            connected_to,
            profiles!accepted_connections_connected_to_fkey (
              id, display_name, first_name, last_name, designation,
              company_name, city, country, avatar_url,
              is_verified, has_golden_tick
            )
          `)
          .eq('user_id', userId)
          .order('connected_at', { ascending: false })
          .limit(limit);

        if (!error && Array.isArray(data)) {
          return NextResponse.json({ success: true, tab, data });
        }
      } else if (tab === 'incoming') {
        const { data, error } = await adminClient
          .from('connection_requests')
          .select(`
            id, message, created_at, status,
            profiles!connection_requests_requester_id_fkey (
              id, display_name, first_name, last_name, designation,
              company_name, city, country, avatar_url,
              is_verified, has_golden_tick
            )
          `)
          .eq('recipient_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && Array.isArray(data)) {
          return NextResponse.json({ success: true, tab, data });
        }
      } else if (tab === 'outgoing') {
        const { data, error } = await adminClient
          .from('connection_requests')
          .select(`
            id, message, created_at, status,
            profiles!connection_requests_recipient_id_fkey (
              id, display_name, first_name, last_name, designation,
              company_name, city, country, avatar_url,
              is_verified, has_golden_tick
            )
          `)
          .eq('requester_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && Array.isArray(data)) {
          return NextResponse.json({ success: true, tab, data });
        }
      } else if (tab === 'blocked') {
        const { data, error } = await adminClient
          .from('user_blocks')
          .select(`
            id, created_at,
            profiles!user_blocks_blocked_id_fkey (
              id, display_name, first_name, last_name, designation,
              company_name, city, country, avatar_url
            )
          `)
          .eq('blocker_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!error && Array.isArray(data)) {
          return NextResponse.json({ success: true, tab, data });
        }
      }
    } catch {
      // Continue to directory store fallback
    }
  }

  function normalizeProfile(p: any) {
    if (!p) return null;
    const fullName = p.full_name || p.display_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'FR8X Member';
    const headline = p.headline || p.designation || p.position || '';
    const company = p.company || p.company_name || '';
    const location = p.location || [p.city, p.country].filter(Boolean).join(', ') || '';
    return {
      ...p,
      full_name: fullName,
      display_name: fullName,
      headline,
      designation: headline,
      company,
      company_name: company,
      location,
    };
  }

  // Fallback to peopleDirectoryStore
  if (tab === 'connections') {
    const list = peopleDirectoryStore.getConnections(userId).map((p) => ({
      id: `conn_${p.id}`,
      connected_at: new Date().toISOString(),
      connected_to: p.id,
      profiles: normalizeProfile(p),
    }));
    return NextResponse.json({ success: true, tab, data: list });
  }

  if (tab === 'incoming') {
    const list = peopleDirectoryStore.getIncoming(userId).map((r) => ({
      id: r.id,
      message: r.message,
      created_at: r.created_at,
      status: r.status,
      profiles: normalizeProfile(r.requester),
    }));
    return NextResponse.json({ success: true, tab, data: list });
  }

  if (tab === 'outgoing') {
    const list = peopleDirectoryStore.getOutgoing(userId).map((r) => ({
      id: r.id,
      message: r.message,
      created_at: r.created_at,
      status: r.status,
      profiles: normalizeProfile(r.recipient),
    }));
    return NextResponse.json({ success: true, tab, data: list });
  }

  if (tab === 'blocked') {
    const list = peopleDirectoryStore.getBlocked(userId).map((p) => ({
      id: `blk_${p.id}`,
      created_at: new Date().toISOString(),
      profiles: normalizeProfile(p),
    }));
    return NextResponse.json({ success: true, tab, data: list });
  }

  return NextResponse.json({ success: false, error: 'Unknown tab.', code: 'BAD_REQUEST' }, { status: 400 });
}

// ── POST — mutate connection state ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const userId = await resolveUserId(req);
  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  // Rate limit: 10 mutations per minute
  const rateResult = await redis.checkRateLimit({
    action:        'connection_mutation',
    identifier:    userId,
    limit:         10,
    windowSeconds: 60,
  });

  if (!rateResult.allowed) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please slow down.', code: 'RATE_LIMITED', retryAfter: rateResult.resetSeconds },
      { status: 429, headers: { 'Retry-After': String(rateResult.resetSeconds) } }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid JSON body.', code: 'BAD_REQUEST' }, { status: 400 });
  }

  const parsed = ConnectionActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request.', code: 'VALIDATION_ERROR', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const action = parsed.data;
  const adminClient = createAdminClient();

  // Enforce self checks
  if ('target_id' in action && action.target_id === userId) {
    return NextResponse.json(
      { success: false, error: 'Cannot perform connection actions with yourself.', code: 'SELF_REQUEST' },
      { status: 400 }
    );
  }

  try {
    let result: unknown = null;
    let handled = false;

    if (adminClient) {
      try {
        switch (action.action) {
          case 'send': {
            const { data, error } = await adminClient.rpc('send_connection_request', {
              p_requester_id: userId,
              p_recipient_id: action.target_id,
              p_message:      action.message ?? null,
            });
            if (!error) { result = data; handled = true; }
            break;
          }
          case 'accept': {
            const { data, error } = await adminClient.rpc('accept_connection_request', {
              p_recipient_id: userId,
              p_request_id:   action.request_id,
            });
            if (!error) { result = data; handled = true; }
            break;
          }
          case 'decline': {
            const { data, error } = await adminClient.rpc('decline_connection_request', {
              p_recipient_id: userId,
              p_request_id:   action.request_id,
            });
            if (!error) { result = data; handled = true; }
            break;
          }
          case 'cancel': {
            const { data, error } = await adminClient.rpc('cancel_connection_request', {
              p_requester_id: userId,
              p_request_id:   action.request_id,
            });
            if (!error) { result = data; handled = true; }
            break;
          }
          case 'remove': {
            const { data, error } = await adminClient.rpc('remove_connection', {
              p_user_id:  userId,
              p_other_id: action.target_id,
            });
            if (!error) { result = data; handled = true; }
            break;
          }
          case 'block': {
            const { data, error } = await adminClient.rpc('block_user', {
              p_blocker_id: userId,
              p_blocked_id: action.target_id,
            });
            if (!error) { result = data; handled = true; }
            break;
          }
          case 'unblock': {
            const { data, error } = await adminClient.rpc('unblock_user', {
              p_blocker_id: userId,
              p_blocked_id: action.target_id,
            });
            if (!error) { result = data; handled = true; }
            break;
          }
          case 'status': {
            const { data, error } = await adminClient.rpc('get_connection_status', {
              p_viewer_id: userId,
              p_target_id: action.target_id,
            });
            if (!error) { result = data; handled = true; }
            break;
          }
        }
      } catch {
        // Fall back to directory store
      }
    }

    // Fallback to in-memory peopleDirectoryStore
    if (!handled) {
      switch (action.action) {
        case 'send': {
          const sent = peopleDirectoryStore.sendRequest(userId, action.target_id, action.message);
          result = sent.success
            ? { success: true, request_id: sent.request_id }
            : { success: false, error: 'Request already exists or member is blocked.', code: 'CONFLICT' };
          break;
        }
        case 'accept': {
          const ok = peopleDirectoryStore.acceptRequest(userId, action.request_id);
          result = ok ? { success: true } : { success: false, error: 'Request not found.', code: 'NOT_FOUND' };
          break;
        }
        case 'decline': {
          const ok = peopleDirectoryStore.declineRequest(userId, action.request_id);
          result = ok ? { success: true } : { success: false, error: 'Request not found.', code: 'NOT_FOUND' };
          break;
        }
        case 'cancel': {
          const ok = peopleDirectoryStore.cancelRequest(userId, action.request_id);
          result = ok ? { success: true } : { success: false, error: 'Request not found.', code: 'NOT_FOUND' };
          break;
        }
        case 'remove': {
          peopleDirectoryStore.removeConnection(userId, action.target_id);
          result = { success: true };
          break;
        }
        case 'block': {
          peopleDirectoryStore.blockUser(userId, action.target_id);
          result = { success: true };
          break;
        }
        case 'unblock': {
          peopleDirectoryStore.unblockUser(userId, action.target_id);
          result = { success: true };
          break;
        }
        case 'status': {
          const status = peopleDirectoryStore.getConnectionStatus(userId, action.target_id);
          result = { success: true, status: status.status, request_id: status.request_id };
          break;
        }
      }
    }

    const res = result as Record<string, unknown>;

    // Map error codes to HTTP status
    if (res && res.success === false) {
      const code = res.code as string;
      const status =
        code === 'FORBIDDEN'    ? 403 :
        code === 'NOT_FOUND'    ? 404 :
        code === 'RATE_LIMIT'   ? 429 :
        code === 'BLOCKED'      ? 403 :
        code === 'SELF_REQUEST' ? 400 : 409;
      return NextResponse.json(res, { status });
    }

    // Record transactional outbox event & invalidate affected user caches
    if (action.action === 'send') {
      const targetId = action.target_id;
      const reqId = (res?.request_id as string) || `req_${Date.now()}`;
      safeCache.invalidateUser(userId);
      safeCache.invalidateUser(targetId);
      outboxService.recordEvent({
        eventType: 'connection.requested',
        aggregateType: 'connection',
        aggregateId: reqId,
        payload: { sender_id: userId, recipient_id: targetId, message: action.message },
        idempotencyKey: `conn_req:${userId}:${targetId}`,
      }).catch(() => {});
    } else if (action.action === 'accept') {
      safeCache.invalidateUser(userId);
      outboxService.recordEvent({
        eventType: 'connection.accepted',
        aggregateType: 'connection',
        aggregateId: action.request_id,
        payload: { recipient_id: userId, request_id: action.request_id },
        idempotencyKey: `conn_acc:${action.request_id}`,
      }).catch(() => {});
    } else if (action.action === 'remove') {
      safeCache.invalidateUser(userId);
      safeCache.invalidateUser(action.target_id);
      outboxService.recordEvent({
        eventType: 'connection.removed',
        aggregateType: 'connection',
        aggregateId: `${userId}:${action.target_id}`,
        payload: { user_a: userId, user_b: action.target_id },
      }).catch(() => {});
    } else if (action.action === 'block') {
      safeCache.invalidateUser(userId);
      safeCache.invalidateUser(action.target_id);
      outboxService.recordEvent({
        eventType: 'user.blocked',
        aggregateType: 'user',
        aggregateId: action.target_id,
        payload: { blocker_id: userId, blocked_id: action.target_id },
      }).catch(() => {});
    }

    return NextResponse.json(res ?? { success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[connections POST]', action.action, msg);
    return NextResponse.json({ success: false, error: 'Operation failed. Please try again.', code: 'INTERNAL_ERROR' }, { status: 500 });
  }
}
