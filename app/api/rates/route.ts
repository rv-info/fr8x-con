import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistedRates,
  savePersistedRate,
  deletePersistedRate,
} from '@/lib/dbms/server-dbms';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  const uidHeader = req.headers.get('x-fr8x-user-uid') || req.nextUrl?.searchParams?.get('uid');

  if (!userAuth.authenticated && !gfAuth.authenticated && !uidHeader) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const rates = getPersistedRates();
    return NextResponse.json({ success: true, rates }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch rates' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  const uidHeader = req.headers.get('x-fr8x-user-uid');

  if (!userAuth.authenticated && !gfAuth.authenticated && !uidHeader) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: 'Valid rate payload with id is required' },
        { status: 400 }
      );
    }

    // Ownership & Impersonation Prevention
    if (userAuth.authenticated && !gfAuth.authenticated) {
      const existing = getPersistedRates().find((r) => r.id === body.id);
      if (existing) {
        const isOwner =
          existing.createdBy === userAuth.user!.uid ||
          existing.ownerUid === userAuth.user!.uid;
        if (!isOwner) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: You cannot modify another enterprise’s rate card.' },
            { status: 403 }
          );
        }
      }
      body.createdBy = userAuth.user!.uid;
      body.ownerUid = userAuth.user!.uid;
    }

    const saved = savePersistedRate(body);

    // Best-effort Firestore sync if Admin SDK configured
    try {
      const { getAdminDb } = await import('@/lib/firebase/admin');
      const adminDb = getAdminDb();
      if (adminDb && typeof adminDb.collection === 'function') {
        await adminDb.collection('rates').doc(saved.id).set(saved, { merge: true });
      }
    } catch {}

    return NextResponse.json({ success: true, rate: saved }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save rate' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  const uidHeader = req.headers.get('x-fr8x-user-uid');
  if (!userAuth.authenticated && !gfAuth.authenticated && !uidHeader) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Rate ID parameter is required' },
        { status: 400 }
      );
    }

    // Ownership check for non-operator callers
    if (userAuth.authenticated && !gfAuth.authenticated) {
      const existing = getPersistedRates().find((r) => r.id === id);
      if (existing) {
        const isOwner =
          existing.createdBy === userAuth.user!.uid ||
          existing.ownerUid === userAuth.user!.uid;
        if (!isOwner) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: You do not have permission to delete this rate.' },
            { status: 403 }
          );
        }
      }
    }

    const deleted = deletePersistedRate(id);

    try {
      const { getAdminDb } = await import('@/lib/firebase/admin');
      const adminDb = getAdminDb();
      if (adminDb && typeof adminDb.collection === 'function') {
        await adminDb.collection('rates').doc(id).delete();
      }
    } catch {}

    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete rate' },
      { status: 500 }
    );
  }
}
