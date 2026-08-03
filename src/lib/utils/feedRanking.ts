// FR8X-CON Dynamic Feed Ranking Algorithm
// Calculate trending score based on views, likes, comments, reposts, and exponential time decay.

export type PostRankingInput = {
  viewsCount?: number;
  likesCount?: number;
  commentsCount?: number;
  repostsCount?: number;
  dislikesCount?: number;
  createdAt?: { seconds: number; nanoseconds: number } | string | null;
};

/**
 * Calculate dynamic trending score with time decay
 * Formula: Score = (Likes*3 + Comments*4 + Reposts*5 + Views*1 - Dislikes*2) * DecayFactor
 * DecayFactor = 1 / (1 + (ageInHours / 12)^1.5)
 */
export function calculateTrendingScore(post: PostRankingInput): number {
  const views = post.viewsCount || 0;
  const likes = post.likesCount || 0;
  const comments = post.commentsCount || 0;
  const reposts = post.repostsCount || 0;
  const dislikes = post.dislikesCount || 0;

  const rawEngagement = likes * 3 + comments * 4 + reposts * 5 + views * 1 - dislikes * 2;

  // Calculate age in hours
  let ageInHours = 1;
  const nowMs = Date.now();

  if (post.createdAt) {
    if (typeof post.createdAt === "object" && "seconds" in post.createdAt) {
      ageInHours = Math.max(0.1, (nowMs - post.createdAt.seconds * 1000) / (3600 * 1000));
    } else if (typeof post.createdAt === "string") {
      const createdMs = new Date(post.createdAt).getTime();
      if (!isNaN(createdMs)) {
        ageInHours = Math.max(0.1, (nowMs - createdMs) / (3600 * 1000));
      }
    }
  }

  // Exponential decay factor (half-life around 12 hours)
  const timeDecayFactor = 1 / Math.pow(1 + ageInHours / 12, 1.5);

  return rawEngagement * timeDecayFactor;
}
