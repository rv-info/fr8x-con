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

  // ── TEST 1: PEOPLE SEARCH (General Browse & Contract Validation) ─────────────
  console.log('▶ [1/8] Debugging People Search (Live Directory Queries & Contract)...');
  try {
    const req = createReq('/api/people/search?q=ocean&limit=10');
    const res = await searchGet(req);
    const json = await res.json();
    const hasCanonicalShape =
      Array.isArray(json.data) &&
      json.pagination !== undefined &&
      json.data.length > 0 &&
      json.data[0].full_name !== undefined &&
      json.data[0].headline !== undefined &&
      json.data[0].company !== undefined &&
      json.data[0].location !== undefined &&
      (json.data[0].connection_status === 'not_connected' || json.data[0].connection_status === 'none');

    report('Query with q=ocean returns 200 and standard contract (data, pagination, canonical aliases)', res.status === 200 && json.success === true && hasCanonicalShape, json);
    console.log(`    ↳ Found ${json.data?.length} members matching 'ocean'. Top result: "${json.data?.[0]?.full_name}" (${json.data?.[0]?.company})`);
  } catch (e) {
    report('Query with q=ocean', false, e);
  }

  // ── TEST 2: UNIVERSAL DISCOVERY (Browse with empty query) ───────────────────
  console.log('\n▶ [2/8] Debugging Universal Discovery (Empty Query Directory Browse)...');
  try {
    const browseReq = createReq('/api/people/search');
    const browseRes = await searchGet(browseReq);
    const browseJson = await browseRes.json();
    const hasBrowseResults = browseRes.status === 200 && browseJson.success === true && Array.isArray(browseJson.data) && browseJson.data.length > 0;
    report('Empty search returns 200 with directory members (no 400 error)', hasBrowseResults, browseJson);
    console.log(`    ↳ Universal discovery browse returned ${browseJson.data?.length} members.`);
  } catch (e) {
    report('Universal discovery browse', false, e);
  }

  // ── TEST 3: PEOPLE SEARCH (Multi-Facet Filtering) ─────────────────────────────
  console.log('\n▶ [3/8] Debugging Multi-Facet Filtering (Country & Verified)...');
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

  // ── TEST 4: PUBLIC PROFILE VIEW & CONTACT PRIVACY ────────────────────────────
  console.log('\n▶ [4/8] Debugging Profile Detail & Contact Privacy (/api/people/profile/[id])...');
  const targetId = 'a0000000-0000-0000-0000-000000000001'; // Capt. Rajesh Sharma
  try {
    const req = createReq(`/api/people/profile/${targetId}`);
    const res = await profileGet(req, { params: { id: targetId } });
    const json = await res.json();
    const hasProfile = json.success && json.profile && (json.profile.full_name === 'Capt. Rajesh Sharma' || json.profile.display_name === 'Capt. Rajesh Sharma');
    // Privacy verification: stranger viewing must NOT expose private email/phone
    const contactHidden = json.profile?.email === undefined && json.profile?.phone === undefined;
    report('Profile detail returns 200 and protects private contact fields (email/phone hidden)', res.status === 200 && hasProfile && contactHidden, json);
    console.log(`    ↳ Profile loaded: ${json.profile?.full_name ?? json.profile?.display_name} | Contact details shielded: ${contactHidden}`);
  } catch (e) {
    report('Profile detail view', false, e);
  }

  // ── TEST 5: CONNECTION MUTATIONS (SEND & STATUS) ──────────────────────────────
  console.log('\n▶ [5/8] Debugging Connection Request Lifecycle (Send Request)...');
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

  // ── TEST 6: CONNECTION TABS (/api/people/connections?tab=outgoing) ────────────
  console.log('\n▶ [6/8] Debugging Connections Manager Tabs...');
  try {
    const outReq = createReq('/api/people/connections?tab=outgoing');
    const outRes = await connGet(outReq);
    const outJson = await outRes.json();
    const hasCanonicalOutgoing = outJson.data.length > 0 && outJson.data[0].profiles?.full_name !== undefined;
    report('Outgoing tab returns pending request with canonical profile fields', outRes.status === 200 && hasCanonicalOutgoing, outJson);

    const connReq = createReq('/api/people/connections?tab=connections');
    const connRes = await connGet(connReq);
    const connJson = await connRes.json();
    report('My Connections tab returns 200 with array', connRes.status === 200 && Array.isArray(connJson.data), connJson);
  } catch (e) {
    report('Connections manager tabs', false, e);
  }

  // ── TEST 7: BLOCK & UNBLOCK MUTATIONS ────────────────────────────────────────
  console.log('\n▶ [7/8] Debugging Member Block & Unblock...');
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

  // ── TEST 8: EXISTING USER DISCOVERY SYNC ─────────────────────────────────────
  console.log('\n▶ [8/8] Debugging Universal Discovery for Existing Platform Users...');
  try {
    const { registerMember } = await import('../lib/people-directory');
    const existingPlatformUserId = 'b1000000-0000-0000-0000-000000000042';
    registerMember({
      id: existingPlatformUserId,
      first_name: 'Elena',
      last_name: 'Rostova',
      display_name: 'Elena Rostova',
      full_name: 'Elena Rostova',
      headline: 'Global Air Cargo Director · Baltic Forwarding',
      designation: 'Global Air Cargo Director',
      company: 'Baltic Forwarding',
      company_name: 'Baltic Forwarding',
      location: 'Hamburg, Germany',
      city: 'Hamburg',
      country: 'Germany',
      skills: ['Air Charter', 'Pharma Logistics', 'Cold Chain'],
      specializations: ['Air Freight', 'IATA CEIV'],
      key_trade_lanes: ['FRA-JFK', 'HAM-SIN'],
      is_verified: true,
      has_golden_tick: true,
      connection_status: 'not_connected',
    });

    const discoverReq = createReq('/api/people/search?q=Rostova');
    const discoverRes = await searchGet(discoverReq);
    const discoverJson = await discoverRes.json();
    const foundElena = (discoverJson.data ?? []).some((m: { id: string; full_name?: string }) =>
      m.id === existingPlatformUserId || m.full_name === 'Elena Rostova'
    );
    report('Existing registered member is discoverable via search without connecting first', discoverRes.status === 200 && foundElena, discoverJson);
    console.log(`    ↳ Verified Elena Rostova discovery in real-time directory.`);
  } catch (e) {
    report('Existing user discovery sync', false, e);
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
