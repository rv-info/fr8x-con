import fs from 'fs';
import path from 'path';
import { RateItem, FeedPost, UserPresenceState, IdempotentEvent, LogisticsIntent } from '@/lib/types';

function initDbmsDir(): string {
  const primaryDir = path.join(process.cwd(), '.knox', 'dbms');
  try {
    if (!fs.existsSync(primaryDir)) {
      fs.mkdirSync(primaryDir, { recursive: true });
    }
    const testFile = path.join(primaryDir, '.w_test');
    fs.writeFileSync(testFile, '1');
    fs.unlinkSync(testFile);
    return primaryDir;
  } catch {
    // Read-only filesystem (e.g. Vercel serverless / AWS Lambda)
    const tmpDir = path.join(process.env.TMPDIR || '/tmp', 'fr8x-knox', 'dbms');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      // Seed files from packaged build if they exist
      const files = [
        'rates.json',
        'posts.json',
        'users.json',
        'verifications.json',
        'verification_audit.json',
        'companies.json',
        'presence.json',
        'events.json',
        'intents.json',
        'transactions.json',
        'email_delivery_events.json',
      ];
      for (const file of files) {
        const src = path.join(primaryDir, file);
        const dest = path.join(tmpDir, file);
        if (fs.existsSync(src) && !fs.existsSync(dest)) {
          try {
            fs.copyFileSync(src, dest);
          } catch {}
        }
      }
    } catch (tmpErr) {
      console.error('[DBMS] Failed initializing /tmp directory:', tmpErr);
    }
    return tmpDir;
  }
}

const DBMS_DIR = initDbmsDir();
const RATES_FILE = path.join(DBMS_DIR, 'rates.json');
const POSTS_FILE = path.join(DBMS_DIR, 'posts.json');
const USERS_FILE = path.join(DBMS_DIR, 'users.json');
const VERIFICATIONS_FILE = path.join(DBMS_DIR, 'verifications.json');
const VERIFICATION_AUDIT_FILE = path.join(DBMS_DIR, 'verification_audit.json');
const COMPANIES_FILE = path.join(DBMS_DIR, 'companies.json');
const PRESENCE_FILE = path.join(DBMS_DIR, 'presence.json');
const EVENTS_FILE = path.join(DBMS_DIR, 'events.json');
const INTENTS_FILE = path.join(DBMS_DIR, 'intents.json');
const TRANSACTIONS_FILE = path.join(DBMS_DIR, 'transactions.json');
const EMAIL_DELIVERY_EVENTS_FILE = path.join(DBMS_DIR, 'email_delivery_events.json');

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

function isDummyUser(u: any): boolean {
  if (!u) return true;
  const uid = (u.uid || '').toLowerCase();
  const email = (u.email || '').toLowerCase();
  const name = (u.displayName || '').toLowerCase();
  // Only filter genuine automated test fixtures; never legitimate user accounts
  if (/^(u-)?(lockout-test|sureset-test|fixture-user|mock-test)[-_0-9]/i.test(uid)) return true;
  if (email.includes('@test.invalid') || email.includes('@example.com') || email.includes('automated.fixture@')) return true;
  if (/^test-automated[-_0-9]/i.test(email)) return true;
  if (name === 'mock test user' || name === 'automated fixture') return true;
  return false;
}

export function getPersistedUsers(): DbmsUserRecord[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(USERS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(USERS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((u: any) => !isDummyUser(u)) : [];
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
  if (isDummyUser(user)) {
    return user;
  }
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

export function deletePersistedUser(identifier: string): boolean {
  ensureDirExists();
  try {
    const existing = getPersistedUsers();
    const clean = identifier.trim().toLowerCase();
    const filtered = existing.filter(
      (u) => u.uid?.toLowerCase() !== clean && u.email?.toLowerCase() !== clean
    );
    fs.writeFileSync(USERS_FILE, JSON.stringify(filtered, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('[DBMS] Error deleting persisted user:', err);
    return false;
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

const DEFAULT_SEED_COMPANIES: DbmsCompanyRecord[] = [];

export function getPersistedCompanies(): DbmsCompanyRecord[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(COMPANIES_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(COMPANIES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[DBMS] Error reading persisted companies:', err);
    return [];
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

// ─── PRESENCE REPOSITORY ──────────────────────────────────────────────────────

export function getPersistedPresence(): Record<string, UserPresenceState> {
  ensureDirExists();
  try {
    if (!fs.existsSync(PRESENCE_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(PRESENCE_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.error('[DBMS] Error reading persisted presence:', err);
    return {};
  }
}

export function savePersistedPresence(state: UserPresenceState): void {
  if (!state || !state.userId) return;
  ensureDirExists();
  try {
    const existing = getPersistedPresence();
    existing[state.userId] = {
      ...state,
      lastHeartbeat: state.lastHeartbeat || new Date().toISOString(),
    };
    fs.writeFileSync(PRESENCE_FILE, JSON.stringify(existing, null, 2), 'utf8');
  } catch (err) {
    console.error('[DBMS] Error saving persisted presence:', err);
  }
}

export function getPersistedUserPresence(userId: string): UserPresenceState | null {
  if (!userId) return null;
  const store = getPersistedPresence();
  const cached = store[userId];
  if (!cached) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  if (cached.ttlExpiry && nowSec > cached.ttlExpiry) {
    return { ...cached, status: 'away' };
  }
  return cached;
}

// ─── TELEMETRY & IDEMPOTENT EVENTS REPOSITORY ────────────────────────────────

export function getPersistedEvents(): IdempotentEvent[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(EVENTS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(EVENTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[DBMS] Error reading persisted events:', err);
    return [];
  }
}

export function recordPersistedEvents(events: IdempotentEvent[]): number {
  if (!Array.isArray(events) || events.length === 0) return 0;
  ensureDirExists();
  try {
    const existing = getPersistedEvents();
    const existingIds = new Set(existing.map((e) => e.eventId));
    let inserted = 0;

    for (const evt of events) {
      if (!existingIds.has(evt.eventId)) {
        existingIds.add(evt.eventId);
        existing.unshift(evt);
        inserted++;
      }
    }

    // Keep up to 2000 recent events on disk
    const trimmed = existing.slice(0, 2000);
    fs.writeFileSync(EVENTS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
    return inserted;
  } catch (err) {
    console.error('[DBMS] Error recording persisted events:', err);
    return 0;
  }
}

// ─── LOGISTICS INTENT REPOSITORY ─────────────────────────────────────────────

export function getPersistedIntents(): Record<string, LogisticsIntent> {
  ensureDirExists();
  try {
    if (!fs.existsSync(INTENTS_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(INTENTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch (err) {
    console.error('[DBMS] Error reading persisted intents:', err);
    return {};
  }
}

export function getPersistedUserIntent(userId: string): LogisticsIntent | null {
  if (!userId) return null;
  const intents = getPersistedIntents();
  const cached = intents[userId];
  if (!cached) return null;

  if (new Date(cached.expiresAt).getTime() < Date.now()) {
    return null;
  }
  return cached;
}

export function savePersistedUserIntent(intent: LogisticsIntent): void {
  if (!intent || !intent.userId) return;
  ensureDirExists();
  try {
    const existing = getPersistedIntents();
    existing[intent.userId] = intent;
    fs.writeFileSync(INTENTS_FILE, JSON.stringify(existing, null, 2), 'utf8');
  } catch (err) {
    console.error('[DBMS] Error saving persisted user intent:', err);
  }
}

// ─── TRANSACTIONS REPOSITORY ──────────────────────────────────────────────────

export interface TransactionRecord {
  id: string; // tx_... or rzp_...
  orderId?: string;
  paymentId?: string;
  userId?: string;
  userEmail?: string;
  amount: number;
  currency: string;
  planId?: string;
  itemType?: string;
  itemTitle?: string;
  status: 'created' | 'captured' | 'failed' | 'refunded' | 'adjusted';
  gateway: 'Razorpay' | 'BankTransfer' | 'UPI' | 'ManualCredit' | string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt?: string;
}

export function getPersistedTransactions(): TransactionRecord[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(TRANSACTIONS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(TRANSACTIONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[DBMS] Error reading persisted transactions:', err);
    return [];
  }
}

export function savePersistedTransaction(tx: TransactionRecord): TransactionRecord {
  ensureDirExists();
  try {
    const existing = getPersistedTransactions();
    const idx = existing.findIndex(
      (t) => t.id === tx.id || (tx.paymentId && t.paymentId === tx.paymentId)
    );
    const now = new Date().toISOString();
    const recordToSave: TransactionRecord = {
      ...tx,
      updatedAt: now,
      createdAt: tx.createdAt || now,
    };
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...recordToSave };
    } else {
      existing.unshift(recordToSave);
    }
    fs.writeFileSync(TRANSACTIONS_FILE, JSON.stringify(existing, null, 2), 'utf8');
    return recordToSave;
  } catch (err) {
    console.error('[DBMS] Error saving persisted transaction:', err);
    return tx;
  }
}

export function getPersistedTransactionById(id: string): TransactionRecord | undefined {
  if (!id) return undefined;
  const transactions = getPersistedTransactions();
  return transactions.find((t) => t.id === id || t.paymentId === id || t.orderId === id);
}

// ─── EMAIL DELIVERY EVENTS REPOSITORY ─────────────────────────────────────────

export interface EmailDeliveryEventRecord {
  eventId: string;
  messageId?: string;
  to: string;
  from?: string;
  subject?: string;
  status: 'delivered' | 'soft_bounce' | 'hard_bounce' | 'failed' | string;
  bounceType?: string;
  bounceReason?: string;
  clientReference?: string;
  timestamp: string;
  receivedAt: string;
}

export function getPersistedEmailDeliveryEvents(): EmailDeliveryEventRecord[] {
  ensureDirExists();
  try {
    if (!fs.existsSync(EMAIL_DELIVERY_EVENTS_FILE)) {
      return [];
    }
    const raw = fs.readFileSync(EMAIL_DELIVERY_EVENTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('[DBMS] Error reading persisted email delivery events:', err);
    return [];
  }
}

export function savePersistedEmailDeliveryEvent(event: EmailDeliveryEventRecord): EmailDeliveryEventRecord {
  ensureDirExists();
  try {
    const existing = getPersistedEmailDeliveryEvents();
    const idx = existing.findIndex((e) => e.eventId === event.eventId);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...event };
    } else {
      existing.unshift(event);
    }
    // Cap at 1000 events to prevent unbounded file growth
    const trimmed = existing.slice(0, 1000);
    fs.writeFileSync(EMAIL_DELIVERY_EVENTS_FILE, JSON.stringify(trimmed, null, 2), 'utf8');
    return event;
  } catch (err) {
    console.error('[DBMS] Error saving persisted email delivery event:', err);
    return event;
  }
}



