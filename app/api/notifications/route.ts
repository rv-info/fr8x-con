/**
 * GET   /api/notifications  — list notifications for authenticated user & unread count
 * POST  /api/notifications  — mark as read, mark all read, clear, clear all
 *
 * Security:
 * - Requires authenticated session
 * - Resolves notifications from Supabase PostgreSQL notifications table
 * - Resilient fallback to persistent store & peopleDirectoryStore notifications
 * - Accurate unread count calculation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  createClient as createSupabaseServerClient,
  createAdminClient,
  getDbClient,
} from '@/lib/supabase/server';
import {
  resolveCallerIdentity,
  getNotificationsForUser,
  markNotificationReadBackend,
  clearNotificationBackend,
} from '@/lib/connections-backend';

export const dynamic = 'force-dynamic';
export const maxDuration = 10;

export async function GET(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  const userId = caller.userId;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      {
        status: 401,
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
  const unreadOnly = searchParams.get('unread') === 'true';

  try {
    const list = await getNotificationsForUser(userId, limit, unreadOnly, caller.token);
    const unreadCount = list.filter((n) => !n.read).length;

    return NextResponse.json(
      {
        success: true,
        notifications: list,
        unreadCount,
        total: list.length,
      },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'CDN-Cache-Control': 'no-store',
          'Vercel-CDN-Cache-Control': 'no-store',
        },
      }
    );
  } catch (err: any) {
    console.error('[API/notifications GET error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve notifications.', details: err.message },
      { status: 500 }
    );
  }
}

const NotificationActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('mark_read'),
    id: z.string().min(1, 'id is required'),
  }),
  z.object({
    action: z.literal('mark_all_read'),
  }),
  z.object({
    action: z.literal('clear'),
    id: z.string().min(1, 'id is required'),
  }),
  z.object({
    action: z.literal('clear_all'),
  }),
]);

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
    return NextResponse.json({ success: false, error: 'Invalid JSON body.' }, { status: 400 });
  }

  const parsed = NotificationActionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: 'Invalid request.', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const action = parsed.data;
  const adminClient = createAdminClient();
  const userClient = createSupabaseServerClient();
  const client = adminClient || userClient || getDbClient(caller.token);

  if (action.action === 'mark_read') {
    await markNotificationReadBackend(userId, action.id, caller.token);
    return NextResponse.json({ success: true, id: action.id });
  }

  if (action.action === 'mark_all_read') {
    await markNotificationReadBackend(userId, undefined, caller.token);
    return NextResponse.json({ success: true });
  }

  if (action.action === 'clear') {
    await clearNotificationBackend(userId, action.id, caller.token);
    return NextResponse.json({ success: true, id: action.id });
  }

  if (action.action === 'clear_all') {
    await clearNotificationBackend(userId, undefined, caller.token);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Unsupported action.' }, { status: 400 });
}
