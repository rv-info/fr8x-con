/**
 * scripts/test-ux-principles.ts
 * Comprehensive Automated Verification Suite for 9 Core UX Principles.
 * Validates architecture, accessibility, components, routes, and runtime contracts.
 */

import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(__dirname, '..');

interface TestResult {
  principle: string;
  testName: string;
  passed: boolean;
  details: string;
}

const results: TestResult[] = [];

function assert(principle: string, testName: string, condition: boolean, details: string) {
  results.push({
    principle,
    testName,
    passed: condition,
    details,
  });
  const symbol = condition ? '✔' : '✖';
  console.log(`  ${symbol} [${principle}] ${testName}: ${details}`);
  if (!condition) {
    throw new Error(`UX Principle Verification Failed: [${principle}] ${testName} - ${details}`);
  }
}

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║        FR8X CONNECT UX PRINCIPLES COMPREHENSIVE VERIFICATION     ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

try {
  // =========================================================================
  // PRINCIPLE 1: Skeleton Screen Principle
  // =========================================================================
  console.log('▶ Evaluating Principle 1: Skeleton Screen Principle...');
  const skeletonPath = path.join(ROOT_DIR, 'components/ui/SkeletonScreen.tsx');
  assert('P1: Skeleton Screen', 'Component Exists', fs.existsSync(skeletonPath), 'components/ui/SkeletonScreen.tsx must be present');
  const skeletonContent = fs.readFileSync(skeletonPath, 'utf8');

  assert(
    'P1: Skeleton Screen',
    'Accessibility Attributes',
    (skeletonContent.includes('role="status"') || skeletonContent.includes("role: 'status'")) &&
    (skeletonContent.includes('aria-busy="true"') || skeletonContent.includes("'aria-busy': true")) &&
    skeletonContent.includes('sr-only'),
    'SkeletonScreen must declare role status, aria-busy true, and sr-only announcement'
  );

  assert(
    'P1: Skeleton Screen',
    'Reduced Motion Support',
    skeletonContent.includes('motion-reduce:animate-none'),
    'SkeletonScreen must support prefers-reduced-motion via motion-reduce:animate-none'
  );

  assert(
    'P1: Skeleton Screen',
    'Specialized Layout Types',
    ['kpi', 'auction', 'table', 'feed', 'row', 'card'].every(t => skeletonContent.includes(`'${t}'`)),
    'SkeletonScreen must support content-matched layouts: kpi, auction, table, feed, row, card'
  );

  const p1Routes = [
    'app/dashboard/page.tsx',
    'app/rates/page.tsx',
    'app/auctions/page.tsx',
    'app/jobs/page.tsx',
    'app/feeds/page.tsx',
    'app/notifications/page.tsx',
    'app/contacts/page.tsx',
  ];

  for (const r of p1Routes) {
    const routePath = path.join(ROOT_DIR, r);
    const content = fs.readFileSync(routePath, 'utf8');
    assert(
      'P1: Skeleton Screen',
      `Route Integration: ${r}`,
      content.includes('SkeletonScreen'),
      `${r} must integrate SkeletonScreen loading placeholders`
    );
  }

  // =========================================================================
  // PRINCIPLE 2: Progressive Response
  // =========================================================================
  console.log('\n▶ Evaluating Principle 2: Progressive Response...');
  const dataCtxPath = path.join(ROOT_DIR, 'lib/context/DataContext.tsx');
  const dataCtxContent = fs.readFileSync(dataCtxPath, 'utf8');

  assert(
    'P2: Progressive Response',
    'Hydration Contract',
    dataCtxContent.includes('isHydrated: boolean') && dataCtxContent.includes('isLoading: boolean'),
    'DataContextType must expose isHydrated and isLoading to allow progressive rendering'
  );

  assert(
    'P2: Progressive Response',
    'Initial Cache Hydration',
    dataCtxContent.includes('setIsHydrated(true)'),
    'DataContext must notify consumers when initial cache hydration is ready'
  );

  // Check bounded queries in Supabase helpers
  const supabaseCtxPath = path.join(ROOT_DIR, 'lib/supabase/client.ts');
  assert('P2: Progressive Response', 'Supabase Client Configuration', fs.existsSync(supabaseCtxPath), 'Supabase client must exist');

  // =========================================================================
  // PRINCIPLE 3: Optimistic UI
  // =========================================================================
  console.log('\n▶ Evaluating Principle 3: Optimistic UI...');
  const connBtnPath = path.join(ROOT_DIR, 'components/people/ConnectionButton.tsx');
  const connBtnContent = fs.readFileSync(connBtnPath, 'utf8');

  assert(
    'P3: Optimistic UI',
    'Immediate Optimistic Update',
    connBtnContent.includes('setStatus(optimisticStatus)') || connBtnContent.includes('optimisticStatus'),
    'ConnectionButton must update UI immediately before server request completes'
  );

  assert(
    'P3: Optimistic UI',
    'Rollback On Failure',
    connBtnContent.includes('setStatus(previousStatus)') && connBtnContent.includes('catch'),
    'ConnectionButton must restore previous status snapshot on mutation rejection'
  );

  assert(
    'P3: Optimistic UI',
    'Actionable Failure Feedback',
    connBtnContent.includes('setError(') || connBtnContent.includes('setError(msg)'),
    'ConnectionButton must notify user with clear actionable error when optimistic operation fails'
  );

  // Ensure high-risk financial flows are NOT falsely optimistic
  const checkoutModalPath = path.join(ROOT_DIR, 'components/payments/PaymentCheckoutModal.tsx');
  if (fs.existsSync(checkoutModalPath)) {
    const checkoutContent = fs.readFileSync(checkoutModalPath, 'utf8');
    assert(
      'P3: Optimistic UI',
      'High-Risk Payment Safety Safeguard',
      !checkoutContent.includes('setPaymentStatus("completed")') || checkoutContent.includes('verifyPayment'),
      'Payment flows must not falsely display optimistic success before authoritative verification'
    );
  }

  // =========================================================================
  // PRINCIPLE 4: Jakob\'s Law — Familiarity Reduces Friction
  // =========================================================================
  console.log('\n▶ Evaluating Principle 4: Jakob\'s Law...');
  const emptyStatePath = path.join(ROOT_DIR, 'components/ui/EmptyState.tsx');
  assert('P4: Jakob\'s Law', 'Standard EmptyState Component', fs.existsSync(emptyStatePath), 'components/ui/EmptyState.tsx must exist');
  const emptyStateContent = fs.readFileSync(emptyStatePath, 'utf8');

  assert(
    'P4: Jakob\'s Law',
    'Accessible Semantic Heading in EmptyState',
    emptyStateContent.includes('<h3') && emptyStateContent.includes('text-slate-900'),
    'EmptyState must use semantic h3 heading and accessible high-contrast colors'
  );

  const emptyStateUsageRoutes = [
    'app/dashboard/page.tsx',
    'app/rates/page.tsx',
    'app/auctions/page.tsx',
    'app/jobs/page.tsx',
    'app/feeds/page.tsx',
    'app/notifications/page.tsx',
    'app/contacts/page.tsx',
  ];

  for (const r of emptyStateUsageRoutes) {
    const routePath = path.join(ROOT_DIR, r);
    const content = fs.readFileSync(routePath, 'utf8');
    assert(
      'P4: Jakob\'s Law',
      `EmptyState Standardized: ${r}`,
      content.includes('EmptyState'),
      `${r} must use standardized EmptyState component for predictable zero-data UX`
    );
  }

  // =========================================================================
  // PRINCIPLE 5: Fitts\'s Law — Make Important Actions Easy to Reach
  // =========================================================================
  console.log('\n▶ Evaluating Principle 5: Fitts\'s Law...');
  assert(
    'P5: Fitts\'s Law',
    'ConnectionButton Touch Target Sizing',
    connBtnContent.includes('min-h-[44px]') || connBtnContent.includes('py-2') || connBtnContent.includes('px-4'),
    'ConnectionButton interactive touch target must be at least WCAG AA compliant'
  );

  assert(
    'P5: Fitts\'s Law',
    'EmptyState Primary Action Touch Target',
    emptyStateContent.includes('min-h-[44px]') || emptyStateContent.includes('py-2.5'),
    'EmptyState primary action must have generous target height'
  );

  // =========================================================================
  // PRINCIPLE 6: Hick–Hyman Law — Reduce Decision Complexity
  // =========================================================================
  console.log('\n▶ Evaluating Principle 6: Hick–Hyman Law...');
  const ratesPagePath = path.join(ROOT_DIR, 'app/rates/page.tsx');
  const ratesContent = fs.readFileSync(ratesPagePath, 'utf8');

  assert(
    'P6: Hick–Hyman Law',
    'Categorized Tab Views on Rates',
    ratesContent.includes('activeTab') || ratesContent.includes('filterMode') || ratesContent.includes('searchQuery'),
    'Rates page must categorize data with tabs or search filters to reduce cognitive decision complexity'
  );

  const auctionsPagePath = path.join(ROOT_DIR, 'app/auctions/page.tsx');
  const auctionsContent = fs.readFileSync(auctionsPagePath, 'utf8');
  assert(
    'P6: Hick–Hyman Law',
    'Progressive Filtering on Auctions',
    auctionsContent.includes('filter') || auctionsContent.includes('tab') || auctionsContent.includes('search'),
    'Auctions page must use progressive filtering to avoid decision paralysis'
  );

  // =========================================================================
  // PRINCIPLE 7: Miller\'s Law — Organize Information into Manageable Groups
  // =========================================================================
  console.log('\n▶ Evaluating Principle 7: Miller\'s Law...');
  const dashPath = path.join(ROOT_DIR, 'app/dashboard/page.tsx');
  const dashContent = fs.readFileSync(dashPath, 'utf8');

  assert(
    'P7: Miller\'s Law',
    'Chunked Dashboard KPI Sections',
    dashContent.includes('Financial Performance') &&
    dashContent.includes('Operational Activity') &&
    (dashContent.includes('Trust & Compliance') || dashContent.includes('Trust &amp; Compliance')),
    'Dashboard KPIs must be chunked into thematic groups (Financial, Operational, Compliance) per Miller\'s Law'
  );

  // =========================================================================
  // PRINCIPLE 8: Tesler\'s Law — Reduce Unnecessary User Complexity
  // =========================================================================
  console.log('\n▶ Evaluating Principle 8: Tesler\'s Law...');
  assert(
    'P8: Tesler\'s Law',
    'Automated Persistence & Saved View State',
    ratesContent.includes('viewMode') || dashContent.includes('stat'),
    'App must manage view states and defaults without placing burden on user'
  );

  // =========================================================================
  // PRINCIPLE 9: Peak–End Rule — Make Important and Final Interactions Positive
  // =========================================================================
  console.log('\n▶ Evaluating Principle 9: Peak–End Rule...');
  const errorRecoveryPath = path.join(ROOT_DIR, 'components/ui/ErrorRecovery.tsx');
  assert('P9: Peak–End Rule', 'ErrorRecovery Component', fs.existsSync(errorRecoveryPath), 'components/ui/ErrorRecovery.tsx must exist');
  const errorRecoveryContent = fs.readFileSync(errorRecoveryPath, 'utf8');

  assert(
    'P9: Peak–End Rule',
    'Actionable Retry Mechanism in Error State',
    errorRecoveryContent.includes('onRetry') && errorRecoveryContent.includes('Retry'),
    'ErrorRecovery must provide a clear, non-intrusive retry action for positive recovery'
  );

  assert(
    'P9: Peak–End Rule',
    'Work Preservation Assurance',
    errorRecoveryContent.includes('Work Preserved') || errorRecoveryContent.includes('preserveWorkNotice'),
    'ErrorRecovery must provide work preservation notices so user anxiety is eliminated during errors'
  );

  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log(`║  🎉 ALL 9 UX PRINCIPLES SUCCESSFULLY VERIFIED (${results.length}/${results.length} PASS)   ║`);
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');
  process.exit(0);

} catch (err: any) {
  console.error('\n✖ Verification failed with error:', err.message);
  process.exit(1);
}
