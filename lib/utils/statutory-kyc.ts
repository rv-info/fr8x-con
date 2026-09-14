/**
 * Statutory KYC & Corporate Trade Filings — Multi-Jurisdiction Engine
 *
 * Dynamically provides tax identifiers, corporate registries, customs codes, and
 * freight operating licenses based on the company's registered address country.
 */

export interface StatutoryFieldConfig {
  key: 'taxId' | 'corporateReg' | 'tradeCustomsCode' | 'logisticsLicense';
  label: string;
  shortLabel: string;
  placeholder: string;
  description: string;
  required: boolean;
  formatHelp?: string;
  uppercase?: boolean;
}

export interface StatutoryJurisdictionProfile {
  countryCode: string;
  countryName: string;
  flag: string;
  primaryTaxId: StatutoryFieldConfig;
  corporateReg: StatutoryFieldConfig;
  tradeCustomsCode: StatutoryFieldConfig;
  logisticsLicense: StatutoryFieldConfig;
  regulatoryAuthorities: string;
  nonRepudiationStatute: string;
  complianceRequiredKeys: ('taxId' | 'corporateReg' | 'tradeCustomsCode' | 'logisticsLicense')[];
}

export const STATUTORY_PROFILES: Record<string, StatutoryJurisdictionProfile> = {
  IN: {
    countryCode: 'IN',
    countryName: 'India',
    flag: '🇮🇳',
    primaryTaxId: {
      key: 'taxId',
      label: 'GSTN / GSTIN Identification (15 Digits)',
      shortLabel: 'GSTIN',
      placeholder: '27AAAAA0000A1Z5',
      description: 'Goods and Services Tax Identification Number validated with GSTN portal.',
      required: true,
      formatHelp: '15 alphanumeric characters: 2-digit state code + 10-char PAN + 1 + Z + check digit.',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'Income Tax PAN (10 Characters)',
      shortLabel: 'PAN Number',
      placeholder: 'AAAAA0000A',
      description: 'Permanent Account Number issued by the Indian Income Tax Department.',
      required: true,
      formatHelp: '10 alphanumeric characters: 5 letters + 4 digits + 1 letter.',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'Import Export Code (IEC)',
      shortLabel: 'DGFT IEC',
      placeholder: '0388129941',
      description: '10-digit DGFT trade authorization code for foreign export/import operations.',
      required: true,
      formatHelp: '10 numeric digits registered with DGFT.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'MTO Registration (DG Shipping)',
      shortLabel: 'MTO License',
      placeholder: 'MTO/DGS/2026/9912',
      description: 'Multimodal Transport Operator registration under the MMTG Act 1993.',
      required: false,
      formatHelp: 'Registration issued by Directorate General of Shipping.',
      uppercase: true,
    },
    regulatoryAuthorities: 'GSTN, DGFT Icegate & DG Shipping registries',
    nonRepudiationStatute: 'Goods and Services Tax Act 2017 & Indian Information Technology Act 2000',
    complianceRequiredKeys: ['taxId', 'corporateReg', 'tradeCustomsCode'],
  },

  US: {
    countryCode: 'US',
    countryName: 'United States',
    flag: '🇺🇸',
    primaryTaxId: {
      key: 'taxId',
      label: 'Federal EIN / Tax ID (9 Digits)',
      shortLabel: 'Federal EIN',
      placeholder: '12-3456789',
      description: 'Employer Identification Number issued by the Internal Revenue Service (IRS).',
      required: true,
      formatHelp: '9-digit format: XX-XXXXXXX.',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'State Corporate / LLC Filing No.',
      shortLabel: 'State Filing ID',
      placeholder: 'DE-7829104',
      description: 'Secretary of State Corporate Charter or Limited Liability Company registration number.',
      required: true,
      formatHelp: 'State prefix + entity registration number (e.g. DE, CA, NY, TX).',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'CBP Customs Broker / Importer ID',
      shortLabel: 'CBP Customs ID',
      placeholder: '11-2233445-00',
      description: 'U.S. Customs and Border Protection (CBP) filer code or continuous customs bond number.',
      required: false,
      formatHelp: 'IRS EIN or CBP-assigned customs filer code.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'FMC OTI License (NVOCC / Forwarder)',
      shortLabel: 'FMC OTI Lic.',
      placeholder: 'FMC-OTI-024881',
      description: 'Federal Maritime Commission Ocean Transportation Intermediary license.',
      required: false,
      formatHelp: 'FMC-assigned NVOCC or Ocean Freight Forwarder license number.',
      uppercase: true,
    },
    regulatoryAuthorities: 'Internal Revenue Service (IRS), CBP & Federal Maritime Commission (FMC)',
    nonRepudiationStatute: 'Title 46 U.S. Code (Shipping Act of 1984/OSRA) & US Uniform Commercial Code (UCC)',
    complianceRequiredKeys: ['taxId', 'corporateReg'],
  },

  AE: {
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    flag: '🇦🇪',
    primaryTaxId: {
      key: 'taxId',
      label: 'Tax Registration Number (TRN - 15 Digits)',
      shortLabel: 'UAE TRN',
      placeholder: '100234567800003',
      description: 'VAT Tax Registration Number certified by the Federal Tax Authority (FTA).',
      required: true,
      formatHelp: '15 numeric digits starting with 100.',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'Commercial Trade License No.',
      shortLabel: 'Trade License',
      placeholder: 'TL-981244 / DMCC-8271',
      description: 'Commercial License issued by Department of Economic Development (DED) or Free Zone authority.',
      required: true,
      formatHelp: 'License number issued by Dubai DED, DMCC, JAFZA, DAFZA, or Abu Dhabi DED.',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'UAE / Dubai Customs Client Code',
      shortLabel: 'Customs Code',
      placeholder: 'AE-1029384',
      description: 'Mirsal II / Dubai Customs importer-exporter registration code.',
      required: false,
      formatHelp: 'Customs business code issued by Dubai or Federal Customs Authority.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'Chamber of Commerce / Free Zone Logistics Permit',
      shortLabel: 'Logistics Permit',
      placeholder: 'JAFZA-LOG-5512',
      description: 'Commercial logistics activity endorsement or freight clearing permit.',
      required: false,
      formatHelp: 'Chamber of Commerce certificate or logistics operator approval.',
      uppercase: true,
    },
    regulatoryAuthorities: 'Federal Tax Authority (FTA), Dubai Economy & Tourism (DET) & Dubai Customs',
    nonRepudiationStatute: 'UAE Federal Decree-Law No. 32 of 2021 on Commercial Companies & Electronic Transactions Law',
    complianceRequiredKeys: ['taxId', 'corporateReg'],
  },

  GB: {
    countryCode: 'GB',
    countryName: 'United Kingdom',
    flag: '🇬🇧',
    primaryTaxId: {
      key: 'taxId',
      label: 'HMRC VAT Registration Number',
      shortLabel: 'UK VAT No.',
      placeholder: 'GB123456789',
      description: 'Value Added Tax identifier registered with HM Revenue & Customs.',
      required: true,
      formatHelp: 'Starts with GB followed by 9 or 12 digits.',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'Companies House CRN (8 Chars)',
      shortLabel: 'Companies House',
      placeholder: '08492019',
      description: 'Official Company Registration Number from Companies House Cardiff/Edinburgh.',
      required: true,
      formatHelp: '8 characters (numeric or SC/NI/OC prefix).',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'UK EORI Customs Number',
      shortLabel: 'UK EORI',
      placeholder: 'GB123456789000',
      description: 'Economic Operators Registration and Identification number for UK border customs.',
      required: true,
      formatHelp: 'Starts with GB + 12 digits.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'BIFA Membership / Customs Badge Code',
      shortLabel: 'BIFA / Badge',
      placeholder: 'BIFA-7812 / CHIEF-B44',
      description: 'British International Freight Association credential or port clearance badge.',
      required: false,
      formatHelp: 'Registered BIFA membership or port community system badge.',
      uppercase: true,
    },
    regulatoryAuthorities: 'HM Revenue & Customs (HMRC), Companies House & UK Border Force',
    nonRepudiationStatute: 'UK Companies Act 2006, Electronic Communications Act 2000 & Value Added Tax Act 1994',
    complianceRequiredKeys: ['taxId', 'corporateReg', 'tradeCustomsCode'],
  },

  EU: {
    countryCode: 'EU',
    countryName: 'European Union',
    flag: '🇪🇺',
    primaryTaxId: {
      key: 'taxId',
      label: 'EU VAT Identification (USt-IdNr / BTW / TVA)',
      shortLabel: 'EU VAT No.',
      placeholder: 'NL123456789B01 / DE123456789',
      description: 'European cross-border VAT number registered in European Commission VIES database.',
      required: true,
      formatHelp: '2-letter country code + national VAT number (e.g. NL, DE, FR, IT, ES, BE).',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'Commercial Register (KvK / Handelsregister / SIRET)',
      shortLabel: 'Commercial Reg.',
      placeholder: 'KvK 68912345 / HRB 123456',
      description: 'National chamber of commerce or trade court corporate registration number.',
      required: true,
      formatHelp: 'National registration code (e.g. KvK in NL, HRB in DE, SIRET in FR).',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'EU EORI Customs Identifier',
      shortLabel: 'EU EORI',
      placeholder: 'NL123456789 / DE123456789',
      description: 'Union Customs Code identification number for cross-border freight movements.',
      required: true,
      formatHelp: 'Member state code + alphanumeric sequence recognized across EU customs.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'National Freight Forwarder / Transport License',
      shortLabel: 'Transport Lic.',
      placeholder: 'TL-EU-99214',
      description: 'European Community freight transport authorization or national forwarder license.',
      required: false,
      formatHelp: 'EU Community License for the carriage of goods.',
      uppercase: true,
    },
    regulatoryAuthorities: 'European Commission VIES, National Commercial Registries & EU Customs',
    nonRepudiationStatute: 'Union Customs Code (Regulation EU 952/2013) & eIDAS Regulation (EU 910/2014)',
    complianceRequiredKeys: ['taxId', 'tradeCustomsCode'],
  },

  SG: {
    countryCode: 'SG',
    countryName: 'Singapore',
    flag: '🇸🇬',
    primaryTaxId: {
      key: 'taxId',
      label: 'Unique Entity Number (UEN - ACRA)',
      shortLabel: 'Singapore UEN',
      placeholder: '201829481M',
      description: 'Standard identification number for business entities registered with ACRA.',
      required: true,
      formatHelp: '9-10 alphanumeric characters issued by ACRA or government agencies.',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'ACRA Corporate Registration No.',
      shortLabel: 'ACRA Reg.',
      placeholder: 'UEN-201829481M',
      description: 'Accounting and Corporate Regulatory Authority business profile registration.',
      required: true,
      formatHelp: 'Official ACRA business registration entity code.',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'Singapore Customs Account / TradeNet ID',
      shortLabel: 'Customs Account',
      placeholder: 'CR-SG-88910',
      description: 'Singapore Customs registered entity code for TradeNet declarations.',
      required: false,
      formatHelp: 'Activated Singapore Customs business trade account.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'Singapore Logistics Association (SLA) Code',
      shortLabel: 'SLA Code',
      placeholder: 'SLA-MEM-4091',
      description: 'Membership or accreditation with the Singapore Logistics Association.',
      required: false,
      formatHelp: 'SLA freight forwarder accreditation number.',
      uppercase: true,
    },
    regulatoryAuthorities: 'ACRA, Inland Revenue Authority (IRAS) & Singapore Customs',
    nonRepudiationStatute: 'Singapore Companies Act (Cap. 50) & Electronic Transactions Act (ETA 2010)',
    complianceRequiredKeys: ['taxId'],
  },

  CN: {
    countryCode: 'CN',
    countryName: 'China',
    flag: '🇨🇳',
    primaryTaxId: {
      key: 'taxId',
      label: 'Unified Social Credit Code (USCC - 18 Digits)',
      shortLabel: 'China USCC',
      placeholder: '91310000717866572M',
      description: '18-digit national business registration and tax identification code.',
      required: true,
      formatHelp: '18 alphanumeric characters standardized across China.',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'Company Incorporation Registry No.',
      shortLabel: 'SAMR Registry',
      placeholder: 'SAMR-310115000',
      description: 'State Administration for Market Regulation business license registry number.',
      required: true,
      formatHelp: 'SAMR commercial registration code.',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'China Customs Registration (CR Code)',
      shortLabel: 'Customs CR Code',
      placeholder: '3104960001',
      description: '10-digit customs registration code issued by General Administration of Customs.',
      required: false,
      formatHelp: '10 numeric digits for China Customs clearance.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'Ministry of Transport NVOCC Certificate',
      shortLabel: 'MOT NVOCC',
      placeholder: 'MOC-NV-08214',
      description: 'Ministry of Transport of PRC qualification for international container transport.',
      required: false,
      formatHelp: 'MOT NVOCC certificate registration number.',
      uppercase: true,
    },
    regulatoryAuthorities: 'State Administration for Market Regulation (SAMR) & General Administration of Customs (GACC)',
    nonRepudiationStatute: 'Company Law of the People’s Republic of China & Electronic Signature Law',
    complianceRequiredKeys: ['taxId'],
  },

  HK: {
    countryCode: 'HK',
    countryName: 'Hong Kong SAR',
    flag: '🇭🇰',
    primaryTaxId: {
      key: 'taxId',
      label: 'Business Registration Certificate (BRN - 8 Digits)',
      shortLabel: 'HK BRN',
      placeholder: '12345678',
      description: 'Inland Revenue Department Business Registration Number.',
      required: true,
      formatHelp: '8 numeric digits from the Business Registration Certificate.',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'Companies Registry CR Number',
      shortLabel: 'HK CR No.',
      placeholder: 'CR-098214',
      description: 'Companies Registry Hong Kong certificate of incorporation number.',
      required: true,
      formatHelp: '7-8 digits issued by HK Companies Registry.',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'Hong Kong Customs Trade Declaration ID',
      shortLabel: 'Customs Trade ID',
      placeholder: 'HK-CUST-9921',
      description: 'Customs and Excise Department trade declaration account.',
      required: false,
      formatHelp: 'Tradelink or GovHK customs account identifier.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'HAFFA Member Registration Code',
      shortLabel: 'HAFFA Code',
      placeholder: 'HAFFA-7819',
      description: 'Hong Kong Association of Freight Forwarding and Logistics credential.',
      required: false,
      formatHelp: 'Accredited HAFFA membership code.',
      uppercase: true,
    },
    regulatoryAuthorities: 'Inland Revenue Department (IRD), Companies Registry & HK Customs',
    nonRepudiationStatute: 'Hong Kong Companies Ordinance (Cap. 622) & Electronic Transactions Ordinance (Cap. 553)',
    complianceRequiredKeys: ['taxId', 'corporateReg'],
  },

  AU: {
    countryCode: 'AU',
    countryName: 'Australia',
    flag: '🇦🇺',
    primaryTaxId: {
      key: 'taxId',
      label: 'Australian Business Number (ABN - 11 Digits)',
      shortLabel: 'ABN',
      placeholder: '51 824 753 556',
      description: 'Australian Business Register identifier issued by Australian Taxation Office.',
      required: true,
      formatHelp: '11 numeric digits.',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'Australian Company Number (ACN - 9 Digits)',
      shortLabel: 'ACN',
      placeholder: '123 456 789',
      description: 'Australian Securities and Investments Commission (ASIC) registration number.',
      required: true,
      formatHelp: '9 numeric digits.',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'Customs Client Identifier (CCID)',
      shortLabel: 'Customs CCID',
      placeholder: 'CCID-89214',
      description: 'Integrated Cargo System (ICS) client code from Australian Border Force.',
      required: false,
      formatHelp: 'ABF-issued customs client identification number.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'Freight & Trade Alliance (FTA) / Depot License',
      shortLabel: 'FTA / Depot Lic.',
      placeholder: 'FTA-AU-4412',
      description: 'FTA membership or Australian Border Force licensed depot registration.',
      required: false,
      formatHelp: 'Licensed premises or industry association registration.',
      uppercase: true,
    },
    regulatoryAuthorities: 'Australian Taxation Office (ATO), ASIC & Australian Border Force (ABF)',
    nonRepudiationStatute: 'Australian Corporations Act 2001 & Electronic Transactions Act 1999',
    complianceRequiredKeys: ['taxId', 'corporateReg'],
  },

  CA: {
    countryCode: 'CA',
    countryName: 'Canada',
    flag: '🇨🇦',
    primaryTaxId: {
      key: 'taxId',
      label: 'CRA Business Number (BN9) / GST/HST Account',
      shortLabel: 'CRA Business No.',
      placeholder: '123456789 RT0001',
      description: 'Canada Revenue Agency 9-digit Business Number with GST/HST program account.',
      required: true,
      formatHelp: '9 numeric digits + RT0001 program identifier.',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'Federal / Provincial Corporate Number',
      shortLabel: 'Corporate Reg.',
      placeholder: 'CA-Corp-889123',
      description: 'Corporations Canada or provincial business registry incorporation number.',
      required: true,
      formatHelp: 'Federal or provincial charter registration number.',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'CBSA Importer & Carrier Account (RM Code)',
      shortLabel: 'CBSA RM Code',
      placeholder: '123456789 RM0001',
      description: 'Canada Border Services Agency import/export account program identifier.',
      required: false,
      formatHelp: '9-digit BN + RM0001 customs account sequence.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'CIFFA Registration / Transport License',
      shortLabel: 'CIFFA Lic.',
      placeholder: 'CIFFA-9912',
      description: 'Canadian International Freight Forwarders Association registration.',
      required: false,
      formatHelp: 'Accredited CIFFA member credential.',
      uppercase: true,
    },
    regulatoryAuthorities: 'Canada Revenue Agency (CRA), Corporations Canada & CBSA',
    nonRepudiationStatute: 'Canada Business Corporations Act & Electronic Commerce Act',
    complianceRequiredKeys: ['taxId'],
  },

  GLOBAL: {
    countryCode: 'GLOBAL',
    countryName: 'Global International Entity',
    flag: '🌐',
    primaryTaxId: {
      key: 'taxId',
      label: 'National Tax Identification Number (TIN / RFC / NIF)',
      shortLabel: 'Tax ID / TIN',
      placeholder: 'TIN-98124-XX',
      description: 'Primary corporate tax registration code issued by the national revenue authority.',
      required: true,
      formatHelp: 'Official corporate tax number in the country of incorporation.',
      uppercase: true,
    },
    corporateReg: {
      key: 'corporateReg',
      label: 'Commercial Registry / Company Incorporation No.',
      shortLabel: 'Company Reg. No.',
      placeholder: 'CRN-881290',
      description: 'Official corporate charter or commercial registrar number.',
      required: true,
      formatHelp: 'Chamber of Commerce or Ministry of Corporate Affairs registration.',
      uppercase: true,
    },
    tradeCustomsCode: {
      key: 'tradeCustomsCode',
      label: 'National Customs / Importer-Exporter Code',
      shortLabel: 'Customs Code',
      placeholder: 'CUST-88124',
      description: 'Customs Administration trade authorization or cross-border tariff filer code.',
      required: false,
      formatHelp: 'Customs authority client identifier or export license.',
      uppercase: true,
    },
    logisticsLicense: {
      key: 'logisticsLicense',
      label: 'Freight Forwarding / Transport License',
      shortLabel: 'Transport License',
      placeholder: 'FF-LIC-2026-01',
      description: 'National freight forwarding, transport operator, or customs clearing license.',
      required: false,
      formatHelp: 'Ministry of Transport or freight logistics operator permit.',
      uppercase: true,
    },
    regulatoryAuthorities: 'National Revenue Authority, Ministry of Commerce & Customs Administration',
    nonRepudiationStatute: 'National Commercial Code, UNCITRAL Model Law on Electronic Commerce & WTO TFA',
    complianceRequiredKeys: ['taxId', 'corporateReg'],
  },
};

/**
 * Normalizes country strings and returns the appropriate profile
 */
export function getStatutoryProfile(countryNameOrCode?: string): StatutoryJurisdictionProfile {
  if (!countryNameOrCode) return STATUTORY_PROFILES.IN;

  const raw = countryNameOrCode.trim().toLowerCase();

  // Direct code match
  const upper = countryNameOrCode.trim().toUpperCase();
  if (STATUTORY_PROFILES[upper]) {
    return STATUTORY_PROFILES[upper];
  }

  // India
  if (raw === 'india' || raw === 'in' || raw.includes('bharat')) {
    return STATUTORY_PROFILES.IN;
  }

  // United States
  if (
    raw === 'united states' ||
    raw === 'united states of america' ||
    raw === 'usa' ||
    raw === 'us' ||
    raw.includes('america')
  ) {
    return STATUTORY_PROFILES.US;
  }

  // United Arab Emirates / Dubai
  if (
    raw === 'united arab emirates' ||
    raw === 'uae' ||
    raw === 'ae' ||
    raw === 'dubai' ||
    raw === 'abu dhabi' ||
    raw === 'sharjah'
  ) {
    return STATUTORY_PROFILES.AE;
  }

  // United Kingdom
  if (
    raw === 'united kingdom' ||
    raw === 'uk' ||
    raw === 'great britain' ||
    raw === 'gb' ||
    raw === 'england' ||
    raw === 'scotland' ||
    raw === 'wales'
  ) {
    return STATUTORY_PROFILES.GB;
  }

  // Singapore
  if (raw === 'singapore' || raw === 'sg') {
    return STATUTORY_PROFILES.SG;
  }

  // China
  if (raw === 'china' || raw === 'cn' || raw.includes('people\'s republic of china')) {
    return STATUTORY_PROFILES.CN;
  }

  // Hong Kong
  if (raw === 'hong kong' || raw === 'hk' || raw.includes('hong kong sar')) {
    return STATUTORY_PROFILES.HK;
  }

  // Australia
  if (raw === 'australia' || raw === 'au') {
    return STATUTORY_PROFILES.AU;
  }

  // Canada
  if (raw === 'canada' || raw === 'ca') {
    return STATUTORY_PROFILES.CA;
  }

  // European Union member states
  const euCountries = [
    'netherlands', 'germany', 'france', 'italy', 'spain', 'belgium', 'poland', 'sweden',
    'denmark', 'finland', 'ireland', 'austria', 'portugal', 'greece', 'czech republic',
    'hungary', 'romania', 'nl', 'de', 'fr', 'it', 'es', 'be', 'pl', 'se', 'dk', 'fi',
    'ie', 'at', 'pt', 'gr', 'cz', 'hu', 'ro', 'european union', 'eu',
  ];
  if (euCountries.includes(raw) || euCountries.some((c) => raw.includes(c))) {
    return {
      ...STATUTORY_PROFILES.EU,
      countryName: countryNameOrCode.length === 2 ? countryNameOrCode.toUpperCase() : countryNameOrCode,
    };
  }

  // Default fallback for any other country
  return {
    ...STATUTORY_PROFILES.GLOBAL,
    countryName: countryNameOrCode,
  };
}

/**
 * Evaluates whether an entity has met the statutory regulatory threshold for its country
 */
export function evaluateCompliance(
  countryNameOrCode: string | undefined,
  fields: {
    taxId?: string;
    corporateReg?: string;
    tradeCustomsCode?: string;
    logisticsLicense?: string;
    gstn?: string;
    pan?: string;
    iec?: string;
    mto?: string;
  }
): { isCompliant: boolean; statusLabel: string; missingFields: string[] } {
  const profile = getStatutoryProfile(countryNameOrCode);

  // Normalize inputs across legacy and new generalized field names
  const effectiveTaxId = (fields.taxId || fields.gstn || '').trim();
  const effectiveCorporateReg = (fields.corporateReg || fields.pan || '').trim();
  const effectiveTradeCustoms = (fields.tradeCustomsCode || fields.iec || '').trim();
  const effectiveLogisticsLicense = (fields.logisticsLicense || fields.mto || '').trim();

  const values: Record<string, string> = {
    taxId: effectiveTaxId,
    corporateReg: effectiveCorporateReg,
    tradeCustomsCode: effectiveTradeCustoms,
    logisticsLicense: effectiveLogisticsLicense,
  };

  const missing: string[] = [];
  for (const reqKey of profile.complianceRequiredKeys) {
    if (!values[reqKey]) {
      const fieldConfig =
        reqKey === 'taxId'
          ? profile.primaryTaxId
          : reqKey === 'corporateReg'
          ? profile.corporateReg
          : reqKey === 'tradeCustomsCode'
          ? profile.tradeCustomsCode
          : profile.logisticsLicense;
      missing.push(fieldConfig.shortLabel || fieldConfig.label);
    }
  }

  const isCompliant = missing.length === 0;
  const statusLabel = isCompliant
    ? `100% REGULATORY COMPLIANT (${profile.countryCode})`
    : `PENDING STATUTORY FILINGS (${missing[0] || 'TAX ID'})`;

  return { isCompliant, statusLabel, missingFields: missing };
}
