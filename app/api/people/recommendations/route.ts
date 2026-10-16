/**
 * app/api/people/recommendations/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * GET /api/people/recommendations — Modular People Recommendation Endpoint
 * Returns personalized, explainable professional connection suggestions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserSession } from '@/lib/auth-guard';
import { peopleRecommendationEngine } from '@/lib/recommendations/engine';
import { redis } from '@/lib/redis';
import { z } from 'zod';

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export async function GET(req: NextRequest) {
  // 1. Authentication guard
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  if (!userAuth.authenticated || !userAuth.user) {
    return userAuth.errorResponse || NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const viewerId = userAuth.user.uid;

  // 2. Rate limiting check
  const rateLimit = await redis.checkRateLimit({
    action: 'people_recommendations',
    identifier: viewerId,
    limit: 60,
    windowSeconds: 60,
  });

  if (!rateLimit.allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many recommendation requests. Please slow down.',
        },
        code: 'RATE_LIMITED',
        retryAfter: rateLimit.resetSeconds,
      },
      { status: 429, headers: { 'Retry-After': String(rateLimit.resetSeconds) } }
    );
  }

  // 3. Validation
  const url = new URL(req.url);
  const parsed = querySchema.safeParse({
    limit: url.searchParams.get('limit') ?? 10,
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_PARAMETERS',
          message: 'Invalid limit parameter.',
          details: parsed.error.flatten(),
        },
      },
      { status: 400 }
    );
  }

  // 4. Recommendation execution with graceful degradation
  try {
    const recommendations = await peopleRecommendationEngine.getRecommendations(
      viewerId,
      parsed.data.limit
    );

    return NextResponse.json({
      success: true,
      data: recommendations,
      count: recommendations.length,
    });
  } catch (err: unknown) {
    console.error('[API/people/recommendations] Error:', err);
    // Graceful degradation: return empty array rather than failing core navigation
    return NextResponse.json({
      success: true,
      data: [],
      count: 0,
      degraded: true,
    });
  }
}
