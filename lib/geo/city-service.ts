import { Country, State, City, ICountry, ICity } from 'country-state-city';
import { GlobalCityItem } from '@/lib/types';

export interface CountryInfo {
  code: string;
  name: string;
  flag: string;
  phonecode: string;
  currency: string;
  latitude: string;
  longitude: string;
}

// ─── Known Postal Code & UN/LOCODE Mappings for Major Logistics Hubs ─────────
const KNOWN_POSTAL_CODES: Record<string, Record<string, string>> = {
  IN: {
    'Mumbai': '400001',
    'Nhava Sheva': '400707',
    'Navi Mumbai': '400703',
    'Delhi': '110001',
    'New Delhi': '110001',
    'Bengaluru': '560001',
    'Bangalore': '560001',
    'Chennai': '600001',
    'Kolkata': '700001',
    'Hyderabad': '500001',
    'Pune': '411001',
    'Ahmedabad': '380001',
    'Surat': '395001',
    'Mundra': '370421',
    'Kandla': '370210',
    'Cochin': '682001',
    'Kochi': '682001',
    'Visakhapatnam': '530001',
    'Tuticorin': '628001',
    'Thoothukudi': '628001',
    'Jaipur': '302001',
    'Ludhiana': '141001',
    'Indore': '452001',
    'Nagpur': '440001',
    'Coimbatore': '641001',
    'Vadodara': '390001',
  },
  AE: {
    'Dubai': '00000',
    'Abu Dhabi': '00000',
    'Sharjah': '00000',
    'Jebel Ali': '00000',
    'Ajman': '00000',
    'Ras Al Khaimah': '00000',
    'Fujairah': '00000',
  },
  US: {
    'New York': '10001',
    'New York City': '10001',
    'Los Angeles': '90001',
    'Chicago': '60601',
    'Houston': '77001',
    'Long Beach': '90801',
    'Seattle': '98101',
    'Miami': '33101',
    'Atlanta': '30301',
    'Savannah': '31401',
    'Norfolk': '23501',
    'Dallas': '75201',
    'Oakland': '94601',
    'San Francisco': '94101',
    'Boston': '02101',
  },
  NL: {
    'Rotterdam': '3011',
    'Amsterdam': '1012',
    'The Hague': '2511',
    'Utrecht': '3511',
    'Eindhoven': '5611',
    'Tilburg': '5011',
    'Venlo': '5911',
  },
  DE: {
    'Hamburg': '20095',
    'Bremen': '28195',
    'Frankfurt': '60311',
    'Berlin': '10115',
    'Munich': '80331',
    'Duisburg': '47051',
    'Cologne': '50667',
    'Stuttgart': '70173',
  },
  GB: {
    'London': 'EC1A 1BB',
    'Southampton': 'SO14 2AQ',
    'Felixstowe': 'IP11 3SY',
    'Liverpool': 'L1 8JQ',
    'Manchester': 'M1 1AE',
    'Birmingham': 'B1 1BB',
    'Leeds': 'LS1 1UR',
  },
  SG: {
    'Singapore': '018989',
    'Jurong': '629563',
    'Changi': '819642',
  },
  SA: {
    'Riyadh': '11564',
    'Jeddah': '21442',
    'Dammam': '31411',
    'Jubail': '31951',
    'Yanbu': '41912',
  },
  CN: {
    'Shanghai': '200000',
    'Ningbo': '315000',
    'Shenzhen': '518000',
    'Guangzhou': '510000',
    'Qingdao': '266000',
    'Tianjin': '300000',
    'Xiamen': '361000',
    'Dalian': '116000',
    'Beijing': '100000',
  },
  JP: {
    'Tokyo': '100-0001',
    'Yokohama': '231-0005',
    'Osaka': '530-0001',
    'Kobe': '650-0001',
    'Nagoya': '460-0001',
  },
  AU: {
    'Sydney': '2000',
    'Melbourne': '3000',
    'Brisbane': '4000',
    'Fremantle': '6160',
    'Adelaide': '5000',
    'Perth': '6000',
  },
};

// Major UN/LOCODE mapping
const KNOWN_UNLOCODES: Record<string, string> = {
  'Mumbai': 'INBOM',
  'Nhava Sheva': 'INNSA',
  'Mundra': 'INMUN',
  'Chennai': 'INMAA',
  'Kolkata': 'INCCU',
  'Cochin': 'INCOK',
  'Kochi': 'INCOK',
  'Visakhapatnam': 'INVTZ',
  'Tuticorin': 'INTUT',
  'Kandla': 'INIXY',
  'Dubai': 'AEDXB',
  'Jebel Ali': 'AEJEA',
  'Abu Dhabi': 'AEAUH',
  'Sharjah': 'AESHJ',
  'Rotterdam': 'NLRTM',
  'Amsterdam': 'NLAMS',
  'Hamburg': 'DEHAM',
  'Bremen': 'DEBRE',
  'Bremerhaven': 'DEBRV',
  'Frankfurt': 'DEFRA',
  'Antwerp': 'BEANR',
  'Singapore': 'SGSIN',
  'Shanghai': 'CNSHA',
  'Ningbo': 'CNNGB',
  'Shenzhen': 'CNSZX',
  'Qingdao': 'CNTAO',
  'London': 'GBLON',
  'Southampton': 'GBSOU',
  'Felixstowe': 'GBFXT',
  'Liverpool': 'GBLIV',
  'New York': 'USNYC',
  'New York City': 'USNYC',
  'Los Angeles': 'USLAX',
  'Long Beach': 'USLGB',
  'Houston': 'USHOU',
  'Seattle': 'USSEA',
  'Savannah': 'USSAV',
  'Tokyo': 'JPTYO',
  'Yokohama': 'JPYOK',
  'Busan': 'KRPUS',
  'Seoul': 'KRSEL',
};

// ─── Public Core Geo Methods ────────────────────────────────────────────────

export function getAllCountries(): CountryInfo[] {
  const all = Country.getAllCountries();
  return all.map((c) => ({
    code: c.isoCode,
    name: c.name,
    flag: c.flag,
    phonecode: c.phonecode.startsWith('+') ? c.phonecode : `+${c.phonecode}`,
    currency: c.currency,
    latitude: c.latitude,
    longitude: c.longitude,
  }));
}

export function getCountryByCode(codeOrName: string): CountryInfo | null {
  if (!codeOrName) return null;
  const clean = codeOrName.trim().toUpperCase();
  const byIso = Country.getCountryByCode(clean);
  if (byIso) {
    return {
      code: byIso.isoCode,
      name: byIso.name,
      flag: byIso.flag,
      phonecode: byIso.phonecode.startsWith('+') ? byIso.phonecode : `+${byIso.phonecode}`,
      currency: byIso.currency,
      latitude: byIso.latitude,
      longitude: byIso.longitude,
    };
  }

  // Search by name
  const all = Country.getAllCountries();
  const match = all.find(
    (c) => c.name.toLowerCase() === codeOrName.trim().toLowerCase()
  );
  if (match) {
    return {
      code: match.isoCode,
      name: match.name,
      flag: match.flag,
      phonecode: match.phonecode.startsWith('+') ? match.phonecode : `+${match.phonecode}`,
      currency: match.currency,
      latitude: match.latitude,
      longitude: match.longitude,
    };
  }
  return null;
}

export function getCitiesByCountry(
  countryCodeOrName: string,
  query?: string,
  limit = 200
): GlobalCityItem[] {
  const country = getCountryByCode(countryCodeOrName);
  if (!country) return [];

  const rawCities = City.getCitiesOfCountry(country.code) || [];
  const stateMap = new Map<string, string>();
  const states = State.getStatesOfCountry(country.code) || [];
  states.forEach((s) => stateMap.set(s.isoCode, s.name));

  let filtered = rawCities;
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    filtered = rawCities.filter((c) => c.name.toLowerCase().includes(q));
  }

  const sliced = filtered.slice(0, limit);

  return sliced.map((c: ICity) => {
    const stateName = c.stateCode ? stateMap.get(c.stateCode) || c.stateCode : undefined;
    const knownPostal = KNOWN_POSTAL_CODES[country.code]?.[c.name];
    const unLocode = KNOWN_UNLOCODES[c.name];

    return {
      id: `${country.code}-${c.stateCode || 'XX'}-${c.name.replace(/\s+/g, '-').toLowerCase()}`,
      name: c.name,
      country: country.name,
      countryCode: country.code,
      state: stateName,
      stateCode: c.stateCode,
      latitude: c.latitude ? parseFloat(c.latitude) : undefined,
      longitude: c.longitude ? parseFloat(c.longitude) : undefined,
      postalCode: knownPostal,
      unLocode,
    };
  });
}

export function searchCitiesGlobal(query: string, limit = 50): GlobalCityItem[] {
  if (!query || query.trim().length < 2) return [];
  const q = query.trim().toLowerCase();
  const allCountries = Country.getAllCountries();
  const scoredResults: { item: GlobalCityItem; score: number }[] = [];

  for (const country of allCountries) {
    const cities = City.getCitiesOfCountry(country.isoCode) || [];
    for (const city of cities) {
      const cityNameLower = city.name.toLowerCase();
      if (cityNameLower.includes(q)) {
        const knownPostal = KNOWN_POSTAL_CODES[country.isoCode]?.[city.name];
        const unLocode = KNOWN_UNLOCODES[city.name];

        let score = 10;
        if (cityNameLower === q) {
          score = 100;
        } else if (cityNameLower.startsWith(q)) {
          score = 50;
        }
        if (unLocode) score += 15;
        if (knownPostal) score += 10;

        scoredResults.push({
          score,
          item: {
            id: `${country.isoCode}-${city.stateCode || 'XX'}-${city.name.replace(/\s+/g, '-').toLowerCase()}`,
            name: city.name,
            country: country.name,
            countryCode: country.isoCode,
            stateCode: city.stateCode,
            latitude: city.latitude ? parseFloat(city.latitude) : undefined,
            longitude: city.longitude ? parseFloat(city.longitude) : undefined,
            postalCode: knownPostal,
            unLocode,
          },
        });
      }
    }
  }

  scoredResults.sort((a, b) => b.score - a.score);
  return scoredResults.slice(0, limit).map((r) => r.item);
}

export async function lookupPostalCode(
  countryCode: string,
  postalCodeOrCity: string
): Promise<{ postalCode?: string; city?: string; state?: string; country?: string }> {
  if (!postalCodeOrCity || !countryCode) return {};

  const cleanCountry = countryCode.trim().toUpperCase();
  const cleanInput = postalCodeOrCity.trim();

  // 1. Check known local mapping
  const known = KNOWN_POSTAL_CODES[cleanCountry]?.[cleanInput];
  if (known) {
    return {
      postalCode: known,
      city: cleanInput,
      country: cleanCountry,
    };
  }

  // 2. Query free Zippopotam API if it looks like a postal code
  try {
    const isDigitsOrAlphanum = /^[A-Za-z0-9\s-]+$/.test(cleanInput);
    if (isDigitsOrAlphanum && cleanCountry) {
      const url = `https://api.zippopotam.us/${cleanCountry.toLowerCase()}/${encodeURIComponent(cleanInput)}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(1500) });
      if (resp.ok) {
        const data = await resp.json();
        const place = data.places?.[0];
        if (place) {
          return {
            postalCode: data['post code'] || cleanInput,
            city: place['place name'],
            state: place['state'],
            country: data['country'],
          };
        }
      }
    }
  } catch {}

  return {};
}
