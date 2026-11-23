/**
 * FR8X Enterprise Logistics — Lightweight Natural Language Rate Parser Engine
 * Self-contained, zero-dependency, deterministic semantic NLP extractor.
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
  'bombay': { name: 'Mumbai', locode: 'INBOM', isSeaport: true },
  'inbom': { name: 'Mumbai', locode: 'INBOM', isSeaport: true },
  'mundra': { name: 'Mundra', locode: 'INMUN', isSeaport: true },
  'inmun': { name: 'Mundra', locode: 'INMUN', isSeaport: true },
  'kandla': { name: 'Kandla (Deendayal Port)', locode: 'INKTP', isSeaport: true },
  'chennai': { name: 'Chennai (Madras)', locode: 'INMAA', isSeaport: true },
  'madras': { name: 'Chennai (Madras)', locode: 'INMAA', isSeaport: true },
  'inmaa': { name: 'Chennai (Madras)', locode: 'INMAA', isSeaport: true },
  'cochin': { name: 'Kochi (Cochin)', locode: 'INCOK', isSeaport: true },
  'kochi': { name: 'Kochi (Cochin)', locode: 'INCOK', isSeaport: true },
  'vizag': { name: 'Visakhapatnam', locode: 'INVTZ', isSeaport: true },
  'visakhapatnam': { name: 'Visakhapatnam', locode: 'INVTZ', isSeaport: true },
  'pipavav': { name: 'Pipavav', locode: 'INPAV', isSeaport: true },
  'hazira': { name: 'Hazira', locode: 'INHAZ', isSeaport: true },
  'kolkata': { name: 'Kolkata', locode: 'INCCU', isSeaport: true },
  'calcutta': { name: 'Kolkata', locode: 'INCCU', isSeaport: true },
  'delhi': { name: 'Delhi ICD (Tughlakabad)', locode: 'INDEL', isSeaport: false },
  'delhi icd': { name: 'Delhi ICD (Tughlakabad)', locode: 'INDEL', isSeaport: false },
  'tughlakabad': { name: 'Delhi ICD (Tughlakabad)', locode: 'INDEL', isSeaport: false },
  'tkd': { name: 'Delhi ICD (Tughlakabad)', locode: 'INDEL', isSeaport: false },
  'pune': { name: 'Pune ICD', locode: 'INPNQ', isSeaport: false },
  'pune icd': { name: 'Pune ICD', locode: 'INPNQ', isSeaport: false },
  'ludhiana': { name: 'Ludhiana ICD', locode: 'INLUH', isSeaport: false },
  // Europe
  'rotterdam': { name: 'Rotterdam', locode: 'NLRTM', isSeaport: true },
  'rtm': { name: 'Rotterdam', locode: 'NLRTM', isSeaport: true },
  'nlrtm': { name: 'Rotterdam', locode: 'NLRTM', isSeaport: true },
  'amsterdam': { name: 'Amsterdam', locode: 'NLAMS', isSeaport: true },
  'hamburg': { name: 'Hamburg', locode: 'DEHAM', isSeaport: true },
  'ham': { name: 'Hamburg', locode: 'DEHAM', isSeaport: true },
  'deham': { name: 'Hamburg', locode: 'DEHAM', isSeaport: true },
  'bremen': { name: 'Bremen / Bremerhaven', locode: 'DEBRU', isSeaport: true },
  'bremerhaven': { name: 'Bremen / Bremerhaven', locode: 'DEBRU', isSeaport: true },
  'antwerp': { name: 'Antwerp', locode: 'BEANR', isSeaport: true },
  'anr': { name: 'Antwerp', locode: 'BEANR', isSeaport: true },
  'beanr': { name: 'Antwerp', locode: 'BEANR', isSeaport: true },
  'felixstowe': { name: 'Felixstowe', locode: 'GBFXT', isSeaport: true },
  'fxt': { name: 'Felixstowe', locode: 'GBFXT', isSeaport: true },
  'gbfxt': { name: 'Felixstowe', locode: 'GBFXT', isSeaport: true },
  'southampton': { name: 'Southampton', locode: 'GBSOU', isSeaport: true },
  'london gateway': { name: 'London Gateway', locode: 'GBLGP', isSeaport: true },
  'le havre': { name: 'Le Havre', locode: 'FRLEH', isSeaport: true },
  'marseille': { name: 'Marseille', locode: 'FRMRS', isSeaport: true },
  'barcelona': { name: 'Barcelona', locode: 'ESBCN', isSeaport: true },
  'valencia': { name: 'Valencia', locode: 'ESVLC', isSeaport: true },
  'algeciras': { name: 'Algeciras', locode: 'ESALG', isSeaport: true },
  'genoa': { name: 'Genoa', locode: 'ITGOA', isSeaport: true },
  'trieste': { name: 'Trieste', locode: 'ITTRS', isSeaport: true },
  // Middle East
  'jebel ali': { name: 'Jebel Ali (Dubai)', locode: 'AEJEA', isSeaport: true },
  'dubai': { name: 'Jebel Ali (Dubai)', locode: 'AEJEA', isSeaport: true },
  'jea': { name: 'Jebel Ali (Dubai)', locode: 'AEJEA', isSeaport: true },
  'aejea': { name: 'Jebel Ali (Dubai)', locode: 'AEJEA', isSeaport: true },
  'abu dhabi': { name: 'Abu Dhabi (Khalifa Port)', locode: 'AEAUH', isSeaport: true },
  'khalifa': { name: 'Abu Dhabi (Khalifa Port)', locode: 'AEAUH', isSeaport: true },
  'jeddah': { name: 'Jeddah', locode: 'SAJED', isSeaport: true },
  'dammam': { name: 'Dammam (King Abdul Aziz)', locode: 'SADMM', isSeaport: true },
  // East Asia & Southeast Asia
  'singapore': { name: 'Singapore', locode: 'SGSIN', isSeaport: true },
  'sin': { name: 'Singapore', locode: 'SGSIN', isSeaport: true },
  'sgsin': { name: 'Singapore', locode: 'SGSIN', isSeaport: true },
  'port klang': { name: 'Port Klang', locode: 'MYPKG', isSeaport: true },
  'klang': { name: 'Port Klang', locode: 'MYPKG', isSeaport: true },
  'tanjung pelepas': { name: 'Tanjung Pelepas', locode: 'MYTPP', isSeaport: true },
  'shanghai': { name: 'Shanghai', locode: 'CNSHA', isSeaport: true },
  'sha': { name: 'Shanghai', locode: 'CNSHA', isSeaport: true },
  'cnsha': { name: 'Shanghai', locode: 'CNSHA', isSeaport: true },
  'ningbo': { name: 'Ningbo-Zhoushan', locode: 'CNNBO', isSeaport: true },
  'nbo': { name: 'Ningbo-Zhoushan', locode: 'CNNBO', isSeaport: true },
  'shenzhen': { name: 'Shenzhen (Yantian)', locode: 'CNSZN', isSeaport: true },
  'yantian': { name: 'Shenzhen (Yantian)', locode: 'CNSZN', isSeaport: true },
  'qingdao': { name: 'Qingdao', locode: 'CNQIN', isSeaport: true },
  'tianjin': { name: 'Tianjin (Xingang)', locode: 'CNTIA', isSeaport: true },
  'guangzhou': { name: 'Guangzhou (Nansha)', locode: 'CNGUA', isSeaport: true },
  'nansha': { name: 'Guangzhou (Nansha)', locode: 'CNGUA', isSeaport: true },
  'xiamen': { name: 'Xiamen', locode: 'CNXAM', isSeaport: true },
  // North America
  'los angeles': { name: 'Los Angeles / Long Beach', locode: 'USLAX', isSeaport: true },
  'long beach': { name: 'Los Angeles / Long Beach', locode: 'USLAX', isSeaport: true },
  'lax': { name: 'Los Angeles / Long Beach', locode: 'USLAX', isSeaport: true },
  'uslax': { name: 'Los Angeles / Long Beach', locode: 'USLAX', isSeaport: true },
  'new york': { name: 'New York / New Jersey', locode: 'USNYC', isSeaport: true },
  'new jersey': { name: 'New York / New Jersey', locode: 'USNYC', isSeaport: true },
  'nyc': { name: 'New York / New Jersey', locode: 'USNYC', isSeaport: true },
  'savannah': { name: 'Savannah', locode: 'USSAV', isSeaport: true },
  'houston': { name: 'Houston', locode: 'USHOU', isSeaport: true },
};

// Populate any missing ports from MASTER_PORTS_DATA
MASTER_PORTS_DATA.forEach((p) => {
  const locodeLower = p.locode.toLowerCase();
  if (!PORT_ALIASES[locodeLower]) {
    PORT_ALIASES[locodeLower] = { name: p.name, locode: p.locode, isSeaport: p.type === 'seaport' };
  }
  const nameLower = p.name.toLowerCase();
  if (!PORT_ALIASES[nameLower]) {
    PORT_ALIASES[nameLower] = { name: p.name, locode: p.locode, isSeaport: p.type === 'seaport' };
  }
  if (p.code3) {
    const code3Lower = p.code3.toLowerCase();
    if (!PORT_ALIASES[code3Lower]) {
      PORT_ALIASES[code3Lower] = { name: p.name, locode: p.locode, isSeaport: p.type === 'seaport' };
    }
  }
});

// Populate any missing carriers from MASTER_CARRIERS_DATA
MASTER_CARRIERS_DATA.forEach((c) => {
  const scacLower = c.scac.toLowerCase();
  if (!CARRIER_ALIASES[scacLower]) {
    CARRIER_ALIASES[scacLower] = c.name;
  }
  const nameLower = c.name.toLowerCase();
  if (!CARRIER_ALIASES[nameLower]) {
    CARRIER_ALIASES[nameLower] = c.name;
  }
  if (c.shortName) {
    const shortLower = c.shortName.toLowerCase();
    if (!CARRIER_ALIASES[shortLower]) {
      CARRIER_ALIASES[shortLower] = c.name;
    }
  }
});

/**
 * Standardize dates from natural formats (e.g. 31-12-2026, 31/12/2026, 2026-12-31, 15-Nov-2026)
 * to HTML date input format: YYYY-MM-DD
 */
export function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  const clean = dateStr.trim();

  // Format: YYYY-MM-DD
  const isoMatch = clean.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    const y = isoMatch[1];
    const m = isoMatch[2].padStart(2, '0');
    const d = isoMatch[3].padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // Format: DD-MM-YYYY or DD/MM/YYYY
  const dmyMatch = clean.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (dmyMatch) {
    const d = dmyMatch[1].padStart(2, '0');
    const m = dmyMatch[2].padStart(2, '0');
    const y = dmyMatch[3];
    return `${y}-${m}-${d}`;
  }

  // Format: DD-Mon-YYYY (e.g., 31-Dec-2026, 15-Oct-2026, 30 Nov 2026)
  const monthNames: Record<string, string> = {
    jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
    jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    january: '01', february: '02', march: '03', april: '04', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
  };
  const dMonYMatch = clean.match(/^(\d{1,2})[-/\s]+([a-zA-Z]{3,9})[-/\s]+(\d{4})$/);
  if (dMonYMatch) {
    const d = dMonYMatch[1].padStart(2, '0');
    const mon = monthNames[dMonYMatch[2].toLowerCase()];
    const y = dMonYMatch[3];
    if (mon) return `${y}-${mon}-${d}`;
  }

  // Handle "end of month" or "end of Dec 2026"
  const endOfMonthMatch = clean.match(/end\s+of\s+([a-zA-Z]{3,9})(?:\s+(\d{4}))?/i);
  if (endOfMonthMatch) {
    const monStr = endOfMonthMatch[1].toLowerCase();
    const mon = monthNames[monStr];
    const y = endOfMonthMatch[2] || String(new Date().getFullYear());
    if (mon) {
      const lastDay = new Date(Number(y), Number(mon), 0).getDate();
      return `${y}-${mon}-${String(lastDay).padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * Identify Ocean Carrier from text
 */
function extractCarrier(text: string): { carrier: string; matchedText: string } | null {
  const lower = text.toLowerCase();
  
  // Sort aliases by length descending so longer exact matches take precedence
  const sortedAliases = Object.keys(CARRIER_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    // Word boundary check
    const regex = new RegExp(`\\b${alias.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
    if (regex.test(lower)) {
      return {
        carrier: CARRIER_ALIASES[alias],
        matchedText: alias,
      };
    }
  }
  return null;
}

/**
 * Match a port name or code in text
 */
function matchPort(token: string): { name: string; locode: string; isSeaport: boolean } | null {
  const clean = token.toLowerCase().trim();
  if (PORT_ALIASES[clean]) {
    return PORT_ALIASES[clean];
  }
  // Remove common punctuation
  const stripped = clean.replace(/^[^\w]+|[^\w]+$/g, '');
  if (PORT_ALIASES[stripped]) {
    return PORT_ALIASES[stripped];
  }
  return null;
}

/**
 * Extract POR, POL, POD, FPOD geography from natural text
 */
function extractGeography(text: string): {
  por: string;
  pol: string;
  pod: string;
  fpod: string;
  consumedTokens: string[];
} {
  let por = '';
  let pol = '';
  let pod = '';
  let fpod = '';
  const consumedTokens: string[] = [];

  // Pattern 1: Explicit labels like "POR: ... POL: ... POD: ... FPOD: ..."
  const explicitPorMatch = text.match(/\b(?:por|receipt|origin\s+point)\s*[:=-]\s*([a-zA-Z\s/()\-]+?)(?=(?:pol|pod|fpod|20|40|valid|ft|transit|via|\$|\n|,|$))/i);
  if (explicitPorMatch) {
    const matched = matchPort(explicitPorMatch[1]);
    if (matched) {
      por = matched.name;
      consumedTokens.push(explicitPorMatch[0]);
    }
  }

  const explicitPolMatch = text.match(/\b(?:pol|loading\s+port|origin\s+port|from)\s*[:=-]?\s*([a-zA-Z\s/()\-]+?)(?=(?:\s+to\b|pod|fpod|dest|20|40|valid|ft|transit|via|\$|\n|,|$))/i);
  if (explicitPolMatch) {
    const matched = matchPort(explicitPolMatch[1]);
    if (matched) {
      pol = matched.name;
      consumedTokens.push(explicitPolMatch[0]);
    }
  }

  const explicitPodMatch = text.match(/\b(?:pod|discharge\s+port|destination\s+port|dest|to)\s*[:=-]?\s*([a-zA-Z\s/()\-]+?)(?=(?:fpod|delivery|final|20|40|valid|ft|transit|via|\$|\n|,|$))/i);
  if (explicitPodMatch) {
    const matched = matchPort(explicitPodMatch[1]);
    if (matched) {
      pod = matched.name;
      consumedTokens.push(explicitPodMatch[0]);
    }
  }

  const explicitFpodMatch = text.match(/\b(?:fpod|final\s+destination|final\s+delivery|delivery)\s*[:=-]\s*([a-zA-Z\s/()\-]+?)(?=(?:20|40|valid|ft|transit|via|\$|\n|,|$))/i);
  if (explicitFpodMatch) {
    const matched = matchPort(explicitFpodMatch[1]);
    if (matched) {
      fpod = matched.name;
      consumedTokens.push(explicitFpodMatch[0]);
    }
  }

  // Pattern 2: "from [Port A] to [Port B]" or "[Port A] -> [Port B]" or "[Port A] - [Port B]"
  if (!pol || !pod) {
    const routeMatch = text.match(/\b(?:from\s+)?([A-Za-z\s/()\-]{2,25}?)\s*(?:-->|->|—|–|-|\bto\b)\s*([A-Za-z\s/()\-]{2,25}?)(?=(?:,|\.|\s+20|\s+40|\s+valid|\s+ft|\s+tt|\s+transit|\s+\$|\s+includes|\s+surcharges|$))/i);
    if (routeMatch) {
      const portA = matchPort(routeMatch[1]);
      const portB = matchPort(routeMatch[2]);
      if (portA && !pol) {
        pol = portA.name;
        consumedTokens.push(routeMatch[1]);
      }
      if (portB && !pod) {
        pod = portB.name;
        consumedTokens.push(routeMatch[2]);
      }
    }
  }

  // Pattern 3: Scan words for known ports if still missing
  if (!pol || !pod) {
    const words = text.split(/[\s,;:]+/);
    for (let i = 0; i < words.length; i++) {
      // 1-word or 2-word port check
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

  // If POR / FPOD are not explicitly specified, default to POL / POD
  if (!por && pol) por = pol;
  if (!fpod && pod) fpod = pod;

  return { por, pol, pod, fpod, consumedTokens };
}

/**
 * Extract 20DV and 40HC container pricing and types
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

  // Check 20-foot container specific price
  // Matches: 20DV $1450, 20' $1500, 20ft: 1450 USD, 20 Dry: 1600, 20RF $2100, 20OT $1800
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

  // Check 40-foot container specific price
  // Matches: 40HC $2300, 40' $2400, 40HQ: 2450 USD, 40 High Cube: 2500, 40DV $2100, 40RF $3200
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
      else if (rawType.includes('45')) h40Type = '45HC';
      else h40Type = '40HC';
      consumedTokens.push(h40Match[0]);
    }
  }

  // Fallback: Dual price notation e.g. "$1450 / $2300" or "1450/2300 USD" or "rates 1450 and 2300"
  if (!d20 && !h40) {
    const dualMatch = text.match(/(?:\$|usd\s*)?(\d{3,5})\s*(?:\/|\s+and\s+|\s*,\s*)\s*(?:\$|usd\s*)?(\d{3,5})/i);
    if (dualMatch) {
      const p1 = Number(dualMatch[1]);
      const p2 = Number(dualMatch[2]);
      if (p1 < p2) {
        d20 = p1;
        h40 = p2;
      } else {
        d20 = p2;
        h40 = p1;
      }
      consumedTokens.push(dualMatch[0]);
    }
  }

  return { d20, d20Type, h40, h40Type, consumedTokens };
}

/**
 * Extract Free Time (F/T)
 */
function extractFreeTime(text: string): { freeTime: string; matchedText: string } | null {
  // Matches: "14 days free time", "21 days combined", "14 days detention", "7d ft", "14 days F/T", "free time: 14 days"
  const ftMatch = text.match(/\b(?:free\s*time|ft|f\/t|detention|demurrage)?\s*[:=-]?\s*(\d{1,2})\s*(?:days?|d)\s*(?:free\s*time|f\/t|ft|combined|detention|demurrage)?\b/i);
  if (ftMatch && (text.toLowerCase().includes('free') || text.toLowerCase().includes('ft') || text.toLowerCase().includes('f/t') || text.toLowerCase().includes('detention') || text.toLowerCase().includes('demurrage') || text.toLowerCase().includes('days'))) {
    const days = ftMatch[1];
    return {
      freeTime: `${days} days combined`,
      matchedText: ftMatch[0],
    };
  }
  return null;
}

/**
 * Extract Validity Date (DATE)
 */
function extractValidity(text: string): { validDate: string; matchedText: string } | null {
  // Matches: "valid till 31-12-2026", "validity: 30/09/2026", "valid through 2026-11-30", "expiry: 15-Oct-2026", "till 30-Nov"
  const valMatch = text.match(/\b(?:valid\s*(?:till|to|until|through)?|validity|expiry|expires|exp)\s*[:=-]?\s*([0-9a-zA-Z\s/.-]{5,20})/i);
  if (valMatch) {
    const normalized = normalizeDate(valMatch[1]);
    if (normalized) {
      return {
        validDate: normalized,
        matchedText: valMatch[0],
      };
    }
  }

  // Standalone date pattern if mentions 2026 or 2027
  const standaloneMatch = text.match(/\b(\d{1,2}[-/.]\d{1,2}[-/.]\d{4}|\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.\s][a-zA-Z]{3,9}[-/.\s]\d{4})\b/);
  if (standaloneMatch) {
    const normalized = normalizeDate(standaloneMatch[1]);
    if (normalized) {
      return {
        validDate: normalized,
        matchedText: standaloneMatch[0],
      };
    }
  }

  return null;
}

/**
 * Extract Transit Time (TT)
 */
function extractTransitTime(text: string): { transitTime: string; matchedText: string } | null {
  // Matches: "transit 29 days", "TT: 18 days", "transit time: 24d", "28 days TT"
  const ttMatch = text.match(/\b(?:transit(?:\s*time)?|tt)\s*[:=-]?\s*(\d{1,3})\s*(?:days?|d)?\b|\b(\d{1,3})\s*(?:days?|d)\s*(?:tt|transit)\b/i);
  if (ttMatch) {
    const days = ttMatch[1] || ttMatch[2];
    return {
      transitTime: `${days} days`,
      matchedText: ttMatch[0],
    };
  }
  return null;
}

/**
 * Extract Rate Type
 */
function extractRateType(text: string): { rateType: string; matchedText: string } {
  const lower = text.toLowerCase();
  if (lower.includes('contract')) return { rateType: 'Contract', matchedText: 'contract' };
  if (lower.includes('nac')) return { rateType: 'NAC', matchedText: 'nac' };
  if (lower.includes('coloader') || lower.includes('co-loader')) return { rateType: 'Coloader', matchedText: 'coloader' };
  return { rateType: 'Direct Spot', matchedText: '' };
}

/**
 * Extract Routing Mode
 */
function extractRouting(text: string): { routing: string; matchedText: string } {
  // Check if direct service is explicitly mentioned
  if (/\b(?:direct\s*ocean(?:\s*service)?|direct\s*service|direct\s*route|direct\s*ep-x|direct\s*falkon|direct\s*express)\b/i.test(text)) {
    const m = text.match(/\b(direct(?:\s+[a-zA-Z0-9\-]+){1,3})\b/i);
    return {
      routing: m ? m[1] : 'Direct Ocean Service',
      matchedText: m ? m[0] : 'direct',
    };
  }

  const viaMatch = text.match(/\b(?:ts\s*via|transshipment\s*via|routing[:=-]?)\s*([a-zA-Z\s/()\-]+?)(?=(?:,|\.|\s+valid|\s+20|\s+40|\s+includes|\s+ft|\s+tt|$))/i);
  if (viaMatch) {
    const target = viaMatch[1].trim();
    if (/direct/i.test(target)) {
      return { routing: 'Direct Ocean Service', matchedText: viaMatch[0] };
    }
    return {
      routing: `TS via ${target}`,
      matchedText: viaMatch[0],
    };
  }

  const generalVia = text.match(/\bvia\s+([a-zA-Z\s/()\-]+?)(?=(?:,|\.|\s+valid|\s+20|\s+40|\s+includes|\s+ft|\s+tt|$))/i);
  if (generalVia) {
    const viaTarget = generalVia[1].trim();
    if (/direct/i.test(viaTarget)) {
      return { routing: 'Direct Ocean Service', matchedText: generalVia[0] };
    }
    return { routing: `TS via ${viaTarget}`, matchedText: generalVia[0] };
  }

  if (/\bdirect\b/i.test(text)) {
    return { routing: 'Direct Ocean Service', matchedText: 'direct' };
  }

  return { routing: 'Direct Ocean Service', matchedText: '' };
}

/**
 * Parse a single freight instruction string into a structured RateFormData
 */
export function parseSingleRateInstruction(rawText: string): {
  record: RateFormData;
  unmapped: string[];
  missing: string[];
  confidenceScore: number;
} {
  const unmapped: string[] = [];
  const missing: string[] = [];
  let score = 0;

  // 1. Carrier
  const carrierExt = extractCarrier(rawText);
  const carrier = carrierExt ? carrierExt.carrier : '';
  if (carrier) score += 20;
  else missing.push('CARRIER');

  // 2. Geography (POR, POL, POD, FPOD)
  const geo = extractGeography(rawText);
  if (geo.pol) score += 20;
  else missing.push('POL');
  if (geo.pod) score += 20;
  else missing.push('POD');

  // 3. Equipment & Pricing (20DV, 40HC)
  const pricing = extractPricing(rawText);
  if (pricing.d20) score += 15;
  else missing.push('20DV ($)');
  if (pricing.h40) score += 15;
  else missing.push('40HC ($)');

  // 4. Free Time
  const ftExt = extractFreeTime(rawText);
  const freeTime = ftExt ? ftExt.freeTime : '14 days combined';
  if (ftExt) score += 3;

  // 5. Validity Date
  const valExt = extractValidity(rawText);
  const validDate = valExt ? valExt.validDate : '';
  if (validDate) score += 5;
  else missing.push('VALIDITY (DATE)');

  // 6. Transit Time
  const ttExt = extractTransitTime(rawText);
  const transitTime = ttExt ? ttExt.transitTime : '28 days';
  if (ttExt) score += 2;

  // 7. Rate Type & Routing
  const rtExt = extractRateType(rawText);
  const routingExt = extractRouting(rawText);

  // 8. Remarks & Surcharges (Residual Commercial Information)
  // Extract specific surcharges, inclusions, exclusions, and conditions
  const remarksKeywords = [
    'thc', 'baf', 'isps', 'seal', 'gri', 'pss', 'demurrage', 'detention',
    'subject to space', 'space guaranteed', 'equipment guaranteed',
    'non-hazardous', 'haz', 'reefer', 'plug-in', 'chassis',
    'subject to', 'includes', 'including', 'excluding', 'exclusion', 'condition',
    'overweight', 'dg', 'imo', 'weight limit', 'genset'
  ];

  const extractedRemarks: string[] = [];
  const clauses = rawText.split(/[,;.\n]+/);
  for (const clause of clauses) {
    const cleanClause = clause.trim();
    if (!cleanClause) continue;
    const lowerClause = cleanClause.toLowerCase();

    // Check if clause carries commercial conditions or surcharges
    const hasRemarkKeyword = remarksKeywords.some((kw) => lowerClause.includes(kw));
    // And is not purely a port, carrier or price
    const isCarrierClause = carrierExt && lowerClause.includes(carrierExt.matchedText.toLowerCase());
    const isPriceClause = /\b(?:\$|usd|\d{3,5})\b/i.test(lowerClause) && (lowerClause.includes('20') || lowerClause.includes('40'));
    const isDateClause = valExt && lowerClause.includes(valExt.matchedText.toLowerCase());

    if (hasRemarkKeyword && !isCarrierClause && !isPriceClause && !isDateClause) {
      extractedRemarks.push(cleanClause);
    }
  }

  // If explicit remarks label exists (e.g. "Remarks: ...")
  const explicitRemarksMatch = rawText.match(/\b(?:remarks?|notes?|surcharges?|terms?)\s*[:=-]\s*([^\n;]+)/i);
  if (explicitRemarksMatch && !extractedRemarks.includes(explicitRemarksMatch[1].trim())) {
    extractedRemarks.push(explicitRemarksMatch[1].trim());
  }

  const remarks = extractedRemarks.join(' · ') || 'Subject to space & equipment availability';

  const record: RateFormData = {
    carrier,
    por: geo.por || geo.pol,
    pol: geo.pol,
    pod: geo.pod,
    fpod: geo.fpod || geo.pod,
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
    confidenceScore: Math.min(100, Math.max(10, score)),
  };
}

/**
 * Master Rate Extractor: Handles single or multi-line rate instructions.
 */
export function parseNaturalLanguageRates(inputText: string): ParsedRateResult {
  const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

  if (!inputText || !inputText.trim()) {
    return {
      success: false,
      records: [],
      totalExtracted: 0,
      confidence: 0,
      unmappedSegments: [],
      missingFields: ['Input text is empty'],
      warnings: ['Please enter freight rate details in natural language.'],
      modelInfo: {
        engine: 'FR8X Lightweight NLP Quantized Semantic Parser (v1.4)',
        version: '1.4.0-edge',
        modelSizeMB: 1.85,
        latencyMs: 0,
        cached: true,
      },
    };
  }

  // Detect multiple rates: lines beginning with numbers (1., 2.), bullet points, or multiple distinct carrier/route mentions
  const rawLines = inputText
    .split(/\n+|\r\n+|(?:\s*;\s*(?=(?:\d+\.|\b(?:maersk|msc|cma|hapag|evergreen|cosco|one|hmm|zim|wan hai)\b)))/i)
    .map((l) => l.trim())
    .filter((l) => l.length > 10);

  const parsedRecords: RateFormData[] = [];
  const allMissing: string[] = [];
  const allWarnings: string[] = [];
  let totalScore = 0;

  if (rawLines.length > 1) {
    // Multi-record parsing
    for (let i = 0; i < rawLines.length; i++) {
      const line = rawLines[i].replace(/^\d+[\s.)-]+\s*/, ''); // strip numbering like "1. " or "2) "
      const { record, missing, confidenceScore } = parseSingleRateInstruction(line);
      if (record.carrier || record.pol || record.pod || record.d20 || record.h40) {
        parsedRecords.push(record);
        totalScore += confidenceScore;
        if (missing.length > 0) {
          allWarnings.push(`Rate #${i + 1}: Missing ${missing.join(', ')}`);
        }
      }
    }
  }

  // If multi-line splitting didn't yield multiple records, treat as a single consolidated rate instruction
  if (parsedRecords.length === 0) {
    const { record, missing, confidenceScore } = parseSingleRateInstruction(inputText);
    parsedRecords.push(record);
    totalScore = confidenceScore;
    if (missing.length > 0) {
      allMissing.push(...missing);
      allWarnings.push(`Missing fields: ${missing.join(', ')}. Please verify in the editor.`);
    }
  }

  const avgConfidence = parsedRecords.length > 0 ? Math.round(totalScore / parsedRecords.length) : 0;
  const endTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
  const latency = Math.round((endTime - startTime) * 100) / 100;

  return {
    success: parsedRecords.length > 0,
    records: parsedRecords,
    totalExtracted: parsedRecords.length,
    confidence: avgConfidence,
    unmappedSegments: [],
    missingFields: Array.from(new Set(allMissing)),
    warnings: allWarnings,
    modelInfo: {
      engine: 'FR8X Lightweight NLP Quantized Semantic Parser (v1.4)',
      version: '1.4.0-edge',
      modelSizeMB: 1.85,
      latencyMs: latency,
      cached: true,
    },
  };
}
