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
  actionType:
    | 'like_post'
    | 'save_post'
    | 'add_comment'
    | 'create_post'
    | 'edit_post'
    | 'read_receipt'
    | 'rate_bookmark'
    | 'submit_bid'
    | 'create_auction'
    | 'create_rate'
    | 'update_rate'
    | 'delete_rate';
  payload: any;
  actorUid: string;
  createdAt: string;
  retryCount: number;
}

export interface NetworkStatusPayload {
  isOnline: boolean;
  tier: NetworkSpeedTier;
  connection: NetworkConnectionInfo;
  pendingCount: number;
  isSyncing: boolean;
  measuredLatency: number;
  lastSyncedAt: string | null;
}

const OUTBOX_STORAGE_KEY = 'fr8x_offline_outbox';
const SAVED_BOOKMARKS_KEY = 'fr8x_saved_bookmarks';

type NetworkChangeListener = (info: NetworkStatusPayload) => void;

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
  private measuredLatency = 50;
  private lastSyncedAt: string | null = null;
  private pingTimer: any = null;

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

      // Initial latency test after a short delay
      setTimeout(() => {
        this.measureLatency();
      }, 1200);

      // Heartbeat ping every 45s (or 15s if slow) to detect stealth packet loss / carrier throttling
      this.startHeartbeat();

      // Cross-tab synchronization for outbox state
      if ('BroadcastChannel' in window) {
        try {
          const bc = new BroadcastChannel('fr8x_network_sync');
          bc.onmessage = (evt) => {
            if (evt.data?.type === 'OUTBOX_CHANGED') {
              this.notify();
            }
          };
        } catch {}
      }

      window.addEventListener('storage', (evt) => {
        if (evt.key === OUTBOX_STORAGE_KEY) {
          this.notify();
        }
      });
    }
  }

  private startHeartbeat() {
    if (typeof window === 'undefined') return;
    if (this.pingTimer) clearInterval(this.pingTimer);

    const interval = this.getSpeedTier() === 'saver' ? 18000 : 45000;
    this.pingTimer = setInterval(() => {
      if (document.visibilityState === 'visible' && this.isOnline) {
        this.measureLatency();
      }
    }, interval);
  }

  private inspectConnection() {
    if (typeof window === 'undefined') return;
    const nav = navigator as any;
    const conn = nav.connection || nav.mozConnection || nav.webkitConnection;
    if (conn) {
      this.connectionInfo = {
        effectiveType: conn.effectiveType || '4g',
        downlink: typeof conn.downlink === 'number' ? conn.downlink : 10,
        rtt: typeof conn.rtt === 'number' ? conn.rtt : 50,
        saveData: Boolean(conn.saveData),
      };
    }
  }

  public async measureLatency(): Promise<number> {
    if (typeof window === 'undefined' || !this.isOnline) return 999;
    try {
      const start = performance.now();
      const ctrl = new AbortController();
      const timeoutId = setTimeout(() => ctrl.abort(), 4000);

      const res = await fetch('/api/ping', {
        method: 'GET',
        cache: 'no-store',
        signal: ctrl.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const duration = Math.round(performance.now() - start);
        this.measuredLatency = duration;
        // Merge measured latency with navigator RTT
        this.connectionInfo.rtt = Math.round((this.connectionInfo.rtt + duration) / 2);
        this.notify();
        return duration;
      }
    } catch {
      // Latency probe failed or timed out — indicates high packet drop or 2G stalling
      this.measuredLatency = 950;
      this.connectionInfo.rtt = Math.max(this.connectionInfo.rtt, 800);
      this.notify();
    }
    return this.measuredLatency;
  }

  public getSpeedTier(): NetworkSpeedTier {
    if (!this.isOnline) return 'offline';
    const { effectiveType, rtt, saveData } = this.connectionInfo;
    const effectiveRtt = Math.max(rtt, this.measuredLatency);

    if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g' || effectiveRtt > 500) {
      return 'saver'; // Aggressive data saver, small page batches, zero background polling
    }
    if (effectiveType === '3g' || effectiveRtt > 220) {
      return 'adaptive'; // Stale-while-revalidate prioritized, deferred secondary queries
    }
    return 'hyper'; // Full throughput, instant background revalidation
  }

  public isLowBandwidth(): boolean {
    const tier = this.getSpeedTier();
    return tier === 'saver' || tier === 'offline';
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
    this.measureLatency();
    this.notify();
    this.flushOutbox();
  };

  private handleOffline = () => {
    this.isOnline = false;
    this.notify();
  };

  private handleConnectionChange = () => {
    this.inspectConnection();
    this.measureLatency();
    this.notify();
  };

  public subscribe(listener: NetworkChangeListener): () => void {
    this.listeners.add(listener);
    listener(this.getStatusPayload());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private getStatusPayload(): NetworkStatusPayload {
    return {
      isOnline: this.isOnline,
      tier: this.getSpeedTier(),
      connection: this.connectionInfo,
      pendingCount: this.getPendingOutboxCount(),
      isSyncing: this.syncInProgress,
      measuredLatency: this.measuredLatency,
      lastSyncedAt: this.lastSyncedAt,
    };
  }

  private notify() {
    const payload = this.getStatusPayload();
    this.listeners.forEach((fn) => fn(payload));
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

    const current = this.getOutbox();
    current.push(action);
    this.memoryOutbox = current;

    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(OUTBOX_STORAGE_KEY, JSON.stringify(current));
      } catch {}
    }

    // Bridge with IndexedDB pending_sync_queue for durable fallback
    if (typeof window !== 'undefined') {
      import('@/lib/cache/indexedDBCache')
        .then(({ enqueueOfflineAction }) => {
          enqueueOfflineAction(actionType, '', payload).catch(() => {});
        })
        .catch(() => {});

      // Cross-tab broadcast
      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('fr8x_network_sync');
          bc.postMessage({ type: 'OUTBOX_CHANGED' });
          bc.close();
        }
      } catch {}
    }

    this.notify();

    // If online, schedule non-blocking background flush with jitter
    if (this.isOnline) {
      setTimeout(() => this.flushOutbox(), 200 + Math.random() * 200);
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
    this.notify();

    let syncedCount = 0;
    const remainingQueue: QueuedOfflineAction[] = [];

    // Lazy import Supabase DB helpers to avoid SSR circular imports
    const {
      postDbService,
      auctionDbService,
      rateDbService,
    } = await import('@/lib/supabase/db');
    const { createClient } = await import('@/lib/supabase/client');

    for (const item of queue) {
      try {
        if (item.actionType === 'create_post') {
          if (item.payload) {
            const payloadId = item.payload.id || item.payload.postId;
            if (payloadId) {
              await postDbService.upsertPost({ ...item.payload, id: payloadId });
              // Sync with server API
              await fetch('/api/feed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...item.payload, id: payloadId }),
              }).catch(() => {});
            }
          }
        } else if (item.actionType === 'edit_post') {
          if (item.payload) {
            await postDbService.upsertPost(item.payload);
            await fetch('/api/feed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload),
            }).catch(() => {});
          }
        } else if (item.actionType === 'like_post') {
          if (item.payload) {
            await postDbService.upsertPost(item.payload);
          }
        } else if (item.actionType === 'create_auction') {
          if (item.payload && item.payload.id) {
            await auctionDbService.upsertAuction(item.payload);
          }
        } else if (item.actionType === 'submit_bid') {
          if (item.payload && item.payload.auctionId && item.payload.bid) {
            await auctionDbService.submitBid({ ...item.payload.bid, auctionId: item.payload.auctionId });
            if (item.payload.bid.evidenceDocket) {
              try {
                const supabase = createClient();
                await supabase.from('audit_logs').insert({
                  action: 'SUBMIT_BID_EVIDENCE',
                  target_id: item.payload.bid.evidenceDocket.docketRef,
                  details: {
                    ...item.payload.bid.evidenceDocket,
                    auctionId: item.payload.auctionId,
                    grandTotalUSD: item.payload.bid.grandTotalUSD,
                    status: 'VERIFIED_LEGAL_EVIDENCE',
                  },
                });
              } catch {}
            }
          }
        } else if (item.actionType === 'create_rate' || item.actionType === 'update_rate') {
          if (item.payload && item.payload.id) {
            await rateDbService.upsertRate(item.payload);
            await fetch('/api/rates', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(item.payload),
            }).catch(() => {});
          }
        } else if (item.actionType === 'delete_rate') {
          if (item.payload && item.payload.id) {
            await rateDbService.deleteRate(item.payload.id);
            await fetch(`/api/rates?id=${encodeURIComponent(item.payload.id)}`, {
              method: 'DELETE',
            }).catch(() => {});
          }
        }
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

      try {
        if ('BroadcastChannel' in window) {
          const bc = new BroadcastChannel('fr8x_network_sync');
          bc.postMessage({ type: 'OUTBOX_CHANGED' });
          bc.close();
        }
      } catch {}
    }

    this.syncInProgress = false;
    this.lastSyncedAt = new Date().toLocaleTimeString();
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
