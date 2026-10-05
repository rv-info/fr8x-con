import fs from 'fs';
import path from 'path';
import { RateItem, FeedPost, UserPresenceState, IdempotentEvent, LogisticsIntent, Auction } from '@/lib/types';

function initDbmsDir(): string {
  // Use test fixtures directory for automated unit tests
  const fixturesDir = path.join(process.cwd(), 'test', 'fixtures', 'dbms');
  const tmpDir = path.join(process.env.TMPDIR || '/tmp', 'fr8x-dbms', 'dbms');

  try {
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    // Seed fixtures to test tmp dir if present
    if (fs.existsSync(fixturesDir)) {
      const files = fs.readdirSync(fixturesDir);
      for (const file of files) {
        const src = path.join(fixturesDir, file);
        const dest = path.join(tmpDir, file);
        if (fs.statSync(src).isFile() && !fs.existsSync(dest)) {
          try {
            fs.copyFileSync(src, dest);
          } catch {}
        }
      }
    }
    return tmpDir;
  } catch {
    return fixturesDir;
  }
}

const DBMS_DIR = initDbmsDir();
const RATES_FILE = path.join(DBMS_DIR, 'rates.json');
const POSTS_FILE = path.join(DBMS_DIR, 'posts.json');
const AUCTIONS_FILE = path.join(DBMS_DIR, 'auctions.json');
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

export function readFileSyncWithRetry(filePath: string, retries = 5, delayMs = 30): string {
  for (let i = 0; i < retries; i++) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (err: any) {
      if ((err.code === 'EBUSY' || err.code === 'EPERM' || err.code === 'EACCES') && i < retries - 1) {
        const start = Date.now();
        while (Date.now() - start < delayMs) {}
        continue;
      }
      throw err;
    }
  }
  return '';
}

export function safeReadJsonFile<T>(filePath: string, defaultValue: T): T {
  ensureDirExists();
  try {
    if (!fs.existsSync(filePath)) {
      return defaultValue;
    }
    const raw = readFileSyncWithRetry(filePath);
    if (!raw || !raw.trim()) {
      return defaultValue;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(defaultValue) && !Array.isArray(parsed) ? defaultValue : (parsed as T);
  } catch (err) {
    console.error(`[DBMS] Error reading or parsing ${filePath}:`, err);
    return defaultValue;
  }
}

export function atomicWriteJsonFile(filePath: string, data: any): void {
  ensureDirExists();
  const dir = path.dirname(filePath);
  const tempFile = path.join(
    dir,
    `.${path.basename(filePath)}.${Date.now()}.${Math.random().toString(36).substring(2, 8)}.tmp`
  );
  const content = JSON.stringify(data, null, 2);
  try {
    fs.writeFileSync(tempFile, content, 'utf8');
    try {
      fs.renameSync(tempFile, filePath);
    } catch (renameErr: any) {
      if (process.platform === 'win32' || renameErr.code === 'EPERM' || renameErr.code === 'EBUSY') {
        fs.copyFileSync(tempFile, filePath);
        try {
          fs.unlinkSync(tempFile);
        } catch {}
      } else {
        throw renameErr;
      }
    }
  } catch (err) {
    try {
      if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
    } catch {}
    throw err;
  }
}

// ─── RATES REPOSITORY ────────────────────────────────────────────────────────

export function getPersistedRates(): RateItem[] {
  return safeReadJsonFile<RateItem[]>(RATES_FILE, []);
}

export function savePersistedRate(rate: RateItem): RateItem {
  try {
    const existing = getPersistedRates();
    const idx = existing.findIndex((r) => r.id === rate.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...rate, updatedAt: new Date().toISOString() };
    } else {
      existing.unshift({ ...rate, createdAt: rate.createdAt || new Date().toISOString() });
    }
    atomicWriteJsonFile(RATES_FILE, existing);
    return rate;
  } catch (err) {
    console.error('[DBMS] Error saving persisted rate:', err);
    return rate;
  }
}

export function deletePersistedRate(rateId: string): boolean {
  try {
    const existing = getPersistedRates();
    const filtered = existing.filter((r) => r.id !== rateId);
    atomicWriteJsonFile(RATES_FILE, filtered);
    return true;
  } catch (err) {
    console.error('[DBMS] Error deleting persisted rate:', err);
    return false;
  }
}

export function bulkSavePersistedRates(rates: RateItem[]): RateItem[] {
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
    atomicWriteJsonFile(RATES_FILE, merged);
    return rates;
  } catch (err) {
    console.error('[DBMS] Error bulk saving persisted rates:', err);
    return rates;
  }
}

// ─── POSTS REPOSITORY ────────────────────────────────────────────────────────

export function getPersistedPosts(): FeedPost[] {
  return safeReadJsonFile<FeedPost[]>(POSTS_FILE, []);
}

export function savePersistedPost(post: FeedPost): FeedPost {
  try {
    const existing = getPersistedPosts();
    const idx = existing.findIndex((p) => String(p.id) === String(post.id));
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...post, updatedAt: new Date().toISOString() };
    } else {
      existing.unshift({ ...post, createdAt: post.createdAt || new Date().toISOString() });
    }
    atomicWriteJsonFile(POSTS_FILE, existing);
    return post;
  } catch (err) {
    console.error('[DBMS] Error saving persisted post:', err);
    return post;
  }
}

export function deletePersistedPost(postId: string | number): boolean {
  try {
    const existing = getPersistedPosts();
    const filtered = existing.filter((p) => String(p.id) !== String(postId));
    atomicWriteJsonFile(POSTS_FILE, filtered);
    return true;
  } catch (err) {
    console.error('[DBMS] Error deleting persisted post:', err);
    return false;
  }
}

// ─── AUCTIONS REPOSITORY ─────────────────────────────────────────────────────

export function getPersistedAuctions(): Auction[] {
  return safeReadJsonFile<Auction[]>(AUCTIONS_FILE, []);
}

export function savePersistedAuction(auction: Auction): Auction {
  try {
    const existing = getPersistedAuctions();
    const idx = existing.findIndex((a) => a.id === auction.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...auction, updatedAt: new Date().toISOString() };
    } else {
      existing.unshift({ ...auction, createdAt: (auction as any).createdAt || new Date().toISOString() });
    }
    atomicWriteJsonFile(AUCTIONS_FILE, existing);
    return auction;
  } catch (err) {
    console.error('[DBMS] Error saving persisted auction:', err);
    return auction;
  }
}

export function cancelPersistedAuction(auctionId: string): boolean {
  try {
    const existing = getPersistedAuctions();
    const idx = existing.findIndex((a) => a.id === auctionId);
    if (idx >= 0) {
      existing[idx] = {
        ...existing[idx],
        status: 'Cancelled' as any,
        isActive: false,
        cancelledAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      atomicWriteJsonFile(AUCTIONS_FILE, existing);
      return true;
    }
    return false;
  } catch (err) {
    console.error('[DBMS] Error cancelling persisted auction:', err);
    return false;
  }
}

export function deletePersistedAuction(auctionId: string): boolean {
  // Deleting an auction marks it inactive and status: 'Cancelled' (audit preserved)
  return cancelPersistedAuction(auctionId);
}

export function bulkSavePersistedAuctions(auctions: Auction[]): Auction[] {
  try {
    const existing = getPersistedAuctions();
    const map = new Map<string, Auction>();
    for (const a of existing) {
      map.set(a.id, a);
    }
    for (const a of auctions) {
      const prev = map.get(a.id);
      map.set(a.id, {
        ...(prev || {}),
        ...a,
        updatedAt: new Date().toISOString(),
      });
    }
    const merged = Array.from(map.values());
    atomicWriteJsonFile(AUCTIONS_FILE, merged);
    return auctions;
  } catch (err) {
    console.error('[DBMS] Error bulk saving persisted auctions:', err);
    return auctions;
  }
}

// ─── JOBS REPOSITORY ─────────────────────────────────────────────────────────

const JOBS_FILE = path.join(DBMS_DIR, 'jobs.json');

export function getPersistedJobs(): any[] {
  return safeReadJsonFile<any[]>(JOBS_FILE, []);
}

export function savePersistedJob(job: any): any {
  try {
    const existing = getPersistedJobs();
    const idx = existing.findIndex((j) => j.id === job.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...job, updatedAt: new Date().toISOString() };
    } else {
      existing.unshift({ ...job, createdAt: job.createdAt || new Date().toISOString() });
    }
    atomicWriteJsonFile(JOBS_FILE, existing);
    return job;
  } catch (err) {
    console.error('[DBMS] Error saving persisted job:', err);
    return job;
  }
}

export function deletePersistedJob(jobId: string): boolean {
  try {
    const existing = getPersistedJobs();
    const filtered = existing.filter((j) => j.id !== jobId);
    atomicWriteJsonFile(JOBS_FILE, filtered);
    return true;
  } catch (err) {
    console.error('[DBMS] Error deleting persisted job:', err);
    return false;
  }
}

// ─── NEXUS TOPICS REPOSITORY ──────────────────────────────────────────────────

const TOPICS_FILE = path.join(DBMS_DIR, 'topics.json');

export function getPersistedTopics(): any[] {
  return safeReadJsonFile<any[]>(TOPICS_FILE, []);
}

export function savePersistedTopic(topic: any): any {
  try {
    const existing = getPersistedTopics();
    const idx = existing.findIndex((t) => t.id === topic.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...topic, updatedAt: new Date().toISOString() };
    } else {
      existing.unshift({ ...topic, createdAt: topic.createdAt || new Date().toISOString() });
    }
    atomicWriteJsonFile(TOPICS_FILE, existing);
    return topic;
  } catch (err) {
    console.error('[DBMS] Error saving persisted topic:', err);
    return topic;
  }
}

export function deletePersistedTopic(topicId: string): boolean {
  try {
    const existing = getPersistedTopics();
    const filtered = existing.filter((t) => t.id !== topicId);
    atomicWriteJsonFile(TOPICS_FILE, filtered);
    return true;
  } catch (err) {
    console.error('[DBMS] Error deleting persisted topic:', err);
    return false;
  }
}

// ─── NEXUS REVIEWS REPOSITORY ─────────────────────────────────────────────────

const REVIEWS_FILE = path.join(DBMS_DIR, 'reviews.json');

export function getPersistedReviews(): any[] {
  return safeReadJsonFile<any[]>(REVIEWS_FILE, []);
}

export function savePersistedReview(review: any): any {
  try {
    const existing = getPersistedReviews();
    const idx = existing.findIndex((r) => r.id === review.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...review, updatedAt: new Date().toISOString() };
    } else {
      existing.unshift({ ...review, createdAt: review.createdAt || new Date().toISOString() });
    }
    atomicWriteJsonFile(REVIEWS_FILE, existing);
    return review;
  } catch (err) {
    console.error('[DBMS] Error saving persisted review:', err);
    return review;
  }
}

export function deletePersistedReview(reviewId: string): boolean {
  try {
    const existing = getPersistedReviews();
    const filtered = existing.filter((r) => r.id !== reviewId);
    atomicWriteJsonFile(REVIEWS_FILE, filtered);
    return true;
  } catch (err) {
    console.error('[DBMS] Error deleting persisted review:', err);
    return false;
  }
}

// ─── NEXUS BLACKLIST CASES REPOSITORY ─────────────────────────────────────────

const CASES_FILE = path.join(DBMS_DIR, 'cases.json');

export function getPersistedCases(): any[] {
  return safeReadJsonFile<any[]>(CASES_FILE, []);
}

export function savePersistedCase(bCase: any): any {
  try {
    const existing = getPersistedCases();
    const idx = existing.findIndex((c) => c.id === bCase.id);
    if (idx >= 0) {
      existing[idx] = { ...existing[idx], ...bCase, updatedAt: new Date().toISOString() };
    } else {
      existing.unshift({ ...bCase, createdAt: bCase.createdAt || new Date().toISOString() });
    }
    atomicWriteJsonFile(CASES_FILE, existing);
    return bCase;
  } catch (err) {
    console.error('[DBMS] Error saving persisted case:', err);
    return bCase;
  }
}

export function deletePersistedCase(caseId: string): boolean {
  try {
    const existing = getPersistedCases();
    const filtered = existing.filter((c) => c.id !== caseId);
    atomicWriteJsonFile(CASES_FILE, filtered);
    return true;
  } catch (err) {
    console.error('[DBMS] Error deleting persisted case:', err);
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
    const raw = readFileSyncWithRetry(USERS_FILE);
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
    (u) =>
      (u.email && u.email.toLowerCase() === clean) ||
      (u.uid && u.uid.toLowerCase() === clean) ||
      (u.canonicalUid && String(u.canonicalUid).toLowerCase() === clean)
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

    atomicWriteJsonFile(USERS_FILE, existing);
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
    atomicWriteJsonFile(USERS_FILE, filtered);
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
    atomicWriteJsonFile(VERIFICATIONS_FILE, existing);
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
      atomicWriteJsonFile(VERIFICATIONS_FILE, existing);
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

    atomicWriteJsonFile(VERIFICATION_AUDIT_FILE, existing);
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

export const DEFAULT_SEED_COMPANIES: DbmsCompanyRecord[] = [
  {
    id: 'CMP-COGOPORT-001',
    legalName: 'Cogoport India Private Limited',
    tradeName: 'COGOPORT',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    postalCode: '400069',
    registeredAddress: 'Cogoport Headquarters, Andheri East, Mumbai, Maharashtra 400069, India',
    gstn: '27AAACC1234F1Z5',
    pan: 'AAACC1234F',
    iec: '0312045678',
    mto: 'MTO/DGS/2022/1042',
    status: 'verified',
    verified: true,
    memberCount: 1,
    primaryContactName: 'Rajat RAI',
    primaryContactEmail: 'rajat.rai@cogoport.com',
    primaryContactPhone: '+91 9620012345',
    adminNotes: ['Authoritative Enterprise Forwarder Profile', 'Statutory KYC Verified & Active'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'CMP-RAIVEGA-01',
    legalName: 'Rai Vega Logistics Private Limited',
    tradeName: 'RAIVEGA',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    postalCode: '400021',
    registeredAddress: 'Rai Vega House, Nariman Point, Mumbai 400021, India',
    gstn: '27AABCR9876Q1Z2',
    pan: 'AABCR9876Q',
    iec: '0319087654',
    mto: 'MTO/DGS/2023/2189',
    status: 'verified',
    verified: true,
    memberCount: 1,
    primaryContactName: 'Management RAIVEGA',
    primaryContactEmail: 'mgt@raivega.in',
    primaryContactPhone: '+91 98200 99999',
    adminNotes: ['Premium Verified Logistics Member', 'Statutory KYC Verified & Active'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp_oceanic_01',
    legalName: 'Oceanic Forwarders Private Limited',
    tradeName: 'Oceanic Forwarders Ltd',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    postalCode: '400001',
    registeredAddress: 'Oceanic Tower, Ballard Estate, Fort, Mumbai 400001',
    gstn: '27AABCO5555M1Z1',
    pan: 'AABCO5555M',
    status: 'verified',
    verified: true,
    memberCount: 12,
    primaryContactName: 'Ocean Freight Operator',
    primaryContactEmail: 'trader_1790855848254@oceanfreight.net',
    adminNotes: ['High volume trade lane operator'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp_forwarder_01',
    legalName: 'Forwarder Group International Private Limited',
    tradeName: 'Forwarder Group Ltd',
    country: 'India',
    state: 'Maharashtra',
    city: 'Mumbai',
    postalCode: '400001',
    registeredAddress: 'Forwarder Plaza, Nariman Point, Mumbai 400021',
    gstn: '27AABCF1111N1Z3',
    pan: 'AABCF1111N',
    status: 'verified',
    verified: true,
    memberCount: 11,
    primaryContactName: 'Chief Compliance Officer',
    primaryContactEmail: 'officer_1790855845116@forwardergroup.com',
    adminNotes: ['Regulatory compliance verified'],
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

export function getPersistedCompanies(): DbmsCompanyRecord[] {
  ensureDirExists();
  try {
    let list: DbmsCompanyRecord[] = [];
    if (fs.existsSync(COMPANIES_FILE)) {
      const raw = fs.readFileSync(COMPANIES_FILE, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }

    let modified = false;

    // 1. Ensure foundation seed companies (Cogoport, Raivega, Oceanic, Forwarder Group) are present
    for (const seed of DEFAULT_SEED_COMPANIES) {
      const exists = list.some(
        (c) =>
          c.id === seed.id ||
          (c.tradeName && seed.tradeName && c.tradeName.toUpperCase() === seed.tradeName.toUpperCase()) ||
          c.legalName.toUpperCase() === seed.legalName.toUpperCase()
      );
      if (!exists) {
        list.push({ ...seed });
        modified = true;
      }
    }

    // 2. Dynamic reconciliation: ensure companies referenced by registered users exist in Master Registry
    try {
      const users = getPersistedUsers();
      for (const u of users) {
        if (!u.company) continue;
        const cName = u.company.trim();
        const cId = u.companyId || `CMP-${cName.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}`;
        const exists = list.some(
          (c) =>
            c.id === cId ||
            (c.tradeName && c.tradeName.toUpperCase() === cName.toUpperCase()) ||
            c.legalName.toUpperCase().includes(cName.toUpperCase())
        );
        if (!exists) {
          list.push({
            id: cId,
            legalName: `${cName} Private Limited`,
            tradeName: cName,
            country: u.country || 'India',
            state: u.state || 'Maharashtra',
            city: u.city || 'Mumbai',
            postalCode: u.postalCode || '400001',
            registeredAddress: u.formattedAddress || `${cName} Operations Center, Mumbai, India`,
            gstn: u.gstn || '',
            pan: u.pan || '',
            status: u.isVerified || u.email_verified ? 'verified' : 'pending',
            verified: Boolean(u.isVerified || u.email_verified),
            memberCount: 1,
            primaryContactName: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
            primaryContactEmail: u.email,
            primaryContactPhone: u.mobile || u.phone || '',
            adminNotes: ['Auto-reconciled from registered member profile'],
            createdAt: u.createdAt || new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          modified = true;
        }
      }
    } catch (reconcileErr) {
      console.warn('[DBMS] Company reconciliation error:', reconcileErr);
    }

    if (modified) {
      try {
        atomicWriteJsonFile(COMPANIES_FILE, list);
      } catch {}
    }

    return list;
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

    atomicWriteJsonFile(COMPANIES_FILE, companies);
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
    atomicWriteJsonFile(PRESENCE_FILE, existing);
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
    atomicWriteJsonFile(EVENTS_FILE, trimmed);
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
    atomicWriteJsonFile(INTENTS_FILE, existing);
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
    atomicWriteJsonFile(TRANSACTIONS_FILE, existing);
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
    atomicWriteJsonFile(EMAIL_DELIVERY_EVENTS_FILE, trimmed);
    return event;
  } catch (err) {
    console.error('[DBMS] Error saving persisted email delivery event:', err);
    return event;
  }
}



