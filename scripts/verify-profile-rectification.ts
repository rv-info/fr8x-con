import assert from 'assert';
import { serverSecurityStore } from '../lib/server-auth-store';
import { getPersistedUserByIdentifier, getPersistedUsers } from '../lib/dbms/server-dbms';

async function runVerification() {
  console.log('====================================================');
  console.log('FR8X Profile, Identity, Deletion & Session Rectification Test');
  console.log('====================================================\n');

  const testUid = 'u-audit-test-01';
  const testEmail = 'audit.test@fr8x.in';

  // 1. Profile Persistence (Mobile, Designation, Location)
  console.log('1. Testing Profile & Identity Field Persistence...');
  const initialUpdate = serverSecurityStore.updateUserProfile(testUid, {
    uid: testUid,
    email: testEmail,
    displayName: 'Audit Tester',
    company: 'FR8X Test Logistics',
    role: 'user',
    mobile: '+91 9876543210',
    designation: 'Senior Director of Global Procurement',
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    formattedAddress: 'Port of Nhava Sheva, JNPT, Navi Mumbai, Maharashtra 400707',
  });

  assert(initialUpdate.success, 'Profile update must succeed');
  assert.strictEqual(initialUpdate.user?.mobile, '+91 9876543210', 'Mobile must be saved');
  assert.strictEqual(initialUpdate.user?.designation, 'Senior Director of Global Procurement', 'Designation must be saved');
  assert.strictEqual(initialUpdate.user?.formattedAddress, 'Port of Nhava Sheva, JNPT, Navi Mumbai, Maharashtra 400707', 'Formatted address must be saved');

  // Verify it persisted to DBMS .data/dbms/users.json
  const persistedInDbms = getPersistedUserByIdentifier(testUid);
  assert(persistedInDbms, 'User must exist in authoritative DBMS');
  assert.strictEqual(persistedInDbms.mobile, '+91 9876543210', 'DBMS mobile must match');
  assert.strictEqual(persistedInDbms.designation, 'Senior Director of Global Procurement', 'DBMS designation must match');
  assert.strictEqual(persistedInDbms.formattedAddress, 'Port of Nhava Sheva, JNPT, Navi Mumbai, Maharashtra 400707', 'DBMS address must match');
  console.log('   ✓ Profile fields persisted to memory and .data/dbms/users.json successfully.');

  // 2. Field-Name Mapping Normalization
  console.log('\n2. Testing Field-Name Mapping Normalization (phone -> mobile, address -> formattedAddress)...');
  const aliasUpdate = serverSecurityStore.updateUserProfile(testUid, {
    phone: '+91 9123456789',
    address: 'Gateway Building, Apollo Bunder, Mumbai 400001',
    designation: 'VP Multimodal Freight',
  });
  assert(aliasUpdate.success, 'Alias update must succeed');
  assert.strictEqual(aliasUpdate.user?.mobile, '+91 9123456789', 'phone alias must map to mobile');
  assert.strictEqual(aliasUpdate.user?.formattedAddress, 'Gateway Building, Apollo Bunder, Mumbai 400001', 'address alias must map to formattedAddress');
  assert.strictEqual(aliasUpdate.user?.designation, 'VP Multimodal Freight', 'Designation updated');
  console.log('   ✓ Aliases correctly normalized.');

  // 3. 5-Day Account Deletion Grace Period
  console.log('\n3. Testing 5-Day Grace Period Account Deletion...');
  const scheduleRes = serverSecurityStore.scheduleAccountDeletion(testUid, 'Temporary operational hiatus');
  assert(scheduleRes.success, 'Schedule deletion must succeed');
  assert.strictEqual(scheduleRes.user?.status, 'pending_deletion', 'Status must be pending_deletion');
  assert.strictEqual(scheduleRes.user?.deletionType, 'five_day_grace', 'Deletion type must be five_day_grace');
  assert(scheduleRes.user?.deletionEffectiveAt, 'deletionEffectiveAt must be defined');

  const nowMs = Date.now();
  const effectiveMs = new Date(scheduleRes.user!.deletionEffectiveAt!).getTime();
  const diffDays = Math.round((effectiveMs - nowMs) / (1000 * 60 * 60 * 24));
  assert.strictEqual(diffDays, 5, 'Effective date must be exactly 5 days in the future');
  console.log(`   ✓ Account scheduled for deletion in 5 days (${scheduleRes.user?.deletionEffectiveAt}).`);

  // 4. Cancel Scheduled Deletion
  console.log('\n4. Testing Cancel Deletion (Restoring Account)...');
  const cancelRes = serverSecurityStore.cancelAccountDeletion(testUid);
  assert(cancelRes.success, 'Cancel deletion must succeed');
  assert.strictEqual(cancelRes.user?.status, 'active', 'Status must be restored to active');
  assert.strictEqual(cancelRes.user?.deletionEffectiveAt, undefined, 'deletionEffectiveAt must be cleared');
  console.log('   ✓ Account successfully restored to active status.');

  // 5. Permanent Deletion Immediately
  console.log('\n5. Testing Permanent Deletion Immediately...');
  const permRes = serverSecurityStore.permanentlyDeleteAccount(testUid, 'Complete purge request');
  assert(permRes.success, 'Permanent deletion must succeed');
  
  // Verify user is purged from memory and DBMS
  const memCheck = serverSecurityStore.getUser(testUid);
  assert.strictEqual(memCheck, undefined, 'User must not exist in memory store');
  const dbmsCheck = getPersistedUserByIdentifier(testUid);
  assert.strictEqual(dbmsCheck, undefined, 'User must be purged from .data/dbms/users.json');
  console.log('   ✓ User permanently purged from memory and DBMS.');

  // 6. Same-Device Session Expiration & Refresh Retention
  console.log('\n6. Testing Session 2-Hour Window & Same-Device Re-bind Retention...');
  const sessionUser = 'u-session-audit';
  serverSecurityStore.updateUserProfile(sessionUser, {
    uid: sessionUser,
    email: 'session.audit@fr8x.in',
    displayName: 'Session Audit User',
    company: 'FR8X Test Logistics',
    role: 'user',
  });

  serverSecurityStore.setActiveSession(sessionUser, 'sess_initial', {
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 Chrome/120.0',
    deviceId: 'dev_test_device_001',
  });
  const firstUser = serverSecurityStore.getUser(sessionUser);
  const firstExpiresAt = firstUser?.activeDevice?.expiresAt;
  assert(firstExpiresAt, 'Initial session expiresAt must be defined');

  // Simulate same-device page refresh re-binding session
  serverSecurityStore.setActiveSession(sessionUser, 'sess_refreshed', {
    ip: '127.0.0.1',
    userAgent: 'Mozilla/5.0 Chrome/120.0',
    deviceId: 'dev_test_device_001',
  });

  const refreshedUser = serverSecurityStore.getUser(sessionUser);
  const refreshedExpiresAt = refreshedUser?.activeDevice?.expiresAt;
  assert.strictEqual(refreshedExpiresAt, firstExpiresAt, 'Same-device re-bind must retain original expiresAt without timer drift');
  console.log('   ✓ Same-device refresh maintains original 2-hour window without timer drift.');

  // Validate session verification
  const validCheck = serverSecurityStore.validateActiveSession(
    sessionUser,
    'sess_refreshed',
    'dev_test_device_001',
    '127.0.0.1'
  );
  assert(validCheck.valid, 'Same-device refresh session must be valid');
  assert.strictEqual(validCheck.reason, undefined, 'Should not trigger concurrent device error on same device');
  console.log('   ✓ Same-device validation passes without concurrent_device_login error.');

  // Cleanup session user
  serverSecurityStore.permanentlyDeleteAccount(sessionUser);

  console.log('\n====================================================');
  console.log('ALL RECTIFICATION & VERIFICATION CHECKS PASSED (100%)');
  console.log('====================================================');
}

runVerification().catch((err) => {
  console.error('Verification failed:', err);
  process.exit(1);
});
