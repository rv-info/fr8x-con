import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistedAuctions,
  savePersistedAuction,
  cancelPersistedAuction,
} from '@/lib/dbms/server-dbms';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';
import { Auction } from '@/lib/types';

export async function GET(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  const uidHeader = req.headers.get('x-fr8x-user-uid') || req.nextUrl?.searchParams?.get('uid');

  if (!userAuth.authenticated && !gfAuth.authenticated && !uidHeader) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const rawAuctions = getPersistedAuctions();

    // Deduplicate identical auctions to prevent duplicate records
    const seenSignatures = new Set<string>();
    const deduplicated: Auction[] = [];

    for (const a of rawAuctions) {
      if (!a || !a.id) continue;
      // Filter out any dummy seed IDs
      if (['RA-2026-0842', 'GB-2026-0311', 'RA-2026-0901', 'RA-2026-0788'].includes(a.id)) {
        continue;
      }

      const sig = `${a.creatorUid || ''}_${a.shipment?.pol || ''}_${a.shipment?.pod || ''}_${a.shipment?.commodity || ''}_${a.containers?.[0]?.equipmentType || ''}_${a.startDate || ''}`;
      if (seenSignatures.has(sig)) {
        continue;
      }
      seenSignatures.add(sig);
      deduplicated.push(a);
    }

    return NextResponse.json({ success: true, auctions: deduplicated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch reverse auctions' },
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
        { success: false, error: 'Valid auction payload with id is required' },
        { status: 400 }
      );
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    // Disallow back-dated bidding
    if (body.startDate && body.startDate < todayStr) {
      return NextResponse.json(
        { success: false, error: 'Back-dated bidding is strictly prohibited. Please select today or a future date.' },
        { status: 400 }
      );
    }

    if (body.shipment?.cargoReadyDate && body.shipment.cargoReadyDate < todayStr) {
      return NextResponse.json(
        { success: false, error: 'Cargo-ready date cannot be in the past. Please select today or a future date.' },
        { status: 400 }
      );
    }

    const callerUid = userAuth.user?.uid || uidHeader || body.creatorUid;
    if (callerUid && !body.creatorUid) {
      body.creatorUid = callerUid;
    }

    const saved = savePersistedAuction(body);
    return NextResponse.json({ success: true, auction: saved }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save auction' },
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
    let id = searchParams.get('id');

    if (!id) {
      const body = await req.json().catch(() => null);
      id = body?.id;
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Auction ID is required to cancel bidding' },
        { status: 400 }
      );
    }

    // Making bidding inactive and marked as cancelled (preserving audit record)
    const cancelled = cancelPersistedAuction(id);
    if (!cancelled) {
      return NextResponse.json(
        { success: false, error: 'Auction not found or could not be cancelled' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Auction cancelled and marked inactive.',
        auctionId: id,
        status: 'Cancelled',
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to cancel auction' },
      { status: 500 }
    );
  }
}
