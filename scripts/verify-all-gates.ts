/**
 * scripts/verify-all-gates.ts
 * Unified Master Architectural Quality Gate runner for FR8X Connect.
 * Runs Phase 7, 8, 9, 10, and 11 verification suites sequentially.
 */

import { execSync } from 'child_process';
import path from 'path';

const suites = [
  { name: 'Phase 7: State Management & Offline Architecture', file: 'scripts/verify-phase7-state-offline.ts' },
  { name: 'Phase 8: Real-Time Intelligence & Presence Architecture', file: 'scripts/verify-phase8-realtime-intelligence.ts' },
  { name: 'Phase 9: Security, Privacy & Data Protection Architecture', file: 'scripts/verify-phase9-security-privacy.ts' },
  { name: 'Phase 10: Payments, Settlement Webhooks & Communications', file: 'scripts/verify-phase10-payments-integrations.ts' },
  { name: 'Phase 11: CI/CD, Containerization & Infrastructure Architecture', file: 'scripts/verify-phase11-cicd-infra.ts' },
  { name: 'Phase 12: Observability, Error Boundaries & Production Hardening', file: 'scripts/verify-phase12-observability-hardening.ts' },
  { name: 'Phase 13: Launch-Readiness & Supabase Architecture', file: 'scripts/verify-launch-readiness.ts' },
];

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║        FR8X MASTER ARCHITECTURAL QUALITY GATES (PHASES 7-13)     ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

let allPassed = true;

for (let i = 0; i < suites.length; i++) {
  const s = suites[i];
  console.log(`\n▶ [GATE ${i + 1}/${suites.length}] Executing ${s.name}...`);
  try {
    execSync(`npx tsx "${s.file}"`, { stdio: 'inherit', cwd: path.resolve(__dirname, '..') });
    console.log(`✔ [GATE ${i + 1}/${suites.length}] PASSED: ${s.name}\n`);
  } catch (err) {
    console.error(`✖ [GATE ${i + 1}/${suites.length}] FAILED: ${s.name}\n`);
    allPassed = false;
    break;
  }
}

if (allPassed) {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║  🎉 ALL ARCHITECTURAL QUALITY GATES PASSED WITH ZERO REGRESSIONS  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  process.exit(0);
} else {
  console.error('Master quality gate run failed.');
  process.exit(1);
}
