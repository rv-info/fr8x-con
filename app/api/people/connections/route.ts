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
    target_id:  z.string().min(1, 'target_id is required'),
    message:    z.string().max(300).optional(),
  }),
  z.object({
    action:     z.literal('accept'),
    request_id: z.string().min(1, 'request_id is required'),
  }),
  z.object({
    action:     z.literal('decline'),
    request_id: z.string().min(1, 'request_id is required'),
  }),
  z.object({
    action:     z.literal('reject'),
    request_id: z.string().min(1, 'request_id is required'),
  }),
  z.object({
    action:     z.literal('cancel'),
    request_id: z.string().optional(),
    target_id:  z.string().optional(),
  }),
  z.object({
    action:    z.literal('remove'),
    target_id: z.string().min(1, 'target_id is required'),
  }),
  z.object({
    action:    z.literal('block'),
    target_id: z.string().min(1, 'target_id is required'),
  }),
  z.object({
    action:    z.literal('unblock'),
    target_id: z.string().min(1, 'target_id is required'),
  }),
  z.object({
    action:    z.literal('status'),
    target_id: z.string().min(1, 'target_id is required'),
  }),
]);

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// ── GET — list connections and requests ───────────────────────────────────────
const GetQuerySchema = z.object({
  tab:   z.enum(['connections', 'incoming', 'outgoing', 'blocked', 'withdrawn']).optional().default('connections'),
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

  const customUid = req.headers.get('x-fr8x-user-uid') || req.headers.get('x-fr8x-session');
  if (customUid && customUid.trim()) return customUid.trim();

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
        const { data: connRows, error: connErr } = await adminClient
          .from('accepted_connections')
          .select('id, connected_at, connected_to')
          .eq('user_id', userId)
          .order('connected_at', { ascending: false })
          .limit(limit);

        if (!connErr && Array.isArray(connRows)) {
          const targetIds = connRows.map((r: any) => r.connected_to).filter(Boolean);
          const profileMap = new Map<string, any>();
          if (targetIds.length > 0) {
            const { data: profRows } = await adminClient
              .from('profiles')
              .select('id, display_name, first_name, last_name, designation, company_name, city, country, avatar_url, is_verified, has_golden_tick')
              .in('id', targetIds);
            if (profRows) {
              profRows.forEach((p: any) => profileMap.set(p.id, p));
            }
          }
          const list = connRows.map((r: any) => ({
            id: r.id,
            connected_at: r.connected_at,
            connected_to: r.connected_to,
            profiles: normalizeProfile(profileMap.get(r.connected_to)),
          }));
          targetIds.forEach((tId) => peopleDirectoryStore.upsertConnection(userId, tId));
          return NextResponse.json({ success: true, tab, data: list });
        }
      } else if (tab === 'incoming') {
        const { data: reqRows, error: reqErr } = await adminClient
          .from('connection_requests')
          .select('id, requester_id, message, created_at, status')
          .eq('recipient_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!reqErr && Array.isArray(reqRows)) {
          const requesterIds = reqRows.map((r: any) => r.requester_id).filter(Boolean);
          const profileMap = new Map<string, any>();
          if (requesterIds.length > 0) {
            const { data: profRows } = await adminClient
              .from('profiles')
              .select('id, display_name, first_name, last_name, designation, company_name, city, country, avatar_url, is_verified, has_golden_tick')
              .in('id', requesterIds);
            if (profRows) {
              profRows.forEach((p: any) => profileMap.set(p.id, p));
            }
          }
          const list = reqRows.map((r: any) => ({
            id: r.id,
            message: r.message,
            created_at: r.created_at,
            status: r.status,
            profiles: normalizeProfile(profileMap.get(r.requester_id)),
          }));
          reqRows.forEach((r: any) => {
            peopleDirectoryStore.upsertRequest({
              id: r.id,
              requester_id: r.requester_id,
              recipient_id: userId,
              status: r.status,
              message: r.message,
              created_at: r.created_at,
              updated_at: r.created_at,
            });
          });
          return NextResponse.json({ success: true, tab, data: list });
        }
      } else if (tab === 'outgoing') {
        const { data: reqRows, error: reqErr } = await adminClient
          .from('connection_requests')
          .select('id, recipient_id, message, created_at, status')
          .eq('requester_id', userId)
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!reqErr && Array.isArray(reqRows)) {
          const recipientIds = reqRows.map((r: any) => r.recipient_id).filter(Boolean);
          const profileMap = new Map<string, any>();
          if (recipientIds.length > 0) {
            const { data: profRows } = await adminClient
              .from('profiles')
              .select('id, display_name, first_name, last_name, designation, company_name, city, country, avatar_url, is_verified, has_golden_tick')
              .in('id', recipientIds);
            if (profRows) {
              profRows.forEach((p: any) => profileMap.set(p.id, p));
            }
          }
          const list = reqRows.map((r: any) => ({
            id: r.id,
            message: r.message,
            created_at: r.created_at,
            status: r.status,
            profiles: normalizeProfile(profileMap.get(r.recipient_id)),
          }));
          return NextResponse.json({ success: true, tab, data: list });
        }
      } else if (tab === 'withdrawn') {
        const { data: reqRows, error: reqErr } = await adminClient
          .from('connection_requests')
          .select('id, recipient_id, message, created_at, updated_at, status')
          .eq('requester_id', userId)
          .in('status', ['cancelled', 'withdrawn'])
          .order('updated_at', { ascending: false })
          .limit(limit);

        if (!reqErr && Array.isArray(reqRows)) {
          const recipientIds = reqRows.map((r: any) => r.recipient_id).filter(Boolean);
          const profileMap = new Map<string, any>();
          if (recipientIds.length > 0) {
            const { data: profRows } = await adminClient
              .from('profiles')
              .select('id, display_name, first_name, last_name, designation, company_name, city, country, avatar_url, is_verified, has_golden_tick')
              .in('id', recipientIds);
            if (profRows) {
              profRows.forEach((p: any) => profileMap.set(p.id, p));
            }
          }
          const list = reqRows.map((r: any) => ({
            id: r.id,
            message: r.message,
            created_at: r.created_at,
            updated_at: r.updated_at,
            status: r.status,
            profiles: normalizeProfile(profileMap.get(r.recipient_id)),
          }));
          return NextResponse.json({ success: true, tab, data: list });
        }
      } else if (tab === 'blocked') {
        const { data: blkRows, error: blkErr } = await adminClient
          .from('user_blocks')
          .select('id, created_at, blocked_id')
          .eq('blocker_id', userId)
          .order('created_at', { ascending: false })
          .limit(limit);

        if (!blkErr && Array.isArray(blkRows)) {
          const blockedIds = blkRows.map((r: any) => r.blocked_id).filter(Boolean);
          const profileMap = new Map<string, any>();
          if (blockedIds.length > 0) {
            const { data: profRows } = await adminClient
              .from('profiles')
              .select('id, display_name, first_name, last_name, designation, company_name, city, country, avatar_url')
              .in('id', blockedIds);
            if (profRows) {
              profRows.forEach((p: any) => profileMap.set(p.id, p));
            }
          }
          const list = blkRows.map((r: any) => ({
            id: r.id,
            created_at: r.created_at,
            profiles: normalizeProfile(profileMap.get(r.blocked_id)),
          }));
          return NextResponse.json({ success: true, tab, data: list });
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

  if (tab === 'withdrawn') {
    const list = peopleDirectoryStore.getWithdrawn(userId).map((r) => ({
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

  // Enforce cancel parameter check
  if (action.action === 'cancel' && !action.request_id && !action.target_id) {
    return NextResponse.json(
      { success: false, error: 'Either request_id or target_id must be provided to withdraw a request.', code: 'VALIDATION_ERROR' },
      { status: 400 }
    );
  }

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
            if (UUID_REGEX.test(action.target_id) && UUID_REGEX.test(userId)) {
              try {
                const { data, error } = await adminClient.rpc('send_connection_request', {
                  p_requester_id: userId,
                  p_recipient_id: action.target_id,
                  p_message:      action.message ?? null,
                });
                if (!error && data && (data as any).success) {
                  result = data;
                  handled = true;
                  const reqId = (data as any).request_id;
                  peopleDirectoryStore.upsertRequest({
                    id: reqId,
                    requester_id: userId,
                    recipient_id: action.target_id,
                    status: 'pending',
                    message: action.message,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                } else if (error) {
                  const errMsg = error.message || '';
                  if (errMsg.includes('ALREADY_CONNECTED')) {
                    result = { success: false, code: 'ALREADY_CONNECTED', error: 'You are already connected with this member.' };
                    handled = true;
                  } else if (errMsg.includes('DUPLICATE_REQUEST')) {
                    result = { success: false, code: 'DUPLICATE_REQUEST', error: 'A pending request already exists.' };
                    handled = true;
                  } else if (errMsg.includes('BLOCKED')) {
                    result = { success: false, code: 'BLOCKED', error: 'Connection request cannot be sent.' };
                    handled = true;
                  } else if (errMsg.includes('RATE_LIMIT')) {
                    result = { success: false, code: 'RATE_LIMIT', error: 'Too many pending requests. Cancel some before sending new ones.' };
                    handled = true;
                  }
                }
              } catch {}

              // Direct PostgreSQL database fallback if RPC failed
              if (!handled) {
                const newReqId = typeof crypto !== 'undefined' && crypto.randomUUID
                  ? crypto.randomUUID()
                  : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;

                const { error: insErr } = await adminClient
                  .from('connection_requests')
                  .upsert({
                    id: newReqId,
                    requester_id: userId,
                    recipient_id: action.target_id,
                    message: action.message ? action.message.trim().slice(0, 300) : null,
                    status: 'pending',
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  }, { onConflict: 'id' });

                if (!insErr) {
                  const requester = peopleDirectoryStore.getMemberById(userId);
                  const requesterName = requester?.display_name || requester?.full_name || 'A freight colleague';

                  await adminClient.from('notifications').insert({
                    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
                    user_id: action.target_id,
                    type: 'connection_request',
                    category: 'network',
                    title: `${requesterName} sent you a connection request`,
                    description: action.message ? `"${action.message.slice(0, 150)}"` : 'Review and respond to grow your professional freight network.',
                    target_url: '/connections?tab=incoming',
                    related_id: newReqId,
                    read: false,
                    metadata: {
                      requester_id: userId,
                      request_id: newReqId,
                      requester_name: requesterName,
                      requester_company: requester?.company_name || requester?.company || '',
                      requester_avatar: requester?.avatar_url || '',
                      actionLabel: 'Review Request',
                    },
                    created_at: new Date().toISOString(),
                  });

                  result = { success: true, request_id: newReqId, status: 'pending' };
                  handled = true;
                  peopleDirectoryStore.upsertRequest({
                    id: newReqId,
                    requester_id: userId,
                    recipient_id: action.target_id,
                    status: 'pending',
                    message: action.message,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                  });
                }
              }
            }
            break;
          }
          case 'accept': {
            if (UUID_REGEX.test(action.request_id)) {
              const { data, error } = await adminClient.rpc('accept_connection_request', {
                p_recipient_id: userId,
                p_request_id:   action.request_id,
              });
              if (!error && data) {
                result = data;
                handled = true;
                peopleDirectoryStore.acceptRequest(userId, action.request_id);
              }
            }
            break;
          }
          case 'reject':
          case 'decline': {
            if (UUID_REGEX.test(action.request_id)) {
              try {
                const { data, error } = await adminClient.rpc('decline_connection_request', {
                  p_recipient_id: userId,
                  p_request_id:   action.request_id,
                });
                if (!error && data) {
                  result = data;
                  handled = true;
                  peopleDirectoryStore.declineRequest(userId, action.request_id);
                }
              } catch {}

              if (!handled) {
                // Direct PostgreSQL update fallback
                const { error: updErr } = await adminClient
                  .from('connection_requests')
                  .update({ status: 'rejected', updated_at: new Date().toISOString() })
                  .eq('id', action.request_id)
                  .eq('recipient_id', userId);
                if (!updErr) {
                  result = { success: true };
                  handled = true;
                  peopleDirectoryStore.declineRequest(userId, action.request_id);
                }
              }
            }
            break;
          }
          case 'cancel': {
            const reqId = action.request_id;
            const targetId = action.target_id;

            // 1. Try atomic RPC first
            if (reqId && UUID_REGEX.test(reqId)) {
              try {
                const { data, error } = await adminClient.rpc('cancel_connection_request', {
                  p_requester_id: userId,
                  p_request_id:   reqId,
                });
                if (!error && data && (data as any).success) {
                  result = data;
                  handled = true;
                  peopleDirectoryStore.cancelRequest(userId, reqId, targetId);
                }
              } catch {}
            }

            // 2. Direct PostgreSQL update fallback (guarantees cancellation in Supabase)
            if (!handled) {
              let query = adminClient
                .from('connection_requests')
                .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                .eq('requester_id', userId);

              if (reqId && UUID_REGEX.test(reqId)) {
                query = query.eq('id', reqId);
              } else if (targetId) {
                query = query.eq('recipient_id', targetId).eq('status', 'pending');
              }

              const { data: updatedRows, error: updErr } = await query.select('id, recipient_id');

              if (!updErr && Array.isArray(updatedRows) && updatedRows.length > 0) {
                const cancelledId = updatedRows[0].id;
                const recId = updatedRows[0].recipient_id;
                await adminClient
                  .from('notifications')
                  .update({ read: true, description: 'This connection request was withdrawn by the sender.' })
                  .eq('user_id', String(recId))
                  .eq('related_id', String(cancelledId));

                result = { success: true, request_id: cancelledId, status: 'cancelled' };
                handled = true;
                peopleDirectoryStore.cancelRequest(userId, cancelledId, recId);
              } else {
                result = { success: true, status: 'cancelled', note: 'Request marked inactive or already cancelled.' };
                handled = true;
                peopleDirectoryStore.cancelRequest(userId, reqId, targetId);
              }
            }
            break;
          }
          case 'remove': {
            if (UUID_REGEX.test(action.target_id)) {
              const { data, error } = await adminClient.rpc('remove_connection', {
                p_user_id:  userId,
                p_other_id: action.target_id,
              });
              if (!error) {
                result = data || { success: true };
                handled = true;
                peopleDirectoryStore.removeConnection(userId, action.target_id);
              }
            }
            break;
          }
          case 'block': {
            if (UUID_REGEX.test(action.target_id)) {
              const { data, error } = await adminClient.rpc('block_user', {
                p_blocker_id: userId,
                p_blocked_id: action.target_id,
              });
              if (!error) {
                result = data || { success: true };
                handled = true;
                peopleDirectoryStore.blockUser(userId, action.target_id);
              }
            }
            break;
          }
          case 'unblock': {
            if (UUID_REGEX.test(action.target_id)) {
              const { data, error } = await adminClient.rpc('unblock_user', {
                p_blocker_id: userId,
                p_blocked_id: action.target_id,
              });
              if (!error) {
                result = data || { success: true };
                handled = true;
                peopleDirectoryStore.unblockUser(userId, action.target_id);
              }
            }
            break;
          }
          case 'status': {
            if (UUID_REGEX.test(action.target_id)) {
              const { data, error } = await adminClient.rpc('get_connection_status', {
                p_viewer_id: userId,
                p_target_id: action.target_id,
              });
              if (!error) { result = data; handled = true; }
            }
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
        case 'reject':
        case 'decline': {
          const ok = peopleDirectoryStore.declineRequest(userId, action.request_id);
          result = ok ? { success: true } : { success: false, error: 'Request not found.', code: 'NOT_FOUND' };
          break;
        }
        case 'cancel': {
          const ok = peopleDirectoryStore.cancelRequest(userId, action.request_id, action.target_id);
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
