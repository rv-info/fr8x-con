-- =============================================================================
-- FR8X: connection request delivery guarantees
-- A request is stored once in shared Supabase storage so the recipient can
-- review it from any application instance.
-- =============================================================================

-- Retain the newest request for legacy pairs that were written more than once
-- before the uniqueness rule existed.
WITH ranked_pending_requests AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY requester_id, recipient_id
      ORDER BY created_at DESC NULLS LAST, id DESC
    ) AS row_number
  FROM public.connections
  WHERE status = 'pending' AND recipient_id IS NOT NULL
)
UPDATE public.connections AS connection
SET status = 'withdrawn', updated_at = NOW()
FROM ranked_pending_requests AS ranked
WHERE connection.id = ranked.id AND ranked.row_number > 1;

-- Prevent duplicate pending requests while allowing a new request after a
-- previous request has been declined, rejected, or withdrawn.
CREATE UNIQUE INDEX IF NOT EXISTS uidx_connections_pending_request
  ON public.connections (requester_id, recipient_id)
  WHERE status = 'pending' AND recipient_id IS NOT NULL;

-- This is the primary query used by the recipient's Incoming tab.
CREATE INDEX IF NOT EXISTS idx_connections_recipient_pending_created
  ON public.connections (recipient_id, created_at DESC)
  WHERE status = 'pending';

-- Notify connected clients when a recipient receives, accepts, or rejects a
-- request. The block is idempotent for environments where the table is already
-- part of the realtime publication.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'connections'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.connections REPLICA IDENTITY FULL;

NOTIFY pgrst, 'reload schema';
