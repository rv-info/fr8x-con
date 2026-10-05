-- ============================================================================
-- FR8X LEGACY DBMS MIGRATION SEED
-- Generated: 2026-10-05T10:59:55.605Z
-- Single source of truth: Supabase PostgreSQL
-- ============================================================================

-- 1. COMPANIES
INSERT INTO public.companies (
  id, name, legal_name, country, state, city, postal_code, address, gstin, pan, cin, status, is_verified, created_at, updated_at
) VALUES (
  'CMP-COGOPORT-001',
  'COGOPORT',
  'Cogoport India Private Limited',
  'India',
  'Maharashtra',
  'Mumbai',
  '400069',
  'Cogoport Headquarters, Andheri East, Mumbai, Maharashtra 400069, India',
  '27AAACC1234F1Z5',
  'AAACC1234F',
  NULL,
  'verified',
  true,
  COALESCE('2026-09-01T00:00:00.000Z', NOW()),
  COALESCE('2026-10-03T09:53:28.778Z', NOW())
) ON CONFLICT (id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  updated_at = NOW();

INSERT INTO public.companies (
  id, name, legal_name, country, state, city, postal_code, address, gstin, pan, cin, status, is_verified, created_at, updated_at
) VALUES (
  'CMP-RAIVEGA-01',
  'RAIVEGA',
  'Rai Vega Logistics Private Limited',
  'India',
  'Maharashtra',
  'Mumbai',
  '400021',
  'Rai Vega House, Nariman Point, Mumbai 400021, India',
  '27AABCR9876Q1Z2',
  'AABCR9876Q',
  NULL,
  'verified',
  true,
  COALESCE('2026-09-01T00:00:00.000Z', NOW()),
  COALESCE('2026-10-03T09:53:28.778Z', NOW())
) ON CONFLICT (id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  updated_at = NOW();

INSERT INTO public.companies (
  id, name, legal_name, country, state, city, postal_code, address, gstin, pan, cin, status, is_verified, created_at, updated_at
) VALUES (
  'comp_oceanic_01',
  'Oceanic Forwarders Ltd',
  'Oceanic Forwarders Private Limited',
  'India',
  'Maharashtra',
  'Mumbai',
  '400001',
  'Oceanic Tower, Ballard Estate, Fort, Mumbai 400001',
  '27AABCO5555M1Z1',
  'AABCO5555M',
  NULL,
  'verified',
  true,
  COALESCE('2026-09-01T00:00:00.000Z', NOW()),
  COALESCE('2026-10-03T09:53:28.778Z', NOW())
) ON CONFLICT (id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  updated_at = NOW();

INSERT INTO public.companies (
  id, name, legal_name, country, state, city, postal_code, address, gstin, pan, cin, status, is_verified, created_at, updated_at
) VALUES (
  'comp_forwarder_01',
  'Forwarder Group Ltd',
  'Forwarder Group International Private Limited',
  'India',
  'Maharashtra',
  'Mumbai',
  '400001',
  'Forwarder Plaza, Nariman Point, Mumbai 400021',
  '27AABCF1111N1Z3',
  'AABCF1111N',
  NULL,
  'verified',
  true,
  COALESCE('2026-09-01T00:00:00.000Z', NOW()),
  COALESCE('2026-10-03T09:53:28.778Z', NOW())
) ON CONFLICT (id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  updated_at = NOW();

-- 2. USERS / PROFILES
INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_raivega_mgt',
  'mgt@raivega.in',
  'Management RAIVEGA',
  'Management',
  'RAIVEGA',
  '+91 9820012345',
  '+91 9820012345',
  'Managing Director & Procurement Head',
  'RAIVEGA',
  'CMP-RAIVEGA-01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'premium',
  true,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"public","statutoryVisibility":"public","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-10-01T08:00:00.000Z', NOW()),
  COALESCE('2026-10-03T10:09:40.279Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_commerce_1790855848254',
  'trader_1790855848254@oceanfreight.net',
  'Ocean Freight Operator',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Oceanic Forwarders Ltd',
  'comp_oceanic_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'user',
  'premium',
  false,
  true,
  true,
  0,
  '{}'::jsonb,
  COALESCE('2026-10-01T11:57:28.254Z', NOW()),
  COALESCE('2026-10-01T11:57:28.287Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790855845116',
  'officer_1790855845116@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-10-01T11:57:25.116Z', NOW()),
  COALESCE('2026-10-01T11:57:25.127Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_commerce_1790855473255',
  'trader_1790855473255@oceanfreight.net',
  'Ocean Freight Operator',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Oceanic Forwarders Ltd',
  'comp_oceanic_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'user',
  'premium',
  false,
  true,
  true,
  0,
  '{}'::jsonb,
  COALESCE('2026-10-01T11:51:13.255Z', NOW()),
  COALESCE('2026-10-01T11:51:13.285Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790855470741',
  'officer_1790855470741@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-10-01T11:51:10.741Z', NOW()),
  COALESCE('2026-10-01T11:51:10.752Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_commerce_1790815003014',
  'trader_1790815003014@oceanfreight.net',
  'Ocean Freight Operator',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Oceanic Forwarders Ltd',
  'comp_oceanic_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'user',
  'premium',
  false,
  true,
  true,
  0,
  '{}'::jsonb,
  COALESCE('2026-10-01T00:36:43.014Z', NOW()),
  COALESCE('2026-10-01T00:36:43.036Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790815000565',
  'officer_1790815000565@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-10-01T00:36:40.565Z', NOW()),
  COALESCE('2026-10-01T00:36:40.592Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_commerce_1790814703893',
  'trader_1790814703893@oceanfreight.net',
  'Ocean Freight Operator',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Oceanic Forwarders Ltd',
  'comp_oceanic_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'user',
  'premium',
  false,
  true,
  true,
  0,
  '{}'::jsonb,
  COALESCE('2026-10-01T00:31:43.894Z', NOW()),
  COALESCE('2026-10-01T00:31:43.922Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790814700823',
  'officer_1790814700823@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-10-01T00:31:40.823Z', NOW()),
  COALESCE('2026-10-01T00:31:40.833Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790814664967',
  'officer_1790814664967@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-10-01T00:31:04.967Z', NOW()),
  COALESCE('2026-10-01T00:31:04.977Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_commerce_1790814521790',
  'trader_1790814521790@oceanfreight.net',
  'Ocean Freight Operator',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Oceanic Forwarders Ltd',
  'comp_oceanic_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'user',
  'premium',
  false,
  true,
  true,
  0,
  '{}'::jsonb,
  COALESCE('2026-10-01T00:28:41.790Z', NOW()),
  COALESCE('2026-10-01T00:28:41.815Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790814519405',
  'officer_1790814519405@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-10-01T00:28:39.405Z', NOW()),
  COALESCE('2026-10-01T00:28:39.414Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_commerce_1790772811783',
  'trader_1790772811783@oceanfreight.net',
  'Ocean Freight Operator',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Oceanic Forwarders Ltd',
  'comp_oceanic_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'user',
  'premium',
  false,
  true,
  true,
  0,
  '{}'::jsonb,
  COALESCE('2026-09-30T12:53:31.783Z', NOW()),
  COALESCE('2026-09-30T12:53:31.815Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790772808293',
  'officer_1790772808293@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-09-30T12:53:28.293Z', NOW()),
  COALESCE('2026-09-30T12:53:28.307Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790772727774',
  'officer_1790772727774@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-09-30T12:52:07.774Z', NOW()),
  COALESCE('2026-09-30T12:52:07.784Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_commerce_1790670882472',
  'trader_1790670882472@oceanfreight.net',
  'Ocean Freight Operator',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Oceanic Forwarders Ltd',
  'comp_oceanic_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'user',
  'premium',
  false,
  true,
  true,
  0,
  '{}'::jsonb,
  COALESCE('2026-09-29T08:34:42.472Z', NOW()),
  COALESCE('2026-09-29T08:34:42.491Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790670880240',
  'officer_1790670880240@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-09-29T08:34:40.240Z', NOW()),
  COALESCE('2026-09-29T08:34:40.246Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_commerce_1790670813298',
  'trader_1790670813298@oceanfreight.net',
  'Ocean Freight Operator',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Oceanic Forwarders Ltd',
  'comp_oceanic_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'user',
  'premium',
  false,
  true,
  true,
  0,
  '{}'::jsonb,
  COALESCE('2026-09-29T08:33:33.298Z', NOW()),
  COALESCE('2026-09-29T08:33:33.318Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790670811214',
  'officer_1790670811214@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-09-29T08:33:31.214Z', NOW()),
  COALESCE('2026-09-29T08:33:31.221Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_commerce_1790670682336',
  'trader_1790670682336@oceanfreight.net',
  'Ocean Freight Operator',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Oceanic Forwarders Ltd',
  'comp_oceanic_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'user',
  'premium',
  false,
  true,
  true,
  0,
  '{}'::jsonb,
  COALESCE('2026-09-29T08:31:22.336Z', NOW()),
  COALESCE('2026-09-29T08:31:22.365Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790670679893',
  'officer_1790670679893@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-09-29T08:31:19.893Z', NOW()),
  COALESCE('2026-09-29T08:31:19.901Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_commerce_1790667082195',
  'trader_1790667082195@oceanfreight.net',
  'Ocean Freight Operator',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Oceanic Forwarders Ltd',
  'comp_oceanic_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'user',
  'premium',
  false,
  true,
  true,
  0,
  '{}'::jsonb,
  COALESCE('2026-09-29T07:31:22.195Z', NOW()),
  COALESCE('2026-09-29T07:31:22.213Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'usr_compliance_1790667079921',
  'officer_1790667079921@forwardergroup.com',
  'Chief Compliance Officer',
  '',
  '',
  '',
  '',
  'Freight Logistics Manager',
  'Forwarder Group Ltd',
  'comp_forwarder_01',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"private","statutoryVisibility":"contacts_only","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-09-29T07:31:19.921Z', NOW()),
  COALESCE('2026-09-29T07:31:19.926Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

INSERT INTO public.profiles (
  id, uid, email, display_name, first_name, last_name, phone, mobile, designation, company_name, company_id, city, state, country, location, role, plan, has_golden_tick, is_verified, email_verified, failed_login_attempts, privacy_settings, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'u-rajat',
  'rajat.rai@cogoport.com',
  'Rajat RAI',
  'Rajat',
  'RAI',
  '+91 9620012345',
  '+91 9620012345',
  'Senior Freight Procurement Manager',
  'COGOPORT',
  'CMP-COGOPORT-001',
  'Mumbai',
  'Maharashtra',
  'India',
  'Mumbai, Maharashtra, India',
  'company_admin',
  'trial',
  false,
  true,
  true,
  0,
  '{"emailVisibility":"public","phoneVisibility":"public","statutoryVisibility":"public","companyVisibility":"public","tradeLanesVisibility":"public","bioVisibility":"public","allowConnectionRequests":true}'::jsonb,
  COALESCE('2026-10-03T09:02:44.428Z', NOW()),
  COALESCE('2026-10-03T10:09:39.130Z', NOW())
) ON CONFLICT (email) DO UPDATE SET
  uid = COALESCE(EXCLUDED.uid, profiles.uid),
  display_name = EXCLUDED.display_name,
  mobile = COALESCE(EXCLUDED.mobile, profiles.mobile),
  designation = COALESCE(EXCLUDED.designation, profiles.designation),
  company_name = COALESCE(EXCLUDED.company_name, profiles.company_name),
  location = COALESCE(EXCLUDED.location, profiles.location),
  updated_at = NOW();

-- 3. RATES
INSERT INTO public.rates (
  id, sp, line, por, pol, pod, fpod, rate20, rate40, rate40hc, currency, type, ft, validity, transit_time, owner_uid, is_owner, is_self_posted, status, created_at, updated_at
) VALUES (
  'COG-1710-0001',
  'COGOPORT',
  'MAERSK',
  'Mundra (INMUN)',
  'Mundra (INMUN)',
  'TASKENT',
  'TASKENT',
  10000,
  14000,
  14000,
  'USD',
  'Direct Spot',
  14,
  COALESCE('2026-10-17', CURRENT_DATE + INTERVAL '14 days'),
  '60',
  'u-rajat',
  true,
  true,
  'active',
  COALESCE('2026-10-02T10:00:00.000Z', NOW()),
  COALESCE('2026-10-02T10:00:00.000Z', NOW())
) ON CONFLICT (id) DO UPDATE SET
  rate20 = EXCLUDED.rate20,
  rate40 = EXCLUDED.rate40,
  validity = EXCLUDED.validity,
  updated_at = NOW();

-- 4. AUCTIONS
INSERT INTO public.auctions (
  id, title, rfq_id, creator_uid, creator_name, creator_company, auction_type, start_date, start_time, duration_minutes, end_date_time, timezone, status, rank, time_left, is_published, competition_ceiling, bids_submitted_count, payment_status, posting_fee_inr, shipment, containers, origin_charges, destination_charges, created_at, updated_at
) VALUES (
  'RA-2026-9083',
  'Nhava Sheva to Rotterdam Spot Bidding',
  'RFQ-2026-9083',
  'u-rajat',
  'Rajat RAI',
  'COGOPORT',
  'Specific bidder',
  COALESCE('2026-10-05', CURRENT_DATE),
  '10:00',
  120,
  COALESCE('2026-10-05 12:00', NOW() + INTERVAL '2 hours'),
  'Asia/Kolkata',
  'Draft',
  'Pending',
  '120m',
  false,
  2800,
  0,
  'unpaid',
  300,
  '{"por":"Nhava Sheva (INNSA), India","pol":"Nhava Sheva (INNSA), India","pod":"Rotterdam (NLRTM), Netherlands","finalDestination":"Rotterdam (NLRTM), Netherlands","cargoReadyDate":"2026-10-05","shipmentType":"FCL","incoterm":"FOB - Free on Board","rateCurrency":"USD","commodity":"Engineering Goods","hsCode":"8471.30","weightKg":24000,"cbm":68}'::jsonb,
  '[{"id":"c-1","equipmentType":"40'' High Cube (40HC)","containerType":"Standard","quantity":1,"pickupLocation":"Nhava Sheva CFS","emptyReturnLocation":"Rotterdam ECT","isSpecial":false,"commodity":"Engineering Goods","hsCode":"8471.30","grossWeight":24000,"weightUnit":"KG"}]'::jsonb,
  '{"transportation":false,"clearance":false,"carrierLocal":true}'::jsonb,
  '{"transportation":false,"clearance":false,"carrierLocal":true}'::jsonb,
  COALESCE('2026-10-02T10:30:00.000Z', NOW()),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

INSERT INTO public.auctions (
  id, title, rfq_id, creator_uid, creator_name, creator_company, auction_type, start_date, start_time, duration_minutes, end_date_time, timezone, status, rank, time_left, is_published, competition_ceiling, bids_submitted_count, payment_status, posting_fee_inr, shipment, containers, origin_charges, destination_charges, created_at, updated_at
) VALUES (
  'RA-2026-7977',
  'Mundra to Hamburg Spot Bidding',
  'RFQ-2026-7977',
  'u-rajat',
  'Rajat RAI',
  'COGOPORT',
  'Specific bidder',
  COALESCE('2026-10-05', CURRENT_DATE),
  '11:00',
  120,
  COALESCE('2026-10-05 13:00', NOW() + INTERVAL '2 hours'),
  'Asia/Kolkata',
  'Draft',
  'Pending',
  '120m',
  false,
  2800,
  0,
  'unpaid',
  300,
  '{"por":"Mundra (INMUN), India","pol":"Mundra (INMUN), India","pod":"Hamburg (DEHAM), Germany","finalDestination":"Hamburg (DEHAM), Germany","cargoReadyDate":"2026-10-05","shipmentType":"FCL","incoterm":"CIF - Cost, Insurance and Freight","rateCurrency":"USD","commodity":"Engineering Goods","hsCode":"8471.30","weightKg":24000,"cbm":68}'::jsonb,
  '[{"id":"c-1","equipmentType":"40'' High Cube (40HC)","containerType":"Standard","quantity":1,"pickupLocation":"Mundra CFS","emptyReturnLocation":"Hamburg CTA","isSpecial":false,"commodity":"Engineering Goods","hsCode":"8471.30","grossWeight":24000,"weightUnit":"KG"}]'::jsonb,
  '{"transportation":false,"clearance":false,"carrierLocal":true}'::jsonb,
  '{"transportation":false,"clearance":false,"carrierLocal":true}'::jsonb,
  COALESCE('2026-10-02T10:35:00.000Z', NOW()),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  updated_at = NOW();

-- 5. TRANSACTIONS
INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790855848307',
  'order_muphc09x',
  'pay_muphc09x',
  'usr_commerce_1790855848254',
  'trader_1790855848254@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-10-01T11:57:28.307Z', NOW()),
  COALESCE('2026-10-01T11:57:28.308Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_muphc09x',
  'order_muphc09x',
  NULL,
  'usr_commerce_1790855848254',
  'trader_1790855848254@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-10-01T11:57:28.293Z', NOW()),
  COALESCE('2026-10-01T11:57:28.296Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790855473304',
  'order_muph3yx7',
  'pay_muph3yx7',
  'usr_commerce_1790855473255',
  'trader_1790855473255@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-10-01T11:51:13.304Z', NOW()),
  COALESCE('2026-10-01T11:51:13.305Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_muph3yx7',
  'order_muph3yx7',
  NULL,
  'usr_commerce_1790855473255',
  'trader_1790855473255@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-10-01T11:51:13.291Z', NOW()),
  COALESCE('2026-10-01T11:51:13.294Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790815003051',
  'order_muot0jvl',
  'pay_muot0jvl',
  'usr_commerce_1790815003014',
  'trader_1790815003014@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-10-01T00:36:43.051Z', NOW()),
  COALESCE('2026-10-01T00:36:43.053Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_muot0jvl',
  'order_muot0jvl',
  NULL,
  'usr_commerce_1790815003014',
  'trader_1790815003014@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-10-01T00:36:43.041Z', NOW()),
  COALESCE('2026-10-01T00:36:43.044Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790814703941',
  'order_muosu52x',
  'pay_muosu52x',
  'usr_commerce_1790814703893',
  'trader_1790814703893@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-10-01T00:31:43.941Z', NOW()),
  COALESCE('2026-10-01T00:31:43.943Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_muosu52x',
  'order_muosu52x',
  NULL,
  'usr_commerce_1790814703893',
  'trader_1790814703893@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-10-01T00:31:43.929Z', NOW()),
  COALESCE('2026-10-01T00:31:43.931Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790814521833',
  'order_muosq8kd',
  'pay_muosq8kd',
  'usr_commerce_1790814521790',
  'trader_1790814521790@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-10-01T00:28:41.833Z', NOW()),
  COALESCE('2026-10-01T00:28:41.835Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_muosq8kd',
  'order_muosq8kd',
  NULL,
  'usr_commerce_1790814521790',
  'trader_1790814521790@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-10-01T00:28:41.821Z', NOW()),
  COALESCE('2026-10-01T00:28:41.824Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790772811838',
  'order_muo3w8xb',
  'pay_muo3w8xb',
  'usr_commerce_1790772811783',
  'trader_1790772811783@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-30T12:53:31.838Z', NOW()),
  COALESCE('2026-09-30T12:53:31.839Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_muo3w8xb',
  'order_muo3w8xb',
  NULL,
  'usr_commerce_1790772811783',
  'trader_1790772811783@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-30T12:53:31.823Z', NOW()),
  COALESCE('2026-09-30T12:53:31.826Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790670882507',
  'order_mumf7jr6',
  'pay_mumf7jr6',
  'usr_commerce_1790670882472',
  'trader_1790670882472@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T08:34:42.507Z', NOW()),
  COALESCE('2026-09-29T08:34:42.509Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_mumf7jr6',
  'order_mumf7jr6',
  NULL,
  'usr_commerce_1790670882472',
  'trader_1790670882472@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T08:34:42.498Z', NOW()),
  COALESCE('2026-09-29T08:34:42.500Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790670813331',
  'order_mumf62dl',
  'pay_mumf62dl',
  'usr_commerce_1790670813298',
  'trader_1790670813298@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T08:33:33.331Z', NOW()),
  COALESCE('2026-09-29T08:33:33.332Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_mumf62dl',
  'order_mumf62dl',
  NULL,
  'usr_commerce_1790670813298',
  'trader_1790670813298@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T08:33:33.321Z', NOW()),
  COALESCE('2026-09-29T08:33:33.324Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790670682384',
  'order_mumf39c3',
  'pay_mumf39c3',
  'usr_commerce_1790670682336',
  'trader_1790670682336@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T08:31:22.384Z', NOW()),
  COALESCE('2026-09-29T08:31:22.385Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_mumf39c3',
  'order_mumf39c3',
  NULL,
  'usr_commerce_1790670682336',
  'trader_1790670682336@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T08:31:22.371Z', NOW()),
  COALESCE('2026-09-29T08:31:22.374Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790667082222',
  'order_mumcy3fs',
  'pay_mumcy3fs',
  'usr_commerce_1790667082195',
  'trader_1790667082195@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T07:31:22.222Z', NOW()),
  COALESCE('2026-09-29T07:31:22.224Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_mumcy3fs',
  'order_mumcy3fs',
  NULL,
  'usr_commerce_1790667082195',
  'trader_1790667082195@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T07:31:22.216Z', NOW()),
  COALESCE('2026-09-29T07:31:22.217Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790666021712',
  'order_mumcbd53',
  'pay_mumcbd53',
  'usr_commerce_1790666021686',
  'trader_1790666021686@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T07:13:41.712Z', NOW()),
  COALESCE('2026-09-29T07:13:41.713Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_mumcbd53',
  'order_mumcbd53',
  NULL,
  'usr_commerce_1790666021686',
  'trader_1790666021686@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T07:13:41.703Z', NOW()),
  COALESCE('2026-09-29T07:13:41.706Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790665919924',
  'order_mumc96lq',
  'pay_mumc96lq',
  'usr_commerce_1790665919899',
  'trader_1790665919899@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T07:11:59.924Z', NOW()),
  COALESCE('2026-09-29T07:11:59.925Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_mumc96lq',
  'order_mumc96lq',
  NULL,
  'usr_commerce_1790665919899',
  'trader_1790665919899@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T07:11:59.918Z', NOW()),
  COALESCE('2026-09-29T07:11:59.920Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'ref_1790663819933',
  'order_mumb068n',
  'pay_mumb068n',
  'usr_commerce_1790663819906',
  'trader_1790663819906@oceanfreight.net',
  -1500,
  'INR',
  'premium',
  'refund',
  'Partial Refund: Overbilling Adjustment',
  'refunded',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T06:36:59.933Z', NOW()),
  COALESCE('2026-09-29T06:36:59.934Z', NOW())
) ON CONFLICT (id) DO NOTHING;

INSERT INTO public.transactions (
  id, order_id, payment_id, user_id, user_email, amount, currency, plan_id, item_type, item_title, status, gateway, raw_payload, created_at, updated_at
) VALUES (
  'tx_order_mumb068n',
  'order_mumb068n',
  NULL,
  'usr_commerce_1790663819906',
  'trader_1790663819906@oceanfreight.net',
  3000,
  'INR',
  'premium',
  'subscription',
  'Premium Plan Subscription',
  'created',
  'Razorpay',
  '{}'::jsonb,
  COALESCE('2026-09-29T06:36:59.927Z', NOW()),
  COALESCE('2026-09-29T06:36:59.928Z', NOW())
) ON CONFLICT (id) DO NOTHING;

