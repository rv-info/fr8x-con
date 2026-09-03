import { NextRequest, NextResponse } from 'next/server';
import { getPostsFromDB, getRankingConfigFromDB, getUserIntentFromDB } from '@/lib/firebase/firestore';
import { feedRankingEngine } from '@/lib/ranking/engine';
import { DEFAULT_RANKING_CONFIG } from '@/lib/ranking/config';
import { FeedSurface } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const surface: FeedSurface = body.surface || 'home';
    const viewer = body.viewer || null;
    const limitCount = body.limit || 25;

    // 1. Fetch raw candidate posts
    const { posts } = await getPostsFromDB({ limitCount: 100 });

    // 2. Fetch ranking config and user intent
    const config = (await getRankingConfigFromDB()) || DEFAULT_RANKING_CONFIG;
    const intent = viewer?.uid ? await getUserIntentFromDB(viewer.uid) : null;

    // 3. Execute two-stage ranking
    const rankedPosts = feedRankingEngine.rankFeed(posts, {
      viewer,
      surface,
      config,
      activeIntent: intent,
      recentlyViewedPostIds: body.recentlyViewedPostIds || [],
      reportedPostIds: body.reportedPostIds || [],
      blockedAuthorUids: body.blockedAuthorUids || [],
    });

    const paginated = rankedPosts.slice(0, limitCount);

    return NextResponse.json({
      success: true,
      surface,
      count: paginated.length,
      totalCandidates: posts.length,
      posts: paginated,
      rankingVersion: config.version,
    });
  } catch (err: any) {
    console.error('[API/feed/rank] Error ranking feed:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Ranking failed' },
      { status: 500 }
    );
  }
}
