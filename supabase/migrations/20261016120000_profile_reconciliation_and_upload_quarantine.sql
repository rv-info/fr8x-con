-- =============================================================================
-- Migration: 20261016120000_profile_reconciliation_and_upload_quarantine.sql
-- Description:
--   1. Idempotent Profile Reconciliation RPC (public.reconcile_auth_profiles)
--      Safely heals legacy Auth users without profile rows, preventing user discovery failure.
--   2. Secure File Upload Pipeline & Quarantine Schema (public.uploaded_files)
--      State machine: PENDING_SCAN -> SCANNING -> CLEAN -> AVAILABLE
--      Ensures files cannot bypass scanner and isolates infected/quarantined uploads.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Idempotent Profile Reconciliation RPC
-- -----------------------------------------------------------------------------
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
BEGIN
  -- Iterate through auth.users lacking a matching record in public.profiles
  FOR v_user IN
    SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id = u.id
    WHERE p.id IS NULL
  LOOP
    -- Resolve safe fallback values from metadata or email
    v_display_name := COALESCE(
      v_user.raw_user_meta_data->>'display_name',
      v_user.raw_user_meta_data->>'displayName',
      split_part(v_user.email, '@', 1)
    );
    v_first_name := COALESCE(
      v_user.raw_user_meta_data->>'first_name',
      v_user.raw_user_meta_data->>'firstName',
      ''
    );
    v_last_name := COALESCE(
      v_user.raw_user_meta_data->>'last_name',
      v_user.raw_user_meta_data->>'lastName',
      ''
    );
    v_mobile := COALESCE(
      v_user.raw_user_meta_data->>'mobile',
      v_user.raw_user_meta_data->>'phone',
      ''
    );
    v_phone := COALESCE(
      v_user.raw_user_meta_data->>'phone',
      v_user.raw_user_meta_data->>'mobile',
      ''
    );
    v_company := COALESCE(
      v_user.raw_user_meta_data->>'company',
      v_user.raw_user_meta_data->>'companyName',
      ''
    );
    v_city := COALESCE(
      v_user.raw_user_meta_data->>'city',
      'Mumbai'
    );

    -- Insert reconciled profile idempotently without overwriting user data
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
      postal_code,
      timezone,
      role,
      plan,
      is_online,
      created_at,
      updated_at
    ) VALUES (
      v_user.id,
      v_user.email,
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
      COALESCE(v_user.raw_user_meta_data->>'state', ''),
      COALESCE(v_user.raw_user_meta_data->>'country', 'India'),
      COALESCE(v_user.raw_user_meta_data->>'postal_code', ''),
      COALESCE(v_user.raw_user_meta_data->>'timezone', 'Asia/Kolkata'),
      COALESCE(v_user.raw_user_meta_data->>'role', 'company_admin'),
      COALESCE(v_user.raw_user_meta_data->>'plan', 'trial'),
      FALSE,
      COALESCE(v_user.created_at, NOW()),
      NOW()
    )
    ON CONFLICT (id) DO NOTHING;

    v_repaired_count := v_repaired_count + 1;
    v_repaired_ids := array_append(v_repaired_ids, v_user.id);
  END LOOP;

  RETURN jsonb_build_object(
    'status', 'SUCCESS',
    'reconciled_count', v_repaired_count,
    'repaired_user_ids', v_repaired_ids,
    'timestamp', NOW()
  );
END;
$$;

COMMENT ON FUNCTION public.reconcile_auth_profiles() IS
  'Idempotently provisions public.profiles records for any legacy or out-of-sync auth.users to ensure bidirectional discovery.';

-- -----------------------------------------------------------------------------
-- 2. Secure Upload & Quarantine Schema (public.uploaded_files)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.uploaded_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploader_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'quarantine',
  storage_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  claimed_mime_type TEXT NOT NULL,
  detected_mime_type TEXT,
  checksum_sha256 TEXT NOT NULL,
  purpose TEXT NOT NULL DEFAULT 'general' CHECK (purpose IN ('avatar', 'freight_document', 'shipment_attachment', 'kyc', 'general')),
  scan_status TEXT NOT NULL DEFAULT 'PENDING_SCAN' CHECK (scan_status IN ('PENDING_SCAN', 'SCANNING', 'CLEAN', 'QUARANTINED', 'REJECTED', 'SCAN_FAILED')),
  scan_details JSONB DEFAULT '{}'::jsonb,
  scan_error TEXT,
  is_available BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scanned_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploaded_files_uploader ON public.uploaded_files(uploader_id);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_status ON public.uploaded_files(scan_status, is_available);
CREATE INDEX IF NOT EXISTS idx_uploaded_files_checksum ON public.uploaded_files(checksum_sha256);

-- Enable Row Level Security
ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY;

-- Select Policy: Uploader can view own metadata; others can only view if AVAILABLE and CLEAN
CREATE POLICY uploaded_files_select ON public.uploaded_files
  FOR SELECT
  USING (
    auth.uid() = uploader_id
    OR (is_available = TRUE AND scan_status = 'CLEAN')
  );

-- Insert Policy: Authenticated users can insert their own uploads in PENDING_SCAN state
CREATE POLICY uploaded_files_insert ON public.uploaded_files
  FOR INSERT
  WITH CHECK (
    auth.uid() = uploader_id
    AND scan_status = 'PENDING_SCAN'
    AND is_available = FALSE
  );

-- Update Policy: Only service role or authorized admin can update scan status and availability
CREATE POLICY uploaded_files_update ON public.uploaded_files
  FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'service_role'
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Delete Policy: Uploader or super_admin can delete
CREATE POLICY uploaded_files_delete ON public.uploaded_files
  FOR DELETE
  USING (
    auth.uid() = uploader_id
    OR (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload schema';
