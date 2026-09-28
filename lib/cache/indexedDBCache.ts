/**
 * lib/cache/indexedDBCache.ts
 * Production-grade IndexedDB Caching Engine powered by `idb` (~1.2KB).
 * Provides 0ms instant local reads for Master Logistics Data (Ports, Countries, Carriers,
 * Container Equipment, Commodities, Tax SAC), Offline Drafts, Recently Viewed Shipments,
 * and Pending Sync Actions.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

const DB_NAME = 'fr8x_hyper_cache_v1';
const DB_VERSION = 1;

export interface Fr8xCacheSchema extends DBSchema {
  master_cache: {
    key: string;
    value: {
      key: string;
      data: any;
      updatedAt: number;
      ttlMs?: number;
    };
  };
  drafts: {
    key: string;
    value: {
      id: string;
      type: 'auction' | 'rate' | 'post' | 'shipment';
      data: any;
      updatedAt: number;
    };
    indexes: { 'by-type': string };
  };
  recently_viewed: {
    key: string;
    value: {
      id: string;
      type: 'shipment' | 'auction' | 'quotation' | 'rate';
      title: string;
      summary?: string;
      viewedAt: number;
    };
    indexes: { 'by-type': string; 'by-time': number };
  };
  pending_sync_queue: {
    key: string;
    value: {
      id: string;
      action: string;
      endpoint: string;
      payload: any;
      createdAt: number;
      retryCount: number;
    };
  };
}

let dbPromise: Promise<IDBPDatabase<Fr8xCacheSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<Fr8xCacheSchema>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable on server'));
  }
  if (!dbPromise) {
    dbPromise = openDB<Fr8xCacheSchema>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 1. Master Cache Store (Ports, Countries, Carriers, Container Types, HS Codes)
        if (!db.objectStoreNames.contains('master_cache')) {
          db.createObjectStore('master_cache', { keyPath: 'key' });
        }

        // 2. Drafts Store (Auctions, Rates, Feeds offline drafts)
        if (!db.objectStoreNames.contains('drafts')) {
          const draftStore = db.createObjectStore('drafts', { keyPath: 'id' });
          draftStore.createIndex('by-type', 'type');
        }

        // 3. Recently Viewed Store (Shipments, Quotations, Rates)
        if (!db.objectStoreNames.contains('recently_viewed')) {
          const recentStore = db.createObjectStore('recently_viewed', { keyPath: 'id' });
          recentStore.createIndex('by-type', 'type');
          recentStore.createIndex('by-time', 'viewedAt');
        }

        // 4. Pending Offline Sync Queue
        if (!db.objectStoreNames.contains('pending_sync_queue')) {
          db.createObjectStore('pending_sync_queue', { keyPath: 'id' });
        }
      },
    });
  }
  return dbPromise;
}

// ─── MASTER DATA CACHING (Ports, Carriers, Equipment, Countries, HS Codes) ───

/**
 * Get cached master dataset. Returns null if expired or missing.
 */
export async function getCachedMasterData<T>(key: string): Promise<T | null> {
  try {
    const db = await getDB();
    const entry = await db.get('master_cache', key);
    if (!entry) return null;

    if (entry.ttlMs && Date.now() - entry.updatedAt > entry.ttlMs) {
      // Background prune expired entry without blocking
      db.delete('master_cache', key).catch(() => {});
      return null;
    }
    return entry.data as T;
  } catch (err) {
    console.warn('[IndexedDB] Error reading master cache:', err);
    return null;
  }
}

/**
 * Cache master dataset with an optional TTL (defaults to 7 days for stable logistics data).
 */
export async function setCachedMasterData<T>(
  key: string,
  data: T,
  ttlMs: number = 7 * 24 * 60 * 60 * 1000
): Promise<void> {
  try {
    const db = await getDB();
    await db.put('master_cache', {
      key,
      data,
      updatedAt: Date.now(),
      ttlMs,
    });
  } catch (err) {
    console.warn('[IndexedDB] Error setting master cache:', err);
  }
}

// ─── DRAFTS MANAGEMENT (Offline / Poor Connection Support) ───────────────────

export async function saveDraft(id: string, type: 'auction' | 'rate' | 'post' | 'shipment', data: any): Promise<void> {
  try {
    const db = await getDB();
    await db.put('drafts', {
      id,
      type,
      data,
      updatedAt: Date.now(),
    });
  } catch (err) {
    console.warn('[IndexedDB] Error saving draft:', err);
  }
}

export async function getDraft<T = any>(id: string): Promise<T | null> {
  try {
    const db = await getDB();
    const entry = await db.get('drafts', id);
    return entry ? (entry.data as T) : null;
  } catch (err) {
    return null;
  }
}

export async function getAllDraftsByType(type: 'auction' | 'rate' | 'post' | 'shipment'): Promise<any[]> {
  try {
    const db = await getDB();
    const all = await db.getAllFromIndex('drafts', 'by-type', type);
    return all.map((item) => ({ id: item.id, ...item.data, updatedAt: item.updatedAt }));
  } catch (err) {
    return [];
  }
}

export async function deleteDraft(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('drafts', id);
  } catch (err) {
    console.warn('[IndexedDB] Error deleting draft:', err);
  }
}

// ─── RECENTLY VIEWED (Shipments, Quotations, Auctions, Rates) ─────────────────

export async function recordRecentlyViewed(
  id: string,
  type: 'shipment' | 'auction' | 'quotation' | 'rate',
  title: string,
  summary?: string
): Promise<void> {
  try {
    const db = await getDB();
    await db.put('recently_viewed', {
      id,
      type,
      title,
      summary,
      viewedAt: Date.now(),
    });
  } catch (err) {
    console.warn('[IndexedDB] Error recording recently viewed:', err);
  }
}

export async function getRecentlyViewed(
  type?: 'shipment' | 'auction' | 'quotation' | 'rate',
  limitCount: number = 10
): Promise<Array<{ id: string; type: string; title: string; summary?: string; viewedAt: number }>> {
  try {
    const db = await getDB();
    let records = type
      ? await db.getAllFromIndex('recently_viewed', 'by-type', type)
      : await db.getAll('recently_viewed');

    return records
      .sort((a, b) => b.viewedAt - a.viewedAt)
      .slice(0, limitCount);
  } catch (err) {
    return [];
  }
}

// ─── OFFLINE SYNC QUEUE (Pending Actions with Exponential Backoff) ────────────

export async function enqueueOfflineAction(action: string, endpoint: string, payload: any): Promise<string> {
  const id = `sync_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  try {
    const db = await getDB();
    await db.put('pending_sync_queue', {
      id,
      action,
      endpoint,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
    });
  } catch (err) {
    console.warn('[IndexedDB] Error enqueueing offline action:', err);
  }
  return id;
}

export async function getPendingOfflineActions(): Promise<Array<{
  id: string;
  action: string;
  endpoint: string;
  payload: any;
  createdAt: number;
  retryCount: number;
}>> {
  try {
    const db = await getDB();
    return await db.getAll('pending_sync_queue');
  } catch (err) {
    return [];
  }
}

export async function removeOfflineAction(id: string): Promise<void> {
  try {
    const db = await getDB();
    await db.delete('pending_sync_queue', id);
  } catch (err) {}
}

export async function incrementRetryOfflineAction(id: string): Promise<void> {
  try {
    const db = await getDB();
    const item = await db.get('pending_sync_queue', id);
    if (item) {
      item.retryCount += 1;
      await db.put('pending_sync_queue', item);
    }
  } catch (err) {}
}
