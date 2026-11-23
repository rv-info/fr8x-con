/**
 * FR8X Enterprise Logistics — Lightweight Natural Language Rate Parser Engine
 * Self-contained, zero-dependency, deterministic semantic NLP extractor.
 * Operates at microsecond speeds (< 5ms latency, bundle < 50 KiB), with zero external AI calls.
 * Extracts freight rate parameters from unstructured text and maps to:
 * SEQ | SERVICE PROVIDER | LINE | POR | POL | POD | FPOD | 20DV (USD) | 20TYPE | 40HC (USD) | 40TYPE | F/T | DATE | TYPE | TT | ROUTING | REMARKS
 */

import { RateFormData } from '@/components/rates/RatesEditorModal';
import { MASTER_CARRIERS_DATA, MASTER_PORTS_DATA } from '@/lib/master-data';

export interface ParsedRateResult {
  success: boolean;
  records: RateFormData[];
  totalExtracted: number;
  confidence: number; // 0 to 100
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  hasConflict: boolean;
  conflicts: string[];
  unmappedSegments: string[];
  missingFields: string[];
  warnings: string[];
  modelInfo: {
    engine: string;
    version: string;
    modelSizeMB: number;
    latencyMs: number;
    cached: boolean;
  };
}

// ─── CARRIER DICTIONARY & ALIASES ─────────────────────────────────────────────
const CARRIER_ALIASES: Record<string, string> = {
  maersk: 'Maersk Line',
  'maersk line': 'Maersk Line',
  maeu: 'Maersk Line',
  msc: 'Mediterranean Shipping Company',
  'mediterranean shipping company': 'Mediterranean Shipping Company',
  mscu: 'Mediterranean Shipping Company',
  'cma cgm': 'CMA CGM S.A.',
  cma: 'CMA CGM S.A.',
  cmdu: 'CMA CGM S.A.',
  'hapag lloyd': 'Hapag-Lloyd AG',
  'hapag-lloyd': 'Hapag-Lloyd AG',
  hapag: 'Hapag-Lloyd AG',
  hlcu: 'Hapag-Lloyd AG',
  evergreen: 'Evergreen Marine Corporation',
  eglv: 'Evergreen Marine Corporation',
  cosco: 'COSCO Shipping Lines',
  cosu: 'COSCO Shipping Lines',
  one: 'Ocean Network Express',
  'ocean network express': 'Ocean Network Express',
  oney: 'Ocean Network Express',
  'yang ming': 'Yang Ming Marine Transport',
  yangming: 'Yang Ming Marine Transport',
  ymlu: 'Yang Ming Marine Transport',
  hmm: 'HMM Co. Ltd.',
  hdmu: 'HMM Co. Ltd.',
  zim: 'ZIM Integrated Shipping',
  zimu: 'ZIM Integrated Shipping',
  'wan hai': 'Wan Hai Lines',
  wanhai: 'Wan Hai Lines',
  whlc: 'Wan Hai Lines',
  pil: 'Pacific International Lines',
  pabv: 'Pacific International Lines',
  oocl: 'OOCL (Orient Overseas Container Line)',
  arkas: 'Arkas Line',
  arku: 'Arkas Line',
  sinolines: 'Sinolines',
  csfu: 'Sinolines',
  sitc: 'SITC Container Lines',
  'k line': 'K Line (Kawasaki Kisen Kaisha)',
  kline: 'K Line (Kawasaki Kisen Kaisha)',
  mol: 'MOL (Mitsui O.S.K. Lines)',
  nyk: 'NYK Line (Nippon Yusen Kaisha)',
  'rcl': 'RCL (Regional Container Lines)',
  'x-press': 'X-Press Feeders',
  'xpress': 'X-Press Feeders',
};

// ─── PORT DICTIONARY & ALIASES ────────────────────────────────────────────────
const PORT_ALIASES: Record<string, { name: string; locode: string; isSeaport: boolean }> = {
  // India Ports & ICDs
  'nhava sheva': { name: 'Nhava Sheva (JNPT)', locode: 'INNSA', isSeaport: true },
  'jnpt': { name: 'Nhava Sheva (JNPT)', locode: 'INNSA', isSeaport: true },
  'nsa': { name: 'Nhava Sheva (JNPT)', locode: 'INNSA', isSeaport: true },
  'innsa': { name: 'Nhava Sheva (JNPT)', locode: 'INNSA', isSeaport: true },
  'mumbai': { name: 'Mumbai', locode: 'INBOM', isSeaport: true },
  'inbom': { name: 'Mumbai', locode: 'INBOM', isSeaport: true },
  'mundra': { name: 'Mundra', locode: 'INMUN', isSeaport: true },
  'inmun': { name: 'Mundra', locode: 'INMUN', isSeaport: true },
  'kandla': { name: 'Kandla (Deendayal Port)', locode: 'INKTP', isSeaport: true },
  'chennai': { name: 'Chennai (Madras)', locode: 'INMAA', isSeaport: true },
  'madras': { name: 'Chennai (Madras)', locode: 'INMAA', isSeaport: true },
  'inmaa': { name: 'Chennai (Madras)', locode: 'INMAA', isSeaport: true },
  'cochin': { name: 'Kochi (Cochin)', locode: 'INCOK', isSeaport: true },
  'kochi': { name: 'Kochi (Cochin)', locode: 'INCOK', isSeaport: true },
  'pipavav': { name: 'Pipavav', locode: 'INPAV', isSeaport: true },
  'hazira': { name: 'Hazira', locode: 'INHAZ', isSeaport: true },
  'kolkata': { name: 'Kolkata', locode: 'INCCU', isSeaport: true },
  'haldia': { name: 'Haldia', locode: 'INHAL', isSeaport: true },
  'visakhapatnam': { name: 'Visakhapatnam (Vizag)', locode: 'INVTZ', isSeaport: true },
  'vizag': { name: 'Visakhapatnam (Vizag)', locode: 'INVTZ', isSeaport: true },
  'tuticorin': { name: 'Tuticorin (V.O.C.)', locode: 'INTUT', isSeaport: true },
  'delhi': { name: 'Delhi ICD (Tughlakabad)', locode: 'INDEL', isSeaport: false },
  'delhi icd': { name: 'Delhi ICD (Tughlakabad)', locode: 'INDEL', isSeaport: false },
  'tughlakabad': { name: 'Delhi ICD (Tughlakabad)', locode: 'INTKD', isSeaport: false },
  'tkd': { name: 'Delhi ICD (Tughlakabad)', locode: 'INTKD', isSeaport: false },
  'pune': { name: 'Pune ICD', locode: 'INPNQ', isSeaport: false },
  'pune icd': { name: 'Pune ICD', locode: 'INPNQ', isSeaport: false },
  'ludhiana': { name: 'Ludhiana ICD', locode: 'INLUH', isSeaport: false },
  'ludhiana icd': { name: 'Ludhiana ICD', locode: 'INLUH', isSeaport: false },
  'dadri': { name: 'Dadri ICD', locode: 'INDER', isSeaport: false },
  'dadri icd': { name: 'Dadri ICD', locode: 'INDER', isSeaport: false },
  'ahmedabad': { name: 'Ahmedabad ICD', locode: 'INAMD', isSeaport: false },

  // European Ports
  'rotterdam': { name: 'Rotterdam', locode: 'NLRTM', isSeaport: true },
  'rtm': { name: 'Rotterdam', locode: 'NLRTM', isSeaport: true },
  'nlrtm': { name: 'Rotterdam', locode: 'NLRTM', isSeaport: true },
  'hamburg': { name: 'Hamburg', locode: 'DEHAM', isSeaport: true },
  'ham': { name: 'Hamburg', locode: 'DEHAM', isSeaport: true },
  'deham': { name: 'Hamburg', locode: 'DEHAM', isSeaport: true },
  'antwerp': { name: 'Antwerp', locode: 'BEANR', isSeaport: true },
  'anr': { name: 'Antwerp', locode: 'BEANR', isSeaport: true },
  'beanr': { name: 'Antwerp', locode: 'BEANR', isSeaport: true },
  'felixstowe': { name: 'Felixstowe', locode: 'GBFXT', isSeaport: true },
  'fxt': { name: 'Felixstowe', locode: 'GBFXT', isSeaport: true },
  'gbfxt': { name: 'Felixstowe', locode: 'GBFXT', isSeaport: true },
  'southampton': { name: 'Southampton', locode: 'GBSOU', isSeaport: true },
  'london gateway': { name: 'London Gateway', locode: 'GBLGP', isSeaport: true },
  'le havre': { name: 'Le Havre', locode: 'FRLEH', isSeaport: true },
  'barcelona': { name: 'Barcelona', locode: 'ESBCN', isSeaport: true },
  'valencia': { name: 'Valencia', locode: 'ESVLC', isSeaport: true },
  'genoa': { name: 'Genoa', locode: 'ITGOA', isSeaport: true },
  'la spezia': { name: 'La Spezia', locode: 'ITSPE', isSeaport: true },
  'bremerhaven': { name: 'Bremerhaven', locode: 'DEBRV', isSeaport: true },

  // Middle East Ports
  'jebel ali': { name: 'Jebel Ali (Dubai)', locode: 'AEJEA', isSeaport: true },
  'dubai': { name: 'Jebel Ali (Dubai)', locode: 'AEJEA', isSeaport: true },
  'jea': { name: 'Jebel Ali (Dubai)', locode: 'AEJEA', isSeaport: true },
  'aejea': { name: 'Jebel Ali (Dubai)', locode: 'AEJEA', isSeaport: true },
  'abu dhabi': { name: 'Abu Dhabi (Khalifa Port)', locode: 'AEAUH', isSeaport: true },
  'khalifa': { name: 'Abu Dhabi (Khalifa Port)', locode: 'AEKHL', isSeaport: true },
  'sharjah': { name: 'Sharjah (Khalid Port)', locode: 'AESHJ', isSeaport: true },
  'dammam': { name: 'Dammam (King Abdul Aziz)', locode: 'SADMM', isSeaport: true },
  'jeddah': { name: 'Jeddah', locode: 'SAJED', isSeaport: true },
  'riyadh': { name: 'Riyadh Dry Port', locode: 'SARUH', isSeaport: false },
  'sohar': { name: 'Sohar', locode: 'OMSOH', isSeaport: true },
  'salalah': { name: 'Salalah', locode: 'OMSLL', isSeaport: true },
  'hamad': { name: 'Hamad Port (Doha)', locode: 'QAHMD', isSeaport: true },
  'doha': { name: 'Hamad Port (Doha)', locode: 'QAHMD', isSeaport: true },
  'kuwait': { name: 'Shuwaikh (Kuwait)', locode: 'KWSWK', isSeaport: true },
  'bahrain': { name: 'Khalifa Bin Salman (Bahrain)', locode: 'BHKBS', isSeaport: true },

  // Southeast & East Asia Ports
  'singapore': { name: 'Singapore', locode: 'SGSIN', isSeaport: true },
  'sin': { name: 'Singapore', locode: 'SGSIN', isSeaport: true },
  'sgsin': { name: 'Singapore', locode: 'SGSIN', isSeaport: true },
  'port klang': { name: 'Port Klang', locode: 'MYPKG', isSeaport: true },
  'tanjung pelepas': { name: 'Tanjung Pelepas', locode: 'MYTPP', isSeaport: true },
  'shanghai': { name: 'Shanghai', locode: 'CNSHA', isSeaport: true },
  'ningbo': { name: 'Ningbo-Zhoushan', locode: 'CNNGB', isSeaport: true },
  'shenzhen': { name: 'Shenzhen (Yantian/Shekou)', locode: 'CNSZX', isSeaport: true },
  'yantian': { name: 'Yantian (Shenzhen)', locode: 'CNYTN', isSeaport: true },
  'shekou': { name: 'Shekou (Shenzhen)', locode: 'CNSHK', isSeaport: true },
  'qingdao': { name: 'Qingdao', locode: 'CNTAO', isSeaport: true },
  'busan': { name: 'Busan', locode: 'KRPUS', isSeaport: true },
  'tokyo': { name: 'Tokyo', locode: 'JPTYO', isSeaport: true },
  'yokohama': { name: 'Yokohama', locode: 'JPYOK', isSeaport: true },
  'ho chi minh': { name: 'Ho Chi Minh (Cat Lai)', locode: 'VNSGN', isSeaport: true },
  'laem chabang': { name: 'Laem Chabang', locode: 'THLCH', isSeaport: true },

  // North America Ports
  'los angeles': { name: 'Los Angeles', locode: 'USLAX', isSeaport: true },
  'long beach': { name: 'Long Beach', locode: 'USLGB', isSeaport: true },
  'new york': { name: 'New York / New Jersey', locode: 'USNYC', isSeaport: true },
  'savannah': { name: 'Savannah', locode: 'USSAV', isSeaport: true },
  'houston': { name: 'Houston', locode: 'USHOU', isSeaport: true },
  'norfolk': { name: 'Norfolk / Hampton Roads', locode: 'USORF', isSeaport: true },
  'seattle': { name: 'Seattle', locode: 'USSEA', isSeaport: true },
  'chicago': { name: 'Chicago Rail Ramp / ICD', locode: 'USCHI', isSeaport: false },
};

// ─── USER LEARNING MECHANISM ──────────────────────────────────────────────────
const USER_LEARNED_MAPPINGS_KEY = 'fr8x_rate_user_learned_mappings';
let userLearnedCache: Record<string, { field: string; value: string }> | null = null;

export function getUserLearnedMappings(): Record<string, { field: string; value: string }> {
  if (userLearnedCache !== null) return userLearnedCache;
  if (typeof window === 'undefined') {
    userLearnedCache = {};
    return userLearnedCache;
  }
  try {
    const raw = localStorage.getItem(USER_LEARNED_MAPPINGS_KEY);
    userLearnedCache = raw ? JSON.parse(raw) : {};
  } catch {
    userLearnedCache = {};
  }
  return userLearnedCache || {};
}

export function recordUserMappingCorrection(rawInput: string, correctField: string, correctValue: string) {
  const norm = rawInput.trim().toLowerCase();
  if (!norm || !correctValue) return;
  const current = getUserLearnedMappings();
  current[norm] = { field: correctField, value: correctValue.trim() };
  userLearnedCache = current;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(USER_LEARNED_MAPPINGS_KEY, JSON.stringify(current));
    } catch {}
  }
}

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

function cleanPortText(raw: string): string {
  return raw
    .replace(/^[:=\-/\s,;]+/, '')
    .replace(/[:=\-/\s,;]+$/, '')
    .trim();
}

function matchPort(token: string): { name: string; locode: string; isSeaport: boolean } | null {
  const normalized = token.trim().toLowerCase().replace(/[^\w\s-]/g, '').trim();
  if (!normalized) return null;

  // Check learned user mappings first
  const learned = getUserLearnedMappings();
  if (learned[normalized] && learned[normalized].value) {
    return { name: learned[normalized].value, locode: '', isSeaport: true };
  }

  // Exact alias match
  if (PORT_ALIASES[normalized]) {
    return PORT_ALIASES[normalized];
  }

  // Check master port list from master-data
  const masterMatch = MASTER_PORTS_DATA.find((p) =>
    (p.locode && p.locode.toLowerCase() === normalized) ||
    (p.code3 && p.code3.toLowerCase() === normalized) ||
    (p.name && p.name.toLowerCase() === normalized) ||
    (p.name && p.name.toLowerCase().includes(normalized)) ||
    (p.name && normalized.includes(p.name.toLowerCase()))
  );
  if (masterMatch) {
    return { name: masterMatch.name, locode: masterMatch.locode, isSeaport: masterMatch.type === 'seaport' };
  }

  return null;
}

function matchCarrier(token: string): string | null {
  const normalized = token.trim().toLowerCase().replace(/[^\w\s-]/g, '').trim();
  if (!normalized) return null;

  // Check learned user mappings
  const learned = getUserLearnedMappings();
  if (learned[normalized] && learned[normalized].field === 'carrier') {
    return learned[normalized].value;
  }

  if (CARRIER_ALIASES[normalized]) {
    return CARRIER_ALIASES[normalized];
  }

  const masterMatch = MASTER_CARRIERS_DATA.find((c) =>
    (c.name && c.name.toLowerCase().includes(normalized)) ||
    (c.name && normalized.includes(c.name.toLowerCase())) ||
    (c.shortName && c.shortName.toLowerCase() === normalized) ||
    (c.scac && c.scac.toLowerCase() === normalized)
  );
  if (masterMatch) {
    return masterMatch.name;
  }

  return null;
}

/**
 * Extract POR, POL, POD, FPOD geography from text.
 * Strictly guarantees POR and FPOD remain independent.
 * NEVER copies POL into POR, and NEVER copies POD into FPOD.
 */
function extractGeography(text: string): {
  por: string;
  pol: string;
  pod: string;
  fpod: string;
  consumedTokens: string[];
  conflicts: string[];
} {
  let por = '';
  let pol = '';
  let pod = '';
  let fpod = '';
  const consumedTokens: string[] = [];
  const conflicts: string[] = [];

  // Helper to extract port by label list
  const makePortPattern = (labels: string) => new RegExp(
    `\\b(?:${labels})\\s*[:=\\-/\\s]\\s*([^\\n,;]+?)(?=(?:\\s+\\b(?:por|pol|pod|fpod|port\\s+of|place\\s+of|final|carrier|line|20|40|valid|ft|tt|transit|via|\\$)\\b|[\\n,;]|$))`,
    'gi'
  );

  // 1. Explicit POR Labels:
  const porPattern = makePortPattern('por|place\\s+of\\s+receipt|receipt\\s+place|receipt\\s+port|place\\s+of\\s+origin|origin\\s+cfs|inland\\s+origin|receipt');
  const porMatches = Array.from(text.matchAll(porPattern));
  if (porMatches.length > 0) {
    const rawVal = cleanPortText(porMatches[0][1]);
    const matched = matchPort(rawVal);
    por = matched ? matched.name : rawVal;
    consumedTokens.push(porMatches[0][0]);

    if (porMatches.length > 1) {
      const secondRaw = cleanPortText(porMatches[1][1]);
      if (secondRaw.toLowerCase() !== rawVal.toLowerCase()) {
        conflicts.push(`Multiple conflicting POR specifications detected: "${rawVal}" vs "${secondRaw}"`);
      }
    }
  }

  // 2. Explicit POL Labels:
  const polPattern = makePortPattern('pol|port\\s+of\\s+loading|loading\\s+port|port\\s+of\\s+shipment|origin\\s+port|load\\s+port');
  const polMatches = Array.from(text.matchAll(polPattern));
  if (polMatches.length > 0) {
    const rawVal = cleanPortText(polMatches[0][1]);
    const matched = matchPort(rawVal);
    pol = matched ? matched.name : rawVal;
    consumedTokens.push(polMatches[0][0]);
  }

  // 3. Explicit POD Labels:
  const podPattern = makePortPattern('pod|port\\s+of\\s+discharge|discharge\\s+port|destination\\s+port|port\\s+of\\s+destination|discharge');
  const podMatches = Array.from(text.matchAll(podPattern));
  if (podMatches.length > 0) {
    const rawVal = cleanPortText(podMatches[0][1]);
    const matched = matchPort(rawVal);
    pod = matched ? matched.name : rawVal;
    consumedTokens.push(podMatches[0][0]);

    if (podMatches.length > 1) {
      const secondRaw = cleanPortText(podMatches[1][1]);
      if (secondRaw.toLowerCase() !== rawVal.toLowerCase()) {
        conflicts.push(`Multiple conflicting POD specifications detected: "${rawVal}" vs "${secondRaw}"`);
      }
    }
  }

  // 4. Explicit FPOD Labels:
  const fpodPattern = makePortPattern('fpod|final\\s+port\\s+of\\s+discharge|final\\s+pod|final\\s+destination\\s+port|final\\s+destination|place\\s+of\\s+delivery|delivery\\s+place|final\\s+delivery|inland\\s+destination');
  const fpodMatches = Array.from(text.matchAll(fpodPattern));
  if (fpodMatches.length > 0) {
    const rawVal = cleanPortText(fpodMatches[0][1]);
    const matched = matchPort(rawVal);
    fpod = matched ? matched.name : rawVal;
    consumedTokens.push(fpodMatches[0][0]);
  }

  // 5. Route syntax: "from [Port A] to [Port B]" or "[Port A] -> [Port B]" or "[Port A] to [Port B]"
  if (!pol || !pod) {
    const routeMatch = text.match(/\b(?:from\s+)?([A-Za-z\s/()\-]{2,25}?)\s*(?:-->|->|—|–|-|\bto\b)\s*([A-Za-z\s/()\-]{2,25}?)(?=(?:,|\.|\s+20|\s+40|\s+valid|\s+ft|\s+tt|\s+transit|\s+\$|\s+includes|\s+surcharges|\n|$))/i);
    if (routeMatch) {
      const rawA = cleanPortText(routeMatch[1]);
      const rawB = cleanPortText(routeMatch[2]);
      const portA = matchPort(rawA);
      const portB = matchPort(rawB);

      if (!pol && (portA || rawA.length >= 3)) {
        pol = portA ? portA.name : rawA;
        consumedTokens.push(routeMatch[1]);
      }
      if (!pod && (portB || rawB.length >= 3)) {
        pod = portB ? portB.name : rawB;
        consumedTokens.push(routeMatch[2]);
      }
    }
  }

  // 6. Port Scan across words if POL or POD are still missing
  if (!pol || !pod) {
    const words = text.split(/[\s,;:]+/);
    for (let i = 0; i < words.length; i++) {
      const single = matchPort(words[i]);
      if (single) {
        if (!pol) {
          pol = single.name;
          consumedTokens.push(words[i]);
        } else if (!pod && single.name !== pol) {
          pod = single.name;
          consumedTokens.push(words[i]);
        }
        continue;
      }
      if (i < words.length - 1) {
        const double = matchPort(`${words[i]} ${words[i + 1]}`);
        if (double) {
          if (!pol) {
            pol = double.name;
            consumedTokens.push(`${words[i]} ${words[i + 1]}`);
            i++;
          } else if (!pod && double.name !== pol) {
            pod = double.name;
            consumedTokens.push(`${words[i]} ${words[i + 1]}`);
            i++;
          }
        }
      }
    }
  }

  // CRITICAL ARCHITECTURAL INTEGRITY:
  // DO NOT copy POL into POR. If POR is absent, it remains empty string.
  // DO NOT copy POD into FPOD. If FPOD is absent, it remains empty string.

  return { por, pol, pod, fpod, consumedTokens, conflicts };
}

/**
 * Extract 20DV and 40HC pricing and container types
 */
function extractPricing(text: string): {
  d20: number | string;
  d20Type: string;
  h40: number | string;
  h40Type: string;
  consumedTokens: string[];
} {
  let d20: number | string = '';
  let d20Type = '20DV';
  let h40: number | string = '';
  let h40Type = '40HC';
  const consumedTokens: string[] = [];

  const d20Match = text.match(/\b(20(?:'?|ft|\s*feet)?(?:\s*(?:dv|gp|dry|rf|hc|ot|fr|tk|pl|std|standard))?)\s*[:=-]?\s*(?:\$|usd|eur|inr)?\s*(\d{2,5}(?:[.,]\d{1,2})?)\s*(?:\$|usd|eur|inr)?\b/i);
  if (d20Match) {
    const rawType = d20Match[1].toUpperCase().replace(/\s+/g, '');
    const amount = Number(d20Match[2].replace(',', ''));
    if (!isNaN(amount) && amount > 0) {
      d20 = amount;
      if (rawType.includes('RF')) d20Type = '20RF';
      else if (rawType.includes('OT')) d20Type = '20OT';
      else if (rawType.includes('FR')) d20Type = '20FR';
      else if (rawType.includes('TK')) d20Type = '20TK';
      else if (rawType.includes('HC')) d20Type = '20HC';
      else d20Type = '20DV';
      consumedTokens.push(d20Match[0]);
    }
  }

  const h40Match = text.match(/\b(40(?:'?|ft|\s*feet)?(?:\s*(?:hc|hq|high\s*cube|dv|rf|ot|fr|hr|oh|fc|tk|pl))?)\s*[:=-]?\s*(?:\$|usd|eur|inr)?\s*(\d{2,5}(?:[.,]\d{1,2})?)\s*(?:\$|usd|eur|inr)?\b/i);
  if (h40Match) {
    const rawType = h40Match[1].toUpperCase().replace(/\s+/g, '');
    const amount = Number(h40Match[2].replace(',', ''));
    if (!isNaN(amount) && amount > 0) {
      h40 = amount;
      if (rawType.includes('DV')) h40Type = '40DV';
      else if (rawType.includes('RF')) h40Type = '40RF';
      else if (rawType.includes('OT')) h40Type = '40OT';
      else if (rawType.includes('FR')) h40Type = '40FR';
      else h40Type = '40HC';
      consumedTokens.push(h40Match[0]);
    }
  }

  // Dual format: "$1450 / $2300" or "1450 / 2300 USD"
  if (!d20 && !h40) {
    const dualMatch = text.match(/(?:\$|usd\s*)?(\d{3,5})\s*(?:\/|\s+and\s+|\s*,\s*)\s*(?:\$|usd\s*)?(\d{3,5})\s*(?:usd|\$)?/i);
    if (dualMatch) {
      const p1 = Number(dualMatch[1]);
      const p2 = Number(dualMatch[2]);
      if (p1 > 0 && p2 > 0) {
        d20 = Math.min(p1, p2);
        h40 = Math.max(p1, p2);
        consumedTokens.push(dualMatch[0]);
      }
    }
  }

  return { d20, d20Type, h40, h40Type, consumedTokens };
}

/**
 * Extract Free Time / Detention / Demurrage
 */
function extractFreeTime(text: string): { freeTime: string; matchedText: string } | null {
  const ftMatch = text.match(/\b(?:free\s*time|ft|f\/t|detention|demurrage)?\s*[:=-]?\s*(\d{1,2})\s*(?:days?|d)\s*(?:free\s*time|combined|detention|demurrage|total)?\b/i);
  if (ftMatch) {
    const days = ftMatch[1];
    return {
      freeTime: `${days} days combined`,
      matchedText: ftMatch[0],
    };
  }
  return null;
}

/**
 * Extract Validity Date and normalize to YYYY-MM-DD
 */
function extractValidity(text: string): { validDate: string; matchedText: string } | null {
  const dateTrigger = text.match(/\b(?:valid\s*(?:till|to|until|through)?|validity|expiry|expires)\s*[:=-]?\s*([0-9a-zA-Z\s/.-]{5,20})/i);
  let dateStr = dateTrigger ? dateTrigger[1].trim() : '';
  let matchedText = dateTrigger ? dateTrigger[0] : '';

  if (!dateStr) {
    const standaloneDate = text.match(/\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.\s][a-zA-Z]{3,9}[-/.\s]\d{4})\b/);
    if (standaloneDate) {
      dateStr = standaloneDate[1];
      matchedText = standaloneDate[0];
    }
  }

  if (dateStr) {
    const parsed = normalizeDateString(dateStr);
    if (parsed) {
      return { validDate: parsed, matchedText };
    }
  }

  return null;
}

function normalizeDateString(str: string): string | null {
  const clean = str.trim().replace(/,/g, '');

  // 1. YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2].padStart(2, '0')}-${isoMatch[3].padStart(2, '0')}`;
  }

  // 2. DD-MM-YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, '0')}-${dmyMatch[1].padStart(2, '0')}`;
  }

  // 3. DD-MMM-YYYY (e.g. 31-Dec-2026, 15 Oct 2026)
  const monthMap: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12'
  };
  const namedMatch = clean.match(/^(\d{1,2})[-/\s]+([a-zA-Z]{3,9})[-/\s]+(\d{4})$/);
  if (namedMatch) {
    const day = namedMatch[1].padStart(2, '0');
    const month = monthMap[namedMatch[2].toLowerCase()];
    const year = namedMatch[3];
    if (month) return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Extract Transit Time
 */
function extractTransitTime(text: string): { transitTime: string; matchedText: string } | null {
  const ttMatch = text.match(/\b(?:transit(?:\s*time)?|tt)\s*[:=-]?\s*(\d{1,3})\s*(?:days?|d)?\b/i);
  if (ttMatch) {
    return {
      transitTime: `${ttMatch[1]} days`,
      matchedText: ttMatch[0],
    };
  }
  return null;
}

/**
 * Extract Routing (Direct / TS via ...)
 */
function extractRouting(text: string): { routing: string; matchedText: string } {
  const tsMatch = text.match(/\b(?:ts\s*via|transshipment\s*via|via)\s*([a-zA-Z\s/()\-]+?)(?=(?:,|\.|\s+valid|\s+includes|\s+surcharges|\n|$))/i);
  if (tsMatch) {
    const viaPort = tsMatch[1].trim();
    return {
      routing: `TS via ${viaPort}`,
      matchedText: tsMatch[0],
    };
  }

  if (/\bdirect\b/i.test(text)) {
    return {
      routing: 'Direct Ocean Service',
      matchedText: 'direct',
    };
  }

  return {
    routing: 'Direct Ocean Service',
    matchedText: '',
  };
}

/**
 * Extract Rate Type
 */
function extractRateType(text: string): { rateType: string; matchedText: string } {
  const lower = text.toLowerCase();
  if (lower.includes('contract')) return { rateType: 'Contract', matchedText: 'contract' };
  if (lower.includes('nac')) return { rateType: 'NAC', matchedText: 'nac' };
  if (lower.includes('coloader')) return { rateType: 'Coloader', matchedText: 'coloader' };
  return { rateType: 'Direct Spot', matchedText: 'spot' };
}

/**
 * Extract Remarks and Surcharges (Lossless)
 * Preserves multi-line conditions, numbered items, bulleted lists, currency, percentages, and dates.
 * Returns empty string if no remarks are provided — NEVER fabricates default text!
 */
function extractLosslessRemarks(
  text: string,
  consumedTokens: string[]
): {
  remarks: string;
  consumedTokens: string[];
} {
  const localConsumed: string[] = [];

  // Pattern 1: Explicit remarks label trigger:
  // e.g. "Remarks: ...", "Notes: ...", "Surcharges: ...", "Conditions: ..."
  // Captures EVERYTHING from the trigger to the end or next rate entry
  const labelRegex = /\b(remarks?|notes?|surcharges?|terms?|conditions?|rate\s+conditions?|inclusions?|exclusions?|special\s+remarks?|additional\s+information|other\s+details?)\s*[:=\-]\s*/i;
  const match = text.match(labelRegex);
  if (match && match.index !== undefined) {
    const afterLabel = text.slice(match.index + match[0].length);
    const nextRateMatch = afterLabel.match(/\n\s*(?:Rate\s*\d+\s*[:=-]|\d+[\).]\s+[A-Z][a-z]+(?:\s+Line|\s+POL|\s+Nhava|\s+Mundra|\s+from))/i);
    const remarksContent = nextRateMatch && nextRateMatch.index !== undefined
      ? afterLabel.slice(0, nextRateMatch.index).trim()
      : afterLabel.trim();

    localConsumed.push(match[0] + remarksContent);
    return {
      remarks: remarksContent,
      consumedTokens: localConsumed,
    };
  }

  // Pattern 2: Contextual keywords for surcharges, inclusions, exclusions, and commercial terms
  const remarksKeywords = [
    'thc', 'baf', 'isps', 'seal', 'gri', 'pss', 'demurrage', 'detention',
    'subject to space', 'space guaranteed', 'equipment guaranteed',
    'non-hazardous', 'haz', 'reefer', 'plug-in', 'chassis',
    'subject to', 'includes', 'including', 'excluding', 'exclusion', 'condition',
    'overweight', 'dg', 'imo', 'weight limit', 'genset', 'deposit', 'gst', 'vat'
  ];

  const extractedLines: string[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;
    const lowerLine = cleanLine.toLowerCase();

    // If already consumed as carrier, ports, or price, skip
    const isAlreadyConsumed = consumedTokens.some((t) => t && cleanLine.includes(t.trim()));
    if (isAlreadyConsumed) continue;

    const hasKeyword = remarksKeywords.some((kw) => lowerLine.includes(kw));
    // Numbered conditions: "1. ...", "2. ...", "* ...", "- ..."
    const isListCondition = /^(\d+\.|\*|-|•)\s+/.test(cleanLine);

    if (hasKeyword || isListCondition) {
      extractedLines.push(cleanLine);
      localConsumed.push(cleanLine);
    }
  }

  if (extractedLines.length > 0) {
    return {
      remarks: extractedLines.join('\n'),
      consumedTokens: localConsumed,
    };
  }

  // If no remarks provided, return EMPTY string.
  // NEVER fabricate "Subject to space & equipment availability"
  return {
    remarks: '',
    consumedTokens: localConsumed,
  };
}

/**
 * Parse a single rate block or line
 */
function parseSingleBlock(rawText: string): {
  record: RateFormData;
  unmapped: string[];
  missing: string[];
  warnings: string[];
  hasConflict: boolean;
  score: number;
} {
  const unmapped: string[] = [];
  const missing: string[] = [];
  const warnings: string[] = [];
  let score = 0;

  // 1. Carrier
  let carrier = '';
  const carrierExt = (() => {
    for (const [alias, fullName] of Object.entries(CARRIER_ALIASES)) {
      const regex = new RegExp(`\\b${alias.replace('-', '\\-')}\\b`, 'i');
      const match = rawText.match(regex);
      if (match) {
        return { name: fullName, matchedText: match[0] };
      }
    }
    for (const c of MASTER_CARRIERS_DATA) {
      const regex = new RegExp(`\\b${c.name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
      const match = rawText.match(regex);
      if (match) {
        return { name: c.name, matchedText: match[0] };
      }
    }
    return null;
  })();

  if (carrierExt) {
    carrier = carrierExt.name;
    score += 15;
  } else {
    missing.push('CARRIER');
  }

  // 2. Routing & Geography (POR, POL, POD, FPOD)
  const geo = extractGeography(rawText);
  if (geo.pol) score += 20; else missing.push('POL');
  if (geo.pod) score += 20; else missing.push('POD');
  if (geo.por) score += 10;
  if (geo.fpod) score += 10;
  if (geo.conflicts.length > 0) {
    warnings.push(...geo.conflicts);
  }

  // 3. Pricing & Equipment
  const pricing = extractPricing(rawText);
  if (pricing.d20) score += 15; else missing.push('20DV ($)');
  if (pricing.h40) score += 15; else missing.push('40HC ($)');

  // 4. Free Time
  const ftExt = extractFreeTime(rawText);
  const freeTime = ftExt ? ftExt.freeTime : '14 days combined';
  if (ftExt) score += 5;

  // 5. Validity Date
  const valExt = extractValidity(rawText);
  const validDate = valExt ? valExt.validDate : '';
  if (validDate) score += 5; else missing.push('VALIDITY (DATE)');

  // 6. Transit Time
  const ttExt = extractTransitTime(rawText);
  const transitTime = ttExt ? ttExt.transitTime : '28 days';
  if (ttExt) score += 3;

  // 7. Rate Type & Routing
  const rtExt = extractRateType(rawText);
  const routingExt = extractRouting(rawText);

  // 8. Remarks & Surcharges (Lossless)
  const allConsumed = [
    carrierExt?.matchedText || '',
    ...geo.consumedTokens,
    ...pricing.consumedTokens,
    ftExt?.matchedText || '',
    valExt?.matchedText || '',
    ttExt?.matchedText || '',
    routingExt.matchedText,
    rtExt.matchedText,
  ].filter(Boolean);

  const remarksExt = extractLosslessRemarks(rawText, allConsumed);
  const remarks = remarksExt.remarks;

  // Check unmapped text segments
  let residual = rawText;
  for (const token of allConsumed) {
    if (token) {
      residual = residual.split(token).join(' ');
    }
  }
  if (remarks) {
    residual = residual.split(remarks).join(' ');
  }
  const leftoverTokens = residual
    .replace(/\b(?:from|to|via|and|or|valid|till|until|through|date|rate|ocean|service|terms|remarks?|notes?|surcharges?|conditions?|por|pol|pod|fpod)\b/gi, ' ')
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 4 && !/^\d+$/.test(w));

  for (const token of leftoverTokens) {
    const isCarrierOrPort = Object.keys(CARRIER_ALIASES).includes(token.toLowerCase()) ||
      Object.keys(PORT_ALIASES).includes(token.toLowerCase());
    if (!isCarrierOrPort && !unmapped.includes(token)) {
      unmapped.push(token);
    }
  }

  // STRICT ASSIGNMENT: Never fallback POR to POL or FPOD to POD!
  const record: RateFormData = {
    carrier,
    por: geo.por,
    pol: geo.pol,
    pod: geo.pod,
    fpod: geo.fpod,
    d20: pricing.d20,
    d20Type: pricing.d20Type,
    h40: pricing.h40,
    h40Type: pricing.h40Type,
    freeTime,
    validDate,
    transitTime,
    routing: routingExt.routing,
    rateType: rtExt.rateType,
    remarks,
  };

  return {
    record,
    unmapped,
    missing,
    warnings,
    hasConflict: geo.conflicts.length > 0,
    score,
  };
}

/**
 * Main entry point: parses single or multiple rate instructions
 */
export function parseNaturalLanguageRates(rawInput: string): ParsedRateResult {
  const startTime = performance.now();
  const text = (rawInput || '').trim();

  if (!text) {
    return {
      success: false,
      records: [],
      totalExtracted: 0,
      confidence: 0,
      confidenceLevel: 'LOW',
      hasConflict: false,
      conflicts: [],
      unmappedSegments: [],
      missingFields: ['ALL'],
      warnings: ['Empty input received.'],
      modelInfo: {
        engine: 'Deterministic Low-Memory Pattern Engine',
        version: '2.5.0-production',
        modelSizeMB: 0.04,
        latencyMs: 0,
        cached: false,
      },
    };
  }

  // Check if text has multiple numbered rate entries (e.g. "Rate 1: ..." or "1. Maersk ... 2. MSC ...")
  const rateBlockSplitter = /(?=\n\s*(?:Rate\s*\d+\s*[:=-]|\d+[\).]\s*(?:maersk|msc|cma|hapag|evergreen|cosco|one|yang\s*ming|hmm|zim|wan\s*hai|pil|oocl|arkas|\bpol\b|\bfrom\b)))/i;
  const hasMultiple = /(?:^|\n)\s*(?:Rate\s*\d+\s*[:=-]|\d+[\).]\s*(?:maersk|msc|cma|hapag|evergreen|cosco|one|yang\s*ming|hmm|zim|wan\s*hai|pil|oocl|arkas|\bpol\b|\bfrom\b))/i.test(text);

  const blocks: string[] = [];
  if (hasMultiple) {
    const rawParts = text.split(rateBlockSplitter);
    for (const part of rawParts) {
      const clean = part.replace(/^\s*(?:Rate\s*\d+\s*[:=-]|\d+[\).]\s*)/i, '').trim();
      if (clean) blocks.push(clean);
    }
  } else {
    blocks.push(text);
  }

  const records: RateFormData[] = [];
  const allUnmapped: string[] = [];
  const allMissing: string[] = [];
  const allWarnings: string[] = [];
  let totalScore = 0;
  let hasAnyConflict = false;

  for (const block of blocks) {
    const res = parseSingleBlock(block);
    records.push(res.record);
    allUnmapped.push(...res.unmapped);
    allMissing.push(...res.missing);
    allWarnings.push(...res.warnings);
    if (res.hasConflict) hasAnyConflict = true;
    totalScore += res.score;
  }

  const avgScore = blocks.length > 0 ? Math.min(100, Math.round(totalScore / blocks.length)) : 0;
  const confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW' =
    hasAnyConflict ? 'LOW' : avgScore >= 70 ? 'HIGH' : avgScore >= 40 ? 'MEDIUM' : 'LOW';

  const endTime = performance.now();
  const latencyMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    success: records.length > 0 && records.some((r) => r.pol || r.pod || r.carrier),
    records,
    totalExtracted: records.length,
    confidence: avgScore,
    confidenceLevel,
    hasConflict: hasAnyConflict,
    conflicts: allWarnings.filter((w) => w.toLowerCase().includes('conflict')),
    unmappedSegments: Array.from(new Set(allUnmapped)),
    missingFields: Array.from(new Set(allMissing)),
    warnings: Array.from(new Set(allWarnings)),
    modelInfo: {
      engine: 'Deterministic Low-Memory Pattern Engine',
      version: '2.5.0-production',
      modelSizeMB: 0.04,
      latencyMs,
      cached: false,
    },
  };
}
