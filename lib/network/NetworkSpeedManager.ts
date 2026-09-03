// HyperSpeed Network, Bandwidth Adaptation & Offline Outbox Engine
// Designed for logistics professionals, port operators, and field agents on flaky 2G/3G/4G.

export type NetworkSpeedTier = 'hyper' | 'adaptive' | 'saver' | 'offline';

export interface NetworkConnectionInfo {
  effectiveType: 'slow-2g' | '2g' | '3g' | '4g' | 'unknown';
  downlink: number; // Mbps
  rtt: number; // ms
  saveData: boolean;
}

export interface QueuedOfflineAction {
  id: string;
  actionType: 'like_post' | 'save_post' | 'add_comment' | 'create_post' | 'read_receipt' | 'rate_bookmark';
  payload: any;
  actorUid: string;
  createdAt: string;
  retryCount: number;
}

const OUTBOX_STORAGE_KEY = 'fr8x_offline_outbox';
const SAVED_BOOKMARKS_KEY = 'fr8x_saved_bookmarks';

type NetworkChangeListener = (info: {
  isOnline: boolean;
  tier: NetworkSpeedTier;
  connection: NetworkConnectionInfo;
  pendingCount: number;
}) => void;

class NetworkSpeedManager {
  private listeners: Set<NetworkChangeListener> = new Set();
  private isOnline = true;
  private connectionInfo: NetworkConnectionInfo = {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
  };
  private syncInProgress = false;
  private memoryOutbox: QueuedOfflineAction[] = [];
  private memoryBookmarks: Set<string> = new Set();

  constructor() {
    if (typeof window !== 'undefined') {
      this.isOnline = navigator.onLine;
      this.inspectConnection();

      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);

      const nav = navigator as any;
      if (nav.connection) {
        nav.connection.addEventListener('change', this.handleConnectionChange);
      }
    }
  }

  private inspectConnection() {
    if (typeof window === 'undefined') return;
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn) {
      this.connectionInfo = {
        effectiveType: conn.effectiveType || '4g',
        downlink: conn.downlink || 10,
        rtt: conn.rtt || 50,
        saveData: Boolean(conn.saveData),
      };
    }
  }

  public getSpeedTier(): NetworkSpeedTier {
    if (!this.isOnline) return 'offline';
    const { effectiveType, rtt, saveData } = this.connectionInfo;
    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || rtt > 600) {
      return 'saver'; // Aggressive data saver, small page batches, zero background polling
    }
    if (effectiveType === '3g' || rtt > 250) {
      return 'adaptive'; // Stale-while-revalidate prioritized, deferred secondary queries
    }
    return 'hyper'; // Full throughput, instant background revalidation
  }

  public getRecommendedBatchSize(): number {
    const tier = this.getSpeedTier();
    switch (tier) {
      case 'offline':
        return 50; // Serve as much from cache as available
      case 'saver':
        return 12; // Minimal payloads for slow 2G/3G
      case 'adaptive':
        return 20; // Moderate payload for 3G
      case 'hyper':
      default:
        return 40; // Full batch on fast 4G/WiFi
    }
  }

  private handleOnline = () => {
    this.isOnline = true;
    this.inspectConnection();
    this.notify();
    this.flushOutbox();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notify();
  };

  private handleConnectionChange = () => {
    this.inspectConnection();
    this.notify();
  };

  public subscribe(listener: NetworkChangeListener): () => void {
    this.listeners.add(listener);
    listener({
      isOnline: this.isOnline,
      tier: this.getSpeedTier(),
      connection: this.connectionInfo,
      pendingCount: this.getPendingOutboxCount(),
    });
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const tier = this.getSpeedTier();
    const count = this.getPendingOutboxCount();
    this.listeners.forEach((fn) =>
      fn({
        isOnline: this.isOnline,
        tier,
        connection: this.connectionInfo,
        pendingCount: count,
      })
    );
  }

  // ─── Offline Outbox Management ─────────────────────────────────────────────

  public getOutbox(): QueuedOfflineAction[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return [...this.memoryOutbox];
    }
    try {
      const raw = localStorage.getItem(OUTBOX_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [...this.memoryOutbox];
    } catch {
      return [...this.memoryOutbox];
    }
  }

  public getPendingOutboxCount(): number {
    return this.getOutbox().length;
  }

  public queueAction(
    actionType: QueuedOfflineAction['actionType'],
    payload: any,
    actorUid = 'anonymous'
  ): QueuedOfflineAction {
    const action: QueuedOfflineAction = {
      id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      actionType,
      payload,
      actorUid,
      createdAt: new Date().toISOString(),
      retryCount: 0,
    };

    this.memoryOutbox.push(action);
    const current = this.getOutbox();
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(current));
      } catch {}
    }

    this.notify();

    // If online, schedule non-blocking background flush
    if (this.isOnline) {
      setTimeout(() => this.flushOutbox(), 200);
    }

    return action;
  }

  /**
   * Flush queued actions with batching and replay handlers
   */
  public async flushOutbox(): Promise<{ synced: number; remaining: number }> {
    if (!this.isOnline || this.syncInProgress) {
      return { synced: 0, remaining: this.getPendingOutboxCount() };
    }

    const queue = this.getOutbox();
    if (queue.length === 0) return { synced: 0, remaining: 0 };

    this.syncInProgress = true;
    let syncedCount = 0;
    const remainingQueue: QueuedOfflineAction[] = [];

    // Lazy import DB helpers to avoid SSR circular imports
    const { upsertPostInDB } = await import('@/lib/firebase/firestore');

    for (const item of queue) {
      try {
        if (item.actionType === 'like_post' || item.actionType === 'create_post') {
          if (item.payload) {
            const payloadId = item.payload.id || item.payload.postId;
            if (payloadId) {
              await upsertPostInDB({ ...item.payload, id: payloadId });
            }
          }
        }
        // Low-risk actions like save_post or read_receipt are already persisted to local storage
        syncedCount++;
      } catch (err) {
        console.warn('[HyperSpeed Sync] Retrying item later:', item.id, err);
        item.retryCount += 1;
        if (item.retryCount < 5) {
          remainingQueue.push(item);
        }
      }
    }

    this.memoryOutbox = [...remainingQueue];
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(remainingQueue));
      } catch {}
    }

    this.syncInProgress = false;
    this.notify();

    return { synced: syncedCount, remaining: remainingQueue.length };
  }

  // ─── Bookmark Persistence ───────────────────────────────────────────────────

  public getSavedBookmarks(): string[] {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
      return Array.from(this.memoryBookmarks);
    }
    try {
      const raw = localStorage.getItem(SAVED_BOOKMARKS_KEY);
      return raw ? JSON.parse(raw) : Array.from(this.memoryBookmarks);
    } catch {
      return Array.from(this.memoryBookmarks);
    }
  }

  public toggleBookmarkLocally(postId: string): boolean {
    const list = new Set(this.getSavedBookmarks());
    let isSaved = false;
    if (list.has(postId)) {
      list.delete(postId);
      this.memoryBookmarks.delete(postId);
      isSaved = false;
    } else {
      list.add(postId);
      this.memoryBookmarks.add(postId);
      isSaved = true;
    }
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(SAVED_BOOKMARKS_KEY, JSON.stringify(Array.from(list)));
      } catch {}
    }
    return isSaved;
  }
}

export const networkSpeedManager = new NetworkSpeedManager();
