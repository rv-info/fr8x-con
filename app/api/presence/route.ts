import { NextRequest, NextResponse } from 'next/server';
import { saveUserPresence, getUserPresence } from '@/lib/db/presence';
import { UserPresenceState } from '@/lib/types';
import { authenticateUserSession } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  // ── Authentication guard ────────────────────────────────────────────────
  const { authenticated, user, errorResponse } = authenticateUserSession(req);
  if (!authenticated || !user) return errorResponse!;
  // ───────────────────────────────────────────────────────────────────────

  try {
    const data: UserPresenceState = await req.json().catch(() => ({}) as any);
    if (!data || !data.userId) {
      return NextResponse.json({ success: false, error: 'Invalid presence payload' }, { status: 400 });
    }

    // Security: a user may only update their own presence record
    if (data.userId !== user.uid) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Cannot update presence for another user.', code: 'PRESENCE_FORBIDDEN' },
        { status: 403 }
      );
    }

    // Authoritative persistence in Supabase PostgreSQL
    await saveUserPresence(data);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[API/presence] POST error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // ── Authentication guard ────────────────────────────────────────────────
  const { authenticated, errorResponse } = authenticateUserSession(req);
  if (!authenticated) return errorResponse!;
  // ───────────────────────────────────────────────────────────────────────

  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }

    // Authoritative check in Supabase PostgreSQL
    const presence = await getUserPresence(userId);

    return NextResponse.json({
      success: true,
      presence: presence || { userId, status: 'offline' },
    });
  } catch (err: any) {
    console.error('[API/presence] GET error:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Error' }, { status: 500 });
  }
}
