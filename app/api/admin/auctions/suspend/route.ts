import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { auctionId, reason, operatorUid } = body;

    if (!auctionId || !reason) {
      return NextResponse.json({ error: 'Missing auction ID or mandatory compliance suspension reason' }, { status: 400 });
    }

    const correlationId = `GF-AUC-SUSP-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: true,
      auctionId,
      status: 'Cancelled',
      correlationId,
      message: `Auction ${auctionId} suspended under compliance hold`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
