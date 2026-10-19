-- =============================================================================
-- FR8X CANONICAL RELATIONSHIPS, ATOMIC RPCs, CHAT TABLES & DATA RECONCILIATION
-- Migration: 20261019000000_canonical_relationships_and_chat.sql
-- =============================================================================

-- 1. Ensure required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "unaccent";

-- 2. Canonical connection_requests table
CREATE TABLE IF NOT EXISTS public.connection_requests (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'withdrawn')),
  message       TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_connection_requests_no_self CHECK (requester_id <> recipient_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_connection_requests_pending_unique
  ON public.connection_requests(requester_id, recipient_id)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_conn_requests_requester ON public.connection_requests(requester_id);
CREATE INDEX IF NOT EXISTS idx_conn_requests_recipient ON public.connection_requests(recipient_id);
CREATE INDEX IF NOT EXISTS idx_conn_requests_status ON public.connection_requests(status);

-- 3. Canonical accepted_connections table
CREATE TABLE IF NOT EXISTS public.accepted_connections (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  connected_to      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_id        UUID REFERENCES public.connection_requests(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_accepted_connections_no_self CHECK (user_id <> connected_to)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_accepted_connections_pair_unique
  ON public.accepted_connections(user_id, connected_to);

CREATE INDEX IF NOT EXISTS idx_accepted_connections_user ON public.accepted_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_accepted_connections_connected ON public.accepted_connections(connected_to);

-- 4. Canonical user_blocks table
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason      TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_user_blocks_no_self CHECK (blocker_id <> blocked_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_blocks_pair_unique
  ON public.user_blocks(blocker_id, blocked_id);

-- 5. Canonical Chat Schema: conversations, conversation_participants, messages
CREATE TABLE IF NOT EXISTS public.conversations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title       TEXT,
  is_group    BOOLEAN NOT NULL DEFAULT false,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role             TEXT DEFAULT 'member',
  last_read_at     TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  joined_at        TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT chk_conversation_participant_unique UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON public.conversation_participants(conversation_id);

CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id  UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  media_url        TEXT,
  media_type       TEXT,
  is_read          BOOLEAN NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- 6. Add grand_total_usd to auction_bids if not exists for schema alignment
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'auction_bids') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'auction_bids' AND column_name = 'grand_total_usd') THEN
      ALTER TABLE public.auction_bids ADD COLUMN grand_total_usd NUMERIC;
    END IF;
  END IF;
END $$;

-- 7. Add publication to supabase_realtime
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.connection_requests;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.accepted_connections;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

-- 8. Enable Row-Level Security
ALTER TABLE public.connection_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accepted_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies for Chat
DROP POLICY IF EXISTS "Participants can view conversations" ON public.conversations;
CREATE POLICY "Participants can view conversations" ON public.conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can view messages" ON public.messages;
CREATE POLICY "Participants can view messages" ON public.messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Participants can insert messages" ON public.messages;
CREATE POLICY "Participants can insert messages" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = messages.conversation_id AND cp.user_id = auth.uid()
    )
  );

-- 10. Data Reconciliation from legacy connections table
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'connections') THEN
    -- Migrate pending connections into connection_requests
    INSERT INTO public.connection_requests(id, requester_id, recipient_id, status, created_at, updated_at)
    SELECT
      c.id::uuid,
      c.requester_id::uuid,
      coalesce(c.recipient_id, c.receiver_id)::uuid,
      'pending',
      c.created_at,
      c.updated_at
    FROM public.connections c
    WHERE c.status = 'pending'
      AND c.id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND c.requester_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND coalesce(c.recipient_id, c.receiver_id) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND c.requester_id <> coalesce(c.recipient_id, c.receiver_id)
    ON CONFLICT (requester_id, recipient_id) WHERE status = 'pending' DO NOTHING;

    -- Migrate accepted connections into accepted_connections (both directions)
    INSERT INTO public.accepted_connections(user_id, connected_to, created_at)
    SELECT
      c.requester_id::uuid,
      coalesce(c.recipient_id, c.receiver_id)::uuid,
      c.created_at
    FROM public.connections c
    WHERE c.status = 'accepted'
      AND c.requester_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND coalesce(c.recipient_id, c.receiver_id) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND c.requester_id <> coalesce(c.recipient_id, c.receiver_id)
    ON CONFLICT (user_id, connected_to) DO NOTHING;

    INSERT INTO public.accepted_connections(user_id, connected_to, created_at)
    SELECT
      coalesce(c.recipient_id, c.receiver_id)::uuid,
      c.requester_id::uuid,
      c.created_at
    FROM public.connections c
    WHERE c.status = 'accepted'
      AND c.requester_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND coalesce(c.recipient_id, c.receiver_id) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      AND c.requester_id <> coalesce(c.recipient_id, c.receiver_id)
    ON CONFLICT (user_id, connected_to) DO NOTHING;
  END IF;
END $$;
