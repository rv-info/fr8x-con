/**
 * lib/ranking/config.ts
 * Configurable parameters and weights for the Two-Stage Feed Ranking Engine.
 * Stored in Firestore `/rankingConfigs/default`, with production fallback defaults.
 */

import { RankingConfig } from '@/lib/types';

export const DEFAULT_RANKING_CONFIG: RankingConfig = {
  id: 'default',
  version: '2.1.0-logistics',
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
  weights: {
    professionalRelevance: 0.24,
    relationshipAffinity: 0.18,
    predictedQualityEngagement: 0.14,
    meaningfulConversationValue: 0.12,
    dwellValue: 0.10,
    freshness: 0.08,
    geographyAndTradeLaneRelevance: 0.07,
    creatorTrust: 0.04,
    explorationValue: 0.03,
    // Negative penalties
    skipProbabilityPenalty: 0.12,
    lowQualitySpamPenalty: 0.10,
    repeatedContentPenalty: 0.08,
  },
  hybrid: {
    alphaDeterministic: 0.60,
    betaML: 0.10,
    gammaSemantic: 0.10,
    deltaGraph: 0.20,
  },
  halfLivesHours: {
    urgentOperational: 24, // 24 hours
    rateCapacity: 72,       // 72 hours
    educational: 168,       // 7 days
    announcements: 336,     // 14 days
  },
  diversityThresholds: {
    maxConsecutiveSameAuthor: 2,
    maxConsecutiveSameCompany: 2,
    maxSameTradeLaneRatio: 0.40,
  },
  fatigueMultipliers: {
    seenWithin24h: 0.70,
    repeatedTopic: 0.85,
  },
};
