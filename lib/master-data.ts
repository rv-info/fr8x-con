/**
 * lib/master-data.ts
 * Comprehensive master lists for CARRIER, POR, POL, POD, FPOD
 * Used in the rates editor and Godfather master data management.
 * Supports 3-letter UN/LOCODE prefix search for ports.
 */

export interface MasterCarrierEntry {
  scac: string;       // Standard Carrier Alpha Code (unique)
  name: string;       // Full carrier name
  shortName: string;  // Short display name
  country: string;
  type: 'ocean' | 'air' | 'multimodal';
}

export interface MasterPortEntry {
  locode: string;       // UN/LOCODE e.g. "INNSA"
  code3: string;        // 3-letter search prefix e.g. "INS" or "RTM"
  name: string;         // Display name
  country: string;
  countryCode: string;  // ISO2
  type: 'seaport' | 'inland' | 'airport' | 'dry_port';
  region: string;
}

// ─── OCEAN CARRIERS ──────────────────────────────────────────────────────────
export const MASTER_CARRIERS_DATA: MasterCarrierEntry[] = [
  { scac: 'MAEU', name: 'Maersk Line', shortName: 'Maersk', country: 'Denmark', type: 'ocean' },
  { scac: 'MSCU', name: 'Mediterranean Shipping Company', shortName: 'MSC', country: 'Switzerland', type: 'ocean' },
  { scac: 'CMDU', name: 'CMA CGM S.A.', shortName: 'CMA CGM', country: 'France', type: 'ocean' },
  { scac: 'HLCU', name: 'Hapag-Lloyd AG', shortName: 'Hapag-Lloyd', country: 'Germany', type: 'ocean' },
  { scac: 'EGLV', name: 'Evergreen Marine Corporation', shortName: 'Evergreen', country: 'Taiwan', type: 'ocean' },
  { scac: 'COSU', name: 'COSCO Shipping Lines', shortName: 'COSCO', country: 'China', type: 'ocean' },
  { scac: 'YMLU', name: 'Yang Ming Marine Transport', shortName: 'Yang Ming', country: 'Taiwan', type: 'ocean' },
  { scac: 'HDMU', name: 'HMM Co. Ltd.', shortName: 'HMM', country: 'South Korea', type: 'ocean' },
  { scac: 'ONEY', name: 'Ocean Network Express', shortName: 'ONE', country: 'Singapore', type: 'ocean' },
  { scac: 'ZIMU', name: 'ZIM Integrated Shipping', shortName: 'ZIM', country: 'Israel', type: 'ocean' },
  { scac: 'WHLC', name: 'Wan Hai Lines', shortName: 'Wan Hai', country: 'Taiwan', type: 'ocean' },
  { scac: 'PABV', name: 'Pacific International Lines', shortName: 'PIL', country: 'Singapore', type: 'ocean' },
  { scac: 'ACLU', name: 'ACL (Atlantic Container Line)', shortName: 'ACL', country: 'Sweden', type: 'ocean' },
  { scac: 'ANRM', name: 'ANL Container Line', shortName: 'ANL', country: 'Australia', type: 'ocean' },
  { scac: 'BANQ', name: 'BANSARD International', shortName: 'BANSARD', country: 'France', type: 'ocean' },
  { scac: 'CHNL', name: 'China Navigation Company', shortName: 'CHINAV', country: 'Hong Kong', type: 'ocean' },
  { scac: 'CSFU', name: 'Sinolines', shortName: 'Sinolines', country: 'China', type: 'ocean' },
  { scac: 'SITC', name: 'SITC Container Lines', shortName: 'SITC', country: 'China', type: 'ocean' },
  { scac: 'KMTU', name: 'K Line (Kawasaki Kisen Kaisha)', shortName: 'K Line', country: 'Japan', type: 'ocean' },
  { scac: 'MOLU', name: 'MOL (Mitsui O.S.K. Lines)', shortName: 'MOL', country: 'Japan', type: 'ocean' },
  { scac: 'NYKU', name: 'NYK Line (Nippon Yusen Kaisha)', shortName: 'NYK', country: 'Japan', type: 'ocean' },
  { scac: 'ESMV', name: 'Evership Maritime', shortName: 'Evership', country: 'Singapore', type: 'ocean' },
  { scac: 'ARKU', name: 'Arkas Line', shortName: 'Arkas', country: 'Turkey', type: 'ocean' },
  { scac: 'AAHU', name: 'AAL Shipping', shortName: 'AAL', country: 'Singapore', type: 'ocean' },
  { scac: 'BLLS', name: 'Blue Logistics', shortName: 'Blue Log', country: 'India', type: 'multimodal' },
  { scac: 'INCO', name: 'Indolines Container', shortName: 'Indolines', country: 'India', type: 'ocean' },
  { scac: 'SCIU', name: 'Seacastle Container', shortName: 'Seacastle', country: 'USA', type: 'ocean' },
  { scac: 'RCLM', name: 'RCL (Regional Container Lines)', shortName: 'RCL', country: 'Thailand', type: 'ocean' },
  { scac: 'XPRS', name: 'X-Press Feeders', shortName: 'X-Press', country: 'Singapore', type: 'ocean' },
  { scac: 'SABC', name: 'SAF-Bunkers & Cargo', shortName: 'SAF', country: 'India', type: 'ocean' },
];

// ─── GLOBAL PORTS (UN/LOCODE format) ─────────────────────────────────────────
export const MASTER_PORTS_DATA: MasterPortEntry[] = [
  // India
  { locode: 'INNSA', code3: 'NSA', name: 'Nhava Sheva (JNPT)', country: 'India', countryCode: 'IN', type: 'seaport', region: 'South Asia' },
  { locode: 'INBOM', code3: 'BOM', name: 'Mumbai', country: 'India', countryCode: 'IN', type: 'seaport', region: 'South Asia' },
  { locode: 'INMUN', code3: 'MUN', name: 'Mundra', country: 'India', countryCode: 'IN', type: 'seaport', region: 'South Asia' },
  { locode: 'INKTP', code3: 'KTP', name: 'Kandla (Deendayal Port)', country: 'India', countryCode: 'IN', type: 'seaport', region: 'South Asia' },
  { locode: 'INMAA', code3: 'MAA', name: 'Chennai (Madras)', country: 'India', countryCode: 'IN', type: 'seaport', region: 'South Asia' },
  { locode: 'INCOK', code3: 'COK', name: 'Kochi (Cochin)', country: 'India', countryCode: 'IN', type: 'seaport', region: 'South Asia' },
  { locode: 'INVTZ', code3: 'VTZ', name: 'Visakhapatnam', country: 'India', countryCode: 'IN', type: 'seaport', region: 'South Asia' },
  { locode: 'INPNQ', code3: 'PNQ', name: 'Pune ICD', country: 'India', countryCode: 'IN', type: 'dry_port', region: 'South Asia' },
  { locode: 'INDEL', code3: 'DEL', name: 'Delhi ICD (Tughlakabad)', country: 'India', countryCode: 'IN', type: 'dry_port', region: 'South Asia' },
  { locode: 'INPAV', code3: 'PAV', name: 'Pipavav', country: 'India', countryCode: 'IN', type: 'seaport', region: 'South Asia' },
  { locode: 'INHAZ', code3: 'HAZ', name: 'Hazira', country: 'India', countryCode: 'IN', type: 'seaport', region: 'South Asia' },
  { locode: 'INCCU', code3: 'CCU', name: 'Kolkata', country: 'India', countryCode: 'IN', type: 'seaport', region: 'South Asia' },
  // Netherlands
  { locode: 'NLRTM', code3: 'RTM', name: 'Rotterdam', country: 'Netherlands', countryCode: 'NL', type: 'seaport', region: 'Europe' },
  { locode: 'NLAMS', code3: 'AMS', name: 'Amsterdam', country: 'Netherlands', countryCode: 'NL', type: 'seaport', region: 'Europe' },
  // Germany
  { locode: 'DEHAM', code3: 'HAM', name: 'Hamburg', country: 'Germany', countryCode: 'DE', type: 'seaport', region: 'Europe' },
  { locode: 'DEBRU', code3: 'BRU', name: 'Bremen / Bremerhaven', country: 'Germany', countryCode: 'DE', type: 'seaport', region: 'Europe' },
  // Belgium
  { locode: 'BEANR', code3: 'ANR', name: 'Antwerp', country: 'Belgium', countryCode: 'BE', type: 'seaport', region: 'Europe' },
  // UK
  { locode: 'GBFXT', code3: 'FXT', name: 'Felixstowe', country: 'United Kingdom', countryCode: 'GB', type: 'seaport', region: 'Europe' },
  { locode: 'GBSOU', code3: 'SOU', name: 'Southampton', country: 'United Kingdom', countryCode: 'GB', type: 'seaport', region: 'Europe' },
  { locode: 'GBLGP', code3: 'LGP', name: 'London Gateway', country: 'United Kingdom', countryCode: 'GB', type: 'seaport', region: 'Europe' },
  // France
  { locode: 'FRLEH', code3: 'LEH', name: 'Le Havre', country: 'France', countryCode: 'FR', type: 'seaport', region: 'Europe' },
  { locode: 'FRMRS', code3: 'MRS', name: 'Marseille', country: 'France', countryCode: 'FR', type: 'seaport', region: 'Europe' },
  // Spain
  { locode: 'ESBCN', code3: 'BCN', name: 'Barcelona', country: 'Spain', countryCode: 'ES', type: 'seaport', region: 'Europe' },
  { locode: 'ESVLC', code3: 'VLC', name: 'Valencia', country: 'Spain', countryCode: 'ES', type: 'seaport', region: 'Europe' },
  { locode: 'ESALG', code3: 'ALG', name: 'Algeciras', country: 'Spain', countryCode: 'ES', type: 'seaport', region: 'Europe' },
  // Italy
  { locode: 'ITGOA', code3: 'GOA', name: 'Genoa', country: 'Italy', countryCode: 'IT', type: 'seaport', region: 'Europe' },
  { locode: 'ITTRS', code3: 'TRS', name: 'Trieste', country: 'Italy', countryCode: 'IT', type: 'seaport', region: 'Europe' },
  // China
  { locode: 'CNSHA', code3: 'SHA', name: 'Shanghai', country: 'China', countryCode: 'CN', type: 'seaport', region: 'East Asia' },
  { locode: 'CNNBO', code3: 'NBO', name: 'Ningbo-Zhoushan', country: 'China', countryCode: 'CN', type: 'seaport', region: 'East Asia' },
  { locode: 'CNSZN', code3: 'SZN', name: 'Shenzhen (Yantian)', country: 'China', countryCode: 'CN', type: 'seaport', region: 'East Asia' },
  { locode: 'CNQIN', code3: 'QIN', name: 'Qingdao', country: 'China', countryCode: 'CN', type: 'seaport', region: 'East Asia' },
  { locode: 'CNTIA', code3: 'TIA', name: 'Tianjin (Xingang)', country: 'China', countryCode: 'CN', type: 'seaport', region: 'East Asia' },
  { locode: 'CNGUA', code3: 'GUA', name: 'Guangzhou (Nansha)', country: 'China', countryCode: 'CN', type: 'seaport', region: 'East Asia' },
  { locode: 'CNXAM', code3: 'XAM', name: 'Xiamen', country: 'China', countryCode: 'CN', type: 'seaport', region: 'East Asia' },
  // Singapore
  { locode: 'SGSIN', code3: 'SIN', name: 'Singapore', country: 'Singapore', countryCode: 'SG', type: 'seaport', region: 'Southeast Asia' },
  // Malaysia
  { locode: 'MYPKG', code3: 'PKG', name: 'Port Klang', country: 'Malaysia', countryCode: 'MY', type: 'seaport', region: 'Southeast Asia' },
  { locode: 'MYTPP', code3: 'TPP', name: 'Tanjung Pelepas', country: 'Malaysia', countryCode: 'MY', type: 'seaport', region: 'Southeast Asia' },
  // UAE
  { locode: 'AEJEA', code3: 'JEA', name: 'Jebel Ali (Dubai)', country: 'UAE', countryCode: 'AE', type: 'seaport', region: 'Middle East' },
  { locode: 'AEAUH', code3: 'AUH', name: 'Abu Dhabi (Khalifa Port)', country: 'UAE', countryCode: 'AE', type: 'seaport', region: 'Middle East' },
  // Saudi Arabia
  { locode: 'SAJED', code3: 'JED', name: 'Jeddah', country: 'Saudi Arabia', countryCode: 'SA', type: 'seaport', region: 'Middle East' },
  { locode: 'SADMM', code3: 'DMM', name: 'Dammam (King Abdul Aziz)', country: 'Saudi Arabia', countryCode: 'SA', type: 'seaport', region: 'Middle East' },
  // USA
  { locode: 'USLAX', code3: 'LAX', name: 'Los Angeles / Long Beach', country: 'USA', countryCode: 'US', type: 'seaport', region: 'North America' },
  { locode: 'USNYC', code3: 'NYC', name: 'New York / New Jersey', country: 'USA', countryCode: 'US', type: 'seaport', region: 'North America' },
  { locode: 'USSAV', code3: 'SAV', name: 'Savannah', country: 'USA', countryCode: 'US', type: 'seaport', region: 'North America' },
  { locode: 'USHOU', code3: 'HOU', name: 'Houston', country: 'USA', countryCode: 'US', type: 'seaport', region: 'North America' },
  { locode: 'USSEA', code3: 'SEA', name: 'Seattle / Tacoma', country: 'USA', countryCode: 'US', type: 'seaport', region: 'North America' },
  // South Korea
  { locode: 'KRPUS', code3: 'PUS', name: 'Busan', country: 'South Korea', countryCode: 'KR', type: 'seaport', region: 'East Asia' },
  { locode: 'KRICN', code3: 'ICN', name: 'Incheon', country: 'South Korea', countryCode: 'KR', type: 'seaport', region: 'East Asia' },
  // Japan
  { locode: 'JPYOK', code3: 'YOK', name: 'Yokohama', country: 'Japan', countryCode: 'JP', type: 'seaport', region: 'East Asia' },
  { locode: 'JPOSA', code3: 'OSA', name: 'Osaka / Kobe', country: 'Japan', countryCode: 'JP', type: 'seaport', region: 'East Asia' },
  { locode: 'JPNGO', code3: 'NGO', name: 'Nagoya', country: 'Japan', countryCode: 'JP', type: 'seaport', region: 'East Asia' },
  // Sri Lanka
  { locode: 'LKCMB', code3: 'CMB', name: 'Colombo', country: 'Sri Lanka', countryCode: 'LK', type: 'seaport', region: 'South Asia' },
  // Bangladesh
  { locode: 'BDCGP', code3: 'CGP', name: 'Chittagong', country: 'Bangladesh', countryCode: 'BD', type: 'seaport', region: 'South Asia' },
  // Pakistan
  { locode: 'PKKHI', code3: 'KHI', name: 'Karachi (KPT)', country: 'Pakistan', countryCode: 'PK', type: 'seaport', region: 'South Asia' },
  // Australia
  { locode: 'AUSYD', code3: 'SYD', name: 'Sydney (Port Botany)', country: 'Australia', countryCode: 'AU', type: 'seaport', region: 'Oceania' },
  { locode: 'AUMEL', code3: 'MEL', name: 'Melbourne', country: 'Australia', countryCode: 'AU', type: 'seaport', region: 'Oceania' },
  { locode: 'AUBNE', code3: 'BNE', name: 'Brisbane', country: 'Australia', countryCode: 'AU', type: 'seaport', region: 'Oceania' },
  // South Africa
  { locode: 'ZADUR', code3: 'DUR', name: 'Durban', country: 'South Africa', countryCode: 'ZA', type: 'seaport', region: 'Africa' },
  { locode: 'ZACPT', code3: 'CPT', name: 'Cape Town', country: 'South Africa', countryCode: 'ZA', type: 'seaport', region: 'Africa' },
  // Egypt
  { locode: 'EGPSD', code3: 'PSD', name: 'Port Said', country: 'Egypt', countryCode: 'EG', type: 'seaport', region: 'Middle East' },
  // Turkey
  { locode: 'TRIST', code3: 'IST', name: 'Istanbul (Ambarli)', country: 'Turkey', countryCode: 'TR', type: 'seaport', region: 'Europe' },
  { locode: 'TRMRX', code3: 'MRX', name: 'Mersin', country: 'Turkey', countryCode: 'TR', type: 'seaport', region: 'Middle East' },
  // Indonesia
  { locode: 'IDJKT', code3: 'JKT', name: 'Jakarta (Tanjung Priok)', country: 'Indonesia', countryCode: 'ID', type: 'seaport', region: 'Southeast Asia' },
  // Thailand
  { locode: 'THLCH', code3: 'LCH', name: 'Laem Chabang', country: 'Thailand', countryCode: 'TH', type: 'seaport', region: 'Southeast Asia' },
  // Vietnam
  { locode: 'VNHPH', code3: 'HPH', name: 'Hai Phong', country: 'Vietnam', countryCode: 'VN', type: 'seaport', region: 'Southeast Asia' },
  { locode: 'VNSGN', code3: 'SGN', name: 'Ho Chi Minh City (Cat Lai)', country: 'Vietnam', countryCode: 'VN', type: 'seaport', region: 'Southeast Asia' },
  // Canada
  { locode: 'CAVNC', code3: 'VNC', name: 'Vancouver', country: 'Canada', countryCode: 'CA', type: 'seaport', region: 'North America' },
  { locode: 'CAMTR', code3: 'MTR', name: 'Montreal', country: 'Canada', countryCode: 'CA', type: 'seaport', region: 'North America' },
  // Brazil
  { locode: 'BRSSZ', code3: 'SSZ', name: 'Santos', country: 'Brazil', countryCode: 'BR', type: 'seaport', region: 'South America' },
  // Morocco
  { locode: 'MATAN', code3: 'TAN', name: 'Tanger Med', country: 'Morocco', countryCode: 'MA', type: 'seaport', region: 'Africa' },
  // Colombia
  { locode: 'COBUN', code3: 'BUN', name: 'Buenaventura', country: 'Colombia', countryCode: 'CO', type: 'seaport', region: 'South America' },
  // Mexico
  { locode: 'MXZLO', code3: 'ZLO', name: 'Manzanillo', country: 'Mexico', countryCode: 'MX', type: 'seaport', region: 'North America' },
  // Oman
  { locode: 'OMSLL', code3: 'SLL', name: 'Salalah', country: 'Oman', countryCode: 'OM', type: 'seaport', region: 'Middle East' },
  // Kenya
  { locode: 'KEMBA', code3: 'MBA', name: 'Mombasa', country: 'Kenya', countryCode: 'KE', type: 'seaport', region: 'Africa' },
];

/**
 * Search ports by 3+ character prefix matching locode, code3, or name
 */
export function searchPorts(query: string, limit = 15): MasterPortEntry[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  return MASTER_PORTS_DATA.filter(
    (p) =>
      p.locode.toLowerCase().startsWith(q) ||
      p.code3.toLowerCase().startsWith(q) ||
      p.name.toLowerCase().includes(q) ||
      p.locode.slice(2).toLowerCase().startsWith(q) // e.g. "NSA" matches "INNSA"
  ).slice(0, limit);
}

/**
 * Search carriers by name, shortName, or SCAC prefix
 */
export function searchCarriers(query: string, limit = 15): MasterCarrierEntry[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase().trim();
  return MASTER_CARRIERS_DATA.filter(
    (c) =>
      c.shortName.toLowerCase().includes(q) ||
      c.name.toLowerCase().includes(q) ||
      c.scac.toLowerCase().startsWith(q)
  ).slice(0, limit);
}

/** Format port for display: "Nhava Sheva (JNPT) · INNSA" */
export function formatPort(p: MasterPortEntry): string {
  return `${p.name} (${p.locode})`;
}

/** Format carrier for display: "Maersk · MAEU" */
export function formatCarrier(c: MasterCarrierEntry): string {
  return `${c.shortName} — ${c.name}`;
}
