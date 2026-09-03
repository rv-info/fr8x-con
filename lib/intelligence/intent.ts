/**
 * lib/intelligence/intent.ts
 * Short-lived, privacy-safe logistics intent feature store with automatic 7-day TTL expiry.
 */

import { LogisticsIntent } from '@/lib/types';
import { getUserIntentFromDB, saveUserIntentInDB } from '@/lib/firebase/firestore';

const INTENT_TTL_DAYS = 7;

export class IntentEngine {
  /**
   * Records a user intent signal (port search, rate view, lane save, commodity follow)
   */
  public async trackIntentSignal(
    userId: string,
    signal: {
      port?: string;
      rateId?: string;
      tradeLane?: string;
      carrier?: string;
      commodity?: string;
    }
  ): Promise<void> {
    if (!userId) return;

    const now = Date.now();
    const expiresAt = new Date(now + INTENT_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();

    let intent = await getUserIntentFromDB(userId);
    if (!intent) {
      intent = {
        userId,
        recentSearchedPorts: [],
        viewedRates: [],
        activeAuctionRoutes: [],
        savedTradeLanes: [],
        followedCommodities: [],
        carrierSearches: [],
        lastActiveAt: new Date(now).toISOString(),
        expiresAt,
      };
    }

    if (signal.port && !intent.recentSearchedPorts.includes(signal.port)) {
      intent.recentSearchedPorts = [signal.port, ...intent.recentSearchedPorts].slice(0, 10);
    }
    if (signal.rateId && !intent.viewedRates.includes(signal.rateId)) {
      intent.viewedRates = [signal.rateId, ...intent.viewedRates].slice(0, 20);
    }
    if (signal.tradeLane && !intent.savedTradeLanes.includes(signal.tradeLane)) {
      intent.savedTradeLanes = [signal.tradeLane, ...intent.savedTradeLanes].slice(0, 10);
    }
    if (signal.carrier && !intent.carrierSearches.includes(signal.carrier)) {
      intent.carrierSearches = [signal.carrier, ...intent.carrierSearches].slice(0, 10);
    }
    if (signal.commodity && !intent.followedCommodities.includes(signal.commodity)) {
      intent.followedCommodities = [signal.commodity, ...intent.followedCommodities].slice(0, 10);
    }

    intent.lastActiveAt = new Date(now).toISOString();
    intent.expiresAt = expiresAt;

    await saveUserIntentInDB(intent);
  }

  /**
   * Evaluates how strongly a post aligns with the user's short-lived active intent.
   * Returns a multiplier between 1.0 (neutral) and 1.4 (high intent match).
   */
  public evaluateIntentBoost(
    intent: LogisticsIntent | null,
    postPorts: string[] = [],
    postLane?: string,
    postTags: string[] = []
  ): { multiplier: number; explanation?: string } {
    if (!intent) return { multiplier: 1.0 };

    // Check if intent is expired
    if (new Date(intent.expiresAt).getTime() < Date.now()) {
      return { multiplier: 1.0 };
    }

    // 1. Port match
    for (const p of postPorts) {
      if (intent.recentSearchedPorts.includes(p)) {
        return {
          multiplier: 1.35,
          explanation: `Matches your recent search for port ${p}`,
        };
      }
    }

    // 2. Route / Trade Lane match
    if (postLane) {
      for (const lane of intent.activeAuctionRoutes.concat(intent.savedTradeLanes)) {
        if (lane.toLowerCase().includes(postLane.toLowerCase()) || postLane.toLowerCase().includes(lane.toLowerCase())) {
          return {
            multiplier: 1.30,
            explanation: `Aligned with your active trade lane ${postLane}`,
          };
        }
      }
    }

    // 3. Commodity match
    for (const tag of postTags) {
      if (intent.followedCommodities.some((c) => c.toLowerCase() === tag.toLowerCase())) {
        return {
          multiplier: 1.20,
          explanation: `Relevant to your followed commodity: ${tag}`,
        };
      }
    }

    return { multiplier: 1.0 };
  }
}

export const intentEngine = new IntentEngine();
