/**
 * scripts/purge-test-accounts.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Safe Maintenance Script: Identify & Deactivate Test/Dummy Profiles
 *
 * Compliance with accidental-data-loss-prevention:
 * - Defaults to DRY-RUN mode (read-only inspection).
 * - Requires explicit --apply flag to modify database records.
 * - Safely marks accounts as status='deactivated' or deletes test profiles.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient, createAdminClient } from '../lib/supabase/server';
import { isTestOrDummyAccount } from '../lib/connections-algorithm';

async function main() {
  const isApply = process.argv.includes('--apply');
  console.log(`[PurgeTestAccounts] Mode: ${isApply ? 'APPLY (Live DB Mutation)' : 'DRY RUN (Read-Only Inspection)'}`);

  const supabase = createAdminClient() || getDbClient();
  if (!supabase) {
    console.error('[PurgeTestAccounts] Error: Supabase client unavailable.');
    process.exit(1);
  }

  const { data: profiles, error } = (await supabase
    .from('profiles')
    .select('id, display_name, company_name, email, role, status')) as { data: any[] | null; error: any };

  if (error) {
    console.error('[PurgeTestAccounts] Error fetching profiles:', error.message);
    process.exit(1);
  }

  if (!profiles || profiles.length === 0) {
    console.log('[PurgeTestAccounts] No profiles found in public.profiles.');
    return;
  }

  console.log(`[PurgeTestAccounts] Total registered profiles in DB: ${profiles.length}`);

  const testProfiles: any[] = profiles.filter((p: any) =>
    isTestOrDummyAccount({
      uid: p.id,
      email: p.email,
      displayName: p.display_name,
      company: p.company_name,
      designation: p.role,
    })
  );

  console.log(`[PurgeTestAccounts] Test/dummy profiles identified: ${testProfiles.length}`);

  if (testProfiles.length === 0) {
    console.log('[PurgeTestAccounts] All database profiles are clean and verified! No action required.');
    return;
  }

  testProfiles.forEach((p: any, idx: number) => {
    console.log(`  ${idx + 1}. [${p.id}] "${p.display_name}" | Company: "${p.company_name}" | Email: "${p.email}"`);
  });

  if (!isApply) {
    console.log('\n[PurgeTestAccounts] DRY RUN complete. To deactivate or purge these test records, pass --apply flag.');
    return;
  }

  console.log('\n[PurgeTestAccounts] Applying deactivation to identified test records...');
  const testIds = testProfiles.map((p: any) => p.id);

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ status: 'deactivated', is_verified: false })
    .in('id', testIds);

  if (updateError) {
    console.error('[PurgeTestAccounts] Failed to deactivate test profiles:', updateError.message);
  } else {
    console.log(`[PurgeTestAccounts] Successfully deactivated ${testIds.length} test profile(s).`);
  }
}

main().catch((err) => {
  console.error('[PurgeTestAccounts] Fatal error:', err);
  process.exit(1);
});
