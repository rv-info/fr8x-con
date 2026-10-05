/**
 * lib/presence/presenceService.ts
 * Real-time 3-state presence service with BroadcastChannel cross-tab synchronization,
 * inactivity timer (5m idle, 15m away), throttled heartbeats, and anti-flapping visibility.
 */

import { PresenceStatus, UserPresenceState } from '@/lib/types';

// In-memory presence cache for local client
const localPresenceCache = new Map<string, UserPresenceState>();

const HEARTBEAT_INTERVAL_MS = 90_000;  // 90 seconds throttled heartbeat
const PRESENCE_TTL_SECONDS = 300;      // 5 minutes TTL
const INACTIVITY_IDLE_MS = 5 * 60 * 1000;   // 5 minutes user inactivity -> idle
const INACTIVITY_AWAY_MS = 15 * 60 * 1000;  // 15 minutes user inactivity -> away
const ACTIVITY_THROTTLE_MS = 3000;     // Throttle activity listener to max once every 3s

class PresenceService {
  private currentUserId: string | null = null;
  private currentStatus: PresenceStatus = 'active';
  private manualPreference: 'active' | 'away' | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private idleTimer: NodeJS.Timeout | null = null;
  private awayTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatTime = 0;
  private lastActivityTime = 0;
  private listeners: Set<(status: PresenceStatus) => void> = new Set();

  // Multi-tab coordination
  private channel: BroadcastChannel | null = null;
  private tabId: string = typeof window !== 'undefined' ? `tab_${Math.random().toString(36).substring(2, 9)}` : '';
  private peerTabs: Map<string, number> = new Map(); // tabId -> lastSeen

  public initialize(userId: string): void {
    if (typeof window === 'undefined' || !userId) return;

    // Load persisted manual presence preference if present
    try {
      const saved = localStorage.getItem('fr8x_user_presence_status');
      if (saved === 'active' || saved === 'away') {
        this.manualPreference = saved;
        this.currentStatus = saved;
      }
    } catch {}

    if (this.currentUserId === userId) {
      this.notifyListeners(this.currentStatus);
      return;
    }

    this.currentUserId = userId;
    if (!this.manualPreference) {
      this.currentStatus = document.visibilityState === 'visible' ? 'active' : 'idle';
    }

    // Initialize cross-tab broadcast coordination
    this.initBroadcastChannel();

    // Broadcast initial state & announce tab
    this.sendHeartbeat(true);
    this.notifyListeners(this.currentStatus);

    // Setup tab visibility & user inactivity listeners
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('focus', this.handleFocus);
    window.addEventListener('beforeunload', this.handleUnload);

    // Activity tracking for idle / away detection
    this.setupInactivityTracking();

    // Throttled heartbeat loop
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
  }

  public cleanup(): void {
    if (typeof window === 'undefined') return;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('beforeunload', this.handleUnload);
    this.removeInactivityTracking();

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.awayTimer) clearTimeout(this.awayTimer);

    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'TAB_CLOSING', tabId: this.tabId });
        this.channel.close();
      } catch {}
      this.channel = null;
    }
  }

  public getStatus(): PresenceStatus {
    return this.currentStatus;
  }

  public setStatus(status: 'active' | 'away'): void {
    this.manualPreference = status;
    this.currentStatus = status;

    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('fr8x_user_presence_status', status);
      } catch {}
    }

    this.broadcastStatus(status);
    this.sendHeartbeat(true);
    this.notifyListeners(status);
  }

  public subscribe(listener: (status: PresenceStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(status: PresenceStatus): void {
    this.listeners.forEach((listener) => {
      try {
        listener(status);
      } catch {}
    });
  }

  // ─── CROSS-TAB COORDINATION ───────────────────────────────────────────────

  private initBroadcastChannel(): void {
    if (typeof window === 'undefined' || !('BroadcastChannel' in window)) return;

    try {
      this.channel = new BroadcastChannel('fr8x_presence_sync');
      this.channel.onmessage = (event: MessageEvent) => {
        const data = event.data;
        if (!data || typeof data !== 'object') return;

        const now = Date.now();
        switch (data.type) {
          case 'TAB_OPEN':
            if (data.tabId && data.tabId !== this.tabId) {
              this.peerTabs.set(data.tabId, now);
              // Acknowledge presence to new tab
              this.channel?.postMessage({
                type: 'TAB_PONG',
                tabId: this.tabId,
                status: this.currentStatus,
              });
            }
            break;

          case 'TAB_PONG':
            if (data.tabId && data.tabId !== this.tabId) {
              this.peerTabs.set(data.tabId, now);
            }
            break;

          case 'TAB_CLOSING':
            if (data.tabId) {
              this.peerTabs.delete(data.tabId);
            }
            break;

          case 'STATUS_UPDATE':
            if (data.status && data.status !== this.currentStatus && !this.manualPreference) {
              this.currentStatus = data.status;
              this.notifyListeners(data.status);
            }
            break;
        }
      };

      // Announce existence to existing tabs
      this.channel.postMessage({ type: 'TAB_OPEN', tabId: this.tabId, userId: this.currentUserId });
    } catch {
      this.channel = null;
    }
  }

  private broadcastStatus(status: PresenceStatus): void {
    if (!this.channel) return;
    try {
      this.channel.postMessage({
        type: 'STATUS_UPDATE',
        tabId: this.tabId,
        status,
        userId: this.currentUserId,
      });
    } catch {}
  }

  // ─── USER ACTIVITY & INACTIVITY TIMERS ─────────────────────────────────────

  private setupInactivityTracking(): void {
    if (typeof window === 'undefined') return;
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.addEventListener(evt, this.handleUserActivity, { passive: true }));
    this.resetInactivityTimers();
  }

  private removeInactivityTracking(): void {
    if (typeof window === 'undefined') return;
    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach((evt) => window.removeEventListener(evt, this.handleUserActivity));
  }

  private handleUserActivity = (): void => {
    const now = Date.now();
    if (now - this.lastActivityTime < ACTIVITY_THROTTLE_MS) return;
    this.lastActivityTime = now;

    this.resetInactivityTimers();

    if (!this.manualPreference && this.currentStatus !== 'active') {
      this.currentStatus = 'active';
      this.broadcastStatus('active');
      this.sendHeartbeat();
      this.notifyListeners('active');
    }
  };

  private resetInactivityTimers(): void {
    if (this.idleTimer) clearTimeout(this.idleTimer);
    if (this.awayTimer) clearTimeout(this.awayTimer);

    // 5 minutes -> transition to idle
    this.idleTimer = setTimeout(() => {
      if (!this.manualPreference && this.currentStatus === 'active') {
        this.currentStatus = 'idle';
        this.broadcastStatus('idle');
        this.sendHeartbeat();
        this.notifyListeners('idle');
      }
    }, INACTIVITY_IDLE_MS);

    // 15 minutes -> transition to away
    this.awayTimer = setTimeout(() => {
      if (!this.manualPreference && this.currentStatus !== 'away') {
        this.currentStatus = 'away';
        this.broadcastStatus('away');
        this.sendHeartbeat();
        this.notifyListeners('away');
      }
    }, INACTIVITY_AWAY_MS);
  }

  // ─── TAB VISIBILITY HANDLERS ───────────────────────────────────────────────

  private handleVisibilityChange = (): void => {
    if (this.manualPreference) return;

    if (document.visibilityState === 'visible') {
      // User returned to tab: reset inactivity and mark active
      this.handleUserActivity();
    } else {
      // Tab hidden: if user hasn't interacted recently, set idle
      const timeSinceActivity = Date.now() - this.lastActivityTime;
      if (timeSinceActivity > 60_000 && this.currentStatus === 'active') {
        this.currentStatus = 'idle';
        this.broadcastStatus('idle');
        this.sendHeartbeat();
        this.notifyListeners('idle');
      }
    }
  };

  private handleFocus = (): void => {
    if (this.manualPreference) return;
    this.handleUserActivity();
  };

  private handleUnload = (): void => {
    if (!this.currentUserId) return;

    // Notify peers that this tab is closing
    if (this.channel) {
      try {
        this.channel.postMessage({ type: 'TAB_CLOSING', tabId: this.tabId });
      } catch {}
    }

    // Prune stale peer tabs (> 3 minutes inactive)
    const now = Date.now();
    for (const [id, seen] of this.peerTabs.entries()) {
      if (now - seen > 180_000) this.peerTabs.delete(id);
    }

    // Only dispatch away beacon if this is the LAST active tab for this user
    if (this.peerTabs.size === 0) {
      const payload: UserPresenceState = {
        userId: this.currentUserId,
        status: 'away',
        lastHeartbeat: new Date().toISOString(),
        ttlExpiry: Math.floor(Date.now() / 1000),
      };
      try {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/presence', blob);
      } catch {}
    }
  };

  public sendHeartbeat(force = false): void {
    if (!this.currentUserId) return;
    const now = Date.now();

    // Prevent burst writes (max 1 write per 5 seconds unless force)
    if (!force && now - this.lastHeartbeatTime < 5000) return;
    this.lastHeartbeatTime = now;

    const ttlExpiry = Math.floor(now / 1000) + PRESENCE_TTL_SECONDS;
    const presence: UserPresenceState = {
      userId: this.currentUserId,
      status: this.currentStatus,
      lastHeartbeat: new Date(now).toISOString(),
      ttlExpiry,
      deviceType: typeof window !== 'undefined' && window.innerWidth < 768 ? 'mobile' : 'desktop',
    };

    // 1. Update in-memory local cache
    localPresenceCache.set(this.currentUserId, presence);

    // 2. Synchronize to Server via /api/presence
    if (typeof window !== 'undefined') {
      fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(presence),
        keepalive: true,
      }).catch(() => {});
    }
  }

  public async getContactPresence(userId: string): Promise<PresenceStatus> {
    // 1. Check client local cache
    const presence = localPresenceCache.get(userId);
    if (presence?.status) return presence.status;

    // 2. Fallback to /api/presence
    if (typeof window !== 'undefined') {
      try {
        const res = await fetch(`/api/presence?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.presence?.status) {
            localPresenceCache.set(userId, data.presence);
            return data.presence.status;
          }
        }
      } catch {}
    }

    return 'away';
  }
}

export const presenceService = new PresenceService();
