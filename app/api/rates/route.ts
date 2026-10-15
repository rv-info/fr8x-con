import { NextRequest, NextResponse } from 'next/server';
import { getRates, getRateById, saveRate, deleteRate } from '@/lib/db/rates';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';
import { redis } from '@/lib/redis';

export async function GET(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);

  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const pol = searchParams.get('pol') || undefined;
    const pod = searchParams.get('pod') || undefined;
    const sp = searchParams.get('sp') || undefined;
    const ownerUid = searchParams.get('ownerUid') || undefined;

    const rates = await getRates({ pol, pod, sp, ownerUid });
    return NextResponse.json({ success: true, rates }, { status: 200 });
  } catch (err: any) {
    console.error('[API/rates] GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch rates' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);

  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const callerUid = userAuth.user?.uid || gfAuth.operator?.uid || 'anonymous';
    const rateLimit = await redis.checkRateLimit({
      action: 'rates_mutation',
      identifier: callerUid,
      limit: 60,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded: Too many rate submissions. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: 'Valid rate payload with id is required' },
        { status: 400 }
      );
    }

    // Ownership & Impersonation Prevention
    if (userAuth.authenticated && !gfAuth.authenticated) {
      const existing = await getRateById(body.id);
      if (existing) {
        const isOwner =
          existing.created_by === userAuth.user!.uid ||
          (existing as any).owner_uid === userAuth.user!.uid;
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

    const saved = await saveRate(body);
    return NextResponse.json({ success: true, rate: saved }, { status: 200 });
  } catch (err: any) {
    console.error('[API/rates] POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save rate' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  if (!userAuth.authenticated && !gfAuth.authenticated) {
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

    const existing = await getRateById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Rate card not found' },
        { status: 404 }
      );
    }

    // Ownership check for non-operator callers
    if (userAuth.authenticated && !gfAuth.authenticated) {
      const isOwner =
        existing.created_by === userAuth.user!.uid ||
        (existing as any).owner_uid === userAuth.user!.uid;
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to delete this rate.' },
          { status: 403 }
        );
      }
    }

    const deleted = await deleteRate(id);
    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (err: any) {
    console.error('[API/rates] DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete rate' },
      { status: 500 }
    );
  }
}

