-- =============================================================================
-- FR8X PEOPLE SEARCH & CONNECTIONS SYSTEM
-- Migration: 20261015100000_people_search_and_connections
-- Safe, additive, non-destructive. Idempotent (safe to re-run).
-- =============================================================================

-- ── EXTENSIONS ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ── PROFILES: ADD MISSING NETWORK & EXPERTISE COLUMNS ──────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS search_vector tsvector,
  ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS specializations JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS key_trade_lanes JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS languages JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS headline TEXT,
  ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Compute weighted tsvector from profile columns
-- A=name, B=designation/title, C=company/skills, D=location
CREATE OR REPLACE FUNCTION public.profiles_search_vector(p public.profiles)
RETURNS tsvector AS $$
BEGIN
  RETURN
    setweight(to_tsvector('english',
      coalesce(unaccent(p.display_name), '') || ' ' ||
      coalesce(unaccent(p.full_name), '')    || ' ' ||
      coalesce(unaccent(p.first_name), '')   || ' ' ||
      coalesce(unaccent(p.last_name), '')
    ), 'A') ||
    setweight(to_tsvector('english',
      coalesce(unaccent(p.headline), '')    || ' ' ||
      coalesce(unaccent(p.designation), '') || ' ' ||
      coalesce(unaccent(p.position),    '') || ' ' ||
      coalesce(unaccent(p.department),  '')
    ), 'B') ||
    setweight(to_tsvector('english',
      coalesce(unaccent(p.company_name), '') || ' ' ||
      CASE
        WHEN jsonb_typeof(coalesce(p.skills, '[]'::jsonb)) = 'array' THEN
          coalesce((SELECT string_agg(val, ' ') FROM jsonb_array_elements_text(p.skills) AS t(val)), '')
        WHEN jsonb_typeof(coalesce(p.skills, '[]'::jsonb)) = 'string' THEN
          coalesce(p.skills #>> '{}', '')
        ELSE ''
      END || ' ' ||
      CASE
        WHEN jsonb_typeof(coalesce(p.specializations, '[]'::jsonb)) = 'array' THEN
          coalesce((SELECT string_agg(val, ' ') FROM jsonb_array_elements_text(p.specializations) AS t(val)), '')
        WHEN jsonb_typeof(coalesce(p.specializations, '[]'::jsonb)) = 'string' THEN
          coalesce(p.specializations #>> '{}', '')
        ELSE ''
      END
    ), 'C') ||
    setweight(to_tsvector('english',
      coalesce(unaccent(p.city),     '') || ' ' ||
      coalesce(unaccent(p.state),    '') || ' ' ||
      coalesce(unaccent(p.country),  '') || ' ' ||
      coalesce(unaccent(p.location), '')
    ), 'D');
END;
$$ LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER;

-- Trigger to keep search_vector current on every relevant UPDATE
CREATE OR REPLACE FUNCTION public.trg_profiles_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := public.profiles_search_vector(NEW);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

DROP TRIGGER IF EXISTS tg_profiles_search_vector ON public.profiles;
CREATE TRIGGER tg_profiles_search_vector
  BEFORE INSERT OR UPDATE OF
    display_name, first_name, last_name, full_name,
    headline, designation, position, department,
    company_name, skills, specializations,
    city, state, country, location
  ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.trg_profiles_search_vector();

-- GIN index for tsvector FTS (fast @@ matching)
CREATE INDEX IF NOT EXISTS idx_profiles_search_vector
  ON public.profiles USING GIN(search_vector);

-- Trigram indexes for fuzzy/approximate matching
CREATE INDEX IF NOT EXISTS idx_profiles_display_name_trgm
  ON public.profiles USING GIN(display_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_company_name_trgm
  ON public.profiles USING GIN(company_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_city_trgm
  ON public.profiles USING GIN(city gin_trgm_ops);

-- Composite filter indexes for search API
CREATE INDEX IF NOT EXISTS idx_profiles_country_status
  ON public.profiles(country, status);

CREATE INDEX IF NOT EXISTS idx_profiles_city_country
  ON public.profiles(city, country);

-- Backfill existing profiles (safe; processes all rows once)
UPDATE public.profiles
SET search_vector = public.profiles_search_vector(profiles.*)
WHERE search_vector IS NULL;

-- ── CONNECTION_REQUESTS TABLE ─────────────────────────────────────────────────
-- Clean, well-typed connection request workflow table with UUID FKs.
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status          TEXT        NOT NULL DEFAULT 'pending'
                              CHECK (status IN ('pending','accepted','declined','cancelled')),
  message         TEXT        CHECK (char_length(message) <= 300),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.connection_requests
  DROP CONSTRAINT IF EXISTS chk_no_self_request;
ALTER TABLE public.connection_requests
  ADD CONSTRAINT chk_no_self_request CHECK (requester_id <> recipient_id);

-- Exactly one pending request per ordered pair at a time
CREATE UNIQUE INDEX IF NOT EXISTS uidx_connection_requests_active
  ON public.connection_requests(requester_id, recipient_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_connreq_requester ON public.connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connreq_recipient ON public.connection_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_connreq_status    ON public.connection_requests(status);
CREATE INDEX IF NOT EXISTS idx_connreq_created   ON public.connection_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_connreq_recipient_pending
  ON public.connection_requests(recipient_id, created_at DESC)
  WHERE status = 'pending';

DROP TRIGGER IF EXISTS set_connection_requests_updated_at ON public.connection_requests;
CREATE TRIGGER set_connection_requests_updated_at
  BEFORE UPDATE ON public.connection_requests
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ── ACCEPTED_CONNECTIONS TABLE ────────────────────────────────────────────────
-- Bidirectional: both (A→B) and (B→A) rows are always present.
-- Simple "who am I connected to" query: WHERE user_id = auth.uid().
CREATE TABLE IF NOT EXISTS public.accepted_connections (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_to    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  request_id      UUID        REFERENCES public.connection_requests(id) ON DELETE SET NULL,
  connected_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.accepted_connections
  DROP CONSTRAINT IF EXISTS chk_no_self_connection;
ALTER TABLE public.accepted_connections
  ADD CONSTRAINT chk_no_self_connection CHECK (user_id <> connected_to);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_accepted_connections_pair
  ON public.accepted_connections(user_id, connected_to);

CREATE INDEX IF NOT EXISTS idx_accepted_user_id      ON public.accepted_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_accepted_connected_to ON public.accepted_connections(connected_to);
CREATE INDEX IF NOT EXISTS idx_accepted_connected_at ON public.accepted_connections(connected_at DESC);

-- ── USER_BLOCKS TABLE ─────────────────────────────────────────────────────────
-- Block relationships. Blocked users are hidden from search and cannot send requests.
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id  UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_blocks
  DROP CONSTRAINT IF EXISTS chk_no_self_block;
ALTER TABLE public.user_blocks
  ADD CONSTRAINT chk_no_self_block CHECK (blocker_id <> blocked_id);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_user_blocks_pair
  ON public.user_blocks(blocker_id, blocked_id);

CREATE INDEX IF NOT EXISTS idx_user_blocks_blocker ON public.user_blocks(blocker_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked ON public.user_blocks(blocked_id);

-- ── NOTIFICATIONS: IDEMPOTENCY via UNIQUE related_id ─────────────────────────
-- Prevents duplicate notifications on API retries (ON CONFLICT DO NOTHING).
CREATE UNIQUE INDEX IF NOT EXISTS uidx_notifications_related_id
  ON public.notifications(related_id)
  WHERE related_id IS NOT NULL;

-- ── PEOPLE SEARCH RPC ─────────────────────────────────────────────────────────
-- Called exclusively by service-role API routes. Returns sanitized public fields.
-- Applies privacy, block, and status filters at the DB layer.
CREATE OR REPLACE FUNCTION public.search_people(
  p_requester_id  UUID,
  p_query         TEXT        DEFAULT '',
  p_country       TEXT        DEFAULT NULL,
  p_city          TEXT        DEFAULT NULL,
  p_industry      TEXT        DEFAULT NULL,
  p_company       TEXT        DEFAULT NULL,
  p_skills        TEXT[]      DEFAULT NULL,
  p_verified_only BOOLEAN     DEFAULT FALSE,
  p_limit         INT         DEFAULT 20,
  p_cursor        UUID        DEFAULT NULL
)
RETURNS TABLE (
  id               UUID,
  display_name     TEXT,
  full_name        TEXT,
  first_name       TEXT,
  last_name        TEXT,
  designation      TEXT,
  position         TEXT,
  headline         TEXT,
  company_name     TEXT,
  company          TEXT,
  city             TEXT,
  country          TEXT,
  location         TEXT,
  avatar_url       TEXT,
  is_verified      BOOLEAN,
  has_golden_tick  BOOLEAN,
  skills           JSONB,
  specializations  JSONB,
  privacy_settings JSONB,
  rank             REAL,
  connection_status TEXT,
  mutual_count     BIGINT
) SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_tsquery   tsquery;
  v_clean_q   TEXT    := trim(coalesce(p_query, ''));
  v_has_query BOOLEAN := length(v_clean_q) >= 2;
BEGIN
  IF v_has_query THEN
    BEGIN
      v_tsquery := websearch_to_tsquery('english', v_clean_q);
    EXCEPTION WHEN OTHERS THEN
      v_has_query := FALSE;
    END;
  END IF;

  RETURN QUERY
  WITH candidate_profiles AS (
    SELECT
      pr.id,
      coalesce(pr.display_name, pr.full_name, trim(coalesce(pr.first_name,'') || ' ' || coalesce(pr.last_name,'')), 'FR8X Member') AS display_name,
      coalesce(pr.full_name, pr.display_name, trim(coalesce(pr.first_name,'') || ' ' || coalesce(pr.last_name,'')), 'FR8X Member') AS full_name,
      pr.first_name,
      pr.last_name,
      coalesce(pr.designation, pr.position, '') AS designation,
      coalesce(pr.position, pr.designation, '') AS position,
      coalesce(pr.headline, pr.designation, pr.position, '') AS headline,
      coalesce(pr.company_name, '') AS company_name,
      coalesce(pr.company_name, '') AS company,
      coalesce(pr.city, '') AS city,
      coalesce(pr.country, '') AS country,
      coalesce(pr.location, nullif(trim(coalesce(pr.city,'') || CASE WHEN pr.city IS NOT NULL AND pr.country IS NOT NULL THEN ', ' ELSE '' END || coalesce(pr.country,'')), ''), '') AS location,
      pr.avatar_url,
      coalesce(pr.is_verified, false) AS is_verified,
      coalesce(pr.has_golden_tick, false) AS has_golden_tick,
      coalesce(pr.skills, '[]'::jsonb) AS skills,
      coalesce(pr.specializations, '[]'::jsonb) AS specializations,
      coalesce(pr.privacy_settings, '{}'::jsonb) AS privacy_settings,
      CASE
        WHEN v_has_query THEN
          coalesce(ts_rank_cd(pr.search_vector, v_tsquery, 32), 0.0) +
          0.2 * greatest(
            coalesce(similarity(coalesce(pr.display_name,''), v_clean_q), 0.0),
            coalesce(similarity(coalesce(pr.company_name,''), v_clean_q), 0.0),
            coalesce(similarity(coalesce(pr.first_name,''), v_clean_q), 0.0),
            coalesce(similarity(coalesce(pr.last_name,''), v_clean_q), 0.0)
          )
        ELSE 1.0
      END::real AS rank
    FROM public.profiles pr
    WHERE pr.id <> p_requester_id
      AND coalesce(pr.status, pr.account_status, 'active') IN ('active', 'verified', 'trial')
      AND coalesce((pr.privacy_settings->>'allowDiscovery')::boolean, true) = true
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks ub
        WHERE (ub.blocker_id = p_requester_id AND ub.blocked_id = pr.id)
           OR (ub.blocker_id = pr.id AND ub.blocked_id = p_requester_id)
      )
      AND (
        NOT v_has_query
        OR (pr.search_vector IS NOT NULL AND pr.search_vector @@ v_tsquery)
        OR (pr.display_name ILIKE '%' || v_clean_q || '%')
        OR (pr.first_name   ILIKE '%' || v_clean_q || '%')
        OR (pr.last_name    ILIKE '%' || v_clean_q || '%')
        OR (pr.company_name ILIKE '%' || v_clean_q || '%')
        OR (similarity(coalesce(pr.display_name,''), v_clean_q) > 0.15)
        OR (similarity(coalesce(pr.company_name,''), v_clean_q) > 0.15)
      )
      AND (p_country      IS NULL OR lower(coalesce(pr.country,''))      = lower(p_country))
      AND (p_city         IS NULL OR lower(coalesce(pr.city,''))         LIKE '%' || lower(p_city) || '%')
      AND (p_company      IS NULL OR lower(coalesce(pr.company_name,'')) LIKE '%' || lower(p_company) || '%')
      AND (p_verified_only = FALSE OR pr.is_verified = TRUE OR pr.has_golden_tick = TRUE)
      AND (p_industry IS NULL OR
           lower(coalesce(pr.designation,''))  LIKE '%' || lower(p_industry) || '%' OR
           lower(coalesce(pr.department,''))   LIKE '%' || lower(p_industry) || '%')
      AND (
        p_skills IS NULL OR cardinality(p_skills) = 0 OR
        EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(coalesce(pr.skills,'[]'::jsonb)) AS s
          WHERE lower(s) = ANY(SELECT lower(u) FROM unnest(p_skills) AS u)
        )
      )
      AND (p_cursor IS NULL OR pr.id > p_cursor)
  )
  SELECT
    cp.id,
    cp.display_name,
    cp.full_name,
    cp.first_name,
    cp.last_name,
    cp.designation,
    cp.position,
    cp.headline,
    cp.company_name,
    cp.company,
    cp.city,
    cp.country,
    cp.location,
    cp.avatar_url,
    cp.is_verified,
    cp.has_golden_tick,
    cp.skills,
    cp.specializations,
    cp.privacy_settings,
    cp.rank,
    CASE
      WHEN EXISTS (
        SELECT 1 FROM public.accepted_connections ac
        WHERE ac.user_id = p_requester_id AND ac.connected_to = cp.id
      ) THEN 'connected'
      WHEN EXISTS (
        SELECT 1 FROM public.connection_requests cr
        WHERE cr.requester_id = p_requester_id AND cr.recipient_id = cp.id
          AND cr.status = 'pending'
      ) THEN 'pending_sent'
      WHEN EXISTS (
        SELECT 1 FROM public.connection_requests cr
        WHERE cr.requester_id = cp.id AND cr.recipient_id = p_requester_id
          AND cr.status = 'pending'
      ) THEN 'pending_received'
      ELSE 'not_connected'
    END::text AS connection_status,
    (
      SELECT COUNT(*)
      FROM public.accepted_connections ac1
      JOIN public.accepted_connections ac2 ON ac1.connected_to = ac2.connected_to
      WHERE ac1.user_id = p_requester_id AND ac2.user_id = cp.id
    ) AS mutual_count
  FROM candidate_profiles cp
  ORDER BY cp.rank DESC, cp.has_golden_tick DESC, cp.is_verified DESC, cp.id ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.search_people FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.search_people TO service_role;

-- ── SEND CONNECTION REQUEST RPC ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.send_connection_request(
  p_requester_id  UUID,
  p_recipient_id  UUID,
  p_message       TEXT DEFAULT NULL
)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req_id       UUID;
  v_existing_id  UUID;
  v_reverse_req  UUID;
BEGIN
  IF p_requester_id = p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'code', 'SELF_REQUEST',
      'error', 'You cannot send a connection request to yourself.');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id AND status IN ('active','verified')) THEN
    RETURN jsonb_build_object('success', false, 'code', 'USER_NOT_FOUND',
      'error', 'The recipient profile was not found or is inactive.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.user_blocks WHERE
      (blocker_id = p_requester_id AND blocked_id = p_recipient_id) OR
      (blocker_id = p_recipient_id AND blocked_id = p_requester_id)) THEN
    RETURN jsonb_build_object('success', false, 'code', 'BLOCKED',
      'error', 'Connection request cannot be sent.');
  END IF;

  IF EXISTS (SELECT 1 FROM public.accepted_connections WHERE user_id = p_requester_id AND connected_to = p_recipient_id) THEN
    RETURN jsonb_build_object('success', false, 'code', 'ALREADY_CONNECTED',
      'error', 'You are already connected with this member.');
  END IF;

  -- If reverse pending exists, auto-accept it instead of creating a duplicate
  SELECT id INTO v_reverse_req FROM public.connection_requests
  WHERE requester_id = p_recipient_id AND recipient_id = p_requester_id AND status = 'pending';
  IF v_reverse_req IS NOT NULL THEN
    RETURN public.accept_connection_request(p_requester_id, v_reverse_req);
  END IF;

  -- Check same-direction duplicate
  SELECT id INTO v_existing_id FROM public.connection_requests
  WHERE requester_id = p_requester_id AND recipient_id = p_recipient_id AND status = 'pending';
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'DUPLICATE_REQUEST',
      'error', 'A pending request already exists.', 'request_id', v_existing_id);
  END IF;

  IF NOT coalesce(
    (SELECT (privacy_settings->>'allowConnectionRequests')::boolean FROM public.profiles WHERE id = p_recipient_id),
    true) THEN
    RETURN jsonb_build_object('success', false, 'code', 'CONNECTION_DISABLED',
      'error', 'This member is not accepting connection requests.');
  END IF;

  IF (SELECT COUNT(*) FROM public.connection_requests WHERE requester_id = p_requester_id AND status = 'pending') >= 20 THEN
    RETURN jsonb_build_object('success', false, 'code', 'RATE_LIMIT',
      'error', 'Too many pending requests. Cancel some before sending new ones.');
  END IF;

  INSERT INTO public.connection_requests(requester_id, recipient_id, message)
  VALUES (p_requester_id, p_recipient_id, left(trim(coalesce(p_message, '')), 300))
  RETURNING id INTO v_req_id;

  -- Insert notification (idempotent via unique index on related_id)
  INSERT INTO public.notifications(user_id, type, category, title, description, target_url, related_id, metadata)
  SELECT
    p_recipient_id::text, 'connection_request', 'network',
    coalesce(pr.display_name, pr.first_name || ' ' || pr.last_name, 'Someone') || ' sent you a connection request',
    CASE WHEN trim(coalesce(p_message,'')) <> ''
      THEN '"' || left(p_message, 150) || '"'
      ELSE 'Review and respond to grow your professional network.'
    END,
    '/connections?tab=incoming',
    v_req_id::text,
    jsonb_build_object('requester_id', p_requester_id, 'request_id', v_req_id,
      'requester_name', coalesce(pr.display_name, pr.first_name || ' ' || pr.last_name, ''),
      'requester_company', pr.company_name, 'requester_avatar', pr.avatar_url)
  FROM public.profiles pr WHERE pr.id = p_requester_id
  ON CONFLICT (related_id) DO NOTHING;

  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id, new_data)
  VALUES (p_requester_id, 'connection_request_sent', 'connection_requests', v_req_id::text,
    jsonb_build_object('recipient_id', p_recipient_id, 'request_id', v_req_id));

  RETURN jsonb_build_object('success', true, 'request_id', v_req_id, 'status', 'pending');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.send_connection_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_connection_request TO service_role;

-- ── ACCEPT CONNECTION REQUEST RPC ──────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.accept_connection_request(
  p_recipient_id  UUID,
  p_request_id    UUID
)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.connection_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_req FROM public.connection_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'error', 'Connection request not found.');
  END IF;
  IF v_req.recipient_id <> p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'code', 'FORBIDDEN',
      'error', 'Only the request recipient may accept it.');
  END IF;
  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATUS',
      'error', 'This request is no longer pending (status: ' || v_req.status || ').');
  END IF;

  UPDATE public.connection_requests SET status = 'accepted', updated_at = NOW() WHERE id = p_request_id;

  -- Bidirectional accepted connection (idempotent)
  INSERT INTO public.accepted_connections(user_id, connected_to, request_id)
  VALUES (v_req.requester_id, v_req.recipient_id, p_request_id)
  ON CONFLICT (user_id, connected_to) DO NOTHING;

  INSERT INTO public.accepted_connections(user_id, connected_to, request_id)
  VALUES (v_req.recipient_id, v_req.requester_id, p_request_id)
  ON CONFLICT (user_id, connected_to) DO NOTHING;

  -- Notify the original requester (idempotent)
  INSERT INTO public.notifications(user_id, type, category, title, description, target_url, related_id, metadata)
  SELECT
    v_req.requester_id::text, 'connection_accepted', 'network',
    coalesce(pr.display_name, pr.first_name || ' ' || pr.last_name, 'Your contact') || ' accepted your connection request',
    'You are now connected. Start a conversation!',
    '/people/' || v_req.recipient_id::text,
    ('accepted_' || p_request_id::text),
    jsonb_build_object('acceptor_id', v_req.recipient_id, 'request_id', p_request_id,
      'acceptor_name', coalesce(pr.display_name, pr.first_name || ' ' || pr.last_name, ''),
      'acceptor_company', pr.company_name, 'acceptor_avatar', pr.avatar_url)
  FROM public.profiles pr WHERE pr.id = v_req.recipient_id
  ON CONFLICT (related_id) DO NOTHING;

  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id, new_data)
  VALUES (p_recipient_id, 'connection_accepted', 'connection_requests', p_request_id::text,
    jsonb_build_object('requester_id', v_req.requester_id, 'recipient_id', v_req.recipient_id));

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'status', 'accepted');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.accept_connection_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_connection_request TO service_role;

-- ── DECLINE CONNECTION REQUEST RPC ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.decline_connection_request(
  p_recipient_id  UUID,
  p_request_id    UUID
)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.connection_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_req FROM public.connection_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'error', 'Request not found.');
  END IF;
  IF v_req.recipient_id <> p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Only the recipient may decline.');
  END IF;
  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATUS', 'error', 'Request is not pending.');
  END IF;
  UPDATE public.connection_requests SET status = 'declined', updated_at = NOW() WHERE id = p_request_id;
  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id)
  VALUES (p_recipient_id, 'connection_declined', 'connection_requests', p_request_id::text);
  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'status', 'declined');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.decline_connection_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decline_connection_request TO service_role;

-- ── CANCEL CONNECTION REQUEST RPC ─────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cancel_connection_request(
  p_requester_id  UUID,
  p_request_id    UUID
)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.connection_requests%ROWTYPE;
BEGIN
  SELECT * INTO v_req FROM public.connection_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'error', 'Request not found.');
  END IF;
  IF v_req.requester_id <> p_requester_id THEN
    RETURN jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Only the requester may cancel.');
  END IF;
  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATUS', 'error', 'Request is not pending.');
  END IF;
  UPDATE public.connection_requests SET status = 'cancelled', updated_at = NOW() WHERE id = p_request_id;
  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id)
  VALUES (p_requester_id, 'connection_cancelled', 'connection_requests', p_request_id::text);
  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'status', 'cancelled');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.cancel_connection_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_connection_request TO service_role;

-- ── REMOVE CONNECTION RPC ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.remove_connection(p_user_id UUID, p_other_id UUID)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.accepted_connections WHERE user_id = p_user_id AND connected_to = p_other_id) THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_CONNECTED', 'error', 'Not connected to this member.');
  END IF;
  DELETE FROM public.accepted_connections
  WHERE (user_id = p_user_id AND connected_to = p_other_id)
     OR (user_id = p_other_id AND connected_to = p_user_id);
  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id)
  VALUES (p_user_id, 'connection_removed', 'accepted_connections', p_other_id::text);
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.remove_connection FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.remove_connection TO service_role;

-- ── BLOCK USER RPC ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.block_user(p_blocker_id UUID, p_blocked_id UUID)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF p_blocker_id = p_blocked_id THEN
    RETURN jsonb_build_object('success', false, 'code', 'SELF_BLOCK', 'error', 'Cannot block yourself.');
  END IF;
  INSERT INTO public.user_blocks(blocker_id, blocked_id) VALUES (p_blocker_id, p_blocked_id)
  ON CONFLICT (blocker_id, blocked_id) DO NOTHING;
  DELETE FROM public.accepted_connections
  WHERE (user_id = p_blocker_id AND connected_to = p_blocked_id)
     OR (user_id = p_blocked_id AND connected_to = p_blocker_id);
  UPDATE public.connection_requests SET status = 'cancelled', updated_at = NOW()
  WHERE status = 'pending'
    AND ((requester_id = p_blocker_id AND recipient_id = p_blocked_id)
      OR (requester_id = p_blocked_id AND recipient_id = p_blocker_id));
  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id)
  VALUES (p_blocker_id, 'user_blocked', 'user_blocks', p_blocked_id::text);
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.block_user FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.block_user TO service_role;

-- ── UNBLOCK USER RPC ──────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.unblock_user(p_blocker_id UUID, p_blocked_id UUID)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.user_blocks WHERE blocker_id = p_blocker_id AND blocked_id = p_blocked_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_BLOCKED', 'error', 'User was not blocked.');
  END IF;
  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id)
  VALUES (p_blocker_id, 'user_unblocked', 'user_blocks', p_blocked_id::text);
  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.unblock_user FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user TO service_role;

-- ── GET CONNECTION STATUS RPC ─────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_connection_status(p_viewer_id UUID, p_target_id UUID)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req_id UUID;
BEGIN
  IF p_viewer_id = p_target_id THEN
    RETURN jsonb_build_object('status', 'self');
  END IF;
  IF EXISTS (SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = p_viewer_id AND blocked_id = p_target_id)
       OR (blocker_id = p_target_id AND blocked_id = p_viewer_id)) THEN
    RETURN jsonb_build_object('status', 'blocked');
  END IF;
  IF EXISTS (SELECT 1 FROM public.accepted_connections WHERE user_id = p_viewer_id AND connected_to = p_target_id) THEN
    RETURN jsonb_build_object('status', 'connected');
  END IF;
  SELECT id INTO v_req_id FROM public.connection_requests
  WHERE requester_id = p_viewer_id AND recipient_id = p_target_id AND status = 'pending';
  IF v_req_id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'pending_sent', 'request_id', v_req_id);
  END IF;
  SELECT id INTO v_req_id FROM public.connection_requests
  WHERE requester_id = p_target_id AND recipient_id = p_viewer_id AND status = 'pending';
  IF v_req_id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'pending_received', 'request_id', v_req_id);
  END IF;
  RETURN jsonb_build_object('status', 'none');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.get_connection_status FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_connection_status TO service_role;

-- ── ROW LEVEL SECURITY ────────────────────────────────────────────────────────
ALTER TABLE public.connection_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accepted_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks          ENABLE ROW LEVEL SECURITY;

-- connection_requests policies
DROP POLICY IF EXISTS "Users see own connection requests"        ON public.connection_requests;
DROP POLICY IF EXISTS "No direct insert connection_requests"     ON public.connection_requests;
DROP POLICY IF EXISTS "No direct update connection_requests"     ON public.connection_requests;
DROP POLICY IF EXISTS "Service role manages connection_requests" ON public.connection_requests;

CREATE POLICY "Users see own connection requests"
  ON public.connection_requests FOR SELECT TO authenticated
  USING (requester_id = auth.uid() OR recipient_id = auth.uid());

-- All mutations go through SECURITY DEFINER RPCs; block direct DML from client role
CREATE POLICY "No direct insert connection_requests"
  ON public.connection_requests FOR INSERT TO authenticated
  WITH CHECK (FALSE);

CREATE POLICY "No direct update connection_requests"
  ON public.connection_requests FOR UPDATE TO authenticated
  USING (FALSE);

CREATE POLICY "Service role manages connection_requests"
  ON public.connection_requests FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- accepted_connections policies
DROP POLICY IF EXISTS "Users see own connections"               ON public.accepted_connections;
DROP POLICY IF EXISTS "No direct insert accepted_connections"   ON public.accepted_connections;
DROP POLICY IF EXISTS "Service role manages accepted_connections" ON public.accepted_connections;

CREATE POLICY "Users see own connections"
  ON public.accepted_connections FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR connected_to = auth.uid());

CREATE POLICY "No direct insert accepted_connections"
  ON public.accepted_connections FOR INSERT TO authenticated
  WITH CHECK (FALSE);

CREATE POLICY "Service role manages accepted_connections"
  ON public.accepted_connections FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- user_blocks policies
DROP POLICY IF EXISTS "Users see own blocks"             ON public.user_blocks;
DROP POLICY IF EXISTS "No direct insert user_blocks"     ON public.user_blocks;
DROP POLICY IF EXISTS "Service role manages user_blocks" ON public.user_blocks;

CREATE POLICY "Users see own blocks"
  ON public.user_blocks FOR SELECT TO authenticated
  USING (blocker_id = auth.uid());

CREATE POLICY "No direct insert user_blocks"
  ON public.user_blocks FOR INSERT TO authenticated
  WITH CHECK (FALSE);

CREATE POLICY "Service role manages user_blocks"
  ON public.user_blocks FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- ── MESSAGING RESTRICTIONS BEFORE CONNECTION (RLS Hardening) ─────────────────
-- Direct peer-to-peer messaging is strictly prohibited prior to an accepted connection.
DROP POLICY IF EXISTS "Users insert own messages" ON public.messages;
CREATE POLICY "Users insert own messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (
    (
      sender_id = auth.uid()::text OR
      sender_id = (SELECT uid FROM public.profiles WHERE id = auth.uid())
    )
    AND (
      -- Must have an active accepted connection
      EXISTS (
        SELECT 1 FROM public.accepted_connections ac
        WHERE ac.user_id = auth.uid()
          AND (ac.connected_to::text = recipient_id OR ac.connected_to = (SELECT id FROM public.profiles WHERE uid = recipient_id))
      )
      -- Neither party has blocked the other
      AND NOT EXISTS (
        SELECT 1 FROM public.user_blocks ub
        WHERE (ub.blocker_id = auth.uid() AND (ub.blocked_id::text = recipient_id OR ub.blocked_id = (SELECT id FROM public.profiles WHERE uid = recipient_id)))
           OR (ub.blocked_id = auth.uid() AND (ub.blocker_id::text = recipient_id OR ub.blocker_id = (SELECT id FROM public.profiles WHERE uid = recipient_id)))
      )
    )
  );

-- ── CANONICAL CONNECTIONS SYNCHRONIZATION ──────────────────────────────────────
-- Ensure canonical public.connections table matches accepted_connections
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='connections') THEN
    INSERT INTO public.connections (requester_id, recipient_id, status)
    SELECT ac.user_id::text, ac.connected_to::text, 'accepted'
    FROM public.accepted_connections ac
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ── GRANTS ────────────────────────────────────────────────────────────────────
GRANT SELECT ON public.connection_requests  TO authenticated;
GRANT SELECT ON public.accepted_connections TO authenticated;
GRANT SELECT ON public.user_blocks          TO authenticated;
GRANT ALL    ON public.connection_requests  TO service_role;
GRANT ALL    ON public.accepted_connections TO service_role;
GRANT ALL    ON public.user_blocks          TO service_role;

NOTIFY pgrst, 'reload schema';

-- =============================================================================
-- DONE — People Search & Connections Migration Applied
-- Verify: SELECT table_name FROM information_schema.tables
--         WHERE table_schema='public'
--         AND table_name IN ('connection_requests','accepted_connections','user_blocks');
-- =============================================================================

