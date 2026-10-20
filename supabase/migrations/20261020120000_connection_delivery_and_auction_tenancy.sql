-- =============================================================================
-- FR8X: reliable connection delivery and invitation-only auction enforcement
-- =============================================================================

-- The legacy table remains in use by the current API, so recipient_id must be
-- treated exactly like receiver_id while the canonical connection migration is
-- completed.  Without this, a recipient can be unable to read their request.
DROP POLICY IF EXISTS "Connections viewable by involved users" ON public.connections;
CREATE POLICY "Connections viewable by involved users"
  ON public.connections FOR SELECT TO authenticated
  USING (
    requester_id = auth.uid()::text OR
    receiver_id = auth.uid()::text OR
    recipient_id = auth.uid()::text OR
    requester_id = (SELECT uid FROM public.profiles WHERE id = auth.uid()) OR
    receiver_id = (SELECT uid FROM public.profiles WHERE id = auth.uid()) OR
    recipient_id = (SELECT uid FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can update own connections" ON public.connections;
CREATE POLICY "Users can update own connections"
  ON public.connections FOR UPDATE TO authenticated
  USING (
    requester_id = auth.uid()::text OR
    receiver_id = auth.uid()::text OR
    recipient_id = auth.uid()::text OR
    receiver_id = (SELECT uid FROM public.profiles WHERE id = auth.uid()) OR
    recipient_id = (SELECT uid FROM public.profiles WHERE id = auth.uid())
  );

-- Persist bidder access controls. JSONB supports both existing member IDs and
-- the richer bidder objects already emitted by the auction creation screen.
ALTER TABLE public.auctions
  ADD COLUMN IF NOT EXISTS selected_bidders JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS blocked_bidders JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_auctions_selected_bidders_gin
  ON public.auctions USING GIN (selected_bidders);

NOTIFY pgrst, 'reload schema';
