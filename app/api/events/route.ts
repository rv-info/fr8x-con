import { NextRequest, NextResponse } from 'next/server';
import { recordIdempotentEventsBatchInDB, saveUserIntentInDB, getUserIntentFromDB } from '@/lib/firebase/firestore';
import { IdempotentEvent, LogisticsIntent } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const events: IdempotentEvent[] = body.events || (body.event ? [body.event] : []);

    if (!Array.isArray(events) || events.length === 0) {
      return NextResponse.json({ success: false, error: 'No events provided' }, { status: 400 });
    }

    // Persist events idempotently
    const count = await recordIdempotentEventsBatchInDB(events);

    // Extract logistics intent from search, rate-view, and auction events
    for (const evt of events) {
      if (
        evt.eventType === 'profile_search' ||
        evt.eventType === 'rate_view' ||
        evt.eventType === 'auction_bid' ||
        evt.eventType === 'post_impression'
      ) {
        const metadata = evt.metadata || {};
        const port = metadata.portLocode || metadata.port;
        const tradeLane = metadata.tradeLane;
        const carrier = metadata.carrier;
        const commodity = metadata.commodity;

        if (port || tradeLane || carrier || commodity) {
          const now = Date.now();
          const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days TTL

          // Fetch or initialize intent
          const existing = (await getUserIntentFromDB(evt.actorId)) || {
            userId: evt.actorId,
            recentSearchedPorts: [],
            viewedRates: [],
            activeAuctionRoutes: [],
            savedTradeLanes: [],
            followedCommodities: [],
            carrierSearches: [],
            lastActiveAt: new Date(now).toISOString(),
            expiresAt,
          };

          if (port && !existing.recentSearchedPorts.includes(port)) {
            existing.recentSearchedPorts = [port, ...existing.recentSearchedPorts].slice(0, 10);
          }
          if (tradeLane && !existing.activeAuctionRoutes.includes(tradeLane)) {
            existing.activeAuctionRoutes = [tradeLane, ...existing.activeAuctionRoutes].slice(0, 10);
          }
          if (carrier && !existing.carrierSearches.includes(carrier)) {
            existing.carrierSearches = [carrier, ...existing.carrierSearches].slice(0, 10);
          }
          if (commodity && !existing.followedCommodities.includes(commodity)) {
            existing.followedCommodities = [commodity, ...existing.followedCommodities].slice(0, 10);
          }
          existing.lastActiveAt = new Date(now).toISOString();
          existing.expiresAt = expiresAt;

          await saveUserIntentInDB(existing);
        }
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (err: any) {
    console.error('[API/events] Error handling telemetry events:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}
