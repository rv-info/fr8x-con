/**
 * GET   /api/notifications  — list notifications for authenticated user & unread count
 * POST  /api/notifications  — mark as read, mark all read, clear, clear all
 *
 * Security:
 * - Requires authenticated session
 * - Resolves notifications from Supabase PostgreSQL notifications table
 * - Resilient fallback to peopleDirectoryStore notifications
 * - Accurate unread count calculation
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateUserSession } from '@/lib/auth-guard';
import { createClient as createSupabaseServerClient, createAdminClient, getDbClient } from '@/lib/supabase/server';
import { peopleDirectoryStore } from '@/lib/people-directory';

export const dynamic = 'force-dynamic';

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
  const limit = Math.min(Number(searchParams.get('limit') || 50), 100);
  const unreadOnly = searchParams.get('unread') === 'true';

  let dbNotifs: any[] = [];
  const adminClient = createAdminClient();

  if (adminClient) {
    try {
      let query = adminClient
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (unreadOnly) {
        query = query.eq('read', false);
      }

      const { data, error } = await query;
      if (!error && Array.isArray(data)) {
        dbNotifs = data;
      }
    } catch (err) {
      console.warn('[API/Notifications] Supabase fetch error:', err);
    }
  }

  // Fallback / merge with in-memory store
  const memNotifs = peopleDirectoryStore.getNotifications(userId);
  const seenIds = new Set<string>();
  const seenRelated = new Set<string>();
  const combined: any[] = [];

  for (const n of dbNotifs) {
    const notifId = String(n.id);
    seenIds.add(notifId);
    if (n.related_id) seenRelated.add(String(n.related_id));
    combined.push({
      id: notifId,
      title: n.title || 'Notification',
      desc: n.description || n.message || '',
      time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      createdAt: n.created_at || new Date().toISOString(),
      read: Boolean(n.read),
      type: n.type || 'network',
      category: n.category || 'platform',
      targetUrl: n.target_url || n.link || undefined,
      relatedId: n.related_id || undefined,
      actionLabel: n.metadata?.actionLabel || (n.type?.includes('connection') ? 'Review Request' : undefined),
      metadata: n.metadata || {},
    });
  }

  for (const mn of memNotifs) {
    if (seenIds.has(mn.id) || (mn.related_id && seenRelated.has(mn.related_id))) {
      continue;
    }
    if (unreadOnly && mn.read) continue;
    combined.push({
      id: mn.id,
      title: mn.title,
      desc: mn.description,
      time: mn.created_at ? new Date(mn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
      createdAt: mn.created_at,
      read: mn.read,
      type: mn.type,
      category: mn.category,
      targetUrl: mn.target_url,
      relatedId: mn.related_id,
      actionLabel: mn.metadata?.actionLabel || (mn.type?.includes('connection') ? 'Review Request' : undefined),
      metadata: mn.metadata || {},
    });
  }

  // Sort descending by creation date
  combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadCount = combined.filter((n) => !n.read).length;

  return NextResponse.json({
    success: true,
    notifications: combined.slice(0, limit),
    unreadCount,
    total: combined.length,
  });
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
  const userId = await resolveUserId(req);
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

  if (action.action === 'mark_read') {
    if (adminClient) {
      try {
        await adminClient
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('id', action.id);
      } catch {}
    }
    peopleDirectoryStore.markNotificationRead(userId, action.id);
    return NextResponse.json({ success: true, id: action.id });
  }

  if (action.action === 'mark_all_read') {
    if (adminClient) {
      try {
        await adminClient
          .from('notifications')
          .update({ read: true })
          .eq('user_id', userId)
          .eq('read', false);
      } catch {}
    }
    peopleDirectoryStore.markNotificationRead(userId);
    return NextResponse.json({ success: true });
  }

  if (action.action === 'clear') {
    if (adminClient) {
      try {
        await adminClient
          .from('notifications')
          .delete()
          .eq('user_id', userId)
          .eq('id', action.id);
      } catch {}
    }
    peopleDirectoryStore.clearNotifications(userId, action.id);
    return NextResponse.json({ success: true, id: action.id });
  }

  if (action.action === 'clear_all') {
    if (adminClient) {
      try {
        await adminClient
          .from('notifications')
          .delete()
          .eq('user_id', userId);
      } catch {}
    }
    peopleDirectoryStore.clearNotifications(userId);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Unsupported action.' }, { status: 400 });
}
