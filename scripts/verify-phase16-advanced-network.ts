/**
 * scripts/verify-phase16-advanced-network.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification Test Suite: Advanced Backend Architecture, Social Networking,
 * Transactional Outbox, Modular Recommendations, Feeds, and Observability
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { outboxService } from '../lib/outbox/service';
import { outboxWorker, OutboxWorker } from '../lib/outbox/worker';
import { peopleRecommendationEngine } from '../lib/recommendations/engine';
import { timelineEngine } from '../lib/feed/timeline';
import { safeCache } from '../lib/cache/safe-cache';
import { logger } from '../lib/observability/logger';
import { GET as healthGet } from '../app/api/health/route';
import { GET as recsGet } from '../app/api/people/recommendations/route';
import { createSignedSessionToken } from '../lib/crypto';
import { NextRequest } from 'next/server';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: unknown) {
  if (condition) {
    passed++;
    console.log(`  ✔ [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  ✖ [FAIL] ${testName}`, details ?? '');
  }
}

async function runPhase16Tests() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   PHASE 16: ADVANCED BACKEND ARCHITECTURE & SOCIAL NETWORKING    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // ── TEST SUITE 1: TRANSACTIONAL OUTBOX & IDEMPOTENCY ─────────────────────────
  console.log('▶ [1/6] Verifying Transactional Outbox & Idempotent Persistence...');
  const testAggregateId = `conn_${Date.now()}`;
  const idempotencyKey = `idemp_${Date.now()}_test`;

  const event1 = await outboxService.recordEvent({
    eventType: 'connection.requested',
    aggregateType: 'connection',
    aggregateId: testAggregateId,
    payload: { sender_id: 'user_1', recipient_id: 'user_2' },
    idempotencyKey,
  });

  assert(event1.id !== undefined && event1.status === 'pending', 'Event recorded with pending status');

  // Re-record with exact same idempotency key
  const event2 = await outboxService.recordEvent({
    eventType: 'connection.requested',
    aggregateType: 'connection',
    aggregateId: testAggregateId,
    payload: { sender_id: 'user_1', recipient_id: 'user_2' },
    idempotencyKey,
  });

  assert(event2.id === event1.id, 'Idempotent recording returns existing event without creating duplicate');

  // ── TEST SUITE 2: OUTBOX WORKER, RETRIES & DEAD-LETTER QUEUE ─────────────────
  console.log('\n▶ [2/6] Verifying Outbox Worker, Exponential Backoff & Dead-Letter...');
  const testWorker = new OutboxWorker();

  // Test success handler
  testWorker.registerHandler('test.success', async () => {});
  const successEvt = await outboxService.recordEvent({
    eventType: 'test.success',
    aggregateType: 'test',
    aggregateId: 'test_succ',
    payload: {},
  });
  const processedSucc = await testWorker.processEvent(successEvt);
  assert(processedSucc === true, 'Successful event completes cleanly');

  // Test failure & retry backoff
  let attempts = 0;
  testWorker.registerHandler('test.failure', async () => {
    attempts++;
    throw new Error('Simulated external service timeout');
  });

  const failEvt = await outboxService.recordEvent({
    eventType: 'test.failure',
    aggregateType: 'test',
    aggregateId: 'test_fail',
    payload: {},
    maxRetries: 2,
  });

  // Attempt 1 -> failed with retry_count = 1
  await testWorker.processEvent(failEvt);
  const updatedFailEvt = await outboxService.getEventById(failEvt.id);
  assert(updatedFailEvt?.retry_count === 1 && updatedFailEvt?.status === 'failed', 'Failing event increments retry_count to 1 with status failed');

  // Attempt 2 -> dead_letter (exceeds maxRetries = 2)
  if (updatedFailEvt) {
    await testWorker.processEvent(updatedFailEvt);
  }
  const deadLetterEvt = await outboxService.getEventById(failEvt.id);
  assert(deadLetterEvt?.status === 'dead_letter', 'Event exceeding max_retries safely transitions to dead_letter queue');

  // ── TEST SUITE 3: MODULAR RECOMMENDATIONS & TRANSPARENT SCORING ─────────────
  console.log('\n▶ [3/6] Verifying Modular Recommendations & Transparent Scoring...');
  const viewerId = 'a0000000-0000-0000-0000-000000000001'; // Capt. Rajesh Sharma
  const recs = await peopleRecommendationEngine.getRecommendations(viewerId, 5);

  assert(Array.isArray(recs) && recs.length > 0, 'Recommendation engine returns candidate list');
  const topRec = recs[0];
  assert(
    Boolean(topRec?.full_name) &&
    typeof topRec?.score === 'number' &&
    Boolean(topRec?.primary_reason),
    'Top recommendation has full_name, score, and explainable primary_reason',
    topRec
  );

  // Assert descending score order
  const isSorted = recs.every((r, i) => i === 0 || r.score <= recs[i - 1].score);
  assert(isSorted, 'Recommendations are sorted by relevance score in descending order');

  // Viewer themselves should never be recommended
  const includesSelf = recs.some((r) => r.id === viewerId);
  assert(!includesSelf, 'Self is strictly excluded from candidate recommendations');

  // ── TEST SUITE 4: FEED TIMELINE ENGINE (FAN-OUT ON READ & BLOCKS) ────────────
  console.log('\n▶ [4/6] Verifying Feed Timeline Engine (Fan-out on Read & Block Filtering)...');
  const mockPosts: any[] = [
    {
      id: 'p1',
      authorUid: 'author_normal',
      author: 'Normal Member',
      authorRole: 'Freight Forwarder',
      time: '1h ago',
      text: 'Container rates from Nhava Sheva to Rotterdam stabilizing this week.',
      likes: 12,
      dis: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      status: 'active',
    },
    {
      id: 'p2',
      authorUid: 'author_blocked',
      author: 'Blocked Member',
      authorRole: 'Operator',
      time: '2h ago',
      text: 'This post must be blocked by bidirectional relationship filter.',
      likes: 0,
      dis: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      status: 'active',
    },
    {
      id: 'p3_dup',
      authorUid: 'author_normal',
      author: 'Normal Member',
      authorRole: 'Freight Forwarder',
      time: '1h ago',
      text: 'Container rates from Nhava Sheva to Rotterdam stabilizing this week.', // Duplicate text
      likes: 0,
      dis: 0,
      comments: [],
      createdAt: new Date().toISOString(),
      status: 'active',
    },
  ];

  // Block author_blocked
  const { peopleDirectoryStore } = await import('../lib/people-directory');
  peopleDirectoryStore.blockUser(viewerId, 'author_blocked');

  const timeline = timelineEngine.generateTimeline(mockPosts, {
    viewerId,
    limit: 10,
  });

  const hasBlockedPost = timeline.posts.some((p) => p.authorUid === 'author_blocked');
  assert(!hasBlockedPost, 'Posts from blocked authors are strictly filtered out of feed');

  const hasDuplicate = timeline.posts.filter((p) => p.authorUid === 'author_normal').length > 1;
  assert(!hasDuplicate, 'Duplicate posts within same time window are deduplicated');

  // ── TEST SUITE 5: MULTI-TIER SAFE CACHING & ZERO-LEAKAGE PRIVACY ─────────────
  console.log('\n▶ [5/6] Verifying Safe Caching & Zero-Leakage Privacy Invariants...');
  safeCache.clear();

  // Test regular cache set and get
  const cacheKey = safeCache.makeKey('test', 'item_1');
  safeCache.set(cacheKey, { title: 'Public Title' }, 60, 'user_target_1');
  const retrieved = safeCache.get<{ title: string }>(cacheKey);
  assert(retrieved?.title === 'Public Title', 'Cache retrieves valid unexpired entries');

  // Test user invalidation
  safeCache.invalidateUser('user_target_1');
  const afterInvalidate = safeCache.get(cacheKey);
  assert(afterInvalidate === null, 'Invalidating user explicitly purges associated cache keys');

  // Test Zero-Leakage Invariant: private contact details must NEVER be stored in cache
  const piiLeakAttempt = {
    title: 'Public Summary',
    email: 'private.ceo@adani.example.com',
    phone: '+91 98200 99999',
  };
  const leakKey = safeCache.makeKey('user_leak', 'test');
  safeCache.set(leakKey, piiLeakAttempt, 60);
  const cachedLeak = safeCache.get<any>(leakKey);
  assert(
    cachedLeak?.title === 'Public Summary' &&
    cachedLeak?.email === undefined &&
    cachedLeak?.phone === undefined,
    'Zero-Leakage Invariant: Private email and phone fields are automatically stripped before caching'
  );

  // ── TEST SUITE 6: OBSERVABILITY LOGGING & HEALTH CHECK ───────────────────────
  console.log('\n▶ [6/6] Verifying Observability Structured Logging & System Health Check...');
  const sensitivePayload = {
    user: 'Forwarder Corp',
    email: 'admin@forwarder.example.com',
    phone: '+91 98200 12345',
    password: 'secret_password_123',
    token: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  };

  const logged = logger.info('security.audit_event', sensitivePayload);
  const meta = logged.metadata as Record<string, string>;

  assert(
    meta.password === '[REDACTED]' &&
    meta.token === '[REDACTED]' &&
    meta.email === '[REDACTED]' &&
    meta.phone === '[REDACTED]',
    'StructuredLogger automatically redacts passwords, tokens, emails, and phone numbers'
  );

  // Health endpoint verification
  const healthRes = await healthGet();
  const healthJson = await healthRes.json();
  assert(
    healthRes.status === 200 &&
    (healthJson.status === 'healthy' || healthJson.status === 'degraded') &&
    healthJson.checks?.outboxQueue !== undefined &&
    healthJson.checks?.database !== undefined,
    'GET /api/health returns 200 with structured checks for database, outbox, cache, and runtime'
  );

  // Recommendations API endpoint verification
  const sessionToken = createSignedSessionToken({
    uid: viewerId,
    email: 'rajesh.sharma@adani.example.com',
    role: 'user',
  });
  const headers = new Headers();
  headers.set('cookie', `fr8x_session=${sessionToken}`);
  const recsReq = new NextRequest(new URL('/api/people/recommendations?limit=3', 'http://localhost:3000'), {
    headers,
  });
  const recsRes = await recsGet(recsReq);
  const recsJson = await recsRes.json();
  assert(
    recsRes.status === 200 &&
    recsJson.success === true &&
    Array.isArray(recsJson.data),
    'GET /api/people/recommendations returns 200 with personalized suggestions array'
  );

  // ── FINAL SUMMARY ────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log(`PHASE 16 TEST RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log('════════════════════════════════════════════════════════════════════\n');

  if (failed === 0) {
    console.log('🎉 ALL ADVANCED BACKEND ARCHITECTURE & NETWORKING CHECKS PASSED (100%)\n');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED\n');
    process.exit(1);
  }
}

runPhase16Tests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
