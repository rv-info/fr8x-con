import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';
import { redis } from '@/lib/redis';

export const runtime = 'nodejs';
export const maxDuration = 10;

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

    // Anti-shill bidding & self-participation protection: auction creator & owning company cannot bid
    const { data: bidderProfile } = await supabase
      .from('profiles')
      .select('company, company_name, organization')
      .eq('id', callerUid)
      .maybeSingle();

    const bidderCompany = (
      bidderProfile?.company ||
      bidderProfile?.company_name ||
      bidderProfile?.organization ||
      (sessionAuth.user as any)?.company ||
      (sessionAuth.user as any)?.companyName ||
      ''
    ).trim().toLowerCase();

    const auctionCompany = (
      auction.creator_company ||
      (auction as any).company_name ||
      ''
    ).trim().toLowerCase();

    const isSelfBid =
      auction.creator_uid === callerUid ||
      (auction as any).creator_id === callerUid ||
      (auctionCompany.length > 0 && bidderCompany.length > 0 && auctionCompany === bidderCompany);

    if (isSelfBid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Auction creator and owning company members are not eligible to submit bids on their own reverse auction.',
          code: 'SELF_BID_PROHIBITED',
        },
        { status: 403 }
      );
    }

    // A specific-bidder auction is an invitation-only tender. The invitation
    // list is persisted on the auction instead of trusting UI state.
    if ((auction.auction_type || '').toLowerCase() === 'specific bidder') {
      const selectedBidders = Array.isArray((auction as any).selected_bidders)
        ? (auction as any).selected_bidders
        : Array.isArray((auction as any).selectedBidders)
        ? (auction as any).selectedBidders
        : [];
      const isInvited = selectedBidders.some((bidder: any) => {
        const bId = String(bidder?.id || bidder?.uid || bidder?.userId || bidder?.user_id || '');
        const bComp = String(bidder?.company || bidder?.company_name || '').trim().toLowerCase();
        return (bId && bId === callerUid) || (bidderCompany && bComp && bidderCompany === bComp);
      });
      if (!isInvited) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: This is an invitation-only reverse auction. Your organisation is not on the invited bidder list.' },
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

    // Acquire distributed lock on auction to handle concurrent bids & prevent race conditions during ranking recalculation
    lockKey = `auction_bid_lock:${auctionId}`;
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
        bidder_company: bidderCompany || (sessionAuth.user as any)?.company || sessionAuth.user?.companyId || '',
        amount: bidAmount,
        grand_total_usd: bidAmount,
        currency: bid.currency || 'USD',
        charges: bid.charges || [],
        notes: bid.notes || '',
        status: 'active',
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (bidError) {
      return NextResponse.json({ success: false, error: bidError.message }, { status: 500 });
    }

    // Query all active bids for this auction to calculate deterministic server ranks
    const { data: allAuctionBids } = await supabase
      .from('auction_bids')
      .select('id, amount, grand_total_usd, bidder_uid, bidder_name, bidder_company, created_at')
      .eq('auction_id', auctionId)
      .eq('status', 'active');

    // Sort by evaluated price ascending (lowest price = Rank 1 in reverse auction)
    // Tie breaker: earliest created_at ascending, then deterministic id ascending
    const sortedBids = (allAuctionBids || []).slice().sort((a: any, b: any) => {
      const priceA = Number(a.grand_total_usd || a.amount || 0);
      const priceB = Number(b.grand_total_usd || b.amount || 0);
      if (priceA !== priceB) return priceA - priceB;
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      if (timeA !== timeB) return timeA - timeB;
      return String(a.id).localeCompare(String(b.id));
    });

    let callerRank = 1;
    const ranksMap: Record<string, number> = {};

    for (let i = 0; i < sortedBids.length; i++) {
      const bItem = sortedBids[i];
      const rankVal = i + 1;
      ranksMap[bItem.bidder_uid] = rankVal;
      if (bItem.id === bid.id) {
        callerRank = rankVal;
      }
      await supabase
        .from('auction_bids')
        .update({ rank: rankVal })
        .eq('id', bItem.id);
    }

    const leadingBid = sortedBids[0];
    const leadingAmount = leadingBid ? Number(leadingBid.grand_total_usd || leadingBid.amount || 0) : bidAmount;

    // Check Anti-Sniping (Auto-Extension): if active bid arrives within final 2 minutes, extend by 3 minutes
    let newEndDateTime: string | null = null;
    const rules = (auction.rules || {}) as any;
    if (rules.autoExtension && auction.end_date_time) {
      const nowMs = Date.now();
      const closeMs = new Date(auction.end_date_time).getTime();
      const timeRemainingMs = closeMs - nowMs;
      if (timeRemainingMs > 0 && timeRemainingMs <= 120000) {
        newEndDateTime = new Date(closeMs + 180000).toISOString();
      }
    }

    // Update auction metadata
    const auctionUpdatePayload: any = {
      bids_submitted_count: sortedBids.length,
      rank: `#1: $${leadingAmount.toFixed(2)} USD`,
      updated_at: new Date().toISOString(),
    };
    if (newEndDateTime) {
      auctionUpdatePayload.end_date_time = newEndDateTime;
    }

    await supabase
      .from('auctions')
      .update(auctionUpdatePayload)
      .eq('id', auctionId);

    // Broadcast Realtime Event to channel `auction_${auctionId}`
    const serverTimestamp = new Date().toISOString();
    try {
      const channel = supabase.channel(`auction_${auctionId}`);
      await channel.send({
        type: 'broadcast',
        event: 'AUCTION_BID_UPDATE',
        payload: {
          auctionId,
          bidId: bid.id,
          bidderUid: callerUid,
          bidAmount,
          rank: callerRank,
          leadingAmount,
          bidsCount: sortedBids.length,
          serverTimestamp,
          newEndDateTime,
          ranksMap,
          anonymizedLabel: (rules.bidderAnonymity || rules.hideCompetitorNames)
            ? `Bidder #${callerRank}`
            : (sessionAuth.user as any)?.company || 'Verified Forwarder',
        },
      });
      supabase.removeChannel(channel);
    } catch (realtimeErr) {
      console.warn('[Realtime Broadcast] Non-blocking broadcast notice:', realtimeErr);
    }

    // Insert audit log
    await supabase.from('audit_logs').insert({
      action: 'BID_SUBMITTED',
      target_id: bid.id,
      actor_id: callerUid,
      actor_email: callerEmail,
      details: {
        auctionId,
        bidAmount,
        rank: callerRank,
        antiSnipingExtended: Boolean(newEndDateTime),
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Bid accepted, authoritative rank computed, and broadcast live.',
      bidId: bid.id,
      auctionId,
      rank: callerRank,
      leadingAmount,
      isRank1: callerRank === 1,
      bidsCount: sortedBids.length,
      serverTimestamp,
      newEndDateTime,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  } finally {
    if (lockKey) {
      await redis.releaseLock('auction_bid', lockKey).catch(() => {});
    }
  }
}
