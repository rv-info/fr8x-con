-- =============================================================================
-- Migration: 20261016140000_search_optimization_and_rls_hardening.sql
-- FR8X B2B Freight Logistics: Search Vector Optimization, Query Plan Tuning,
-- Row Level Security Hardening & Zero-Leakage Contact Shielding
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 1: SEARCH VECTOR FUNCTION OPTIMIZATION (ELIMINATING TRIGGER OVERHEAD)
-- ─────────────────────────────────────────────────────────────────────────────
-- Subqueries inside profiles_search_vector() caused heavy CPU spikes during bulk
-- profile insertions and updates. This optimized version avoids sub-select triggers
-- by using fast, set-based array concatenation and specialized B2B weighting.

CREATE OR REPLACE FUNCTION public.profiles_search_vector(p public.profiles)
RETURNS tsvector AS $$
DECLARE
  v_skills_text TEXT := '';
  v_specs_text  TEXT := '';
BEGIN
  -- Fast JSONB array unnesting without expensive subqueries
  IF p.skills IS NOT NULL AND jsonb_typeof(p.skills) = 'array' THEN
    SELECT coalesce(string_agg(elem, ' '), '')
    INTO v_skills_text
    FROM jsonb_array_elements_text(p.skills) elem;
  ELSIF p.skills IS NOT NULL AND jsonb_typeof(p.skills) = 'string' THEN
    v_skills_text := p.skills #>> '{}';
  END IF;

  IF p.specializations IS NOT NULL AND jsonb_typeof(p.specializations) = 'array' THEN
    SELECT coalesce(string_agg(elem, ' '), '')
    INTO v_specs_text
    FROM jsonb_array_elements_text(p.specializations) elem;
  ELSIF p.specializations IS NOT NULL AND jsonb_typeof(p.specializations) = 'string' THEN
    v_specs_text := p.specializations #>> '{}';
  END IF;

  RETURN
    -- Weight A: Primary Identifiers & Logistics Entity Name (Company is critical in B2B!)
    setweight(to_tsvector('english',
      coalesce(unaccent(p.display_name), '') || ' ' ||
      coalesce(unaccent(p.first_name), '')   || ' ' ||
      coalesce(unaccent(p.last_name), '')    || ' ' ||
      coalesce(unaccent(p.company_name), '')
    ), 'A') ||
    -- Weight B: Executive Logistics Roles & Professional Headline
    setweight(to_tsvector('english',
      coalesce(unaccent(p.headline), '')    || ' ' ||
      coalesce(unaccent(p.designation), '') || ' ' ||
      coalesce(unaccent(p.position), '')    || ' ' ||
      coalesce(unaccent(p.department), '')
    ), 'B') ||
    -- Weight C: Trade Specializations, Corridors & Cargo Skills
    setweight(to_tsvector('english',
      v_skills_text || ' ' || v_specs_text
    ), 'C') ||
    -- Weight D: Geographic Port Hubs, Cities, Countries & Bio
    setweight(to_tsvector('english',
      coalesce(unaccent(p.city), '')     || ' ' ||
      coalesce(unaccent(p.state), '')    || ' ' ||
      coalesce(unaccent(p.country), '')  || ' ' ||
      coalesce(unaccent(p.location), '') || ' ' ||
      coalesce(unaccent(p.bio), '')
    ), 'D');
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 2: ADVANCED COMPOSITE & PARTIAL INDEXING FOR SCALING TO MILLIONS
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Partial GIN index strictly on active/verified profiles (eliminates scanning deleted/inactive profiles)
CREATE INDEX IF NOT EXISTS idx_profiles_active_search_vector
  ON public.profiles USING GIN(search_vector)
  WHERE status IN ('active', 'verified');

-- 2. Tune GIN buffer write behavior: increase pending list limit to avoid synchronous GIN page splits
ALTER INDEX IF EXISTS public.idx_profiles_search_vector
  SET (fastupdate = on, gin_pending_list_limit = 2048);

ALTER INDEX IF EXISTS public.idx_profiles_active_search_vector
  SET (fastupdate = on, gin_pending_list_limit = 2048);

-- 3. Composite Trigram GIN index for multi-column fuzzy search (Name + Company + City + Headline)
CREATE INDEX IF NOT EXISTS idx_profiles_trgm_composite
  ON public.profiles USING GIN (
    (lower(
      coalesce(display_name,'') || ' ' ||
      coalesce(company_name,'') || ' ' ||
      coalesce(headline,'')     || ' ' ||
      coalesce(city,'')         || ' ' ||
      coalesce(country,'')
    )) gin_trgm_ops
  );

-- 4. Tune PostgreSQL Query Planner Statistics for high-frequency search columns
ALTER TABLE public.profiles ALTER COLUMN search_vector SET STATISTICS 500;
ALTER TABLE public.profiles ALTER COLUMN company_name  SET STATISTICS 500;
ALTER TABLE public.profiles ALTER COLUMN display_name  SET STATISTICS 500;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 3: REWRITTEN HIGH-CONCURRENCY SEARCH RPC (OPTIMIZED QUERY PLAN)
-- ─────────────────────────────────────────────────────────────────────────────
-- Bottleneck fixed: previously computed mutual connection counts across ALL matching candidates
-- before slicing. Now defers mutual calculation solely to the paginated top-K candidates.

CREATE OR REPLACE FUNCTION public.search_people(
  p_query         TEXT,
  p_requester_id  UUID,
  p_limit         INT     DEFAULT 20,
  p_offset        INT     DEFAULT 0,
  p_role          TEXT    DEFAULT NULL,
  p_country       TEXT    DEFAULT NULL,
  p_city          TEXT    DEFAULT NULL
)
RETURNS TABLE (
  id                 UUID,
  uid                TEXT,
  display_name       TEXT,
  first_name         TEXT,
  last_name          TEXT,
  avatar_url         TEXT,
  headline           TEXT,
  designation        TEXT,
  position           TEXT,
  department         TEXT,
  company_name       TEXT,
  city               TEXT,
  state              TEXT,
  country            TEXT,
  location           TEXT,
  skills             JSONB,
  specializations    JSONB,
  is_verified        BOOLEAN,
  has_golden_tick    BOOLEAN,
  is_public          BOOLEAN,
  connection_status  TEXT,
  mutual_count       BIGINT
) SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tsquery tsquery;
  v_clean_q TEXT;
BEGIN
  v_clean_q := trim(coalesce(p_query, ''));

  IF v_clean_q <> '' THEN
    v_tsquery := plainto_tsquery('english', unaccent(v_clean_q));
  ELSE
    v_tsquery := NULL;
  END IF;

  RETURN QUERY
  WITH candidate_slice AS (
    SELECT
      p.id,
      p.uid,
      p.display_name,
      p.first_name,
      p.last_name,
      p.avatar_url,
      p.headline,
      p.designation,
      p.position,
      p.department,
      p.company_name,
      p.city,
      p.state,
      p.country,
      p.location,
      p.skills,
      p.specializations,
      p.is_verified,
      p.has_golden_tick,
      p.is_public,
      CASE
        WHEN v_tsquery IS NOT NULL THEN ts_rank(p.search_vector, v_tsquery)
        ELSE 0.0
      END AS rank_score
    FROM public.profiles p
    WHERE p.id <> p_requester_id
      AND p.status IN ('active', 'verified')
      AND (p_role IS NULL OR p.role = p_role OR p.designation ILIKE '%' || p_role || '%')
      AND (p_country IS NULL OR p.country ILIKE p_country)
      AND (p_city IS NULL OR p.city ILIKE p_city)
      AND (
        v_clean_q = ''
        OR (v_tsquery IS NOT NULL AND p.search_vector @@ v_tsquery)
        OR p.display_name ILIKE '%' || v_clean_q || '%'
        OR p.company_name ILIKE '%' || v_clean_q || '%'
      )
      -- Exclude blocked users efficiently via subquery
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks ub
        WHERE (ub.blocker_id = p_requester_id AND ub.blocked_id = p.id)
           OR (ub.blocker_id = p.id AND ub.blocked_id = p_requester_id)
      )
    ORDER BY rank_score DESC, p.has_golden_tick DESC, p.is_verified DESC, p.id ASC
    LIMIT p_limit OFFSET p_offset
  )
  -- Defer mutual connection count computation exclusively to the final sliced records
  SELECT
    cs.id,
    cs.uid,
    cs.display_name,
    cs.first_name,
    cs.last_name,
    cs.avatar_url,
    cs.headline,
    cs.designation,
    cs.position,
    cs.department,
    cs.company_name,
    cs.city,
    cs.state,
    cs.country,
    cs.location,
    cs.skills,
    cs.specializations,
    cs.is_verified,
    cs.has_golden_tick,
    cs.is_public,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.accepted_connections ac
        WHERE ac.user_id = p_requester_id AND ac.connected_to = cs.id
      ) THEN 'connected'
      WHEN EXISTS (
        SELECT 1 FROM public.connection_requests cr
        WHERE cr.requester_id = p_requester_id AND cr.recipient_id = cs.id AND cr.status = 'pending'
      ) THEN 'pending_sent'
      WHEN EXISTS (
        SELECT 1 FROM public.connection_requests cr
        WHERE cr.requester_id = cs.id AND cr.recipient_id = p_requester_id AND cr.status = 'pending'
      ) THEN 'pending_received'
      ELSE 'not_connected'
    END::text AS connection_status,
    (
      SELECT count(*)
      FROM public.accepted_connections ac1
      JOIN public.accepted_connections ac2 ON ac1.connected_to = ac2.connected_to
      WHERE ac1.user_id = p_requester_id AND ac2.user_id = cs.id
    ) AS mutual_count
  FROM candidate_slice cs;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.search_people FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_people TO service_role;

-- ─────────────────────────────────────────────────────────────────────────────
-- SECTION 4: ROW LEVEL SECURITY HARDENING & CONTACT SHIELDING
-- ─────────────────────────────────────────────────────────────────────────────
-- Vulnerability fixed: Previously, "Profiles viewable by authenticated users"
-- allowed direct PostgREST queries to scrape emails, phones, and tax IDs of unconnected users.

-- 1. Restrict sensitive column access from client-facing roles
REVOKE SELECT (email, mobile, isd_code, pan, gstn, aadhar_number) ON public.profiles FROM anon, authenticated;

-- 2. Grant explicit SELECT on non-sensitive discovery fields
GRANT SELECT (
  id, uid, display_name, first_name, last_name, full_name, avatar_url,
  headline, designation, position, department, company_name, company_id,
  city, state, country, location, bio, skills, specializations,
  role, status, is_verified, has_golden_tick, is_public,
  created_at, updated_at
) ON public.profiles TO authenticated;

-- 3. Secure Function to fetch a member profile with dynamic contact shielding
CREATE OR REPLACE FUNCTION public.get_safe_profile(p_target_id UUID)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_viewer_id UUID := auth.uid();
  v_profile   RECORD;
  v_connected BOOLEAN := false;
  v_is_self   BOOLEAN := false;
BEGIN
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_target_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Profile not found.');
  END IF;

  v_is_self := (v_viewer_id = p_target_id);

  IF NOT v_is_self AND v_viewer_id IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.accepted_connections
      WHERE user_id = v_viewer_id AND connected_to = p_target_id
    ) INTO v_connected;
  END IF;

  RETURN jsonb_build_object(
    'id', v_profile.id,
    'uid', v_profile.uid,
    'displayName', v_profile.display_name,
    'firstName', v_profile.first_name,
    'lastName', v_profile.last_name,
    'companyName', v_profile.company_name,
    'designation', v_profile.designation,
    'avatarUrl', v_profile.avatar_url,
    'headline', v_profile.headline,
    'city', v_profile.city,
    'state', v_profile.state,
    'country', v_profile.country,
    'bio', v_profile.bio,
    'skills', v_profile.skills,
    'specializations', v_profile.specializations,
    'isVerified', v_profile.is_verified,
    'hasGoldenTick', v_profile.has_golden_tick,
    'isConnected', v_connected,
    'isSelf', v_is_self,
    -- Strictly shield email & phone unless self or mutually connected
    'email', CASE
      WHEN v_is_self OR v_connected THEN v_profile.email
      ELSE regexp_replace(v_profile.email, '^(.)(.*)(@.*)$', '\1***\3')
    END,
    'mobile', CASE
      WHEN v_is_self OR v_connected THEN v_profile.mobile
      WHEN v_profile.mobile IS NOT NULL THEN '+** *******' || right(v_profile.mobile, 2)
      ELSE NULL
    END,
    -- Tax identifiers strictly unviewable to external parties
    'pan', CASE WHEN v_is_self THEN v_profile.pan ELSE NULL END,
    'gstn', CASE WHEN v_is_self THEN v_profile.gstn ELSE NULL END
  );
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.get_safe_profile TO authenticated;

-- 4. Enforce Full Replica Identity for accurate WebSocket delta broadcasts
ALTER TABLE public.connection_requests  REPLICA IDENTITY FULL;
ALTER TABLE public.accepted_connections REPLICA IDENTITY FULL;

-- 5. Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
