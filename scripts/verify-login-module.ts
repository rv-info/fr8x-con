import { sanitizeNextRedirect } from '../lib/auth-redirect';

let passed = 0;
let failed = 0;

function assert(cond: boolean, name: string, detail?: string) {
  if (cond) {
    console.log(`✅ PASS: ${name}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${name}${detail ? ` (${detail})` : ''}`);
    failed++;
  }
}

console.log('=== FR8X Login Redirect & Security Unit Verification ===\n');

assert(sanitizeNextRedirect('/feeds') === '/feeds', 'Valid route /feeds preserved');
assert(sanitizeNextRedirect('/shipments') === '/shipments', 'Valid route /shipments preserved');
assert(
  sanitizeNextRedirect('/reports?period=monthly') === '/reports?period=monthly',
  'Route with query string /reports?period=monthly preserved'
);
assert(
  sanitizeNextRedirect('/auctions/123/bid/confirm') === '/auctions/123/bid/confirm',
  'Deeply nested internal route preserved'
);
assert(
  sanitizeNextRedirect('%2Freports%3Fperiod%3Dmonthly') === '/reports?period=monthly',
  'URL-encoded route & query params decoded and preserved'
);
assert(
  sanitizeNextRedirect('https://evil.com/phish') === '/feeds',
  'External https:// URL rejected safely'
);
assert(
  sanitizeNextRedirect('http://evil.com') === '/feeds',
  'External http:// URL rejected safely'
);
assert(
  sanitizeNextRedirect('//evil.com') === '/feeds',
  'Protocol-relative //evil.com rejected safely'
);
assert(
  sanitizeNextRedirect('/\\evil.com') === '/feeds',
  'Backslash /\\evil.com rejected safely'
);
assert(
  sanitizeNextRedirect('javascript:alert(1)') === '/feeds',
  'javascript: scheme rejected safely'
);
assert(
  sanitizeNextRedirect('%ZZ%invalid') === '/feeds',
  'Malformed percent-encoding falls back safely'
);
assert(sanitizeNextRedirect('') === '/feeds', 'Empty string falls back to /feeds');
assert(sanitizeNextRedirect(null) === '/feeds', 'null falls back to /feeds');
assert(sanitizeNextRedirect(undefined) === '/feeds', 'undefined falls back to /feeds');
assert(sanitizeNextRedirect('/login?reason=expired') === '/feeds', 'Self-login redirect loop prevented');

console.log(`\n=== Result: ${passed} passed, ${failed} failed ===`);
if (failed > 0) process.exit(1);
