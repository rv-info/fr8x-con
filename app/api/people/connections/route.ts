/**
 * POST  /api/people/connections  — mutate connection state
 * GET   /api/people/connections  — list connections / requests
 *
 * Security:
 * - Enterprise-grade multi-tenant connection management
 * - Authenticated session validation (HMAC fr8x_session or Supabase SSR cookie)
 * - Authoritative PostgreSQL `public.connections` persistence
 * - Shared cross-process disk storage for zero-data-loss resilience
 * - Rate limited: 30 mutations / minute per user
 * - Zod-validated request bodies
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUserSession } from '@/lib/auth-guard';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { redis } from '@/lib/redis';
import { peopleDirectoryStore } from '@/lib/people-directory';
import { outboxService } from '@/lib/outbox/service';
import { safeCache } from '@/lib/cache/safe-cache';
import {
  resolveCallerIdentity,
  getIncomingRequestsForUser,
  getOutgoingRequestsForUser,
  getAcceptedConnectionsForUser,
  getWithdrawnRequestsForUser,
  sendConnectionRequestBackend,
  acceptConnectionRequestBackend,
  cancelConnectionRequestBackend,
  declineConnectionRequestBackend,
  normalizeMemberProfile,
} from '@/lib/connections-backend';

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

// ── GET query schema ──────────────────────────────────────────────────────────
const GetQuerySchema = z.object({
  tab:   z.enum(['connections', 'incoming', 'outgoing', 'blocked', 'withdrawn']).optional().default('connections'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
  cursor: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  const userId = caller.userId;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const parsed = GetQuerySchema.safeParse({
    tab: searchParams.get('tab') || 'connections',
    limit: searchParams.get('limit') || '50',
    cursor: searchParams.get('cursor') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid query parameters.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { tab, limit } = parsed.data;

  try {
    if (tab === 'connections') {
      const list = await getAcceptedConnectionsForUser(userId, limit, caller.token);
      return NextResponse.json({ success: true, tab, data: list });
    }

    if (tab === 'incoming') {
      const list = await getIncomingRequestsForUser(userId, limit, caller.token);
      return NextResponse.json({ success: true, tab, data: list });
    }

    if (tab === 'outgoing') {
      const list = await getOutgoingRequestsForUser(userId, limit, caller.token);
      return NextResponse.json({ success: true, tab, data: list });
    }

    if (tab === 'withdrawn') {
      const list = await getWithdrawnRequestsForUser(userId, limit, caller.token);
      return NextResponse.json({ success: true, tab, data: list });
    }

    if (tab === 'blocked') {
      const list = peopleDirectoryStore.getBlocked(userId).map((p) => ({
        id: `blk_${p.id}`,
        created_at: new Date().toISOString(),
        profiles: normalizeMemberProfile(p),
      }));
      return NextResponse.json({ success: true, tab, data: list });
    }

    return NextResponse.json({ success: false, error: 'Unknown tab.', code: 'BAD_REQUEST' }, { status: 400 });
  } catch (err: any) {
    console.error('[API/people/connections GET error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve connection relationships.', details: err.message },
      { status: 500 }
    );
  }
}

// ── POST — mutate connection state ────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  const userId = caller.userId;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON body.', code: 'BAD_REQUEST' },
      { status: 400 }
    );
  }

  const parseResult = ConnectionActionSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      {
        success: false,
        error:   'Validation failed.',
        code:    'VALIDATION_ERROR',
        details: parseResult.error.flatten().fieldErrors,
      },
      { status: 400 }
    );
  }

  const action = parseResult.data;

  // Self-request guard
  if (
    (action.action === 'send' && action.target_id === userId) ||
    (action.action === 'block' && action.target_id === userId)
  ) {
    return NextResponse.json(
      { success: false, error: 'Cannot perform this action on yourself.', code: 'SELF_REQUEST' },
      { status: 400 }
    );
  }

  // Rate limiting: 30 mutations per minute per user
  const rateResult = await redis.checkRateLimit({
    action:        `conn_mutate_${action.action}`,
    identifier:    userId,
    limit:         30,
    windowSeconds: 60,
  });

  if (!rateResult.allowed) {
    return NextResponse.json(
      {
        success:    false,
        error:      'Rate limit exceeded. Please wait a moment.',
        code:       'RATE_LIMIT',
        retryAfter: rateResult.resetSeconds,
      },
      {
        status:  429,
        headers: { 'Retry-After': String(rateResult.resetSeconds) },
      }
    );
  }

  try {
    let result: Record<string, any> = { success: true };

    switch (action.action) {
      case 'send': {
        result = await sendConnectionRequestBackend(
          userId,
          action.target_id,
          action.message,
          caller.token
        );
        break;
      }

      case 'accept': {
        result = await acceptConnectionRequestBackend(
          userId,
          action.request_id,
          undefined,
          caller.token
        );
        break;
      }

      case 'reject':
      case 'decline': {
        result = await declineConnectionRequestBackend(
          userId,
          action.request_id,
          undefined,
          caller.token
        );
        break;
      }

      case 'cancel': {
        result = await cancelConnectionRequestBackend(
          userId,
          action.request_id,
          action.target_id,
          caller.token
        );
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

    // Map error codes to standard HTTP statuses
    if (result && result.success === false) {
      const code = result.code as string;
      const status =
        code === 'FORBIDDEN'    ? 403 :
        code === 'NOT_FOUND'    ? 404 :
        code === 'RATE_LIMIT'   ? 429 :
        code === 'BLOCKED'      ? 403 :
        code === 'SELF_REQUEST' ? 400 : 409;
      return NextResponse.json(result, { status });
    }

    // Record transactional outbox event & invalidate affected user caches
    if (action.action === 'send') {
      const targetId = action.target_id;
      const reqId = (result?.request_id as string) || `req_${Date.now()}`;
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

    return NextResponse.json(result ?? { success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[connections POST error]', action.action, msg);
    return NextResponse.json(
      { success: false, error: 'Operation failed. Please try again.', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
