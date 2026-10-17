/**
 * scripts/verify-recommendations-hygiene.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Verification Suite: Self-Recommendation & Test/Dummy Account Elimination
 *
 * Verifies:
 * 1. isSelfProfile multi-factor identity resolution (UID, email, mobile, name+company)
 * 2. isTestOrDummyAccount catches "Test Discovery", "FR8X Test Co", and fixture profiles
 * 3. calculateConnectionAffinity returns 0 when me == target (eliminates 68% self-score)
 * 4. getDailyConnectionRecommendations strictly filters out self and dummy cards
 * 5. Frontend & Backend architectural defense-in-depth across DailyRecommendationsWidget,
 *    SearchConnectionsModal, /api/members, and /api/people/search.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import {
  isSelfProfile,
  isTestOrDummyAccount,
  calculateConnectionAffinity,
  getDailyConnectionRecommendations,
} from '../lib/connections-algorithm';
import { UserProfile } from '../lib/types';

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✔ [PASS] ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✖ [FAIL] ${testName}${detail ? ` — ${detail}` : ''}`);
  }
}

async function run() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║   FR8X RECOMMENDATIONS & DIRECTORY HYGIENE VERIFICATION SUITE   ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // ── TEST GROUP 1: Multi-Factor Self-Profile Identification ─────────────────
  console.log('▶ [1/5] Testing Multi-Factor isSelfProfile Identity Resolution...');

  const activeUser: Partial<UserProfile> = {
    uid: '2a0e28f3-5969-45e0-82d2-8b4e496e95bb',
    email: 'pricing@sybinternational.com',
    displayName: 'Kumar R',
    company: 'SYB INTERNATIONAL',
    role: 'user',
    designation: 'PRICING',
    mobile: '+91 98765 43210',
    city: 'Mumbai',
    country: 'India',
  };

  // Same UID
  assert(
    isSelfProfile(activeUser, { uid: '2a0e28f3-5969-45e0-82d2-8b4e496e95bb' }),
    'Detects self by identical UID'
  );
  assert(
    isSelfProfile(activeUser, { uid: '2A0E28F3-5969-45E0-82D2-8B4E496E95BB ' }),
    'Detects self by case-insensitive trimmed UID'
  );

  // Different UID but identical email
  assert(
    isSelfProfile(activeUser, { uid: 'u-diff-uid-123', email: 'pricing@sybinternational.com' }),
    'Detects self by email when UID differs across auth layers'
  );
  assert(
    isSelfProfile(activeUser, { uid: 'u-diff-uid-456', email: 'PRICING@SYBINTERNATIONAL.COM ' }),
    'Detects self by case-insensitive trimmed email'
  );

  // Different UID & empty email, but matching 10-digit mobile phone
  assert(
    isSelfProfile(activeUser, { uid: 'u-diff-uid-789', mobile: '9876543210' }),
    'Detects self by normalized mobile number'
  );

  // Cross-session schema drift: different UID, empty email, but matching normalized Name + Company
  assert(
    isSelfProfile(activeUser, {
      uid: 'user-uuid-kumar-profile',
      displayName: 'kumar r',
      company: 'syb international',
    }),
    'Detects self by normalized displayName + company match'
  );

  // Legitimate distinct user (should NOT match)
  const peerUser: Partial<UserProfile> = {
    uid: 'usr-priya-001',
    email: 'priya.sharma@sharmalogistics.com',
    displayName: 'Priya Sharma',
    company: 'Sharma Logistics Ltd',
    role: 'user',
    designation: 'Pricing Manager',
    mobile: '+91 91234 56789',
    city: 'Mumbai',
    country: 'India',
  };
  assert(
    !isSelfProfile(activeUser, peerUser),
    'Correctly identifies legitimate distinct user as NOT self'
  );

  // ── TEST GROUP 2: Dummy & Test Account Filtering ────────────────────────────
  console.log('\n▶ [2/5] Testing Dummy, Test & Sample Account Blocking...');

  // Incident reported test profile: "Test Discovery" at "FR8X Test Co"
  const testDiscoveryProfile = {
    uid: 'usr-discovery-test-99',
    displayName: 'Test Discovery',
    company: 'FR8X Test Co',
    designation: 'Logistics Analyst',
    email: 'discovery.test@example.com',
  };
  assert(
    isTestOrDummyAccount(testDiscoveryProfile),
    'Blocks incident account "Test Discovery" (FR8X Test Co)'
  );

  // Test account by name
  assert(
    isTestOrDummyAccount({ displayName: 'Operations Test Controller' }),
    'Blocks test account by displayName ("Operations Test Controller")'
  );
  assert(
    isTestOrDummyAccount({ displayName: 'Test User' }),
    'Blocks generic "Test User"'
  );
  assert(
    isTestOrDummyAccount({ displayName: 'Mock User Dummy' }),
    'Blocks "Mock User Dummy"'
  );

  // Test account by company
  assert(
    isTestOrDummyAccount({ company: 'FR8X Test Co' }),
    'Blocks company "FR8X Test Co"'
  );
  assert(
    isTestOrDummyAccount({ company: 'Cooldown Test Co' }),
    'Blocks company "Cooldown Test Co"'
  );
  assert(
    isTestOrDummyAccount({ company: 'BEACON FORWARDING' }),
    'Blocks test fixture company "BEACON FORWARDING"'
  );

  // Test account by email
  assert(
    isTestOrDummyAccount({ email: 'operations.test@example.com' }),
    'Blocks @example.com test email'
  );
  assert(
    isTestOrDummyAccount({ email: 'tester_12345@test.domain.com' }),
    'Blocks @test. domain email'
  );
  assert(
    isTestOrDummyAccount({ email: 'lockout_test_user@enterprise.local' }),
    'Blocks .local internal test email'
  );

  // Test account by UID
  assert(
    isTestOrDummyAccount({ uid: 'usr_compliance_1791200220172' }),
    'Blocks fixture UID pattern usr_compliance_*'
  );
  assert(
    isTestOrDummyAccount({ uid: 'usr_commerce_1791198735132' }),
    'Blocks fixture UID pattern usr_commerce_*'
  );
  assert(
    isTestOrDummyAccount({ uid: 'u-suspended-01' }),
    'Blocks test fixture UID u-suspended-01'
  );

  // Genuine production profiles (must NOT be blocked)
  assert(
    !isTestOrDummyAccount(activeUser),
    'Allows genuine active user "Kumar R" (SYB INTERNATIONAL)'
  );
  assert(
    !isTestOrDummyAccount(peerUser),
    'Allows genuine peer user "Priya Sharma" (Sharma Logistics Ltd)'
  );
  assert(
    !isTestOrDummyAccount({
      uid: 'a0000000-0000-0000-0000-000000000001',
      displayName: 'Capt. Rajesh Sharma',
      company: 'Adani Logistics & Ports',
      email: 'rajesh.sharma@adani.com',
    }),
    'Allows verified seeded leader "Capt. Rajesh Sharma"'
  );

  // ── TEST GROUP 3: Affinity Calculation Zero-Self Guarantee ─────────────────
  console.log('\n▶ [3/5] Testing calculateConnectionAffinity Self-Neutralization...');

  // Target has identical company, role, city -> previously scored 68-70%
  const selfDuplicateCandidate: Partial<UserProfile> = {
    uid: 'diff-uid-for-same-person',
    email: 'pricing@sybinternational.com',
    displayName: 'Kumar R',
    company: 'SYB INTERNATIONAL',
    role: 'user',
    designation: 'PRICING',
    city: 'Mumbai',
    country: 'India',
  };

  const selfAffinity = calculateConnectionAffinity(activeUser, selfDuplicateCandidate);
  assert(
    selfAffinity.score === 0,
    'Self-affinity score is strictly 0 (was previously 70 points)'
  );
  assert(
    selfAffinity.percentage === 0,
    'Self-affinity percentage is strictly 0% (was previously 68%)'
  );
  assert(
    selfAffinity.reasons.length === 0,
    'Self-affinity reasons array is strictly empty'
  );

  // Distinct colleague at same company (genuine colleague)
  const colleagueUser: Partial<UserProfile> = {
    uid: 'colleague-uuid-002',
    email: 'operations@sybinternational.com',
    displayName: 'Amit Verma',
    company: 'SYB INTERNATIONAL',
    role: 'user',
    designation: 'Operations Lead',
    city: 'Mumbai',
    country: 'India',
  };
  const colleagueAffinity = calculateConnectionAffinity(activeUser, colleagueUser);
  assert(
    colleagueAffinity.score >= 35,
    `Colleague affinity score is valid (>35 points, actual: ${colleagueAffinity.score})`
  );
  assert(
    colleagueAffinity.percentage >= 65,
    `Colleague affinity percentage qualifies (actual: ${colleagueAffinity.percentage}%)`
  );

  // ── TEST GROUP 4: Recommendation Engine Candidate Filtering ───────────────
  console.log('\n▶ [4/5] Testing getDailyConnectionRecommendations Filter Integrity...');

  const candidatePool: Partial<UserProfile>[] = [
    // 1. Self clone (must be filtered out)
    selfDuplicateCandidate,
    // 2. Incident test profile "Test Discovery" (must be filtered out)
    testDiscoveryProfile,
    // 3. Fixture test profile "Operations Test Controller" (must be filtered out)
    {
      uid: 'usr_raivega_mgt',
      displayName: 'Operations Test Controller',
      company: 'BEACON FORWARDING',
      email: 'operations.test@example.com',
    },
    // 4. Genuine colleague (should be recommended)
    colleagueUser,
    // 5. Genuine peer from another company
    {
      uid: 'peer-uuid-003',
      email: 'procurement@adanilogistics.com',
      displayName: 'Vikram Mehta',
      company: 'Adani Logistics',
      role: 'user',
      designation: 'Procurement Specialist',
      city: 'Mumbai',
      country: 'India',
      experiences: [
        {
          id: 'exp-1',
          title: 'Pricing Analyst',
          company: 'SYB INTERNATIONAL',
          designation: 'Pricing Analyst',
          employmentType: 'Full-time',
          location: 'Mumbai',
          startDate: '2021',
          endDate: '2023',
          isCurrent: false,
          description: 'Pricing',
          skills: ['Pricing'],
          visibility: 'public',
        },
      ],
    },
  ];

  const recommendations = getDailyConnectionRecommendations(
    activeUser,
    candidatePool as UserProfile[],
    [],
    [],
    [],
    8
  );

  assert(
    !recommendations.some((r) => isSelfProfile(activeUser, r.user)),
    'Recommendations NEVER contain the active user'
  );
  assert(
    !recommendations.some((r) => r.user.displayName === 'Kumar R'),
    'Recommendations do not contain "Kumar R"'
  );
  assert(
    !recommendations.some((r) => r.user.displayName === 'Test Discovery'),
    'Recommendations do not contain "Test Discovery"'
  );
  assert(
    !recommendations.some((r) => r.user.company === 'FR8X Test Co'),
    'Recommendations do not contain "FR8X Test Co"'
  );
  assert(
    !recommendations.some((r) => isTestOrDummyAccount(r.user)),
    'Recommendations contain ZERO test or dummy accounts'
  );
  assert(
    recommendations.length > 0,
    `Recommendations successfully returned ${recommendations.length} genuine qualified freight peers`
  );

  // ── TEST GROUP 5: Codebase Architecture & Defense-in-Depth Inspection ─────
  console.log('\n▶ [5/5] Auditing Architectural Code Gates & Defense-in-Depth...');

  const rootDir = path.resolve(__dirname, '..');

  // DailyRecommendationsWidget.tsx
  const widgetCode = fs.readFileSync(path.join(rootDir, 'components/connections/DailyRecommendationsWidget.tsx'), 'utf8');
  assert(
    widgetCode.includes('isSelfProfile') && widgetCode.includes('isTestOrDummyAccount'),
    'DailyRecommendationsWidget imports isSelfProfile and isTestOrDummyAccount'
  );
  assert(
    widgetCode.includes('!isSelfProfile(currentUser, m) && !isTestOrDummyAccount(m)'),
    'DailyRecommendationsWidget filters candidate pool in loadMembers'
  );
  assert(
    widgetCode.includes('toast(\'You cannot send a connection request to yourself.\')'),
    'DailyRecommendationsWidget blocks self connection in handleConnect'
  );

  // SearchConnectionsModal.tsx
  const modalCode = fs.readFileSync(path.join(rootDir, 'components/connections/SearchConnectionsModal.tsx'), 'utf8');
  assert(
    modalCode.includes('isSelfProfile(currentUser, m) || isTestOrDummyAccount(m)'),
    'SearchConnectionsModal filters out self and test/dummy profiles'
  );

  // lib/connections.ts
  const connectionsCode = fs.readFileSync(path.join(rootDir, 'lib/connections.ts'), 'utf8');
  assert(
    connectionsCode.includes('fromUser.uid === toUser.uid || isSelfProfile(fromUser, toUser)'),
    'lib/connections.ts sendConnectionRequest rejects self-connection'
  );

  // app/api/members/route.ts
  const membersApiCode = fs.readFileSync(path.join(rootDir, 'app/api/members/route.ts'), 'utf8');
  assert(
    membersApiCode.includes('isTestOrDummyAccount'),
    'app/api/members/route.ts filters dummy/test accounts'
  );
  assert(
    membersApiCode.includes('excludeSelf') && membersApiCode.includes('isSelfProfile'),
    'app/api/members/route.ts supports excludeSelf and uses multi-factor isSelfProfile'
  );

  // app/api/people/search/route.ts
  const searchApiCode = fs.readFileSync(path.join(rootDir, 'app/api/people/search/route.ts'), 'utf8');
  assert(
    searchApiCode.includes('isTestOrDummyAccount(r)') && searchApiCode.includes('isSelfProfile(user, r as any)'),
    'app/api/people/search/route.ts filters dummy accounts and self from search results'
  );

  // Final summary
  console.log('\n════════════════════════════════════════════════════════════════════');
  console.log(`TOTAL AUDIT CHECKS: ${totalTests}`);
  console.log(`PASSED: ${passedTests}`);
  console.log(`FAILED: ${failedTests}`);
  console.log('════════════════════════════════════════════════════════════════════');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    console.log('\n🎉 ALL HYGIENE & ANTI-SELF RECOMMENDATION CHECKS PASSED (100% SUCCESS)\n');
  }
}

run().catch((err) => {
  console.error('Test suite execution error:', err);
  process.exit(1);
});
