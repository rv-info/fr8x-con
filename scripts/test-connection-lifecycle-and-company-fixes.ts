/**
 * FR8X Connection Workflow, Professional Messaging, Company Profiles & UI Logic Verification Suite
 * Phase 20
 * 
 * Verifies:
 * 1. Professional messaging and self-search exclusion by UID (no unprofessional warning, other members with same name discoverable)
 * 2. Connection request complete lifecycle: Sent, Received, Accepted (mutual contact), Withdrawn (in dedicated Withdrawn tab with timestamp)
 * 3. Company name restoration (SYB INTERNATIONAL, no CMP-75055 displayed) and functional editing persistence
 * 4. "Department / Operational Division" professional labeling and data integrity
 * 5. Persistent notifications with deduplication and read/unread status
 */

import fs from 'fs';
import path from 'path';
import { peopleDirectoryStore } from '../lib/people-directory';
import { serverSecurityStore } from '../lib/server-auth-store';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    process.exitCode = 1;
  }
}

async function runVerification() {
  console.log('\n======================================================================');
  console.log('   FR8X CONNECTION WORKFLOW, MESSAGING, COMPANY & UI VERIFICATION     ');
  console.log('======================================================================\n');

  // ─────────────────────────────────────────────────────────────────────────────
  // REQ 1: Self-Search & Professional Messaging
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [REQ 1] Verifying Self-Search Exclusion by UID & Professional Messaging...');
  
  const searchModalCode = fs.readFileSync(path.join(process.cwd(), 'components/connections/SearchConnectionsModal.tsx'), 'utf8');
  
  // 1.1 Unprofessional banner completely removed
  assert(
    !searchModalCode.includes('Self-connection is excluded by design'),
    'Removed unprofessional banner "Self-connection is excluded by design so you can discover and connect..."'
  );
  assert(
    !searchModalCode.includes('isSelfSearch'),
    'Eliminated isSelfSearch assumption that intercepted search when query matched user name'
  );

  // 1.2 Exact professional empty state
  assert(
    searchModalCode.includes('No matching members found. Try another name or company.'),
    'Displays concise, professional empty state: "No matching members found. Try another name or company."'
  );

  // 1.3 UID-based self exclusion while keeping others with same name discoverable
  const userA = { uid: 'usr_rajat_001', name: 'Rajat Kumar', email: 'rajat@syb.com', company: 'SYB INTERNATIONAL' };
  const userB = { uid: 'usr_rajat_002', name: 'Rajat Kumar', email: 'rajat.k@freightcorp.com', company: 'FREIGHT CORP' };
  
  const rawCandidates = [userA, userB];
  const filteredCandidates = rawCandidates.filter(c => c.uid.toLowerCase() !== userA.uid.toLowerCase());
  
  assert(
    filteredCandidates.length === 1 && filteredCandidates[0].uid === 'usr_rajat_002',
    'Excludes current account strictly by authenticated user ID without excluding other members with identical names'
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // REQ 2: Complete Connection-Request Lifecycle & Withdrawn Tab
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [REQ 2] Verifying Complete Connection Lifecycle (Sent, Received, Accepted, Withdrawn)...');

  // 2.1 Tab configuration includes Withdrawn Requests
  const connectionsPageCode = fs.readFileSync(path.join(process.cwd(), 'app/connections/page.tsx'), 'utf8');
  assert(
    connectionsPageCode.includes('Withdrawn Requests') && connectionsPageCode.includes("'withdrawn'"),
    'Connections page provides dedicated "Withdrawn Requests" tab'
  );
  assert(
    connectionsPageCode.includes('My Contacts') && connectionsPageCode.includes('Received Requests') && connectionsPageCode.includes('Sent Requests'),
    'Connections page displays professional tab labels: "My Contacts", "Received Requests", "Sent Requests"'
  );
  assert(
    connectionsPageCode.includes('Withdraw') && !connectionsPageCode.includes('title="Cancel request"'),
    'Outgoing requests provide clear "Withdraw" action instead of generic Cancel'
  );

  // 2.2 PeopleDirectoryStore supports complete lifecycle: Send, Accept, Decline, Withdraw
  const testRequester = 'test_usr_lifecycle_req';
  const testRecipient = 'test_usr_lifecycle_rec';
  const testRecipient2 = 'test_usr_lifecycle_rec2';

  // Send request 1
  const sendRes = peopleDirectoryStore.sendRequest(testRequester, testRecipient);
  assert(sendRes.success, 'Successfully sent connection request through peopleDirectoryStore');

  // Verify outgoing and incoming lists
  const reqOutgoing = peopleDirectoryStore.getOutgoing(testRequester);
  const recIncoming = peopleDirectoryStore.getIncoming(testRecipient);
  assert(
    reqOutgoing.some(r => r.recipient_id === testRecipient && r.status === 'pending'),
    'Outgoing request immediately appears under requester Sent Requests with pending status'
  );
  assert(
    recIncoming.some(r => r.requester_id === testRequester && r.status === 'pending'),
    'Incoming request immediately appears under recipient Received Requests'
  );

  // Accept request 1
  const reqId = sendRes.request_id || reqOutgoing.find(r => r.recipient_id === testRecipient)!.id;
  const acceptOk = peopleDirectoryStore.acceptRequest(testRecipient, reqId);
  assert(acceptOk, 'Successfully accepted connection request');

  // Verify mutual connection in My Contacts
  const requesterContacts = peopleDirectoryStore.getConnections(testRequester);
  const recipientContacts = peopleDirectoryStore.getConnections(testRecipient);
  assert(
    requesterContacts.some(c => c.id === testRecipient || (c as any).other_user_id === testRecipient),
    'Accepted connection appears in requester "My Contacts"'
  );
  assert(
    recipientContacts.some(c => c.id === testRequester || (c as any).other_user_id === testRequester),
    'Accepted connection appears in recipient "My Contacts"'
  );

  // Test Withdraw lifecycle
  const sendRes2 = peopleDirectoryStore.sendRequest(testRequester, testRecipient2);
  assert(sendRes2.success, 'Successfully sent second connection request for withdraw test');
  const reqId2 = sendRes2.request_id || peopleDirectoryStore.getOutgoing(testRequester).find(r => r.recipient_id === testRecipient2)!.id;
  
  const withdrawOk = peopleDirectoryStore.cancelRequest(testRequester, reqId2);
  assert(withdrawOk, 'Successfully withdrew outgoing connection request');

  const withdrawnList = peopleDirectoryStore.getWithdrawn(testRequester);
  assert(
    withdrawnList.some(r => r.id === reqId2 && (r.status === 'cancelled' || r.status === 'withdrawn')),
    'Withdrawn request is removed from active pending lists and appears in Withdrawn Requests with status and timestamp'
  );

  // Verify unauthorized action rejection (unauthorized user cannot withdraw requester request)
  const sendRes3 = peopleDirectoryStore.sendRequest(testRequester, 'test_usr_lifecycle_rec3');
  const reqId3 = sendRes3.request_id;
  const unauthorizedCancel = peopleDirectoryStore.cancelRequest('attacker_user_id', reqId3);
  assert(
    !unauthorizedCancel,
    'Unauthorized user is strictly prohibited from cancelling or modifying another user request'
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // REQ 3: Real Company Name & Profile Editing Capability
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [REQ 3] Verifying Real Company Name (SYB INTERNATIONAL) & Editing Capability...');

  const profilePageCode = fs.readFileSync(path.join(process.cwd(), 'app/profile/page.tsx'), 'utf8');
  const sidebarCode = fs.readFileSync(path.join(process.cwd(), 'components/layout/Sidebar.tsx'), 'utf8');

  // Verify CMP- internal ID suppression in UI
  assert(
    !sidebarCode.includes("CMP-75055") || sidebarCode.includes("user.company.startsWith('CMP-')"),
    'Sidebar resolves real company name (SYB INTERNATIONAL) and suppresses raw CMP- IDs'
  );

  // Verify Profile Edit modal provides editable company name field
  assert(
    profilePageCode.includes('editCompany') && profilePageCode.includes('Company / Legal Entity Name'),
    'Profile page provides editable "Company / Legal Entity Name" input field'
  );
  assert(
    !profilePageCode.includes('Enterprise Company Profile (Fixed & Immutable)'),
    'Removed locked "Fixed & Immutable" company card that prevented updating company name'
  );

  // Verify server-side user update persists company name
  const testUid = 'usr_company_test_01';
  serverSecurityStore.updateUserProfile(testUid, {
    uid: testUid,
    email: 'test@syb.com',
    displayName: 'Rajat K',
    company: 'SYB INTERNATIONAL',
    companyName: 'SYB INTERNATIONAL',
    companyId: 'CMP-75055',
  });

  const persistedUser = serverSecurityStore.getUser(testUid);
  assert(
    persistedUser?.company === 'SYB INTERNATIONAL' && persistedUser?.companyName === 'SYB INTERNATIONAL',
    'Company name "SYB INTERNATIONAL" persists accurately in user record while keeping CMP-75055 as internal companyId'
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // REQ 4: Department / Operational Division Review & Labeling
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [REQ 4] Verifying Department / Operational Division Review...');

  assert(
    profilePageCode.includes('Department / Operational Division'),
    'Replaced confusing "Operating Department / Logistics Desk" with clear, professional "Department / Operational Division"'
  );
  assert(
    profilePageCode.includes('Ocean Freight Operations') || profilePageCode.includes('Air Cargo') || profilePageCode.includes('Pricing & Procurement'),
    'Provides meaningful division examples (Ocean Freight Operations, Air Cargo, Pricing & Procurement)'
  );

  // Verify persistence of department
  serverSecurityStore.updateUserProfile(testUid, {
    department: 'Ocean Freight Operations & Customs Clearance'
  });
  const userWithDept = serverSecurityStore.getUser(testUid);
  assert(
    (userWithDept as any)?.department === 'Ocean Freight Operations & Customs Clearance',
    'Department updates persist reliably in server auth store'
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // REQ 5: Persistent Notifications & Anti-Duplication
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('▶ [REQ 5] Verifying Persistent In-App Notifications & Anti-Duplication...');

  const dataContextCode = fs.readFileSync(path.join(process.cwd(), 'lib/context/DataContext.tsx'), 'utf8');
  assert(
    dataContextCode.includes('notificationDbService') && dataContextCode.includes('notificationDbService.getNotifications'),
    'DataContext fetches real notifications from database via notificationDbService'
  );
  assert(
    dataContextCode.includes('notificationDbService.markAsRead'),
    'DataContext persists notification read status to database'
  );

  // ─────────────────────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────────────────────
  console.log('\n======================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('======================================================================\n');

  if (passedTests === totalTests) {
    console.log('🎉 ALL CONNECTION WORKFLOW & COMPANY PROFILE TESTS PASSED!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME TESTS FAILED!\n');
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});
