import { NextRequest, NextResponse } from 'next/server';
import { savePersistedPresence, getPersistedUserPresence } from '@/lib/dbms/server-dbms';
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

    // 1. Authoritative persistence in server-side DBMS
    savePersistedPresence(data);

    return NextResponse.json({ success: true });
  } catch (err: any) {
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

    // 1. Check server DBMS persistence
    const presence = getPersistedUserPresence(userId);

    return NextResponse.json({
      success: true,
      presence: presence || { userId, status: 'offline' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error' }, { status: 500 });
  }
}
