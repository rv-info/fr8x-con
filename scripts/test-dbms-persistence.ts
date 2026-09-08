import {
  getPersistedRates,
  savePersistedRate,
  deletePersistedRate,
  bulkSavePersistedRates,
  getPersistedPosts,
  savePersistedPost,
  deletePersistedPost,
} from '../lib/dbms/server-dbms';
import { RateItem, FeedPost } from '../lib/types';

async function runDbmsPersistenceTests() {
  console.log('\n======================================================');
  console.log('       FR8X DBMS PERSISTENCE & STORAGE AUDIT SUITE    ');
  console.log('======================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
      failed++;
    }
  }

  // TEST 1: Rate Creation & Persistence
  console.log('--- 1. Testing Rate Persistence in Server DBMS ---');
  const testRateId = `IRT-${Date.now()}`;
  const testRate: RateItem = {
    id: testRateId,
    carrier: 'Maersk Line',
    por: 'Nhava Sheva (INNSA)',
    pol: 'Nhava Sheva (INNSA)',
    pod: 'Rotterdam (NLRTM)',
    fpod: 'Rotterdam (NLRTM)',
    d20: 1650,
    h40: 2450,
    ft: '14 days',
    tt: '28 days',
    valid: '2026-12-31',
    rateType: 'Direct Spot',
    route: 'Direct Ocean',
    remark: 'Persistent DBMS test rate',
    sp: 'Atlas Logistics Pvt. Ltd.',
    ownerUid: 'u-arjun',
    isOwner: true,
    isSelfPosted: true,
    createdAt: new Date().toISOString(),
    status: 'active',
  };

  savePersistedRate(testRate);
  const loadedRates1 = getPersistedRates();
  const foundRate1 = loadedRates1.find((r) => r.id === testRateId);
  assert(!!foundRate1, `Newly created rate (${testRateId}) is persistently saved`);
  assert(foundRate1?.carrier === 'Maersk Line', 'Rate details (carrier: Maersk Line) match exactly');
  assert(foundRate1?.d20 === 1650 && foundRate1?.h40 === 2450, 'Rate amounts (20DV: $1650, 40HC: $2450) match exactly');

  // TEST 2: Refresh Simulation (re-reading from disk)
  console.log('\n--- 2. Testing Page Refresh Simulation ---');
  const simulatedRefreshRates = getPersistedRates();
  const foundOnRefresh = simulatedRefreshRates.find((r) => r.id === testRateId);
  assert(!!foundOnRefresh, 'Rate DOES NOT VANISH after simulated page refresh / cold start');

  // TEST 3: Rate Update Persistence
  console.log('\n--- 3. Testing Rate Update Persistence ---');
  const updatedRate: RateItem = {
    ...foundOnRefresh!,
    d20: 1700,
    h40: 2550,
    remark: 'Updated rate with revised bunker surcharge',
  };
  savePersistedRate(updatedRate);
  const reloadedAfterUpdate = getPersistedRates().find((r) => r.id === testRateId);
  assert(reloadedAfterUpdate?.d20 === 1700, 'Updated 20DV rate ($1700) persists');
  assert(reloadedAfterUpdate?.h40 === 2550, 'Updated 40HC rate ($2550) persists');

  // TEST 4: Bulk Save Persistence
  console.log('\n--- 4. Testing Bulk Rate Import Persistence ---');
  const bulkRates: RateItem[] = [
    {
      id: `IRT-BULK-1-${Date.now()}`,
      carrier: 'CMA CGM',
      sp: 'Atlas Logistics Pvt. Ltd.',
      por: 'Mundra (INMUN)',
      pol: 'Mundra (INMUN)',
      pod: 'Hamburg (DEHAM)',
      fpod: 'Hamburg (DEHAM)',
      d20: 1400,
      h40: 2200,
      ft: '14 days',
      tt: '25 days',
      valid: '2026-11-30',
      rateType: 'Direct Spot',
      route: 'Direct',
      remark: 'Bulk test rate 1',
      ownerUid: 'u-arjun',
      isOwner: true,
    },
    {
      id: `IRT-BULK-2-${Date.now()}`,
      carrier: 'Hapag-Lloyd',
      sp: 'Atlas Logistics Pvt. Ltd.',
      por: 'Chennai (INMAA)',
      pol: 'Chennai (INMAA)',
      pod: 'Antwerp (BEANR)',
      fpod: 'Antwerp (BEANR)',
      d20: 1550,
      h40: 2350,
      ft: '14 days',
      tt: '27 days',
      valid: '2026-11-30',
      rateType: 'Direct Spot',
      route: 'Direct',
      remark: 'Bulk test rate 2',
      ownerUid: 'u-arjun',
      isOwner: true,
    },
  ];
  bulkSavePersistedRates(bulkRates);
  const afterBulk = getPersistedRates();
  assert(afterBulk.some((r) => r.id === bulkRates[0].id), 'Bulk rate 1 persists across storage');
  assert(afterBulk.some((r) => r.id === bulkRates[1].id), 'Bulk rate 2 persists across storage');

  // TEST 5: Rate Deletion Persistence
  console.log('\n--- 5. Testing Rate Deletion Persistence ---');
  const deletedOk = deletePersistedRate(testRateId);
  assert(deletedOk, 'deletePersistedRate returns success');
  const afterDelete = getPersistedRates().find((r) => r.id === testRateId);
  assert(!afterDelete, 'Deleted rate is permanently removed from storage');

  // Clean up bulk rates
  deletePersistedRate(bulkRates[0].id);
  deletePersistedRate(bulkRates[1].id);

  // TEST 6: Feed Post Persistence
  console.log('\n--- 6. Testing Feed Post Persistence in Server DBMS ---');
  const testPostId = `post-${Date.now()}`;
  const testPost: FeedPost = {
    id: testPostId,
    authorUid: 'u-arjun',
    author: 'Arjun Mehta',
    authorRole: 'Freight Director · Mumbai',
    authorCompany: 'Atlas Logistics Pvt. Ltd.',
    time: 'Just now',
    text: 'Rate offer: Nhava Sheva to Rotterdam 20DV at USD $1650 valid till month end.',
    postType: 'rate_info',
    likes: 0,
    dis: 0,
    liked: false,
    disliked: false,
    isSaved: false,
    comments: [],
    createdAt: new Date().toISOString(),
    status: 'active',
  };
  savePersistedPost(testPost);
  const loadedPosts = getPersistedPosts();
  const foundPost = loadedPosts.find((p) => String(p.id) === testPostId);
  assert(!!foundPost, `Post (${testPostId}) is persistently saved`);

  // Simulate refresh for posts
  const postRefresh = getPersistedPosts().find((p) => String(p.id) === testPostId);
  assert(!!postRefresh, 'Post DOES NOT VANISH after simulated page refresh');

  // Clean up test post
  deletePersistedPost(testPostId);
  const afterPostDelete = getPersistedPosts().find((p) => String(p.id) === testPostId);
  assert(!afterPostDelete, 'Deleted post is removed from storage');

  console.log('\n======================================================');
  console.log(`TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDbmsPersistenceTests().catch((err) => {
  console.error('Test run failed with error:', err);
  process.exit(1);
});
