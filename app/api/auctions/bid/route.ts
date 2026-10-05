import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';

export const runtime = 'nodejs';

/**
 * POST /api/auctions/bid
 * Authoritative Supabase PostgreSQL bid submission engine
 */
export async function POST(req: NextRequest) {
  try {
    const sessionAuth = authenticateUserSession(req);
    const gfAuth = authenticateGodfatherOperator(req);

    const callerUid = sessionAuth.user?.uid || gfAuth.operator?.uid;
    const callerEmail = sessionAuth.user?.email || gfAuth.operator?.email || '';

    if (!callerUid) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Valid authentication token or session required.' },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.auctionId || !body.bid || !body.bid.id) {
      return NextResponse.json(
        { success: false, error: 'Bad Request: auctionId and bid payload with id are required.' },
        { status: 400 }
      );
    }

    const { auctionId, bid } = body;
    const bidAmount = Number(bid.grandTotalUSD || bid.amount || 0);

    if (bidAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Bad Request: Valid positive bid amount is required.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Verify auction exists
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auctionId)
      .maybeSingle();

    if (auctionError || !auction) {
      return NextResponse.json({ success: false, error: 'Auction not found' }, { status: 404 });
    }

    // Insert bid into auction_bids
    const { data: insertedBid, error: bidError } = await supabase
      .from('auction_bids')
      .insert({
        id: bid.id,
        auction_id: auctionId,
        bidder_uid: callerUid,
        bidder_name: (sessionAuth.user as any)?.displayName || callerEmail,
        bidder_company: (sessionAuth.user as any)?.company || sessionAuth.user?.companyId || '',
        grand_total_usd: bidAmount,
        currency: bid.currency || 'USD',
        charges: bid.charges || [],
        notes: bid.notes || '',
      })
      .select()
      .single();

    if (bidError) {
      return NextResponse.json({ success: false, error: bidError.message }, { status: 500 });
    }

    // Increment bids_submitted_count
    await supabase
      .from('auctions')
      .update({
        bids_submitted_count: (auction.bids_submitted_count || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', auctionId);

    // Insert audit log
    await supabase.from('audit_logs').insert({
      action: 'BID_SUBMITTED',
      target_id: bid.id,
      actor_id: callerUid,
      actor_email: callerEmail,
      details: {
        auctionId,
        bidAmount,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bid accepted and recorded in Supabase PostgreSQL.',
      bidId: bid.id,
      auctionId,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
