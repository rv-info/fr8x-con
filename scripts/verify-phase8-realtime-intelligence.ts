/**
 * scripts/verify-phase8-realtime-intelligence.ts
 * Verification test suite for Phase 8: Real-Time Intelligence & Presence Architecture
 */

import {
  savePersistedPresence,
  getPersistedUserPresence,
  recordPersistedEvents,
  getPersistedEvents,
  savePersistedUserIntent,
  getPersistedUserIntent,
} from '../lib/dbms/server-dbms';
import { generateEventId, eventBus } from '../lib/intelligence/events';
import { presenceService } from '../lib/presence/presenceService';
import { UserPresenceState, IdempotentEvent, LogisticsIntent } from '../lib/types';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  FR8X PHASE 8: REAL-TIME INTELLIGENCE & PRESENCE VERIFICATION  ');
  console.log('================================================================\n');

  // TEST SUITE 1: Server-Side DBMS Presence Persistence
  console.log('─── TEST SUITE 1: Server DBMS Presence Persistence ───');
  const testUserId = `test-user-${Date.now()}`;
  const now = Date.now();
  const presencePayload: UserPresenceState = {
    userId: testUserId,
    status: 'active',
    lastHeartbeat: new Date(now).toISOString(),
    ttlExpiry: Math.floor(now / 1000) + 300,
    deviceType: 'desktop',
  };

  savePersistedPresence(presencePayload);
  const retrievedPresence = getPersistedUserPresence(testUserId);

  assert(
    retrievedPresence !== null && retrievedPresence.userId === testUserId,
    'Server DBMS stores and retrieves presence state for active user',
    JSON.stringify(retrievedPresence)
  );

  assert(
    retrievedPresence?.status === 'active',
    'Retrieved presence status matches saved status (active)',
    `Expected active, got ${retrievedPresence?.status}`
  );

  // Expired TTL check
  const expiredUserId = `test-expired-${Date.now()}`;
  const expiredPayload: UserPresenceState = {
    userId: expiredUserId,
    status: 'active',
    lastHeartbeat: new Date(now - 600_000).toISOString(),
    ttlExpiry: Math.floor(now / 1000) - 100, // Expired 100 seconds ago
    deviceType: 'desktop',
  };
  savePersistedPresence(expiredPayload);
  const retrievedExpired = getPersistedUserPresence(expiredUserId);

  assert(
    retrievedExpired?.status === 'away',
    'Expired presence automatically returns status "away" based on TTL',
    `Expected away, got ${retrievedExpired?.status}`
  );

  // TEST SUITE 2: Server-Side DBMS Telemetry & Idempotency
  console.log('\n─── TEST SUITE 2: Server DBMS Telemetry & Idempotent Events ───');
  const eventId1 = `evt_test_${Date.now()}_1`;
  const eventId2 = `evt_test_${Date.now()}_2`;

  const testEvents: IdempotentEvent[] = [
    {
      eventId: eventId1,
      eventType: 'rate_view',
      actorId: testUserId,
      targetId: 'rate_mock_001',
      targetType: 'rate',
      timestamp: new Date().toISOString(),
      sourceSurface: 'rates',
      correlationId: `corr_${Date.now()}`,
      rankingVersion: 'v2.1',
      metadata: { port: 'INNSA', tradeLane: 'INNSA-AEJEA' },
    },
    {
      eventId: eventId2,
      eventType: 'auction_bid',
      actorId: testUserId,
      targetId: 'auc_mock_001',
      targetType: 'auction',
      timestamp: new Date().toISOString(),
      sourceSurface: 'auctions',
      correlationId: `corr_${Date.now()}`,
      rankingVersion: 'v2.1',
      metadata: { port: 'INNSA', carrier: 'MSC' },
    },
  ];

  const insertedCount = recordPersistedEvents(testEvents);
  assert(insertedCount === 2, 'recordPersistedEvents successfully persists new events batch');

  // Idempotency check: re-inserting same events returns 0 new inserts
  const duplicateInserted = recordPersistedEvents(testEvents);
  assert(duplicateInserted === 0, 'recordPersistedEvents is idempotent (0 duplicates inserted)');

  const allPersisted = getPersistedEvents();
  const hasEvent1 = allPersisted.some((e) => e.eventId === eventId1);
  const hasEvent2 = allPersisted.some((e) => e.eventId === eventId2);
  assert(hasEvent1 && hasEvent2, 'Persisted events exist in getPersistedEvents list');

  // TEST SUITE 3: Server-Side Logistics Intent Persistence
  console.log('\n─── TEST SUITE 3: Logistics Intent Persistence ───');
  const intentPayload: LogisticsIntent = {
    userId: testUserId,
    recentSearchedPorts: ['INNSA', 'AEJEA'],
    viewedRates: ['rate_101'],
    activeAuctionRoutes: ['INNSA-AEJEA'],
    savedTradeLanes: ['INNSA-AEJEA'],
    followedCommodities: ['Textiles'],
    carrierSearches: ['Maersk', 'MSC'],
    lastActiveAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 7 * 86400 * 1000).toISOString(),
  };

  savePersistedUserIntent(intentPayload);
  const retrievedIntent = getPersistedUserIntent(testUserId);

  assert(
    retrievedIntent !== null && retrievedIntent.userId === testUserId,
    'Logistics intent is saved and retrieved from DBMS',
    JSON.stringify(retrievedIntent)
  );

  assert(
    Boolean(
      retrievedIntent?.recentSearchedPorts.includes('INNSA') &&
        retrievedIntent?.activeAuctionRoutes.includes('INNSA-AEJEA')
    ),
    'Intent preserves searched ports and auction routes'
  );

  // TEST SUITE 4: EventBus & Telemetry Logic
  console.log('\n─── TEST SUITE 4: EventBus & Telemetry Generator ───');
  const generatedId = generateEventId('usr_123', 'rate_view', 'rate_456', 5);
  const generatedIdSame = generateEventId('usr_123', 'rate_view', 'rate_456', 5);
  const generatedIdDiff = generateEventId('usr_123', 'profile_search', 'rate_456', 5);

  assert(
    generatedId === generatedIdSame,
    'generateEventId is deterministic within identical time buckets'
  );

  assert(
    generatedId !== generatedIdDiff,
    'generateEventId produces distinct hashes for differing event types'
  );

  const recorded = eventBus.recordEvent({
    eventType: 'rate_view',
    actorId: 'usr_789',
    targetId: 'target_789',
  });

  assert(
    recorded.eventId.startsWith('evt_'),
    'EventBus.recordEvent generates compliant event with eventId prefix "evt_"'
  );

  // TEST SUITE 5: PresenceService Client Interface & Invariants
  console.log('\n─── TEST SUITE 5: PresenceService Lifecycle & Contract ───');
  assert(
    typeof presenceService.initialize === 'function',
    'presenceService exposes initialize() method'
  );
  assert(
    typeof presenceService.getStatus === 'function',
    'presenceService exposes getStatus() method'
  );
  assert(
    typeof presenceService.setStatus === 'function',
    'presenceService exposes setStatus() method'
  );
  assert(
    typeof presenceService.subscribe === 'function',
    'presenceService exposes subscribe() method'
  );
  assert(
    typeof presenceService.cleanup === 'function',
    'presenceService exposes cleanup() method'
  );
  assert(
    typeof presenceService.getContactPresence === 'function',
    'presenceService exposes getContactPresence() method'
  );

  // Verify subscription listener works
  let subscribedStatus = '';
  const unsub = presenceService.subscribe((s) => {
    subscribedStatus = s;
  });
  assert(
    subscribedStatus === presenceService.getStatus(),
    'presenceService subscriber immediately receives initial status'
  );
  unsub();

  console.log('\n================================================================');
  console.log(`  PHASE 8 VERIFICATION COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
  console.log('================================================================\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during Phase 8 test execution:', err);
  process.exit(1);
});
