/**
 * scripts/verify-vercel-resource-protection.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Automated Quality Gate: Vercel Resource Protection & Quota Defense Auditor.
 * Fast, pure Node.js implementation optimized for FAT32 filesystems.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');

const results = [];

function checkGate(name, checkFn) {
  try {
    const res = checkFn();
    results.push({
      gate: name,
      passed: res.passed,
      details: res.details,
      warnings: res.warnings || [],
    });
  } catch (err) {
    results.push({
      gate: name,
      passed: false,
      details: [`Execution error: ${err.message}`],
      warnings: [],
    });
  }
}

console.log('╔═══════════════════════════════════════════════════════════════════════════╗');
console.log('║       VERCEL RESOURCE PROTECTION & QUOTA DEFENSE AUDIT SUITE             ║');
console.log('║       Enforcing VERCEL_RESOURCE_PROTECTION_POLICY.md Quality Gates        ║');
console.log('╚═══════════════════════════════════════════════════════════════════════════╝\n');

// ─── GATE 1: Zero Heavy Binary Assets in Web Origin (public/) ────────────────
checkGate('Gate 1: Web Origin Binary Asset Hygiene', () => {
  const publicDir = path.join(ROOT_DIR, 'public');
  const details = [];
  const warnings = [];
  let passed = true;

  if (!fs.existsSync(publicDir)) {
    return { passed: true, details: ['public/ directory does not exist. Passed trivially.'] };
  }

  const entries = fs.readdirSync(publicDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(publicDir, entry.name);
    if (entry.isFile()) {
      const stats = fs.statSync(fullPath);
      const relPath = path.relative(ROOT_DIR, fullPath);

      if (/\.(apk|aab|dmg|iso|exe|zip|tar\.gz)$/i.test(entry.name)) {
        passed = false;
        details.push(`FORBIDDEN BINARY DETECTED: ${relPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      }

      if (stats.size > 1024 * 1024) {
        passed = false;
        details.push(`FILE EXCEEDS 1MB LIMIT: ${relPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
      }
    }
  }

  if (passed) {
    details.push('Zero forbidden binary files (.apk, .zip, etc.) or assets > 1MB detected in public/.');
  }

  return { passed, details, warnings };
});

// ─── GATE 2: Policy Governance & Agent Instructions ──────────────────────────
checkGate('Gate 2: Policy Governance & Coding Agent Instructions', () => {
  const details = [];
  const warnings = [];
  let passed = true;

  const policyPath = path.join(ROOT_DIR, 'VERCEL_RESOURCE_PROTECTION_POLICY.md');
  const agentsPath = path.join(ROOT_DIR, 'AGENTS.md');
  const rulesPath = path.join(ROOT_DIR, 'PROJECT_RULES.md');

  if (!fs.existsSync(policyPath)) {
    passed = false;
    details.push('MISSING: VERCEL_RESOURCE_PROTECTION_POLICY.md does not exist in root!');
  } else {
    const policyContent = fs.readFileSync(policyPath, 'utf8');
    if (!policyContent.includes('NO FEATURE, CODE CHANGE, API ENDPOINT')) {
      passed = false;
      details.push('INVALID: VERCEL_RESOURCE_PROTECTION_POLICY.md missing core non-negotiable rule!');
    } else {
      details.push('VERCEL_RESOURCE_PROTECTION_POLICY.md verified in repository root.');
    }
  }

  if (!fs.existsSync(agentsPath)) {
    passed = false;
    details.push('MISSING: AGENTS.md does not exist in root!');
  } else {
    const agentsContent = fs.readFileSync(agentsPath, 'utf8');
    if (!agentsContent.includes('VERCEL_RESOURCE_PROTECTION_POLICY.md')) {
      passed = false;
      details.push('INVALID: AGENTS.md does not reference VERCEL_RESOURCE_PROTECTION_POLICY.md!');
    } else {
      details.push('AGENTS.md references VERCEL_RESOURCE_PROTECTION_POLICY.md.');
    }
  }

  if (!fs.existsSync(rulesPath)) {
    warnings.push('PROJECT_RULES.md not found.');
  } else {
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    if (!rulesContent.includes('VERCEL_RESOURCE_PROTECTION_POLICY.md')) {
      warnings.push('PROJECT_RULES.md does not explicitly link to VERCEL_RESOURCE_PROTECTION_POLICY.md.');
    } else {
      details.push('PROJECT_RULES.md references VERCEL_RESOURCE_PROTECTION_POLICY.md.');
    }
  }

  return { passed, details, warnings };
});

// ─── GATE 3: Database Query Boundedness Audit ────────────────────────────────
checkGate('Gate 3: Supabase & PostgreSQL Query Boundedness', () => {
  const details = [];
  const warnings = [];

  const dbDir = path.join(ROOT_DIR, 'lib', 'db');
  if (fs.existsSync(dbDir)) {
    const files = fs.readdirSync(dbDir).filter((f) => f.endsWith('.ts'));
    for (const f of files) {
      const content = fs.readFileSync(path.join(dbDir, f), 'utf8');

      if (content.includes(".select('*')")) {
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes(".select('*')")) {
            const surrounding = lines.slice(i, Math.min(lines.length, i + 6)).join(' ');
            if (
              !surrounding.includes('.limit(') &&
              !surrounding.includes('.maybeSingle(') &&
              !surrounding.includes('.single(') &&
              !surrounding.includes('.eq(')
            ) {
              warnings.push(`Potential unbounded query in lib/db/${f} at line ${i + 1}: ${lines[i].trim()}`);
            }
          }
        }
      }
    }
    details.push(`Audited ${files.length} database modules in lib/db/.`);
  }

  if (warnings.length > 0) {
    details.push(`Identified ${warnings.length} query pattern(s) requiring pagination bounds or filters.`);
  } else {
    details.push('All database modules conform to query boundedness guidelines.');
  }

  return { passed: true, details, warnings };
});

// ─── GATE 4: Client-Side Polling Interval Hygiene ────────────────────────────
checkGate('Gate 4: Client Polling & Heartbeat Hygiene', () => {
  const details = [];
  const warnings = [];

  const knownPollingFiles = [
    'lib/network/NetworkSpeedManager.ts',
    'lib/presence/presenceService.ts',
    'lib/context/DataContext.tsx',
    'lib/context/ChatContext.tsx',
    'lib/godfather/context/GodfatherAuthContext.tsx',
  ];

  for (const rel of knownPollingFiles) {
    const fullPath = path.join(ROOT_DIR, rel);
    if (fs.existsSync(fullPath)) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const matches = content.match(/setInterval\s*\(\s*([^,]+),\s*([0-9_]+)\s*\)/g);
      if (matches) {
        for (const m of matches) {
          const numMatch = m.match(/,\s*([0-9_]+)\s*\)/);
          if (numMatch) {
            const ms = parseInt(numMatch[1].replace(/_/g, ''), 10);
            if (ms < 60000) {
              warnings.push(`Aggressive polling timer in ${rel}: ${ms}ms (< 60,000ms threshold)`);
            }
          }
        }
      }
    }
  }

  if (warnings.length > 0) {
    details.push(`Detected ${warnings.length} client polling interval(s) requiring throttling.`);
  } else {
    details.push('No aggressive client-side network polling intervals (< 60s) detected.');
  }

  return { passed: true, details, warnings };
});

// ─── GATE 5: API Route Duration & Caching Hygiene ────────────────────────────
checkGate('Gate 5: API Route Execution Duration & Caching Hygiene', () => {
  const details = [];
  const warnings = [];

  const apiDir = path.join(ROOT_DIR, 'app', 'api');
  let routeCount = 0;
  let maxDurationCount = 0;

  function scanApiRoutes(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanApiRoutes(fullPath);
      } else if (entry.isFile() && entry.name === 'route.ts') {
        routeCount++;
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.includes('maxDuration')) {
          maxDurationCount++;
        }

        const rel = path.relative(ROOT_DIR, fullPath);
        if (
          (rel.includes('geo') || rel.includes('countries')) &&
          content.includes("dynamic = 'force-dynamic'") &&
          !content.includes('Cache-Control')
        ) {
          warnings.push(`Static dataset route missing CDN caching in ${rel}`);
        }
      }
    }
  }

  scanApiRoutes(apiDir);

  details.push(`Audited ${routeCount} API routes in app/api/. ${maxDurationCount} route(s) explicitly declare maxDuration.`);
  if (warnings.length > 0) {
    details.push(`Identified ${warnings.length} static route(s) lacking CDN cache headers.`);
  }

  return { passed: true, details, warnings };
});

// ─── FINAL AUDIT REPORT ──────────────────────────────────────────────────────
console.log('───────────────────────────────────────────────────────────────────────────');
let allPassed = true;

for (const r of results) {
  const icon = r.passed ? '✔' : '✖';
  console.log(`${icon} [${r.passed ? 'PASSED' : 'FAILED'}] ${r.gate}`);
  for (const d of r.details) {
    console.log(`   • ${d}`);
  }
  for (const w of r.warnings) {
    console.log(`   ⚠ WARNING: ${w}`);
  }
  console.log('');
  if (!r.passed) allPassed = false;
}

console.log('───────────────────────────────────────────────────────────────────────────');
if (allPassed) {
  console.log('🎉 AUDIT RESULT: PASSED ALL CRITICAL RESOURCE PROTECTION GATES.');
  process.exit(0);
} else {
  console.error('❌ AUDIT RESULT: CRITICAL RESOURCE PROTECTION GATE FAILURES DETECTED.');
  process.exit(1);
}
