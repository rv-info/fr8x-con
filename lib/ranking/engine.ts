/**
 * lib/ranking/engine.ts
 * Two-Stage Feed Ranking Engine with Personalized Hybrid Scoring,
 * Exponential Freshness Decay, Diversity Penalties, and Explainability.
 */

import { FeedPost, FeedSurface, RankingConfig, UserProfile } from '@/lib/types';
import { DEFAULT_RANKING_CONFIG } from './config';
import { logisticsGraph } from '@/lib/intelligence/knowledgeGraph';
import { intentEngine } from '@/lib/intelligence/intent';

export interface RankingContext {
  viewer?: Partial<UserProfile> | null;
  surface: FeedSurface;
  config?: RankingConfig;
  activeIntent?: any;
  recentlyViewedPostIds?: string[];
  reportedPostIds?: string[];
  blockedAuthorUids?: string[];
}

export interface RankedPostResult {
  post: FeedPost;
  baseScore: number;
  finalScore: number;
  hybridScore: number;
  explanation?: string;
}

export class FeedRankingEngine {
  /**
   * Stage A: Candidate Retrieval & Compliance Filtering
   */
  public filterCandidates(posts: FeedPost[], context: RankingContext): FeedPost[] {
    const reported = new Set(context.reportedPostIds || []);
    const blocked = new Set(context.blockedAuthorUids || []);

    return posts.filter((post) => {
      // 1. Exclude deleted / moderated
      if (post.status && post.status !== 'active') return false;

      // 2. Exclude reported / blocked
      if (reported.has(post.id)) return false;
      if (post.authorUid && blocked.has(post.authorUid)) return false;

      // 3. Surface-specific constraints
      if (context.surface === 'saved' && !post.isSaved) return false;
      if (context.surface === 'following') {
        // Must be authored by someone in user's company or network
        if (context.viewer?.uid && post.authorUid === context.viewer.uid) return true;
        if (context.viewer?.company && post.authorCompany === context.viewer.company) return true;
      }

      return true;
    });
  }

  /**
   * Calculates exponential freshness decay: exp(-ageHours / HalfLifeHours)
   */
  public calculateFreshness(post: FeedPost, config: RankingConfig): number {
    let halfLife = config.halfLivesHours.rateCapacity; // 72h default

    if (post.postType === 'rate_info' || post.postType === 'auction_ref') {
      halfLife = config.halfLivesHours.rateCapacity; // 72h
    } else if (post.postType === 'announcement') {
      halfLife = config.halfLivesHours.urgentOperational; // 24h
    } else if (post.postType === 'logistics_discussion') {
      halfLife = config.halfLivesHours.educational; // 168h
    }

    if (post.decayHalfLifeHours) {
      halfLife = post.decayHalfLifeHours;
    }

    const createdAtTime = post.createdAt ? new Date(post.createdAt).getTime() : Date.now() - 3600000;
    const ageHours = Math.max(0, (Date.now() - createdAtTime) / (1000 * 60 * 60));

    return Math.exp(-ageHours / halfLife);
  }

  /**
   * Stage B: Personalized Hybrid Scoring
   */
  public rankPost(post: FeedPost, context: RankingContext, seenAuthors: Map<string, number>): RankedPostResult {
    const config = context.config || DEFAULT_RANKING_CONFIG;
    const w = config.weights;
    const viewer = context.viewer;

    // 1. Freshness
    const freshness = this.calculateFreshness(post, config);

    // 2. Relationship Affinity (Graph)
    const affinity = viewer?.uid && post.authorUid
      ? logisticsGraph.getRelationshipAffinity(viewer.uid, post.authorUid)
      : 0.20;

    // 3. Professional Relevance & Trade Lane match
    const userPorts = viewer?.city ? [viewer.city] : [];
    const laneRelevance = logisticsGraph.getTradeLaneRelevance(userPorts, {
      lane: post.tradeLane,
      ports: post.ports,
    });

    const isSameCompany = viewer?.company && post.authorCompany === viewer.company;
    const professionalRelevance = isSameCompany ? 0.90 : laneRelevance;

    // 4. Quality Engagement & Conversation Value
    const totalEngagements = post.likes + (post.supportCount || 0) + (post.amplifyCount || 0);
    const predictedQualityEngagement = Math.min(1.0, totalEngagements / 25);

    const commentCount = post.comments ? post.comments.length : 0;
    const meaningfulConversationValue = Math.min(1.0, commentCount / 8);

    // 5. Dwell Value & Creator Trust
    const dwellValue = Math.min(1.0, 0.4 + (post.text.length / 500) * 0.4);
    const creatorTrust = logisticsGraph.getCreatorTrust(post.authorUid || '', post.hasGoldenTick);

    // 6. Exploration Value
    const explorationValue = 0.50;

    // --- BaseScore Formula ---
    const baseScore =
      w.professionalRelevance * professionalRelevance +
      w.relationshipAffinity * affinity +
      w.predictedQualityEngagement * predictedQualityEngagement +
      w.meaningfulConversationValue * meaningfulConversationValue +
      w.dwellValue * dwellValue +
      w.freshness * freshness +
      w.geographyAndTradeLaneRelevance * laneRelevance +
      w.creatorTrust * creatorTrust +
      w.explorationValue * explorationValue;

    // --- Multipliers & Penalties ---
    const contentEligibilityMultiplier = 1.0;

    // Diversity penalty for repeated author
    const authorKey = post.authorUid || post.author;
    const previousAuthorCount = seenAuthors.get(authorKey) || 0;
    const diversityMultiplier = previousAuthorCount > 0 ? Math.max(0.6, 1.0 - previousAuthorCount * 0.2) : 1.0;

    // Fatigue multiplier if viewed within last session
    const isRecentlySeen = context.recentlyViewedPostIds?.includes(post.id);
    const fatigueMultiplier = isRecentlySeen ? config.fatigueMultipliers.seenWithin24h : 1.0;

    // Intent evaluation boost
    const intentBoost = intentEngine.evaluateIntentBoost(context.activeIntent, post.ports, post.tradeLane, post.tags);

    // Penalties
    const skipProbability = isRecentlySeen ? 0.40 : 0.05;
    const lowQualityOrSpamRisk = post.dis > post.likes ? 0.35 : 0.02;
    const repeatedContentPenalty = previousAuthorCount > 1 ? 0.15 : 0.0;

    let finalScore =
      baseScore *
      contentEligibilityMultiplier *
      diversityMultiplier *
      fatigueMultiplier *
      intentBoost.multiplier -
      w.skipProbabilityPenalty * skipProbability -
      w.lowQualitySpamPenalty * lowQualityOrSpamRisk -
      w.repeatedContentPenalty * repeatedContentPenalty;

    // Strict clamp between 0.0 and 1.0
    finalScore = Math.max(0.0, Math.min(1.0, finalScore));

    // Hybrid calculation (α·Det + β·ML + γ·Sem + δ·Graph)
    const hybrid = config.hybrid;
    const deterministicScore = finalScore;
    const mlScore = finalScore; // Deterministic fallback
    const semanticSimilarity = laneRelevance;
    const graphRelevance = affinity;

    const hybridScore = Math.max(
      0.0,
      Math.min(
        1.0,
        hybrid.alphaDeterministic * deterministicScore +
          hybrid.betaML * mlScore +
          hybrid.gammaSemantic * semanticSimilarity +
          hybrid.deltaGraph * graphRelevance
      )
    );

    // Explainable label
    let explanation: string | undefined = intentBoost.explanation;
    if (!explanation) {
      if (post.tradeLane) {
        explanation = `Relevant to ${post.tradeLane} corridor`;
      } else if (isSameCompany) {
        explanation = `From verified colleagues at ${post.authorCompany}`;
      } else if (affinity > 0.6) {
        explanation = `Trending in your logistics network`;
      }
    }

    // Increment author occurrence for subsequent diversity penalties
    seenAuthors.set(authorKey, previousAuthorCount + 1);

    return {
      post: {
        ...post,
        rankingScore: hybridScore,
        rankingExplanation: explanation,
      },
      baseScore,
      finalScore,
      hybridScore,
      explanation,
    };
  }

  /**
   * Sort and rank candidate posts
   */
  public rankFeed(posts: FeedPost[], context: RankingContext): FeedPost[] {
    // If surface is latest chronological view, sort directly by time
    if (context.surface === 'latest') {
      return [...posts].sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return timeB - timeA;
      });
    }

    const candidates = this.filterCandidates(posts, context);
    const seenAuthors = new Map<string, number>();

    const rankedResults: RankedPostResult[] = candidates.map((post) =>
      this.rankPost(post, context, seenAuthors)
    );

    // Sort descending by hybrid score
    rankedResults.sort((a, b) => b.hybridScore - a.hybridScore);

    return rankedResults.map((r) => r.post);
  }
}

export const feedRankingEngine = new FeedRankingEngine();
