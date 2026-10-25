/**
 * scripts/test-two-account-http-flow.ts
 * ==============================================================================
 * Comprehensive Two-Account HTTP Workflow Integration Test:
 * Tests the complete Next.js Route Handlers for Connections and Notifications
 * simulating two independent authenticated user sessions.
 * ==============================================================================
 */

import { NextRequest } from 'next/server';
import { GET as getConnections, POST as mutateConnections } from '../app/api/people/connections/route';
import { GET as getNotifications, POST as mutateNotifications } from '../app/api/notifications/route';
import { peopleDirectoryStore, DirectoryMember } from '../lib/people-directory';

let totalTests = 0;
let passedTests = 0;

function assert(condition: unknown, testName: string, detail?: string) {
  totalTests++;
  if (Boolean(condition)) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}`);
    if (detail) console.error(`    Detail: ${detail}`);
    process.exitCode = 1;
  }
}

import { createSignedSessionToken } from '../lib/crypto';

function createMockRequest(
  url: string,
  method: string,
  body?: Record<string, any>,
  headers?: Record<string, string>
): NextRequest {
  const mergedHeaders: Record<string, string> = {
    'content-type': 'application/json',
    ...(headers || {}),
  };

  // If a test passes x-fr8x-user-uid, generate a valid cryptographic signed token for that user
  const actorUid = mergedHeaders['x-fr8x-user-uid'];
  if (actorUid) {
    const signedToken = createSignedSessionToken({
      uid: actorUid,
      email: `${actorUid}@fr8x.in`,
      role: 'user',
      companyId: 'CMP-75055',
    });
    mergedHeaders['authorization'] = `Bearer ${signedToken}`;
    mergedHeaders['cookie'] = `fr8x_session=${signedToken}`;
  }

  const reqInit: RequestInit = {
    method,
    headers: mergedHeaders,
  };
  if (body && method !== 'GET') {
    reqInit.body = JSON.stringify(body);
  }
  return new NextRequest(new URL(url, 'http://localhost:3000'), reqInit as any);
}

async function runTwoAccountHttpTests() {
  console.log('\n======================================================================');
  console.log('   FR8X TWO-ACCOUNT HTTP INTEGRATION & BELL NOTIFICATION TEST SUITE  ');
  console.log('======================================================================\n');

  // Setup Profiles in Directory Store
  const userA_Id = '11111111-1111-4111-8111-111111111111';
  const userB_Id = '22222222-2222-4222-8222-222222222222';
  const userC_Id = '33333333-3333-4333-8333-333333333333';

  const memberA: DirectoryMember = {
    id: userA_Id,
    first_name: 'Raj',
    last_name: 'Verma',
    display_name: 'Raj Verma',
    email: 'raj.verma@fr8x-enterprise.com',
    company_name: 'Apex Global Logistics',
    designation: 'Supply Chain VP',
    headline: 'Global Ocean Freight VP',
    city: 'Mumbai',
    country: 'India',
    is_verified: true,
    has_golden_tick: true,
    skills: ['Ocean Freight', 'Procurement'],
    specializations: ['FCL'],
    key_trade_lanes: ['IN-AE', 'IN-US'],
  };

  const memberB: DirectoryMember = {
    id: userB_Id,
    first_name: 'Suresh',
    last_name: 'Nair',
    display_name: 'Suresh Nair',
    email: 'suresh.nair@maritime-forwarding.com',
    company_name: 'Maritime Forwarding Ltd',
    designation: 'Head of Procurement',
    headline: 'Air & Sea Freight Director',
    city: 'Dubai',
    country: 'United Arab Emirates',
    is_verified: true,
    has_golden_tick: false,
    skills: ['Customs Clearance', 'Air Cargo'],
    specializations: ['LCL', 'Air Freight'],
    key_trade_lanes: ['AE-IN', 'AE-EU'],
  };

  const memberC: DirectoryMember = {
    id: userC_Id,
    first_name: 'Unauthorized',
    last_name: 'Interloper',
    display_name: 'Unauthorized Interloper',
    email: 'interloper@hacker.io',
    company_name: 'Suspicious Corp',
    designation: 'Adversary',
    city: 'Unknown',
    country: 'Unknown',
    is_verified: false,
    has_golden_tick: false,
    skills: [],
    specializations: [],
    key_trade_lanes: [],
  };

  peopleDirectoryStore.registerMember(memberA);
  peopleDirectoryStore.registerMember(memberB);
  peopleDirectoryStore.registerMember(memberC);

  // Clean test fixtures from disk store for idempotent runs
  try {
    const fs = await import('fs');
    const path = await import('path');
    const storePath = path.join(process.cwd(), 'data', 'connections_store.json');
    if (fs.existsSync(storePath)) {
      const disk = JSON.parse(fs.readFileSync(storePath, 'utf8'));
      if (Array.isArray(disk.connections)) {
        disk.connections = disk.connections.filter(
          (c: any) =>
            !(
              (c.requester_id === userA_Id && (c.recipient_id === userB_Id || c.receiver_id === userB_Id)) ||
              (c.requester_id === userB_Id && (c.recipient_id === userA_Id || c.receiver_id === userA_Id))
            )
        );
      }
      if (Array.isArray(disk.notifications)) {
        disk.notifications = disk.notifications.filter(
          (n: any) => n.user_id !== userA_Id && n.user_id !== userB_Id
        );
      }
      fs.writeFileSync(storePath, JSON.stringify(disk, null, 2), 'utf8');
    }
  } catch {}
  peopleDirectoryStore.removeConnection(userA_Id, userB_Id);

  // 1. Unauthenticated request protection
  console.log('▶ [TEST 1] Unauthenticated request rejection...');
  const unauthReq = createMockRequest('http://localhost:3000/api/people/connections?tab=incoming', 'GET');
  const unauthRes = await getConnections(unauthReq);
  assert(unauthRes.status === 401, 'Unauthenticated GET /api/people/connections returns HTTP 401');

  // 2. Self-request prevention
  console.log('\n▶ [TEST 2] Self-request invariant enforcement...');
  const selfReq = createMockRequest(
    'http://localhost:3000/api/people/connections',
    'POST',
    { action: 'send', target_id: userA_Id },
    { 'x-fr8x-user-uid': userA_Id }
  );
  const selfRes = await mutateConnections(selfReq);
  const selfJson = await selfRes.json();
  assert(selfRes.status === 400, 'Sending request to self returns HTTP 400');
  assert(selfJson.code === 'SELF_REQUEST', 'Self request code is SELF_REQUEST');

  // 3. User A sends connection request to User B
  console.log('\n▶ [TEST 3] User A sends connection request to User B...');
  const sendReq = createMockRequest(
    'http://localhost:3000/api/people/connections',
    'POST',
    { action: 'send', target_id: userB_Id, message: 'Looking forward to partnering on APAC-EU trade lanes.' },
    { 'x-fr8x-user-uid': userA_Id }
  );
  const sendRes = await mutateConnections(sendReq);
  const sendJson = await sendRes.json();
  assert(sendRes.status === 200, 'POST /api/people/connections returned HTTP 200');
  assert(sendJson.success === true, 'Response reported success: true');
  assert(Boolean(sendJson.request_id), `Valid request_id received: ${sendJson.request_id}`);
  const createdRequestId = sendJson.request_id;

  // 4. User B verifies incoming request
  console.log('\n▶ [TEST 4] User B incoming requests visibility...');
  const userBIncomingReq = createMockRequest(
    'http://localhost:3000/api/people/connections?tab=incoming',
    'GET',
    undefined,
    { 'x-fr8x-user-uid': userB_Id }
  );
  const userBIncomingRes = await getConnections(userBIncomingReq);
  const userBIncomingJson = await userBIncomingRes.json();
  assert(userBIncomingRes.status === 200, 'User B incoming query returns HTTP 200');
  assert(Array.isArray(userBIncomingJson.data), 'User B received an array of requests');
  assert(userBIncomingJson.data.length >= 1, `User B sees ${userBIncomingJson.data.length} incoming request(s)`);
  const matchingReq = userBIncomingJson.data.find((r: any) => r.id === createdRequestId);
  assert(Boolean(matchingReq), 'Incoming request ID matches the created request ID');
  assert(matchingReq.profiles?.display_name === 'Raj Verma', 'Sender profile is fully hydrated with display_name');
  assert(matchingReq.profiles?.company === 'Apex Global Logistics' || matchingReq.profiles?.company_name === 'Apex Global Logistics', 'Sender company hydrated');

  // 5. User A verifies outgoing requests
  console.log('\n▶ [TEST 5] User A outgoing requests view...');
  const userAOutgoingReq = createMockRequest(
    'http://localhost:3000/api/people/connections?tab=outgoing',
    'GET',
    undefined,
    { 'x-fr8x-user-uid': userA_Id }
  );
  const userAOutgoingRes = await getConnections(userAOutgoingReq);
  const userAOutgoingJson = await userAOutgoingRes.json();
  assert(userAOutgoingRes.status === 200, 'User A outgoing query returns HTTP 200');
  assert(userAOutgoingJson.data.some((r: any) => r.id === createdRequestId), 'User A sees the request in outgoing tab');

  // 6. User B verifies Notification Bell
  console.log('\n▶ [TEST 6] User B Notification Bell query...');
  const userBNotifReq = createMockRequest(
    'http://localhost:3000/api/notifications',
    'GET',
    undefined,
    { 'x-fr8x-user-uid': userB_Id }
  );
  const userBNotifRes = await getNotifications(userBNotifReq);
  const userBNotifJson = await userBNotifRes.json();
  assert(userBNotifRes.status === 200, 'GET /api/notifications returns HTTP 200');
  assert(userBNotifJson.success === true, 'Notifications API reported success');
  assert(userBNotifJson.unreadCount >= 1, `Unread count for User B is ${userBNotifJson.unreadCount} (>= 1)`);
  const connNotif = userBNotifJson.notifications.find((n: any) => n.relatedId === createdRequestId || n.type === 'connection_request');
  assert(Boolean(connNotif), 'Notification corresponding to the connection request exists');
  assert(
    connNotif.targetUrl === '/people?tab=incoming' || connNotif.targetUrl === '/connections?tab=incoming',
    'Notification targets incoming connections tab'
  );
  assert(connNotif.read === false, 'Notification is marked unread');

  // 7. Sender User A does NOT have a false incoming notification
  console.log('\n▶ [TEST 7] Inverted notification prevention (User A has no incoming request notification)...');
  const userANotifReq = createMockRequest(
    'http://localhost:3000/api/notifications',
    'GET',
    undefined,
    { 'x-fr8x-user-uid': userA_Id }
  );
  const userANotifRes = await getNotifications(userANotifReq);
  const userANotifJson = await userANotifRes.json();
  const falseNotif = userANotifJson.notifications.find((n: any) => n.relatedId === createdRequestId && n.type === 'connection_request');
  assert(!falseNotif, 'Sender User A has NO false/inverted self-notification');

  // 8. User A withdraws / cancels the request
  console.log('\n▶ [TEST 8] User A withdraws connection request...');
  const cancelReq = createMockRequest(
    'http://localhost:3000/api/people/connections',
    'POST',
    { action: 'cancel', request_id: createdRequestId, target_id: userB_Id },
    { 'x-fr8x-user-uid': userA_Id }
  );
  const cancelRes = await mutateConnections(cancelReq);
  const cancelJson = await cancelRes.json();
  assert(cancelRes.status === 200, 'Withdraw request returns HTTP 200');
  assert(cancelJson.success === true, 'Withdraw reports success: true');

  // 9. Verify User B incoming requests is now empty
  console.log('\n▶ [TEST 9] User B incoming requests cleared after withdrawal...');
  const userBIncomingAfterCancelReq = createMockRequest(
    'http://localhost:3000/api/people/connections?tab=incoming',
    'GET',
    undefined,
    { 'x-fr8x-user-uid': userB_Id }
  );
  const userBIncomingAfterCancelRes = await getConnections(userBIncomingAfterCancelReq);
  const userBIncomingAfterCancelJson = await userBIncomingAfterCancelRes.json();
  const pendingAfterCancel = userBIncomingAfterCancelJson.data.filter((r: any) => r.id === createdRequestId);
  assert(pendingAfterCancel.length === 0, 'User B sees 0 pending requests for the withdrawn ID');

  // 10. User A verifies request appears in withdrawn tab
  console.log('\n▶ [TEST 10] User A sees request in withdrawn tab...');
  const userAWithdrawnReq = createMockRequest(
    'http://localhost:3000/api/people/connections?tab=withdrawn',
    'GET',
    undefined,
    { 'x-fr8x-user-uid': userA_Id }
  );
  const userAWithdrawnRes = await getConnections(userAWithdrawnReq);
  const userAWithdrawnJson = await userAWithdrawnRes.json();
  assert(userAWithdrawnRes.status === 200, 'User A withdrawn query returns HTTP 200');
  assert(userAWithdrawnJson.data.some((r: any) => r.id === createdRequestId || r.recipient_id === userB_Id), 'User A sees withdrawn request');

  // 11. User A re-sends connection request to User B
  console.log('\n▶ [TEST 11] User A re-sends connection request to User B...');
  const resendReq = createMockRequest(
    'http://localhost:3000/api/people/connections',
    'POST',
    { action: 'send', target_id: userB_Id, message: 'Re-connecting to explore trade lanes.' },
    { 'x-fr8x-user-uid': userA_Id }
  );
  const resendRes = await mutateConnections(resendReq);
  const resendJson = await resendRes.json();
  assert(resendRes.status === 200, 'Re-send connection request returns HTTP 200');
  assert(resendJson.success === true, 'Re-send reports success: true');
  const resentRequestId = resendJson.request_id;
  assert(Boolean(resentRequestId), `New valid request_id received: ${resentRequestId}`);

  // 12. User B accepts the re-sent request
  console.log('\n▶ [TEST 12] User B accepts re-sent connection request...');
  const acceptReq = createMockRequest(
    'http://localhost:3000/api/people/connections',
    'POST',
    { action: 'accept', request_id: resentRequestId },
    { 'x-fr8x-user-uid': userB_Id }
  );
  const acceptRes = await mutateConnections(acceptReq);
  const acceptJson = await acceptRes.json();
  assert(acceptRes.status === 200, 'Accept request returned HTTP 200');
  assert(acceptJson.success === true, 'Accept request reported success: true');

  // 9. Verify mutual connection state in My Contacts for both users
  console.log('\n▶ [TEST 9] Verifying mutual connection state for User A and User B...');
  const userAConnReq = createMockRequest(
    'http://localhost:3000/api/people/connections?tab=connections',
    'GET',
    undefined,
    { 'x-fr8x-user-uid': userA_Id }
  );
  const userAConnRes = await getConnections(userAConnReq);
  const userAConnJson = await userAConnRes.json();
  assert(userAConnJson.data.some((c: any) => c.connected_to === userB_Id || c.profiles?.id === userB_Id), 'User A has User B in My Contacts');

  const userBConnReq = createMockRequest(
    'http://localhost:3000/api/people/connections?tab=connections',
    'GET',
    undefined,
    { 'x-fr8x-user-uid': userB_Id }
  );
  const userBConnRes = await getConnections(userBConnReq);
  const userBConnJson = await userBConnRes.json();
  assert(userBConnJson.data.some((c: any) => c.connected_to === userA_Id || c.profiles?.id === userA_Id), 'User B has User A in My Contacts');

  // 10. Mark notification read & verify bell count update
  console.log('\n▶ [TEST 10] Notification mark read lifecycle...');
  if (connNotif?.id) {
    const markReadReq = createMockRequest(
      'http://localhost:3000/api/notifications',
      'POST',
      { action: 'mark_read', id: connNotif.id },
      { 'x-fr8x-user-uid': userB_Id }
    );
    const markReadRes = await mutateNotifications(markReadReq);
    assert(markReadRes.status === 200, 'POST /api/notifications mark_read returns HTTP 200');

    const refreshedNotifReq = createMockRequest(
      'http://localhost:3000/api/notifications',
      'GET',
      undefined,
      { 'x-fr8x-user-uid': userB_Id }
    );
    const refreshedNotifRes = await getNotifications(refreshedNotifReq);
    const refreshedNotifJson = await refreshedNotifRes.json();
    const updatedNotif = refreshedNotifJson.notifications.find((n: any) => n.id === connNotif.id);
    assert(updatedNotif?.read === true, 'Notification is now marked as read');
  }

  console.log('\n======================================================================');
  console.log(`  VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('======================================================================\n');
}

runTwoAccountHttpTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
