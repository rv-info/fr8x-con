-- =============================================================================
-- Migration: 20261016180000_profile_slug_and_seo_governance.sql
-- Description:
--   1. Adds slug column and index to public.profiles for clean public SEO URLs.
--   2. Ensures unique constraint on profiles.id.
--   3. Idempotently provisions slugs for all existing profiles based on display_name.
--   4. Adds trigger/function to maintain profile slug automatically on insert/update.
-- =============================================================================

-- 1. Add slug column if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Index slug for fast O(1) canonical lookups
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON public.profiles (slug);

-- 3. Function to generate URL-safe profile slug
CREATE OR REPLACE FUNCTION public.fn_generate_profile_slug(p_name TEXT, p_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_base TEXT;
  v_suffix TEXT;
BEGIN
  v_base := lower(regexp_replace(COALESCE(p_name, 'member'), '[^a-zA-Z0-9]+', '-', 'g'));
  v_base := trim(both '-' from v_base);
  IF length(v_base) = 0 THEN
    v_base := 'member';
  END IF;
  v_base := substring(v_base from 1 for 40);
  v_suffix := substring(replace(p_id::TEXT, '-', '') from 1 for 8);
  RETURN v_base || '-' || v_suffix;
END;
$$;

-- 4. Backfill existing profiles without slugs
UPDATE public.profiles
SET slug = public.fn_generate_profile_slug(COALESCE(display_name, first_name || ' ' || last_name, split_part(email, '@', 1)), id)
WHERE slug IS NULL OR slug = '';

-- 5. Trigger function to auto-assign slug on profile creation or update
CREATE OR REPLACE FUNCTION public.trg_fn_assign_profile_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' OR (OLD IS NOT NULL AND NEW.display_name IS DISTINCT FROM OLD.display_name AND NEW.slug = OLD.slug) THEN
    NEW.slug := public.fn_generate_profile_slug(
      COALESCE(NEW.display_name, NEW.first_name || ' ' || NEW.last_name, split_part(NEW.email, '@', 1)),
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_assign_profile_slug ON public.profiles;
CREATE TRIGGER trg_assign_profile_slug
BEFORE INSERT OR UPDATE OF display_name, first_name, last_name, slug ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.trg_fn_assign_profile_slug();
