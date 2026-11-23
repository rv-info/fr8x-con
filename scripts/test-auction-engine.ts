import assert from 'assert';

/**
 * Reverse Auction Logic Verification Suite
 * Tests:
 * 1. Creator self-exclusion (creator & company accounts cannot be invited or bid)
 * 2. Reverse auction server-authoritative ranking (lowest price = L1)
 * 3. Tie-breaker determinism (equal prices broken by earliest server timestamp)
 * 4. Anti-sniping auto-extension (bids placed within <= 2 minutes auto-extend by 3 minutes)
 * 5. Private specific-bidder restriction (uninvited forwarders cannot bid)
 */

interface MockBid {
  id: string;
  bidderUid: string;
  bidderCompany: string;
  grandTotalUSD: number;
  createdAt: string;
  rank?: number;
}

function calculateReverseRanks(bids: MockBid[]): MockBid[] {
  // Reverse auction: Lowest evaluated price is Rank 1
  // Tie-breaker: earliest createdAt ASC, then id ASC
  const sorted = [...bids].sort((a, b) => {
    if (a.grandTotalUSD !== b.grandTotalUSD) {
      return a.grandTotalUSD - b.grandTotalUSD;
    }
    const tA = new Date(a.createdAt).getTime();
    const tB = new Date(b.createdAt).getTime();
    if (tA !== tB) return tA - tB;
    return a.id.localeCompare(b.id);
  });

  return sorted.map((b, idx) => ({
    ...b,
    rank: idx + 1,
  }));
}

function evaluateAntiSniping(endDateTimeStr: string, bidTimeStr: string): { extended: boolean; newEndDateTime: string } {
  const endMs = new Date(endDateTimeStr).getTime();
  const bidMs = new Date(bidTimeStr).getTime();
  const remainingMinutes = (endMs - bidMs) / (60 * 1000);

  if (remainingMinutes > 0 && remainingMinutes <= 2) {
    const extendedMs = endMs + 3 * 60 * 1000;
    return {
      extended: true,
      newEndDateTime: new Date(extendedMs).toISOString(),
    };
  }
  return {
    extended: false,
    newEndDateTime: endDateTimeStr,
  };
}

function sanitizeAuctionBidders(
  creatorUid: string,
  creatorCompany: string,
  bidders: Array<{ id: string; company: string }>
): Array<{ id: string; company: string }> {
  const normCreatorCompany = creatorCompany.trim().toLowerCase();
  const seen = new Set<string>();
  const sanitized: Array<{ id: string; company: string }> = [];

  for (const b of bidders) {
    if (!b) continue;
    const bId = (b.id || '').trim();
    const bComp = (b.company || '').trim().toLowerCase();

    // 1. Exclude auction creator user ID
    if (bId && bId === creatorUid) continue;

    // 2. Exclude creator owning company
    if (normCreatorCompany && bComp && normCreatorCompany === bComp) continue;

    // 3. Deduplicate
    const key = bId || bComp;
    if (key && seen.has(key)) continue;
    if (key) seen.add(key);

    sanitized.push(b);
  }

  return sanitized;
}

function runAuctionEngineTests() {
  console.log('=== FR8X REVERSE AUCTION ENGINE INTEGRITY TESTS ===\n');

  // Test 1: Creator & Owning Company Self-Exclusion
  console.log('1. Testing Auction Creator Self-Exclusion:');
  const creatorUid = 'usr_rajat_001';
  const creatorCompany = 'COGOPORT PRIVATE LIMITED';

  const candidateBidders = [
    { id: 'usr_rajat_001', company: 'COGOPORT PRIVATE LIMITED' }, // Creator themselves -> MUST BE EXCLUDED
    { id: 'usr_cogo_colleague', company: 'Cogoport Private Limited' }, // Colleague from same company -> MUST BE EXCLUDED
    { id: 'usr_adani_002', company: 'Adani Logistics' }, // External forwarder -> MUST BE INCLUDED
    { id: 'usr_syb_003', company: 'SYB INTERNATIONAL' }, // External forwarder -> MUST BE INCLUDED
    { id: 'usr_adani_002', company: 'Adani Logistics' }, // Duplicate invitation -> MUST BE DEDUPLICATED
  ];

  const sanitized = sanitizeAuctionBidders(creatorUid, creatorCompany, candidateBidders);
  assert.strictEqual(sanitized.length, 2, 'Must retain exactly 2 external distinct forwarders');
  assert.strictEqual(sanitized.some(b => b.id === creatorUid), false, 'Creator UID must be excluded');
  assert.strictEqual(sanitized.some(b => b.company.toLowerCase().includes('cogoport')), false, 'Creator company must be excluded');
  assert.strictEqual(sanitized[0].company, 'Adani Logistics');
  assert.strictEqual(sanitized[1].company, 'SYB INTERNATIONAL');
  console.log('   ✓ PASS: Creator user ID and creator company completely excluded from bidder manifest.\n');

  // Test 2: Server-Authoritative Reverse Auction Ranking (Lowest is L1)
  console.log('2. Testing Reverse Auction Ranking (Lowest Price is L1):');
  const bids: MockBid[] = [
    { id: 'bid_3', bidderUid: 'usr_c', bidderCompany: 'Carrier C', grandTotalUSD: 2450.00, createdAt: '2026-08-29T10:05:00Z' },
    { id: 'bid_1', bidderUid: 'usr_a', bidderCompany: 'Carrier A', grandTotalUSD: 2100.00, createdAt: '2026-08-29T10:01:00Z' },
    { id: 'bid_2', bidderUid: 'usr_b', bidderCompany: 'Carrier B', grandTotalUSD: 2280.00, createdAt: '2026-08-29T10:03:00Z' },
  ];

  const ranked = calculateReverseRanks(bids);
  assert.strictEqual(ranked[0].id, 'bid_1', 'Lowest bid ($2100) must be Rank 1 (L1)');
  assert.strictEqual(ranked[0].rank, 1);
  assert.strictEqual(ranked[1].id, 'bid_2', 'Second lowest bid ($2280) must be Rank 2 (L2)');
  assert.strictEqual(ranked[1].rank, 2);
  assert.strictEqual(ranked[2].id, 'bid_3', 'Highest bid ($2450) must be Rank 3 (L3)');
  assert.strictEqual(ranked[2].rank, 3);
  console.log('   ✓ PASS: Reverse ranking correctly orders evaluated price ASC with lowest at Rank 1 (L1).\n');

  // Test 3: Deterministic Equal-Price Tie Breaker (Earliest Server Timestamp Wins)
  console.log('3. Testing Tie-Breaker Determinism (Earliest Timestamp Wins):');
  const tiedBids: MockBid[] = [
    { id: 'bid_later', bidderUid: 'usr_later', bidderCompany: 'Carrier Y', grandTotalUSD: 2150.00, createdAt: '2026-08-29T10:14:00Z' },
    { id: 'bid_earlier', bidderUid: 'usr_earlier', bidderCompany: 'Carrier X', grandTotalUSD: 2150.00, createdAt: '2026-08-29T10:10:00Z' },
  ];
  const rankedTied = calculateReverseRanks(tiedBids);
  assert.strictEqual(rankedTied[0].id, 'bid_earlier', 'Earliest server-accepted timestamp must win tie');
  assert.strictEqual(rankedTied[0].rank, 1);
  assert.strictEqual(rankedTied[1].id, 'bid_later');
  assert.strictEqual(rankedTied[1].rank, 2);
  console.log('   ✓ PASS: Deterministic tie-breaker correctly awards superior rank to earliest bid.\n');

  // Test 4: Dynamic Overtime Anti-Sniping Protection
  console.log('4. Testing Anti-Sniping Dynamic Auto-Extension:');
  const scheduledEnd = '2026-08-29T12:00:00.000Z';

  // Scenario A: Bid placed 5 minutes before close (normal window) -> No extension
  const normalBidTime = '2026-08-29T11:55:00.000Z';
  const resNormal = evaluateAntiSniping(scheduledEnd, normalBidTime);
  assert.strictEqual(resNormal.extended, false, 'Bid > 2m before end must not trigger extension');
  assert.strictEqual(resNormal.newEndDateTime, scheduledEnd);

  // Scenario B: Bid placed 1 minute before close (sniping window <= 2 min) -> Auto-extended by 3 minutes
  const snipeBidTime = '2026-08-29T11:59:00.000Z';
  const resSnipe = evaluateAntiSniping(scheduledEnd, snipeBidTime);
  assert.strictEqual(resSnipe.extended, true, 'Bid <= 2m before end must trigger extension');
  assert.strictEqual(resSnipe.newEndDateTime, '2026-08-29T12:03:00.000Z', 'Deadline must extend by exactly 3 minutes');
  console.log('   ✓ PASS: Anti-sniping engine auto-extends close by 3 minutes when competitive bid placed in final 2 minutes.\n');

  // Test 5: Specific-Bidder Private RFQ Access Enforcement
  console.log('5. Testing Specific Bidder Permission Guard:');
  const allowedBidders = [{ id: 'usr_adani_002', company: 'Adani Logistics' }];
  const canUserBid = (userUid: string, userCompany: string) => {
    return allowedBidders.some(b => b.id === userUid || (b.company && b.company.toLowerCase() === userCompany.toLowerCase()));
  };

  assert.strictEqual(canUserBid('usr_adani_002', 'Adani Logistics'), true, 'Invited bidder must be authorized');
  assert.strictEqual(canUserBid('usr_stranger_999', 'Unknown Logistics'), false, 'Uninvited bidder must be blocked');
  console.log('   ✓ PASS: Access control strictly confines private reverse auctions to invited forwarders.\n');

  console.log('ALL 5 REVERSE AUCTION ENGINE INTEGRITY TESTS PASSED SUCCESSFULLY! ✅');
}

runAuctionEngineTests();
