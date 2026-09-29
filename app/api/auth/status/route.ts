import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserSession } from '@/lib/auth-guard';

/**
 * POST /api/auth/status
 * Updates the online/offline status for the authenticated user.
 * Called on login (available) and logout/beforeunload (offline).
 */

// In-memory status store — fallback cache
const statusStore = new Map<string, { status: 'available' | 'offline'; updatedAt: string }>();

export async function POST(req: NextRequest) {
  try {
    const auth = authenticateUserSession(req);
    if (!auth.authenticated || !auth.user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required to update presence status.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const status = body.status;

    if (!status || !['available', 'offline'].includes(status)) {
      return NextResponse.json({ error: 'Valid status (available|offline) is required.' }, { status: 400 });
    }

    // Only allow setting status for the authenticated user
    const uid = auth.user.uid;
    statusStore.set(uid, { status, updatedAt: new Date().toISOString() });

    return NextResponse.json({ success: true, uid, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Status update failed.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const auth = authenticateUserSession(req);
  if (!auth.authenticated || !auth.user) {
    return NextResponse.json(
      { success: false, error: 'Authentication required to query presence status.' },
      { status: 401 }
    );
  }

  const uid = req.nextUrl.searchParams.get('uid') || auth.user.uid;
  const record = statusStore.get(uid);
  return NextResponse.json({ uid, status: record?.status ?? 'offline', updatedAt: record?.updatedAt ?? null });
}
