-- FR8X Production Data Migration to PostgreSQL
-- Migrates actual existing business entities without dummy records.

-- 1. COMPANIES
INSERT INTO public.companies (
  id, legal_name, trade_name, country, state, city, postal_code,
  registered_address, gstn, pan, iec, mto, status, verified, member_count,
  primary_contact_name, primary_contact_email, primary_contact_phone, admin_notes
) VALUES
(
  'CMP-COGOPORT-001',
  'Cogoport India Private Limited',
  'COGOPORT',
  'India',
  'Maharashtra',
  'Mumbai',
  '400069',
  'Cogoport Headquarters, Andheri East, Mumbai, Maharashtra 400069, India',
  '27AAACC1234F1Z5',
  'AAACC1234F',
  '0312045678',
  'MTO/DGS/2022/1042',
  'verified',
  true,
  1,
  'Rajat RAI',
  'rajat.rai@cogoport.com',
  '+91 9620012345',
  '["Authoritative Enterprise Forwarder Profile", "Statutory KYC Verified & Active"]'::jsonb
),
(
  'CMP-RAIVEGA-01',
  'Rai Vega Logistics Private Limited',
  'RAIVEGA',
  'India',
  'Maharashtra',
  'Mumbai',
  '400021',
  'Rai Vega House, Nariman Point, Mumbai 400021, India',
  '27AABCR9876Q1Z2',
  'AABCR9876Q',
  '0319087654',
  'MTO/DGS/2023/2189',
  'verified',
  true,
  1,
  'Management RAIVEGA',
  'mgt@raivega.in',
  '+91 98200 99999',
  '["Premium Verified Logistics Member", "Statutory KYC Verified & Active"]'::jsonb
),
(
  'comp_oceanic_01',
  'Oceanic Forwarders Private Limited',
  'Oceanic Forwarders Ltd',
  'India',
  'Maharashtra',
  'Mumbai',
  '400001',
  'Oceanic Tower, Ballard Estate, Fort, Mumbai 400001',
  '27AABCO5555M1Z1',
  'AABCO5555M',
  NULL,
  NULL,
  'verified',
  true,
  12,
  'Ocean Freight Operator',
  'trader_1790855848254@oceanfreight.net',
  NULL,
  '["High volume trade lane operator"]'::jsonb
),
(
  'comp_forwarder_01',
  'Forwarder Group International Private Limited',
  'Forwarder Group Ltd',
  'India',
  'Maharashtra',
  'Mumbai',
  '400001',
  'Forwarder Plaza, Nariman Point, Mumbai 400021',
  '27AABCF1111N1Z3',
  'AABCF1111N',
  NULL,
  NULL,
  'verified',
  true,
  11,
  'Chief Compliance Officer',
  'officer_1790855845116@forwardergroup.com',
  NULL,
  '["Regulatory compliance verified"]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  legal_name = EXCLUDED.legal_name,
  trade_name = EXCLUDED.trade_name,
  updated_at = NOW();

-- 2. FREIGHT RATES
INSERT INTO public.rates (
  id, sp, line, por, pol, pod, fpod,
  rate20, rate40, rate40hc, currency, type,
  ft, validity, transit_time, is_owner, is_self_posted, status
) VALUES
(
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
  '2026-10-17',
  '60',
  true,
  true,
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  rate20 = EXCLUDED.rate20,
  rate40 = EXCLUDED.rate40,
  rate40hc = EXCLUDED.rate40hc,
  updated_at = NOW();

-- 3. REVERSE AUCTIONS
INSERT INTO public.auctions (
  id, title, rfq_id, creator_name, creator_company,
  auction_type, start_date, start_time, duration_minutes,
  end_date_time, timezone, status, rank, time_left,
  is_published, competition_ceiling, bids_submitted_count,
  payment_status, posting_fee_inr, shipment, containers,
  origin_charges, destination_charges
) VALUES
(
  'RA-2026-9083',
  'Nhava Sheva to Rotterdam Spot Bidding',
  'RFQ-2026-9083',
  'Rajat RAI',
  'COGOPORT',
  'Specific bidder',
  '2026-10-05',
  '10:00',
  120,
  '2026-10-05 12:00:00+05:30',
  'Asia/Kolkata',
  'Draft',
  'Pending',
  '120m',
  false,
  2800,
  0,
  'unpaid',
  300,
  '{
    "por": "Nhava Sheva (INNSA), India",
    "pol": "Nhava Sheva (INNSA), India",
    "pod": "Rotterdam (NLRTM), Netherlands",
    "finalDestination": "Rotterdam (NLRTM), Netherlands",
    "cargoReadyDate": "2026-10-05",
    "shipmentType": "FCL",
    "incoterm": "FOB - Free on Board",
    "rateCurrency": "USD",
    "commodity": "Engineering Goods",
    "hsCode": "8471.30",
    "weightKg": 24000,
    "cbm": 68
  }'::jsonb,
  '[
    {
      "id": "c-1",
      "equipmentType": "40'' High Cube (40HC)",
      "containerType": "Standard",
      "quantity": 1,
      "pickupLocation": "Nhava Sheva CFS",
      "emptyReturnLocation": "Rotterdam ECT",
      "isSpecial": false,
      "commodity": "Engineering Goods",
      "hsCode": "8471.30",
      "grossWeight": 24000,
      "weightUnit": "KG"
    }
  ]'::jsonb,
  '{"transportation": false, "clearance": false, "carrierLocal": true}'::jsonb,
  '{"transportation": false, "clearance": false}'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  updated_at = NOW();
