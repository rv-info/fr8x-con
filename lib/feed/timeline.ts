/**
 * lib/feed/timeline.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Scalable Fan-Out On Read Activity Feed Timeline Engine
 *
 * Implements:
 * 1. Candidate retrieval from eligible sources (public, connected, network).
 * 2. Strict authorization & block filtering (bidirectional exclusion).
 * 3. Fast de-duplication (author + normalized text signature window).
 * 4. Two-stage hybrid ranking via FeedRankingEngine (freshness decay + engagement).
 * 5. Deterministic cursor-based pagination.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { FeedPost, FeedSurface, UserProfile } from '@/lib/types';
import { feedRankingEngine } from '@/lib/ranking/engine';
import { DEFAULT_RANKING_CONFIG } from '@/lib/ranking/config';
import { peopleDirectoryStore } from '@/lib/people-directory';
import { safeCache } from '@/lib/cache/safe-cache';

export interface TimelineParams {
  viewerId: string;
  viewerRole?: string;
  viewerCompany?: string;
  surface?: FeedSurface;
  limit?: number;
  cursor?: string | null;
  reportedPostIds?: string[];
}

export interface TimelineResult {
  posts: FeedPost[];
  count: number;
  totalCandidates: number;
  nextCursor: string | null;
  hasMore: boolean;
}

export class TimelineEngine {
  /**
   * Generates a personalized timeline using Fan-out on Read.
   */
  public generateTimeline(
    rawPosts: FeedPost[],
    params: TimelineParams
  ): TimelineResult {
    const viewerId = params.viewerId;
    const limit = Math.min(Math.max(params.limit || 20, 1), 50);
    const surface: FeedSurface = params.surface || 'home';

    // 1. Candidate filtering & block exclusion
    const candidatePosts = rawPosts.filter((post) => {
      // Must be published & not deleted
      if (post.status === 'deleted' || post.status === 'hidden' || post.isHidden) {
        if (!viewerId || post.authorUid !== viewerId) return false;
      }

      // Check author block relationships
      if (post.authorUid && viewerId) {
        if (peopleDirectoryStore.isBlocked(viewerId, post.authorUid) ||
            peopleDirectoryStore.isBlocked(post.authorUid, viewerId)) {
          return false;
        }
      }

      return true;
    });

    // 2. De-duplication (same author + content signature within 5 min window)
    const seenSignatures = new Set<string>();
    const deduplicated: FeedPost[] = [];

    for (const post of candidatePosts) {
      const author = post.authorUid || (post as any).authorId || 'system';
      const text = (post.text || (post as any).content || '').trim().toLowerCase();
      const timeSlice = (post.createdAt || post.time || '').slice(0, 16);
      const signature = `${author}::${text}::${timeSlice}`;

      if (seenSignatures.has(signature)) continue;
      seenSignatures.add(signature);
      deduplicated.push(post);
    }

    // 3. Two-Stage Personalized Hybrid Ranking
    const viewer: Partial<UserProfile> = {
      uid: viewerId,
      role: (params.viewerRole as any) || 'user',
      company: params.viewerCompany,
    };

    const rankedPosts = feedRankingEngine.rankFeed(deduplicated, {
      viewer,
      surface,
      config: DEFAULT_RANKING_CONFIG,
      reportedPostIds: params.reportedPostIds || [],
      blockedAuthorUids: [],
    });

    // 4. Cursor Pagination (based on created_at or id index)
    let startIndex = 0;
    if (params.cursor) {
      const idx = rankedPosts.findIndex((p) => p.id === params.cursor);
      if (idx !== -1) {
        startIndex = idx + 1;
      }
    }

    const pagePosts = rankedPosts.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < rankedPosts.length;
    const nextCursor = hasMore && pagePosts.length > 0 ? pagePosts[pagePosts.length - 1].id : null;

    return {
      posts: pagePosts,
      count: pagePosts.length,
      totalCandidates: rankedPosts.length,
      nextCursor,
      hasMore,
    };
  }
}

export const timelineEngine = new TimelineEngine();
