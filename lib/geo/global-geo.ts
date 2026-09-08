/**
 * lib/geo/global-geo.ts
 * Comprehensive Global Geography & Dialing Service
 * Powered by country-state-city (250 Countries, 4,900+ States, 148,000+ Cities)
 * and Intl IANA Timezone Engine (418 Global Timezones)
 */

import { Country, State, City, ICountry, IState, ICity } from 'country-state-city';

export interface GlobalISDEntry {
  code: string;         // e.g. "+91"
  rawPhone: string;     // e.g. "91"
  isoCode: string;      // e.g. "IN"
  country: string;      // e.g. "India"
  flag: string;         // e.g. "🇮🇳"
  label: string;        // e.g. "IN +91 (India)"
  length?: number;      // standard mobile length if known
  pattern?: string;     // regex pattern
}

export interface GlobalTimezoneEntry {
  value: string;        // e.g. "Asia/Kolkata"
  label: string;        // e.g. "Asia/Kolkata (UTC +05:30)"
  offset: string;       // e.g. "UTC +05:30"
  region: string;       // e.g. "Asia"
}

// Priority trade corridor countries placed at top for freight efficiency
const PRIORITY_ISO_CODES = ['IN', 'US', 'AE', 'SG', 'GB', 'DE', 'NL', 'SA', 'CN', 'HK', 'JP', 'AU', 'KR', 'MY', 'VN', 'ID', 'TH', 'QA', 'FR', 'ES', 'IT', 'CA', 'BR', 'ZA', 'TR', 'EG'];

/**
 * Returns all ~250 countries and territories on Earth with ISD phone codes.
 * Formatted as: "IN +91 (India)" matching user UI/UX requirement.
 */
export function getAllGlobalISDCodes(): GlobalISDEntry[] {
  const allCountries = Country.getAllCountries();
  const seenCodes = new Set<string>();
  const priorityList: GlobalISDEntry[] = [];
  const otherList: GlobalISDEntry[] = [];

  for (const c of allCountries) {
    if (!c.phonecode) continue;

    // Clean phone code (strip extra characters, ensure leading +)
    const cleanDigits = c.phonecode.replace(/[^0-9]/g, '');
    if (!cleanDigits) continue;
    const formattedCode = `+${cleanDigits}`;

    const entry: GlobalISDEntry = {
      code: formattedCode,
      rawPhone: cleanDigits,
      isoCode: c.isoCode,
      country: c.name,
      flag: c.flag || '🌐',
      label: `${c.isoCode} ${formattedCode} (${c.name})`,
      length: cleanDigits === '91' ? 10 : cleanDigits === '1' ? 10 : undefined,
      pattern: cleanDigits === '91' ? '^[6-9]\\d{9}$' : undefined,
    };

    const key = `${c.isoCode}-${formattedCode}`;
    if (seenCodes.has(key)) continue;
    seenCodes.add(key);

    if (PRIORITY_ISO_CODES.includes(c.isoCode)) {
      priorityList.push(entry);
    } else {
      otherList.push(entry);
    }
  }

  // Sort priority list by order in PRIORITY_ISO_CODES, other list alphabetically
  priorityList.sort((a, b) => {
    const idxA = PRIORITY_ISO_CODES.indexOf(a.isoCode);
    const idxB = PRIORITY_ISO_CODES.indexOf(b.isoCode);
    return idxA - idxB;
  });

  otherList.sort((a, b) => a.country.localeCompare(b.country));

  return [...priorityList, ...otherList];
}

/**
 * Returns all ~250 countries on Earth.
 */
export function getAllGlobalCountries(): ICountry[] {
  return Country.getAllCountries();
}

/**
 * Returns all states/provinces for any country code on Earth.
 */
export function getStatesForCountry(countryCode: string): IState[] {
  if (!countryCode) return [];
  const states = State.getStatesOfCountry(countryCode);
  return [...states].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns all cities for a specific state.
 */
export function getCitiesForState(countryCode: string, stateCode: string): ICity[] {
  if (!countryCode || !stateCode) return [];
  const cities = City.getCitiesOfState(countryCode, stateCode);
  return [...(cities || [])].sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Returns cities for a country (e.g. if state is not specified).
 */
export function getCitiesForCountry(countryCode: string): ICity[] {
  if (!countryCode) return [];
  const cities = City.getCitiesOfCountry(countryCode);
  return [...(cities || [])].sort((a, b) => a.name.localeCompare(b.name));
}


/**
 * Returns all 418 official IANA timezones on Earth with live UTC offsets.
 */
export function getAllGlobalTimezones(): GlobalTimezoneEntry[] {
  try {
    let zones: string[] = [];
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      zones = (Intl as any).supportedValuesOf('timeZone');
    }

    if (!zones || zones.length === 0) {
      zones = [
        'Asia/Kolkata', 'Europe/Amsterdam', 'Asia/Dubai', 'Asia/Singapore',
        'Europe/London', 'America/New_York', 'America/Los_Angeles', 'America/Chicago',
        'Asia/Tokyo', 'Asia/Shanghai', 'Asia/Hong_Kong', 'Australia/Sydney',
        'Europe/Berlin', 'Europe/Paris', 'Africa/Cairo', 'Africa/Johannesburg',
      ];
    }

    const now = new Date();
    const result: GlobalTimezoneEntry[] = [];

    for (const z of zones) {
      try {
        // Compute offset formatted like UTC+05:30
        const formatter = new Intl.DateTimeFormat('en-US', {
          timeZone: z,
          timeZoneName: 'shortOffset',
        });
        const parts = formatter.formatToParts(now);
        const tzPart = parts.find((p) => p.type === 'timeZoneName');
        const offset = tzPart ? tzPart.value.replace('GMT', 'UTC') : 'UTC';

        const region = z.split('/')[0] || 'Global';
        result.push({
          value: z,
          label: `${z} (${offset})`,
          offset,
          region,
        });
      } catch {
        result.push({
          value: z,
          label: z,
          offset: 'UTC',
          region: z.split('/')[0] || 'Global',
        });
      }
    }

    // Sort with major trade hubs first, then alphabetically
    const priorityZones = ['Asia/Kolkata', 'Asia/Dubai', 'Asia/Singapore', 'Europe/London', 'Europe/Amsterdam', 'Europe/Berlin', 'America/New_York', 'America/Los_Angeles', 'Asia/Shanghai', 'Asia/Tokyo'];
    
    return result.sort((a, b) => {
      const idxA = priorityZones.indexOf(a.value);
      const idxB = priorityZones.indexOf(b.value);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.value.localeCompare(b.value);
    });
  } catch {
    return [
      { value: 'Asia/Kolkata', label: 'Asia/Kolkata (UTC +05:30)', offset: 'UTC +05:30', region: 'Asia' },
      { value: 'Europe/Amsterdam', label: 'Europe/Amsterdam (UTC +02:00)', offset: 'UTC +02:00', region: 'Europe' },
      { value: 'Asia/Dubai', label: 'Asia/Dubai (UTC +04:00)', offset: 'UTC +04:00', region: 'Asia' },
      { value: 'Asia/Singapore', label: 'Asia/Singapore (UTC +08:00)', offset: 'UTC +08:00', region: 'Asia' },
      { value: 'Europe/London', label: 'Europe/London (UTC +01:00)', offset: 'UTC +01:00', region: 'Europe' },
      { value: 'America/New_York', label: 'America/New_York (UTC -04:00)', offset: 'UTC -04:00', region: 'America' },
      { value: 'America/Los_Angeles', label: 'America/Los_Angeles (UTC -07:00)', offset: 'UTC -07:00', region: 'America' },
    ];
  }
}
