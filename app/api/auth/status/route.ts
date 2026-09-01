import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/auth/status
 * Updates the online/offline status for the authenticated user.
 * Called on login (available) and logout/beforeunload (offline).
 *
 * In production: write to Firestore / Redis keyed by uid.
 */

// In-memory status store — replace with Firestore or Redis in production
const statusStore = new Map<string, { status: 'available' | 'offline'; updatedAt: string }>();

export async function POST(req: NextRequest) {
  try {
    const { uid, status } = await req.json();

    if (!uid || !['available', 'offline'].includes(status)) {
      return NextResponse.json({ error: 'uid and status (available|offline) are required.' }, { status: 400 });
    }

    statusStore.set(uid, { status, updatedAt: new Date().toISOString() });

    return NextResponse.json({ success: true, uid, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Status update failed.' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get('uid');
  if (!uid) return NextResponse.json({ error: 'uid param required.' }, { status: 400 });

  const record = statusStore.get(uid);
  return NextResponse.json({ uid, status: record?.status ?? 'offline', updatedAt: record?.updatedAt ?? null });
}
