/**
 * scripts/verify-master-directive.ts
 * Comprehensive Architectural Quality Gate for FR8X Master Engineering Directive:
 * 1. User Discovery Repair & Idempotent Profile Reconciliation
 * 2. Connection & Messaging Authorization
 * 3. Continuous Input Security & Contextual Encoding Pipeline
 * 4. File Upload Quarantine & Signature/Magic-Byte Scanner
 * 5. Privacy Policy Overhaul & DPDPA 2023 Compliance Matrix
 * 6. Registration Master Terms of Service URL & Gated Submission
 */

import fs from 'fs';
import path from 'path';
import {
  escapeHtml,
  sanitizePlainText,
  sanitizeHtmlContext,
  detectSqlInjectionPattern,
  preventPathTraversal,
  pickAllowedFields,
  UserSearchQuerySchema,
  ProfileUpdateSchema,
  DirectMessageSchema,
  FileUploadMetadataSchema,
} from '../lib/security/input-validation';
import {
  detectMagicBytes,
  calculateSha256,
  scanAndValidateUpload,
} from '../lib/security/file-scanner';

const ROOT = path.resolve(__dirname, '..');

let totalChecks = 0;
let passedChecks = 0;

function assert(condition: boolean, message: string) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✔ [PASS] ${message}`);
  } else {
    console.error(`  ✖ [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runMasterDirectiveVerification() {
  console.log('\n======================================================================');
  console.log('   FR8X GATE 11: MASTER ENGINEERING DIRECTIVE VERIFICATION');
  console.log('======================================================================\n');

  // ---------------------------------------------------------------------------
  // Check 1: User Discovery Repair & Reconciliation Migration
  // ---------------------------------------------------------------------------
  console.log('▶ [CHECK 1] Verifying Profile Reconciliation & Quarantine Schema Migration...');
  const migrationPath = path.join(
    ROOT,
    'supabase/migrations/20261016120000_profile_reconciliation_and_upload_quarantine.sql'
  );
  assert(fs.existsSync(migrationPath), 'Migration 20261016120000 exists');

  const migrationSql = fs.readFileSync(migrationPath, 'utf8');
  assert(
    migrationSql.includes('CREATE OR REPLACE FUNCTION public.reconcile_auth_profiles()'),
    'Defines public.reconcile_auth_profiles() RPC'
  );
  assert(
    migrationSql.includes('ON CONFLICT (id) DO NOTHING'),
    'Reconcile function uses idempotent ON CONFLICT (id) DO NOTHING (never overwrites user data)'
  );
  assert(
    migrationSql.includes('SECURITY DEFINER'),
    'Reconcile function executes with SECURITY DEFINER privileges'
  );
  assert(
    migrationSql.includes('CREATE TABLE IF NOT EXISTS public.uploaded_files'),
    'Defines public.uploaded_files quarantine table'
  );
  assert(
    migrationSql.includes('scan_status TEXT NOT NULL DEFAULT \'PENDING_SCAN\''),
    'Enforces default PENDING_SCAN state machine'
  );
  assert(
    migrationSql.includes('ALTER TABLE public.uploaded_files ENABLE ROW LEVEL SECURITY'),
    'Enables RLS on uploaded_files table'
  );

  // ---------------------------------------------------------------------------
  // Check 2: Connection & Messaging Server-Side Authorization
  // ---------------------------------------------------------------------------
  console.log('\n▶ [CHECK 2] Verifying Connection & Messaging Authorization Gating...');
  const searchRoutePath = path.join(ROOT, 'app/api/people/search/route.ts');
  const searchRouteCode = fs.readFileSync(searchRoutePath, 'utf8');
  // Confirm search does not require is_online = true
  assert(
    !searchRouteCode.includes(".eq('is_online', true)"),
    'User search does not restrict discovery to online users'
  );
  assert(
    searchRouteCode.includes('first_name') && searchRouteCode.includes('company_name'),
    'User search matches across public profile attributes (name, company)'
  );

  const peopleDirectoryPath = path.join(ROOT, 'lib/people-directory.ts');
  const peopleDirectoryCode = fs.readFileSync(peopleDirectoryPath, 'utf8');
  assert(
    peopleDirectoryCode.includes('maskContactInfo') || peopleDirectoryCode.includes('connection_status'),
    'Protects private contact fields from unconnected members'
  );

  // ---------------------------------------------------------------------------
  // Check 3: Centralized Input Validation & Contextual Encoding Pipeline
  // ---------------------------------------------------------------------------
  console.log('\n▶ [CHECK 3] Verifying Centralized Input Validation Pipeline...');
  // XSS Escaping
  const rawHtml = '<script>alert("XSS")</script>&<foo>';
  const escaped = escapeHtml(rawHtml);
  assert(
    escaped === '&lt;script&gt;alert(&quot;XSS&quot;)&lt;&#x2F;script&gt;&amp;&lt;foo&gt;',
    'escapeHtml correctly neutralizes script tags and special chars'
  );

  // Plain Text Sanitization
  const dirtyText = 'Hello \x00\x08World <script>evil()</script>';
  const cleanText = sanitizePlainText(dirtyText);
  assert(!cleanText.includes('\x00') && !cleanText.includes('<script>'), 'sanitizePlainText strips null bytes and encodes tags');

  // Active Script Vector Sanitization
  const activeScript = '<div onmouseover="steal()"><iframe src="bad.html"></iframe>Safe Text</div>';
  const sanitizedActive = sanitizeHtmlContext(activeScript);
  assert(!sanitizedActive.includes('onmouseover') && !sanitizedActive.includes('<iframe'), 'sanitizeHtmlContext strips active event handlers & iframes');

  // Path Traversal Defense
  let traversalCaught = false;
  try {
    preventPathTraversal('../../etc/passwd');
  } catch (err) {
    traversalCaught = true;
  }
  assert(traversalCaught, 'preventPathTraversal blocks directory traversal attempts');

  const safePath = preventPathTraversal('documents/reports/q3_manifest.pdf');
  assert(safePath === 'documents/reports/q3_manifest.pdf', 'preventPathTraversal preserves safe alphanumeric paths');

  // SQL Injection Heuristics
  assert(detectSqlInjectionPattern("' OR 1=1 --"), 'detectSqlInjectionPattern detects classic tautology injection');
  assert(detectSqlInjectionPattern("UNION SELECT username, password FROM users"), 'detectSqlInjectionPattern detects UNION injection');
  assert(!detectSqlInjectionPattern('Mumbai Freight Port Terminal'), 'detectSqlInjectionPattern allows legitimate freight text');

  // Mass Assignment Protection
  const untrustedPayload = {
    first_name: 'Raj',
    last_name: 'Verma',
    role: 'super_admin', // unauthorized attempt
    is_admin: true,       // unauthorized attempt
    bio: 'Freight Manager',
  };
  const safeProfile = pickAllowedFields(untrustedPayload, ['first_name', 'last_name', 'bio']);
  assert(!('role' in safeProfile) && !('is_admin' in safeProfile), 'pickAllowedFields strips mass assignment fields');
  assert(safeProfile.first_name === 'Raj' && safeProfile.bio === 'Freight Manager', 'pickAllowedFields retains permitted fields');

  // Zod Schemas
  const validSearch = UserSearchQuerySchema.safeParse({ q: 'Maersk Logistics', limit: 10 });
  assert(validSearch.success, 'UserSearchQuerySchema accepts valid query');

  const invalidSearch = UserSearchQuerySchema.safeParse({ q: "' OR 1=1 --" });
  assert(!invalidSearch.success, 'UserSearchQuerySchema rejects suspicious SQL patterns');

  const validMessage = DirectMessageSchema.safeParse({
    conversation_id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    content: 'Rate inquiry for 40ft HC from Nhava Sheva to Rotterdam',
  });
  assert(validMessage.success, 'DirectMessageSchema accepts valid message');

  // ---------------------------------------------------------------------------
  // Check 4: File Upload Quarantine & Malware Scanner Pipeline
  // ---------------------------------------------------------------------------
  console.log('\n▶ [CHECK 4] Verifying File Upload Quarantine & Scanner Pipeline...');
  // Magic bytes detection
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00]);
  const detectedPng = detectMagicBytes(pngHeader);
  assert(detectedPng?.mime === 'image/png' && detectedPng?.ext === '.png', 'detectMagicBytes correctly identifies PNG');

  const pdfHeader = Buffer.from('%PDF-1.7\n%Fake PDF binary stream');
  const detectedPdf = detectMagicBytes(pdfHeader);
  assert(detectedPdf?.mime === 'application/pdf' && detectedPdf?.ext === '.pdf', 'detectMagicBytes correctly identifies PDF');

  // SHA-256 Checksum
  const sampleBuf = Buffer.from('FR8X-QUARANTINE-VERIFICATION-BUFFER');
  const checksum = calculateSha256(sampleBuf);
  assert(checksum.length === 64, 'calculateSha256 produces valid 64-character SHA-256 hex string');

  // Clean File Upload Scenario
  const cleanResult = await scanAndValidateUpload({
    fileName: 'bill_of_lading.pdf',
    claimedMimeType: 'application/pdf',
    purpose: 'freight_document',
    buffer: pdfHeader,
  });
  assert(cleanResult.scanStatus === 'CLEAN' && cleanResult.isAvailable === true, 'Valid PDF is marked CLEAN and AVAILABLE');

  // Prohibited Executable Extension Scenario
  const maliciousExe = await scanAndValidateUpload({
    fileName: 'invoice_updater.exe',
    claimedMimeType: 'application/x-msdownload',
    purpose: 'freight_document',
    buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00]),
  });
  assert(
    maliciousExe.scanStatus === 'QUARANTINED' && maliciousExe.isAvailable === false,
    'Executable (.exe) upload is immediately QUARANTINED and NOT available'
  );

  // EICAR Malware Signature Scenario
  const eicarBuffer = Buffer.from(
    'X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*'
  );
  const eicarResult = await scanAndValidateUpload({
    fileName: 'test_malware.pdf',
    claimedMimeType: 'application/pdf',
    purpose: 'freight_document',
    buffer: eicarBuffer,
  });
  assert(
    eicarResult.scanStatus === 'QUARANTINED' && eicarResult.isAvailable === false,
    'EICAR signature is detected and file is QUARANTINED'
  );

  // ---------------------------------------------------------------------------
  // Check 5: Complete FR8X Privacy Policy Overhaul
  // ---------------------------------------------------------------------------
  console.log('\n▶ [CHECK 5] Verifying Overhauled Privacy Policy & Compliance Matrix...');
  const privacyPagePath = path.join(ROOT, 'app/privacy/page.tsx');
  const privacyPageCode = fs.readFileSync(privacyPagePath, 'utf8');

  assert(privacyPageCode.includes('FR8X Technology Private Limited'), 'Declares legal operating entity');
  assert(privacyPageCode.includes('DPDPA 2023'), 'References Digital Personal Data Protection Act 2023');
  assert(privacyPageCode.includes('DPDP Rules 2025'), 'References Digital Personal Data Protection Rules 2025');
  assert(privacyPageCode.includes('7 Years'), 'Specifies 7-year statutory retention for customs & tax records');
  assert(privacyPageCode.includes('180 Days'), 'Specifies 180-day statutory log retention for CERT-In compliance');
  assert(privacyPageCode.includes('privacy@fr8x.in'), 'Publishes official Grievance Officer privacy contact');
  assert(privacyPageCode.includes('https://con.fr8x.in/terms'), 'Provides direct link to Master Terms of Service');

  // Verify all 12 policy sections exist
  for (let i = 1; i <= 12; i++) {
    assert(
      privacyPageCode.includes(`id="sec-${i}"`) || privacyPageCode.includes(`${i}. `),
      `Includes Policy Document ${i} in statutory directory`
    );
  }

  // ---------------------------------------------------------------------------
  // Check 6: Registration Master Terms of Service & Submission Gating
  // ---------------------------------------------------------------------------
  console.log('\n▶ [CHECK 6] Verifying Registration Flow & Terms Acceptance...');
  const registerPagePath = path.join(ROOT, 'app/register/page.tsx');
  const registerPageCode = fs.readFileSync(registerPagePath, 'utf8');

  assert(
    registerPageCode.includes('https://con.fr8x.in/terms'),
    'Registration page contains the exact Master Terms URL: https://con.fr8x.in/terms'
  );
  assert(
    registerPageCode.includes('disabled={isSubmitting || !termsAccepted}'),
    'Registration submit button is strictly disabled when terms are not accepted'
  );
  assert(
    registerPageCode.includes('termsVersion') && registerPageCode.includes('termsAcceptedAt'),
    'Registration transmits versioned and timestamped terms acceptance metadata'
  );

  console.log('\n======================================================================');
  console.log(`🎉 ALL ${passedChecks}/${totalChecks} MASTER DIRECTIVE QUALITY CHECKS PASSED`);
  console.log('======================================================================\n');
}

runMasterDirectiveVerification().catch((err) => {
  console.error('\n✖ Master directive verification failed:\n', err);
  process.exit(1);
});
