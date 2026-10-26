import assert from 'assert';
import { getUserContacts } from '../lib/db/contacts';
import { peopleDirectoryStore } from '../lib/people-directory';
import { acceptConnectionRequestBackend, sendConnectionRequestBackend } from '../lib/connections-backend';
import fs from 'fs';
import path from 'path';

async function run() {
  console.log('======================================================================');
  console.log('   FR8X CRM CONTACTS & ACCEPTED CONNECTIONS VERIFICATION              ');
  console.log('======================================================================\n');

  // 1. Setup two test accounts: Kumar R (User B) and Rajat Rai (User A)
  const userA = {
    id: 'test_crm_rajat_' + Date.now(),
    full_name: 'Rajat Rai',
    display_name: 'Rajat Rai',
    company: 'Cogoport Freight Solutions',
    designation: 'Logistics Director',
    email: 'rajat.test@crm.fr8x.in',
    status: 'active',
  };
  const userB = {
    id: 'test_crm_kumar_' + Date.now(),
    full_name: 'Kumar R',
    display_name: 'Kumar R',
    company: 'SYB INTERNATIONAL',
    designation: 'Managing Director',
    email: 'kumar.test@crm.fr8x.in',
    status: 'active',
  };

  peopleDirectoryStore.registerMember(userA as any);
  peopleDirectoryStore.registerMember(userB as any);

  console.log('▶ [TEST 1] Initial Contacts for User B before connection...');
  const initialContacts = await getUserContacts(userB.id);
  assert(Array.isArray(initialContacts), 'getUserContacts must return an array');
  console.log('  ✓ [PASS] Initial contacts query succeeded (count:', initialContacts.length, ')');

  console.log('▶ [TEST 2] User A sends connection request to User B, and User B accepts...');
  const sendRes = await sendConnectionRequestBackend(userA.id, userB.id, 'Let us collaborate on trade lanes');
  assert(sendRes.success, 'sendConnectionRequestBackend must succeed');

  const acceptRes = await acceptConnectionRequestBackend(userB.id, sendRes.request_id, userA.id);
  assert(acceptRes.success, 'acceptConnectionRequestBackend must succeed');
  console.log('  ✓ [PASS] Connection request accepted successfully');

  console.log('▶ [TEST 3] Verifying accepted connection is automatically in User B CRM contacts...');
  const updatedContactsB = await getUserContacts(userB.id);
  const foundA = updatedContactsB.find(
    (c) => c.contact_profile_id === userA.id || c.id === `conn_${userA.id}` || c.email === userA.email
  );
  assert(foundA, 'Accepted partner User A must be present in User B contacts CRM');
  assert.strictEqual(foundA.name, 'Rajat Rai', 'Name must match Rajat Rai');
  assert.strictEqual(foundA.company, 'Cogoport Freight Solutions', 'Company must match Cogoport Freight Solutions');
  assert.strictEqual(foundA.is_connection, true, 'is_connection flag must be true');
  console.log('  ✓ [PASS] User A is automatically in User B CRM Contacts:');
  console.log('          - Name:', foundA.name);
  console.log('          - Company:', foundA.company);
  console.log('          - is_connection:', foundA.is_connection);
  console.log('          - Stage:', foundA.stage);

  console.log('▶ [TEST 4] Verifying User B is in User A CRM contacts as reciprocal partner...');
  const updatedContactsA = await getUserContacts(userA.id);
  const foundB = updatedContactsA.find(
    (c) => c.contact_profile_id === userB.id || c.id === `conn_${userB.id}` || c.email === userB.email
  );
  assert(foundB, 'Accepted partner User B must be present in User A contacts CRM');
  assert.strictEqual(foundB.name, 'Kumar R', 'Name must match Kumar R');
  assert.strictEqual(foundB.company, 'SYB INTERNATIONAL', 'Company must match SYB INTERNATIONAL');
  assert.strictEqual(foundB.is_connection, true, 'is_connection flag must be true');
  console.log('  ✓ [PASS] User B is automatically in User A CRM Contacts:');
  console.log('          - Name:', foundB.name);
  console.log('          - Company:', foundB.company);

  console.log('▶ [TEST 5] Checking for user-facing DBMS or PostgreSQL strings in app/contacts/page.tsx...');
  const contactsPageContent = fs.readFileSync(path.join(__dirname, '../app/contacts/page.tsx'), 'utf8');
  assert(!contactsPageContent.includes('Live DBMS'), 'Must not contain "Live DBMS"');
  assert(!contactsPageContent.includes('DBMS Peer'), 'Must not contain "DBMS Peer"');
  assert(!contactsPageContent.includes('Save to DBMS'), 'Must not contain "Save to DBMS"');
  assert(!contactsPageContent.includes('Synchronized with DBMS connections'), 'Must not contain "Synchronized with DBMS connections"');
  assert(!contactsPageContent.includes('PostgreSQL Connected'), 'Must not contain "PostgreSQL Connected"');
  assert(!contactsPageContent.includes('Loading trade contacts from DBMS...'), 'Must not contain "Loading trade contacts from DBMS..."');
  console.log('  ✓ [PASS] Zero user-facing DBMS/PostgreSQL strings in Contacts page');

  console.log('▶ [TEST 6] Checking TopBar.tsx for Notifications Live DBMS...');
  const topBarContent = fs.readFileSync(path.join(__dirname, '../components/layout/TopBar.tsx'), 'utf8');
  assert(!topBarContent.includes('Live DBMS'), 'TopBar must not contain "Live DBMS"');
  assert(!topBarContent.includes('Live DBMS Synchronized'), 'TopBar must not contain "Live DBMS Synchronized"');
  console.log('  ✓ [PASS] TopBar.tsx clean of Live DBMS and DBMS mentions');

  console.log('\n======================================================================');
  console.log('  ALL CRM CONTACTS & ACCEPTED CONNECTION TESTS PASSED! (6/6)');
  console.log('======================================================================\n');
}

run().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
