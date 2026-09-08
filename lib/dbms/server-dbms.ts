import fs from 'fs';
import path from 'path';
import { RateItem, FeedPost } from '@/lib/types';

const DBMS_DIR = path.join(process.cwd(), '.knox', 'dbms');
const RATES_FILE = path.join(DBMS_DIR, 'rates.json');
const POSTS_FILE = path.join(DBMS_DIR, 'posts.json');

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
