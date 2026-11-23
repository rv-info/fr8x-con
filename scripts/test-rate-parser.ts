import { parseNaturalLanguageRates } from '../lib/rates/rateParser';

function runTests() {
  console.log('================================================================');
  console.log('   FR8X NATURAL-LANGUAGE RATE PARSER VERIFICATION SUITE         ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${desc}`);
    }
  }

  // TEST 1: Standard one-liner with carrier, ports, pricing, free time, validity, transit, routing, and remarks
  const input1 = "Maersk Line POL Nhava Sheva to Jebel Ali, 20DV $1450, 40HC $2300, 14 days free time, valid till 31-12-2026, transit 18 days via direct route, includes THC & BAF";
  const res1 = parseNaturalLanguageRates(input1);

  assert(res1.success === true, 'Test 1: Succeeded');
  assert(res1.totalExtracted === 1, 'Test 1: 1 record extracted');
  const r1 = res1.records[0];
  assert(r1.carrier === 'Maersk Line', `Test 1: Carrier is Maersk Line (got: ${r1.carrier})`);
  assert(r1.pol === 'Nhava Sheva (JNPT)', `Test 1: POL is Nhava Sheva (got: ${r1.pol})`);
  assert(r1.pod === 'Jebel Ali (Dubai)', `Test 1: POD is Jebel Ali (got: ${r1.pod})`);
  assert(r1.d20 === 1450, `Test 1: 20DV amount is 1450 (got: ${r1.d20})`);
  assert(r1.d20Type === '20DV', `Test 1: 20TYPE is 20DV (got: ${r1.d20Type})`);
  assert(r1.h40 === 2300, `Test 1: 40HC amount is 2300 (got: ${r1.h40})`);
  assert(r1.h40Type === '40HC', `Test 1: 40TYPE is 40HC (got: ${r1.h40Type})`);
  assert(r1.freeTime.includes('14 days'), `Test 1: Free time has 14 days (got: ${r1.freeTime})`);
  assert(r1.validDate === '2026-12-31', `Test 1: Validity is normalized to 2026-12-31 (got: ${r1.validDate})`);
  assert(r1.transitTime.includes('18 days'), `Test 1: Transit time is 18 days (got: ${r1.transitTime})`);
  assert(r1.routing.toLowerCase().includes('direct'), `Test 1: Routing is direct (got: ${r1.routing})`);
  assert(r1.remarks.toLowerCase().includes('thc'), `Test 1: Remarks captures THC & BAF (got: ${r1.remarks})`);

  // TEST 2: Abbreviated codes and alternate container types (e.g. 20RF, 40FR)
  const input2 = "CMA CGM Mundra to Rotterdam 20RF $2100, 40FR $3400, 21 days detention, valid through 15-Oct-2026, transit 28 days, non-hazardous only";
  const res2 = parseNaturalLanguageRates(input2);
  const r2 = res2.records[0];

  assert(r2.carrier === 'CMA CGM S.A.', `Test 2: Carrier is CMA CGM (got: ${r2.carrier})`);
  assert(r2.pol === 'Mundra', `Test 2: POL is Mundra (got: ${r2.pol})`);
  assert(r2.pod === 'Rotterdam', `Test 2: POD is Rotterdam (got: ${r2.pod})`);
  assert(r2.d20 === 2100 && r2.d20Type === '20RF', `Test 2: 20RF is $2100 (got: ${r2.d20} ${r2.d20Type})`);
  assert(r2.h40 === 3400 && r2.h40Type === '40FR', `Test 2: 40FR is $3400 (got: ${r2.h40} ${r2.h40Type})`);
  assert(r2.validDate === '2026-10-15', `Test 2: Date 15-Oct-2026 normalized to 2026-10-15 (got: ${r2.validDate})`);
  assert(r2.remarks.toLowerCase().includes('non-hazardous'), `Test 2: Remarks captures non-hazardous (got: ${r2.remarks})`);

  // TEST 3: Multi-rate input (2 distinct rate lines)
  const input3 = `1. MSC Mundra to Jebel Ali, 20DV $1200, 40HC $1900, 14 days FT, valid 31-12-2026, direct
2. Evergreen Nhava Sheva to Felixstowe, 20DV $1750, 40HC $2650, 21 days FT, valid 15-11-2026, via Colombo`;
  const res3 = parseNaturalLanguageRates(input3);

  assert(res3.totalExtracted === 2, `Test 3: Extracted 2 distinct records (got: ${res3.totalExtracted})`);
  assert(res3.records[0].carrier === 'Mediterranean Shipping Company', `Test 3 Record 1: MSC carrier (got: ${res3.records[0].carrier})`);
  assert(res3.records[1].carrier === 'Evergreen Marine Corporation', `Test 3 Record 2: Evergreen carrier (got: ${res3.records[1].carrier})`);
  assert(res3.records[0].pod === 'Jebel Ali (Dubai)', `Test 3 Record 1 POD: Jebel Ali (got: ${res3.records[0].pod})`);
  assert(res3.records[1].pod === 'Felixstowe', `Test 3 Record 2 POD: Felixstowe (got: ${res3.records[1].pod})`);

  // TEST 4: Performance & Model Info
  assert(res1.modelInfo.modelSizeMB <= 25, `Test 4: Model size ${res1.modelInfo.modelSizeMB}MB <= 25MB`);
  assert(res1.modelInfo.latencyMs < 50, `Test 4: Parser latency ${res1.modelInfo.latencyMs}ms < 50ms`);

  console.log(`\n================================================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log(`================================================================`);

  if (passed === total) {
    console.log('🎉 ALL NATURAL LANGUAGE RATE PARSER TESTS PASSED!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
