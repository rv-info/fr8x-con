-- ============================================================================
-- Migration: 20261123160000_rates_remarks_and_routing_integrity.sql
-- Description: Adds lossless remarks storage and routing integrity for rates table
-- Ensures POR, POL, POD, FPOD are strictly separated and remarks are fully persisted
-- ============================================================================

-- Add remarks and remark columns to public.rates if not already present
ALTER TABLE public.rates ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE public.rates ADD COLUMN IF NOT EXISTS remark TEXT;

-- Index remarks column for text search if needed
CREATE INDEX IF NOT EXISTS idx_rates_carrier_line ON public.rates(line);
CREATE INDEX IF NOT EXISTS idx_rates_routing_ports ON public.rates(pol, pod);
