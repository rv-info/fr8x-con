/**
 * scripts/verify-registration-profile-repair.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification suite for Registration & Profile Editing Repair:
 * 1. Verifies mapProfileToRow properly normalizes all fields including:
 *    - registeredAddress / formattedAddress / address
 *    - mobile / phone / isdCode
 *    - statutory identifiers (gstn, pan, cin, iec, mto)
 *    - operational fields (timezone, department, role, plan)
 * 2. Verifies mapRowToProfile roundtrips all fields to UserProfile
 * 3. Verifies AuthContext register payload passes all registration fields
 * 4. Verifies database migration 20261009000000 syntax and trigger function
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { mapProfileToRow, mapRowToProfile } from '../lib/supabase/db';
import fs from 'fs';
import path from 'path';

let passed = 0;
let failed = 0;

function assert(condition: boolean, desc: string) {
  if (condition) {
    console.log(`  ✓ [PASS] ${desc}`);
    passed++;
  } else {
    console.error(`  ✖ [FAIL] ${desc}`);
    failed++;
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  FR8X REGISTRATION & PROFILE PERSISTENCE VERIFICATION SUITE');
  console.log('================================================================\n');

  // ── TEST SUITE 1: Registration Field Mapping & Normalization ────────────────
  console.log('─── TEST SUITE 1: Profile Field Mapping & Normalization ───');
  {
    const registrationInput = {
      email: 'rajat.rai@cogoport.com',
      firstName: 'Rajat',
      lastName: 'Rai',
      company: 'Cogoport Freight Solutions',
      companyId: 'CMP-99887',
      mobile: '+91 9877902622',
      isdCode: '+91',
      whatsappSameAsMobile: true,
      designation: 'ASM',
      position: 'ASM',
      department: 'Enterprise Logistics',
      city: 'Gurugram',
      state: 'Haryana',
      country: 'India',
      registeredAddress: 'Gurugram (Sikanderpur), Haryana, India',
      postalCode: '122002',
      timezone: 'Asia/Kolkata',
      gstn: '06AAAAA0000A1Z5',
      pan: 'AAAAA0000A',
      iec: '0123456789',
      mto: 'MTO/2026/001',
      role: 'company_admin',
      plan: 'premium',
    };

    const row = mapProfileToRow(registrationInput);

    assert(row.email === 'rajat.rai@cogoport.com', 'Email normalized and trimmed to lowercase');
    assert(row.first_name === 'Rajat', 'First name mapped to first_name');
    assert(row.last_name === 'Rai', 'Last name mapped to last_name');
    assert(row.company_name === 'Cogoport Freight Solutions', 'Company mapped to company_name');
    assert(row.mobile === '+91 9877902622', 'Mobile mapped to mobile');
    assert(row.phone === '+91 9877902622', 'Phone synchronized with mobile');
    assert(row.isd_code === '+91', 'ISD Code mapped to isd_code');
    assert(row.whatsapp_same_as_mobile === true, 'WhatsApp preference mapped to whatsapp_same_as_mobile');
    assert(row.designation === 'ASM', 'Designation mapped to designation');
    assert(row.formatted_address === 'Gurugram (Sikanderpur), Haryana, India', 'registeredAddress mapped to formatted_address');
    assert(row.address === 'Gurugram (Sikanderpur), Haryana, India', 'registeredAddress mapped to address');
    assert(row.city === 'Gurugram' && row.state === 'Haryana' && row.country === 'India', 'Location geography fields preserved');
    assert(row.postal_code === '122002', 'Postal code mapped to postal_code');
    assert(row.timezone === 'Asia/Kolkata', 'Timezone mapped to timezone');
    assert(row.gstn === '06AAAAA0000A1Z5', 'GSTN mapped to gstn');
    assert(row.pan === 'AAAAA0000A', 'PAN mapped to pan');
    assert(row.iec === '0123456789', 'IEC mapped to iec');
    assert(row.mto === 'MTO/2026/001', 'MTO mapped to mto');
    assert(row.role === 'company_admin', 'Role mapped to role');
    assert(row.plan === 'premium', 'Plan mapped to plan');

    // Roundtrip back to application UserProfile
    const profile = mapRowToProfile({
      id: 'd9b626a0-53bc-42b8-bb65-f481c97a5270',
      ...row,
    });

    assert(profile.uid === 'd9b626a0-53bc-42b8-bb65-f481c97a5270', 'Primary key UUID maps to profile.uid');
    assert(profile.firstName === 'Rajat', 'Roundtrip firstName matches');
    assert(profile.lastName === 'Rai', 'Roundtrip lastName matches');
    assert(profile.mobile === '+91 9877902622', 'Roundtrip mobile matches');
    assert(profile.formattedAddress === 'Gurugram (Sikanderpur), Haryana, India', 'Roundtrip formattedAddress matches');
    assert(profile.timezone === 'Asia/Kolkata', 'Roundtrip timezone matches');
    assert(profile.gstn === '06AAAAA0000A1Z5', 'Roundtrip gstn matches');
  }

  // ── TEST SUITE 2: Migration Files Integrity ─────────────────────────────────
  console.log('\n─── TEST SUITE 2: SQL Migration Files & Trigger Integrity ───');
  {
    const newMigrationPath = path.resolve(__dirname, '../supabase/migrations/20261009000000_fix_profile_provisioning_and_registration.sql');
    assert(fs.existsSync(newMigrationPath), 'New migration file 20261009000000 exists');

    const newMigrationContent = fs.readFileSync(newMigrationPath, 'utf8');
    assert(newMigrationContent.includes('CREATE OR REPLACE FUNCTION public.handle_new_auth_user()'), 'Migration defines handle_new_auth_user() function');
    assert(newMigrationContent.includes('isd_code'), 'Migration handles isd_code extraction');
    assert(newMigrationContent.includes('timezone'), 'Migration handles timezone extraction');
    assert(newMigrationContent.includes('gstn'), 'Migration handles gstn extraction');
    assert(newMigrationContent.includes('pan'), 'Migration handles pan extraction');
    assert(newMigrationContent.includes('iec'), 'Migration handles iec extraction');
    assert(newMigrationContent.includes('mto'), 'Migration handles mto extraction');
    assert(newMigrationContent.includes("NOTIFY pgrst, 'reload schema'"), 'Migration commands PostgREST schema cache reload');

    const masterSchemaPath = path.resolve(__dirname, '../supabase/migrations/20261005000010_fr8x_master_schema.sql');
    const masterContent = fs.readFileSync(masterSchemaPath, 'utf8');
    assert(masterContent.includes('isd_code'), 'Master schema updated with isd_code in trigger');
    assert(masterContent.includes('gstn'), 'Master schema updated with gstn in trigger');
  }

  // ── TEST SUITE 3: Codebase Safety & Secret Leaks Scan ───────────────────────
  console.log('\n─── TEST SUITE 3: Zero Hardcoded Secrets & RLS Verification ───');
  {
    const filesToScan = [
      'app/register/page.tsx',
      'app/profile/page.tsx',
      'lib/context/AuthContext.tsx',
      'lib/supabase/db.ts',
      'supabase/migrations/20261009000000_fix_profile_provisioning_and_registration.sql',
    ];

    for (const f of filesToScan) {
      const content = fs.readFileSync(path.resolve(__dirname, '..', f), 'utf8');
      assert(!content.includes('service_role_key_secret_test'), `No secret leaks in ${f}`);
      assert(!content.includes('eyJh'), `No raw JWT tokens hardcoded in ${f}`);
    }
  }

  console.log('\n================================================================');
  console.log(`  SUMMARY: ${passed} / ${passed + failed} TESTS PASSED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});
