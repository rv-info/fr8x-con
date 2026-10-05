/**
 * lib/db/auctions.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Reverse Freight Auctions.
 * Handles spot container bidding, reserve limits, countdowns, and bids.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { AuctionRow, AuctionBidRow } from '@/lib/supabase/types';

function mapToDbAuction(a: any): any {
  return {
    id: a.id || `RA-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
    title: a.title || 'Spot Container Auction',
    rfq_id: a.rfqId || a.rfq_id || null,
    creator_uid: a.creatorUid || a.creator_uid || null,
    creator_name: a.creatorName || a.creator_name || null,
    creator_company: a.creatorCompany || a.creator_company || null,
    auction_type: a.auctionType || a.auction_type || 'Specific bidder',
    start_date: a.startDate || a.start_date || new Date().toISOString().split('T')[0],
    start_time: a.startTime || a.start_time || '10:00',
    duration_minutes: Number(a.durationMinutes || a.duration_minutes) || 120,
    end_date_time: a.endDateTime || a.end_date_time || new Date(Date.now() + 120 * 60000).toISOString(),
    timezone: a.timezone || 'Asia/Kolkata',
    status: a.status || 'Draft',
    rank: a.rank || 'Pending',
    time_left: a.timeLeft || a.time_left || '120m',
    is_published: Boolean(a.isPublished ?? a.is_published),
    published_at: a.publishedAt || a.published_at || null,
    competition_ceiling: a.competitionCeiling != null ? Number(a.competitionCeiling) : null,
    bids_submitted_count: Number(a.bidsSubmittedCount || a.bids_submitted_count) || 0,
    payment_status: a.paymentStatus || a.payment_status || 'unpaid',
    posting_fee_inr: a.postingFeeINR != null ? Number(a.postingFeeINR) : 300,
    shipment: a.shipment || {},
    containers: a.containers || [],
    origin_charges: a.originCharges || a.origin_charges || {},
    destination_charges: a.destinationCharges || a.destination_charges || {},
    updated_at: new Date().toISOString(),
  };
}

export async function getAuctions(): Promise<AuctionRow[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[lib/db/auctions] getAuctions error:', error.message);
    throw new Error(`Failed to get auctions: ${error.message}`);
  }
  return data || [];
}

export async function getAuctionById(id: string): Promise<AuctionRow | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[lib/db/auctions] getAuctionById error:', error.message);
    throw new Error(`Failed to get auction by id: ${error.message}`);
  }
  return data;
}

export async function saveAuction(auction: any): Promise<AuctionRow> {
  const supabase = getDbClient();
  const payload = mapToDbAuction(auction);

  const { data, error } = await supabase
    .from('auctions')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/auctions] saveAuction error:', error.message);
    throw new Error(`Failed to save auction: ${error.message}`);
  }
  return data;
}

export async function cancelAuction(id: string): Promise<boolean> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from('auctions')
    .update({ status: 'Cancelled', updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    console.error('[lib/db/auctions] cancelAuction error:', error.message);
    throw new Error(`Failed to cancel auction: ${error.message}`);
  }
  return true;
}

export async function deleteAuction(id: string): Promise<boolean> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from('auctions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('[lib/db/auctions] deleteAuction error:', error.message);
    throw new Error(`Failed to delete auction: ${error.message}`);
  }
  return true;
}

export async function getAuctionBids(auctionId: string): Promise<AuctionBidRow[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('auction_bids')
    .select('*')
    .eq('auction_id', auctionId)
    .order('amount', { ascending: true });

  if (error) {
    console.error('[lib/db/auctions] getAuctionBids error:', error.message);
    throw new Error(`Failed to get auction bids: ${error.message}`);
  }
  return data || [];
}

export async function saveBid(bid: any): Promise<AuctionBidRow> {
  const supabase = getDbClient();
  const payload = {
    id: bid.id || `bid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    auction_id: bid.auctionId || bid.auction_id,
    bidder_id: bid.bidderId || bid.bidder_id,
    bidder_company: bid.bidderCompany || bid.bidder_company || null,
    amount: Number(bid.amount),
    transit_days: bid.transitDays || bid.transit_days || null,
    free_days: bid.freeDays || bid.free_days || null,
    carrier: bid.carrier || null,
    routing: bid.routing || null,
    remarks: bid.remarks || null,
    status: bid.status || 'active',
    submitted_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('auction_bids')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/auctions] saveBid error:', error.message);
    throw new Error(`Failed to save bid: ${error.message}`);
  }

  // Increment bids_submitted_count
  await supabase.rpc('increment_auction_bids', { a_id: payload.auction_id }).catch(() => {});

  return data;
}
