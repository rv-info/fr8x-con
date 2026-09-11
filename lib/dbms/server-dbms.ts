import fs from 'fs';
import path from 'path';
import { RateItem, FeedPost } from '@/lib/types';

const DBMS_DIR = path.join(process.cwd(), '.knox', 'dbms');
const RATES_FILE = path.join(DBMS_DIR, 'rates.json');
const POSTS_FILE = path.join(DBMS_DIR, 'posts.json');
const USERS_FILE = path.join(DBMS_DIR, 'users.json');
const VERIFICATIONS_FILE = path.join(DBMS_DIR, 'verifications.json');
const VERIFICATION_AUDIT_FILE = path.join(DBMS_DIR, 'verification_audit.json');

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

