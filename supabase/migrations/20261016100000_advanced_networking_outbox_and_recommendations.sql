-- ============================================================================
-- FR8X DATABASE MIGRATION: ADVANCED NETWORKING, OUTBOX & RECOMMENDATIONS
-- Migration: 20261016100000_advanced_networking_outbox_and_recommendations.sql
-- ============================================================================

-- ── 1. TRANSACTIONAL OUTBOX TABLE ──────────────────────────────────────────
-- Provides durable, idempotent event dispatching for asynchronous workers.
-- Used for: notifications, search vector synchronization, feed distribution, audit.
CREATE TABLE IF NOT EXISTS public.outbox_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type      TEXT NOT NULL,
  aggregate_type  TEXT NOT NULL,
  aggregate_id    TEXT NOT NULL,
  payload         JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'dead_letter')),
  retry_count     INT NOT NULL DEFAULT 0,
  max_retries     INT NOT NULL DEFAULT 5,
  error_message   TEXT,
  scheduled_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at    TIMESTAMPTZ,
  idempotency_key TEXT UNIQUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient outbox worker polling and deduplication
CREATE INDEX IF NOT EXISTS idx_outbox_events_poll
  ON public.outbox_events(status, scheduled_at)
  WHERE status IN ('pending', 'failed');

CREATE INDEX IF NOT EXISTS idx_outbox_events_aggregate
  ON public.outbox_events(aggregate_type, aggregate_id);

CREATE INDEX IF NOT EXISTS idx_outbox_events_created
  ON public.outbox_events(created_at DESC);

-- ── 2. SEPARATE FOLLOWING GRAPH TABLE ──────────────────────────────────────
-- Strictly separated from mutual connections (as specified in architectural guidelines).
CREATE TABLE IF NOT EXISTS public.user_follows (
  follower_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (follower_id, following_id),
  CONSTRAINT chk_no_self_follow CHECK (follower_id <> following_id)
);

CREATE INDEX IF NOT EXISTS idx_user_follows_following
  ON public.user_follows(following_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_follows_follower
  ON public.user_follows(follower_id, created_at DESC);

-- ── 3. POSTS FEED COMPOSITE INDEXES & VISIBILITY ───────────────────────────
-- Optimize fan-out on read queries for timeline retrieval
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'posts') THEN
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public';
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS trade_lanes JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS engagement_score NUMERIC DEFAULT 0;

    CREATE INDEX IF NOT EXISTS idx_posts_timeline_feed
      ON public.posts(created_at DESC)
      WHERE is_published = true;

    CREATE INDEX IF NOT EXISTS idx_posts_author_created
      ON public.posts(author_uid, created_at DESC);
  END IF;
END $$;

-- ── 4. RECOMMENDATION RPC ENGINE ───────────────────────────────────────────
-- Generates candidates and transparent deterministic scoring for professional discovery
CREATE OR REPLACE FUNCTION public.get_people_recommendations(
  p_viewer_id UUID,
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id                UUID,
  full_name         TEXT,
  headline          TEXT,
  company           TEXT,
  location          TEXT,
  avatar_url        TEXT,
  is_verified       BOOLEAN,
  has_golden_tick   BOOLEAN,
  mutual_count      BIGINT,
  matching_lanes    INT,
  matching_skills   INT,
  recommendation_score NUMERIC,
  primary_reason    TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_viewer_lanes   JSONB := '[]'::jsonb;
  v_viewer_skills  JSONB := '[]'::jsonb;
  v_viewer_country TEXT := '';
  v_viewer_company TEXT := '';
BEGIN
  -- Retrieve viewer's profile context for matching
  SELECT
    COALESCE(key_trade_lanes, '[]'::jsonb),
    COALESCE(skills, '[]'::jsonb),
    COALESCE(country, ''),
    COALESCE(company_name, '')
  INTO v_viewer_lanes, v_viewer_skills, v_viewer_country, v_viewer_company
  FROM public.profiles
  WHERE profiles.id = p_viewer_id;

  RETURN QUERY
  WITH candidate_pool AS (
    SELECT
      p.id AS candidate_id,
      COALESCE(p.full_name, p.display_name, 'FR8X Member') AS cand_full_name,
      COALESCE(p.headline, p.designation, '') AS cand_headline,
      COALESCE(p.company_name, '') AS cand_company,
      COALESCE(p.location, CONCAT_WS(', ', p.city, p.country)) AS cand_location,
      p.avatar_url AS cand_avatar,
      COALESCE(p.is_verified, false) AS cand_verified,
      COALESCE(p.has_golden_tick, false) AS cand_golden,
      p.country AS cand_country,
      COALESCE(p.key_trade_lanes, '[]'::jsonb) AS cand_lanes,
      COALESCE(p.skills, '[]'::jsonb) AS cand_skills,

      -- Mutual connections count
      (
        SELECT COUNT(*)::BIGINT
        FROM public.accepted_connections ac1
        JOIN public.accepted_connections ac2 ON ac1.connected_to = ac2.connected_to
        WHERE ac1.user_id = p_viewer_id AND ac2.user_id = p.id
      ) AS cand_mutuals
    FROM public.profiles p
    WHERE p.id <> p_viewer_id
      -- Exclude existing connections
      AND NOT EXISTS (
        SELECT 1 FROM public.accepted_connections ac
        WHERE ac.user_id = p_viewer_id AND ac.connected_to = p.id
      )
      -- Exclude pending requests
      AND NOT EXISTS (
        SELECT 1 FROM public.connection_requests cr
        WHERE ((cr.sender_id = p_viewer_id AND cr.recipient_id = p.id)
            OR (cr.sender_id = p.id AND cr.recipient_id = p_viewer_id))
          AND cr.status = 'pending'
      )
      -- Exclude blocked members
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks ub
        WHERE (ub.blocker_id = p_viewer_id AND ub.blocked_id = p.id)
           OR (ub.blocker_id = p.id AND ub.blocked_id = p_viewer_id)
      )
  ),
  scored_candidates AS (
    SELECT
      cp.*,
      -- Trade lane overlap count
      (
        SELECT COUNT(*)::INT
        FROM jsonb_array_elements_text(cp.cand_lanes) l1
        WHERE l1 IN (SELECT jsonb_array_elements_text(v_viewer_lanes))
      ) AS cand_matching_lanes,

      -- Skills overlap count
      (
        SELECT COUNT(*)::INT
        FROM jsonb_array_elements_text(cp.cand_skills) s1
        WHERE s1 IN (SELECT jsonb_array_elements_text(v_viewer_skills))
      ) AS cand_matching_skills,

      -- Proximity points
      CASE WHEN cp.cand_country = v_viewer_country AND v_viewer_country <> '' THEN 10 ELSE 0 END AS country_score,
      CASE WHEN cp.cand_golden THEN 8 WHEN cp.cand_verified THEN 4 ELSE 0 END AS verification_score
    FROM candidate_pool cp
  )
  SELECT
    sc.candidate_id,
    sc.cand_full_name,
    sc.cand_headline,
    sc.cand_company,
    sc.cand_location,
    sc.cand_avatar,
    sc.cand_verified,
    sc.cand_golden,
    sc.cand_mutuals,
    sc.cand_matching_lanes,
    sc.cand_matching_skills,
    -- Deterministic weighted score formula
    ROUND(
      (LEAST(sc.cand_mutuals * 15, 45) +
       LEAST(sc.cand_matching_lanes * 12, 25) +
       LEAST(sc.cand_matching_skills * 8, 20) +
       sc.country_score +
       sc.verification_score)::NUMERIC,
      2
    ) AS recommendation_score,
    -- Explainable primary reason
    CASE
      WHEN sc.cand_mutuals > 0 THEN CONCAT(sc.cand_mutuals, ' mutual connection', CASE WHEN sc.cand_mutuals > 1 THEN 's' ELSE '' END)
      WHEN sc.cand_matching_lanes > 0 THEN 'Shared trade lanes'
      WHEN sc.cand_matching_skills > 0 THEN 'Complementary logistics expertise'
      WHEN sc.cand_country = v_viewer_country AND v_viewer_country <> '' THEN CONCAT('Active in ', v_viewer_country)
      WHEN sc.cand_golden OR sc.cand_verified THEN 'Verified freight forwarding specialist'
      ELSE 'Suggested based on your network activity'
    END AS primary_reason
  FROM scored_candidates sc
  ORDER BY recommendation_score DESC, sc.cand_mutuals DESC, sc.candidate_id
  LIMIT LEAST(p_limit, 50);
END;
$$;

-- ── 5. ROW-LEVEL SECURITY POLICIES ─────────────────────────────────────────
ALTER TABLE public.outbox_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- Outbox is an internal infrastructure queue: accessible by service_role
DROP POLICY IF EXISTS "Service role manages outbox" ON public.outbox_events;
CREATE POLICY "Service role manages outbox"
  ON public.outbox_events FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- User follows policies
DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows;
CREATE POLICY "Anyone can view follows"
  ON public.user_follows FOR SELECT
  TO authenticated, anon
  USING (true);

DROP POLICY IF EXISTS "Users can follow/unfollow" ON public.user_follows;
CREATE POLICY "Users can follow/unfollow"
  ON public.user_follows FOR ALL
  TO authenticated
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- ── 6. GRANTS ──────────────────────────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outbox_events TO service_role;
GRANT SELECT, INSERT, DELETE ON public.user_follows TO authenticated;
GRANT SELECT ON public.user_follows TO anon;
GRANT EXECUTE ON FUNCTION public.get_people_recommendations(UUID, INT) TO authenticated, service_role;
