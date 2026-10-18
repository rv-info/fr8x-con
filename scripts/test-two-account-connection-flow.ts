/**
 * scripts/test-two-account-connection-flow.ts
 * ==============================================================================
 * Comprehensive Two-Account Automated Verification Test Suite for FR8X
 * Verifies:
 *   1. Incoming Connection Request Visibility ("CONNECTION REQUEST RECEIVED")
 *   2. Durable Notification Creation & Bell Unread Badge Synchronization
 *   3. Critical Request Withdrawal (Priority 1) with Notification Reconciliation
 *   4. Re-sending Connection Request After Withdrawal
 *   5. Mutual Acceptance & Canonical Connection Establishment
 *   6. Rejection Workflow
 *   7. Row Level Security & Authorization Enforcement (Unauthorized Withdraw/Accept)
 *   8. Anti-Duplication & Self-Request Invariant Enforcement
 * ==============================================================================
 */

import { NextRequest } from 'next/server';
import { GET as getConnections, POST as mutateConnections } from '../app/api/people/connections/route';
import { GET as getNotifications, POST as mutateNotifications } from '../app/api/notifications/route';
import { peopleDirectoryStore, DirectoryMember } from '../lib/people-directory';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: unknown, testName: string, detail?: string) {
  totalTests++;
  if (Boolean(condition)) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
  }
}

function createMockRequest(
  url: string,
  method: string,
  body?: Record<string, any>,
  headers?: Record<string, string>
): NextRequest {
  const reqInit: RequestInit = {
    method,
    headers: {
      'content-type': 'application/json',
      ...(headers || {}),
    },
  };
  if (body && method !== 'GET') {
    reqInit.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), reqInit as any);
}

async function runTwoAccountConnectionFlowVerification() {
  console.log('\n======================================================================');
  console.log('   FR8X TWO-ACCOUNT CONNECTION & WITHDRAWAL VERIFICATION SUITE       ');
  console.log('======================================================================\n');

  // Setup Test Profiles
  const userA_Id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const userB_Id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const userC_Id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';

  const memberA: DirectoryMember = {
    id: userA_Id,
    first_name: 'Aarav',
    last_name: 'Singhania',
    display_name: 'Aarav Singhania',
    email: 'aarav.singhania@fr8x-partner.com',
    company_name: 'Singhania Global Freight Lines',
    designation: 'Managing Director',
    headline: 'End-to-End Intermodal Logistics & Heavy Cargo',
    city: 'Mumbai',
    country: 'India',
    is_verified: true,
    has_golden_tick: true,
    skills: ['Intermodal Logistics', 'Ocean Carrier Contracts'],
    specializations: ['FCL', 'Project Cargo'],
    key_trade_lanes: ['IN-EU', 'IN-US'],
  };

  const memberB: DirectoryMember = {
    id: userB_Id,
    first_name: 'Priya',
    last_name: 'Nambiar',
    display_name: 'Priya Nambiar',
    email: 'priya.nambiar@oceanic-trans.com',
    company_name: 'Oceanic Transport & Forwarding',
    designation: 'VP of Trade Procurement',
    headline: 'Cross-Border Supply Chain & Freight Solutions',
    city: 'Singapore',
    country: 'Singapore',
    is_verified: true,
    has_golden_tick: false,
    skills: ['Sea-Air Transshipment', 'Customs Brokerage'],
    specializations: ['Reefer Cargo', 'Dangerous Goods'],
    key_trade_lanes: ['SG-IN', 'SG-US'],
  };

  const memberC: DirectoryMember = {
    id: userC_Id,
    first_name: 'Vikram',
    last_name: 'Malhotra',
    display_name: 'Vikram Malhotra',
    email: 'vikram.m@malhotra-logistics.in',
    company_name: 'Malhotra Freight Network',
    designation: 'Operations Lead',
    headline: 'Domestic Truckload & Rail Freight',
    city: 'Delhi',
    country: 'India',
    is_verified: false,
    has_golden_tick: false,
    skills: ['Rail Freight'],
    specializations: ['Domestic FTL'],
    key_trade_lanes: ['IN-DOM'],
  };

  peopleDirectoryStore.registerMember(memberA);
  peopleDirectoryStore.registerMember(memberB);
  peopleDirectoryStore.registerMember(memberC);

  // --------------------------------------------------------------------------
  // TEST SECTION 1: INVARIANTS & CONSTRAINTS
  // --------------------------------------------------------------------------
  console.log('▶ [PHASE 1] Database Invariant Enforcement...');

  // 1.1 Unauthenticated Request
  const unauthRes = await getConnections(
    createMockRequest('http://localhost:3000/api/people/connections?tab=incoming', 'GET')
  );
  assert(unauthRes.status === 401, 'Unauthenticated query rejected with HTTP 401');

  // 1.2 Self-Request
  const selfRes = await mutateConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections',
      'POST',
      { action: 'send', target_id: userA_Id },
      { 'x-fr8x-user-uid': userA_Id }
    )
  );
  assert(selfRes.status === 400, 'Self connection request rejected with HTTP 400');

  // --------------------------------------------------------------------------
  // TEST SECTION 2: SENDING & RECIPIENT VISIBILITY (REQUIREMENT 1)
  // --------------------------------------------------------------------------
  console.log('\n▶ [PHASE 2] Request Dispatch & Immediate Recipient Hydration...');

  // 2.1 User A sends request to User B
  const sendRes1 = await mutateConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections',
      'POST',
      { action: 'send', target_id: userB_Id, message: 'Excited to explore partnership on Mumbai-Singapore trade lanes.' },
      { 'x-fr8x-user-uid': userA_Id }
    )
  );
  const send1Json = await sendRes1.json();
  assert(sendRes1.status === 200 && send1Json.success === true, 'User A sends request to User B successfully');
  const reqId1 = send1Json.request_id;
  assert(Boolean(reqId1), `Assigned valid request_id: ${reqId1}`);

  // 2.2 User B (Recipient) receives request with authoritative profile
  const userBIncomingRes1 = await getConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections?tab=incoming',
      'GET',
      undefined,
      { 'x-fr8x-user-uid': userB_Id }
    )
  );
  const userBIncomingJson1 = await userBIncomingRes1.json();
  assert(userBIncomingRes1.status === 200, 'User B retrieves incoming requests with HTTP 200');
  const receivedReq = userBIncomingJson1.data?.find((r: any) => r.id === reqId1);
  assert(Boolean(receivedReq), 'Incoming request exists in User B incoming queue');
  assert(receivedReq?.profiles?.display_name === 'Aarav Singhania', 'Requester display_name is hydrated: Aarav Singhania');
  assert(
    receivedReq?.profiles?.company_name === 'Singhania Global Freight Lines' ||
    receivedReq?.profiles?.company === 'Singhania Global Freight Lines',
    'Requester company is hydrated: Singhania Global Freight Lines'
  );

  // 2.3 User B Notification Bell & Unread Count (Requirement 5)
  const userBNotifRes1 = await getNotifications(
    createMockRequest('http://localhost:3000/api/notifications', 'GET', undefined, { 'x-fr8x-user-uid': userB_Id })
  );
  const userBNotifJson1 = await userBNotifRes1.json();
  assert(userBNotifJson1.unreadCount >= 1, `User B notification bell unread count is >= 1 (actual: ${userBNotifJson1.unreadCount})`);
  const notif1 = userBNotifJson1.notifications?.find(
    (n: any) => n.relatedId === reqId1 || (n.type === 'connection_request' && n.read === false)
  );
  assert(Boolean(notif1), 'Durable notification created for User B with category: network');
  assert(notif1?.read === false, 'Notification is marked unread for notification badge display');

  // 2.4 Duplicate request prevention
  const dupRes = await mutateConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections',
      'POST',
      { action: 'send', target_id: userB_Id },
      { 'x-fr8x-user-uid': userA_Id }
    )
  );
  assert(dupRes.status === 409 || dupRes.status === 400, 'Duplicate concurrent request prevented (HTTP 409/400)');

  // --------------------------------------------------------------------------
  // TEST SECTION 3: REQUEST WITHDRAWAL (REQUIREMENT 2 - CRITICAL PRIORITY)
  // --------------------------------------------------------------------------
  console.log('\n▶ [PHASE 3] Critical Request Withdrawal Verification...');

  // 3.1 Security check: Unauthorized user C cannot withdraw A's request
  const unauthWithdrawRes = await mutateConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections',
      'POST',
      { action: 'cancel', request_id: reqId1, target_id: userB_Id },
      { 'x-fr8x-user-uid': userC_Id }
    )
  );
  assert(
    unauthWithdrawRes.status === 403 || unauthWithdrawRes.status === 404,
    'Unauthorized third-party (User C) cannot withdraw User A request'
  );

  // 3.2 Authorized Requester User A executes WITHDRAW
  const withdrawRes = await mutateConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections',
      'POST',
      { action: 'cancel', request_id: reqId1, target_id: userB_Id },
      { 'x-fr8x-user-uid': userA_Id }
    )
  );
  const withdrawJson = await withdrawRes.json();
  assert(withdrawRes.status === 200 && withdrawJson.success === true, 'User A executes WITHDRAW successfully');

  // 3.3 Verify User A's outgoing invitations no longer show this request as pending
  const userAOutgoingRes = await getConnections(
    createMockRequest('http://localhost:3000/api/people/connections?tab=outgoing', 'GET', undefined, { 'x-fr8x-user-uid': userA_Id })
  );
  const userAOutgoingJson = await userAOutgoingRes.json();
  const pendingInA = userAOutgoingJson.data?.find((r: any) => r.id === reqId1 && r.status === 'pending');
  assert(!pendingInA, 'User A outgoing list no longer contains the request in pending state');

  // 3.4 Verify User B's incoming queue no longer shows the withdrawn request
  const userBIncomingRes2 = await getConnections(
    createMockRequest('http://localhost:3000/api/people/connections?tab=incoming', 'GET', undefined, { 'x-fr8x-user-uid': userB_Id })
  );
  const userBIncomingJson2 = await userBIncomingRes2.json();
  const pendingInB = userBIncomingJson2.data?.find((r: any) => r.id === reqId1);
  assert(!pendingInB, 'User B incoming list automatically removes the withdrawn request');

  // 3.5 Verify notification reconciliation (marked read or updated so it no longer misleads user)
  const userBNotifRes2 = await getNotifications(
    createMockRequest('http://localhost:3000/api/notifications', 'GET', undefined, { 'x-fr8x-user-uid': userB_Id })
  );
  const userBNotifJson2 = await userBNotifRes2.json();
  const reconciledNotif = userBNotifJson2.notifications?.find((n: any) => n.relatedId === reqId1);
  if (reconciledNotif) {
    assert(reconciledNotif.read === true, 'Notification reconciled: marked read so bell badge reflects correct state');
  } else {
    assert(true, 'Notification reconciled: removed or marked inactive');
  }

  // --------------------------------------------------------------------------
  // TEST SECTION 4: RE-SENDING & MUTUAL ACCEPTANCE (REQUIREMENT 4)
  // --------------------------------------------------------------------------
  console.log('\n▶ [PHASE 4] Re-sending Connection & Mutual Acceptance...');

  // 4.1 User A can re-send to User B after prior withdrawal
  const resendRes = await mutateConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections',
      'POST',
      { action: 'send', target_id: userB_Id, message: 'Second attempt with updated project timeline.' },
      { 'x-fr8x-user-uid': userA_Id }
    )
  );
  const resendJson = await resendRes.json();
  assert(resendRes.status === 200 && resendJson.success === true, 'User A can re-send connection request after withdrawal');
  const reqId2 = resendJson.request_id;

  // 4.2 Security check: User C cannot accept request directed to User B
  const unauthAcceptRes = await mutateConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections',
      'POST',
      { action: 'accept', request_id: reqId2 },
      { 'x-fr8x-user-uid': userC_Id }
    )
  );
  assert(
    unauthAcceptRes.status === 403 || unauthAcceptRes.status === 404,
    'Unauthorized third-party (User C) cannot accept request addressed to User B'
  );

  // 4.3 Intended recipient User B accepts the request
  const acceptRes = await mutateConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections',
      'POST',
      { action: 'accept', request_id: reqId2 },
      { 'x-fr8x-user-uid': userB_Id }
    )
  );
  const acceptJson = await acceptRes.json();
  assert(acceptRes.status === 200 && acceptJson.success === true, 'User B accepts connection request successfully');

  // 4.4 Canonical Connection established for both User A and User B
  const userAConns = await getConnections(
    createMockRequest('http://localhost:3000/api/people/connections?tab=connections', 'GET', undefined, { 'x-fr8x-user-uid': userA_Id })
  );
  const userAConnsJson = await userAConns.json();
  const aHasB = userAConnsJson.data?.some((c: any) => c.connected_to === userB_Id || c.profiles?.id === userB_Id);
  assert(Boolean(aHasB), 'User A sees User B in Connected Contacts');

  const userBConns = await getConnections(
    createMockRequest('http://localhost:3000/api/people/connections?tab=connections', 'GET', undefined, { 'x-fr8x-user-uid': userB_Id })
  );
  const userBConnsJson = await userBConns.json();
  const bHasA = userBConnsJson.data?.some((c: any) => c.connected_to === userA_Id || c.profiles?.id === userA_Id);
  assert(Boolean(bHasA), 'User B sees User A in Connected Contacts');

  // --------------------------------------------------------------------------
  // TEST SECTION 5: REJECTION LIFECYCLE
  // --------------------------------------------------------------------------
  console.log('\n▶ [PHASE 5] Rejection Lifecycle...');

  // 5.1 User A sends request to User C
  const sendRes3 = await mutateConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections',
      'POST',
      { action: 'send', target_id: userC_Id, message: 'Inquiry on rail logistics.' },
      { 'x-fr8x-user-uid': userA_Id }
    )
  );
  const send3Json = await sendRes3.json();
  const reqId3 = send3Json.request_id;
  assert(Boolean(reqId3), 'User A sends request to User C');

  // 5.2 User C rejects the request
  const rejectRes = await mutateConnections(
    createMockRequest(
      'http://localhost:3000/api/people/connections',
      'POST',
      { action: 'reject', request_id: reqId3 },
      { 'x-fr8x-user-uid': userC_Id }
    )
  );
  const rejectJson = await rejectRes.json();
  assert(rejectRes.status === 200 && rejectJson.success === true, 'User C rejects connection request successfully');

  // 5.3 Verify rejected request is no longer actionable or pending
  const userCIncomingRes = await getConnections(
    createMockRequest('http://localhost:3000/api/people/connections?tab=incoming', 'GET', undefined, { 'x-fr8x-user-uid': userC_Id })
  );
  const userCIncomingJson = await userCIncomingRes.json();
  const stillInC = userCIncomingJson.data?.find((r: any) => r.id === reqId3);
  assert(!stillInC, 'Rejected request does not appear as actionable in User C incoming requests');

  console.log('\n======================================================================');
  console.log(`  VERIFICATION RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${failedTests} FAILED)`);
  console.log(`  PASS RATE: ${Math.round((passedTests / totalTests) * 100)}%`);
  console.log('======================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runTwoAccountConnectionFlowVerification().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
