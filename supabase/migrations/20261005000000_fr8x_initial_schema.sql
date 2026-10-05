-- FR8X Multimodal Freight Platform
-- PostgreSQL Schema & Row Level Security (RLS) for Supabase
-- Target Project: fr8x-con (https://haarbaqeuuirwkhmefev.supabase.co)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. PROFILES TABLE (Authoritative Single Source of Truth for User Data)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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
  company_id TEXT,
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
  status TEXT DEFAULT 'active',
  account_status TEXT DEFAULT 'active',
  first_login_completed BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
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

-- Index critical lookup fields
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Automatic updated_at timestamp trigger
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Automatic profile provisioner on auth.users insert
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
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_auth_user();

-- ============================================================================
-- 2. COMPANIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  country TEXT DEFAULT 'India',
  state TEXT,
  city TEXT,
  postal_code TEXT,
  registered_address TEXT,
  operating_address TEXT,
  company_type TEXT,
  registration_number TEXT,
  gstn TEXT,
  pan TEXT,
  iec TEXT,
  mto TEXT,
  status TEXT DEFAULT 'verified',
  verified BOOLEAN DEFAULT TRUE,
  member_count INT DEFAULT 1,
  primary_contact_name TEXT,
  primary_contact_email TEXT,
  primary_contact_phone TEXT,
  admin_notes JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_companies_updated_at ON public.companies;
CREATE TRIGGER set_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 3. RATES TABLE (Freight Rate Cards & Tariffs)
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
  owner_uid UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  is_owner BOOLEAN DEFAULT TRUE,
  is_self_posted BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rates_pol_pod ON public.rates(pol, pod);
CREATE INDEX IF NOT EXISTS idx_rates_owner_uid ON public.rates(owner_uid);
CREATE INDEX IF NOT EXISTS idx_rates_validity ON public.rates(validity);

DROP TRIGGER IF EXISTS set_rates_updated_at ON public.rates;
CREATE TRIGGER set_rates_updated_at
  BEFORE UPDATE ON public.rates
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 4. AUCTIONS TABLE (Reverse Freight Bidding)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.auctions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  rfq_id TEXT,
  creator_uid UUID REFERENCES auth.users(id),
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

CREATE INDEX IF NOT EXISTS idx_auctions_creator_uid ON public.auctions(creator_uid);
CREATE INDEX IF NOT EXISTS idx_auctions_status ON public.auctions(status);

DROP TRIGGER IF EXISTS set_auctions_updated_at ON public.auctions;
CREATE TRIGGER set_auctions_updated_at
  BEFORE UPDATE ON public.auctions
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================================
-- 5. AUCTION BIDS TABLE (Bids on Reverse Auctions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.auction_bids (
  id TEXT PRIMARY KEY,
  auction_id TEXT NOT NULL REFERENCES public.auctions(id) ON DELETE CASCADE,
  bidder_uid UUID NOT NULL REFERENCES auth.users(id),
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON public.auction_bids(auction_id);
CREATE INDEX IF NOT EXISTS idx_bids_bidder_uid ON public.auction_bids(bidder_uid);

-- ============================================================================
-- 6. POSTS & COMMENTS (Feed & Professional Social Network)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  author_uid UUID NOT NULL REFERENCES auth.users(id),
  author_name TEXT,
  author_company TEXT,
  author_avatar TEXT,
  content TEXT NOT NULL,
  media_url TEXT,
  media_type TEXT,
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author ON public.posts(author_uid);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_uid UUID NOT NULL REFERENCES auth.users(id),
  author_name TEXT,
  author_company TEXT,
  author_avatar TEXT,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);

-- ============================================================================
-- 7. AUDIT LOGS (Immutable Regulatory & Security Audit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_uid UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  target_entity TEXT NOT NULL,
  target_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_target ON public.audit_logs(target_entity, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON public.audit_logs(actor_uid);
CREATE INDEX IF NOT EXISTS idx_audit_created ON public.audit_logs(created_at DESC);

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auction_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- ── PROFILES POLICIES ────────────────────────────────────────────────────────
-- Authenticated users can view member directory profiles
CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can only insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role has full unrestricted access
CREATE POLICY "Service role full access on profiles"
  ON public.profiles FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── COMPANIES POLICIES ───────────────────────────────────────────────────────
CREATE POLICY "Companies viewable by authenticated users"
  ON public.companies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Company admins or service role can insert/update companies"
  ON public.companies FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ── RATES POLICIES ──────────────────────────────────────────────────────────
CREATE POLICY "Rates are viewable by authenticated users"
  ON public.rates FOR SELECT
  TO authenticated
  USING (status = 'active' OR auth.uid() = owner_uid);

CREATE POLICY "Users can create rates"
  ON public.rates FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = owner_uid OR auth.uid() = created_by);

CREATE POLICY "Users can update own rates"
  ON public.rates FOR UPDATE
  TO authenticated
  USING (auth.uid() = owner_uid OR auth.uid() = created_by)
  WITH CHECK (auth.uid() = owner_uid OR auth.uid() = created_by);

CREATE POLICY "Users can delete own rates"
  ON public.rates FOR DELETE
  TO authenticated
  USING (auth.uid() = owner_uid OR auth.uid() = created_by);

-- ── AUCTIONS POLICIES ───────────────────────────────────────────────────────
CREATE POLICY "Auctions viewable by authenticated users"
  ON public.auctions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create auctions"
  ON public.auctions FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_uid);

CREATE POLICY "Users can update own auctions"
  ON public.auctions FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_uid)
  WITH CHECK (auth.uid() = creator_uid);

-- ── AUCTION BIDS POLICIES ───────────────────────────────────────────────────
CREATE POLICY "Bids viewable by auction creator or bidder"
  ON public.auction_bids FOR SELECT
  TO authenticated
  USING (
    auth.uid() = bidder_uid OR
    EXISTS (SELECT 1 FROM public.auctions WHERE id = auction_bids.auction_id AND creator_uid = auth.uid())
  );

CREATE POLICY "Users can submit bids"
  ON public.auction_bids FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = bidder_uid);

-- ── POSTS & COMMENTS POLICIES ───────────────────────────────────────────────
CREATE POLICY "Posts viewable by authenticated users"
  ON public.posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_uid);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_uid);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  TO authenticated
  USING (auth.uid() = author_uid);

CREATE POLICY "Comments viewable by authenticated users"
  ON public.comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_uid);

-- ── AUDIT LOGS POLICIES ─────────────────────────────────────────────────────
CREATE POLICY "Audit logs insertable by authenticated users"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Audit logs viewable by platform admins"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = 'godfather' OR role = 'super_admin')));

-- ============================================================================
-- 9. STORAGE BUCKETS SETUP (Run via Supabase Storage API or SQL)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('company-logos', 'company-logos', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']),
  ('documents', 'documents', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('ad-creatives', 'ad-creatives', true, 2097152, ARRAY['image/png', 'image/gif', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
CREATE POLICY "Public Read Avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Authenticated Upload Avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Public Read Logos" ON storage.objects FOR SELECT USING (bucket_id = 'company-logos');
CREATE POLICY "Authenticated Upload Logos" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'company-logos');
CREATE POLICY "Private Documents Owner Read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Private Documents Owner Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);
