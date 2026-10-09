-- =============================================================================
-- Migration: 20261009000000_fix_profile_provisioning_and_registration.sql
-- Description:
--   Enhances public.handle_new_auth_user() trigger function to extract and
--   persist ALL registration metadata (first_name, last_name, display_name,
--   mobile, phone, isd_code, whatsapp_same_as_mobile, designation, position,
--   company_name, company_id, department, city, state, district, country,
--   postal_code, address, formatted_address, location, timezone, role, plan,
--   gstn, pan, iec, mto) from Supabase Auth raw_user_meta_data directly into
--   public.profiles.
--
--   Also ensures columns exist, updates ON CONFLICT merge semantics, and
--   notifies PostgREST to reload its schema cache.
-- =============================================================================

-- Ensure all statutory, location and metadata columns exist in public.profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS isd_code TEXT DEFAULT '+91';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp_same_as_mobile BOOLEAN DEFAULT TRUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS position TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS company_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT DEFAULT 'Logistics & Supply Chain';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS district TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Asia/Kolkata';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gstn TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS pan TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cin TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS iec TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mto TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS kyc_status TEXT;

-- Replace trigger function with comprehensive extractor
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
    isd_code,
    whatsapp_same_as_mobile,
    designation,
    position,
    company_name,
    company_id,
    department,
    city,
    state,
    district,
    country,
    postal_code,
    formatted_address,
    address,
    location,
    timezone,
    role,
    plan,
    gstn,
    pan,
    iec,
    mto,
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
    COALESCE(NEW.raw_user_meta_data->>'isd_code', NEW.raw_user_meta_data->>'isdCode', '+91'),
    COALESCE((NEW.raw_user_meta_data->>'whatsappSameAsMobile')::boolean, TRUE),
    COALESCE(NEW.raw_user_meta_data->>'designation', 'Freight Logistics Specialist'),
    COALESCE(NEW.raw_user_meta_data->>'position', NEW.raw_user_meta_data->>'designation', 'Manager'),
    COALESCE(NEW.raw_user_meta_data->>'company', NEW.raw_user_meta_data->>'companyName', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_id', NEW.raw_user_meta_data->>'companyId', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Logistics & Supply Chain'),
    COALESCE(NEW.raw_user_meta_data->>'city', 'Mumbai'),
    COALESCE(NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'district', NEW.raw_user_meta_data->>'state', ''),
    COALESCE(NEW.raw_user_meta_data->>'country', 'India'),
    COALESCE(NEW.raw_user_meta_data->>'postal_code', NEW.raw_user_meta_data->>'postalCode', ''),
    COALESCE(NEW.raw_user_meta_data->>'formatted_address', NEW.raw_user_meta_data->>'formattedAddress', NEW.raw_user_meta_data->>'address', ''),
    COALESCE(NEW.raw_user_meta_data->>'address', NEW.raw_user_meta_data->>'formattedAddress', ''),
    COALESCE(NEW.raw_user_meta_data->>'location', ''),
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Kolkata'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'company_admin'),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'trial'),
    COALESCE(NEW.raw_user_meta_data->>'gstn', ''),
    COALESCE(NEW.raw_user_meta_data->>'pan', ''),
    COALESCE(NEW.raw_user_meta_data->>'iec', ''),
    COALESCE(NEW.raw_user_meta_data->>'mto', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email                   = EXCLUDED.email,
    display_name            = COALESCE(NULLIF(EXCLUDED.display_name, ''), profiles.display_name),
    first_name              = COALESCE(NULLIF(EXCLUDED.first_name, ''), profiles.first_name),
    last_name               = COALESCE(NULLIF(EXCLUDED.last_name, ''), profiles.last_name),
    phone                   = COALESCE(NULLIF(EXCLUDED.phone, ''), profiles.phone),
    mobile                  = COALESCE(NULLIF(EXCLUDED.mobile, ''), profiles.mobile),
    isd_code                = COALESCE(NULLIF(EXCLUDED.isd_code, ''), profiles.isd_code),
    designation             = COALESCE(NULLIF(EXCLUDED.designation, ''), profiles.designation),
    position                = COALESCE(NULLIF(EXCLUDED.position, ''), profiles.position),
    company_name            = COALESCE(NULLIF(EXCLUDED.company_name, ''), profiles.company_name),
    company_id              = COALESCE(NULLIF(EXCLUDED.company_id, ''), profiles.company_id),
    department              = COALESCE(NULLIF(EXCLUDED.department, ''), profiles.department),
    city                    = COALESCE(NULLIF(EXCLUDED.city, ''), profiles.city),
    state                   = COALESCE(NULLIF(EXCLUDED.state, ''), profiles.state),
    district                = COALESCE(NULLIF(EXCLUDED.district, ''), profiles.district),
    country                 = COALESCE(NULLIF(EXCLUDED.country, ''), profiles.country),
    postal_code             = COALESCE(NULLIF(EXCLUDED.postal_code, ''), profiles.postal_code),
    formatted_address       = COALESCE(NULLIF(EXCLUDED.formatted_address, ''), profiles.formatted_address),
    address                 = COALESCE(NULLIF(EXCLUDED.address, ''), profiles.address),
    timezone                = COALESCE(NULLIF(EXCLUDED.timezone, ''), profiles.timezone),
    gstn                    = COALESCE(NULLIF(EXCLUDED.gstn, ''), profiles.gstn),
    pan                     = COALESCE(NULLIF(EXCLUDED.pan, ''), profiles.pan),
    iec                     = COALESCE(NULLIF(EXCLUDED.iec, ''), profiles.iec),
    mto                     = COALESCE(NULLIF(EXCLUDED.mto, ''), profiles.mto),
    updated_at              = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- Instruct PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';
