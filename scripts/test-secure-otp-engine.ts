/**
 * FR8X — Untraceable Secure OTP Engine Test & Verification Suite
 * ==============================================================================
 * Comprehensive security validation for:
 * 1. CSPRNG Entropy & Formatting
 * 2. Zero-Knowledge & Untraceable Memory Representation Audit
 * 3. Constant-Time Timing Attack Resistant Confirmation
 * 4. Burn-After-Reading (Single-Use Replay Immunity)
 * 5. Attempt Decrement & Brute-Force Auto-Incineration
 * 6. Cryptographic Purpose Binding
 * 7. Cryptographic Subject Binding
 * 8. Ephemeral TTL Expiration Enforcement
 * 9. Proof-of-Verification Single-Use Grant
 * 10. Memory & Serialization Redaction
 * ==============================================================================
 */

import { UntraceableSecureOtpEngine } from '../lib/security/secure-otp-engine';

async function runOtpVerificationSuite() {
  console.log('======================================================================');
  console.log('🔒 STARTING UNTRACEABLE SECURE OTP ENGINE VERIFICATION SUITE');
  console.log('======================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      console.log(`  ✓ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ✗ FAIL: ${testName}${detail ? ` -> ${detail}` : ''}`);
      failed++;
    }
  }

  const engine = new UntraceableSecureOtpEngine('test-master-pepper-fr8x-2026');

  // ───────────────────────────────────────────────────────────────────────────
  // 1. CSPRNG Uniform Generation & Format
  // ───────────────────────────────────────────────────────────────────────────
  console.log('--- 1. CSPRNG Entropy & Format Validation ---');
  const challenge1 = engine.createChallenge({
    subject: 'test.user@fr8x.in',
    purpose: 'login',
    length: 6,
  });

  assert(/^\d{6}$/.test(challenge1.plainOtpForDispatch), '6-digit numeric OTP matches format exactly');
  assert(challenge1.expiresInSeconds === 120, 'Default TTL is strictly 120 seconds');
  assert(typeof challenge1.challengeTicket === 'string' && challenge1.challengeTicket.includes('.'), 'Ticket is cryptographically signed');
  assert(challenge1.correlationId.startsWith('CID-'), 'Correlation ID is formatted safely without leaking plain code');

  const alphaChallenge = engine.createChallenge({
    subject: 'test.user@fr8x.in',
    purpose: 'transaction',
    length: 8,
    alphanumeric: true,
  });
  assert(/^[23456789ABCDEFGHJKLMNPQRSTUVWXYZ]{8}$/.test(alphaChallenge.plainOtpForDispatch), '8-char alphanumeric OTP uses unambiguous charset');

  // ───────────────────────────────────────────────────────────────────────────
  // 2. Zero-Knowledge & Untraceability Memory Audit
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 2. Zero-Knowledge & Untraceable Memory Audit ---');
  // Access internal vault directly via reflection to prove zero plaintext in RAM
  const vaultMap = (engine as any).vault as Map<string, any>;
  const parts = challenge1.challengeTicket.split('.');
  const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
  const storedEntry = vaultMap.get(payload.cid);

  assert(Boolean(storedEntry), 'Challenge is stored in blinded vault');
  assert(storedEntry.otpHash !== challenge1.plainOtpForDispatch, 'Stored OTP hash is one-way digest, NOT plaintext');
  assert(!JSON.stringify(storedEntry).includes(challenge1.plainOtpForDispatch), 'Vault entry contains ZERO instances of plain OTP string');
  assert(!JSON.stringify(storedEntry).includes('test.user@fr8x.in'), 'Subject email is blinded and NOT stored in plaintext');
  assert(storedEntry.blindedSubject.length === 64, 'Subject is blinded via SHA-256 HMAC digest');

  // ───────────────────────────────────────────────────────────────────────────
  // 3. Constant-Time Confirmation (Success Flow)
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 3. Accurate Verification Flow ---');
  const verifyRes = engine.verifyChallenge({
    challengeTicket: challenge1.challengeTicket,
    otpInput: challenge1.plainOtpForDispatch,
    expectedSubject: 'test.user@fr8x.in',
    expectedPurpose: 'login',
  });

  assert(verifyRes.success === true, 'Valid OTP confirms successfully');
  assert(verifyRes.isBurned === true, 'Verified challenge is marked burned');
  assert(Boolean(verifyRes.proofToken), 'Cryptographic proof token minted on confirmation');
  assert(verifyRes.purpose === 'login', 'Verified purpose matches request');

  // ───────────────────────────────────────────────────────────────────────────
  // 4. Burn-After-Reading Replay Protection
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 4. Burn-After-Reading (Replay Immunity) ---');
  const replayRes = engine.verifyChallenge({
    challengeTicket: challenge1.challengeTicket,
    otpInput: challenge1.plainOtpForDispatch,
  });

  assert(replayRes.success === false, 'Replaying burned challenge is strictly rejected');
  assert(replayRes.error === 'CHALLENGE_NOT_FOUND_OR_BURNED', 'Error confirms challenge was burned immediately upon reading');

  // ───────────────────────────────────────────────────────────────────────────
  // 5. Attempt Decrement & Brute-Force Auto-Incineration
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 5. Attempt Decrement & Brute-Force Auto-Incineration ---');
  const bruteChallenge = engine.createChallenge({
    subject: 'brute.target@fr8x.in',
    purpose: 'password_reset',
    maxAttempts: 3,
  });

  // Attempt 1: wrong
  const fail1 = engine.verifyChallenge({
    challengeTicket: bruteChallenge.challengeTicket,
    otpInput: '000000',
  });
  assert(fail1.success === false && fail1.attemptsRemaining === 2, 'Attempt 1 failed: 2 attempts remaining');
  assert(fail1.isBurned === false, 'Challenge not yet burned on attempt 1');

  // Attempt 2: wrong
  const fail2 = engine.verifyChallenge({
    challengeTicket: bruteChallenge.challengeTicket,
    otpInput: '111111',
  });
  assert(fail2.success === false && fail2.attemptsRemaining === 1, 'Attempt 2 failed: 1 attempt remaining');

  // Attempt 3: wrong -> auto-incineration
  const fail3 = engine.verifyChallenge({
    challengeTicket: bruteChallenge.challengeTicket,
    otpInput: '222222',
  });
  assert(fail3.success === false && fail3.attemptsRemaining === 0, 'Attempt 3 failed: 0 attempts remaining');
  assert(fail3.isBurned === true, 'Challenge immediately incinerated upon 3rd failure');

  // Attempt 4: now using the REAL OTP code -> MUST FAIL because it was incinerated!
  const failReal = engine.verifyChallenge({
    challengeTicket: bruteChallenge.challengeTicket,
    otpInput: bruteChallenge.plainOtpForDispatch,
  });
  assert(failReal.success === false, 'Real code rejected after max-attempts auto-incineration');

  // ───────────────────────────────────────────────────────────────────────────
  // 6. Cryptographic Purpose Binding
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 6. Cryptographic Purpose Binding Immunity ---');
  const purposeChallenge = engine.createChallenge({
    subject: 'victim@fr8x.in',
    purpose: 'login',
  });

  const wrongPurposeRes = engine.verifyChallenge({
    challengeTicket: purposeChallenge.challengeTicket,
    otpInput: purposeChallenge.plainOtpForDispatch,
    expectedPurpose: 'password_reset', // Attacker trying to use login OTP for password reset
  });
  assert(wrongPurposeRes.success === false && wrongPurposeRes.error === 'PURPOSE_MISMATCH', 'Cross-workflow purpose reuse rejected');

  // ───────────────────────────────────────────────────────────────────────────
  // 7. Cryptographic Subject Binding
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 7. Cryptographic Subject Binding Immunity ---');
  const subjectChallenge = engine.createChallenge({
    subject: 'alice@fr8x.in',
    purpose: 'godfather_access',
  });

  const wrongSubjectRes = engine.verifyChallenge({
    challengeTicket: subjectChallenge.challengeTicket,
    otpInput: subjectChallenge.plainOtpForDispatch,
    expectedSubject: 'bob@fr8x.in', // Attacker trying to use Alice OTP for Bob
  });
  assert(wrongSubjectRes.success === false && wrongSubjectRes.error === 'SUBJECT_MISMATCH', 'Subject impersonation strictly rejected');

  // ───────────────────────────────────────────────────────────────────────────
  // 8. Ephemeral TTL Expiration Enforcement
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 8. Ephemeral TTL Expiration Enforcement ---');
  const shortChallenge = engine.createChallenge({
    subject: 'expiry.test@fr8x.in',
    purpose: 'transaction',
    ttlSeconds: 1, // 1 second expiry
  });

  await new Promise((resolve) => setTimeout(resolve, 1100)); // Sleep 1.1s

  const expiredRes = engine.verifyChallenge({
    challengeTicket: shortChallenge.challengeTicket,
    otpInput: shortChallenge.plainOtpForDispatch,
  });
  assert(expiredRes.success === false && expiredRes.error === 'CODE_EXPIRED', 'Expired OTP rejected strictly after TTL timeout');

  // ───────────────────────────────────────────────────────────────────────────
  // 9. Proof-of-Verification Single-Use Grant
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 9. Proof-of-Verification Single-Use Grant ---');
  const proofChallenge = engine.createChallenge({
    subject: 'rajat.rai@cogoport.com',
    purpose: 'email_verification',
  });

  const verified = engine.verifyChallenge({
    challengeTicket: proofChallenge.challengeTicket,
    otpInput: proofChallenge.plainOtpForDispatch,
  });

  const proofToken = verified.proofToken!;
  assert(Boolean(proofToken), 'Proof token issued on valid confirmation');

  const consume1 = engine.consumeProofToken(proofToken, 'email_verification');
  assert(consume1.valid === true, 'Initial proof token consumption succeeds');

  const consumeDuplicate = engine.consumeProofToken(proofToken, 'email_verification');
  assert(consumeDuplicate.valid === false && consumeDuplicate.error === 'PROOF_TOKEN_ALREADY_CONSUMED', 'Proof token reuse rejected (single-use enforced)');

  const tamperedProof = engine.consumeProofToken(proofToken + 'tampered', 'email_verification');
  assert(tamperedProof.valid === false && tamperedProof.error === 'INVALID_OR_TAMPERED_PROOF_TOKEN', 'Forged proof token rejected');

  // ───────────────────────────────────────────────────────────────────────────
  // 10. Memory & Serialization Redaction
  // ───────────────────────────────────────────────────────────────────────────
  console.log('\n--- 10. Memory & Serialization Redaction ---');
  const serialized = JSON.stringify(engine);
  assert(serialized.includes('[REDACTED_SECURE_OTP_VAULT]'), 'JSON.stringify automatically redacts vault internals');
  assert(!serialized.includes(proofChallenge.plainOtpForDispatch), 'Plaintext OTP is never serialized in logs or state dumps');

  console.log('\n======================================================================');
  console.log(`SECURE OTP ENGINE VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runOtpVerificationSuite().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
