-- =============================================================================
-- Nhost PostgreSQL Chat Schema (Exclusively for FR8X Floating Chat)
-- Apply in Nhost SQL Editor / Migrations
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Conversations
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  direct_key     TEXT        UNIQUE NOT NULL,
  context_type   TEXT,
  context_id     TEXT,
  context_title  TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Conversation Members
CREATE TABLE IF NOT EXISTS public.chat_conversation_members (
  conversation_id UUID        NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  user_id         TEXT        NOT NULL,
  joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_read_at    TIMESTAMPTZ,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_members_user
  ON public.chat_conversation_members(user_id);

-- 3. Messages
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id   UUID        NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id         TEXT        NOT NULL,
  recipient_id      TEXT        NOT NULL,
  client_message_id TEXT,
  content           TEXT        NOT NULL,
  message_type      TEXT        NOT NULL DEFAULT 'text',
  attachments       JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  read_at           TIMESTAMPTZ,
  edited_at         TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_messages_client_id
  ON public.chat_messages(sender_id, client_message_id)
  WHERE client_message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_created
  ON public.chat_messages(conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_recipient_unread
  ON public.chat_messages(recipient_id, read_at)
  WHERE read_at IS NULL;

-- 4. Database-Backed Presence & Typing Sessions
CREATE TABLE IF NOT EXISTS public.chat_presence_sessions (
  session_id             TEXT        PRIMARY KEY,
  user_id                TEXT        NOT NULL,
  status                 TEXT        NOT NULL DEFAULT 'active',
  last_seen_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  typing_conversation_id UUID        REFERENCES public.chat_conversations(id) ON DELETE SET NULL,
  typing_expires_at      TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_chat_presence_user_seen
  ON public.chat_presence_sessions(user_id, last_seen_at DESC);

-- 5. Keep conversation updated_at fresh on new messages
CREATE OR REPLACE FUNCTION public.touch_chat_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
     SET updated_at = NEW.created_at
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_touch_chat_conversation ON public.chat_messages;
CREATE TRIGGER trg_touch_chat_conversation
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_chat_conversation_updated_at();
