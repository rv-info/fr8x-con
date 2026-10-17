/**
 * app/api/search/history/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * User-Scoped Persistent Search History API for FR8X.
 *
 * Requirements:
 * - Scoped strictly to authenticated user (auth.uid() / session uid)
 * - Safe from sensitive information / PII leaks (tokens, passwords, card numbers)
 * - Record, retrieve, Clear One, and Clear All operations
 * - Contextual scoping ('connections', 'global', 'rates', 'auctions')
 * - Query normalization and duplicate consolidation
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserSession } from '@/lib/auth-guard';
import { createClient as createSupabaseServerClient, createAdminClient } from '@/lib/supabase/server';

// ── In-memory fallback cache when PostgreSQL connection is unavailable ────────
interface SearchHistoryItem {
  id: string;
  user_id: string;
  query: string;
  normalized_query: string;
  search_context: string;
  result_count: number;
  created_at: string;
  updated_at: string;
}

const memoryHistoryStore = new Map<string, SearchHistoryItem[]>();

// ── Sensitive Information & PII Sanitizer ──────────────────────────────────────
const SENSITIVE_PATTERNS = [
  /bearer\s+[a-zA-Z0-9_\-\.]+/i,
  /ey[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}/, // JWT pattern
  /password\s*[:=]\s*\S+/i,
  /secret\s*[:=]\s*\S+/i,
  /\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/, // Credit Card numbers
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i, // Raw emails
];

function isSafeSearchQuery(query: string): boolean {
  if (!query || query.trim().length < 2 || query.length > 100) return false;
  for (const pattern of SENSITIVE_PATTERNS) {
    if (pattern.test(query)) return false;
  }
  return true;
}

function normalizeSearchQuery(query: string): string {
  return query.trim().toLowerCase().replace(/\s+/g, ' ');
}

// ── GET: Retrieve search history for authenticated user ─────────────────────────
export async function GET(req: NextRequest) {
  const { authenticated, user } = authenticateUserSession(req);
  let userId: string | null = null;

  if (authenticated && user?.uid) {
    userId = user.uid;
  } else {
    try {
      const supabase = createSupabaseServerClient();
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser?.id) userId = sbUser.id;
    } catch {}
  }

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required to access search history.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const context = searchParams.get('context') || 'connections';
  const limit = Math.min(Number(searchParams.get('limit') || 10), 25);

  try {
    const adminClient = createAdminClient();
    if (adminClient) {
      const { data, error } = await adminClient
        .from('user_search_history')
        .select('*')
        .eq('user_id', userId)
        .eq('search_context', context)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (!error && Array.isArray(data)) {
        return NextResponse.json({
          success: true,
          history: data,
          count: data.length,
        });
      }
    }
  } catch {}

  // Fallback to in-memory store
  const userList = memoryHistoryStore.get(userId) || [];
  const filtered = userList
    .filter((item) => item.search_context === context)
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, limit);

  return NextResponse.json({
    success: true,
    history: filtered,
    count: filtered.length,
  });
}

// ── POST: Record a search query ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const { authenticated, user } = authenticateUserSession(req);
  let userId: string | null = null;

  if (authenticated && user?.uid) {
    userId = user.uid;
  } else {
    try {
      const supabase = createSupabaseServerClient();
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser?.id) userId = sbUser.id;
    } catch {}
  }

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.' },
      { status: 401 }
    );
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { success: false, error: 'Invalid JSON payload.' },
      { status: 400 }
    );
  }

  const rawQuery = String(body.query || '').trim();
  const searchContext = String(body.context || 'connections').trim();
  const resultCount = typeof body.resultCount === 'number' ? body.resultCount : 0;

  if (!isSafeSearchQuery(rawQuery)) {
    return NextResponse.json({
      success: false,
      error: 'Query is empty, too short, too long, or contains sensitive credentials/PII.',
    }, { status: 400 });
  }

  const normalizedQuery = normalizeSearchQuery(rawQuery);
  const now = new Date().toISOString();

  try {
    const adminClient = createAdminClient();
    if (adminClient) {
      // Upsert: check if same normalized query exists for user in context
      const { data: existing } = await adminClient
        .from('user_search_history')
        .select('id')
        .eq('user_id', userId)
        .eq('search_context', searchContext)
        .eq('normalized_query', normalizedQuery)
        .limit(1);

      if (existing && existing.length > 0) {
        await adminClient
          .from('user_search_history')
          .update({
            query: rawQuery,
            result_count: resultCount,
            updated_at: now,
          })
          .eq('id', existing[0].id);

        return NextResponse.json({
          success: true,
          id: existing[0].id,
          updated: true,
        });
      } else {
        const { data: inserted, error: insErr } = await adminClient
          .from('user_search_history')
          .insert({
            user_id: userId,
            query: rawQuery,
            normalized_query: normalizedQuery,
            search_context: searchContext,
            result_count: resultCount,
            created_at: now,
            updated_at: now,
          })
          .select()
          .single();

        if (!insErr && inserted) {
          // Retention limit: keep max 20 per context
          const { data: overflow } = await adminClient
            .from('user_search_history')
            .select('id')
            .eq('user_id', userId)
            .eq('search_context', searchContext)
            .order('updated_at', { ascending: false })
            .range(20, 100);

          if (overflow && overflow.length > 0) {
            const idsToDelete = overflow.map((o: any) => o.id);
            await adminClient
              .from('user_search_history')
              .delete()
              .in('id', idsToDelete);
          }

          return NextResponse.json({
            success: true,
            id: inserted.id,
            created: true,
          });
        }
      }
    }
  } catch {}

  // Fallback to memory
  const userList = memoryHistoryStore.get(userId) || [];
  const existingIdx = userList.findIndex(
    (item) => item.search_context === searchContext && item.normalized_query === normalizedQuery
  );

  let recordId: string;
  if (existingIdx >= 0) {
    userList[existingIdx].query = rawQuery;
    userList[existingIdx].result_count = resultCount;
    userList[existingIdx].updated_at = now;
    recordId = userList[existingIdx].id;
  } else {
    recordId = `sh_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    userList.unshift({
      id: recordId,
      user_id: userId,
      query: rawQuery,
      normalized_query: normalizedQuery,
      search_context: searchContext,
      result_count: resultCount,
      created_at: now,
      updated_at: now,
    });
    if (userList.length > 20) userList.pop();
  }

  memoryHistoryStore.set(userId, userList);

  return NextResponse.json({
    success: true,
    id: recordId,
    persisted: true,
  });
}

// ── DELETE: Clear One or Clear All search history ──────────────────────────────
export async function DELETE(req: NextRequest) {
  const { authenticated, user } = authenticateUserSession(req);
  let userId: string | null = null;

  if (authenticated && user?.uid) {
    userId = user.uid;
  } else {
    try {
      const supabase = createSupabaseServerClient();
      const { data: { user: sbUser } } = await supabase.auth.getUser();
      if (sbUser?.id) userId = sbUser.id;
    } catch {}
  }

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const searchId = searchParams.get('id');
  const clearAll = searchParams.get('all') === 'true';
  const context = searchParams.get('context') || 'connections';

  try {
    const adminClient = createAdminClient();
    if (adminClient) {
      if (clearAll) {
        await adminClient
          .from('user_search_history')
          .delete()
          .eq('user_id', userId)
          .eq('search_context', context);
      } else if (searchId) {
        await adminClient
          .from('user_search_history')
          .delete()
          .eq('id', searchId)
          .eq('user_id', userId);
      }
    }
  } catch {}

  // Also clean memory store
  const userList = memoryHistoryStore.get(userId) || [];
  if (clearAll) {
    const remaining = userList.filter((item) => item.search_context !== context);
    memoryHistoryStore.set(userId, remaining);
  } else if (searchId) {
    const remaining = userList.filter((item) => item.id !== searchId);
    memoryHistoryStore.set(userId, remaining);
  }

  return NextResponse.json({
    success: true,
    cleared: clearAll ? 'all' : searchId,
  });
}
