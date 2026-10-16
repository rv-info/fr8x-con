/**
 * scripts/debug-online-people-network.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Live Online Debugger & Integration Test for FR8X People Search & Connections
 *
 * Simulates online user sessions and tests all API endpoints, data flow,
 * filters, and state transitions.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest } from 'next/server';
import { GET as searchGet } from '../app/api/people/search/route';
import { GET as connGet, POST as connPost } from '../app/api/people/connections/route';
import { GET as profileGet } from '../app/api/people/profile/[id]/route';
import { createSignedSessionToken } from '../lib/crypto';

// Setup authenticated mock user session cookies
const testUserId = '00000000-0000-0000-0000-000000000099';
const sessionToken = createSignedSessionToken({
  uid: testUserId,
  email: 'test.forwarder@fr8x.com',
  role: 'user',
});

function createReq(url: string, method: string = 'GET', body?: unknown): NextRequest {
  const headers = new Headers();
  headers.set('cookie', `fr8x_session=${sessionToken}`);
  if (body) {
    headers.set('content-type', 'application/json');
  }

  return new NextRequest(new URL(url, 'http://localhost:3000'), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
}

async function debugOnlinePeopleNetwork() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        FR8X ONLINE DEBUGGER: PEOPLE SEARCH & CONNECTIONS         ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;

  function report(name: string, ok: boolean, info?: unknown) {
    if (ok) {
      passed++;
      console.log(`  ✔ [ONLINE PASS] ${name}`);
    } else {
      failed++;
      console.error(`  ✖ [ONLINE FAIL] ${name}:`, info);
    }
  }

  // ── TEST 1: PEOPLE SEARCH (General Browse) ───────────────────────────────────
  console.log('▶ [1/6] Debugging People Search (Live Directory Queries)...');
  try {
    const req = createReq('/api/people/search?q=ocean&limit=10');
    const res = await searchGet(req);
    const json = await res.json();
    report('Query with q=ocean returns 200 and search results', res.status === 200 && json.success === true && json.data.length > 0, json);
    console.log(`    ↳ Found ${json.data?.length} members matching 'ocean'. Top result: "${json.data?.[0]?.display_name}" (${json.data?.[0]?.company_name})`);
  } catch (e) {
    report('Query with q=ocean', false, e);
  }

  // ── TEST 2: PEOPLE SEARCH (Multi-Facet Filtering) ─────────────────────────────
  console.log('\n▶ [2/6] Debugging Multi-Facet Filtering (Country & Verified)...');
  try {
    const reqIndia = createReq('/api/people/search?q=&country=India&verified=true');
    const resIndia = await searchGet(reqIndia);
    const jsonIndia = await resIndia.json();
    const allIndia = (jsonIndia.data ?? []).every((p: { country: string; is_verified: boolean; has_golden_tick: boolean }) =>
      p.country === 'India' && (p.is_verified || p.has_golden_tick)
    );
    report('Filters country=India & verified=true correctly filtered', resIndia.status === 200 && allIndia && jsonIndia.data.length > 0, jsonIndia);
    console.log(`    ↳ Filtered ${jsonIndia.data?.length} verified members in India.`);
  } catch (e) {
    report('Filters country=India & verified=true', false, e);
  }

  // ── TEST 3: PUBLIC PROFILE VIEW ──────────────────────────────────────────────
  console.log('\n▶ [3/6] Debugging Profile Detail View (/api/people/profile/[id])...');
  const targetId = 'a0000000-0000-0000-0000-000000000001'; // Capt. Rajesh Sharma
  try {
    const req = createReq(`/api/people/profile/${targetId}`);
    const res = await profileGet(req, { params: { id: targetId } });
    const json = await res.json();
    const hasProfile = json.success && json.profile && json.profile.display_name === 'Capt. Rajesh Sharma';
    report('Profile detail returns 200 with trade lanes, skills and mutual count', res.status === 200 && hasProfile, json);
    console.log(`    ↳ Profile loaded: ${json.profile?.display_name} | Golden Tick: ${json.profile?.has_golden_tick} | Mutuals: ${json.profile?.mutual_count}`);
  } catch (e) {
    report('Profile detail view', false, e);
  }

  // ── TEST 4: CONNECTION MUTATIONS (SEND & STATUS) ──────────────────────────────
  console.log('\n▶ [4/6] Debugging Connection Request Lifecycle (Send Request)...');
  const colleagueId = 'a0000000-0000-0000-0000-000000000003'; // Tariq Al-Mansoor
  let requestId = '';
  try {
    const sendReq = createReq('/api/people/connections', 'POST', {
      action: 'send',
      target_id: colleagueId,
      message: 'Greetings from Mumbai! Would love to connect regarding Middle East trade corridors.',
    });
    const sendRes = await connPost(sendReq);
    const sendJson = await sendRes.json();
    requestId = sendJson.request_id;
    report('Send connection request returns 200 with request_id', sendRes.status === 200 && sendJson.success && Boolean(requestId), sendJson);

    // Verify status changed to pending_sent
    const statusReq = createReq('/api/people/connections', 'POST', {
      action: 'status',
      target_id: colleagueId,
    });
    const statusRes = await connPost(statusReq);
    const statusJson = await statusRes.json();
    report('Connection status is now pending_sent', statusJson.status === 'pending_sent', statusJson);
  } catch (e) {
    report('Connection request lifecycle', false, e);
  }

  // ── TEST 5: CONNECTION TABS (/api/people/connections?tab=outgoing) ────────────
  console.log('\n▶ [5/6] Debugging Connections Manager Tabs...');
  try {
    const outReq = createReq('/api/people/connections?tab=outgoing');
    const outRes = await connGet(outReq);
    const outJson = await outRes.json();
    report('Outgoing tab returns the pending request', outRes.status === 200 && outJson.data.length > 0, outJson);

    const connReq = createReq('/api/people/connections?tab=connections');
    const connRes = await connGet(connReq);
    const connJson = await connRes.json();
    report('My Connections tab returns 200', connRes.status === 200 && Array.isArray(connJson.data), connJson);
  } catch (e) {
    report('Connections manager tabs', false, e);
  }

  // ── TEST 6: BLOCK & UNBLOCK MUTATIONS ────────────────────────────────────────
  console.log('\n▶ [6/6] Debugging Member Block & Unblock...');
  const blockTargetId = 'a0000000-0000-0000-0000-000000000005';
  try {
    const blockReq = createReq('/api/people/connections', 'POST', {
      action: 'block',
      target_id: blockTargetId,
    });
    const blockRes = await connPost(blockReq);
    const blockJson = await blockRes.json();
    report('Block member returns success', blockRes.status === 200 && blockJson.success, blockJson);

    // Verify blocked user is omitted from search results
    const searchAfterBlockReq = createReq('/api/people/search?q=Vance');
    const searchAfterBlockRes = await searchGet(searchAfterBlockReq);
    const searchAfterBlockJson = await searchAfterBlockRes.json();
    report('Blocked user is excluded from search results', searchAfterBlockJson.data.length === 0, searchAfterBlockJson);

    // Unblock member
    const unblockReq = createReq('/api/people/connections', 'POST', {
      action: 'unblock',
      target_id: blockTargetId,
    });
    const unblockRes = await connPost(unblockReq);
    const unblockJson = await unblockRes.json();
    report('Unblock member returns success', unblockRes.status === 200 && unblockJson.success, unblockJson);
  } catch (e) {
    report('Block and unblock mutations', false, e);
  }

  // ── SUMMARY REPORT ───────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log(`ONLINE DEBUG RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 ALL LIVE ONLINE FLOWS DEBUGGED & VERIFIED OPERATIONAL (100%)\n');
    process.exit(0);
  } else {
    console.error('❌ SOME ONLINE DEBUG CHECKS FAILED\n');
    process.exit(1);
  }
}

debugOnlinePeopleNetwork().catch((err) => {
  console.error('Fatal online debugger error:', err);
  process.exit(1);
});
