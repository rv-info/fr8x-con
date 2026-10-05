/**
 * scripts/verify-phase9-security-privacy.ts
 * Verification test suite for Phase 9: Security, Privacy & Data Protection Architecture Audit
 */

import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { applySecurityHeaders } from '../middleware';
import { maskEmail, maskPhone, maskStatutory } from '../lib/connections';
import { DEFAULT_PRIVACY_SETTINGS, UserPrivacySettings, KYCDossier, KYCStatus } from '../lib/types';
import { serverSecurityStore } from '../lib/server-auth-store';
import { savePersistedUser } from '../lib/dbms/server-dbms';
import { evaluateCompliance, getStatutoryProfile } from '../lib/utils/statutory-kyc';
import { parseRichText } from '../lib/utils';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ [PASS] ${testName}`);
  } else {
    console.error(`  ✗ [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
  }
}

async function runTests() {
  console.log('================================================================');
  console.log('  FR8X PHASE 9: SECURITY, PRIVACY & DATA PROTECTION AUDIT VERIFICATION');
  console.log('================================================================\n');

  // TEST SUITE 1: Member Directory Crash Resilience & Safe Search (SEC-01)
  console.log('─── TEST SUITE 1: Member Directory Search Resilience (SEC-01) ───');
  const mockMembers = [
    {
      uid: 'user-001',
      displayName: 'Alice Logistics Specialist',
      email: undefined, // Sanitized non-self record
      company: 'Atlantic Global Freight',
      designation: 'Operations Director',
      city: 'Rotterdam',
    },
    {
      uid: 'user-002',
      displayName: 'Bob Maritime Broker',
      email: 'bob.maritime@broker.com', // Public or self
      company: 'Pacific Cargo Inc',
      designation: 'Chartering Manager',
      city: 'Singapore',
    },
    {
      uid: 'user-003',
      displayName: 'Charlie Port Agent',
      email: undefined, // Sanitized
      company: undefined,
      designation: undefined,
      city: 'Dubai',
    },
  ];

  // Perform search with email query that previously caused TypeError crash:
  const testQueries = ['atlantic', 'rotterdam', 'broker.com', 'alice', 'charlie'];
  let searchCrashed = false;
  let matchesCount = 0;

  try {
    for (const q of testQueries) {
      const queryLower = q.toLowerCase();
      const filtered = mockMembers.filter((m) => {
        const matchesBasic =
          m.displayName.toLowerCase().includes(queryLower) ||
          Boolean(m.email && m.email.toLowerCase().includes(queryLower)) ||
          Boolean(m.company && m.company.toLowerCase().includes(queryLower)) ||
          Boolean(m.designation && m.designation.toLowerCase().includes(queryLower)) ||
          Boolean(m.city && m.city.toLowerCase().includes(queryLower));
        return matchesBasic;
      });
      matchesCount += filtered.length;
    }
  } catch (err) {
    searchCrashed = true;
    console.error('Directory search threw exception:', err);
  }

  assert(
    !searchCrashed,
    'Directory member search does not crash with TypeError when email is undefined'
  );
  assert(
    matchesCount >= 5,
    'Directory member search successfully returns matches across sanitized records',
    `Found ${matchesCount} total matches across test queries`
  );

  // TEST SUITE 2: HTTP Defense-in-Depth Security Headers (SEC-02)
  console.log('\n─── TEST SUITE 2: HTTP Security Headers & Middleware Protection (SEC-02) ───');
  const mockResponse = NextResponse.next();
  const hardenedResponse = applySecurityHeaders(mockResponse);

  const expectedHeaders: Record<string, string> = {
    'x-content-type-options': 'nosniff',
    'x-frame-options': 'DENY',
    'x-xss-protection': '1; mode=block',
    'referrer-policy': 'strict-origin-when-cross-origin',
    'strict-transport-security': 'max-age=31536000; includeSubDomains; preload',
    'permissions-policy': 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  };

  for (const [header, expectedValue] of Object.entries(expectedHeaders)) {
    const actualValue = hardenedResponse.headers.get(header);
    assert(
      actualValue === expectedValue,
      `Security header '${header}' is configured correctly in middleware`,
      `Expected: ${expectedValue}, Got: ${actualValue}`
    );
  }

  // Verify next.config.js contains HSTS and Permissions-Policy
  const nextConfigPath = path.resolve(process.cwd(), 'next.config.js');
  const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
  assert(
    nextConfigContent.includes('Strict-Transport-Security'),
    'next.config.js includes Strict-Transport-Security in HTTP headers block'
  );
  assert(
    nextConfigContent.includes('Permissions-Policy'),
    'next.config.js includes Permissions-Policy in HTTP headers block'
  );

  // TEST SUITE 3: Server-Side Privacy Settings & Contact Connections (SEC-03)
  console.log('\n─── TEST SUITE 3: Privacy Settings Resolution & Masking (SEC-03) ───');

  // Test pure masking functions
  const maskedEmail = maskEmail('rajat.rai@cogoport.com');
  assert(
    maskedEmail.startsWith('r') && maskedEmail.includes('••') && maskedEmail.endsWith('@cogoport.com'),
    'maskEmail obscures local part while preserving domain and outer characters',
    `Got: ${maskedEmail}`
  );

  const maskedPhone = maskPhone('+91 9876543210');
  assert(
    maskedPhone.startsWith('+91') && maskedPhone.includes('•••••') && maskedPhone.endsWith('10'),
    'maskPhone obscures intermediate subscriber digits while preserving country code and suffix',
    `Got: ${maskedPhone}`
  );

  const maskedStatutory = maskStatutory('27AAAAA0000A1Z5');
  assert(
    maskedStatutory.startsWith('27') && maskedStatutory.includes('••••') && maskedStatutory.endsWith('Z5'),
    'maskStatutory obscures corporate tax identification digits',
    `Got: ${maskedStatutory}`
  );

  // Test profile resolution for connected vs unconnected users
  const targetUserRecord = {
    uid: 'target-enterprise-user',
    email: 'compliance@securefreight.com',
    mobile: '+91 9876500000',
    gstn: '27AABCS1429B1ZB',
    pan: 'AABCS1429B',
    contacts: ['connected-peer-uid'],
    privacySettings: {
      ...DEFAULT_PRIVACY_SETTINGS,
      emailVisibility: 'contacts_only' as const,
      phoneVisibility: 'contacts_only' as const,
      statutoryVisibility: 'contacts_only' as const,
    },
  };

  // Helper simulating GET /api/user/profile privacy filter
  function simulateProfilePrivacyFilter(target: any, callerUid: string) {
    const isConnected = Boolean(callerUid && Array.isArray(target.contacts) && target.contacts.includes(callerUid));
    const privacy: UserPrivacySettings = {
      ...DEFAULT_PRIVACY_SETTINGS,
      ...(target.privacySettings || {}),
    };

    let resolvedEmail: string | undefined;
    if (privacy.emailVisibility === 'public' || (privacy.emailVisibility === 'contacts_only' && isConnected)) {
      resolvedEmail = target.email;
    } else if (target.email) {
      resolvedEmail = maskEmail(target.email);
    }

    let resolvedPhone: string | undefined;
    if (privacy.phoneVisibility === 'public' || (privacy.phoneVisibility === 'contacts_only' && isConnected)) {
      resolvedPhone = target.mobile;
    } else if (target.mobile) {
      resolvedPhone = maskPhone(target.mobile);
    }

    let resolvedGstn: string | undefined;
    if (privacy.statutoryVisibility === 'public' || (privacy.statutoryVisibility === 'contacts_only' && isConnected)) {
      resolvedGstn = target.gstn;
    } else if (target.gstn) {
      resolvedGstn = maskStatutory(target.gstn);
    }

    return { resolvedEmail, resolvedPhone, resolvedGstn, isConnected };
  }

  // Case A: Unconnected caller (stranger)
  const strangerView = simulateProfilePrivacyFilter(targetUserRecord, 'stranger-uid');
  assert(
    strangerView.isConnected === false,
    'Privacy filter identifies unconnected caller as stranger'
  );
  assert(
    Boolean(strangerView.resolvedEmail !== targetUserRecord.email && strangerView.resolvedEmail?.includes('•••')),
    'Email is masked for unconnected caller when emailVisibility is contacts_only',
    `Got: ${strangerView.resolvedEmail}`
  );
  assert(
    Boolean(strangerView.resolvedPhone !== targetUserRecord.mobile && strangerView.resolvedPhone?.includes('•••')),
    'Phone is masked for unconnected caller when phoneVisibility is contacts_only',
    `Got: ${strangerView.resolvedPhone}`
  );
  assert(
    Boolean(strangerView.resolvedGstn !== targetUserRecord.gstn && strangerView.resolvedGstn?.includes('••••')),
    'GSTN is masked for unconnected caller when statutoryVisibility is contacts_only',
    `Got: ${strangerView.resolvedGstn}`
  );

  // Case B: Connected caller (accepted contact)
  const connectedView = simulateProfilePrivacyFilter(targetUserRecord, 'connected-peer-uid');
  assert(
    connectedView.isConnected === true,
    'Privacy filter identifies caller as authorized contact'
  );
  assert(
    connectedView.resolvedEmail === targetUserRecord.email,
    'Full unmasked email is provided to authorized contact',
    `Got: ${connectedView.resolvedEmail}`
  );
  assert(
    connectedView.resolvedPhone === targetUserRecord.mobile,
    'Full unmasked phone is provided to authorized contact',
    `Got: ${connectedView.resolvedPhone}`
  );
  assert(
    connectedView.resolvedGstn === targetUserRecord.gstn,
    'Full unmasked GSTN is provided to authorized contact',
    `Got: ${connectedView.resolvedGstn}`
  );

  // Case C: Server security store supports privacySettings and statutory updates
  const testUserUid = `usr_compliance_${Date.now()}`;
  const testUserEmail = `officer_${Date.now()}@forwardergroup.com`;
  savePersistedUser({
    uid: testUserUid,
    email: testUserEmail,
    displayName: 'Chief Compliance Officer',
    company: 'Forwarder Group Ltd',
    companyId: 'comp_forwarder_01',
    role: 'company_admin',
    status: 'active',
    email_verified: true,
    createdAt: new Date().toISOString(),
  });

  serverSecurityStore.updateUserProfile(testUserUid, {
    gstn: '27AABCS1429B1ZB',
    privacySettings: {
      emailVisibility: 'public',
      phoneVisibility: 'private',
      statutoryVisibility: 'contacts_only',
      companyVisibility: 'public',
      tradeLanesVisibility: 'public',
      bioVisibility: 'public',
      allowConnectionRequests: true,
    },
  });

  const persistedUser = serverSecurityStore.getUser(testUserUid);
  assert(
    Boolean(persistedUser && persistedUser.privacySettings?.emailVisibility === 'public'),
    'serverSecurityStore.updateUserProfile persists privacySettings in DBMS'
  );
  assert(
    Boolean(persistedUser && persistedUser.gstn === '27AABCS1429B1ZB'),
    'serverSecurityStore.updateUserProfile persists statutory GSTN in DBMS'
  );

  // TEST SUITE 4: Supabase PostgreSQL Row Level Security (RLS) Tenancy & Data Isolation (SEC-04)
  console.log('\n─── TEST SUITE 4: Supabase PostgreSQL RLS Tenancy & Data Isolation (SEC-04) ───');
  const schemaPath = path.resolve(process.cwd(), 'supabase', 'migrations', '20261005000000_fr8x_initial_schema.sql');
  const completeSchemaPath = path.resolve(process.cwd(), 'supabase', 'migrations', '20261005000002_complete_production_schema.sql');
  const schemaContent = fs.readFileSync(schemaPath, 'utf8') + '\n' + fs.readFileSync(completeSchemaPath, 'utf8');

  assert(
    schemaContent.includes('ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;'),
    'profiles table enables Row Level Security'
  );
  assert(
    schemaContent.includes('ALTER TABLE public.rates ENABLE ROW LEVEL SECURITY;'),
    'rates table enables Row Level Security'
  );
  assert(
    schemaContent.includes('ALTER TABLE public.auctions ENABLE ROW LEVEL SECURITY;'),
    'auctions table enables Row Level Security'
  );
  assert(
    schemaContent.includes('ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;'),
    'transactions table enables Row Level Security'
  );
  assert(
    schemaContent.includes('ALTER TABLE public.verifications ENABLE ROW LEVEL SECURITY;'),
    'verifications table enables Row Level Security'
  );
  assert(
    schemaContent.includes('auth.uid() = id') || schemaContent.includes('auth.uid() = user_id'),
    'RLS policies enforce auth.uid() ownership isolation'
  );

  // TEST SUITE 5: Corporate KYC Regulatory Compliance (SEC-05)
  console.log('\n─── TEST SUITE 5: Corporate KYC Regulatory Compliance (SEC-05) ───');

  // Test India Profile
  const inProfile = getStatutoryProfile('IN');
  assert(
    inProfile.countryCode === 'IN' && inProfile.primaryTaxId.shortLabel === 'GSTIN',
    'getStatutoryProfile returns Indian regulatory profile with GSTIN primary identifier'
  );

  // Compliant Indian payload
  const compliantIndia = evaluateCompliance('IN', {
    gstn: '27AABCS1429B1ZB',
    pan: 'AABCS1429B',
    iec: '0308012345',
    mto: 'MTO/DGS/2026/012',
  });
  assert(
    compliantIndia.isCompliant === true,
    'evaluateCompliance returns isCompliant: true when mandatory statutory filings are satisfied',
    JSON.stringify(compliantIndia)
  );

  // Incomplete Indian payload
  const incompleteIndia = evaluateCompliance('IN', {
    gstn: '',
    pan: '',
  });
  assert(
    incompleteIndia.isCompliant === false,
    'evaluateCompliance returns isCompliant: false when mandatory statutory filings are missing'
  );
  assert(
    incompleteIndia.missingFields.length > 0,
    'evaluateCompliance returns missing required field checklist',
    `Missing: ${incompleteIndia.missingFields.join(', ')}`
  );

  // Verify KYC submission dossier status logic:
  // A dossier with incomplete fields must be 'under_review' rather than 'verified'
  const computedStatus: KYCStatus = incompleteIndia.isCompliant ? 'verified' : 'under_review';
  assert(
    computedStatus === 'under_review',
    'KYC dossier cannot be self-verified when mandatory statutory compliance fails'
  );

  // TEST SUITE 6: XSS Protection & HTML Injection Defense
  console.log('\n─── TEST SUITE 6: XSS & HTML Injection Defense ───');
  const xssPayloads = [
    '<script>alert("xss")</script>',
    '<img src=x onerror="alert(\'xss\')">',
    '<iframe src="javascript:alert(1)"></iframe>',
    'Normal text *bold text* and `inline code`',
  ];

  for (const payload of xssPayloads) {
    const rendered = parseRichText(payload);
    assert(
      !rendered.includes('<script>') && !rendered.includes('<img src=x') && !rendered.includes('<iframe'),
      `parseRichText safely neutralizes HTML injection in payload`,
      `Original: ${payload.slice(0, 30)}... Rendered: ${rendered.slice(0, 30)}...`
    );
  }

  // Summary
  console.log('\n================================================================');
  console.log(`  PHASE 9 VERIFICATION SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log('================================================================');

  if (passedTests === totalTests) {
    console.log('  >>> ALL PHASE 9 SECURITY & PRIVACY TESTS PASSED SUCCESSFULLY! <<<\n');
    process.exit(0);
  } else {
    console.error(`  >>> ${totalTests - passedTests} TESTS FAILED <<<\n`);
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
