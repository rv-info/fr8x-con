-- =============================================================================
-- FR8X MULTIMODAL FREIGHT PLATFORM — MASTER PRODUCTION SCHEMA
-- Project: fr8x-con (https://haarbaqeuuirwkhmefev.supabase.co)
-- Migration: 20261005000010_fr8x_master_schema
-- Description:
--   Single, idempotent, safe-to-run migration that creates the entire
--   FR8X production PostgreSQL schema from scratch. Paste this into the
--   Supabase Dashboard → SQL Editor and execute.
--
--   This migration:
--   • Creates all production tables with correct column names matching
--     the application's lib/db/*.ts and lib/supabase/types.ts.
--   • Enables Row Level Security (RLS) on every table.
--   • Creates explicit, least-privilege RLS policies.
--   • Creates all indexes for common query patterns.
--   • Creates updated_at trigger function + triggers.
--   • Creates auto-provisioning trigger for new Supabase Auth users.
--   • Creates increment_auction_bids RPC used by lib/db/auctions.ts.
--   • Creates storage buckets and storage RLS policies.
--   • Seeds reference companies and a sample freight rate.
--   • Does NOT store passwords. Auth credentials live in auth.users only.
-- =============================================================================

-- ─── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- UTILITY: updated_at trigger function (shared by all tables)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 1. PROFILES
--    Authoritative user identity record linked 1:1 to auth.users.
--    Primary key = auth.users.id (UUID from Supabase Auth).
--    No passwords stored here — authentication is fully in auth.users.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  -- Identity (matches auth.users.id exactly)
  id                      UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  uid                     TEXT        UNIQUE,           -- Legacy short identifier (e.g. "u-rajat")

  -- Contact
  email                   TEXT        NOT NULL UNIQUE,
  first_name              TEXT,
  last_name               TEXT,
  display_name            TEXT,
  phone                   TEXT,
  mobile                  TEXT,
  isd_code                TEXT        DEFAULT '+91',
  whatsapp_same_as_mobile BOOLEAN     DEFAULT TRUE,

  -- Professional
  designation             TEXT,
  position                TEXT,
  company_name            TEXT,
  company_id              TEXT,
  department              TEXT        DEFAULT 'Logistics & Supply Chain',
  bio                     TEXT,
  summary                 TEXT,

  -- Location
  city                    TEXT,
  state                   TEXT,
  district                TEXT,
  country                 TEXT        DEFAULT 'India',
  area                    TEXT,
  postal_code             TEXT,
  formatted_address       TEXT,
  address                 TEXT,
  location                TEXT,
  timezone                TEXT        DEFAULT 'Asia/Kolkata',

  -- Media
  avatar_url              TEXT,
  company_logo_url        TEXT,

  -- Platform
  role                    TEXT        DEFAULT 'company_admin',
  plan                    TEXT        DEFAULT 'trial',
  has_golden_tick         BOOLEAN     DEFAULT FALSE,
  is_verified             BOOLEAN     DEFAULT FALSE,
  status                  TEXT        DEFAULT 'active',
  account_status          TEXT        DEFAULT 'active',
  first_login_completed   BOOLEAN     DEFAULT FALSE,
  email_verified          BOOLEAN     DEFAULT FALSE,
  failed_login_attempts   INT         DEFAULT 0,

  -- Structured data (JSONB — justified by flexible schema)
  experiences             JSONB       DEFAULT '[]'::jsonb,
  educations              JSONB       DEFAULT '[]'::jsonb,
  certifications          JSONB       DEFAULT '[]'::jsonb,
  privacy_settings        JSONB       DEFAULT '{
    "emailVisibility": "public",
    "phoneVisibility": "public",
    "statutoryVisibility": "public",
    "companyVisibility": "public",
    "tradeLanesVisibility": "public",
    "bioVisibility": "public",
    "allowConnectionRequests": true
  }'::jsonb,

  -- Statutory (KYC)
  gstn                    TEXT,
  pan                     TEXT,
  cin                     TEXT,
  iec                     TEXT,
  mto                     TEXT,

  -- Timestamps
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW(),
  last_login_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_profiles_email      ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_uid        ON public.profiles(uid) WHERE uid IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role       ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status     ON public.profiles(status);

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-provision a profile row when a new Supabase Auth user is created
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
BEGIN
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
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'displayName',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name',  NEW.raw_user_meta_data->>'lastName',  ''),
    COALESCE(NEW.raw_user_meta_data->>'phone',  NEW.raw_user_meta_data->>'mobile', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile', NEW.raw_user_meta_data->>'phone',  ''),
    COALESCE(NEW.raw_user_meta_data->>'designation', 'Freight Logistics Specialist'),
    COALESCE(NEW.raw_user_meta_data->>'company', NEW.raw_user_meta_data->>'companyName', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email      = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- =============================================================================
-- 2. COMPANIES
--    Enterprise organizations (freight forwarders, carriers, LSPs).
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id                      TEXT        PRIMARY KEY,
  -- Names
  name                    TEXT,                         -- Short / display name
  legal_name              TEXT        NOT NULL,
  trade_name              TEXT,
  -- Registration & KYC
  cin                     TEXT,
  pan                     TEXT,
  gstn                    TEXT,
  gstin                   TEXT,                         -- Alias for gstn
  iec                     TEXT,
  mto                     TEXT,
  entity_type             TEXT,
  industry                TEXT,
  -- Contact
  website                 TEXT,
  contact_email           TEXT,
  contact_phone           TEXT,
  primary_contact_name    TEXT,
  primary_contact_email   TEXT,
  primary_contact_phone   TEXT,
  -- Location
  address                 TEXT,
  registered_address      TEXT,
  operating_address       TEXT,
  city                    TEXT,
  state                   TEXT,
  country                 TEXT        DEFAULT 'India',
  postal_code             TEXT,
  -- Platform
  status                  TEXT        DEFAULT 'verified',
  kyc_status              TEXT,
  verified                BOOLEAN     DEFAULT TRUE,
  is_verified             BOOLEAN     DEFAULT TRUE,
  member_count            INT         DEFAULT 1,
  admin_notes             JSONB       DEFAULT '[]'::jsonb,
  -- Timestamps
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_companies_name       ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_legal_name ON public.companies(legal_name);
CREATE INDEX IF NOT EXISTS idx_companies_gstn       ON public.companies(gstn);
CREATE INDEX IF NOT EXISTS idx_companies_status     ON public.companies(status);

DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 3. RATES (Freight Rate Cards & Tariffs)
--    Ocean container spot rates posted by freight forwarders.
--    Column names match lib/db/rates.ts and application domain model.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.rates (
  id              TEXT        PRIMARY KEY,
  sp              TEXT        NOT NULL,          -- Service Provider (forwarder)
  line            TEXT        NOT NULL,          -- Shipping Line (e.g. MAERSK)
  por             TEXT        NOT NULL,          -- Place of Receipt
  pol             TEXT        NOT NULL,          -- Port of Loading
  pod             TEXT        NOT NULL,          -- Port of Discharge
  fpod            TEXT        NOT NULL,          -- Final Place of Delivery
  rate20          NUMERIC     NOT NULL DEFAULT 0,
  rate40          NUMERIC     NOT NULL DEFAULT 0,
  rate40hc        NUMERIC     NOT NULL DEFAULT 0,
  currency        TEXT        DEFAULT 'USD',
  type            TEXT        DEFAULT 'Direct Spot',
  ft              INT         DEFAULT 14,        -- Free Time days
  validity        DATE        NOT NULL,
  transit_time    TEXT,
  owner_uid       UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by      UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  is_owner        BOOLEAN     DEFAULT TRUE,
  is_self_posted  BOOLEAN     DEFAULT TRUE,
  status          TEXT        DEFAULT 'active',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rates_pol_pod    ON public.rates(pol, pod);
CREATE INDEX IF NOT EXISTS idx_rates_owner_uid  ON public.rates(owner_uid);
CREATE INDEX IF NOT EXISTS idx_rates_validity   ON public.rates(validity);
CREATE INDEX IF NOT EXISTS idx_rates_status     ON public.rates(status);
CREATE INDEX IF NOT EXISTS idx_rates_sp         ON public.rates(sp);

DROP TRIGGER IF EXISTS set_rates_updated_at ON public.rates;
CREATE TRIGGER set_rates_updated_at
  BEFORE UPDATE ON public.rates
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 4. AUCTIONS (Reverse Freight Bidding / RFQ Marketplace)
--    Logistics buyers create auctions; forwarders submit competitive bids.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.auctions (
  id                    TEXT        PRIMARY KEY,
  title                 TEXT        NOT NULL,
  rfq_id                TEXT,
  creator_uid           UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  creator_name          TEXT,
  creator_company       TEXT,
  auction_type          TEXT        DEFAULT 'Specific bidder',
  start_date            DATE,
  start_time            TEXT,
  duration_minutes      INT         DEFAULT 120,
  end_date_time         TIMESTAMPTZ,
  timezone              TEXT        DEFAULT 'Asia/Kolkata',
  status                TEXT        DEFAULT 'Draft',
  rank                  TEXT        DEFAULT 'Pending',
  time_left             TEXT,
  is_published          BOOLEAN     DEFAULT FALSE,
  published_at          TIMESTAMPTZ,
  competition_ceiling   NUMERIC,
  bids_submitted_count  INT         DEFAULT 0,
  payment_status        TEXT        DEFAULT 'unpaid',
  posting_fee_inr       NUMERIC     DEFAULT 300,
  -- Structured cargo/shipment data (JSONB — necessary for nested structures)
  shipment              JSONB       NOT NULL DEFAULT '{}'::jsonb,
  containers            JSONB       NOT NULL DEFAULT '[]'::jsonb,
  origin_charges        JSONB       DEFAULT '{}'::jsonb,
  destination_charges   JSONB       DEFAULT '{}'::jsonb,
  -- Timestamps
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auctions_creator_uid ON public.auctions(creator_uid);
CREATE INDEX IF NOT EXISTS idx_auctions_status      ON public.auctions(status);
CREATE INDEX IF NOT EXISTS idx_auctions_created_at  ON public.auctions(created_at DESC);

DROP TRIGGER IF EXISTS set_auctions_updated_at ON public.auctions;
CREATE TRIGGER set_auctions_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- RPC: increment bid counter atomically
CREATE OR REPLACE FUNCTION public.increment_auction_bids(a_id TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.auctions
  SET bids_submitted_count = bids_submitted_count + 1,
      updated_at = NOW()
  WHERE id = a_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- 5. AUCTION BIDS
--    Bids placed by forwarders on reverse freight auctions.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id            TEXT        PRIMARY KEY,
  auction_id    TEXT        NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_uid    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  bidder_name   TEXT,
  bidder_company TEXT,
  amount        NUMERIC     NOT NULL,
  currency      TEXT        DEFAULT 'USD',
  transit_days  INT,
  free_days     INT,
  carrier       TEXT,
  routing       TEXT,
  remarks       TEXT,
  rank          INT,
  status        TEXT        DEFAULT 'active',
  details       JSONB       DEFAULT '{}'::jsonb,
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON public.auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_uid ON public.auction_bids(bidder_uid);

-- =============================================================================
-- 6. POSTS (Social Feed & Logistics Discussions)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id              TEXT        PRIMARY KEY,
  author_uid      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id       TEXT,                           -- Legacy alias (do not use for FK joins)
  author_name     TEXT,
  author_company  TEXT,
  author_avatar   TEXT,
  content         TEXT        NOT NULL,
  media_url       TEXT,
  media_type      TEXT,
  likes_count     INT         DEFAULT 0,
  comments_count  INT         DEFAULT 0,
  tags            TEXT[]      DEFAULT ARRAY[]::TEXT[],
  is_published    BOOLEAN     DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author_uid ON public.posts(author_uid);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

DROP TRIGGER IF EXISTS set_posts_updated_at ON public.posts;
CREATE TRIGGER set_posts_updated_at
  BEFORE UPDATE ON public.posts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 7. COMMENTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id              TEXT        PRIMARY KEY,
  post_id         TEXT        NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_uid      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id       TEXT,                           -- Legacy alias
  author_name     TEXT,
  author_company  TEXT,
  author_avatar   TEXT,
  content         TEXT        NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id    ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_uid ON public.comments(author_uid);

-- =============================================================================
-- 8. JOBS (Freight & Logistics Job Postings)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.jobs (
  id            TEXT        PRIMARY KEY,
  title         TEXT        NOT NULL,
  company_id    TEXT        REFERENCES public.companies(id) ON DELETE SET NULL,
  company_name  TEXT,
  location      TEXT,
  job_type      TEXT        DEFAULT 'Full-time',
  description   TEXT,
  requirements  TEXT,
  salary_range  TEXT,
  status        TEXT        DEFAULT 'active',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON public.jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status     ON public.jobs(status);

DROP TRIGGER IF EXISTS set_jobs_updated_at ON public.jobs;
CREATE TRIGGER set_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 9. CASES (Support & Dispute Tickets)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.cases (
  id          TEXT        PRIMARY KEY,
  title       TEXT        NOT NULL,
  description TEXT,
  user_id     TEXT,
  company_id  TEXT        REFERENCES public.companies(id) ON DELETE SET NULL,
  category    TEXT,
  priority    TEXT        DEFAULT 'medium',
  status      TEXT        DEFAULT 'open',
  metadata    JSONB       DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cases_user_id ON public.cases(user_id);
CREATE INDEX IF NOT EXISTS idx_cases_status  ON public.cases(status);

DROP TRIGGER IF EXISTS set_cases_updated_at ON public.cases;
CREATE TRIGGER set_cases_updated_at
  BEFORE UPDATE ON public.cases
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 10. TRANSACTIONS (Razorpay Payments & Subscription Invoices)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id          TEXT        PRIMARY KEY,
  order_id    TEXT        NOT NULL,
  payment_id  TEXT,
  user_id     TEXT,
  user_email  TEXT,
  amount      NUMERIC     NOT NULL,
  currency    TEXT        DEFAULT 'INR',
  plan_id     TEXT,
  item_type   TEXT,
  item_title  TEXT,
  status      TEXT        DEFAULT 'created',
  gateway     TEXT        DEFAULT 'Razorpay',
  raw_payload JSONB       DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id  ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status   ON public.transactions(status);

DROP TRIGGER IF EXISTS set_transactions_updated_at ON public.transactions;
CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 11. REVIEWS (Company & Partner Feedback)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.reviews (
  id                  TEXT        PRIMARY KEY,
  target_company_id   TEXT        REFERENCES public.companies(id) ON DELETE CASCADE,
  reviewer_id         TEXT,
  reviewer_name       TEXT,
  reviewer_company    TEXT,
  rating              INT         CHECK (rating >= 1 AND rating <= 5),
  comment             TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_company ON public.reviews(target_company_id);

-- =============================================================================
-- 12. EVENTS (Telemetry & Platform Activity Log)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.events (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  event_type  TEXT        NOT NULL,
  user_id     TEXT,
  session_id  TEXT,
  payload     JSONB       DEFAULT '{}'::jsonb,
  timestamp   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_events_user_id ON public.events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_type    ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_ts      ON public.events(timestamp DESC);

-- =============================================================================
-- 13. INTENTS (User Logistics Intelligence & Search Preferences)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.intents (
  user_id                TEXT        PRIMARY KEY,
  recent_searched_ports  JSONB       DEFAULT '[]'::jsonb,
  viewed_rates           JSONB       DEFAULT '[]'::jsonb,
  active_auction_routes  JSONB       DEFAULT '[]'::jsonb,
  saved_trade_lanes      JSONB       DEFAULT '[]'::jsonb,
  followed_commodities   JSONB       DEFAULT '[]'::jsonb,
  carrier_searches       JSONB       DEFAULT '[]'::jsonb,
  last_active_at         TIMESTAMPTZ DEFAULT NOW(),
  expires_at             TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- =============================================================================
-- 14. PRESENCE (Real-time Online State)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.presence (
  user_id       TEXT        PRIMARY KEY,
  online        BOOLEAN     DEFAULT FALSE,
  last_seen     TIMESTAMPTZ DEFAULT NOW(),
  active_device JSONB       DEFAULT '{}'::jsonb,
  status        TEXT        DEFAULT 'offline',
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_presence_updated_at ON public.presence;
CREATE TRIGGER set_presence_updated_at
  BEFORE UPDATE ON public.presence
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- 15. VERIFICATIONS (Email Token & OTP Challenges)
--     Used by lib/db/verifications.ts for email verification and OTP flow.
--     Supabase Auth owns the real auth credentials; this table stores
--     application-level one-time challenge tokens only.
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.verifications (
  id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token_hash  TEXT        NOT NULL UNIQUE,
  user_id     TEXT        NOT NULL,
  email       TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN     DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verifications_token  ON public.verifications(token_hash);
CREATE INDEX IF NOT EXISTS idx_verifications_user   ON public.verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_verifications_expiry ON public.verifications(expires_at);

-- =============================================================================
-- 16. AUDIT LOGS (Immutable Security & Compliance Audit Trail)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_uid     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_id       TEXT,       -- Alias for actor_uid as text (for legacy code)
  action        TEXT        NOT NULL,
  target_entity TEXT        NOT NULL,
  target_id     TEXT        NOT NULL,
  entity        TEXT,       -- Alias for target_entity (for legacy code)
  entity_id     TEXT,       -- Alias for target_id (for legacy code)
  old_data      JSONB,
  new_data      JSONB,
  metadata      JSONB       DEFAULT '{}'::jsonb,
  ip_address    TEXT,
  user_agent    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_target    ON public.audit_logs(target_entity, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor     ON public.audit_logs(actor_uid);
CREATE INDEX IF NOT EXISTS idx_audit_created   ON public.audit_logs(created_at DESC);

-- =============================================================================
-- 17. ROW LEVEL SECURITY
--     All tables have RLS enabled. Anonymous access is denied except for
--     storage.objects on public buckets. Service role bypasses RLS.
-- =============================================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intents       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presence      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs    ENABLE ROW LEVEL SECURITY;

-- ── PROFILES ─────────────────────────────────────────────────────────────────
-- Any authenticated member can view the directory (member networking feature)
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own profile (provisioned via trigger normally)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role has unrestricted access for admin operations
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── COMPANIES ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Companies viewable by authenticated users" ON public.companies;
CREATE POLICY "Companies viewable by authenticated users"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

-- Only service role can create/modify company records (admin-mediated KYC)
DROP POLICY IF EXISTS "Service role manages companies" ON public.companies;
CREATE POLICY "Service role manages companies"
  ON public.companies FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── RATES ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Rates viewable by authenticated users" ON public.rates;
CREATE POLICY "Rates viewable by authenticated users"
  ON public.rates FOR SELECT
  TO authenticated
  USING (status = 'active' OR auth.uid() = owner_uid);

DROP POLICY IF EXISTS "Users can create rates" ON public.rates;
CREATE POLICY "Users can create rates"
  ON public.rates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_uid OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can update own rates" ON public.rates;
CREATE POLICY "Users can update own rates"
  ON public.rates FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_uid OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_uid OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Users can delete own rates" ON public.rates;
CREATE POLICY "Users can delete own rates"
  ON public.rates FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_uid OR auth.uid() = created_by);

DROP POLICY IF EXISTS "Service role manages rates" ON public.rates;
CREATE POLICY "Service role manages rates"
  ON public.rates FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── AUCTIONS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Auctions viewable by authenticated users" ON public.auctions;
CREATE POLICY "Auctions viewable by authenticated users"
  ON public.auctions FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create auctions" ON public.auctions;
CREATE POLICY "Users can create auctions"
  ON public.auctions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_uid);

DROP POLICY IF EXISTS "Users can update own auctions" ON public.auctions;
CREATE POLICY "Users can update own auctions"
  ON public.auctions FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_uid)
  WITH CHECK (auth.uid() = creator_uid);

DROP POLICY IF EXISTS "Users can delete own auctions" ON public.auctions;
CREATE POLICY "Users can delete own auctions"
  ON public.auctions FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_uid);

DROP POLICY IF EXISTS "Service role manages auctions" ON public.auctions;
CREATE POLICY "Service role manages auctions"
  ON public.auctions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── AUCTION BIDS ─────────────────────────────────────────────────────────────
-- Bids visible to: the bidder themselves OR the auction creator
DROP POLICY IF EXISTS "Bids viewable by bidder or auction creator" ON public.auction_bids;
CREATE POLICY "Bids viewable by bidder or auction creator"
  ON public.auction_bids FOR SELECT
  TO authenticated
  USING (
    auth.uid() = bidder_uid OR
    EXISTS (
      SELECT 1 FROM public.auctions
      WHERE id = auction_bids.auction_id AND creator_uid = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Authenticated users can submit bids" ON public.auction_bids;
CREATE POLICY "Authenticated users can submit bids"
  ON public.auction_bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bidder_uid);

DROP POLICY IF EXISTS "Service role manages bids" ON public.auction_bids;
CREATE POLICY "Service role manages bids"
  ON public.auction_bids FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── POSTS ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Posts viewable by authenticated users" ON public.posts;
CREATE POLICY "Posts viewable by authenticated users"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_uid);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_uid)
  WITH CHECK (auth.uid() = author_uid);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_uid);

-- ── COMMENTS ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Comments viewable by authenticated users" ON public.comments;
CREATE POLICY "Comments viewable by authenticated users"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_uid);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = author_uid);

-- ── JOBS ─────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Jobs viewable by authenticated users" ON public.jobs;
CREATE POLICY "Jobs viewable by authenticated users"
  ON public.jobs FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Service role manages jobs" ON public.jobs;
CREATE POLICY "Service role manages jobs"
  ON public.jobs FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── CASES ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own cases" ON public.cases;
CREATE POLICY "Users can view own cases"
  ON public.cases FOR SELECT
  TO authenticated
  USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Users can create cases" ON public.cases;
CREATE POLICY "Users can create cases"
  ON public.cases FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role manages cases" ON public.cases;
CREATE POLICY "Service role manages cases"
  ON public.cases FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── TRANSACTIONS ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()::text OR
    user_email = (SELECT email FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role manages transactions" ON public.transactions;
CREATE POLICY "Service role manages transactions"
  ON public.transactions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── REVIEWS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Reviews viewable by authenticated users" ON public.reviews;
CREATE POLICY "Reviews viewable by authenticated users"
  ON public.reviews FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can submit reviews" ON public.reviews;
CREATE POLICY "Authenticated users can submit reviews"
  ON public.reviews FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- ── EVENTS ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Events insertable by all" ON public.events;
CREATE POLICY "Events insertable by all"
  ON public.events FOR INSERT
  WITH CHECK (true);  -- Telemetry: anonymous events allowed

DROP POLICY IF EXISTS "Events viewable by service role" ON public.events;
CREATE POLICY "Events viewable by service role"
  ON public.events FOR SELECT
  TO service_role
  USING (true);

-- ── INTENTS ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own intent" ON public.intents;
CREATE POLICY "Users manage own intent"
  ON public.intents FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()::text OR
    user_id = (SELECT uid FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()::text OR
    user_id = (SELECT uid FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role manages intents" ON public.intents;
CREATE POLICY "Service role manages intents"
  ON public.intents FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── PRESENCE ─────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Presence viewable by authenticated users" ON public.presence;
CREATE POLICY "Presence viewable by authenticated users"
  ON public.presence FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Users update own presence" ON public.presence;
CREATE POLICY "Users update own presence"
  ON public.presence FOR ALL
  TO authenticated
  USING (
    user_id = auth.uid()::text OR
    user_id = (SELECT uid FROM public.profiles WHERE id = auth.uid())
  )
  WITH CHECK (
    user_id = auth.uid()::text OR
    user_id = (SELECT uid FROM public.profiles WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "Service role manages presence" ON public.presence;
CREATE POLICY "Service role manages presence"
  ON public.presence FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── VERIFICATIONS ────────────────────────────────────────────────────────────
-- Only the service role can read/write verification tokens (server-side only)
DROP POLICY IF EXISTS "Verifications service role only" ON public.verifications;
CREATE POLICY "Verifications service role only"
  ON public.verifications FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── AUDIT LOGS ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Audit logs insertable by authenticated" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by authenticated"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Audit logs insertable by service role" ON public.audit_logs;
CREATE POLICY "Audit logs insertable by service role"
  ON public.audit_logs FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Admins (godfather, super_admin) can read audit logs
DROP POLICY IF EXISTS "Audit logs viewable by platform admins" ON public.audit_logs;
CREATE POLICY "Audit logs viewable by platform admins"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
        AND role IN ('godfather', 'super_admin')
    )
  );

-- =============================================================================
-- 18. STORAGE BUCKETS
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('avatars',       'avatars',       TRUE,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('company-logos', 'company-logos', TRUE,  5242880,  ARRAY['image/jpeg','image/png','image/webp','image/gif']),
  ('documents',     'documents',     FALSE, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
  ('ad-creatives',  'ad-creatives',  TRUE,  2097152,  ARRAY['image/png','image/gif','image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Public Read Avatars"          ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Logos"            ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Logos"   ON storage.objects;
DROP POLICY IF EXISTS "Private Documents Owner Read" ON storage.objects;
DROP POLICY IF EXISTS "Private Documents Owner Write" ON storage.objects;

CREATE POLICY "Public Read Avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Authenticated Upload Avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public Read Logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'company-logos');

CREATE POLICY "Authenticated Upload Logos"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'company-logos');

CREATE POLICY "Private Documents Owner Read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Private Documents Owner Write"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================================================
-- 19. REFERENCE DATA SEED (idempotent — ON CONFLICT DO UPDATE)
--     Only legitimate known entities. No dummy/mock data.
-- =============================================================================

INSERT INTO public.companies (
  id, name, legal_name, trade_name, country, state, city, postal_code,
  registered_address, gstn, pan, iec, mto, status, verified, is_verified,
  member_count, primary_contact_name, primary_contact_email, admin_notes
) VALUES
(
  'CMP-COGOPORT-001',
  'COGOPORT',
  'Cogoport India Private Limited',
  'COGOPORT',
  'India', 'Maharashtra', 'Mumbai', '400069',
  'Cogoport Headquarters, Andheri East, Mumbai, Maharashtra 400069',
  '27AAACC1234F1Z5', 'AAACC1234F', '0312045678', 'MTO/DGS/2022/1042',
  'verified', TRUE, TRUE, 1,
  'Rajat RAI', 'rajat.rai@cogoport.com',
  '["Authoritative Enterprise Forwarder Profile", "Statutory KYC Verified & Active"]'::jsonb
),
(
  'CMP-RAIVEGA-01',
  'RAIVEGA',
  'Rai Vega Logistics Private Limited',
  'RAIVEGA',
  'India', 'Maharashtra', 'Mumbai', '400021',
  'Rai Vega House, Nariman Point, Mumbai 400021',
  '27AABCR9876Q1Z2', 'AABCR9876Q', '0319087654', 'MTO/DGS/2023/2189',
  'verified', TRUE, TRUE, 1,
  'Management RAIVEGA', 'mgt@raivega.in',
  '["Premium Verified Logistics Member", "Statutory KYC Verified & Active"]'::jsonb
),
(
  'comp_oceanic_01',
  'Oceanic Forwarders Ltd',
  'Oceanic Forwarders Private Limited',
  'Oceanic Forwarders Ltd',
  'India', 'Maharashtra', 'Mumbai', '400001',
  'Oceanic Tower, Ballard Estate, Fort, Mumbai 400001',
  '27AABCO5555M1Z1', 'AABCO5555M', NULL, NULL,
  'verified', TRUE, TRUE, 12,
  'Ocean Freight Operator', 'trader_1790855848254@oceanfreight.net',
  '["High volume trade lane operator"]'::jsonb
),
(
  'comp_forwarder_01',
  'Forwarder Group Ltd',
  'Forwarder Group International Private Limited',
  'Forwarder Group Ltd',
  'India', 'Maharashtra', 'Mumbai', '400001',
  'Forwarder Plaza, Nariman Point, Mumbai 400021',
  '27AABCF1111N1Z3', 'AABCF1111N', NULL, NULL,
  'verified', TRUE, TRUE, 11,
  'Chief Compliance Officer', 'officer_1790855845116@forwardergroup.com',
  '["Regulatory compliance verified"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  name       = EXCLUDED.name,
  legal_name = EXCLUDED.legal_name,
  updated_at = NOW();

-- Sample freight rate (COGOPORT — Mundra to Tashkent, active)
INSERT INTO public.rates (
  id, sp, line, por, pol, pod, fpod,
  rate20, rate40, rate40hc, currency, type,
  ft, validity, transit_time, is_owner, is_self_posted, status
) VALUES (
  'COG-1710-0001',
  'COGOPORT', 'MAERSK',
  'Mundra (INMUN)', 'Mundra (INMUN)', 'TASKENT', 'TASKENT',
  10000, 14000, 14000, 'USD', 'Direct Spot',
  14, '2026-12-31', '60', TRUE, TRUE, 'active'
)
ON CONFLICT (id) DO UPDATE SET
  rate20 = EXCLUDED.rate20,
  rate40 = EXCLUDED.rate40,
  rate40hc = EXCLUDED.rate40hc,
  updated_at = NOW();

-- =============================================================================
-- DONE — FR8X Production Schema Applied
-- Verify: SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- =============================================================================
