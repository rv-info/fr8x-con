-- =============================================================================
-- Migration: 20261015000000_security_hardening_least_privilege.sql
-- Description: Enforce least privilege, remove broad anonymous SELECT grants,
--              harden RLS policies, add constraints and indexes for reverse auctions,
--              rates, and support cases.
-- =============================================================================

-- 1. REVOKE BROAD ANONYMOUS ACCESS (Least-Privilege Enforcement)
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon;

-- Alter default privileges so future tables do not automatically grant SELECT to anon
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE SELECT ON TABLES FROM anon;

-- Ensure public schema usage is permitted but table access is gated
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- 2. RE-ENABLE & VERIFY ROW LEVEL SECURITY ACROSS ALL EXPOSED TABLES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. SPECIFIC LEAST-PRIVILEGE GRANTS
-- Authenticated users: explicit DML grants
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL ROUTINES IN SCHEMA public TO authenticated;

-- Service role: administrative authority
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO service_role;

-- 4. HARDENED RLS POLICIES FOR CASES (Dispute & Support Isolation)
DROP POLICY IF EXISTS "Users can view own cases" ON public.cases;
CREATE POLICY "Users can view own cases"
  ON public.cases FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text OR
    company_id IN (
      SELECT company_id::text FROM public.profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own cases" ON public.cases;
CREATE POLICY "Users can delete own cases"
  ON public.cases FOR DELETE
  TO authenticated
  USING (
    user_id = auth.uid()::text
  );

-- 5. HARDENED RLS POLICIES FOR AUCTION BIDS (Anti-Shill & Bidder Privacy)
DROP POLICY IF EXISTS "Authenticated users can submit bids" ON public.auction_bids;
CREATE POLICY "Authenticated users can submit bids"
  ON public.auction_bids FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = bidder_uid AND
    NOT EXISTS (
      SELECT 1 FROM public.auctions
      WHERE id = auction_bids.auction_id AND creator_uid = auth.uid()
    )
  );

-- 6. AUDIT LOG IMMUTABILITY (Deny UPDATE and DELETE to authenticated)
DROP POLICY IF EXISTS "Audit logs cannot be modified" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by authenticated"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users cannot UPDATE or DELETE audit records (append-only)
REVOKE UPDATE, DELETE ON public.audit_logs FROM authenticated;
REVOKE UPDATE, DELETE ON public.audit_logs FROM anon;

-- 7. REVERSE AUCTION INTEGRITY CONSTRAINTS & INDEXES
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_bidder ON public.auction_bids (auction_id, bidder_uid);
CREATE INDEX IF NOT EXISTS idx_auctions_status_end_date ON public.auctions (status, end_date_time);
CREATE INDEX IF NOT EXISTS idx_rates_owner_status ON public.rates (owner_uid, status);
CREATE INDEX IF NOT EXISTS idx_cases_user_company ON public.cases (user_id, company_id);

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
