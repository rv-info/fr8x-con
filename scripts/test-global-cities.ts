import {
  getAllCountries,
  getCountryByCode,
  getCitiesByCountry,
  searchCitiesGlobal,
  lookupPostalCode,
} from '../lib/geo/city-service';

async function runGlobalCitiesVerification() {
  console.log('================================================================');
  console.log('FR8X GLOBAL CITIES & POSTAL CODES DATABASE VERIFICATION SUITE');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, msg: string) {
    if (condition) {
      console.log(`[PASS] ${msg}`);
      passed++;
    } else {
      console.error(`[FAIL] ${msg}`);
      failed++;
    }
  }

  // ── TEST 1: Country Directory (250 Countries) ─────────────────────────────
  console.log('--- 1. Testing Global Country Registry ---');
  const countries = getAllCountries();
  assert(Array.isArray(countries), 'Countries response is an array');
  assert(countries.length >= 240, `Loaded ${countries.length} global countries (expected ~250)`);

  const india = countries.find((c) => c.code === 'IN');
  assert(Boolean(india), 'India (IN) present in country registry');
  assert(india?.flag?.length! > 0, `India flag: ${india?.flag}`);
  assert(india?.phonecode === '+91', `India dial code: ${india?.phonecode}`);

  const usa = countries.find((c) => c.code === 'US');
  assert(Boolean(usa), 'United States (US) present in country registry');

  const netherlands = countries.find((c) => c.code === 'NL');
  assert(Boolean(netherlands), 'Netherlands (NL) present in country registry');

  const uae = countries.find((c) => c.code === 'AE');
  assert(Boolean(uae), 'United Arab Emirates (AE) present in country registry');

  // ── TEST 2: Country-Specific City Retrieval ───────────────────────────────
  console.log('\n--- 2. Testing Country-Specific Cities & Postal Mapping ---');

  // 2a. India
  const inCities = getCitiesByCountry('IN', 'Mumbai', 10);
  assert(inCities.length > 0, `India Mumbai search matched: ${inCities.length} cities`);
  const mumbai = inCities.find((c) => c.name.toLowerCase() === 'mumbai');
  assert(Boolean(mumbai), 'Mumbai resolved in Indian city database');
  assert(mumbai?.postalCode === '400001', `Mumbai postal code resolved: ${mumbai?.postalCode}`);
  assert(mumbai?.countryCode === 'IN', `Mumbai country code: ${mumbai?.countryCode}`);
  assert(Boolean(mumbai?.unLocode), `Mumbai UN/LOCODE: ${mumbai?.unLocode}`);

  // 2b. United States
  const usCities = getCitiesByCountry('US', 'New York', 20);
  assert(usCities.length > 0, `US New York search matched: ${usCities.length} cities`);
  const nyCity = usCities.find((c) => c.name === 'New York' || c.name === 'New York City');
  assert(Boolean(nyCity), 'New York / New York City resolved in US registry');
  assert(nyCity?.postalCode === '10001', `New York postal code resolved: ${nyCity?.postalCode}`);

  // 2c. Netherlands
  const nlCities = getCitiesByCountry('NL', 'Rotterdam', 10);
  const rotterdam = nlCities.find((c) => c.name === 'Rotterdam');
  assert(Boolean(rotterdam), 'Rotterdam resolved in Netherlands registry');
  assert(rotterdam?.postalCode === '3011', `Rotterdam postal code resolved: ${rotterdam?.postalCode}`);
  assert(rotterdam?.unLocode === 'NLRTM', `Rotterdam UN/LOCODE resolved: ${rotterdam?.unLocode}`);

  // 2d. United Arab Emirates
  const aeCities = getCitiesByCountry('AE', 'Dubai', 10);
  const dubai = aeCities.find((c) => c.name === 'Dubai');
  assert(Boolean(dubai), 'Dubai resolved in UAE registry');
  assert(dubai?.unLocode === 'AEDXB', `Dubai UN/LOCODE resolved: ${dubai?.unLocode}`);

  // 2e. Germany
  const deCities = getCitiesByCountry('DE', 'Hamburg', 10);
  const hamburg = deCities.find((c) => c.name === 'Hamburg');
  assert(Boolean(hamburg), 'Hamburg resolved in Germany registry');
  assert(hamburg?.postalCode === '20095', `Hamburg postal code resolved: ${hamburg?.postalCode}`);

  // ── TEST 3: Global Full-Text City Search ──────────────────────────────────
  console.log('\n--- 3. Testing Global Full-Text City Search ---');
  const globalMundra = searchCitiesGlobal('Mundra', 10);
  assert(globalMundra.length > 0, `Global search for 'Mundra' found ${globalMundra.length} results`);
  assert(globalMundra[0].countryCode === 'IN', `Mundra country code is ${globalMundra[0].countryCode}`);
  assert(globalMundra[0].postalCode === '370421', `Mundra postal code is ${globalMundra[0].postalCode}`);

  const globalSingapore = searchCitiesGlobal('Singapore', 5);
  assert(globalSingapore.length > 0, `Global search for 'Singapore' found ${globalSingapore.length} results`);

  // ── TEST 4: Postal Code Resolution Engine ─────────────────────────────────
  console.log('\n--- 4. Testing Postal Code Resolution Engine ---');
  const mumbaiPostal = await lookupPostalCode('IN', 'Mumbai');
  assert(mumbaiPostal.postalCode === '400001', `Mumbai postal lookup: ${mumbaiPostal.postalCode}`);

  const rotterdamPostal = await lookupPostalCode('NL', 'Rotterdam');
  assert(rotterdamPostal.postalCode === '3011', `Rotterdam postal lookup: ${rotterdamPostal.postalCode}`);

  const nyPostal = await lookupPostalCode('US', 'New York');
  assert(nyPostal.postalCode === '10001', `New York postal lookup: ${nyPostal.postalCode}`);

  console.log('\n================================================================');
  console.log(`VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGlobalCitiesVerification().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
