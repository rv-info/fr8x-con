import { networkSpeedManager } from '../lib/network/NetworkSpeedManager';
import fs from 'fs';
import path from 'path';

function runTests() {
  console.log('=== Running FR8X HyperSpeed & Low-Bandwidth Verification Suite ===\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: any, testName: string, extra?: string) {
    if (Boolean(condition)) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName} ${extra || ''}`);
      failed++;
    }
  }

  // 1. Check default speed tier
  const tier = networkSpeedManager.getSpeedTier();
  assert(
    tier === 'hyper' || tier === 'adaptive' || tier === 'saver' || tier === 'offline',
    'NetworkSpeedManager returns valid speed tier',
    `Tier: ${tier}`
  );

  // 2. Check adaptive batch sizing
  const batchSize = networkSpeedManager.getRecommendedBatchSize();
  assert(
    batchSize >= 12 && batchSize <= 50,
    'Recommended batch size is adapted for bandwidth preservation',
    `Batch: ${batchSize}`
  );

  // 3. Queue offline action
  const action = networkSpeedManager.queueAction(
    'like_post',
    { postId: 'post-test-101', liked: true, likes: 5 },
    'u-arjun'
  );
  assert(
    Boolean(action && action.id.startsWith('act-') && action.actionType === 'like_post'),
    'Queue low-risk action in offline outbox'
  );

  // 4. Inspect outbox queue
  const outbox = networkSpeedManager.getOutbox();
  const found = outbox.find((a) => a.id === action.id);
  assert(Boolean(found), 'Queued action is retrievable from offline outbox');

  // 5. Local bookmark toggling
  const isSaved1 = networkSpeedManager.toggleBookmarkLocally('post-test-101');
  assert(isSaved1 === true, 'Local bookmark toggle creates saved state in 0ms');
  const isSaved2 = networkSpeedManager.toggleBookmarkLocally('post-test-101');
  assert(isSaved2 === false, 'Local bookmark toggle removes saved state in 0ms');

  // 6. Service worker file existence & syntax check
  const swPath = path.join(process.cwd(), 'public', 'sw.js');
  const swExists = fs.existsSync(swPath);
  assert(swExists, 'PWA Service Worker file exists at public/sw.js');
  if (swExists) {
    const swContent = fs.readFileSync(swPath, 'utf8');
    assert(
      swContent.includes('CACHE_NAME') &&
        swContent.includes('stale-while-revalidate') ||
        swContent.includes('caches.match'),
      'Service Worker contains static asset & navigation caching strategies'
    );
  }

  // 7. TopBar Network Status Pill integration check
  const topBarPath = path.join(process.cwd(), 'components', 'layout', 'TopBar.tsx');
  const topBarContent = fs.readFileSync(topBarPath, 'utf8');
  assert(
    topBarContent.includes('NetworkStatusPill'),
    'TopBar renders non-intrusive NetworkStatusPill component'
  );

  // 8. AppShell NetworkProvider integration check
  const appShellPath = path.join(process.cwd(), 'components', 'layout', 'AppShell.tsx');
  const appShellContent = fs.readFileSync(appShellPath, 'utf8');
  assert(
    appShellContent.includes('NetworkProvider') &&
      appShellContent.includes('serviceWorker.register'),
    'AppShell wraps NetworkProvider and registers service worker'
  );

  console.log(`\n=== Verification Complete: ${passed} passed, ${failed} failed ===`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
