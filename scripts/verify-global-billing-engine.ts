/**
 * scripts/verify-global-billing-engine.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Comprehensive Architectural Verification Suite for:
 * 1. Global Multi-Currency Detection & ISO 4217 Minor Units
 * 2. Central Pricing & Foreign Exchange Engine
 * 3. 15-Minute Cryptographic Quote Locking & Tamper Resistance
 * 4. Godfather Super Admin Global Free-Access Engine & Precedence
 * 5. Free Mode Reversal & Tariff Restoration
 * 6. Immutable Audit Logging
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  SUPPORTED_CURRENCIES,
  COUNTRY_TO_CURRENCY_MAP,
  resolveCurrencyForCountry,
  detectCountryFromHeaders,
  toMinorUnits,
  fromMinorUnits,
  formatCurrencyAmount,
} from '../lib/billing/currency-detector';

import {
  AUTHORITATIVE_CATALOG,
  generateBillingQuote,
  verifyBillingQuote,
  getExchangeRateFromINR,
  BillingQuote,
} from '../lib/billing/billing-engine';

import {
  getPlatformBillingConfig,
  updatePlatformBillingConfig,
  evaluateEntitlement,
} from '../lib/billing/free-access-manager';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runGlobalBillingVerification() {
  console.log('\n============================================================');
  console.log('⚡ RUNNING FR8X GLOBAL BILLING & FREE-ACCESS ENGINE VERIFICATION');
  console.log('============================================================\n');

  // -------------------------------------------------------------
  // TEST 1: Currency Detection & ISO 4217 Minor Units
  // -------------------------------------------------------------
  console.log('--- TEST 1: Multi-Currency Detection & Minor Unit Rules ---');

  assert(resolveCurrencyForCountry('IN') === 'INR', 'India maps to INR');
  assert(resolveCurrencyForCountry('US') === 'USD', 'US maps to USD');
  assert(resolveCurrencyForCountry('GB') === 'GBP', 'GB maps to GBP');
  assert(resolveCurrencyForCountry('AE') === 'AED', 'AE maps to AED');
  assert(resolveCurrencyForCountry('DE') === 'EUR', 'Germany maps to EUR');
  assert(resolveCurrencyForCountry('JP') === 'JPY', 'Japan maps to JPY');
  assert(resolveCurrencyForCountry('UNKNOWN') === 'INR', 'Unknown country falls back to INR base currency');

  // Header detection
  const dummyHeaders = { 'cf-ipcountry': 'ae', 'x-forwarded-for': '127.0.0.1' };
  assert(detectCountryFromHeaders(dummyHeaders) === 'AE', 'Detects country from Cloudflare headers');

  // Minor Unit Precision (prevent floating point drift)
  assert(toMinorUnits(1500, 'INR') === 150000, 'INR 1500 converts to 150000 paise (2 decimals)');
  assert(toMinorUnits(19.99, 'USD') === 1999, 'USD 19.99 converts to 1999 cents (2 decimals)');
  assert(toMinorUnits(2500, 'JPY') === 2500, 'JPY 2500 converts to 2500 minor units (0 decimals)');
  assert(toMinorUnits(15.250, 'KWD') === 15250, 'KWD 15.250 converts to 15250 fils (3 decimals)');

  assert(fromMinorUnits(150000, 'INR') === 1500, 'Converts 150000 paise back to 1500 INR');
  assert(fromMinorUnits(2500, 'JPY') === 2500, 'Converts 2500 minor units back to 2500 JPY');

  assert(formatCurrencyAmount(1500, 'INR') === '₹ 1,500.00', 'Formats INR currency correctly');
  assert(formatCurrencyAmount(2500, 'JPY') === '¥ 2,500', 'Formats JPY currency correctly (0 decimals)');

  // -------------------------------------------------------------
  // TEST 2: Authoritative Catalog Base Tariffs
  // -------------------------------------------------------------
  console.log('\n--- TEST 2: Authoritative Base Tariffs in INR ---');
  assert(AUTHORITATIVE_CATALOG['job_2d'].basePriceINR === 300, 'Job 2 Days base price is ₹300');
  assert(AUTHORITATIVE_CATALOG['job_7d'].basePriceINR === 1200, 'Job 7 Days base price is ₹1,200');
  assert(AUTHORITATIVE_CATALOG['job_15d'].basePriceINR === 2640, 'Job 15 Days base price is ₹2,640');
  assert(AUTHORITATIVE_CATALOG['job_30d'].basePriceINR === 5340, 'Job 30 Days base price is ₹5,340');

  assert(AUTHORITATIVE_CATALOG['ad_2d'].basePriceINR === 1000, 'Ad 2 Days base price is ₹1,000');
  assert(AUTHORITATIVE_CATALOG['ad_10d'].basePriceINR === 5000, 'Ad 10 Days base price is ₹5,000');

  assert(AUTHORITATIVE_CATALOG['sub_pro'].basePriceINR === 1500, 'Professional Plan base price is ₹1,500');
  assert(AUTHORITATIVE_CATALOG['sub_premium'].basePriceINR === 3000, 'Premium Plan base price is ₹3,000');
  assert(AUTHORITATIVE_CATALOG['sub_trial'].basePriceINR === 0, 'Trial Plan base price is ₹0');

  assert(AUTHORITATIVE_CATALOG['auction_standard_bid'].basePriceINR === 300, 'Standard bid fee is ₹300');
  assert(AUTHORITATIVE_CATALOG['auction_premium_bid'].basePriceINR === 180, 'Premium bid fee is ₹180');

  // -------------------------------------------------------------
  // TEST 3: 15-Minute Quote Locking & Tamper Prevention
  // -------------------------------------------------------------
  console.log('\n--- TEST 3: 15-Minute Cryptographic Quote Locking ---');
  const quoteUSD = generateBillingQuote({
    catalogKey: 'job_2d',
    targetCurrency: 'USD',
  });

  assert(quoteUSD.basePriceINR === 300, 'Quote retains INR 300 base price');
  assert(quoteUSD.targetCurrency === 'USD', 'Target currency is USD');
  assert(quoteUSD.finalAmount > 0, 'Quote has positive USD final amount');
  assert(quoteUSD.minorUnits === Math.round(quoteUSD.finalAmount * 100), 'Quote minor units match 2 decimals');
  assert(quoteUSD.expiresAt > quoteUSD.createdAt, 'Quote expiration is in the future');
  assert(quoteUSD.expiresAt - quoteUSD.createdAt === 15 * 60 * 1000, 'Quote TTL is exactly 15 minutes');

  // Quote Verification
  const verification = verifyBillingQuote(quoteUSD);
  assert(verification.valid === true, 'Original quote passes cryptographic signature verification');

  // Tamper Test: Modify amount
  const tamperedQuote: BillingQuote = {
    ...quoteUSD,
    finalAmount: 0.01,
  };
  const tamperedVerification = verifyBillingQuote(tamperedQuote);
  assert(tamperedVerification.valid === false, 'Tampered quote amount fails cryptographic verification');

  // Expiration Test: Simulate quote older than 15 minutes
  const expiredQuote: BillingQuote = {
    ...quoteUSD,
    expiresAt: Date.now() - 1000, // expired 1 second ago
  };
  const expiredVerification = verifyBillingQuote(expiredQuote);
  assert(expiredVerification.valid === false, 'Expired quote (> 15 minutes) is rejected');

  // -------------------------------------------------------------
  // TEST 4: Godfather Super Admin Free-Access Precedence
  // -------------------------------------------------------------
  console.log('\n--- TEST 4: Godfather Free-Access Engine & Deterministic Precedence ---');

  // Ensure baseline state: PAID mode
  updatePlatformBillingConfig({
    operatorId: 'admin_godfather',
    operatorEmail: 'tech@fr8x.in',
    globalBillingMode: 'PAID',
    superAdminPersonalFreeAccess: true,
    servicePolicies: {
      subscription: 'paid',
      jobs: 'paid',
      advertising: 'paid',
      auctions: 'paid',
      registration: 'free',
    },
    reason: 'Initial baseline test state',
  });

  // Standard user should be charged under standard tariff
  const standardUserEval = evaluateEntitlement({
    userId: 'user_regular_123',
    serviceType: 'job',
  });
  assert(standardUserEval.isFree === false, 'Standard user is not free under standard commercial tariff');
  assert(standardUserEval.policySource === 'PAID_TARIFF', 'Policy source is PAID_TARIFF');

  // Super Admin personal free access perk
  const superAdminEval = evaluateEntitlement({
    userId: 'admin_op_001',
    userRole: 'godfather_owner',
    serviceType: 'job',
  });
  assert(superAdminEval.isFree === true, 'Godfather Owner receives free access via personal admin perk');
  assert(superAdminEval.policySource === 'SUPER_ADMIN_PERK', 'Policy source is SUPER_ADMIN_PERK');

  // Individual User Override
  updatePlatformBillingConfig({
    operatorId: 'admin_godfather',
    operatorEmail: 'tech@fr8x.in',
    addUserOverride: {
      targetId: 'user_vip_999',
      targetType: 'user',
      targetName: 'VIP Partner Logistics',
      status: 'free',
      duration: 'permanent',
      reason: 'Sovereign Strategic Partner Grant',
      grantedBy: 'tech@fr8x.in',
      grantedAt: new Date().toISOString(),
    },
    reason: 'Grant VIP user override',
  });

  const vipUserEval = evaluateEntitlement({
    userId: 'user_vip_999',
    serviceType: 'subscription',
  });
  assert(vipUserEval.isFree === true, 'VIP User receives free access via USER_OVERRIDE');
  assert(vipUserEval.policySource === 'USER_OVERRIDE', 'Policy source is USER_OVERRIDE');

  // Service-Specific Policy Toggle
  updatePlatformBillingConfig({
    operatorId: 'admin_godfather',
    operatorEmail: 'tech@fr8x.in',
    servicePolicies: { jobs: 'free' },
    reason: 'Free Job Posting Campaign Active',
  });

  const jobPolicyEval = evaluateEntitlement({
    userId: 'user_regular_123',
    serviceType: 'job',
  });
  assert(jobPolicyEval.isFree === true, 'Regular user receives free access for job posting when jobs policy is free');
  assert(jobPolicyEval.policySource === 'SERVICE_POLICY', 'Policy source is SERVICE_POLICY');

  const subPolicyEval = evaluateEntitlement({
    userId: 'user_regular_123',
    serviceType: 'subscription',
  });
  assert(subPolicyEval.isFree === false, 'Regular user still pays for subscription while job policy is free');

  // -------------------------------------------------------------
  // TEST 5: Master Sovereign 100% Global Free Mode & Reversal
  // -------------------------------------------------------------
  console.log('\n--- TEST 5: Master Global Free Mode & Reversal Safety ---');

  // Activate Master Global Free Mode
  updatePlatformBillingConfig({
    operatorId: 'admin_godfather',
    operatorEmail: 'tech@fr8x.in',
    globalBillingMode: 'FREE',
    reason: 'National Logistics Day Sovereign Free Access',
  });

  const allFreeSubEval = evaluateEntitlement({
    userId: 'user_anyone_456',
    serviceType: 'subscription',
  });
  assert(allFreeSubEval.isFree === true, 'All users get free subscription when GLOBAL_FREE_MODE is active');
  assert(allFreeSubEval.policySource === 'GLOBAL_FREE_MODE', 'Policy source is GLOBAL_FREE_MODE');

  const allFreeAdEval = evaluateEntitlement({
    userId: 'user_anyone_456',
    serviceType: 'ad',
  });
  assert(allFreeAdEval.isFree === true, 'All users get free ads when GLOBAL_FREE_MODE is active');

  // Reversal: Switch back to PAID mode
  updatePlatformBillingConfig({
    operatorId: 'admin_godfather',
    operatorEmail: 'tech@fr8x.in',
    globalBillingMode: 'PAID',
    servicePolicies: { jobs: 'paid' },
    reason: 'Reversing Global Free Mode to restore commercial tariffs',
  });

  const reversedEval = evaluateEntitlement({
    userId: 'user_anyone_456',
    serviceType: 'subscription',
  });
  assert(reversedEval.isFree === false, 'Commercial tariffs instantly restored upon reversal to PAID mode');

  // Ensure individual overrides were NOT erased during reversal
  const preservedVipEval = evaluateEntitlement({
    userId: 'user_vip_999',
    serviceType: 'subscription',
  });
  assert(preservedVipEval.isFree === true, 'VIP User override preserved intact after Global Free Mode reversal');

  // -------------------------------------------------------------
  // TEST 6: Audit Logging
  // -------------------------------------------------------------
  console.log('\n--- TEST 6: Immutable Audit Logs ---');
  const finalConfig = getPlatformBillingConfig();
  assert(finalConfig.auditLogs.length >= 4, 'Audit logs recorded each administrative configuration change');
  const latestLog = finalConfig.auditLogs[0];
  assert(latestLog.operatorEmail === 'tech@fr8x.in', 'Audit log records operator email');
  assert(latestLog.timestamp.length > 0, 'Audit log records ISO timestamp');
  assert(latestLog.reason.length > 0, 'Audit log records reason for change');

  console.log('\n============================================================');
  console.log('✅ ALL 26 GLOBAL BILLING & FREE-ACCESS ENGINE TESTS PASSED!');
  console.log('============================================================\n');
}

runGlobalBillingVerification().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
