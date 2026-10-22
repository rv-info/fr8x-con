-- =============================================================================
-- FR8X ENTERPRISE CONTACTS & LOGISTICS CRM ARCHITECTURE
-- Migration: 20261022160000_enterprise_contacts_crm.sql
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Contacts Table for Enterprise Freight CRM
CREATE TABLE IF NOT EXISTS public.contacts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id            UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  contact_profile_id  UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name                TEXT NOT NULL,
  email               TEXT,
  phone               TEXT,
  company             TEXT,
  designation         TEXT,
  category            TEXT NOT NULL DEFAULT 'Freight Forwarder',
  status              TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('live', 'online', 'away', 'busy', 'offline')),
  stage               TEXT NOT NULL DEFAULT 'Active Partner' CHECK (stage IN ('Prospect / Lead', 'Rate Quoted', 'Active Partner', 'VIP / Key Account', 'Carrier Partner', 'On Hold')),
  notes               TEXT,
  tags                TEXT[] DEFAULT '{}',
  is_favorite         BOOLEAN NOT NULL DEFAULT false,
  last_contacted_at   TIMESTAMPTZ,
  metadata            JSONB DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Indexes for High-Performance CRM Queries
CREATE INDEX IF NOT EXISTS idx_contacts_owner_id ON public.contacts(owner_id);
CREATE INDEX IF NOT EXISTS idx_contacts_contact_profile ON public.contacts(contact_profile_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_category ON public.contacts(category);
CREATE INDEX IF NOT EXISTS idx_contacts_stage ON public.contacts(stage);
CREATE INDEX IF NOT EXISTS idx_contacts_is_favorite ON public.contacts(is_favorite);

-- 3. Row Level Security (RLS)
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own contacts" ON public.contacts;
CREATE POLICY "Users can view own contacts"
  ON public.contacts FOR SELECT
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can insert own contacts" ON public.contacts;
CREATE POLICY "Users can insert own contacts"
  ON public.contacts FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can update own contacts" ON public.contacts;
CREATE POLICY "Users can update own contacts"
  ON public.contacts FOR UPDATE
  USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "Users can delete own contacts" ON public.contacts;
CREATE POLICY "Users can delete own contacts"
  ON public.contacts FOR DELETE
  USING (auth.uid() = owner_id);

-- 4. Auto-update updated_at timestamp trigger
DROP TRIGGER IF EXISTS set_contacts_updated_at ON public.contacts;
CREATE TRIGGER set_contacts_updated_at
  BEFORE UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
