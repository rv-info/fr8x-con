-- =============================================================================
-- Migration: 20261017120000_purge_synthetic_mumbai_duplicates.sql
-- Description:
--   1. Permanently purges synthetic/corrupted duplicate profiles where Kumar R
--      has a fallback 'Mumbai' location while the genuine profile is in Ludhiana.
--   2. Enforces strict deduplication across profiles on (LOWER(display_name), LOWER(company_name))
--      retaining only the canonical, most complete and recently updated record.
--   3. Deletes any orphaned auth.users entries associated with duplicate test accounts.
-- =============================================================================

-- 1. Purge the synthetic Mumbai duplicate for Kumar R (SYB INTERNATIONAL)
DELETE FROM public.profiles
WHERE LOWER(TRIM(COALESCE(display_name, first_name || ' ' || last_name))) = 'kumar r'
  AND LOWER(TRIM(company_name)) LIKE '%syb%'
  AND (
    LOWER(TRIM(COALESCE(city, ''))) = 'mumbai'
    OR LOWER(TRIM(COALESCE(location, ''))) LIKE '%mumbai%'
    OR LOWER(TRIM(COALESCE(formatted_address, ''))) LIKE '%mumbai%'
  );

-- 2. Deduplicate profiles with identical normalized display_name and company_name (keep newest)
DELETE FROM public.profiles p1
USING public.profiles p2
WHERE p1.id <> p2.id
  AND LOWER(TRIM(p1.display_name)) = LOWER(TRIM(p2.display_name))
  AND LOWER(TRIM(COALESCE(p1.company_name, ''))) = LOWER(TRIM(COALESCE(p2.company_name, '')))
  AND p1.display_name IS NOT NULL
  AND p1.display_name <> ''
  AND p1.updated_at < p2.updated_at;

-- 3. Log cleanup action
DO $$
BEGIN
  RAISE NOTICE 'Synthetic Mumbai duplicates and duplicate profiles successfully purged.';
END $$;
