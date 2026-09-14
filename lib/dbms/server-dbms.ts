import fs from 'fs';
import path from 'path';
import { RateItem, FeedPost } from '@/lib/types';

const DBMS_DIR = path.join(process.cwd(), '.knox', 'dbms');
const RATES_FILE = path.join(DBMS_DIR, 'rates.json');
const POSTS_FILE = path.join(DBMS_DIR, 'posts.json');
const USERS_FILE = path.join(DBMS_DIR, 'users.json');
const VERIFICATIONS_FILE = path.join(DBMS_DIR, 'verifications.json');
const VERIFICATION_AUDIT_FILE = path.join(DBMS_DIR, 'verification_audit.json');
const COMPANIES_FILE = path.join(DBMS_DIR, 'companies.json');

function ensureDirExists() {
  try {
    if (!fs.existsSync(DBMS_DIR)) {
      fs.mkdirSync(DBMS_DIR, { recursive: true });
    }
  } catch (err) {
    console.error('[DBMS] Failed to create DBMS directory:', err);
  }
}

// ─── RATES REPOSITORY ────────────────────────────────────────────────────────

export function getPersistedRates(): RateItem[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(RATES_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(RATES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[DBMS] Error reading persisted rates:', err);
    return [];
  }
}

export function savePersistedRate(rate: RateItem): RateItem {
  ensureDirExists();
  try {
    const existing = getPersistedRates();
    const idx = existing.findIndex((r) => r.id === rate.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...rate, updatedAt: new Date().toISOString() };
    } else {
      existing.unshift({ ...rate, createdAt: rate.createdAt || new Date().toISOString() });
    }
    fs.writeFileSync(RATES_FILE, JSON.stringify(existing, null, 2), 'utf8');
    return rate;
  } catch (err) {
    console.error('[DBMS] Error saving persisted rate:', err);
    return rate;
  }
}

export function deletePersistedRate(rateId: string): boolean {
  ensureDirExists();
  try {
    const existing = getPersistedRates();
    const filtered = existing.filter((r) => r.id !== rateId);
    fs.writeFileSync(RATES_FILE, JSON.stringify(filtered, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[DBMS] Error deleting persisted rate:', err);
    return false;
  }
}

export function bulkSavePersistedRates(rates: RateItem[]): RateItem[] {
  ensureDirExists();
  try {
    const existing = getPersistedRates();
    const map = new Map<string, RateItem>();
    for (const r of existing) {
      map.set(r.id, r);
    }
    for (const r of rates) {
      const prev = map.get(r.id);
      map.set(r.id, {
        ...(prev || {}),
        ...r,
        updatedAt: new Date().toISOString(),
      });
    }
    const merged = Array.from(map.values());
    fs.writeFileSync(RATES_FILE, JSON.stringify(merged, null, 2), 'utf8');
    return rates;
  } catch (err) {
    console.error('[DBMS] Error bulk saving persisted rates:', err);
    return rates;
  }
}

// ─── POSTS REPOSITORY ────────────────────────────────────────────────────────

export function getPersistedPosts(): FeedPost[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(POSTS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(POSTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[DBMS] Error reading persisted posts:', err);
    return [];
  }
}

export function savePersistedPost(post: FeedPost): FeedPost {
  ensureDirExists();
  try {
    const existing = getPersistedPosts();
    const idx = existing.findIndex((p) => String(p.id) === String(post.id));
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...post, updatedAt: new Date().toISOString() };
    } else {
      existing.unshift({ ...post, createdAt: post.createdAt || new Date().toISOString() });
    }
    fs.writeFileSync(POSTS_FILE, JSON.stringify(existing, null, 2), 'utf8');
    return post;
  } catch (err) {
    console.error('[DBMS] Error saving persisted post:', err);
    return post;
  }
}

export function deletePersistedPost(postId: string | number): boolean {
  ensureDirExists();
  try {
    const existing = getPersistedPosts();
    const filtered = existing.filter((p) => String(p.id) !== String(postId));
    fs.writeFileSync(POSTS_FILE, JSON.stringify(filtered, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[DBMS] Error deleting persisted post:', err);
    return false;
  }
}

// ─── USERS REPOSITORY ────────────────────────────────────────────────────────

export interface DbmsUserRecord {
  uid: string;
  email: string;
  passwordHash?: string;
  salt?: string;
  displayName: string;
  company: string;
  companyId: string;
  role: string;
  status: string;
  mobile?: string;
  email_verified: boolean;
  emailVerifiedAt?: string;
  emailVerificationExpiresAt?: number;
  firstLoginCompleted?: boolean;
  createdAt: string;
  updatedAt?: string;
  [key: string]: any;
}

export function getPersistedUsers(): DbmsUserRecord[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[DBMS] Error reading persisted users:', err);
    return [];
  }
}

export function getPersistedUserByIdentifier(identifier: string): DbmsUserRecord | undefined {
  if (!identifier) return undefined;
  const clean = identifier.trim().toLowerCase();
  const users = getPersistedUsers();
  return users.find(
    (u) => (u.email && u.email.toLowerCase() === clean) || (u.uid && u.uid.toLowerCase() === clean)
  );
}

export function savePersistedUser(user: DbmsUserRecord): DbmsUserRecord {
  ensureDirExists();
  try {
    const existing = getPersistedUsers();
    const cleanEmail = (user.email || '').trim().toLowerCase();
    const cleanUid = (user.uid || '').trim().toLowerCase();
    const now = new Date().toISOString();

    const idx = existing.findIndex(
      (u) =>
        (cleanUid && u.uid && u.uid.toLowerCase() === cleanUid) ||
        (cleanEmail && u.email && u.email.toLowerCase() === cleanEmail)
    );

    const recordToSave = {
      ...user,
      updatedAt: now,
      createdAt: user.createdAt || now,
    };

    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...recordToSave };
    } else {
      existing.unshift(recordToSave);
    }

    fs.writeFileSync(USERS_FILE, JSON.stringify(existing, null, 2), 'utf8');
    return existing[idx >= 0 ? idx : 0];
  } catch (err) {
    console.error('[DBMS] Error saving persisted user:', err);
    return user;
  }
}

// ─── VERIFICATIONS REPOSITORY ────────────────────────────────────────────────

export interface DbmsVerificationRecord {
  tokenHash: string;
  user_id: string;
  email: string;
  expires_at: number;
  used: boolean;
  createdAt: number;
  usedAt?: string;
  verificationMethod?: 'link' | 'otp';
}

export function getPersistedVerifications(): DbmsVerificationRecord[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(VERIFICATIONS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(VERIFICATIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[DBMS] Error reading persisted verifications:', err);
    return [];
  }
}

export function getPersistedVerificationByHash(tokenHash: string): DbmsVerificationRecord | undefined {
  if (!tokenHash) return undefined;
  const verifications = getPersistedVerifications();
  return verifications.find((v) => v.tokenHash === tokenHash);
}

export function savePersistedVerification(record: DbmsVerificationRecord): DbmsVerificationRecord {
  ensureDirExists();
  try {
    const existing = getPersistedVerifications();
    const idx = existing.findIndex((v) => v.tokenHash === record.tokenHash);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...record };
    } else {
      existing.unshift(record);
    }
    fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify(existing, null, 2), 'utf8');
    return record;
  } catch (err) {
    console.error('[DBMS] Error saving persisted verification record:', err);
    return record;
  }
}

export function markPersistedVerificationUsed(tokenHash: string): boolean {
  ensureDirExists();
  try {
    const existing = getPersistedVerifications();
    const target = existing.find((v) => v.tokenHash === tokenHash);
    if (target) {
      target.used = true;
      target.usedAt = new Date().toISOString();
      fs.writeFileSync(VERIFICATIONS_FILE, JSON.stringify(existing, null, 2), 'utf8');
      return true;
    }
    return false;
  } catch (err) {
    console.error('[DBMS] Error marking verification as used:', err);
    return false;
  }
}

// ─── VERIFICATION AUDIT TRAIL ────────────────────────────────────────────────

export interface DbmsVerificationAudit {
  id: string;
  timestamp: string;
  email: string;
  uid?: string;
  company?: string;
  method: 'link' | 'otp';
  status: 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'ALREADY_USED';
  tokenHash?: string;
  ipAddress?: string;
  details?: string;
}

export function recordVerificationAudit(audit: Omit<DbmsVerificationAudit, 'id' | 'timestamp'>): void {
  ensureDirExists();
  try {
    let existing: DbmsVerificationAudit[] = [];
    if (fs.existsSync(VERIFICATION_AUDIT_FILE)) {
      try {
        const raw = fs.readFileSync(VERIFICATION_AUDIT_FILE, 'utf8');
        existing = JSON.parse(raw);
        if (!Array.isArray(existing)) existing = [];
      } catch {
        existing = [];
      }
    }

    const entry: DbmsVerificationAudit = {
      id: `va-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...audit,
    };

    existing.unshift(entry);
    if (existing.length > 500) {
      existing = existing.slice(0, 500);
    }

    fs.writeFileSync(VERIFICATION_AUDIT_FILE, JSON.stringify(existing, null, 2), 'utf8');
  } catch (err) {
    console.error('[DBMS] Error writing verification audit entry:', err);
  }
}

export function getVerificationAuditLogs(): DbmsVerificationAudit[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(VERIFICATION_AUDIT_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(VERIFICATION_AUDIT_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[DBMS] Error reading verification audit logs:', err);
    return [];
  }
}

// ─── MASTER COMPANY DBMS REPOSITORY (GODFATHER REGISTRY & ANTI-DUPLICATION) ───

export interface DbmsCompanyRecord {
  id: string; // e.g. CMP-00101
  legalName: string;
  tradeName?: string;
  country: string;
  state?: string;
  city: string;
  postalCode?: string;
  registeredAddress: string;
  gstn?: string;
  pan?: string;
  iec?: string;
  mto?: string;
  taxId?: string;
  corporateRegNumber?: string;
  tradeCustomsCode?: string;
  logisticsLicenseNumber?: string;
  status: 'verified' | 'pending' | 'rejected' | 'suspended' | 'additional_info_required';
  verified: boolean;
  memberCount: number;
  duplicateFlag?: boolean;
  duplicateOfId?: string;
  primaryContactName?: string;
  primaryContactEmail?: string;
  primaryContactPhone?: string;
  adminNotes?: string[];
  createdAt: string;
  updatedAt: string;
}

const DEFAULT_SEED_COMPANIES: DbmsCompanyRecord[] = [
  {
    id: 'CMP-00101',
    legalName: 'Atlas Logistics Private Limited',
    tradeName: 'Atlas Logistics',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    postalCode: '400093',
    registeredAddress: 'Gate 3, CFS Logistics Park, Andheri East, Mumbai 400093',
    gstn: '27AABCA1234F1Z5',
    pan: 'AABCA1234F',
    iec: '0312004561',
    mto: 'MTO/DGS/2024/9912',
    status: 'verified',
    verified: true,
    memberCount: 14,
    primaryContactName: 'Arjun Rao',
    primaryContactEmail: 'arjun@atlaslogistics.com',
    primaryContactPhone: '+91 98765 43210',
    adminNotes: ['GST and PAN numbers cross-verified on government portal.', 'MTO registration valid through Dec 2027.'],
    createdAt: '2026-01-10T10:00:00Z',
    updatedAt: '2026-06-11T14:30:00Z',
  },
  {
    id: 'CMP-00102',
    legalName: 'Rotterdam Freight NV',
    tradeName: 'Rotterdam Freight',
    country: 'Netherlands',
    state: 'South Holland',
    city: 'Rotterdam',
    postalCode: '3011 AD',
    registeredAddress: 'Willemskade 18, Port Gateway Building, Rotterdam 3011 AD',
    taxId: 'NL884210992B01',
    corporateRegNumber: 'KvK-24389102',
    tradeCustomsCode: 'NL-EORI-884210992',
    status: 'verified',
    verified: true,
    memberCount: 8,
    primaryContactName: 'Sarah Lewis',
    primaryContactEmail: 'sarah.lewis@rotterdamfreight.nl',
    primaryContactPhone: '+31 10 123 4567',
    adminNotes: ['KvK Chamber of Commerce registry verified.', 'Valid EU VAT ID NL884210992B01.'],
    createdAt: '2026-02-15T09:00:00Z',
    updatedAt: '2026-07-02T11:00:00Z',
  },
  {
    id: 'CMP-00103',
    legalName: 'Indo Ocean Lines Pvt. Ltd.',
    tradeName: 'Indo Ocean Lines',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    postalCode: '400001',
    registeredAddress: 'Nariman Point Maritime Centre, 4th Floor, Mumbai 400001',
    gstn: '27AAACI5544H1Z1',
    pan: 'AAACI5544H',
    iec: '0309001122',
    status: 'verified',
    verified: true,
    memberCount: 6,
    primaryContactName: 'Kiran Mehta',
    primaryContactEmail: 'kiran.mehta@indoocean.in',
    primaryContactPhone: '+91 98111 22334',
    createdAt: '2026-03-01T12:00:00Z',
    updatedAt: '2026-05-18T16:00:00Z',
  },
  {
    id: 'CMP-00104',
    legalName: 'Apex Global Forwarders LLP',
    tradeName: 'Apex Forwarders',
    country: 'India',
    state: 'Delhi',
    city: 'New Delhi',
    postalCode: '110037',
    registeredAddress: 'Cargo Terminal 2, IGI Airport Logistics Complex, New Delhi 110037',
    gstn: '07AAACA4321K1Z8',
    pan: 'AAACA4321K',
    iec: '0714002341',
    status: 'pending',
    verified: false,
    memberCount: 3,
    primaryContactName: 'Vikas Dubey',
    primaryContactEmail: 'vikas.dubey@apexforwarders.in',
    primaryContactPhone: '+91 99555 44332',
    adminNotes: ['Uploaded GST certificate shows address mismatch with submitted registered address.'],
    createdAt: '2026-04-12T14:00:00Z',
    updatedAt: '2026-08-28T16:00:00Z',
  },
  {
    id: 'CMP-00105',
    legalName: 'Orient Gateway Logistics Shanghai Co. Ltd.',
    tradeName: 'Orient Gateway Logistics',
    country: 'China',
    state: 'Shanghai',
    city: 'Shanghai',
    postalCode: '200080',
    registeredAddress: 'Pudong Maritime Trade Tower, Suite 1205, Shanghai 200080',
    taxId: '91310000717882918X',
    tradeCustomsCode: 'CN-3101928374',
    status: 'verified',
    verified: true,
    memberCount: 11,
    primaryContactName: 'Chen Wei',
    primaryContactEmail: 'chen.wei@orientfreight.cn',
    primaryContactPhone: '+86 21 8899 0011',
    createdAt: '2026-02-20T08:00:00Z',
    updatedAt: '2026-06-15T10:00:00Z',
  },
  {
    id: 'CMP-00106',
    legalName: 'Blue Horizon Maritime Sp. z o.o.',
    tradeName: 'Blue Horizon Logistics',
    country: 'Poland',
    state: 'Pomeranian',
    city: 'Gdynia',
    postalCode: '81-337',
    registeredAddress: 'Portowa 12, Terminal B, Gdynia 81-337',
    taxId: 'PL5862341901',
    status: 'additional_info_required',
    verified: false,
    memberCount: 2,
    primaryContactName: 'Piotr Kowalski',
    primaryContactEmail: 'p.kowalski@bluehorizon.pl',
    primaryContactPhone: '+48 58 660 1122',
    adminNotes: ['Requested certified translation of Polish KRS incorporation extract.'],
    createdAt: '2026-05-11T11:00:00Z',
    updatedAt: '2026-08-25T12:00:00Z',
  },
  {
    id: 'CMP-00107',
    legalName: 'Maersk Line India Private Limited',
    tradeName: 'Maersk Logistics India',
    country: 'India',
    state: 'Maharashtra',
    city: 'Navi Mumbai',
    postalCode: '400705',
    registeredAddress: 'Sector 11, CBD Belapur, Navi Mumbai 400705',
    gstn: '27AABCM8890K1ZV',
    pan: 'AABCM8890K',
    iec: '0388009123',
    mto: 'MTO/DGS/2023/1102',
    status: 'verified',
    verified: true,
    memberCount: 28,
    primaryContactName: 'Rajesh Nair',
    primaryContactEmail: 'r.nair@maersk.com',
    primaryContactPhone: '+91 22 6123 4567',
    createdAt: '2026-01-05T09:00:00Z',
    updatedAt: '2026-08-01T15:00:00Z',
  },
  {
    id: 'CMP-00108',
    legalName: 'Hapag-Lloyd Global Services (India) Private Limited',
    tradeName: 'Hapag-Lloyd Logistics',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    postalCode: '400051',
    registeredAddress: 'The Capital, G Block, Bandra Kurla Complex, Mumbai 400051',
    gstn: '27AAACH4433E1Z9',
    pan: 'AAACH4433E',
    iec: '0399004455',
    status: 'verified',
    verified: true,
    memberCount: 22,
    primaryContactName: 'Ananya Deshmukh',
    primaryContactEmail: 'ananya.d@hapag-lloyd.com',
    primaryContactPhone: '+91 22 6789 0123',
    createdAt: '2026-01-18T10:00:00Z',
    updatedAt: '2026-07-20T12:00:00Z',
  },
  {
    id: 'CMP-00109',
    legalName: 'Gulf Coast Maritime Services LLC',
    tradeName: 'Gulf Coast Maritime',
    country: 'United Arab Emirates',
    state: 'Dubai',
    city: 'Dubai',
    postalCode: '17000',
    registeredAddress: 'JAFZA Logistics Zone 4, Warehouse 18, Jebel Ali, Dubai',
    taxId: '100293847560003',
    corporateRegNumber: 'DED-882910',
    status: 'verified',
    verified: true,
    memberCount: 9,
    primaryContactName: 'Tariq Al-Mansoor',
    primaryContactEmail: 'tariq@gulfcoastmaritime.ae',
    primaryContactPhone: '+971 4 881 2345',
    createdAt: '2026-02-10T11:00:00Z',
    updatedAt: '2026-06-30T14:00:00Z',
  },
  {
    id: 'CMP-00110',
    legalName: 'Trans-Pacific Freight Solutions Inc.',
    tradeName: 'Trans-Pacific Freight',
    country: 'United States',
    state: 'California',
    city: 'Long Beach',
    postalCode: '90802',
    registeredAddress: '111 West Ocean Blvd, Suite 800, Long Beach, CA 90802',
    taxId: '95-4829102',
    tradeCustomsCode: 'FMC-019924N',
    logisticsLicenseNumber: 'OTI-19924-NF',
    status: 'verified',
    verified: true,
    memberCount: 16,
    primaryContactName: 'David Miller',
    primaryContactEmail: 'dmiller@transpacificfreight.com',
    primaryContactPhone: '+1 562 555 0199',
    createdAt: '2026-03-05T15:00:00Z',
    updatedAt: '2026-08-10T18:00:00Z',
  },
];

export function getPersistedCompanies(): DbmsCompanyRecord[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(COMPANIES_FILE)) {
      fs.writeFileSync(COMPANIES_FILE, JSON.stringify(DEFAULT_SEED_COMPANIES, null, 2), 'utf8');
      return DEFAULT_SEED_COMPANIES;
    }
    const raw = fs.readFileSync(COMPANIES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      fs.writeFileSync(COMPANIES_FILE, JSON.stringify(DEFAULT_SEED_COMPANIES, null, 2), 'utf8');
      return DEFAULT_SEED_COMPANIES;
    }
    return parsed;
  } catch (err) {
    console.error('[DBMS] Error reading persisted companies:', err);
    return DEFAULT_SEED_COMPANIES;
  }
}

export function savePersistedCompany(company: DbmsCompanyRecord): DbmsCompanyRecord {
  ensureDirExists();
  try {
    const existing = getPersistedCompanies();
    const idx = existing.findIndex((c) => c.id === company.id);
    const now = new Date().toISOString();
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...company, updatedAt: now };
    } else {
      existing.unshift({
        ...company,
        createdAt: company.createdAt || now,
        updatedAt: now,
      });
    }
    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(existing, null, 2), 'utf8');
    return company;
  } catch (err) {
    console.error('[DBMS] Error saving company record:', err);
    return company;
  }
}

export function searchPersistedCompanies(queryStr: string): DbmsCompanyRecord[] {
  const companies = getPersistedCompanies();
  if (!queryStr || !queryStr.trim()) return companies.slice(0, 50);

  const q = queryStr.toLowerCase().trim();
  return companies.filter((c) => {
    return (
      c.legalName.toLowerCase().includes(q) ||
      (c.tradeName && c.tradeName.toLowerCase().includes(q)) ||
      c.id.toLowerCase().includes(q) ||
      c.city.toLowerCase().includes(q) ||
      c.country.toLowerCase().includes(q) ||
      (c.registeredAddress && c.registeredAddress.toLowerCase().includes(q)) ||
      (c.gstn && c.gstn.toLowerCase().includes(q)) ||
      (c.taxId && c.taxId.toLowerCase().includes(q))
    );
  });
}

function cleanCompanyNameForComparison(name: string): string {
  return name
    .toLowerCase()
    .replace(/\b(private|limited|pvt|ltd|llp|llc|inc|corp|co|gmbh|nv|sa|sp\s*z\s*o\s*o)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

function cleanAddressForComparison(addr: string): string {
  return addr
    .toLowerCase()
    .replace(/\b(gate|door|floor|fl|suite|ste|block|blk|sector|sec|road|rd|street|st|avenue|ave|plot|bldg|building|park|corridor|opp|opposite|near)\b/gi, '')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

export interface CompanyDuplicateCheckResult {
  isPotentialDuplicate: boolean;
  matchedCompanies: DbmsCompanyRecord[];
  matchType: 'name' | 'address' | 'tax' | 'both' | 'none';
  advisoryMessage: string;
}

export function checkCompanyDuplicate(
  name: string,
  address?: string,
  city?: string,
  country?: string,
  excludeCompanyId?: string
): CompanyDuplicateCheckResult {
  const allCompanies = getPersistedCompanies();
  const cleanTargetName = cleanCompanyNameForComparison(name || '');
  const cleanTargetAddr = cleanAddressForComparison(address || '');
  const cleanCity = (city || '').toLowerCase().trim();

  const matched: DbmsCompanyRecord[] = [];
  let matchType: 'name' | 'address' | 'tax' | 'both' | 'none' = 'none';

  for (const c of allCompanies) {
    if (excludeCompanyId && c.id === excludeCompanyId) continue;

    const cleanExistingName = cleanCompanyNameForComparison(c.legalName);
    const cleanExistingTrade = c.tradeName ? cleanCompanyNameForComparison(c.tradeName) : '';
    const cleanExistingAddr = cleanAddressForComparison(c.registeredAddress || '');
    const cleanExistingCity = (c.city || '').toLowerCase().trim();

    const isNameMatch =
      cleanTargetName.length >= 4 &&
      (cleanExistingName.includes(cleanTargetName) ||
        cleanTargetName.includes(cleanExistingName) ||
        (cleanExistingTrade && (cleanExistingTrade.includes(cleanTargetName) || cleanTargetName.includes(cleanExistingTrade))));

    const isAddressMatch =
      cleanTargetAddr.length >= 8 &&
      cleanExistingAddr.length >= 8 &&
      (cleanTargetAddr.includes(cleanExistingAddr) || cleanExistingAddr.includes(cleanTargetAddr)) &&
      (!cleanCity || !cleanExistingCity || cleanCity === cleanExistingCity);

    if (isNameMatch && isAddressMatch) {
      matched.push(c);
      matchType = 'both';
    } else if (isAddressMatch) {
      matched.push(c);
      if (matchType !== 'both') matchType = 'address';
    } else if (isNameMatch) {
      matched.push(c);
      if (matchType !== 'both' && matchType !== 'address') matchType = 'name';
    }
  }

  if (matched.length > 0) {
    const primary = matched[0];
    let advisoryMessage = '';
    if (matchType === 'both') {
      advisoryMessage = `Duplicate Advisory: An entity with matching name and registered address is already in the DBMS: "${primary.legalName}" (${primary.city}, ${primary.country} · ${primary.registeredAddress}).`;
    } else if (matchType === 'address') {
      advisoryMessage = `Address Match Advisory: The registered address entered is already utilized by: "${primary.legalName}" (${primary.city}, ${primary.country}).`;
    } else {
      advisoryMessage = `Similar Entity Advisory: An entity with a similar name already exists: "${primary.legalName}" (${primary.city}, ${primary.country}).`;
    }

    return {
      isPotentialDuplicate: true,
      matchedCompanies: matched,
      matchType,
      advisoryMessage,
    };
  }

  return {
    isPotentialDuplicate: false,
    matchedCompanies: [],
    matchType: 'none',
    advisoryMessage: '',
  };
}

export function mergePersistedCompanies(canonicalId: string, duplicateId: string): boolean {
  ensureDirExists();
  try {
    const companies = getPersistedCompanies();
    const canonical = companies.find((c) => c.id === canonicalId);
    const duplicate = companies.find((c) => c.id === duplicateId);

    if (!canonical || !duplicate) return false;

    // Transfer member count and flag duplicate
    canonical.memberCount = (canonical.memberCount || 0) + (duplicate.memberCount || 0);
    duplicate.status = 'suspended';
    duplicate.duplicateFlag = true;
    duplicate.duplicateOfId = canonicalId;
    duplicate.adminNotes = [
      ...(duplicate.adminNotes || []),
      `Merged into canonical entity ${canonical.legalName} (${canonicalId}) on ${new Date().toISOString()}`,
    ];

    fs.writeFileSync(COMPANIES_FILE, JSON.stringify(companies, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[DBMS] Error merging companies:', err);
    return false;
  }
}


