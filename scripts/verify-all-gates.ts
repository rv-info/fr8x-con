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
  { name: 'Phase 14: Production Security Hardening & Zero-Trust Defense', file: 'scripts/verify-phase14-security-controls.ts' },
  { name: 'Phase 15: Professional People Search & Connection System', file: 'scripts/verify-phase15-people-network.ts' },
  { name: 'Phase 16: Advanced Backend Architecture, Outbox & Recommendations', file: 'scripts/verify-phase16-advanced-network.ts' },
  { name: 'Phase 17: Master Engineering Directive (Discovery, Input Security, Quarantine & Privacy Overhaul)', file: 'scripts/verify-master-directive.ts' },
  { name: 'Phase 18: Zero-Result User Search Incident Forensic Repair & Bidirectional Discovery', file: 'scripts/test-zero-result-search-repair.ts' },
  { name: 'Phase 19: Production UI, Data Integrity, SEO & Security Fixes', file: 'scripts/test-production-ui-integrity-fixes.ts' },
  { name: 'Phase 20: Correct Connection Workflow, Professional Messaging, Company Profiles & UI Logic', file: 'scripts/test-connection-lifecycle-and-company-fixes.ts' },
  { name: 'Phase 21: Registration Integrity, Forensic De-duplication, Godfather Audit, Notification Center, Search History & Rich Post Formatting', file: 'scripts/test-integrity-forensics-and-enhancements.ts' },
  { name: 'Phase 22: Connection Requests, Recipient Visibility & Database-Backed Notification Bell', file: 'scripts/test-connection-workflow-root-cause.ts' },
  { name: 'Phase 23: Vercel Resource Protection & Quota Defense Governance', file: 'scripts/verify-vercel-resource-protection.js' },
];

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║        FR8X MASTER ARCHITECTURAL QUALITY GATES (PHASES 7-23)     ║');
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
