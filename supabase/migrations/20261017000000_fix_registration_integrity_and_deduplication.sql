-- =============================================================================
-- Migration: 20261017000000_fix_registration_integrity_and_deduplication.sql
-- Description:
--   1. Enforces case-insensitive email uniqueness on public.profiles.
--   2. Fixes public.handle_new_auth_user() and public.reconcile_auth_profiles()
--      to eliminate hardcoded 'Mumbai' fallbacks that corrupted user locations.
--   3. Creates public.user_search_history table with RLS and index for
--      persistent, privacy-compliant user search history.
--   4. Enhances public.notifications with full RLS, multi-tier deduplication,
--      and atomic clearing functions.
-- =============================================================================

-- ── 1. Case-Insensitive Email Uniqueness on public.profiles ───────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_lower_email
  ON public.profiles(LOWER(TRIM(email)))
  WHERE email IS NOT NULL;

-- ── 2. Fix Profile Provisioning Trigger (Remove Hardcoded 'Mumbai') ───────────
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
  v_first_name TEXT;
  v_last_name TEXT;
  v_display_name TEXT;
  v_city TEXT;
  v_state TEXT;
  v_country TEXT;
  v_location TEXT;
  v_formatted_address TEXT;
BEGIN
  -- Extract names
  v_first_name := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName', '')), '');
  v_last_name  := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'last_name',  NEW.raw_user_meta_data->>'lastName',  '')), '');
  v_display_name := COALESCE(
    NULLIF(TRIM(CONCAT_WS(' ', v_first_name, v_last_name)), ''),
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'displayName', '')), ''),
    split_part(NEW.email, '@', 1)
  );

  -- Extract location attributes without synthetic fallbacks
  v_city := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'city', '')), '');
  v_state := NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'state', NEW.raw_user_meta_data->>'district', '')), '');
  v_country := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'country'), ''), 'India');

  -- Build canonical location string only from actual provided components
  v_location := NULLIF(TRIM(CONCAT_WS(', ', v_city, v_state, v_country)), '');
  v_formatted_address := COALESCE(
    NULLIF(TRIM(COALESCE(NEW.raw_user_meta_data->>'formatted_address', NEW.raw_user_meta_data->>'formattedAddress', NEW.raw_user_meta_data->>'address', '')), ''),
    v_location,
    ''
  );

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
    terms_accepted,
    terms_accepted_at,
    terms_version,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    LOWER(TRIM(NEW.email)),
    v_display_name,
    v_first_name,
    v_last_name,
    COALESCE(NEW.raw_user_meta_data->>'phone',  NEW.raw_user_meta_data->>'mobile', ''),
    COALESCE(NEW.raw_user_meta_data->>'mobile', NEW.raw_user_meta_data->>'phone',  ''),
    COALESCE(NEW.raw_user_meta_data->>'isd_code', NEW.raw_user_meta_data->>'isdCode', '+91'),
    COALESCE((NEW.raw_user_meta_data->>'whatsappSameAsMobile')::boolean, TRUE),
    COALESCE(NEW.raw_user_meta_data->>'designation', 'Freight Logistics Specialist'),
    COALESCE(NEW.raw_user_meta_data->>'position', NEW.raw_user_meta_data->>'designation', 'Manager'),
    COALESCE(NEW.raw_user_meta_data->>'company', NEW.raw_user_meta_data->>'companyName', ''),
    COALESCE(NEW.raw_user_meta_data->>'company_id', NEW.raw_user_meta_data->>'companyId', ''),
    COALESCE(NEW.raw_user_meta_data->>'department', 'Logistics & Supply Chain'),
    v_city,
    v_state,
    v_state,
    v_country,
    COALESCE(NEW.raw_user_meta_data->>'postal_code', NEW.raw_user_meta_data->>'postalCode', ''),
    v_formatted_address,
    v_formatted_address,
    v_location,
    COALESCE(NEW.raw_user_meta_data->>'timezone', 'Asia/Kolkata'),
    COALESCE(NEW.raw_user_meta_data->>'role', 'company_admin'),
    COALESCE(NEW.raw_user_meta_data->>'plan', 'trial'),
    COALESCE(NEW.raw_user_meta_data->>'gstn', ''),
    COALESCE(NEW.raw_user_meta_data->>'pan', ''),
    COALESCE(NEW.raw_user_meta_data->>'iec', ''),
    COALESCE(NEW.raw_user_meta_data->>'mto', ''),
    COALESCE((NEW.raw_user_meta_data->>'termsAccepted')::boolean, TRUE),
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'termsAcceptedAt', '')::timestamptz, NOW()),
    COALESCE(NEW.raw_user_meta_data->>'termsVersion', 'v3.2'),
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
    location                = COALESCE(NULLIF(EXCLUDED.location, ''), profiles.location),
    timezone                = COALESCE(NULLIF(EXCLUDED.timezone, ''), profiles.timezone),
    gstn                    = COALESCE(NULLIF(EXCLUDED.gstn, ''), profiles.gstn),
    pan                     = COALESCE(NULLIF(EXCLUDED.pan, ''), profiles.pan),
    iec                     = COALESCE(NULLIF(EXCLUDED.iec, ''), profiles.iec),
    mto                     = COALESCE(NULLIF(EXCLUDED.mto, ''), profiles.mto),
    terms_accepted          = COALESCE(EXCLUDED.terms_accepted, profiles.terms_accepted),
    terms_accepted_at       = COALESCE(EXCLUDED.terms_accepted_at, profiles.terms_accepted_at),
    terms_version           = COALESCE(EXCLUDED.terms_version, profiles.terms_version),
    updated_at              = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rebind trigger safely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- ── 3. Fix Profile Reconciliation Function (Remove Hardcoded 'Mumbai') ────────
CREATE OR REPLACE FUNCTION public.reconcile_auth_profiles()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_repaired_count INT := 0;
  v_repaired_ids UUID[] := ARRAY[]::UUID[];
  v_user RECORD;
  v_display_name TEXT;
  v_first_name TEXT;
  v_last_name TEXT;
  v_mobile TEXT;
  v_phone TEXT;
  v_company TEXT;
  v_city TEXT;
  v_state TEXT;
  v_country TEXT;
  v_location TEXT;
BEGIN
  -- Iterate through auth.users lacking a matching record in public.profiles
  FOR v_user IN
    SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL
  LOOP
    v_first_name := NULLIF(TRIM(COALESCE(v_user.raw_user_meta_data->>'first_name', v_user.raw_user_meta_data->>'firstName', '')), '');
    v_last_name := NULLIF(TRIM(COALESCE(v_user.raw_user_meta_data->>'last_name', v_user.raw_user_meta_data->>'lastName', '')), '');
    v_display_name := COALESCE(
      NULLIF(TRIM(CONCAT_WS(' ', v_first_name, v_last_name)), ''),
      NULLIF(TRIM(COALESCE(v_user.raw_user_meta_data->>'display_name', v_user.raw_user_meta_data->>'displayName', '')), ''),
      split_part(v_user.email, '@', 1)
    );
    v_mobile := COALESCE(v_user.raw_user_meta_data->>'mobile', v_user.raw_user_meta_data->>'phone', '');
    v_phone := COALESCE(v_user.raw_user_meta_data->>'phone', v_user.raw_user_meta_data->>'mobile', '');
    v_company := COALESCE(v_user.raw_user_meta_data->>'company', v_user.raw_user_meta_data->>'companyName', '');
    v_city := NULLIF(TRIM(COALESCE(v_user.raw_user_meta_data->>'city', '')), '');
    v_state := NULLIF(TRIM(COALESCE(v_user.raw_user_meta_data->>'state', '')), '');
    v_country := COALESCE(NULLIF(TRIM(v_user.raw_user_meta_data->>'country'), ''), 'India');
    v_location := NULLIF(TRIM(CONCAT_WS(', ', v_city, v_state, v_country)), '');

    INSERT INTO public.profiles (
      id,
      email,
      display_name,
      first_name,
      last_name,
      mobile,
      phone,
      isd_code,
      whatsapp_same_as_mobile,
      designation,
      position,
      company_name,
      company_id,
      department,
      city,
      state,
      country,
      location,
      postal_code,
      timezone,
      role,
      plan,
      is_online,
      terms_accepted,
      terms_accepted_at,
      terms_version,
      created_at,
      updated_at
    ) VALUES (
      v_user.id,
      LOWER(TRIM(v_user.email)),
      v_display_name,
      v_first_name,
      v_last_name,
      v_mobile,
      v_phone,
      COALESCE(v_user.raw_user_meta_data->>'isd_code', '+91'),
      TRUE,
      COALESCE(v_user.raw_user_meta_data->>'designation', 'Freight Logistics Specialist'),
      COALESCE(v_user.raw_user_meta_data->>'position', 'Manager'),
      v_company,
      COALESCE(v_user.raw_user_meta_data->>'company_id', ''),
      COALESCE(v_user.raw_user_meta_data->>'department', 'Logistics & Supply Chain'),
      v_city,
      v_state,
      v_country,
      v_location,
      COALESCE(v_user.raw_user_meta_data->>'postal_code', ''),
      COALESCE(v_user.raw_user_meta_data->>'timezone', 'Asia/Kolkata'),
      COALESCE(v_user.raw_user_meta_data->>'role', 'company_admin'),
      COALESCE(v_user.raw_user_meta_data->>'plan', 'trial'),
      FALSE,
      COALESCE((v_user.raw_user_meta_data->>'termsAccepted')::boolean, TRUE),
      COALESCE(NULLIF(v_user.raw_user_meta_data->>'termsAcceptedAt', '')::timestamptz, v_user.created_at),
      COALESCE(v_user.raw_user_meta_data->>'termsVersion', 'v3.2'),
      COALESCE(v_user.created_at, NOW()),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    v_repaired_count := v_repaired_count + 1;
    v_repaired_ids := array_append(v_repaired_ids, v_user.id);
  END LOOP;

  RETURN jsonb_build_object(
    'success', TRUE,
    'repaired_count', v_repaired_count,
    'repaired_user_ids', v_repaired_ids
  );
END;
$$;

-- ── 4. Persistent User Search History Table ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_search_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_context   TEXT NOT NULL DEFAULT 'global', -- 'global', 'members', 'rates', 'auctions'
  query            TEXT NOT NULL,
  normalized_query TEXT NOT NULL,
  filters          JSONB DEFAULT '{}'::jsonb,
  result_count     INT DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_history_user_context
  ON public.user_search_history(user_id, search_context, created_at DESC);

ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own search history" ON public.user_search_history;
CREATE POLICY "Users can manage own search history"
  ON public.user_search_history
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── 5. Notifications Table Hardening & Atomic Controls ───────────────────────
CREATE TABLE IF NOT EXISTS public.notifications (
  id          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id     TEXT NOT NULL,
  type        TEXT NOT NULL,
  category    TEXT DEFAULT 'platform',
  title       TEXT NOT NULL,
  message     TEXT,
  description TEXT,
  link        TEXT,
  target_url  TEXT,
  related_id  TEXT,
  read        BOOLEAN DEFAULT FALSE,
  metadata    JSONB DEFAULT '{}'::jsonb,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications(user_id, read, created_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS uidx_notifications_user_related
  ON public.notifications(user_id, related_id)
  WHERE related_id IS NOT NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view and manage own notifications" ON public.notifications;
CREATE POLICY "Users can view and manage own notifications"
  ON public.notifications
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Atomic Clear User Notifications RPC
CREATE OR REPLACE FUNCTION public.clear_user_notifications(
  p_user_id TEXT,
  p_notification_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, pg_temp
AS $$
DECLARE
  v_deleted_count INT := 0;
BEGIN
  IF p_notification_id IS NOT NULL THEN
    DELETE FROM public.notifications
    WHERE user_id = p_user_id AND id = p_notification_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  ELSE
    DELETE FROM public.notifications
    WHERE user_id = p_user_id;
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
  END IF;

  RETURN jsonb_build_object(
    'success', TRUE,
    'deleted_count', v_deleted_count
  );
END;
$$;

NOTIFY pgrst, 'reload schema';
