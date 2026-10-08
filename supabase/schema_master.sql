-- ============================================================================
-- FR8X COMPLETE MASTER PRODUCTION SCHEMA & SEED MIGRATION
-- Project: fr8x-con (https://haarbaqeuuirwkhmefev.supabase.co)
-- Single Source of Truth: Supabase PostgreSQL
-- ============================================================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Automatic updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 1. COMPANIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  name TEXT,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  country TEXT DEFAULT 'India',
  state TEXT,
  city TEXT,
  postal_code TEXT,
  registered_address TEXT,
  operating_address TEXT,
  address TEXT,
  company_type TEXT,
  registration_number TEXT,
  gstin TEXT,
  gstn TEXT,
  pan TEXT,
  cin TEXT,
  iec TEXT,
  mto TEXT,
  status TEXT DEFAULT 'verified',
  verified BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT TRUE,
  member_count INT DEFAULT 1,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  admin_notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_city ON public.companies(city);

DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies viewable by all authenticated users" ON public.companies;
CREATE POLICY "Companies viewable by all authenticated users"
  ON public.companies FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Companies insertable by authenticated users" ON public.companies;
CREATE POLICY "Companies insertable by authenticated users"
  ON public.companies FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Companies updatable by authenticated users" ON public.companies;
CREATE POLICY "Companies updatable by authenticated users"
  ON public.companies FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Companies deletable by service role only" ON public.companies;
CREATE POLICY "Companies deletable by service role only"
  ON public.companies FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 2. PROFILES TABLE (Linked 1:1 with auth.users)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uid TEXT,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  display_name TEXT,
  phone TEXT,
  mobile TEXT,
  isd_code TEXT DEFAULT '+91',
  whatsapp_same_as_mobile BOOLEAN DEFAULT TRUE,
  designation TEXT,
  position TEXT,
  company_name TEXT,
  company_id TEXT REFERENCES public.companies(id) ON DELETE SET NULL,
  department TEXT DEFAULT 'Logistics & Supply Chain',
  city TEXT,
  state TEXT,
  district TEXT,
  country TEXT DEFAULT 'India',
  area TEXT,
  postal_code TEXT,
  formatted_address TEXT,
  address TEXT,
  location TEXT,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  avatar_url TEXT,
  company_logo_url TEXT,
  role TEXT DEFAULT 'company_admin',
  plan TEXT DEFAULT 'trial',
  has_golden_tick BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'active',
  account_status TEXT DEFAULT 'active',
  first_login_completed BOOLEAN DEFAULT FALSE,
  failed_login_attempts INT DEFAULT 0,
  experiences JSONB DEFAULT '[]'::jsonb,
  educations JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  privacy_settings JSONB DEFAULT '{
    "emailVisibility": "public",
    "phoneVisibility": "public",
    "statutoryVisibility": "public",
    "companyVisibility": "public",
    "tradeLanesVisibility": "public",
    "bioVisibility": "public",
    "allowConnectionRequests": true
  }'::jsonb,
  gstn TEXT,
  pan TEXT,
  cin TEXT,
  iec TEXT,
  mto TEXT,
  summary TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_uid ON public.profiles(uid);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Automatic profile provisioner on auth.users insert
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = LOWER(NEW.email)) THEN
    UPDATE public.profiles
    SET
      id = NEW.id,
      updated_at = NOW()
    WHERE email = LOWER(NEW.email);
  ELSE
    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      first_name,
      last_name,
      phone,
      mobile,
      designation,
      company_name,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      LOWER(NEW.email),
      COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'displayName', split_part(NEW.email, '@', 1)),
      COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName', ''),
      COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'lastName', ''),
      COALESCE(NEW.raw_user_meta_data->>'phone', NEW.raw_user_meta_data->>'mobile', ''),
      COALESCE(NEW.raw_user_meta_data->>'mobile', NEW.raw_user_meta_data->>'phone', ''),
      COALESCE(NEW.raw_user_meta_data->>'designation', 'Freight Logistics Specialist'),
      COALESCE(NEW.raw_user_meta_data->>'company', NEW.raw_user_meta_data->>'companyName', 'Enterprise Organization'),
      NOW(),
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      email = EXCLUDED.email,
      updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles are readable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles are readable by authenticated users"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Only service role can delete profiles" ON public.profiles;
CREATE POLICY "Only service role can delete profiles"
  ON public.profiles FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 3. RATES TABLE (Freight Rate Cards & Spot Tariffs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.rates (
  id TEXT PRIMARY KEY,
  sp TEXT NOT NULL,
  line TEXT NOT NULL,
  por TEXT NOT NULL,
  pol TEXT NOT NULL,
  pod TEXT NOT NULL,
  fpod TEXT NOT NULL,
  rate20 NUMERIC NOT NULL DEFAULT 0,
  rate40 NUMERIC NOT NULL DEFAULT 0,
  rate40hc NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  type TEXT DEFAULT 'Direct Spot',
  ft INT DEFAULT 14,
  validity DATE NOT NULL,
  transit_time TEXT,
  owner_uid TEXT,
  created_by TEXT,
  is_owner BOOLEAN DEFAULT TRUE,
  is_self_posted BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rates_pol_pod ON public.rates(pol, pod);
CREATE INDEX IF NOT EXISTS idx_rates_validity ON public.rates(validity);
CREATE INDEX IF NOT EXISTS idx_rates_status ON public.rates(status);

DROP TRIGGER IF EXISTS set_rates_updated_at ON public.rates;
CREATE TRIGGER set_rates_updated_at
  BEFORE UPDATE ON public.rates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Active rates viewable by authenticated users" ON public.rates;
CREATE POLICY "Active rates viewable by authenticated users"
  ON public.rates FOR SELECT
  USING (status = 'active' OR auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can create rates" ON public.rates;
CREATE POLICY "Authenticated users can create rates"
  ON public.rates FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Rate creators can update their rates" ON public.rates;
CREATE POLICY "Rate creators can update their rates"
  ON public.rates FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Rate creators can delete their rates" ON public.rates;
CREATE POLICY "Rate creators can delete their rates"
  ON public.rates FOR DELETE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 4. AUCTIONS TABLE (Reverse Freight Bidding)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.auctions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  rfq_id TEXT,
  creator_uid TEXT,
  creator_name TEXT,
  creator_company TEXT,
  auction_type TEXT DEFAULT 'Specific bidder',
  start_date DATE,
  start_time TEXT,
  duration_minutes INT DEFAULT 120,
  end_date_time TIMESTAMPTZ,
  timezone TEXT DEFAULT 'Asia/Kolkata',
  status TEXT DEFAULT 'Draft',
  rank TEXT DEFAULT 'Pending',
  time_left TEXT,
  is_published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  competition_ceiling NUMERIC,
  bids_submitted_count INT DEFAULT 0,
  payment_status TEXT DEFAULT 'unpaid',
  posting_fee_inr NUMERIC DEFAULT 300,
  shipment JSONB NOT NULL DEFAULT '{}'::jsonb,
  containers JSONB NOT NULL DEFAULT '[]'::jsonb,
  origin_charges JSONB DEFAULT '{}'::jsonb,
  destination_charges JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auctions_creator ON public.auctions(creator_uid);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.auctions(status);

DROP TRIGGER IF EXISTS set_auctions_updated_at ON public.auctions;
CREATE TRIGGER set_auctions_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Auctions viewable by all users" ON public.auctions;
CREATE POLICY "Auctions viewable by all users"
  ON public.auctions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create auctions" ON public.auctions;
CREATE POLICY "Authenticated users can create auctions"
  ON public.auctions FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Auction creators can update their auctions" ON public.auctions;
CREATE POLICY "Auction creators can update their auctions"
  ON public.auctions FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Auction creators can delete their auctions" ON public.auctions;
CREATE POLICY "Auction creators can delete their auctions"
  ON public.auctions FOR DELETE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Helper RPC function to increment bids
CREATE OR REPLACE FUNCTION public.increment_auction_bids(a_id TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE public.auctions
  SET bids_submitted_count = bids_submitted_count + 1,
      updated_at = NOW()
  WHERE id = a_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 5. AUCTION BIDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_id TEXT,
  bidder_uid TEXT,
  bidder_name TEXT,
  bidder_company TEXT,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  transit_days INT,
  free_days INT,
  carrier TEXT,
  routing TEXT,
  remarks TEXT,
  rank INT,
  details JSONB DEFAULT '{}'::jsonb,
  status TEXT DEFAULT 'active',
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_auction_bids_auction_id ON public.auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_auction_bids_amount ON public.auction_bids(amount);

ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Bids viewable by authenticated users" ON public.auction_bids;
CREATE POLICY "Bids viewable by authenticated users"
  ON public.auction_bids FOR SELECT
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authenticated users can place bids" ON public.auction_bids;
CREATE POLICY "Authenticated users can place bids"
  ON public.auction_bids FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Bidders can update their bids" ON public.auction_bids;
CREATE POLICY "Bidders can update their bids"
  ON public.auction_bids FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 6. POSTS & COMMENTS (Feed & Professional Social Network)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  author_id TEXT,
  author_uid TEXT,
  author_name TEXT,
  author_avatar TEXT,
  author_company TEXT,
  author_designation TEXT,
  title TEXT,
  content TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  media_urls JSONB DEFAULT '[]'::jsonb,
  attachments JSONB DEFAULT '[]'::jsonb,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  status TEXT DEFAULT 'published',
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_posts_status ON public.posts(status);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

DROP TRIGGER IF EXISTS set_posts_updated_at ON public.posts;
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Posts viewable by all users" ON public.posts;
CREATE POLICY "Posts viewable by all users"
  ON public.posts FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create posts" ON public.posts;
CREATE POLICY "Authenticated users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authors can update their posts" ON public.posts;
CREATE POLICY "Authors can update their posts"
  ON public.posts FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Authors can delete their posts" ON public.posts;
CREATE POLICY "Authors can delete their posts"
  ON public.posts FOR DELETE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

CREATE TABLE IF NOT EXISTS public.post_comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id TEXT,
  author_uid TEXT,
  author_name TEXT,
  author_avatar TEXT,
  content TEXT NOT NULL,
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.post_comments(post_id);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Comments viewable by all users" ON public.post_comments;
CREATE POLICY "Comments viewable by all users"
  ON public.post_comments FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.post_comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 7. JOBS TABLE (Logistics Recruitment & Postings)
-- ============================================================================
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

DROP POLICY IF EXISTS "Jobs viewable by all users" ON public.jobs;
CREATE POLICY "Jobs viewable by all users"
  ON public.jobs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can manage jobs" ON public.jobs;
CREATE POLICY "Authenticated users can manage jobs"
  ON public.jobs FOR ALL
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 8. CASES TABLE (Support & Dispute Tickets)
-- ============================================================================
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
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update their own cases" ON public.cases;
CREATE POLICY "Users can update their own cases"
  ON public.cases FOR UPDATE
  USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

-- ============================================================================
-- 9. TRANSACTIONS TABLE (Razorpay Ledger & Invoices)
-- ============================================================================
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
  USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Transactions manageable by service role" ON public.transactions;
CREATE POLICY "Transactions manageable by service role"
  ON public.transactions FOR ALL
  USING (auth.role() = 'service_role');

-- ============================================================================
-- 10. REVIEWS TABLE (Counterparty & Carrier Reviews)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  target_id TEXT NOT NULL,
  target_type TEXT DEFAULT 'company',
  author_id TEXT NOT NULL,
  author_name TEXT,
  author_company TEXT,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reviews_target_id ON public.reviews(target_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Reviews viewable by all users" ON public.reviews;
CREATE POLICY "Reviews viewable by all users"
  ON public.reviews FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
CREATE POLICY "Authenticated users can submit reviews"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- ============================================================================
-- 11. EVENTS TABLE (Telemetry & Security Audit Logs)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  event_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  actor_email TEXT,
  client_ip TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Events managed by service role" ON public.events;
CREATE POLICY "Events managed by service role"
  ON public.events FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Events insertable by system" ON public.events;
CREATE POLICY "Events insertable by system"
  ON public.events FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 12. INTENTS TABLE (Shipping & Matchmaking Intents)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.intents (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  intent_type TEXT NOT NULL,
  origin TEXT,
  destination TEXT,
  commodity TEXT,
  target_rate NUMERIC,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'open',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_intents_user_id ON public.intents(user_id);
CREATE INDEX IF NOT EXISTS idx_intents_status ON public.intents(status);

ALTER TABLE public.intents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Intents viewable by all authenticated users" ON public.intents;
CREATE POLICY "Intents viewable by all authenticated users"
  ON public.intents FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can manage own intents" ON public.intents;
CREATE POLICY "Users can manage own intents"
  ON public.intents FOR ALL
  USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

-- ============================================================================
-- 13. PRESENCE TABLE (Real-Time Availability & Heartbeat)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.presence (
  user_id TEXT PRIMARY KEY,
  status TEXT DEFAULT 'offline',
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  device_info TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_presence_status ON public.presence(status);

ALTER TABLE public.presence ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Presence viewable by all users" ON public.presence;
CREATE POLICY "Presence viewable by all users"
  ON public.presence FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update own presence" ON public.presence;
CREATE POLICY "Users can update own presence"
  ON public.presence FOR ALL
  USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

-- ============================================================================
-- 14. VERIFICATIONS TABLE (Email OTP & Verification Tokens)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.verifications (
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_verifications_email ON public.verifications(email);

ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Verifications accessible by service role only" ON public.verifications;
CREATE POLICY "Verifications accessible by service role only"
  ON public.verifications FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Verifications insertable by registration" ON public.verifications;
CREATE POLICY "Verifications insertable by registration"
  ON public.verifications FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- 15. AUDIT LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT,
  changes JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Audit logs viewable by service role or owner" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by service role or owner"
  ON public.audit_logs FOR SELECT
  USING (user_id = auth.uid()::text OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Audit logs insertable by system" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by system"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- Schema definition complete.
-- ============================================================================
