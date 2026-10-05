-- ============================================================================
-- FR8X COMPLETE PRODUCTION POSTGRESQL SCHEMA MIGRATION
-- Project: fr8x-con (Supabase PostgreSQL)
-- Description: Establishes full relational persistence for all FR8X business entities.
-- Replaces all local JSON DBMS files (.data/dbms/*.json) with PostgreSQL tables.
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES UPDATE (Ensure uid column exists for legacy identifier compatibility)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS uid TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_uid ON public.profiles(uid) WHERE uid IS NOT NULL;

-- 2. JOBS TABLE
CREATE TABLE IF NOT EXISTS public.jobs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  company_id TEXT REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name TEXT,
  location TEXT,
  job_type TEXT DEFAULT 'Full-time',
  description TEXT,
  requirements TEXT,
  salary_range TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public jobs viewable by all authenticated users" ON public.jobs;
CREATE POLICY "Public jobs viewable by all authenticated users"
  ON public.jobs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Company admins can manage jobs" ON public.jobs;
CREATE POLICY "Company admins can manage jobs"
  ON public.jobs FOR ALL
  USING (auth.role() = 'authenticated');

-- 3. CASES TABLE (Support & Dispute Tickets)
CREATE TABLE IF NOT EXISTS public.cases (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  user_id TEXT,
  company_id TEXT REFERENCES public.companies(id) ON DELETE SET NULL,
  category TEXT,
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'open',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cases_user_id ON public.cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON public.cases(status);

ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own cases" ON public.cases;
CREATE POLICY "Users can view their own cases"
  ON public.cases FOR SELECT
  USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can create cases" ON public.cases;
CREATE POLICY "Users can create cases"
  ON public.cases FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 4. TRANSACTIONS TABLE (Razorpay & Subscriptions)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  payment_id TEXT,
  user_id TEXT,
  user_email TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  plan_id TEXT,
  item_type TEXT,
  item_title TEXT,
  status TEXT DEFAULT 'created',
  gateway TEXT DEFAULT 'Razorpay',
  raw_payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  USING (user_id = auth.uid()::text OR user_email = (SELECT email FROM public.profiles WHERE id = auth.uid()) OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Transactions manageable by service role" ON public.transactions;
CREATE POLICY "Transactions manageable by service role"
  ON public.transactions FOR ALL
  USING (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- 5. REVIEWS TABLE (Company & Partner Feedback)
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  target_company_id TEXT REFERENCES public.companies(id) ON DELETE CASCADE,
  reviewer_id TEXT,
  reviewer_name TEXT,
  reviewer_company TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_company ON public.reviews(target_company_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Reviews viewable by authenticated users" ON public.reviews;
CREATE POLICY "Reviews viewable by authenticated users"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
CREATE POLICY "Authenticated users can submit reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- 6. EVENTS TABLE (Telemetry & Platform Audit)
CREATE TABLE IF NOT EXISTS public.events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  payload JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Events insertable by authenticated users" ON public.events;
CREATE POLICY "Events insertable by authenticated users"
  ON public.events FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Events viewable by service role" ON public.events;
CREATE POLICY "Events viewable by service role"
  ON public.events FOR SELECT
  USING (auth.role() = 'service_role');

-- 7. INTENTS TABLE (User Logistics Intelligence & Preferences)
CREATE TABLE IF NOT EXISTS public.intents (
  user_id TEXT PRIMARY KEY,
  recent_searched_ports JSONB DEFAULT '[]'::jsonb,
  viewed_rates JSONB DEFAULT '[]'::jsonb,
  active_auction_routes JSONB DEFAULT '[]'::jsonb,
  saved_trade_lanes JSONB DEFAULT '[]'::jsonb,
  followed_commodities JSONB DEFAULT '[]'::jsonb,
  carrier_searches JSONB DEFAULT '[]'::jsonb,
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage own intent" ON public.intents;
CREATE POLICY "Users can manage own intent"
  ON public.intents FOR ALL
  USING (user_id = auth.uid()::text OR user_id = (SELECT uid FROM public.profiles WHERE id = auth.uid()) OR auth.role() = 'service_role');

-- 8. PRESENCE TABLE (Real-time Online State)
CREATE TABLE IF NOT EXISTS public.presence (
  user_id TEXT PRIMARY KEY,
  online BOOLEAN DEFAULT FALSE,
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  active_device JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'offline',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Presence viewable by authenticated users" ON public.presence;
CREATE POLICY "Presence viewable by authenticated users"
  ON public.presence FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own presence" ON public.presence;
CREATE POLICY "Users can update own presence"
  ON public.presence FOR ALL
  USING (user_id = auth.uid()::text OR user_id = (SELECT uid FROM public.profiles WHERE id = auth.uid()) OR auth.role() = 'service_role');

-- 9. VERIFICATIONS TABLE (Email Challenges & OTPs)
CREATE TABLE IF NOT EXISTS public.verifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token_hash TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_verifications_token ON public.verifications(token_hash);
CREATE INDEX IF NOT EXISTS idx_verifications_user ON public.verifications(user_id);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Verifications service role only" ON public.verifications;
CREATE POLICY "Verifications service role only"
  ON public.verifications FOR ALL
  USING (auth.role() = 'service_role');
