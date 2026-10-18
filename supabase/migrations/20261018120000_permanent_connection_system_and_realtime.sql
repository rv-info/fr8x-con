-- ==============================================================================
-- FR8X PERMANENT CONNECTION SYSTEM & REALTIME NOTIFICATION SYNCHRONIZATION
-- Migration: 20261018120000_permanent_connection_system_and_realtime.sql
-- ==============================================================================

-- ── 1. Enable Supabase Realtime Publication for Connection Tables ─────────────
DO $$
BEGIN
  -- connection_requests
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'connection_requests'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;
  END IF;

  -- notifications
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;

  -- accepted_connections
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'accepted_connections'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.accepted_connections;
  END IF;

  -- user_blocks
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'user_blocks'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_blocks;
  END IF;
EXCEPTION
  WHEN undefined_object THEN
    NULL; -- Publication may not exist in standard local postgres tests
END $$;

-- Enable REPLICA IDENTITY FULL for detailed change capture in Realtime
ALTER TABLE public.connection_requests REPLICA IDENTITY FULL;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.accepted_connections REPLICA IDENTITY FULL;

-- ── 2. Performance Indexes & Uniqueness Constraints ───────────────────────────
CREATE INDEX IF NOT EXISTS idx_connreq_requester_recipient_status
  ON public.connection_requests(requester_id, recipient_id, status);

CREATE INDEX IF NOT EXISTS idx_connreq_recipient_status_created
  ON public.connection_requests(recipient_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connreq_requester_status_created
  ON public.connection_requests(requester_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient_category_read
  ON public.notifications(user_id, category, read, created_at DESC);

-- ── 3. Hardened Atomic RPC: send_connection_request ───────────────────────────
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
  v_req_name     TEXT;
  v_req_comp     TEXT;
  v_req_avatar   TEXT;
BEGIN
  -- Disallow self connections
  IF p_requester_id = p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'code', 'SELF_REQUEST',
      'error', 'You cannot send a connection request to yourself.');
  END IF;

  -- Check recipient exists and active
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id AND status IN ('active','verified')) THEN
    RETURN jsonb_build_object('success', false, 'code', 'USER_NOT_FOUND',
      'error', 'The recipient profile was not found or is inactive.');
  END IF;

  -- Check blocklists
  IF EXISTS (SELECT 1 FROM public.user_blocks WHERE
      (blocker_id = p_requester_id AND blocked_id = p_recipient_id) OR
      (blocker_id = p_recipient_id AND blocked_id = p_requester_id)) THEN
    RETURN jsonb_build_object('success', false, 'code', 'BLOCKED',
      'error', 'Connection request cannot be sent.');
  END IF;

  -- Check already connected
  IF EXISTS (SELECT 1 FROM public.accepted_connections WHERE user_id = p_requester_id AND connected_to = p_recipient_id) THEN
    RETURN jsonb_build_object('success', false, 'code', 'ALREADY_CONNECTED',
      'error', 'You are already connected with this member.');
  END IF;

  -- Auto-resolve reciprocal pending request (A sent to B earlier, now B sends to A -> auto accept)
  SELECT id INTO v_reverse_req FROM public.connection_requests
  WHERE requester_id = p_recipient_id AND recipient_id = p_requester_id AND status = 'pending';
  IF v_reverse_req IS NOT NULL THEN
    RETURN public.accept_connection_request(p_requester_id, v_reverse_req);
  END IF;

  -- Check same-direction pending request
  SELECT id INTO v_existing_id FROM public.connection_requests
  WHERE requester_id = p_requester_id AND recipient_id = p_recipient_id AND status = 'pending';
  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', false, 'code', 'DUPLICATE_REQUEST',
      'error', 'A pending request already exists.', 'request_id', v_existing_id);
  END IF;

  -- Privacy settings check
  IF NOT coalesce(
    (SELECT (privacy_settings->>'allowConnectionRequests')::boolean FROM public.profiles WHERE id = p_recipient_id),
    true) THEN
    RETURN jsonb_build_object('success', false, 'code', 'CONNECTION_DISABLED',
      'error', 'This member is not accepting connection requests.');
  END IF;

  -- Rate limit check: max 25 pending requests
  IF (SELECT COUNT(*) FROM public.connection_requests WHERE requester_id = p_requester_id AND status = 'pending') >= 25 THEN
    RETURN jsonb_build_object('success', false, 'code', 'RATE_LIMIT',
      'error', 'Too many pending requests. Cancel some before sending new ones.');
  END IF;

  -- Insert connection request
  INSERT INTO public.connection_requests(requester_id, recipient_id, message, status)
  VALUES (p_requester_id, p_recipient_id, left(trim(coalesce(p_message, '')), 300), 'pending')
  RETURNING id INTO v_req_id;

  -- Retrieve requester metadata for notification payload
  SELECT 
    coalesce(display_name, first_name || ' ' || last_name, 'A freight colleague'),
    coalesce(company_name, ''),
    coalesce(avatar_url, '')
  INTO v_req_name, v_req_comp, v_req_avatar
  FROM public.profiles WHERE id = p_requester_id;

  -- Insert atomic notification for recipient with category 'network'
  INSERT INTO public.notifications(
    id, user_id, type, category, title, description, target_url, related_id, read, metadata, created_at
  )
  VALUES (
    gen_random_uuid()::text,
    p_recipient_id::text,
    'connection_request',
    'network',
    v_req_name || ' sent you a connection request',
    CASE WHEN trim(coalesce(p_message,'')) <> ''
      THEN '"' || left(p_message, 150) || '"'
      ELSE 'Review and respond to grow your professional freight network.'
    END,
    '/connections?tab=incoming',
    v_req_id::text,
    FALSE,
    jsonb_build_object(
      'requester_id', p_requester_id,
      'request_id', v_req_id,
      'requester_name', v_req_name,
      'requester_company', v_req_comp,
      'requester_avatar', v_req_avatar,
      'actionLabel', 'Review Request'
    ),
    NOW()
  )
  ON CONFLICT (user_id, related_id) WHERE related_id IS NOT NULL
  DO UPDATE SET
    read = FALSE,
    created_at = NOW(),
    title = EXCLUDED.title,
    description = EXCLUDED.description;

  -- Audit log
  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id, new_data)
  VALUES (p_requester_id, 'connection_request_sent', 'connection_requests', v_req_id::text,
    jsonb_build_object('recipient_id', p_recipient_id, 'request_id', v_req_id));

  RETURN jsonb_build_object('success', true, 'request_id', v_req_id, 'status', 'pending');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.send_connection_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_connection_request TO service_role;

-- ── 4. Hardened Atomic RPC: cancel_connection_request (Withdraw) ───────────────
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

  UPDATE public.connection_requests 
  SET status = 'cancelled', updated_at = NOW() 
  WHERE id = p_request_id;

  -- Reconcile / dismiss recipient notification
  UPDATE public.notifications
  SET read = TRUE,
      description = 'This connection request was withdrawn by the sender.'
  WHERE user_id = v_req.recipient_id::text AND related_id = p_request_id::text;

  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id, new_data)
  VALUES (p_requester_id, 'connection_cancelled', 'connection_requests', p_request_id::text,
    jsonb_build_object('recipient_id', v_req.recipient_id, 'request_id', p_request_id));

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'status', 'cancelled');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.cancel_connection_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_connection_request TO service_role;

-- ── 5. Hardened Atomic RPC: accept_connection_request ─────────────────────────
CREATE OR REPLACE FUNCTION public.accept_connection_request(
  p_recipient_id  UUID,
  p_request_id    UUID
)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.connection_requests%ROWTYPE;
  v_recip_name TEXT;
  v_recip_comp TEXT;
  v_recip_avatar TEXT;
BEGIN
  SELECT * INTO v_req FROM public.connection_requests WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'code', 'NOT_FOUND', 'error', 'Request not found.');
  END IF;

  IF v_req.recipient_id <> p_recipient_id THEN
    RETURN jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Not authorized to accept this request.');
  END IF;

  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATE', 'error', 'Request is no longer pending.');
  END IF;

  -- Mark accepted
  UPDATE public.connection_requests 
  SET status = 'accepted', updated_at = NOW() 
  WHERE id = p_request_id;

  -- Commit reciprocal accepted connections in single atomic transaction
  INSERT INTO public.accepted_connections(user_id, connected_to, source_request_id, connected_at)
  VALUES (v_req.requester_id, v_req.recipient_id, p_request_id, NOW())
  ON CONFLICT (user_id, connected_to) DO UPDATE SET connected_at = NOW();

  INSERT INTO public.accepted_connections(user_id, connected_to, source_request_id, connected_at)
  VALUES (v_req.recipient_id, v_req.requester_id, p_request_id, NOW())
  ON CONFLICT (user_id, connected_to) DO UPDATE SET connected_at = NOW();

  -- Mark incoming notification read
  UPDATE public.notifications
  SET read = TRUE
  WHERE user_id = p_recipient_id::text AND related_id = p_request_id::text;

  -- Notify the requester that their invitation was accepted
  SELECT 
    coalesce(display_name, first_name || ' ' || last_name, 'A freight colleague'),
    coalesce(company_name, ''),
    coalesce(avatar_url, '')
  INTO v_recip_name, v_recip_comp, v_recip_avatar
  FROM public.profiles WHERE id = p_recipient_id;

  INSERT INTO public.notifications(
    id, user_id, type, category, title, description, target_url, related_id, read, metadata, created_at
  )
  VALUES (
    gen_random_uuid()::text,
    v_req.requester_id::text,
    'connection_accepted',
    'network',
    v_recip_name || ' accepted your connection request',
    'You are now connected. You can view direct verified contact channels and exchange freight tenders.',
    '/connections?tab=connections',
    p_request_id::text,
    FALSE,
    jsonb_build_object(
      'peer_id', p_recipient_id,
      'peer_name', v_recip_name,
      'peer_company', v_recip_comp,
      'peer_avatar', v_recip_avatar,
      'actionLabel', 'View Connection'
    ),
    NOW()
  );

  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id, new_data)
  VALUES (p_recipient_id, 'connection_accepted', 'connection_requests', p_request_id::text,
    jsonb_build_object('requester_id', v_req.requester_id, 'request_id', p_request_id));

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'status', 'accepted');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.accept_connection_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.accept_connection_request TO service_role;

-- ── 6. Hardened Atomic RPC: decline_connection_request ────────────────────────
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
    RETURN jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Not authorized to decline this request.');
  END IF;

  IF v_req.status <> 'pending' THEN
    RETURN jsonb_build_object('success', false, 'code', 'INVALID_STATE', 'error', 'Request is no longer pending.');
  END IF;

  UPDATE public.connection_requests 
  SET status = 'declined', updated_at = NOW() 
  WHERE id = p_request_id;

  -- Dismiss recipient notification
  UPDATE public.notifications
  SET read = TRUE
  WHERE user_id = p_recipient_id::text AND related_id = p_request_id::text;

  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id, new_data)
  VALUES (p_recipient_id, 'connection_declined', 'connection_requests', p_request_id::text,
    jsonb_build_object('requester_id', v_req.requester_id, 'request_id', p_request_id));

  RETURN jsonb_build_object('success', true, 'request_id', p_request_id, 'status', 'declined');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.decline_connection_request FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decline_connection_request TO service_role;
