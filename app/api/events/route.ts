import { NextRequest, NextResponse } from 'next/server';
import { recordEvents } from '@/lib/db/events';
import { getUserIntent, saveUserIntent } from '@/lib/db/intents';
import { IdempotentEvent, LogisticsIntent } from '@/lib/types';
import { authenticateUserSession } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  // ── Authentication guard ────────────────────────────────────────────────
  const { authenticated, user, errorResponse } = authenticateUserSession(req);
  if (!authenticated || !user) return errorResponse!;
  // ───────────────────────────────────────────────────────────────────────

  try {
    const body = await req.json();
    const rawEvents: IdempotentEvent[] = body.events || (body.event ? [body.event] : []);

    if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
      return NextResponse.json({ success: false, error: 'No events provided' }, { status: 400 });
    }

    if (rawEvents.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Payload too large: Event batches are capped at 100 events per request.' },
        { status: 413 }
      );
    }

    // Security: override actorId with the verified session uid — client cannot spoof a foreign actorId
    const events: IdempotentEvent[] = rawEvents.map((evt) => ({ ...evt, actorId: user.uid }));

    // Authoritative persistence in Supabase PostgreSQL
    await recordEvents(events);

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

          // Fetch or initialize intent from PostgreSQL
          const existingRow = await getUserIntent(evt.actorId);
          const existing: LogisticsIntent = {
            userId: evt.actorId,
            recentSearchedPorts: (existingRow?.recent_searched_ports as string[]) || [],
            viewedRates: (existingRow?.viewed_rates as string[]) || [],
            activeAuctionRoutes: (existingRow?.active_auction_routes as string[]) || [],
            savedTradeLanes: (existingRow?.saved_trade_lanes as string[]) || [],
            followedCommodities: (existingRow?.followed_commodities as string[]) || [],
            carrierSearches: (existingRow?.carrier_searches as string[]) || [],
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

          await saveUserIntent(existing);
        }
      }
    }

    return NextResponse.json({ success: true, count: events.length });
  } catch (err: any) {
    console.error('[API/events] Error handling telemetry events:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Internal error' }, { status: 500 });
  }
}
