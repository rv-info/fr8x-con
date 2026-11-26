-- =============================================================================
-- Nhost Migration 002: GREATEST updated_at guard + read_at / last_read_at sync
-- Non-destructive incremental migration (safe to run after 001_chat_schema.sql)
-- =============================================================================

-- 1. Protect conversation.updated_at against out-of-order historical message imports
CREATE OR REPLACE FUNCTION public.touch_chat_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_conversations
     SET updated_at = GREATEST(public.chat_conversations.updated_at, NEW.created_at)
   WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Keep chat_conversation_members.last_read_at synchronized when chat_messages.read_at is updated
CREATE OR REPLACE FUNCTION public.sync_member_last_read_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.read_at IS NOT NULL AND (OLD.read_at IS NULL OR NEW.read_at > OLD.read_at) THEN
    UPDATE public.chat_conversation_members
       SET last_read_at = GREATEST(COALESCE(last_read_at, NEW.read_at), NEW.read_at)
     WHERE conversation_id = NEW.conversation_id
       AND user_id = NEW.recipient_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_member_last_read_at ON public.chat_messages;
CREATE TRIGGER trg_sync_member_last_read_at
  AFTER UPDATE OF read_at ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_member_last_read_at();
