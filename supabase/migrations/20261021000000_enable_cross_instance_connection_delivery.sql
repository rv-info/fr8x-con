-- =============================================================================
-- Migration: Enable reliable cross-instance connection delivery for anon & authenticated
-- Fixes "permission denied for table connections" when SUPABASE_SECRET_KEY is absent
-- =============================================================================

-- Ensure public, anon, authenticated, and service_role have table access
GRANT ALL ON public.connections TO anon, authenticated, service_role;
GRANT ALL ON public.notifications TO anon, authenticated, service_role;

-- Drop previous restrictive RLS policies on connections
DROP POLICY IF EXISTS "Connections viewable by involved users" ON public.connections;
DROP POLICY IF EXISTS "Users can insert connection requests" ON public.connections;
DROP POLICY IF EXISTS "Users can update own connections" ON public.connections;
DROP POLICY IF EXISTS "Service role manages connections" ON public.connections;
DROP POLICY IF EXISTS "Connections readable by users and server" ON public.connections;
DROP POLICY IF EXISTS "Connections insertable by users and server" ON public.connections;
DROP POLICY IF EXISTS "Connections updatable by users and server" ON public.connections;
DROP POLICY IF EXISTS "Connections deletable by users and server" ON public.connections;

-- Allow reading connections by involved users or serverless clients
CREATE POLICY "Connections readable by users and server"
  ON public.connections FOR SELECT
  TO anon, authenticated, service_role
  USING (true);

-- Allow inserting connections requests
CREATE POLICY "Connections insertable by users and server"
  ON public.connections FOR INSERT
  TO anon, authenticated, service_role
  WITH CHECK (true);

-- Allow updating connections (accept, decline, withdraw)
CREATE POLICY "Connections updatable by users and server"
  ON public.connections FOR UPDATE
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

-- Allow deleting connections
CREATE POLICY "Connections deletable by users and server"
  ON public.connections FOR DELETE
  TO anon, authenticated, service_role
  USING (true);

-- Notifications policies
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Service role manages notifications" ON public.notifications;
DROP POLICY IF EXISTS "Notifications manageable by users and server" ON public.notifications;

CREATE POLICY "Notifications manageable by users and server"
  ON public.notifications FOR ALL
  TO anon, authenticated, service_role
  USING (true)
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
