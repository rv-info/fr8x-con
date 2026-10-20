import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';

/**
 * POST /api/auctions/bid
 * Authoritative Supabase PostgreSQL bid submission engine
 * Enforces server-controlled auction statuses, timing, concurrency locks, and anti-shill protections.
 */
export async function POST(req: NextRequest) {
  let lockKey: string | null = null;
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

    // Rate limit bidding to prevent DoS / high-frequency flooding
    const rateLimit = await redis.checkRateLimit({
      action: 'auction_bid',
      identifier: callerUid,
      limit: 30,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many bid submissions. Please wait a moment before submitting again.' },
        { status: 429 }
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

    // Verify auction exists and inspect current status
    const { data: auction, error: auctionError } = await supabase
      .from('auctions')
      .select('*')
      .eq('id', auctionId)
      .maybeSingle();

    if (auctionError || !auction) {
      return NextResponse.json({ success: false, error: 'Auction not found' }, { status: 404 });
    }

    // Server-enforced auction status rules
    const normalizedStatus = (auction.status || '').toLowerCase();
    if (normalizedStatus === 'cancelled' || normalizedStatus === 'closed' || normalizedStatus === 'settled') {
      return NextResponse.json(
        { success: false, error: `Bidding rejected: Auction is currently '${auction.status}' and closed to new bids.` },
        { status: 400 }
      );
    }

    // Server-controlled timing enforcement
    if (auction.end_date_time && new Date(auction.end_date_time) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'Bidding rejected: Auction bidding window has closed.' },
        { status: 400 }
      );
    }

    // Anti-shill bidding protection: auction creator cannot bid on their own reverse auction
    if (auction.creator_uid === callerUid || (auction as any).creator_id === callerUid) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Auction creator is not eligible to submit bids on their own reverse auction.' },
        { status: 403 }
      );
    }

    // A specific-bidder auction is an invitation-only tender.  The invitation
    // list is persisted on the auction instead of trusting UI state.
    if ((auction.auction_type || '').toLowerCase() === 'specific bidder') {
      const selectedBidders = Array.isArray((auction as any).selected_bidders)
        ? (auction as any).selected_bidders
        : [];
      const isInvited = selectedBidders.some((bidder: any) =>
        [bidder?.id, bidder?.uid, bidder?.userId, bidder?.user_id]
          .filter(Boolean)
          .some((id) => String(id) === callerUid)
      );
      if (!isInvited) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: This is an invitation-only auction.' },
          { status: 403 }
        );
      }
    }

    const blockedBidders = Array.isArray((auction as any).blocked_bidders)
      ? (auction as any).blocked_bidders : [];
    if (blockedBidders.some((id: unknown) => String(id) === callerUid)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: You are blocked from this auction.' },
        { status: 403 }
      );
    }

    // Competition ceiling enforcement
    if (auction.competition_ceiling != null && bidAmount > auction.competition_ceiling) {
      return NextResponse.json(
        { success: false, error: `Bid rejected: Amount ($${bidAmount}) exceeds competition reserve ceiling ($${auction.competition_ceiling}).` },
        { status: 400 }
      );
    }

    // Acquire distributed lock on auction and bidder to handle concurrent bids & prevent race conditions
    lockKey = `${auctionId}:${callerUid}`;
    const acquired = await redis.acquireLock('auction_bid', lockKey, 10);
    if (!acquired) {
      return NextResponse.json(
        { success: false, error: 'A bid submission is already being processed for this auction. Please retry in a moment.' },
        { status: 409 }
      );
    }

    // Idempotency: verify this specific bid ID was not already inserted
    const { data: existingBid } = await supabase
      .from('auction_bids')
      .select('id')
      .eq('id', bid.id)
      .maybeSingle();

    if (existingBid) {
      return NextResponse.json(
        { success: false, error: 'Duplicate request: A bid with this ID was already accepted.' },
        { status: 409 }
      );
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
        amount: bidAmount,
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
  } finally {
    if (lockKey) {
      await redis.releaseLock('auction_bid', lockKey).catch(() => {});
    }
  }
}
