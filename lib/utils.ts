export const CURRENCY_RATES: Record<string, { symbol: string; rateFromUSD: number; name: string }> = {
  USD: { symbol: '$', rateFromUSD: 1, name: 'US Dollar' },
  INR: { symbol: '₹', rateFromUSD: 87.5, name: 'Indian Rupee' },
  EUR: { symbol: '€', rateFromUSD: 0.92, name: 'Euro' },
  GBP: { symbol: '£', rateFromUSD: 0.78, name: 'British Pound' },
  AED: { symbol: 'AED ', rateFromUSD: 3.67, name: 'UAE Dirham' },
  SGD: { symbol: 'S$', rateFromUSD: 1.34, name: 'Singapore Dollar' },
  CNY: { symbol: '¥', rateFromUSD: 7.24, name: 'Chinese Yuan' },
  JPY: { symbol: '¥', rateFromUSD: 154.2, name: 'Japanese Yen' },
};

export function updateGlobalCurrencyRates(newRates: Record<string, number>) {
  for (const [code, rate] of Object.entries(newRates)) {
    const c = code.toUpperCase();
    if (CURRENCY_RATES[c] && typeof rate === 'number' && rate > 0) {
      CURRENCY_RATES[c].rateFromUSD = rate;
    }
  }
}

export const BLOCKED_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'yahoo.co.uk',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'aol.com',
  'proton.me',
  'protonmail.com',
  'mail.com',
  'zoho.com',
  'yandex.com',
  'gmx.com',
]);

export function isCorporateEmail(email: string): boolean {
  if (!email || !email.includes('@')) return false;
  const parts = email.trim().toLowerCase().split('@');
  if (parts.length !== 2) return false;
  const domain = parts[1];
  return !BLOCKED_EMAIL_DOMAINS.has(domain);
}

export const CURRENCY_LOCALES: Record<string, string> = {
  USD: 'en-US',
  INR: 'en-IN',
  EUR: 'de-DE',
  GBP: 'en-GB',
  AED: 'en-AE',
  SGD: 'en-SG',
  CNY: 'zh-CN',
  JPY: 'ja-JP',
};

export function formatCurrency(amountUSD: number, targetCurrency: string = 'USD'): string {
  const curr = CURRENCY_RATES[targetCurrency] || CURRENCY_RATES.USD;
  const converted = amountUSD * curr.rateFromUSD;
  const locale = CURRENCY_LOCALES[targetCurrency] || 'en-US';
  return `${curr.symbol}${converted.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatNumber(n: number | undefined | null, locale: string = 'en-US'): string {
  if (n === undefined || n === null || isNaN(Number(n))) return '0';
  return Number(n).toLocaleString(locale);
}

export function convertAmount(amount: number, fromCurrency: string, toCurrency: string): number {
  const fromRate = CURRENCY_RATES[fromCurrency]?.rateFromUSD || 1;
  const toRate = CURRENCY_RATES[toCurrency]?.rateFromUSD || 1;
  const inUSD = amount / fromRate;
  return inUSD * toRate;
}

export function getLocalTime(timezone: string = 'Asia/Kolkata'): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  }
}

export function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function parseRichText(text: string): string {
  if (!text) return '';
  let escaped = escapeHtml(text);

  // Code blocks ```code```
  escaped = escaped.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
  // Inline code `code`
  escaped = escaped.replace(/`([^`]+)`/g, '<code>$1</code>');
  // Bold *text*
  escaped = escaped.replace(/\*([^*]+)\*/g, '<strong>$1</strong>');
  // Italic _text_
  escaped = escaped.replace(/_([^_]+)_/g, '<em>$1</em>');
  // Strikethrough ~text~
  escaped = escaped.replace(/~([^~]+)~/g, '<del>$1</del>');
  // Blockquote > text
  escaped = escaped.replace(/^&gt;\s?(.*)$/gm, '<blockquote>$1</blockquote>');
  // Line breaks
  escaped = escaped.replace(/\n/g, '<br>');

  return escaped;
}

import {
  LocationMasterItem,
  CarrierMasterItem,
  EquipmentMasterItem,
  CommodityMasterItem,
  IncotermMasterItem,
  TaxSACMasterItem,
} from './types';

export const PORT_SUGGESTIONS = [
  'Nhava Sheva (INNSA), India',
  'Mundra (INMUN), India',
  'Chennai (INMAA), India',
  'Kolkata (INCCU), India',
  'Cochin (INCOK), India',
  'Pipavav (INPAV), India',
  'Hazira (INHAZ), India',
  'Tughlakabad ICD (INTKD), India',
  'Rotterdam (NLRTM), Netherlands',
  'Antwerp (BEANR), Belgium',
  'Hamburg (DEHAM), Germany',
  'Felixstowe (GBFXT), United Kingdom',
  'Southampton (GBSOU), United Kingdom',
  'Le Havre (FRLEH), France',
  'Valencia (ESVLC), Spain',
  'Genoa (ITGOA), Italy',
  'Jebel Ali (AEJEA), United Arab Emirates',
  'Salalah (OMSLL), Oman',
  'Singapore (SGSIN), Singapore',
  'Port Klang (MYPKG), Malaysia',
  'Tanjung Pelepas (MYTPP), Malaysia',
  'Shanghai (CNSHA), China',
  'Ningbo-Zhoushan (CNNGB), China',
  'Shenzhen (CNSZX), China',
  'Guangzhou (CNGZG), China',
  'Qingdao (CNTAO), China',
  'Busan (KRPUS), South Korea',
  'Los Angeles (USLAX), United States',
  'Long Beach (USLGB), United States',
  'New York / New Jersey (USNYC), United States',
  'Savannah (USSAV), United States',
  'Houston (USHOU), United States',
];

export const MASTER_LOCATIONS: LocationMasterItem[] = [
  {
    id: 'loc-INNSA',
    unLocode: 'INNSA',
    name: 'Nhava Sheva (JNPT)',
    country: 'India',
    countryCode: 'IN',
    region: 'Maharashtra / West Coast',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['NSICT', 'NSIGT', 'BMCT', 'APMT Mumbai', 'JNPCT'],
    coordinates: { lat: 18.9499, lng: 72.9515 },
    customsZoneCode: 'INNSA1',
    status: 'active',
    remarks: 'Premier container gateway of India handling ~55% of national container volume.',
  },
  {
    id: 'loc-INMUN',
    unLocode: 'INMUN',
    name: 'Mundra',
    country: 'India',
    countryCode: 'IN',
    region: 'Gujarat / Gulf of Kutch',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['MICT (DP World)', 'AMCT (Adani)', 'CT3 (CMA CGM)', 'CT4 (MSC JV)'],
    coordinates: { lat: 22.7544, lng: 69.7047 },
    customsZoneCode: 'INMUN1',
    status: 'active',
    remarks: 'Deep draft private port with dedicated double-stack rail connectivity to North India.',
  },
  {
    id: 'loc-INMAA',
    unLocode: 'INMAA',
    name: 'Chennai',
    country: 'India',
    countryCode: 'IN',
    region: 'Tamil Nadu / East Coast',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['CCTL (DP World)', 'CITPL (PSA Chennai)'],
    coordinates: { lat: 13.0827, lng: 80.2707 },
    customsZoneCode: 'INMAA1',
    status: 'active',
    remarks: 'Primary automotive and industrial manufacturing export gateway for South India.',
  },
  {
    id: 'loc-INPAV',
    unLocode: 'INPAV',
    name: 'Pipavav',
    country: 'India',
    countryCode: 'IN',
    region: 'Gujarat / Saurashtra',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['APM Terminals Pipavav'],
    coordinates: { lat: 20.9167, lng: 71.5000 },
    customsZoneCode: 'INPAV1',
    status: 'active',
    remarks: 'Direct double-stack rail container corridor gateway.',
  },
  {
    id: 'loc-INHAZ',
    unLocode: 'INHAZ',
    name: 'Hazira',
    country: 'India',
    countryCode: 'IN',
    region: 'Gujarat / Surat',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Adani Hazira Port (AHPPL)'],
    coordinates: { lat: 21.1000, lng: 72.6333 },
    customsZoneCode: 'INHAZ1',
    status: 'active',
    remarks: 'Industrial chemical, textiles and engineering export hub.',
  },
  {
    id: 'loc-INTKD',
    unLocode: 'INTKD',
    name: 'Tughlakabad ICD',
    country: 'India',
    countryCode: 'IN',
    region: 'Delhi NCR',
    type: 'Inland Container Depot (ICD)',
    capabilities: { isPOR: true, isPOL: false, isPOD: false, isFPOD: true },
    terminals: ['CONCOR ICD TKD Hub'],
    coordinates: { lat: 28.5089, lng: 77.2831 },
    customsZoneCode: 'INTKD6',
    status: 'active',
    remarks: 'Largest dry port and inland customs bonded terminal in Asia.',
  },
  {
    id: 'loc-INCOK',
    unLocode: 'INCOK',
    name: 'Cochin (Vallarpadam)',
    country: 'India',
    countryCode: 'IN',
    region: 'Kerala / South Coast',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['ICTT Vallarpadam (DP World)'],
    coordinates: { lat: 9.9667, lng: 76.2667 },
    customsZoneCode: 'INCOK1',
    status: 'active',
    remarks: 'International container transshipment hub close to major global trunk sea lanes.',
  },
  {
    id: 'loc-INCCU',
    unLocode: 'INCCU',
    name: 'Kolkata (SMP Port)',
    country: 'India',
    countryCode: 'IN',
    region: 'West Bengal / East Coast',
    type: 'River Port',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Netaji Subhash Dock (NSD)', 'Khidderpore Docks (KPD)'],
    coordinates: { lat: 22.5447, lng: 88.3194 },
    customsZoneCode: 'INCCU1',
    status: 'active',
    remarks: 'Riverine hub catering to Eastern India, Nepal, and Bhutan.',
  },
  {
    id: 'loc-NLRTM',
    unLocode: 'NLRTM',
    name: 'Rotterdam',
    country: 'Netherlands',
    countryCode: 'NL',
    region: 'South Holland / Rhine-Meuse',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['ECT Delta', 'APM Terminals Maasvlakte II', 'Rotterdam World Gateway (RWG)'],
    coordinates: { lat: 51.9244, lng: 4.4777 },
    customsZoneCode: 'NL0001',
    status: 'active',
    remarks: 'Largest seaport in Europe with direct Rhine barge and rail feeder network.',
  },
  {
    id: 'loc-BEANR',
    unLocode: 'BEANR',
    name: 'Antwerp-Bruges',
    country: 'Belgium',
    countryCode: 'BE',
    region: 'Flanders / Scheldt',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Antwerp Gateway (Q1700)', 'MPET (Deurganckdock Q1742)'],
    coordinates: { lat: 51.2194, lng: 4.4025 },
    customsZoneCode: 'BE0002',
    status: 'active',
    remarks: 'Premier chemical cluster and European transshipment gateway.',
  },
  {
    id: 'loc-DEHAM',
    unLocode: 'DEHAM',
    name: 'Hamburg',
    country: 'Germany',
    countryCode: 'DE',
    region: 'Hamburg / Elbe',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['CTA Altenwerder', 'CTB Burchardkai', 'CTT Tollerort'],
    coordinates: { lat: 53.5511, lng: 9.9937 },
    customsZoneCode: 'DE0003',
    status: 'active',
    remarks: 'Major rail connection hub for Central & Eastern Europe.',
  },
  {
    id: 'loc-GBFXT',
    unLocode: 'GBFXT',
    name: 'Felixstowe',
    country: 'United Kingdom',
    countryCode: 'GB',
    region: 'Suffolk / East England',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Trinity Terminal', 'Berths 8 & 9'],
    coordinates: { lat: 51.9622, lng: 1.3511 },
    customsZoneCode: 'GB0001',
    status: 'active',
    remarks: 'Handles ~48% of Britain containerized trade with intermodal rail.',
  },
  {
    id: 'loc-AEJEA',
    unLocode: 'AEJEA',
    name: 'Jebel Ali',
    country: 'United Arab Emirates',
    countryCode: 'AE',
    region: 'Dubai / Persian Gulf',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['DP World Jebel Ali T1', 'Terminal 2', 'Terminal 3', 'Terminal 4'],
    coordinates: { lat: 24.9857, lng: 55.0273 },
    customsZoneCode: 'AE0001',
    status: 'active',
    remarks: 'Flagship mega-hub of the Middle East connecting South Asia, Africa and Europe.',
  },
  {
    id: 'loc-SGSIN',
    unLocode: 'SGSIN',
    name: 'Singapore',
    country: 'Singapore',
    countryCode: 'SG',
    region: 'Singapore Straits',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['PSA Pasir Panjang', 'Tuas Port Mega Hub'],
    coordinates: { lat: 1.29027, lng: 103.851959 },
    customsZoneCode: 'SG0001',
    status: 'active',
    remarks: 'World top container transshipment hub connecting over 600 global ports.',
  },
  {
    id: 'loc-CNSHA',
    unLocode: 'CNSHA',
    name: 'Shanghai (Yangshan)',
    country: 'China',
    countryCode: 'CN',
    region: 'East China / Yangtze River Delta',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Yangshan Deepwater Phase I-IV', 'Waigaoqiao Phase 1-6'],
    coordinates: { lat: 31.2304, lng: 121.4737 },
    customsZoneCode: 'CN0001',
    status: 'active',
    remarks: 'World busiest container port handling over 49M TEUs annually.',
  },
  {
    id: 'loc-USLAX',
    unLocode: 'USLAX',
    name: 'Los Angeles',
    country: 'United States',
    countryCode: 'US',
    region: 'California / San Pedro Bay',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Pier 400 (APMT)', 'Fenix Marine Services', 'Trapac'],
    coordinates: { lat: 33.7432, lng: -118.2673 },
    customsZoneCode: 'US2704',
    status: 'active',
    remarks: 'Leading seaport in North America for Transpacific ocean trade.',
  },
  {
    id: 'loc-USNYC',
    unLocode: 'USNYC',
    name: 'New York / New Jersey',
    country: 'United States',
    countryCode: 'US',
    region: 'New York / East Coast',
    type: 'Seaport',
    capabilities: { isPOR: true, isPOL: true, isPOD: true, isFPOD: true },
    terminals: ['Maher Terminals', 'Port Newark Container Terminal (PNCT)', 'APMT Elizabeth'],
    coordinates: { lat: 40.7128, lng: -74.0060 },
    customsZoneCode: 'US1001',
    status: 'active',
    remarks: 'Largest East Coast maritime gateway serving the major US consuming centers.',
  },
];

export const FREIGHT_EQUIPMENT = [
  "20' Standard (20DV)",
  "40' Standard (40DV)",
  "40' High Cube (40HC)",
  "45' High Cube (45HC)",
  "20' Reefer (20RF)",
  "40' Reefer HC (40HR)",
  "20' Open Top (20OT)",
  "40' Open Top (40OT)",
  "20' Flat Rack (20FR)",
  "40' Flat Rack (40FR)",
  'ISO Tank Container',
  'Bulk Container',
];

export const MASTER_EQUIPMENT: EquipmentMasterItem[] = [
  {
    id: 'eq-20DV',
    isoCode: '20DV',
    isoGroup: '22G1',
    name: "20' Standard Dry (20DV)",
    category: 'Dry Standard',
    lengthFt: 20,
    heightFt: 8.5,
    maxGrossKg: 30480,
    tareWeightKg: 2280,
    maxPayloadKg: 28200,
    volumeCbm: 33.2,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    status: 'active',
    remarks: 'Standard general purpose ISO dry box for dense and heavy weight cargo.',
  },
  {
    id: 'eq-40DV',
    isoCode: '40DV',
    isoGroup: '42G1',
    name: "40' Standard Dry (40DV)",
    category: 'Dry Standard',
    lengthFt: 40,
    heightFt: 8.5,
    maxGrossKg: 30480,
    tareWeightKg: 3780,
    maxPayloadKg: 26700,
    volumeCbm: 67.7,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    status: 'active',
    remarks: 'General cargo ISO box for volumetric dry items.',
  },
  {
    id: 'eq-40HC',
    isoCode: '40HC',
    isoGroup: '45G1',
    name: "40' High Cube (40HC)",
    category: 'High Cube',
    lengthFt: 40,
    heightFt: 9.5,
    maxGrossKg: 32500,
    tareWeightKg: 3900,
    maxPayloadKg: 28600,
    volumeCbm: 76.4,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    status: 'active',
    remarks: 'Most widely demanded container type with 1 foot extra vertical clearance.',
  },
  {
    id: 'eq-45HC',
    isoCode: '45HC',
    isoGroup: '45U1',
    name: "45' High Cube (45HC)",
    category: 'High Cube',
    lengthFt: 45,
    heightFt: 9.5,
    maxGrossKg: 32500,
    tareWeightKg: 4700,
    maxPayloadKg: 27800,
    volumeCbm: 86.0,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    status: 'active',
    remarks: 'High cube container optimized for light bulky items on intra-Europe & Transpacific.',
  },
  {
    id: 'eq-20RF',
    isoCode: '20RF',
    isoGroup: '22R1',
    name: "20' Refrigerated Container (20RF)",
    category: 'Reefer',
    lengthFt: 20,
    heightFt: 8.5,
    maxGrossKg: 30480,
    tareWeightKg: 3080,
    maxPayloadKg: 27400,
    volumeCbm: 28.3,
    isHazardousAllowed: false,
    isReefer: true,
    isOogAllowed: false,
    status: 'active',
    remarks: 'Built-in refrigeration unit maintaining temperatures from -30°C to +30°C.',
  },
  {
    id: 'eq-40HR',
    isoCode: '40HR',
    isoGroup: '45R1',
    name: "40' Reefer High Cube (40HR)",
    category: 'Reefer',
    lengthFt: 40,
    heightFt: 9.5,
    maxGrossKg: 34000,
    tareWeightKg: 4500,
    maxPayloadKg: 29500,
    volumeCbm: 67.8,
    isHazardousAllowed: false,
    isReefer: true,
    isOogAllowed: false,
    status: 'active',
    remarks: 'Primary reefer equipment for perishable agricultural and pharmaceutical exports.',
  },
  {
    id: 'eq-20OT',
    isoCode: '20OT',
    isoGroup: '22U1',
    name: "20' Open Top (20OT)",
    category: 'Open Top',
    lengthFt: 20,
    heightFt: 8.5,
    maxGrossKg: 30480,
    tareWeightKg: 2350,
    maxPayloadKg: 28130,
    volumeCbm: 32.5,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: true,
    status: 'active',
    remarks: 'Removable roof bow and tarpaulin for top-loading of heavy machinery.',
  },
  {
    id: 'eq-40OT',
    isoCode: '40OT',
    isoGroup: '42U1',
    name: "40' Open Top (40OT)",
    category: 'Open Top',
    lengthFt: 40,
    heightFt: 8.5,
    maxGrossKg: 30480,
    tareWeightKg: 3850,
    maxPayloadKg: 26630,
    volumeCbm: 66.5,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: true,
    status: 'active',
    remarks: 'Open top container for tall project cargo.',
  },
  {
    id: 'eq-20FR',
    isoCode: '20FR',
    isoGroup: '22P1',
    name: "20' Flat Rack (20FR)",
    category: 'Flat Rack',
    lengthFt: 20,
    heightFt: 8.5,
    maxGrossKg: 31000,
    tareWeightKg: 2750,
    maxPayloadKg: 28250,
    volumeCbm: 27.9,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: true,
    status: 'active',
    remarks: 'End-wall flat rack container for out-of-gauge (OOG) and breakbulk cargo.',
  },
  {
    id: 'eq-40FR',
    isoCode: '40FR',
    isoGroup: '42P1',
    name: "40' Flat Rack (40FR)",
    category: 'Flat Rack',
    lengthFt: 40,
    heightFt: 8.5,
    maxGrossKg: 45000,
    tareWeightKg: 5300,
    maxPayloadKg: 39700,
    volumeCbm: 54.8,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: true,
    status: 'active',
    remarks: 'Heavy capacity flat rack for oversized industrial plant equipment.',
  },
  {
    id: 'eq-ISOTank',
    isoCode: 'ISO Tank',
    isoGroup: '22T1',
    name: "20' ISO Tank Container",
    category: 'ISO Tank',
    lengthFt: 20,
    heightFt: 8.5,
    maxGrossKg: 36000,
    tareWeightKg: 3800,
    maxPayloadKg: 32200,
    volumeCbm: 26.0,
    isHazardousAllowed: true,
    isReefer: false,
    isOogAllowed: false,
    status: 'active',
    remarks: 'Cylindrical pressure vessel for hazardous and non-hazardous bulk liquid cargo.',
  },
];

export const INCOTERMS_2020 = [
  'FOB - Free on Board',
  'CIF - Cost, Insurance and Freight',
  'CFR - Cost and Freight',
  'EXW - Ex Works',
  'FCA - Free Carrier',
  'CPT - Carriage Paid To',
  'CIP - Carriage and Insurance Paid To',
  'DAP - Delivered at Place',
  'DPU - Delivered at Place Unloaded',
  'DDP - Delivered Duty Paid',
  'FAS - Free Alongside Ship',
];

export const MASTER_INCOTERMS: IncotermMasterItem[] = [
  {
    id: 'inc-FOB',
    code: 'FOB',
    name: 'Free on Board',
    category: 'Sea & Inland Waterway',
    riskTransferPoint: 'When goods are loaded on board the vessel at port of origin',
    costFreight: 'Buyer',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
  {
    id: 'inc-CIF',
    code: 'CIF',
    name: 'Cost, Insurance and Freight',
    category: 'Sea & Inland Waterway',
    riskTransferPoint: 'When goods are on board vessel (cost paid by seller till destination port)',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Seller',
    status: 'active',
  },
  {
    id: 'inc-CFR',
    code: 'CFR',
    name: 'Cost and Freight',
    category: 'Sea & Inland Waterway',
    riskTransferPoint: 'When goods are on board vessel (seller pays ocean freight to destination port)',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
  {
    id: 'inc-EXW',
    code: 'EXW',
    name: 'Ex Works',
    category: 'Any Transport Mode',
    riskTransferPoint: 'At seller factory / warehouse before loading',
    costFreight: 'Buyer',
    costOriginTHC: 'Buyer',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Buyer',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
  {
    id: 'inc-FCA',
    code: 'FCA',
    name: 'Free Carrier',
    category: 'Any Transport Mode',
    riskTransferPoint: 'When delivered to named carrier at agreed origin location',
    costFreight: 'Buyer',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
  {
    id: 'inc-CPT',
    code: 'CPT',
    name: 'Carriage Paid To',
    category: 'Any Transport Mode',
    riskTransferPoint: 'When handed to first carrier (carriage paid by seller to destination)',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
  {
    id: 'inc-CIP',
    code: 'CIP',
    name: 'Carriage and Insurance Paid To',
    category: 'Any Transport Mode',
    riskTransferPoint: 'When handed to first carrier (seller pays carriage and comprehensive insurance)',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Seller',
    status: 'active',
  },
  {
    id: 'inc-DAP',
    code: 'DAP',
    name: 'Delivered at Place',
    category: 'Any Transport Mode',
    riskTransferPoint: 'At named place of destination ready for unloading',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Seller',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Seller',
    status: 'active',
  },
  {
    id: 'inc-DPU',
    code: 'DPU',
    name: 'Delivered at Place Unloaded',
    category: 'Any Transport Mode',
    riskTransferPoint: 'At named place of destination unloaded from arriving conveyance',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Seller',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Seller',
    status: 'active',
  },
  {
    id: 'inc-DDP',
    code: 'DDP',
    name: 'Delivered Duty Paid',
    category: 'Any Transport Mode',
    riskTransferPoint: 'At destination with import customs clearance completed and duties paid by seller',
    costFreight: 'Seller',
    costOriginTHC: 'Seller',
    costDestTHC: 'Seller',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Seller',
    costInsurance: 'Seller',
    status: 'active',
  },
  {
    id: 'inc-FAS',
    code: 'FAS',
    name: 'Free Alongside Ship',
    category: 'Sea & Inland Waterway',
    riskTransferPoint: 'Alongside the ship at named port of loading',
    costFreight: 'Buyer',
    costOriginTHC: 'Buyer',
    costDestTHC: 'Buyer',
    costCustomsExport: 'Seller',
    costCustomsImport: 'Buyer',
    costInsurance: 'Buyer',
    status: 'active',
  },
];

export const MASTER_CARRIERS: CarrierMasterItem[] = [
  {
    id: 'car-MAEU',
    name: 'A.P. Moller - Maersk',
    scacCode: 'MAEU',
    carrierCode: 'MSK',
    type: 'MLO',
    alliance: 'Gemini Cooperation',
    country: 'Denmark',
    fleetTEU: '4,250,000 TEU',
    bookingEmail: 'bookings.apac@maersk.com',
    trackingApiEndpoint: 'https://api.maersk.com/track-and-trace/v2',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'Integrated logistics integrator with extensive inland haulage and terminal ownership.',
  },
  {
    id: 'car-MSCU',
    name: 'Mediterranean Shipping Company (MSC)',
    scacCode: 'MSCU',
    carrierCode: 'MSC',
    type: 'MLO',
    alliance: 'Independent',
    country: 'Switzerland',
    fleetTEU: '5,850,000 TEU',
    bookingEmail: 'ocean.desk@msc.com',
    trackingApiEndpoint: 'https://api.msc.com/v1/tracking',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR', 'ISO Tank'],
    status: 'active',
    remarks: 'World largest container ocean carrier with direct services across all major corridors.',
  },
  {
    id: 'car-CMDU',
    name: 'CMA CGM Group',
    scacCode: 'CMDU',
    carrierCode: 'CMA',
    type: 'MLO',
    alliance: 'Ocean Alliance',
    country: 'France',
    fleetTEU: '3,720,000 TEU',
    bookingEmail: 'bookings@cma-cgm.com',
    trackingApiEndpoint: 'https://api.cma-cgm.com/shipment/v3',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR', 'ISO Tank'],
    status: 'active',
    remarks: 'Strong presence on Asia-Europe, Transpacific, and Latin American lanes with LNG vessel leadership.',
  },
  {
    id: 'car-HLCU',
    name: 'Hapag-Lloyd AG',
    scacCode: 'HLCU',
    carrierCode: 'HAP',
    type: 'MLO',
    alliance: 'Gemini Cooperation',
    country: 'Germany',
    fleetTEU: '2,150,000 TEU',
    bookingEmail: 'orders.india@hapag-lloyd.com',
    trackingApiEndpoint: 'https://api.hlag.com/tracking/v1',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'Known for high schedule reliability, Reefer Plus fleet, and North European services.',
  },
  {
    id: 'car-ONEY',
    name: 'Ocean Network Express (ONE)',
    scacCode: 'ONEY',
    carrierCode: 'ONE',
    type: 'MLO',
    alliance: 'THE Alliance / Premier',
    country: 'Singapore / Japan',
    fleetTEU: '1,920,000 TEU',
    bookingEmail: 'customer.care@one-line.com',
    trackingApiEndpoint: 'https://api.one-line.com/tracking/v2',
    supportedEquipment: ['20DV', '40DV', '40HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'Joint venture of NYK, MOL, and K-Line with magenta fleet and strong Far East connectivity.',
  },
  {
    id: 'car-COSU',
    name: 'COSCO Shipping Lines',
    scacCode: 'COSU',
    carrierCode: 'COS',
    type: 'MLO',
    alliance: 'Ocean Alliance',
    country: 'China',
    fleetTEU: '3,100,000 TEU',
    bookingEmail: 'booking.service@coscon.com',
    trackingApiEndpoint: 'https://api.coscoshipping.com/track/v1',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'State-owned shipping giant with dominant market share on Asia-Indian Subcontinent routes.',
  },
  {
    id: 'car-EGLV',
    name: 'Evergreen Marine Corp',
    scacCode: 'EGLV',
    carrierCode: 'EVG',
    type: 'MLO',
    alliance: 'Ocean Alliance',
    country: 'Taiwan',
    fleetTEU: '1,710,000 TEU',
    bookingEmail: 'cs.inbound@evergreen-marine.com',
    trackingApiEndpoint: 'https://api.evergreen-marine.com/v1/trace',
    supportedEquipment: ['20DV', '40DV', '40HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'Pioneer of round-the-world services and high capacity ultra large container vessels.',
  },
  {
    id: 'car-UNIF',
    name: 'Unifeeder Group (DP World)',
    scacCode: 'UNIF',
    carrierCode: 'UNF',
    type: 'Feeder Operator',
    alliance: 'Regional Feeder',
    country: 'Denmark / UAE',
    fleetTEU: '165,000 TEU',
    bookingEmail: 'feeder.charter@unifeeder.com',
    supportedEquipment: ['20DV', '40DV', '40HC', '20RF', '40HR'],
    status: 'active',
    remarks: 'Largest feeder and shortsea network across Europe, Middle East and Indian Subcontinent.',
  },
  {
    id: 'car-BANQ',
    name: 'Kuehne + Nagel (Blue Anchor Line)',
    scacCode: 'BANQ',
    carrierCode: 'KN',
    type: 'NVOCC',
    alliance: 'Global Forwarder',
    country: 'Switzerland',
    fleetTEU: '4,300,000 TEU (Managed)',
    bookingEmail: 'seafreight.global@kuehne-nagel.com',
    trackingApiEndpoint: 'https://api.kuehne-nagel.com/sea/track/v1',
    supportedEquipment: ['20DV', '40DV', '40HC', '45HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR', 'ISO Tank'],
    status: 'active',
    remarks: 'World #1 global ocean freight forwarder operating tier-1 NVOCC services.',
  },
  {
    id: 'car-DMLI',
    name: 'DHL Global Forwarding (Danmar Lines)',
    scacCode: 'DMLI',
    carrierCode: 'DHL',
    type: 'NVOCC',
    alliance: 'Global Forwarder',
    country: 'Germany',
    fleetTEU: '3,200,000 TEU (Managed)',
    bookingEmail: 'oceanfreight.inquiry@dhl.com',
    trackingApiEndpoint: 'https://api.dhl.com/dgf/tracking/v1',
    supportedEquipment: ['20DV', '40DV', '40HC', '20RF', '40HR', '20OT', '40OT', '20FR', '40FR'],
    status: 'active',
    remarks: 'Global NVOCC carrier backed by DHL multi-modal air and ocean network.',
  },
];

export const MASTER_COMMODITIES: CommodityMasterItem[] = [
  {
    id: 'cmd-870829',
    hsCode: '8708.29',
    chapter: '87',
    heading: '8708',
    name: 'Automotive Components, Body Parts & Accessories',
    isHazardous: false,
    status: 'active',
  },
  {
    id: 'cmd-847989',
    hsCode: '8479.89',
    chapter: '84',
    heading: '8479',
    name: 'Industrial Machinery & Mechanical Processing Appliances',
    isHazardous: false,
    status: 'active',
  },
  {
    id: 'cmd-854140',
    hsCode: '8541.40',
    chapter: '85',
    heading: '8541',
    name: 'Solar PV Modules, Photovoltaic Cells & Inverters',
    isHazardous: false,
    storageReqs: 'Keep dry, do not double-stack pallets beyond 2 levels',
    status: 'active',
  },
  {
    id: 'cmd-381400',
    hsCode: '3814.00',
    chapter: '38',
    heading: '3814',
    name: 'Organic Composite Solvents & Chemical Thinners',
    isHazardous: true,
    imoClass: 'Class 3 (Flammable Liquid)',
    unNumber: 'UN1263',
    storageReqs: 'Away from heat sources, certified UN drums only',
    status: 'active',
  },
  {
    id: 'cmd-520811',
    hsCode: '5208.11',
    chapter: '52',
    heading: '5208',
    name: 'Woven Organic Cotton Fabrics & Garments',
    isHazardous: false,
    status: 'active',
  },
  {
    id: 'cmd-847130',
    hsCode: '8471.30',
    chapter: '84',
    heading: '8471',
    name: 'Portable Automatic Data Processing Machines / Laptops',
    isHazardous: true,
    imoClass: 'Class 9 (Miscellaneous Dangerous Goods - Lithium Battery)',
    unNumber: 'UN3481',
    storageReqs: 'IMO Section II packed with equipment compliance',
    status: 'active',
  },
  {
    id: 'cmd-290511',
    hsCode: '2905.11',
    chapter: '29',
    heading: '2905',
    name: 'Methanol (Methyl Alcohol) Technical Grade',
    isHazardous: true,
    imoClass: 'Class 3 + 6.1 (Flammable Toxic Liquid)',
    unNumber: 'UN1230',
    storageReqs: 'Dedicated ISO tank with vapor recovery system',
    status: 'active',
  },
  {
    id: 'cmd-090111',
    hsCode: '0901.11',
    chapter: '09',
    heading: '0901',
    name: 'Coffee Beans, Not Roasted, Not Decaffeinated',
    isHazardous: false,
    storageReqs: 'Food grade clean container, desiccants mandatory',
    status: 'active',
  },
];

export const MASTER_TAX_SAC: TaxSACMasterItem[] = [
  {
    id: 'sac-998431',
    sacCode: '998431',
    description: 'Transportation of goods by inland waterways and coastal shipping',
    standardGSTRate: 5,
    rcmApplicable: true,
    category: 'Maritime Freight Transport',
    status: 'active',
  },
  {
    id: 'sac-998439',
    sacCode: '998439',
    description: 'Other maritime and international sea freight transport services',
    standardGSTRate: 5,
    rcmApplicable: false,
    category: 'International Ocean Transport',
    status: 'active',
  },
  {
    id: 'sac-998540',
    sacCode: '998540',
    description: 'Packaging, cargo handling, container stuffing and destuffing services',
    standardGSTRate: 18,
    rcmApplicable: false,
    category: 'Terminal Handling (THC)',
    status: 'active',
  },
  {
    id: 'sac-998511',
    sacCode: '998511',
    description: 'Customs brokerage, clearance and freight forwarding agency fees',
    standardGSTRate: 18,
    rcmApplicable: false,
    category: 'Customs Brokerage',
    status: 'active',
  },
  {
    id: 'sac-998412',
    sacCode: '998412',
    description: 'Container haulage and multimodal transportation by rail',
    standardGSTRate: 5,
    rcmApplicable: true,
    category: 'Inland Rail Haulage',
    status: 'active',
  },
  {
    id: 'sac-998421',
    sacCode: '998421',
    description: 'Freight transportation by road in specialized container trailers',
    standardGSTRate: 5,
    rcmApplicable: true,
    category: 'Port Drayage & Road Haulage',
    status: 'active',
  },
];

// Helper Query Functions
export function getPortByUnLocode(unLocode: string): LocationMasterItem | undefined {
  if (!unLocode) return undefined;
  const upper = unLocode.toUpperCase().trim();
  return MASTER_LOCATIONS.find((l) => l.unLocode === upper);
}

export function getCarrierByCode(code: string): CarrierMasterItem | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase().trim();
  return MASTER_CARRIERS.find((c) => c.scacCode === upper || c.carrierCode === upper || c.name.toUpperCase().includes(upper));
}

export function getEquipmentByCode(isoCode: string): EquipmentMasterItem | undefined {
  if (!isoCode) return undefined;
  const upper = isoCode.toUpperCase().trim();
  return MASTER_EQUIPMENT.find((e) => e.isoCode.toUpperCase() === upper || e.name.toUpperCase().includes(upper));
}

export function getIncotermByCode(code: string): IncotermMasterItem | undefined {
  if (!code) return undefined;
  const upper = code.toUpperCase().trim();
  return MASTER_INCOTERMS.find((i) => i.code === upper);
}

export function getCommodityByHS(hsCode: string): CommodityMasterItem | undefined {
  if (!hsCode) return undefined;
  const clean = hsCode.trim();
  return MASTER_COMMODITIES.find((c) => c.hsCode === clean);
}

export function filterLocationsByCapability(capability: 'isPOR' | 'isPOL' | 'isPOD' | 'isFPOD'): LocationMasterItem[] {
  return MASTER_LOCATIONS.filter((l) => l.capabilities[capability] && l.status === 'active');
}

export function calculateFreightGST(amount: number, sacCode: string = '998431'): { gstAmount: number; totalAmount: number; rate: number; isRCM: boolean } {
  const tax = MASTER_TAX_SAC.find((t) => t.sacCode === sacCode) || MASTER_TAX_SAC[0];
  const gstAmount = (amount * tax.standardGSTRate) / 100;
  return {
    gstAmount,
    totalAmount: amount + gstAmount,
    rate: tax.standardGSTRate,
    isRCM: tax.rcmApplicable,
  };
}

/**
 * Automatically assigns ⚓ for maritime Seaports/River Ports and 🗺️ for Inland Container Depots (ICD), CFS, Dry Ports, Airports, and Land Borders.
 */
export function getLocationTypeIcon(type?: string): string {
  if (!type) return '🗺️';
  const t = type.toLowerCase();
  if (t === 'seaport' || t === 'river port' || (t.includes('port') && !t.includes('dry') && !t.includes('inland') && !t.includes('depot'))) {
    return '⚓';
  }
  return '🗺️';
}

/**
 * Returns domain icons for Carrier classifications.
 */
export function getCarrierTypeIcon(type?: string): string {
  if (!type) return '🚢';
  const t = type.toUpperCase();
  if (t.includes('MLO') || t.includes('VESSEL')) return '🚢';
  if (t.includes('NVOCC') || t.includes('FORWARDER')) return '📦';
  if (t.includes('FEEDER')) return '🛥️';
  if (t.includes('RAIL') || t.includes('INTERMODAL')) return '🚆';
  if (t.includes('AIR')) return '✈️';
  return '🚢';
}

/**
 * Returns domain icons for Equipment categories.
 */
export function getEquipmentCategoryIcon(category?: string): string {
  if (!category) return '📦';
  const c = category.toLowerCase();
  if (c.includes('reefer') || c.includes('refrigerated')) return '❄️';
  if (c.includes('high cube') || c.includes('cube')) return '📐';
  if (c.includes('open top')) return '🏗️';
  if (c.includes('flat rack')) return '🚜';
  if (c.includes('tank')) return '🛢️';
  return '📦';
}

/**
 * Returns icon for Incoterms
 */
export function getIncotermIcon(): string {
  return '⚖️';
}


