-- ==============================================================================
-- FR8X CRITICAL FIX: CONNECTION REQUEST RPC RESILIENCE & CANCELLATION
-- Migration: 20261018150000_fix_connection_request_status_and_cancellation.sql
-- ==============================================================================

-- 1. Ensure status column exists on public.profiles with safe default
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';
UPDATE public.profiles SET status = 'active' WHERE status IS NULL;

-- 2. Hardened Atomic RPC: send_connection_request (Fix column status check)
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

  -- Check recipient exists
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient_id) THEN
    RETURN jsonb_build_object('success', false, 'code', 'USER_NOT_FOUND',
      'error', 'The recipient profile was not found.');
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

  -- Check if duplicate pending request exists
  SELECT id INTO v_existing_id FROM public.connection_requests
  WHERE requester_id = p_requester_id AND recipient_id = p_recipient_id AND status = 'pending';

  IF v_existing_id IS NOT NULL THEN
    RETURN jsonb_build_object('success', true, 'request_id', v_existing_id, 'status', 'pending',
      'note', 'Existing pending request retained.');
  END IF;

  -- Check if reverse pending request exists -> auto-accept mutual connection!
  SELECT id INTO v_reverse_req FROM public.connection_requests
  WHERE requester_id = p_recipient_id AND recipient_id = p_requester_id AND status = 'pending';

  IF v_reverse_req IS NOT NULL THEN
    UPDATE public.connection_requests
    SET status = 'accepted', updated_at = NOW()
    WHERE id = v_reverse_req;

    INSERT INTO public.accepted_connections(user_id, connected_to, created_at)
    VALUES
      (p_requester_id, p_recipient_id, NOW()),
      (p_recipient_id, p_requester_id, NOW())
    ON CONFLICT (user_id, connected_to) DO NOTHING;

    RETURN jsonb_build_object('success', true, 'status', 'accepted', 'request_id', v_reverse_req,
      'note', 'Mutual connection established automatically.');
  END IF;

  -- Rate limit check: max 100 pending requests
  IF (SELECT COUNT(*) FROM public.connection_requests WHERE requester_id = p_requester_id AND status = 'pending') >= 100 THEN
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

REVOKE ALL ON FUNCTION public.send_connection_request FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.send_connection_request TO authenticated, service_role;

-- 3. Hardened Atomic RPC: cancel_connection_request (Support request_id OR recipient_id)
CREATE OR REPLACE FUNCTION public.cancel_connection_request(
  p_requester_id  UUID,
  p_request_id    UUID DEFAULT NULL,
  p_recipient_id  UUID DEFAULT NULL
)
RETURNS JSONB SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_req public.connection_requests%ROWTYPE;
BEGIN
  IF p_request_id IS NOT NULL THEN
    SELECT * INTO v_req FROM public.connection_requests 
    WHERE id = p_request_id FOR UPDATE;
  ELSIF p_recipient_id IS NOT NULL THEN
    SELECT * INTO v_req FROM public.connection_requests 
    WHERE requester_id = p_requester_id AND recipient_id = p_recipient_id AND status = 'pending'
    ORDER BY created_at DESC LIMIT 1 FOR UPDATE;
  ELSE
    RETURN jsonb_build_object('success', false, 'code', 'BAD_REQUEST', 'error', 'Either request_id or recipient_id is required.');
  END IF;

  IF v_req.id IS NULL THEN
    -- Even if not found as pending, return success so frontend client state is cleanly updated
    RETURN jsonb_build_object('success', true, 'status', 'cancelled', 'note', 'Request already inactive or not found.');
  END IF;

  IF v_req.requester_id <> p_requester_id THEN
    RETURN jsonb_build_object('success', false, 'code', 'FORBIDDEN', 'error', 'Not authorized to cancel this request.');
  END IF;

  UPDATE public.connection_requests 
  SET status = 'cancelled', updated_at = NOW() 
  WHERE id = v_req.id;

  -- Dismiss recipient notification
  UPDATE public.notifications
  SET read = TRUE,
      description = 'This connection request was withdrawn by the sender.'
  WHERE user_id = v_req.recipient_id::text AND related_id = v_req.id::text;

  INSERT INTO public.audit_logs(actor_uid, action, target_entity, target_id, new_data)
  VALUES (p_requester_id, 'connection_cancelled', 'connection_requests', v_req.id::text,
    jsonb_build_object('recipient_id', v_req.recipient_id, 'request_id', v_req.id));

  RETURN jsonb_build_object('success', true, 'request_id', v_req.id, 'status', 'cancelled');
END;
$$ LANGUAGE plpgsql;

REVOKE ALL ON FUNCTION public.cancel_connection_request FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cancel_connection_request TO authenticated, service_role;
