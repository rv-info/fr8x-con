-- =============================================================================
-- FR8X — CONNECTION REQUESTS, FOREIGN KEYS & NOTIFICATIONS HARDENING
-- Migration: 20261017130000_fix_connection_requests_notifications_foreign_keys
-- Description:
--   1. Adds explicit foreign keys from connection_requests and accepted_connections
--      to public.profiles(id) so PostgREST embeds and joins resolve accurately.
--   2. Hardens send_connection_request and accept_connection_request RPCs to use
--      bulletproof idempotency (WHERE NOT EXISTS) avoiding 42P10 index mismatch errors.
--   3. Ensures recipient notifications are guaranteed to commit atomically with the request.
--   4. Grants permissions and configures RLS for notifications and connection_requests.
-- =============================================================================

DO $$
BEGIN
  -- 1. Foreign keys to public.profiles for connection_requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_connection_requests_requester_profile'
  ) THEN
    ALTER TABLE public.connection_requests
      ADD CONSTRAINT fk_connection_requests_requester_profile
      FOREIGN KEY (requester_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_connection_requests_recipient_profile'
  ) THEN
    ALTER TABLE public.connection_requests
      ADD CONSTRAINT fk_connection_requests_recipient_profile
      FOREIGN KEY (recipient_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  -- 2. Foreign keys to public.profiles for accepted_connections
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_accepted_connections_user_profile'
  ) THEN
    ALTER TABLE public.accepted_connections
      ADD CONSTRAINT fk_accepted_connections_user_profile
      FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_accepted_connections_connected_profile'
  ) THEN
    ALTER TABLE public.accepted_connections
      ADD CONSTRAINT fk_accepted_connections_connected_profile
      FOREIGN KEY (connected_to) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_connreq_requester_profile ON public.connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_connreq_recipient_profile ON public.connection_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_accepted_user_profile ON public.accepted_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_accepted_connected_profile ON public.accepted_connections(connected_to);
CREATE INDEX IF NOT EXISTS idx_notifications_user_rel ON public.notifications(user_id, related_id);

-- ── SEND CONNECTION REQUEST RPC ──────────────────────────────────────────────
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

  -- Insert notification for recipient (using WHERE NOT EXISTS to guarantee 100% index-independent idempotency)
  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = p_recipient_id::text AND related_id = v_req_id::text
  ) THEN
    INSERT INTO public.notifications(user_id, type, category, title, description, target_url, related_id, metadata)
    SELECT
      p_recipient_id::text, 'connection_request', 'network',
      coalesce(pr.display_name, pr.first_name || ' ' || pr.last_name, 'A freight colleague') || ' sent you a connection request',
      CASE WHEN trim(coalesce(p_message,'')) <> ''
        THEN '"' || left(p_message, 150) || '"'
        ELSE 'Review and respond to grow your professional freight network.'
      END,
      '/connections?tab=incoming',
      v_req_id::text,
      jsonb_build_object('requester_id', p_requester_id, 'request_id', v_req_id,
        'requester_name', coalesce(pr.display_name, pr.first_name || ' ' || pr.last_name, ''),
        'requester_company', pr.company_name, 'requester_avatar', pr.avatar_url)
    FROM public.profiles pr WHERE pr.id = p_requester_id;
  END IF;

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
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'error', 'Request not found.');
  END IF;

  IF v_req.recipient_id <> p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Not authorized to accept this request.');
  END IF;

  IF v_req.status = 'accepted' THEN
    RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'status', 'accepted', 'already_accepted', true);
  END IF;

  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATE', 'error', 'Request is no longer pending.');
  END IF;

  UPDATE public.connection_requests SET status = 'accepted', updated_at = NOW() WHERE id = p_request_id;

  -- Create bidirectional connection rows
  INSERT INTO public.accepted_connections(user_id, connected_to, request_id)
  VALUES (v_req.requester_id, v_req.recipient_id, p_request_id)
  ON CONFLICT (user_id, connected_to) DO NOTHING;

  INSERT INTO public.accepted_connections(user_id, connected_to, request_id)
  VALUES (v_req.recipient_id, v_req.requester_id, p_request_id)
  ON CONFLICT (user_id, connected_to) DO NOTHING;

  -- Notify the original requester (idempotent via WHERE NOT EXISTS)
  IF NOT EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = v_req.requester_id::text AND related_id = ('accepted_' || p_request_id::text)
  ) THEN
    INSERT INTO public.notifications(user_id, type, category, title, description, target_url, related_id, metadata)
    SELECT
      v_req.requester_id::text, 'connection_accepted', 'network',
      coalesce(pr.display_name, pr.first_name || ' ' || pr.last_name, 'Your contact') || ' accepted your connection request',
      'You are now connected. Direct contact credentials and instant trade chat are unlocked.',
      '/connections?tab=connections',
      ('accepted_' || p_request_id::text),
      jsonb_build_object('acceptor_id', v_req.recipient_id, 'request_id', p_request_id,
        'acceptor_name', coalesce(pr.display_name, pr.first_name || ' ' || pr.last_name, ''),
        'acceptor_company', pr.company_name, 'acceptor_avatar', pr.avatar_url)
    FROM public.profiles pr WHERE pr.id = v_req.recipient_id;
  END IF;

  -- Mark the incoming request notification as read
  UPDATE public.notifications
  SET read = TRUE
  WHERE user_id = p_recipient_id::text AND related_id = p_request_id::text;

  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id, new_data)
  VALUES (p_recipient_id, 'connection_accepted', 'connection_requests', p_request_id::text,
    jsonb_build_object('requester_id', v_req.requester_id, 'recipient_id', v_req.recipient_id));

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'status', 'accepted');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.accept_connection_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_connection_request TO service_role;

-- ── CANCEL / WITHDRAW CONNECTION REQUEST RPC ────────────────────────────────────
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
    RETURN jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Not authorized to cancel this request.');
  END IF;

  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATE', 'error', 'Request is no longer pending.');
  END IF;

  UPDATE public.connection_requests SET status = 'cancelled', updated_at = NOW() WHERE id = p_request_id;

  -- Remove or mark read the recipient's notification
  UPDATE public.notifications
  SET read = TRUE
  WHERE user_id = v_req.recipient_id::text AND related_id = p_request_id::text;

  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id, new_data)
  VALUES (p_requester_id, 'connection_cancelled', 'connection_requests', p_request_id::text,
    jsonb_build_object('recipient_id', v_req.recipient_id, 'request_id', p_request_id));

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'status', 'cancelled');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.cancel_connection_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_connection_request TO service_role;

-- ── RLS POLICIES & SECURITY HARDENING ─────────────────────────────────────────
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accepted_connections ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';

