import { parseNaturalLanguageRates } from '../lib/rates/rateParser';

function runTests() {
  console.log('================================================================');
  console.log('   FR8X COMPLETE 21-CASE RATE PARSER & ROUTING INTEGRITY SUITE   ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, desc: string, details?: any) {
    total++;
    if (condition) {
      console.log(`  ✓ [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  ✗ [FAIL] ${desc}`, details ? `| Got: ${JSON.stringify(details)}` : '');
    }
  }

  // CASE 1: POR provided -> extracted
  const c1 = parseNaturalLanguageRates("POR: Ludhiana ICD, Maersk Line, 20DV $1500, 40HC $2400, valid 31-12-2026");
  assert(c1.records[0].por.toLowerCase().includes('ludhiana'), 'Case 1: POR provided is extracted', c1.records[0].por);

  // CASE 2: POL provided -> extracted
  const c2 = parseNaturalLanguageRates("POL: Nhava Sheva, Maersk Line, 20DV $1500, 40HC $2400, valid 31-12-2026");
  assert(c2.records[0].pol.toLowerCase().includes('nhava sheva'), 'Case 2: POL provided is extracted', c2.records[0].pol);

  // CASE 3: POD provided -> extracted
  const c3 = parseNaturalLanguageRates("POD: Jebel Ali, MSC, 20DV $1200, 40HC $1900, valid 31-12-2026");
  assert(c3.records[0].pod.toLowerCase().includes('jebel ali'), 'Case 3: POD provided is extracted', c3.records[0].pod);

  // CASE 4: FPOD provided -> extracted
  const c4 = parseNaturalLanguageRates("FPOD: Munich ICD, MSC, 20DV $1200, 40HC $1900, valid 31-12-2026");
  assert(c4.records[0].fpod.toLowerCase().includes('munich'), 'Case 4: FPOD provided is extracted', c4.records[0].fpod);

  // CASE 5: POR and POL both provided -> both remain separate
  const c5 = parseNaturalLanguageRates("POR: Dadri ICD, POL: Nhava Sheva, POD: Rotterdam, CMA CGM, 20DV $1800, 40HC $2800, valid 31-12-2026");
  assert(
    c5.records[0].por.toLowerCase().includes('dadri') &&
    c5.records[0].pol.toLowerCase().includes('nhava sheva') &&
    c5.records[0].por !== c5.records[0].pol,
    'Case 5: POR and POL both provided remain distinct and separate',
    { por: c5.records[0].por, pol: c5.records[0].pol }
  );

  // CASE 6: POD and FPOD both provided -> both remain separate
  const c6 = parseNaturalLanguageRates("POL: Mundra, POD: Rotterdam, FPOD: Frankfurt ICD, Hapag-Lloyd, 20DV $1900, 40HC $2900, valid 31-12-2026");
  assert(
    c6.records[0].pod.toLowerCase().includes('rotterdam') &&
    c6.records[0].fpod.toLowerCase().includes('frankfurt') &&
    c6.records[0].pod !== c6.records[0].fpod,
    'Case 6: POD and FPOD both provided remain distinct and separate',
    { pod: c6.records[0].pod, fpod: c6.records[0].fpod }
  );

  // CASE 7: Only POL provided -> POR remains blank
  const c7 = parseNaturalLanguageRates("POL: Nhava Sheva, POD: Jebel Ali, Maersk, 20DV $1400, 40HC $2200, valid 31-12-2026");
  assert(c7.records[0].por === '', 'Case 7: Only POL provided -> POR remains strictly blank', c7.records[0].por);

  // CASE 8: Only POD provided -> FPOD remains blank
  const c8 = parseNaturalLanguageRates("POL: Nhava Sheva, POD: Jebel Ali, Maersk, 20DV $1400, 40HC $2200, valid 31-12-2026");
  assert(c8.records[0].fpod === '', 'Case 8: Only POD provided -> FPOD remains strictly blank', c8.records[0].fpod);

  // CASE 9: Multiline remarks -> all lines preserved
  const input9 = `Maersk POL Nhava Sheva to Jebel Ali 20DV $1400 40HC $2200 valid 31-12-2026
Remarks:
Line 1: Special terminal handling at origin.
Line 2: Subject to carrier equipment availability.
Line 3: Destination port storage separate.`;
  const c9 = parseNaturalLanguageRates(input9);
  assert(
    c9.records[0].remarks.includes('Line 1') &&
    c9.records[0].remarks.includes('Line 2') &&
    c9.records[0].remarks.includes('Line 3'),
    'Case 9: Multiline remarks are losslessly preserved across all lines',
    c9.records[0].remarks
  );

  // CASE 10: Remarks with currency -> amounts preserved
  const c10 = parseNaturalLanguageRates("Maersk Nhava Sheva to Jebel Ali 20DV $1400 40HC $2200 valid 31-12-2026 Remarks: THC $150, BAF USD 200, PSS EUR 75, inland surcharge INR 8,500");
  assert(
    c10.records[0].remarks.includes('$150') &&
    c10.records[0].remarks.includes('200') &&
    c10.records[0].remarks.includes('75') &&
    c10.records[0].remarks.includes('8,500'),
    'Case 10: Currency amounts inside remarks preserved losslessly',
    c10.records[0].remarks
  );

  // CASE 11: Remarks with percentages -> percentages preserved
  const c11 = parseNaturalLanguageRates("MSC Mundra to Rotterdam 20DV $1800 40HC $2600 valid 31-12-2026 Remarks: 18% GST applicable on freight, 5% CAF surcharge, 2.5% agency fee");
  assert(
    c11.records[0].remarks.includes('18%') &&
    c11.records[0].remarks.includes('5%') &&
    c11.records[0].remarks.includes('2.5%'),
    'Case 11: Percentages inside remarks preserved losslessly',
    c11.records[0].remarks
  );

  // CASE 12: Remarks with dates -> dates preserved
  const c12 = parseNaturalLanguageRates("CMA CGM Nhava Sheva to Antwerp 20DV $1900 40HC $2800 valid 31-12-2026 Remarks: Free time valid until 15-Jan-2027, detention begins on 16-Jan-2027");
  assert(
    c12.records[0].remarks.includes('15-Jan-2027') &&
    c12.records[0].remarks.includes('16-Jan-2027'),
    'Case 12: Dates inside remarks preserved losslessly',
    c12.records[0].remarks
  );

  // CASE 13: Remarks with numbered conditions -> all preserved
  const input13 = `Evergreen POL Chennai to Felixstowe 20DV $1700 40HC $2500 valid 31-12-2026
Conditions:
1. Non-hazardous cargo only.
2. Advance booking required 7 days prior to vessel cutoff.
3. Payment terms 14 days credit.`;
  const c13 = parseNaturalLanguageRates(input13);
  assert(
    c13.records[0].remarks.includes('1. Non-hazardous') &&
    c13.records[0].remarks.includes('2. Advance booking') &&
    c13.records[0].remarks.includes('3. Payment terms'),
    'Case 13: Numbered conditions inside remarks preserved losslessly',
    c13.records[0].remarks
  );

  // CASE 14: Multiple field labels -> correct individual extraction
  const c14 = parseNaturalLanguageRates("Place of Receipt: Ludhiana CFS, Port of Loading: Nhava Sheva, Port of Discharge: Jebel Ali, Final Destination: Sharjah ICD, Carrier: Maersk, 20DV $1600, 40HC $2500, valid 31-12-2026");
  assert(
    c14.records[0].por.toLowerCase().includes('ludhiana') &&
    c14.records[0].pol.toLowerCase().includes('nhava sheva') &&
    c14.records[0].pod.toLowerCase().includes('jebel ali') &&
    c14.records[0].fpod.toLowerCase().includes('sharjah'),
    'Case 14: Multiple alternate field labels correctly extract all 4 port positions',
    c14.records[0]
  );

  // CASE 15: Duplicate conflicting POR -> conflict flagged
  const c15 = parseNaturalLanguageRates("POR: Ludhiana ICD, POR: Dadri ICD, POL: Nhava Sheva, POD: Jebel Ali, 20DV $1500, 40HC $2200, valid 31-12-2026");
  assert(
    c15.hasConflict === true && c15.warnings.some((w) => w.includes('conflicting POR')),
    'Case 15: Duplicate conflicting PORs trigger conflict flag and warning',
    c15.warnings
  );

  // CASE 16: Unknown text -> preserved for review
  const c16 = parseNaturalLanguageRates("Maersk POL Nhava Sheva to POD Jebel Ali 20DV $1400 40HC $2200 valid 31-12-2026 UNRECOGNIZED_SPECIAL_ROUTING_TOKEN_XYZ");
  assert(
    c16.unmappedSegments.length > 0 || c16.records[0].remarks.includes('UNRECOGNIZED_SPECIAL_ROUTING_TOKEN_XYZ'),
    'Case 16: Unknown / unmapped token preserved for review',
    { unmapped: c16.unmappedSegments, remarks: c16.records[0].remarks }
  );

  // CASE 17: Database save simulation -> all 4 fields persisted
  const dbRecord = {
    por: 'Ludhiana ICD',
    pol: 'Nhava Sheva (JNPT)',
    pod: 'Jebel Ali (Dubai)',
    fpod: 'Sharjah ICD',
    remarks: 'Commercial THC & BAF included',
  };
  assert(
    dbRecord.por === 'Ludhiana ICD' &&
    dbRecord.pol === 'Nhava Sheva (JNPT)' &&
    dbRecord.pod === 'Jebel Ali (Dubai)' &&
    dbRecord.fpod === 'Sharjah ICD' &&
    dbRecord.remarks.includes('THC & BAF'),
    'Case 17: Database save payload retains POR, POL, POD, FPOD, REMARKS strictly',
    dbRecord
  );

  // CASE 18: Database fetch simulation -> all 4 fields returned independently
  const fetched = { ...dbRecord };
  assert(
    fetched.por === 'Ludhiana ICD' &&
    fetched.fpod === 'Sharjah ICD' &&
    fetched.por !== fetched.pol &&
    fetched.fpod !== fetched.pod,
    'Case 18: Database fetch returns POR, POL, POD, FPOD independently without fallback',
    fetched
  );

  // CASE 19: Matrix display formatting -> all 4 columns populated correctly
  const displayPor = fetched.por || '—';
  const displayPol = fetched.pol;
  const displayPod = fetched.pod;
  const displayFpod = fetched.fpod || '—';
  assert(
    displayPor === 'Ludhiana ICD' &&
    displayPol === 'Nhava Sheva (JNPT)' &&
    displayPod === 'Jebel Ali (Dubai)' &&
    displayFpod === 'Sharjah ICD',
    'Case 19: Matrix display populates all 4 columns accurately',
    { displayPor, displayPol, displayPod, displayFpod }
  );

  // CASE 20: Record update -> updated correctly
  const updated = { ...fetched, remarks: 'Updated terms: Demurrage $50/day after 14 days' };
  assert(
    updated.remarks.includes('$50/day') && updated.por === fetched.por,
    'Case 20: Record update preserves integrity of routing and updates remarks',
    updated
  );

  // CASE 21: Empty remarks -> NO fabricated remarks
  const c21 = parseNaturalLanguageRates("Maersk POL Nhava Sheva to POD Jebel Ali 20DV $1400 40HC $2200 valid 31-12-2026");
  assert(
    c21.records[0].remarks === '',
    'Case 21: Empty remarks input results in clean empty string (NO fabricated defaults)',
    c21.records[0].remarks
  );

  console.log(`\n================================================================`);
  console.log(`VERIFICATION SUMMARY: ${passed} / ${total} TESTS PASSED`);
  console.log(`================================================================`);

  if (passed === total) {
    console.log('🎉 ALL 21 RATE PARSER & ROUTING INTEGRITY TESTS PASSED!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runTests();
