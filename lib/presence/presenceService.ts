/**
 * lib/presence/presenceService.ts
 * Real-time 3-state presence service with tab visibility listener,
 * heartbeat throttling, and automatic 5-minute TTL expiration.
 */

import { PresenceStatus, UserPresenceState } from '@/lib/types';
import { updateUserPresenceInDB, getUserPresenceFromDB } from '@/lib/firebase/firestore';

const HEARTBEAT_INTERVAL_MS = 90_000; // 90 seconds throttled heartbeat
const PRESENCE_TTL_SECONDS = 300;     // 5 minutes TTL

class PresenceService {
  private currentUserId: string | null = null;
  private currentStatus: PresenceStatus = 'active';
  private manualPreference: 'active' | 'away' | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatTime = 0;
  private listeners: Set<(status: PresenceStatus) => void> = new Set();

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

    // Broadcast initial state
    this.sendHeartbeat(true);
    this.notifyListeners(this.currentStatus);

    // Listen for tab focus / background visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('focus', this.handleFocus);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('beforeunload', this.handleUnload);

    // Throttled heartbeat loop
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
  }

  public cleanup(): void {
    if (typeof window === 'undefined') return;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('beforeunload', this.handleUnload);

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
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

  private handleVisibilityChange = () => {
    if (this.manualPreference) return;
    const nextStatus: PresenceStatus = document.visibilityState === 'visible' ? 'active' : 'idle';
    if (nextStatus !== this.currentStatus) {
      this.currentStatus = nextStatus;
      this.sendHeartbeat();
      this.notifyListeners(nextStatus);
    }
  };

  private handleFocus = () => {
    if (this.manualPreference) return;
    if (this.currentStatus !== 'active') {
      this.currentStatus = 'active';
      this.sendHeartbeat();
      this.notifyListeners('active');
    }
  };

  private handleBlur = () => {
    if (this.manualPreference) return;
    if (this.currentStatus === 'active') {
      this.currentStatus = 'idle';
      this.sendHeartbeat();
      this.notifyListeners('idle');
    }
  };

  private handleUnload = () => {
    if (!this.currentUserId) return;
    // Mark as away on window close
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

    updateUserPresenceInDB(presence).catch(() => {});
  }

  public async getContactPresence(userId: string): Promise<PresenceStatus> {
    const presence = await getUserPresenceFromDB(userId);
    if (!presence) return 'away';
    return presence.status;
  }
}

export const presenceService = new PresenceService();
